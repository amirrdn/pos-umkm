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
  const axisStroke = theme === 'light' ? '#64748b' : '#94a3b8';

  return (
    <div className="bg-white dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 shadow-xs hover:shadow-md dark:shadow-none mb-8 backdrop-blur-md transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-50 flex items-center gap-2">
            <div className="p-2 bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-xl border border-indigo-500/20">
              <LineChartIcon className="w-4 h-4" />
            </div>
            Tren Penjualan, Laba & Pelanggan (30 Hari)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Visualisasi dinamika pendapatan, margin laba bersih, dan volume transaksi harian.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
            <span className="w-2 h-2 rounded-full bg-indigo-500" />
            Omset
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Laba
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Pelanggan
          </span>
        </div>
      </div>

      {loading ? (
        <div className="h-80 w-full bg-slate-100/70 dark:bg-slate-800/40 animate-pulse rounded-2xl flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        </div>
      ) : trendData.length === 0 ? (
        <div className="h-80 w-full border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center text-slate-500">
          <TrendingDown className="w-10 h-10 mb-2 opacity-40 text-slate-400" />
          <p className="text-xs font-semibold">Belum ada transaksi terekam selama 30 hari terakhir.</p>
        </div>
      ) : (
        <div className="h-80 w-full min-w-0">
          <ResponsiveContainer width="100%" height={320} minWidth={0}>
            <ComposedChart data={trendData} margin={{ top: 12, right: 12, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="4 4"
                stroke={theme === 'light' ? '#cbd5e1' : '#334155'}
                opacity={0.3}
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
                width={62}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#f59e0b"
                {...DASHBOARD_CHART_AXIS_PROPS}
                allowDecimals={false}
                width={36}
              />
              <Tooltip
                contentStyle={getChartTooltipStyle(theme)}
                formatter={(value, name) => formatTrendTooltipValue(Number(value ?? 0), String(name ?? ''))}
              />
              <Legend
                verticalAlign="top"
                height={32}
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
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorRevenue)"
              />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="profit"
                name="Laba Bersih"
                stroke="#10b981"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorProfit)"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="customerTransactions"
                name="Transaksi Pelanggan"
                stroke="#f59e0b"
                strokeWidth={2.5}
                dot={{ r: 2, fill: '#f59e0b' }}
                activeDot={{ r: 5, fill: '#f59e0b' }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
