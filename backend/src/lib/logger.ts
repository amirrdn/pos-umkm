/**
 * Centralized logging — satu-satunya modul yang boleh memanggil console.* di runtime.
 * Production: hanya pesan ringkas, tanpa dump objek/stack sensitif.
 */

const isDevOrTest =
  process.env.NODE_ENV === 'development' ||
  process.env.NODE_ENV === 'test' ||
  !process.env.NODE_ENV;

function formatMessage(context: string, message: string): string {
  return `[${context}] ${message}`;
}

export function logError(context: string, error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);
  if (isDevOrTest && error instanceof Error && error.stack) {
    console.error(formatMessage(context, `Error: ${message}`), error.stack);
  } else {
    console.error(formatMessage(context, `Error: ${message}`));
  }
}

export function logWarn(context: string, message: string): void {
  console.warn(formatMessage(context, message));
}

export function logInfo(context: string, message: string): void {
  console.info(formatMessage(context, message));
}

/** Structured log — hanya nilai primitif, tanpa dump objek mentah. */
export function logEvent(
  context: string,
  event: string,
  details?: Record<string, string | number | boolean | null>
): void {
  console.info(JSON.stringify({ context, event, ...details }));
}
