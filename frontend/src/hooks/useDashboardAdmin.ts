import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, hasTenantWideOutletAccess } from '../store/useAuthStore';
import { fetchDashboardData } from '../api/dashboardAdminApi';
import {
  buildTypeBreakdownChartData,
  calculateProfitMargin,
} from '../utils/dashboardAdminHelpers';
import type {
  BestSellerProduct,
  BreakdownData,
  CashierReport,
  DashboardTab,
  LowStockSummary,
  ShiftReport,
  SummaryData,
  TrendData,
  TypeBreakdownChartRow,
} from '../types/dashboardAdmin';

export function useDashboardAdmin() {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuthStore();
  const activeOutletId = useAuthStore((state) => state.activeOutletId);
  const tenantId = user?.tenantId;
  const tenantWideAccess = user ? hasTenantWideOutletAccess(user.roles) : false;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [bestSellers, setBestSellers] = useState<BestSellerProduct[]>([]);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [breakdown, setBreakdown] = useState<BreakdownData | null>(null);
  const [lowStock, setLowStock] = useState<LowStockSummary | null>(null);
  const [activeTab, setActiveTab] = useState<DashboardTab>('OVERVIEW');
  const [cashierReports, setCashierReports] = useState<CashierReport[]>([]);
  const [shiftReports, setShiftReports] = useState<ShiftReport[]>([]);

  const fetchData = useCallback(async () => {
    if (!isAuthenticated || !tenantId) return;

    setLoading(true);
    setError(null);

    const { activeOutletId: scopeOutletId } = useAuthStore.getState();
    const shouldFetchBreakdown = tenantWideAccess && !scopeOutletId;

    try {
      const data = await fetchDashboardData(shouldFetchBreakdown);

      setSummary(data.summary);
      setBestSellers(data.bestSellers);
      setTrendData(data.trendData);
      setCashierReports(data.cashierReports);
      setShiftReports(data.shiftReports);
      setLowStock(data.lowStock);
      setBreakdown(data.breakdown);
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : 'Terjadi kesalahan sistem.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, tenantId, tenantWideAccess]);

  useEffect(() => {
    void (async () => {
      await Promise.resolve();
      await fetchData();
    })();
  }, [fetchData, activeOutletId]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const todayMargin = calculateProfitMargin(summary?.revenueToday ?? 0, summary?.profitToday ?? 0);
  const monthMargin = calculateProfitMargin(summary?.revenueMonth ?? 0, summary?.profitMonth ?? 0);

  const typeBreakdownChartData: TypeBreakdownChartRow[] = useMemo(
    () => buildTypeBreakdownChartData(breakdown),
    [breakdown]
  );

  return {
    user,
    tenantWideAccess,
    activeOutletId,
    loading,
    error,
    summary,
    bestSellers,
    trendData,
    breakdown,
    lowStock,
    activeTab,
    setActiveTab,
    cashierReports,
    shiftReports,
    fetchData,
    handleLogout,
    todayMargin,
    monthMargin,
    typeBreakdownChartData,
  };
}

export type UseDashboardAdminReturn = ReturnType<typeof useDashboardAdmin>;
