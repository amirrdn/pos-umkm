/** Standar error dari apiClient — membungkus response backend Axios. */
export class ApiError extends Error {
  readonly status?: number;
  readonly data?: Record<string, unknown>;
  readonly code?: string;

  constructor(message: string, options?: { status?: number; data?: Record<string, unknown> }) {
    super(message);
    this.name = 'ApiError';
    this.status = options?.status;
    this.data = options?.data;
    const rawCode = options?.data?.code;
    if (typeof rawCode === 'string') {
      this.code = rawCode;
    }
  }
}

export function isApiError(err: unknown): err is ApiError {
  return err instanceof ApiError;
}

export interface ApiSuccessResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}
