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

  return (
    <div className="lg:col-span-2 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm dark:shadow-lg backdrop-blur-sm">
      <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-250 mb-4 flex items-center gap-2">
        <Award className="w-4 h-4 text-amber-500" />
        5 Produk Terlaris (Kuantitas)
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
            <BarChart data={bestSellers} margin={{ top: 20, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={theme === 'light' ? '#e2e8f0' : '#334155'}
                opacity={0.2}
              />
              <XAxis
                dataKey="name"
                stroke={theme === 'light' ? '#475569' : '#94a3b8'}
                {...DASHBOARD_CHART_AXIS_PROPS}
              />
              <YAxis
                stroke={theme === 'light' ? '#475569' : '#94a3b8'}
                {...DASHBOARD_CHART_AXIS_PROPS}
                allowDecimals={false}
                width={36}
              />
              <Tooltip
                contentStyle={getBarChartTooltipStyle(theme)}
                cursor={{ fill: theme === 'light' ? '#cbd5e1' : '#334155', opacity: 0.1 }}
              />
              <Bar dataKey="totalQuantity" name="Unit Terjual" radius={[6, 6, 0, 0]}>
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
