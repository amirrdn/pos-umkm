import { getMidtransServerKey } from './midtransConfig';

export class MidtransApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'MidtransApiError';
    this.status = status;
  }
}

function buildAuthHeader(): string {
  const serverKey = getMidtransServerKey();
  return Buffer.from(`${serverKey}:`).toString('base64');
}

interface MidtransErrorBody {
  message?: string;
}

/**
 * HTTP helper tunggal untuk Midtrans Core API & Snap API.
 */
export async function midtransRequest<T>(
  baseUrl: string,
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    Authorization: `Basic ${buildAuthHeader()}`,
  };

  if (init.body) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      ...headers,
      ...(init.headers as Record<string, string> | undefined),
    },
  });

  const data = (await response.json()) as T & MidtransErrorBody;

  if (!response.ok) {
    throw new MidtransApiError(
      data.message || `Midtrans request failed (${response.status})`,
      response.status
    );
  }

  return data;
}
