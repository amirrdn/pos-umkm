import { apiClient } from './apiClient';
import type { TransactionRecord } from '../types/transactionHistory';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export async function getTransactionHistoryApi(): Promise<TransactionRecord[]> {
  const response = await apiClient.get<ApiResponse<TransactionRecord[]>>('/api/transactions/history');
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
