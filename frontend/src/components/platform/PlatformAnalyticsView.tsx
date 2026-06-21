import { useEffect } from 'react';
import { usePlatformStore } from '../../store/usePlatformStore';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Package, Store, Loader2 } from 'lucide-react';

export function PlatformAnalyticsView() {
  const fetchRevenueData = usePlatformStore((state) => state.fetchRevenueData);
  const fetchTopProducts = usePlatformStore((state) => state.fetchTopProducts);
  const revenueData = usePlatformStore((state) => state.revenueData);
  const topProducts = usePlatformStore((state) => state.topProducts);
  const loading = usePlatformStore((state) => state.loading);

  useEffect(() => {
    fetchRevenueData();
    fetchTopProducts();
  }, [fetchRevenueData, fetchTopProducts]);

  if (loading && revenueData.length === 0 && topProducts.length === 0) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 text-violet-600 animate-spin" />
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-lg shadow-lg">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">{label}</p>
          <p className="text-sm font-bold text-violet-600">
            {formatCurrency(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-black text-slate-800 dark:text-slate-100">
          Global Analytics
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 bg-violet-100 dark:bg-violet-900/30 text-violet-600 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              Total Pendapatan (Semua Toko)
            </h3>
          </div>

          <div className="h-[300px] w-full">
            {revenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12, fill: '#64748b' }} 
                    axisLine={false} 
                    tickLine={false} 
                  />
                  <YAxis 
                    tickFormatter={(value) => `Rp${(value / 1000000).toFixed(0)}M`}
                    tick={{ fontSize: 12, fill: '#64748b' }} 
                    axisLine={false} 
                    tickLine={false} 
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#8b5cf6" 
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#8b5cf6', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-slate-500">
                Belum ada data pendapatan.
              </div>
            )}
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col">
          <div className="p-6 pb-4 border-b border-slate-100 dark:border-slate-800/50 flex items-center gap-2">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-xl">
              <Package className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              Top 10 Produk Paling Laku
            </h3>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-800/20 text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold">
                  <th className="px-6 py-3 border-b border-slate-200 dark:border-slate-800">Nama Produk</th>
                  <th className="px-6 py-3 border-b border-slate-200 dark:border-slate-800">Toko</th>
                  <th className="px-6 py-3 border-b border-slate-200 dark:border-slate-800 text-right">Terjual</th>
                  <th className="px-6 py-3 border-b border-slate-200 dark:border-slate-800 text-right">Pendapatan</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-slate-100 dark:divide-slate-800/50">
                {topProducts.length > 0 ? (
                  topProducts.map((product, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="px-6 py-3">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {product.productName}
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                          <Store className="w-3 h-3" />
                          <span className="text-xs">{product.tenantName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3 text-right font-bold text-slate-700 dark:text-slate-300">
                        {product.quantitySold}
                      </td>
                      <td className="px-6 py-3 text-right font-medium text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(product.revenueGenerated)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-500 text-sm">
                      Belum ada data penjualan produk.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
