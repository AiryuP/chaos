export interface AppError {
  message: string
  code?: string
  detail?: string
}

export function toAppError(error: unknown, fallbackMessage = 'Unexpected application error'): AppError {
  if (error instanceof Error) {
    return {
      message: error.message || fallbackMessage,
      code: error.name,
      detail: error.stack
    }
  }

  if (typeof error === 'string' && error.length > 0) {
    return {
      message: error
    }
  }

  return {
    message: fallbackMessage
  }
}
