import { apiClient } from './apiClient';

export interface BillingMetrics {
  mrr: number;
  arr: number;
  activeTenants: number;
  churnRate: number;
}

export interface SubscriptionInvoice {
  id: string;
  invoiceNumber: string;
  tier: 'FREE' | 'GROWTH' | 'ENTERPRISE';
  amount: string | number;
  status: 'PENDING' | 'PAID' | 'FAILED' | 'EXPIRED';
  paidAt: string | null;
  createdAt: string;
  tenant: {
    id: string;
    name: string;
    email: string;
  };
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export async function getBillingMetricsApi(): Promise<BillingMetrics> {
  const response = await apiClient.get<ApiResponse<BillingMetrics>>('/api/platform/billing/metrics');
  return response.data.data;
}

export async function listInvoicesApi(page = 1, limit = 20): Promise<ApiResponse<SubscriptionInvoice[]>> {
  const response = await apiClient.get<ApiResponse<SubscriptionInvoice[]>>(`/api/platform/billing/invoices?page=${page}&limit=${limit}`);
  return response.data;
}

export interface OverridePayload {
  tier: 'FREE' | 'GROWTH' | 'ENTERPRISE';
  expiresAt: string | null;
  note: string;
}

export async function overrideSubscriptionApi(tenantId: string, payload: OverridePayload): Promise<void> {
  await apiClient.patch(`/api/platform/tenants/${tenantId}/subscription`, payload);
}

export interface MidtransTransactionDetail {
  transaction_status: string;
  status_code?: string;
  status_message?: string;
  payment_type?: string;
  transaction_time?: string;
  gross_amount?: string;
  bank?: string;
  va_numbers?: { bank: string; va_number: string }[];
  biller_code?: string;
  bill_key?: string;
  fraud_status?: string;
  currency?: string;
  order_id?: string;
}

export async function getMidtransDetailApi(invoiceNumber: string): Promise<MidtransTransactionDetail> {
  const response = await apiClient.get<ApiResponse<MidtransTransactionDetail>>(`/api/platform/billing/invoices/${invoiceNumber}/midtrans`);
  return response.data.data;
}
