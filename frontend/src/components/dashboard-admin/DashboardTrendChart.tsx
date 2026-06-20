import { LineChart as LineChartIcon, Loader2, TrendingDown } from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useThemeStore } from '../../store/useThemeStore';
import {
  formatChartYAxisTick,
  formatDashboardRupiah,
  formatTrendChartDateTick,
  getChartTooltipStyle,
} from '../../utils/dashboardAdminHelpers';
import type { TrendData } from '../../types/dashboardAdmin';

export interface DashboardTrendChartProps {
  loading: boolean;
  trendData: TrendData[];
}

export function DashboardTrendChart({ loading, trendData }: DashboardTrendChartProps) {
  const { theme } = useThemeStore();

  return (
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
            <AreaChart data={trendData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
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
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={theme === 'light' ? '#e2e8f0' : '#334155'}
                opacity={0.2}
              />
              <XAxis
                dataKey="date"
                stroke={theme === 'light' ? '#475569' : '#94a3b8'}
                fontSize={10}
                tickLine={false}
                tickFormatter={formatTrendChartDateTick}
              />
              <YAxis
                stroke={theme === 'light' ? '#475569' : '#94a3b8'}
                fontSize={10}
                tickLine={false}
                tickFormatter={formatChartYAxisTick}
              />
              <Tooltip
                contentStyle={getChartTooltipStyle(theme)}
                formatter={(value) => [formatDashboardRupiah(Number(value ?? 0)), '']}
              />
              <Legend
                verticalAlign="top"
                height={36}
                iconType="circle"
                wrapperStyle={{ fontSize: '11px', fontWeight: 'semibold' }}
              />
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
  );
}
