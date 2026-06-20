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
  const isEmpty = typeBreakdownChartData.every((row) => row.omset === 0 && row.laba === 0);

  return (
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
      ) : isEmpty ? (
        <div className="h-64 w-full border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center text-slate-500">
          <BarChart2 className="w-10 h-10 mb-2 opacity-40" />
          <p className="text-xs">Belum ada data penjualan untuk perbandingan outlet.</p>
        </div>
      ) : (
        <div className="h-64 w-full min-w-0">
          <ResponsiveContainer width="100%" height={256} minWidth={0}>
            <BarChart data={typeBreakdownChartData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={theme === 'light' ? '#e2e8f0' : '#334155'}
                opacity={0.2}
              />
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
                tickFormatter={formatChartYAxisTick}
              />
              <Tooltip
                contentStyle={{
                  ...getChartTooltipStyle(theme),
                  borderRadius: '0.75rem',
                }}
                formatter={(value) => [formatDashboardRupiah(Number(value ?? 0)), '']}
              />
              <Legend verticalAlign="top" height={28} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
              <Bar dataKey="omset" name="Omset Bulan Ini" fill="#6366f1" radius={[6, 6, 0, 0]} />
              <Bar dataKey="laba" name="Laba Bulan Ini" fill="#10b981" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
