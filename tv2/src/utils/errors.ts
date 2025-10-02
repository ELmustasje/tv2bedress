export function isAbortError(error: unknown): boolean {
  if (!error) {
    return false
  }

  return error instanceof DOMException
    ? error.name === 'AbortError'
    : typeof error === 'object' && 'name' in error && (error as { name?: string }).name === 'AbortError'
}
