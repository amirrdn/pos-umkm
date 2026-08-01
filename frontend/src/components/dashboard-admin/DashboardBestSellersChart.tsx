import { Award, Loader2, ShoppingCart } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useThemeStore } from '../../store/useThemeStore';
import { DASHBOARD_CHART_AXIS_PROPS, DASHBOARD_CHART_COLORS, getBarChartTooltipStyle } from '../../utils/dashboardAdminHelpers';
import type { BestSellerProduct } from '../../types/dashboardAdmin';

export interface DashboardBestSellersChartProps {
  loading: boolean;
  bestSellers: BestSellerProduct[];
}

export function DashboardBestSellersChart({ loading, bestSellers }: DashboardBestSellersChartProps) {
  const { theme } = useThemeStore();
  const axisStroke = theme === 'light' ? '#64748b' : '#94a3b8';

  return (
    <div className="bg-white dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 shadow-xs hover:shadow-md dark:shadow-none transition-all lg:col-span-2 backdrop-blur-md">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-50 flex items-center gap-2">
            <div className="p-2 bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-xl border border-amber-500/20">
              <Award className="w-4 h-4" />
            </div>
            5 Produk Terlaris (Kuantitas)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Produk favorit dengan total volume penjualan tertinggi.
          </p>
        </div>

        <span className="text-xs font-bold px-3 py-1 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-full">
          Top Performers
        </span>
      </div>

      {loading ? (
        <div className="h-80 w-full bg-slate-100/70 dark:bg-slate-800/40 animate-pulse rounded-2xl flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        </div>
      ) : bestSellers.length === 0 ? (
        <div className="h-80 w-full border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center text-slate-500">
          <ShoppingCart className="w-10 h-10 mb-2 opacity-40 text-slate-400" />
          <p className="text-xs font-semibold">Belum ada data transaksi penjualan terkumpul.</p>
        </div>
      ) : (
        <div className="h-80 w-full min-w-0">
          <ResponsiveContainer width="100%" height={320} minWidth={0}>
            <BarChart data={bestSellers} margin={{ top: 20, right: 10, left: -20, bottom: 10 }}>
              <CartesianGrid
                strokeDasharray="4 4"
                stroke={theme === 'light' ? '#cbd5e1' : '#334155'}
                opacity={0.3}
              />
              <XAxis
                dataKey="name"
                stroke={axisStroke}
                {...DASHBOARD_CHART_AXIS_PROPS}
              />
              <YAxis
                stroke={axisStroke}
                {...DASHBOARD_CHART_AXIS_PROPS}
                allowDecimals={false}
                width={40}
              />
              <Tooltip
                contentStyle={getBarChartTooltipStyle(theme)}
                cursor={{ fill: theme === 'light' ? '#f1f5f9' : '#1e293b', opacity: 0.5 }}
              />
              <Bar dataKey="totalQuantity" name="Unit Terjual" radius={[8, 8, 0, 0]}>
                {bestSellers.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={DASHBOARD_CHART_COLORS[index % DASHBOARD_CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
