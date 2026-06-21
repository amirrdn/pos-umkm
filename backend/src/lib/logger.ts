/**
 * Safe error logging helper.
 * Logs only the error message in production, and includes the stack trace in dev/test.
 */
export function logError(context: string, error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  const isDevOrTest = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test' || !process.env.NODE_ENV;

  if (isDevOrTest && error instanceof Error && error.stack) {
    console.error(`[${context}] Error: ${message}`, error.stack);
  } else {
    console.error(`[${context}] Error: ${message}`);
  }
}
