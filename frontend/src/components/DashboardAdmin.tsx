import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';
import { API_BASE_URL } from '../config';
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  LogOut,
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
  ArrowUpDown,
  AlertCircle,
  Loader2,
  Sun,
  Moon,
  Tag
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

const COLORS = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ec4899'];

export default function DashboardAdmin() {
  const navigate = useNavigate();
  const { token, user, logout } = useAuthStore();
  const tenantId = user?.tenantId;
  const { theme, toggleTheme } = useThemeStore();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [bestSellers, setBestSellers] = useState<BestSellerProduct[]>([]);
  const [trendData, setTrendData] = useState<TrendData[]>([]);

  const fetchData = async () => {
    if (!token || !tenantId) return;
    setLoading(true);
    setError(null);
    try {
      const summaryRes = await fetch(`${API_BASE_URL}/api/analytics/summary`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-tenant-id': tenantId
        }
      });
      if (!summaryRes.ok) throw new Error('Gagal mengambil data ringkasan analitik.');
      const summaryJson = await summaryRes.json();

      const bestSellersRes = await fetch(`${API_BASE_URL}/api/analytics/best-sellers`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-tenant-id': tenantId
        }
      });
      if (!bestSellersRes.ok) throw new Error('Gagal mengambil data produk terlaris.');
      const bestSellersJson = await bestSellersRes.json();

      const trendRes = await fetch(`${API_BASE_URL}/api/analytics/trend`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-tenant-id': tenantId
        }
      });
      if (!trendRes.ok) throw new Error('Gagal mengambil data tren penjualan.');
      const trendJson = await trendRes.json();

      setSummary(summaryJson.data);
      setBestSellers(bestSellersJson.data);
      setTrendData(trendJson.data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token, tenantId]);

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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans transition-colors duration-150">
      {/* Header Navigasi Glassmorphism */}
      <header className="sticky top-0 z-50 bg-white/95 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-lg px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600 rounded-xl shadow-md shadow-indigo-500/30">
              <Store className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-slate-900 via-indigo-950 to-indigo-650 dark:from-white dark:via-slate-200 dark:to-indigo-400 bg-clip-text text-transparent">
                SaaS POS Laporan
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Panel Dashboard Owner Tenant</p>
            </div>
          </div>

          {/* Menu Navigasi Global */}
          <nav className="flex flex-wrap items-center justify-center gap-1 bg-slate-100 dark:bg-slate-900/60 p-1 rounded-xl border border-slate-200 dark:border-slate-800/80">
            <button
              onClick={() => navigate('/pos')}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-all duration-150"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              Kasir POS
            </button>
            <button
              onClick={() => navigate('/admin/products')}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-all duration-150"
            >
              <Package className="w-3.5 h-3.5" />
              Master Produk
            </button>
            <button
              onClick={() => navigate('/admin/categories')}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-all duration-150"
            >
              <Tag className="w-3.5 h-3.5" />
              Kategori
            </button>
            <button
              onClick={() => navigate('/admin/inventory')}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-all duration-150"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              Kelola Stok
            </button>

            {!user?.roles.includes('Staf Gudang') && (
              <>
                <button
                  onClick={() => navigate('/admin/staff')}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-all duration-150"
                >
                  <Users className="w-3.5 h-3.5" />
                  Kelola Staf
                </button>
                <button
                  onClick={() => navigate('/admin/customers')}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-all duration-150"
                >
                  <Users className="w-3.5 h-3.5" />
                  Kelola Pelanggan
                </button>
                <button
                  onClick={() => navigate('/admin/dashboard')}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-lg bg-indigo-600 text-white shadow-md shadow-indigo-500/20 transition-all duration-150"
                >
                  <BarChart2 className="w-3.5 h-3.5" />
                  Dashboard
                </button>
              </>
            )}
          </nav>

          {/* Profil & Logout */}
          <div className="flex items-center gap-4">
            {/* Tombol Switcher Tema (Dark / Light) */}
            <button
              onClick={toggleTheme}
              className="p-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all duration-150 active:scale-95"
              title={theme === 'light' ? 'Mode Gelap' : 'Mode Terang'}
            >
              {theme === 'light' ? (
                <Moon className="h-4 w-4 text-slate-600" />
              ) : (
                <Sun className="h-4 w-4 text-amber-400" />
              )}
            </button>

            <div className="text-right hidden md:block">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 justify-end">
                {user?.name}
                <span className="text-[10px] bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full font-medium">Owner</span>
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">Tenant: {tenantId?.substring(0, 8)}...</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500 hover:text-white border border-rose-500/20 rounded-xl transition-all shadow-sm duration-150"
              title="Keluar Aplikasi"
            >
              <LogOut className="w-4 h-4" />
              <span>Keluar</span>
            </button>
          </div>
        </div>
      </header>

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
            </p>
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-xl transition-all shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Segarkan Laporan</span>
          </button>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 rounded-2xl text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* 4 Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
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
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
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
      </main>
    </div>
  );
}
