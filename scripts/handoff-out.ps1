param(
  [switch]$RunE2E
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
Set-Location $repoRoot

function Invoke-CheckedCommand {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Command,

    [Parameter(Mandatory = $true)]
    [string[]]$Arguments
  )

  & $Command @Arguments

  if ($LASTEXITCODE -ne 0) {
    throw "Command failed with exit code ${LASTEXITCODE}: $Command $($Arguments -join ' ')"
  }
}

function Get-CheckedOutput {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Command,

    [Parameter(Mandatory = $true)]
    [string[]]$Arguments
  )

  $output = & $Command @Arguments

  if ($LASTEXITCODE -ne 0) {
    throw "Command failed with exit code ${LASTEXITCODE}: $Command $($Arguments -join ' ')"
  }

  return $output
}

Get-Command git -ErrorAction Stop | Out-Null
Get-Command pnpm -ErrorAction Stop | Out-Null

$branch = (Get-CheckedOutput 'git' @('branch', '--show-current')).Trim()

if ($branch -ne 'develop') {
  throw "handoff-out must run on develop. Current branch: $branch"
}

& git rev-parse --quiet --verify MERGE_HEAD *> $null

if ($LASTEXITCODE -eq 0) {
  throw 'A merge is in progress. Resolve or abort it before handoff-out.'
}

$statusLines = @(Get-CheckedOutput 'git' @('status', '--porcelain=v1', '--untracked-files=all'))
$changedPaths = @(
  $statusLines |
    Where-Object { $_.Length -gt 3 } |
    ForEach-Object { $_.Substring(3).Trim('"') }
)

$blockedPaths = @(
  $changedPaths | Where-Object {
    $_ -match '(^|/)(node_modules|\.pnpm-store|out|dist|release|coverage|test-results|playwright-report)(/|$)' -or
    $_ -match '(^|/)\.moqi(/|$)' -or
    $_ -match 'project\.sqlite($|-wal$|-shm$)' -or
    ($_ -match '(^|/)\.env($|\.)' -and $_ -notmatch '(^|/)\.env\.example$')
  }
)

if ($blockedPaths.Count -gt 0) {
  throw "Refusing handoff because blocked files are present:`n$($blockedPaths -join [Environment]::NewLine)"
}

if ($changedPaths.Count -gt 0 -and $changedPaths -notcontains 'docs/HANDOFF.md') {
  throw 'docs/HANDOFF.md must be updated before handoff-out.'
}

Invoke-CheckedCommand 'git' @('diff', '--check')
Invoke-CheckedCommand 'git' @('diff', '--cached', '--check')
Invoke-CheckedCommand 'pnpm' @('lint')
Invoke-CheckedCommand 'pnpm' @('typecheck')
Invoke-CheckedCommand 'pnpm' @('test')
Invoke-CheckedCommand 'pnpm' @('build')

if ($RunE2E) {
  Invoke-CheckedCommand 'pnpm' @('test:e2e')
}

Write-Host ''
Write-Host 'handoff-out preparation passed.' -ForegroundColor Green
Write-Host 'Next: review the diff, stage intended files, commit, push develop, and verify local HEAD equals origin/develop.'
