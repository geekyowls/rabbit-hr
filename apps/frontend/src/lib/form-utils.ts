export function getNumberFieldError(
  error: { message?: string } | undefined,
  fallbackMessage: string,
): string | undefined {
  if (!error?.message || typeof error.message !== 'string') return undefined;
  if (error.message.toLowerCase().includes('invalid input: expected number')) {
    return fallbackMessage;
  }
  return error.message;
}
