import { apiClient } from './apiClient';
import type {
  SummaryData,
  BestSellerProduct,
  TrendData,
  BreakdownData,
  LowStockSummary,
  CashierReport,
  ShiftReport,
  DashboardData,
} from '../types/dashboardAdmin';

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export async function getAnalyticsSummaryApi(): Promise<SummaryData> {
  const response = await apiClient.get<ApiResponse<SummaryData>>('/api/analytics/summary');
  return response.data.data;
}

export async function getBestSellersApi(): Promise<BestSellerProduct[]> {
  const response = await apiClient.get<ApiResponse<BestSellerProduct[]>>('/api/analytics/best-sellers');
  return response.data.data;
}

export async function getTrendApi(): Promise<TrendData[]> {
  const response = await apiClient.get<ApiResponse<TrendData[]>>('/api/analytics/trend');
  return response.data.data;
}

export async function getCashierReportsApi(): Promise<CashierReport[]> {
  const response = await apiClient.get<ApiResponse<CashierReport[]>>('/api/analytics/cashiers');
  return response.data.data;
}

export async function getShiftReportsApi(): Promise<ShiftReport[]> {
  const response = await apiClient.get<ApiResponse<ShiftReport[]>>('/api/analytics/shifts');
  return response.data.data;
}

export async function getLowStockSummaryApi(): Promise<LowStockSummary> {
  const response = await apiClient.get<ApiResponse<LowStockSummary>>('/api/inventory/low-stock');
  return response.data.data;
}

export async function getAnalyticsBreakdownApi(): Promise<BreakdownData> {
  const response = await apiClient.get<ApiResponse<BreakdownData>>('/api/analytics/breakdown');
  return response.data.data;
}

export async function fetchDashboardData(fetchBreakdown: boolean): Promise<DashboardData> {
  const [summary, bestSellers, trendData, cashierReports, shiftReports, lowStock] = await Promise.all([
    getAnalyticsSummaryApi(),
    getBestSellersApi(),
    getTrendApi(),
    getCashierReportsApi(),
    getShiftReportsApi(),
    getLowStockSummaryApi(),
  ]);

  const breakdown = fetchBreakdown ? await getAnalyticsBreakdownApi() : null;

  return {
    summary,
    bestSellers,
    trendData,
    cashierReports,
    shiftReports,
    lowStock,
    breakdown,
  };
}
