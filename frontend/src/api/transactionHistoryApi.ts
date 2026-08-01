import { apiClient } from './apiClient';
import type { TransactionRecord } from '../types/transactionHistory';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface GetTransactionHistoryApiParams {
  search?: string;
  status?: string;
  paymentMethod?: string;
  dateRange?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  page?: number;
}

export async function getTransactionHistoryApi(
  params?: GetTransactionHistoryApiParams
): Promise<TransactionRecord[]> {
  const response = await apiClient.get<ApiResponse<TransactionRecord[]>>('/api/transactions/history', {
    params,
  });
  return response.data.data || [];
}

export async function getTransactionStatusApi(
  invoiceNumber: string
): Promise<{ status: string } | null> {
  const response = await apiClient.get<ApiResponse<{ status: string }>>(
    `/api/transactions/status/${invoiceNumber}`
  );
  return response.data.data ?? null;
}
