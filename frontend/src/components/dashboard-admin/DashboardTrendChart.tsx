import { LineChart as LineChartIcon, Loader2, TrendingDown } from 'lucide-react';
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useThemeStore } from '../../store/useThemeStore';
import {
  DASHBOARD_CHART_AXIS_PROPS,
  DASHBOARD_CHART_LEGEND_STYLE,
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

function formatTrendTooltipValue(value: number, name: string): [string, string] {
  if (name === 'Transaksi Pelanggan') {
    return [`${value} transaksi`, name];
  }
  return [formatDashboardRupiah(value), name];
}

export function DashboardTrendChart({ loading, trendData }: DashboardTrendChartProps) {
  const { theme } = useThemeStore();
  const axisStroke = theme === 'light' ? '#475569' : '#94a3b8';

  return (
    <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm dark:shadow-lg mb-8 backdrop-blur-sm">
      <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
        <LineChartIcon className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
        Tren Penjualan, Laba & Pelanggan (30 Hari)
      </h3>

      {loading ? (
        <div className="h-72 w-full bg-slate-100 dark:bg-slate-900/20 animate-pulse rounded-2xl flex items-center justify-center">
          <Loader2 className="w-7 h-7 text-indigo-500 animate-spin" />
        </div>
      ) : trendData.length === 0 ? (
        <div className="h-72 w-full border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center text-slate-500">
          <TrendingDown className="w-8 h-8 mb-2 opacity-40" />
          <p className="text-xs">Belum ada transaksi terekam selama 30 hari terakhir.</p>
        </div>
      ) : (
        <div className="h-72 w-full min-w-0">
          <ResponsiveContainer width="100%" height={288} minWidth={0}>
            <ComposedChart data={trendData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.18} />
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
                stroke={axisStroke}
                {...DASHBOARD_CHART_AXIS_PROPS}
                tickFormatter={formatTrendChartDateTick}
              />
              <YAxis
                yAxisId="left"
                stroke={axisStroke}
                {...DASHBOARD_CHART_AXIS_PROPS}
                tickFormatter={formatChartYAxisTick}
                width={56}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#f59e0b"
                {...DASHBOARD_CHART_AXIS_PROPS}
                allowDecimals={false}
                width={32}
              />
              <Tooltip
                contentStyle={getChartTooltipStyle(theme)}
                formatter={(value, name) => formatTrendTooltipValue(Number(value ?? 0), String(name ?? ''))}
              />
              <Legend
                verticalAlign="top"
                height={28}
                iconType="circle"
                iconSize={8}
                wrapperStyle={DASHBOARD_CHART_LEGEND_STYLE}
              />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="revenue"
                name="Omset Penjualan"
                stroke="#6366f1"
                strokeWidth={1.5}
                fillOpacity={1}
                fill="url(#colorRevenue)"
              />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="profit"
                name="Laba Bersih"
                stroke="#10b981"
                strokeWidth={1.5}
                fillOpacity={1}
                fill="url(#colorProfit)"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="customerTransactions"
                name="Transaksi Pelanggan"
                stroke="#f59e0b"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
