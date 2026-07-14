param(
  [string]$Branch = 'develop'
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
Get-Command node -ErrorAction Stop | Out-Null
Get-Command pnpm -ErrorAction Stop | Out-Null

$localStatus = @(Get-CheckedOutput 'git' @('status', '--porcelain=v1', '--untracked-files=all'))

if ($localStatus.Count -gt 0) {
  throw 'Local working tree is not clean. Resolve or preserve local changes before handoff-in.'
}

Invoke-CheckedCommand 'git' @('fetch', 'origin', '--prune')

& git show-ref --verify --quiet "refs/remotes/origin/$Branch"

if ($LASTEXITCODE -ne 0) {
  throw "Remote branch origin/$Branch does not exist. Complete handoff-out on the other computer first."
}

& git show-ref --verify --quiet "refs/heads/$Branch"
$hasLocalBranch = $LASTEXITCODE -eq 0

if ($hasLocalBranch) {
  Invoke-CheckedCommand 'git' @('switch', $Branch)
} else {
  Invoke-CheckedCommand 'git' @('switch', '--track', '-c', $Branch, "origin/$Branch")
}

Invoke-CheckedCommand 'git' @('pull', '--ff-only', 'origin', $Branch)

$localHead = (Get-CheckedOutput 'git' @('rev-parse', 'HEAD')).Trim()
$remoteHead = (Get-CheckedOutput 'git' @('rev-parse', "origin/$Branch")).Trim()

if ($localHead -ne $remoteHead) {
  throw "Local HEAD does not match origin/$Branch after pull."
}

Invoke-CheckedCommand 'pnpm' @('install', '--frozen-lockfile')
Invoke-CheckedCommand 'pnpm' @('native:electron')

$nodeVersion = (Get-CheckedOutput 'node' @('--version')).Trim()
$pnpmVersion = (Get-CheckedOutput 'pnpm' @('--version')).Trim()

Write-Host ''
Write-Host 'handoff-in completed.' -ForegroundColor Green
Write-Host "Branch: $Branch"
Write-Host "Commit: $localHead"
Write-Host "Node: $nodeVersion"
Write-Host "pnpm: $pnpmVersion"
Write-Host 'Read AGENTS.md, docs/HANDOFF.md, docs/PROGRESS.md, and the current milestone before editing.'
Write-Host 'The development server was not started or restarted.'
