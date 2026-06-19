import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, hasTenantWideOutletAccess } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';
import { API_BASE_URL } from '../config';
import { buildApiHeaders } from '../utils/apiHeaders';
import { AppShellHeader } from './AppShellHeader';
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Store,
  Package,
  RefreshCw,
  Award,
  BarChart2,
  Users,
  LineChart as LineChartIcon,
  Percent,
  ShieldCheck,
  TrendingDown,
  AlertCircle,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  AreaChart,
  Area,
  Legend
} from 'recharts';

interface SummaryData {
  revenueToday: number;
  revenueMonth: number;
  transactionsTodayCount: number;
  profitToday: number;
  profitMonth: number;
}

interface BestSellerProduct {
  productId: string;
  name: string;
  sku: string;
  totalQuantity: number;
}

interface TrendData {
  date: string;
  revenue: number;
  profit: number;
}

interface TypeBreakdownRow {
  revenueToday: number;
  revenueMonth: number;
  profitToday: number;
  profitMonth: number;
  transactionsToday: number;
  outletCount: number;
}

interface BreakdownData {
  byType: {
    MAIN: TypeBreakdownRow;
    BRANCH: TypeBreakdownRow;
  };
}

interface LowStockSummary {
  count: number;
  items: Array<{
    productId: string;
    productName: string;
    sku: string;
    outletId: string;
    outletName: string;
    stock: number;
    minStock: number;
  }>;
}

const COLORS = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ec4899'];

