import { BarChart2, Loader2, Store } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
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
  getChartTooltipStyle,
} from '../../utils/dashboardAdminHelpers';
import type { TypeBreakdownChartRow } from '../../types/dashboardAdmin';

export interface DashboardBreakdownChartProps {
  loading: boolean;
  typeBreakdownChartData: TypeBreakdownChartRow[];
}

export function DashboardBreakdownChart({
  loading,
  typeBreakdownChartData,
}: DashboardBreakdownChartProps) {
  const { theme } = useThemeStore();
  const axisStroke = theme === 'light' ? '#64748b' : '#94a3b8';
  const isEmpty = typeBreakdownChartData.every((row) => row.omset === 0 && row.laba === 0);

  return (
    <div className="bg-white dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 shadow-xs hover:shadow-md dark:shadow-none mb-8 backdrop-blur-md transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-50 flex items-center gap-2">
            <div className="p-2 bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-xl border border-indigo-500/20">
              <Store className="w-4 h-4" />
            </div>
            Perbandingan MAIN vs Cabang (Bulan Ini)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Omset dan laba bersih agregat toko pusat dibandingkan seluruh cabang.
          </p>
        </div>

        <span className="text-xs font-bold px-3 py-1 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-full">
          Komparasi Jaringan
        </span>
      </div>

      {loading ? (
        <div className="h-72 w-full bg-slate-100/70 dark:bg-slate-800/40 animate-pulse rounded-2xl flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        </div>
      ) : isEmpty ? (
        <div className="h-72 w-full border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center text-slate-500">
          <BarChart2 className="w-10 h-10 mb-2 opacity-40 text-slate-400" />
          <p className="text-xs font-semibold">Belum ada data penjualan untuk perbandingan outlet.</p>
        </div>
      ) : (
        <div className="h-72 w-full min-w-0">
          <ResponsiveContainer width="100%" height={288} minWidth={0}>
            <BarChart data={typeBreakdownChartData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid
                strokeDasharray="4 4"
                stroke={theme === 'light' ? '#cbd5e1' : '#334155'}
                opacity={0.3}
              />
              <XAxis
                dataKey="label"
                stroke={axisStroke}
                {...DASHBOARD_CHART_AXIS_PROPS}
              />
              <YAxis
                stroke={axisStroke}
                {...DASHBOARD_CHART_AXIS_PROPS}
                tickFormatter={formatChartYAxisTick}
                width={62}
              />
              <Tooltip
                contentStyle={getChartTooltipStyle(theme)}
                formatter={(value) => [formatDashboardRupiah(Number(value ?? 0)), '']}
              />
              <Legend verticalAlign="top" height={28} iconType="circle" iconSize={8} wrapperStyle={DASHBOARD_CHART_LEGEND_STYLE} />
              <Bar dataKey="omset" name="Omset Bulan Ini" fill="#6366f1" radius={[8, 8, 0, 0]} />
              <Bar dataKey="laba" name="Laba Bulan Ini" fill="#10b981" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