export default function DashboardAdmin() {
  const navigate = useNavigate();
  const { token, user, logout } = useAuthStore();
  const activeOutletId = useAuthStore((state) => state.activeOutletId);
  const tenantId = user?.tenantId;
  const tenantWideAccess = user ? hasTenantWideOutletAccess(user.roles) : false;
  const { theme } = useThemeStore();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [bestSellers, setBestSellers] = useState<BestSellerProduct[]>([]);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [breakdown, setBreakdown] = useState<BreakdownData | null>(null);
  const [lowStock, setLowStock] = useState<LowStockSummary | null>(null);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'CASHIERS_SHIFTS'>('OVERVIEW');
  const [cashierReports, setCashierReports] = useState<any[]>([]);
  const [shiftReports, setShiftReports] = useState<any[]>([]);

  const fetchData = async () => {
    if (!token || !tenantId) return;
    setLoading(true);
    setError(null);
    const headers = buildApiHeaders();
    const { activeOutletId: scopeOutletId } = useAuthStore.getState();
    const fetchBreakdown = tenantWideAccess && !scopeOutletId;

    try {
      const requests: Promise<Response>[] = [
        fetch(`${API_BASE_URL}/api/analytics/summary`, { headers }),
        fetch(`${API_BASE_URL}/api/analytics/best-sellers`, { headers }),
        fetch(`${API_BASE_URL}/api/analytics/trend`, { headers }),
        fetch(`${API_BASE_URL}/api/analytics/cashiers`, { headers }),
        fetch(`${API_BASE_URL}/api/analytics/shifts`, { headers }),
        fetch(`${API_BASE_URL}/api/inventory/low-stock`, { headers }),
      ];

      const [
        summaryRes,
        bestSellersRes,
        trendRes,
        cashiersRes,
        shiftsRes,
        lowStockRes,
      ] = await Promise.all(requests);

      let breakdownRes: Response | undefined;
      if (fetchBreakdown) {
        breakdownRes = await fetch(`${API_BASE_URL}/api/analytics/breakdown`, { headers });
      }

      if (!summaryRes.ok) throw new Error('Gagal mengambil data ringkasan analitik.');
      if (!bestSellersRes.ok) throw new Error('Gagal mengambil data produk terlaris.');
      if (!trendRes.ok) throw new Error('Gagal mengambil data tren penjualan.');
      if (!cashiersRes.ok) throw new Error('Gagal mengambil data laporan kasir.');
      if (!shiftsRes.ok) throw new Error('Gagal mengambil data laporan shift.');
      if (!lowStockRes.ok) throw new Error('Gagal mengambil data stok rendah.');
      if (fetchBreakdown && breakdownRes && !breakdownRes.ok) {
        throw new Error('Gagal mengambil data breakdown outlet.');
      }

      const [summaryJson, bestSellersJson, trendJson, cashiersJson, shiftsJson, lowStockJson] =
        await Promise.all([
          summaryRes.json(),
          bestSellersRes.json(),
          trendRes.json(),
          cashiersRes.json(),
          shiftsRes.json(),
          lowStockRes.json(),
        ]);

      setSummary(summaryJson.data);
      setBestSellers(bestSellersJson.data);
      setTrendData(trendJson.data);
      setCashierReports(cashiersJson.data);
      setShiftReports(shiftsJson.data);
      setLowStock(lowStockJson.data);

      if (fetchBreakdown && breakdownRes) {
        const breakdownJson = await breakdownRes.json();
        setBreakdown(breakdownJson.data);
      } else {
        setBreakdown(null);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token, tenantId, activeOutletId]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const formatRupiah = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value);
  };

  const todayMargin = summary?.revenueToday
    ? Math.round((summary.profitToday / summary.revenueToday) * 100)
    : 0;
  const monthMargin = summary?.revenueMonth
    ? Math.round((summary.profitMonth / summary.revenueMonth) * 100)
    : 0;

  const typeBreakdownChartData = useMemo(() => {
    if (!breakdown) return [];
    return [
      {
        label: 'Toko Pusat (MAIN)',
        omset: breakdown.byType.MAIN.revenueMonth,
        laba: breakdown.byType.MAIN.profitMonth,
      },
      {
        label: `Cabang (${breakdown.byType.BRANCH.outletCount} outlet)`,
        omset: breakdown.byType.BRANCH.revenueMonth,
        laba: breakdown.byType.BRANCH.profitMonth,
      },
    ];
  }, [breakdown]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans transition-colors duration-150">
      <AppShellHeader
        title="Dashboard & Laporan"
        subtitle="Analitik kinerja & laba tenant"
        icon={BarChart2}
        accent="indigo"
        user={user}
        onLogout={handleLogout}
        showOutletSwitcher={tenantWideAccess}
        outletSwitcherAllowAll
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Banner Selamat Datang */}
        <div className="mb-8 p-6 bg-gradient-to-r from-indigo-900/10 via-slate-100 to-slate-50 dark:from-indigo-950/40 dark:via-slate-900/40 dark:to-slate-900/20 border border-slate-200 dark:border-slate-800/80 rounded-3xl shadow-sm dark:shadow-none flex flex-col md:flex-row justify-between items-start md:items-center gap-4 backdrop-blur-sm">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white mb-1">
              Ringkasan Kinerja & Laba Toko
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Analisis pendapatan, harga pokok penjualan (HPP), dan laba bersih secara real-time.
              {activeOutletId
                ? ' — Data difilter per outlet yang dipilih.'
                : tenantWideAccess
                  ? ' — Menampilkan agregat semua outlet.'
                  : ''}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
            onClick={fetchData}
            disabled={loading}
            className="cursor-pointer flex items-center gap-2 px-4 py-2.5 text-xs font-semibold bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-xl transition-all shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Segarkan Laporan</span>
          </button>
          </div>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 rounded-2xl text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 mb-8 gap-6">
          <button
            onClick={() => setActiveTab('OVERVIEW')}
            className={`cursor-pointer pb-4 text-sm font-bold border-b-2 transition-all ${
              activeTab === 'OVERVIEW'
                ? 'border-indigo-600 text-indigo-650 dark:border-indigo-400 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-350'
            }`}
          >
            Ringkasan & Tren Penjualan
          </button>
          <button
            onClick={() => setActiveTab('CASHIERS_SHIFTS')}
            className={`cursor-pointer pb-4 text-sm font-bold border-b-2 transition-all ${
              activeTab === 'CASHIERS_SHIFTS'
                ? 'border-indigo-600 text-indigo-650 dark:border-indigo-400 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-350'
            }`}
          >
            Laporan Kasir & Shift Kerja
          </button>
        </div>

        {activeTab === 'OVERVIEW' && (
          <>
            {/* 5 Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          {/* Card 1: Omset Hari Ini */}
          <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm dark:shadow-lg relative overflow-hidden transition-transform hover:-translate-y-0.5 duration-150">
            <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/5 rounded-bl-full pointer-events-none" />
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Omset Hari Ini</span>
              <div className="p-2 bg-indigo-500/10 text-indigo-600 dark:text-indigo-405 rounded-xl border border-indigo-500/20">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            {loading ? (
              <div className="h-7 w-32 bg-slate-200 dark:bg-slate-850 animate-pulse rounded-lg" />
            ) : (
              <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight font-mono">
                {formatRupiah(summary?.revenueToday || 0)}
              </h3>
            )}
            <p className="text-[10px] text-indigo-600 dark:text-indigo-405 mt-2 flex items-center gap-1 font-semibold">
              <span>{summary?.transactionsTodayCount || 0} Transaksi Berhasil</span>
            </p>
          </div>

          {/* Card 2: Laba Bersih Hari Ini */}
          <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm dark:shadow-lg relative overflow-hidden transition-transform hover:-translate-y-0.5 duration-150">
            <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 rounded-bl-full pointer-events-none" />
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Laba Bersih Hari Ini</span>
              <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-500/20">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            {loading ? (
              <div className="h-7 w-32 bg-slate-200 dark:bg-slate-850 animate-pulse rounded-lg" />
            ) : (
              <h3 className="text-xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight font-mono">
                {formatRupiah(summary?.profitToday || 0)}
              </h3>
            )}
            <p className={`text-[10px] mt-2 flex items-center gap-1 font-semibold ${todayMargin >= 10 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`}>
              <Percent className="w-3 h-3" />
              <span>Margin Keuntungan: {todayMargin}%</span>
            </p>
          </div>

          {/* Card 3: Omset Bulan Ini */}
          <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm dark:shadow-lg relative overflow-hidden transition-transform hover:-translate-y-0.5 duration-150">
            <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/5 rounded-bl-full pointer-events-none" />
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Omset Bulan Ini</span>
              <div className="p-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl border border-blue-500/20">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            {loading ? (
              <div className="h-7 w-40 bg-slate-200 dark:bg-slate-850 animate-pulse rounded-lg" />
            ) : (
              <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight font-mono">
                {formatRupiah(summary?.revenueMonth || 0)}
              </h3>
            )}
            <p className="text-[10px] text-blue-600 dark:text-blue-400 mt-2 font-semibold">
              <span>Periode Bulan Berjalan</span>
            </p>
          </div>

          {/* Card 4: Laba Bersih Bulan Ini */}
          <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm dark:shadow-lg relative overflow-hidden transition-transform hover:-translate-y-0.5 duration-150">
            <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 rounded-bl-full pointer-events-none" />
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Laba Bersih Bulan Ini</span>
              <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-500/20">
                <Award className="w-4 h-4" />
              </div>
            </div>
            {loading ? (
              <div className="h-7 w-40 bg-slate-200 dark:bg-slate-850 animate-pulse rounded-lg" />
            ) : (
              <h3 className="text-xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight font-mono">
                {formatRupiah(summary?.profitMonth || 0)}
              </h3>
            )}
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-2 flex items-center gap-1 font-semibold">
              <Percent className="w-3 h-3" />
              <span>Margin Keuntungan: {monthMargin}%</span>
            </p>
          </div>

          {/* Card 5: Produk Stok Rendah */}
          <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm dark:shadow-lg relative overflow-hidden transition-transform hover:-translate-y-0.5 duration-150">
            <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/5 rounded-bl-full pointer-events-none" />
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Stok Rendah</span>
              <div className="p-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl border border-amber-500/20">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            {loading ? (
              <div className="h-7 w-16 bg-slate-200 dark:bg-slate-850 animate-pulse rounded-lg" />
            ) : (
              <h3 className="text-xl font-black text-amber-600 dark:text-amber-400 tracking-tight font-mono">
                {lowStock?.count ?? 0}
              </h3>
            )}
            <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-2 font-semibold">
              {activeOutletId
                ? 'Produk di bawah min. stok outlet ini'
                : 'Produk di bawah min. stok (semua outlet)'}
            </p>
          </div>
        </div>

        {/* Tren Pendapatan vs Laba Bersih (Grafik Line Chart 30 hari) */}
        <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm dark:shadow-lg mb-8 backdrop-blur-sm">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
            <LineChartIcon className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
            Grafik Tren Penjualan & Laba Bersih (30 Hari Terakhir)
          </h3>

          {loading ? (
            <div className="h-80 w-full bg-slate-100 dark:bg-slate-900/20 animate-pulse rounded-2xl flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
          ) : trendData.length === 0 ? (
            <div className="h-80 w-full border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center text-slate-500">
              <TrendingDown className="w-10 h-10 mb-2 opacity-40" />
              <p className="text-xs">Belum ada transaksi terekam selama 30 hari terakhir.</p>
            </div>
          ) : (
            <div className="h-80 w-full min-w-0">
              <ResponsiveContainer width="100%" height={320} minWidth={0}>
                <AreaChart
                  data={trendData}
                  margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme === 'light' ? '#e2e8f0' : '#334155'} opacity={0.2} />
                  <XAxis
                    dataKey="date"
                    stroke={theme === 'light' ? '#475569' : '#94a3b8'}
                    fontSize={10}
                    tickLine={false}
                    tickFormatter={(date) => date.split('-')[2] + '/' + date.split('-')[1]}
                  />
                  <YAxis
                    stroke={theme === 'light' ? '#475569' : '#94a3b8'}
                    fontSize={10}
                    tickLine={false}
                    tickFormatter={(val) => 'Rp ' + (val >= 1000000 ? (val / 1000000).toFixed(1) + 'jt' : (val / 1000).toFixed(0) + 'k')}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: theme === 'light' ? '#ffffff' : '#0f172a',
                      borderColor: theme === 'light' ? '#e2e8f0' : '#1e293b',
                      borderRadius: '1rem',
                      color: theme === 'light' ? '#0f172a' : '#f8fafc',
                      fontSize: '11px',
                      fontFamily: 'monospace'
                    }}
                    formatter={(value: any) => [formatRupiah(value), '']}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 'semibold' }} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    name="Omset Penjualan"
                    stroke="#6366f1"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                  <Area
                    type="monotone"
                    dataKey="profit"
                    name="Laba Bersih"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorProfit)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Breakdown MAIN vs BRANCH — hanya mode Semua Outlet */}
        {tenantWideAccess && !activeOutletId && (
          <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm dark:shadow-lg mb-8 backdrop-blur-sm">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2 flex items-center gap-2">
              <Store className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
              Perbandingan MAIN vs Cabang (Bulan Ini)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
              Omset dan laba bersih agregat toko pusat dibandingkan seluruh cabang.
            </p>

            {loading ? (
              <div className="h-64 w-full bg-slate-100 dark:bg-slate-900/20 animate-pulse rounded-2xl flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
              </div>
            ) : !breakdown || typeBreakdownChartData.every((row) => row.omset === 0 && row.laba === 0) ? (
              <div className="h-64 w-full border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center text-slate-500">
                <BarChart2 className="w-10 h-10 mb-2 opacity-40" />
                <p className="text-xs">Belum ada data penjualan untuk perbandingan outlet.</p>
              </div>
            ) : (
              <div className="h-64 w-full min-w-0">
                <ResponsiveContainer width="100%" height={256} minWidth={0}>
                  <BarChart data={typeBreakdownChartData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme === 'light' ? '#e2e8f0' : '#334155'} opacity={0.2} />
                    <XAxis
                      dataKey="label"
                      stroke={theme === 'light' ? '#475569' : '#94a3b8'}
                      fontSize={10}
                      tickLine={false}
                    />
                    <YAxis
                      stroke={theme === 'light' ? '#475569' : '#94a3b8'}
                      fontSize={10}
                      tickLine={false}
                      tickFormatter={(val) =>
                        'Rp ' + (val >= 1000000 ? (val / 1000000).toFixed(1) + 'jt' : (val / 1000).toFixed(0) + 'k')
                      }
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: theme === 'light' ? '#ffffff' : '#0f172a',
                        borderColor: theme === 'light' ? '#e2e8f0' : '#1e293b',
                        borderRadius: '0.75rem',
                        color: theme === 'light' ? '#0f172a' : '#f8fafc',
                        fontSize: '11px',
                        fontFamily: 'monospace',
                      }}
                      formatter={(value) => [formatRupiah(Number(value ?? 0)), '']}
                    />
                    <Legend verticalAlign="top" height={28} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                    <Bar dataKey="omset" name="Omset Bulan Ini" fill="#6366f1" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="laba" name="Laba Bulan Ini" fill="#10b981" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}

        {/* Bottom Section: Charts & Table */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Bar Chart 5 Produk Terlaris */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm dark:shadow-lg backdrop-blur-sm">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-250 mb-6 flex items-center gap-2 uppercase tracking-wider">
              <Award className="w-5 h-5 text-amber-500" />
              Visualisasi 5 Produk Terlaris (Kuantitas)
            </h3>

            {loading ? (
              <div className="h-80 w-full bg-slate-100 dark:bg-slate-900/10 animate-pulse rounded-2xl flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
              </div>
            ) : bestSellers.length === 0 ? (
              <div className="h-80 w-full border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center text-slate-500">
                <ShoppingCart className="w-10 h-10 mb-2 opacity-40" />
                <p className="text-xs">Belum ada data transaksi penjualan terkumpul.</p>
              </div>
            ) : (
              <div className="h-80 w-full min-w-0">
                <ResponsiveContainer width="100%" height={320} minWidth={0}>
                  <BarChart
                    data={bestSellers}
                    margin={{ top: 20, right: 10, left: -20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={theme === 'light' ? '#e2e8f0' : '#334155'} opacity={0.2} />
                    <XAxis
                      dataKey="name"
                      stroke={theme === 'light' ? '#475569' : '#94a3b8'}
                      fontSize={10}
                      tickLine={false}
                    />
                    <YAxis
                      stroke={theme === 'light' ? '#475569' : '#94a3b8'}
                      fontSize={10}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: theme === 'light' ? '#ffffff' : '#0f172a',
                        borderColor: theme === 'light' ? '#e2e8f0' : '#1e293b',
                        borderRadius: '0.75rem',
                        color: theme === 'light' ? '#0f172a' : '#f8fafc',
                        fontSize: '11px'
                      }}
                      cursor={{ fill: theme === 'light' ? '#cbd5e1' : '#334155', opacity: 0.1 }}
                    />
                    <Bar
                      dataKey="totalQuantity"
                      name="Unit Terjual"
                      radius={[6, 6, 0, 0]}
                    >
                      {bestSellers.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Ranking List Table */}
          <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm dark:shadow-lg flex flex-col backdrop-blur-sm">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-6 uppercase tracking-wider">
              Tabel Produk Terlaris
            </h3>

            {loading ? (
              <div className="space-y-4 flex-1">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="h-16 bg-slate-200 dark:bg-slate-850 animate-pulse rounded-xl" />
                ))}
              </div>
            ) : bestSellers.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
                <Package className="w-10 h-10 mb-2 opacity-40" />
                <p className="text-xs">Data kosong</p>
              </div>
            ) : (
              <div className="space-y-4 flex-1">
                {bestSellers.map((product, index) => (
                  <div
                    key={product.productId}
                    className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-950/40 hover:bg-slate-100 dark:hover:bg-slate-900/40 border border-slate-150 dark:border-slate-800 rounded-2xl transition-all"
                  >
                    <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-bold text-slate-600 dark:text-slate-350 text-xs">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{product.name}</p>
                      <p className="text-[10px] text-slate-500 font-mono truncate">SKU: {product.sku}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-indigo-650 dark:text-indigo-400 font-mono">{product.totalQuantity}</p>
                      <p className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider">Unit</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        </>
      )}

      {activeTab === 'CASHIERS_SHIFTS' && (
        <div className="space-y-8">
          {/* Laporan Per Kasir */}
          <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm dark:shadow-lg backdrop-blur-sm">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-6 flex items-center gap-2 uppercase tracking-wider">
              <Users className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
              Laporan Performa Penjualan per Kasir
            </h3>
            {loading ? (
              <div className="space-y-4">
                <div className="h-12 bg-slate-100 dark:bg-slate-900/20 animate-pulse rounded-2xl" />
                <div className="h-12 bg-slate-100 dark:bg-slate-900/20 animate-pulse rounded-2xl" />
              </div>
            ) : cashierReports.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">Belum ada data penjualan kasir.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                      <th className="pb-3 pt-2 font-black">Nama Kasir</th>
                      <th className="pb-3 pt-2 font-black">Email</th>
                      <th className="pb-3 pt-2 font-black text-center">Total Transaksi</th>
                      <th className="pb-3 pt-2 font-black text-right">Penjualan Tunai</th>
                      <th className="pb-3 pt-2 font-black text-right">Penjualan QRIS</th>
                      <th className="pb-3 pt-2 font-black text-right">Total Penjualan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cashierReports.map((report) => (
                      <tr key={report.cashierId} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-colors">
                        <td className="py-4 font-bold text-slate-800 dark:text-slate-250">{report.name}</td>
                        <td className="py-4 text-slate-500 dark:text-slate-400 font-mono">{report.email}</td>
                        <td className="py-4 text-center font-bold font-mono">{report.totalTransactions}</td>
                        <td className="py-4 text-right font-semibold font-mono text-emerald-600 dark:text-emerald-400">{formatRupiah(report.cashSales)}</td>
                        <td className="py-4 text-right font-semibold font-mono text-indigo-650 dark:text-indigo-400">{formatRupiah(report.qrisSales)}</td>
                        <td className="py-4 text-right font-black font-mono text-slate-800 dark:text-slate-100">{formatRupiah(report.totalSales)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Riwayat Shift Kerja */}
          <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm dark:shadow-lg backdrop-blur-sm">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-6 flex items-center gap-2 uppercase tracking-wider">
              <RefreshCw className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
              Riwayat Shift Kerja & Rekonsiliasi Kasir
            </h3>
            {loading ? (
              <div className="space-y-4">
                <div className="h-12 bg-slate-100 dark:bg-slate-900/20 animate-pulse rounded-2xl" />
                <div className="h-12 bg-slate-100 dark:bg-slate-900/20 animate-pulse rounded-2xl" />
              </div>
            ) : shiftReports.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">Belum ada riwayat shift kerja.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                      <th className="pb-3 pt-2 font-black">Kasir</th>
                      <th className="pb-3 pt-2 font-black">Buka Shift</th>
                      <th className="pb-3 pt-2 font-black">Tutup Shift</th>
                      <th className="pb-3 pt-2 font-black text-right">Modal Awal</th>
                      <th className="pb-3 pt-2 font-black text-right">Ekspektasi Uang</th>
                      <th className="pb-3 pt-2 font-black text-right">Uang Aktual</th>
                      <th className="pb-3 pt-2 font-black text-right">Selisih</th>
                      <th className="pb-3 pt-2 font-black text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shiftReports.map((shift) => {
                      const hasDiff = shift.difference !== null && shift.difference !== 0;
                      const isDeficit = shift.difference !== null && shift.difference < 0;

                      return (
                        <tr key={shift.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-colors">
                          <td className="py-4 font-bold text-slate-800 dark:text-slate-250">{shift.cashierName}</td>
                          <td className="py-4 text-slate-500 dark:text-slate-400 font-mono">
                            {new Date(shift.startTime).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
                          </td>
                          <td className="py-4 text-slate-500 dark:text-slate-400 font-mono">
                            {shift.endTime 
                              ? new Date(shift.endTime).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })
                              : '-'
                            }
                          </td>
                          <td className="py-4 text-right font-medium font-mono">{formatRupiah(shift.cashStart)}</td>
                          <td className="py-4 text-right font-medium font-mono">{formatRupiah(shift.cashExpected)}</td>
                          <td className="py-4 text-right font-medium font-mono">
                            {shift.cashActual !== null ? formatRupiah(shift.cashActual) : '-'}
                          </td>
                          <td className={`py-4 text-right font-bold font-mono ${
                            !hasDiff 
                              ? 'text-slate-650 dark:text-slate-400' 
                              : isDeficit 
                                ? 'text-rose-600 dark:text-rose-450' 
                                : 'text-amber-600 dark:text-amber-400'
                          }`}>
                            {shift.difference !== null ? (shift.difference > 0 ? '+' : '') + formatRupiah(shift.difference) : '-'}
                          </td>
                          <td className="py-4 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                              shift.status === 'OPEN'
                                ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-350 border border-emerald-200 dark:border-emerald-900/50'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                            }`}>
                              {shift.status === 'OPEN' ? 'Aktif' : 'Tutup'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
      </main>
    </div>
  );
}
