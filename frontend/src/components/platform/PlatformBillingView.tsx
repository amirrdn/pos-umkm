import { useState, useEffect, useCallback } from 'react';
import {
  CreditCard,
  TrendingUp,
  Users,
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Wrench,
  ExternalLink
} from 'lucide-react';
import {
  getBillingMetricsApi,
  listInvoicesApi
} from '../../api/platformBillingApi';
import type {
  BillingMetrics,
  SubscriptionInvoice
} from '../../api/platformBillingApi';
import { PlatformOverrideModal } from './PlatformOverrideModal';
import { PlatformMidtransDetailModal } from './PlatformMidtransDetailModal';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export function PlatformBillingView() {
  const [metrics, setMetrics] = useState<BillingMetrics | null>(null);
  const [invoices, setInvoices] = useState<SubscriptionInvoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
  const [selectedMidtransInvoice, setSelectedMidtransInvoice] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    Promise.resolve().then(() => {
      setIsLoading(true);
      setError(null);
    });
    try {
      const [metricsData, invoicesRes] = await Promise.all([
        getBillingMetricsApi(),
        listInvoicesApi(page, 10),
      ]);
      setMetrics(metricsData);
      setInvoices(invoicesRes.data);
      setTotalPages(invoicesRes.meta?.totalPages || 1);
    } catch (err: unknown) {
      console.error(err);
      setError('Gagal memuat data billing platform.');
    } finally {
      setIsLoading(false);
    }
  }, [page]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchData]);

  const formatCurrency = (amount: number | string) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(Number(amount));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Lunas
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
            <Clock className="w-3 h-3 mr-1" />
            Menunggu
          </span>
        );
      case 'FAILED':
      case 'EXPIRED':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400">
            <XCircle className="w-3 h-3 mr-1" />
            Gagal
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
            Billing Platform
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Ringkasan pendapatan langganan lintas-tenant dan metrik churn.
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 p-4 rounded-xl text-sm font-medium">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            </div>
          </div>
          <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Monthly Recurring Revenue (MRR)
          </h3>
          <p className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-1">
            {isLoading ? '...' : formatCurrency(metrics?.mrr || 0)}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Annual Recurring Revenue (ARR)
          </h3>
          <p className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-1">
            {isLoading ? '...' : formatCurrency(metrics?.arr || 0)}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Tenant Aktif
          </h3>
          <p className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-1">
            {isLoading ? '...' : metrics?.activeTenants || 0}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-lg bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
              <Activity className="w-5 h-5 text-rose-600 dark:text-rose-400" />
            </div>
          </div>
          <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Churn Rate
          </h3>
          <p className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-1">
            {isLoading ? '...' : `${metrics?.churnRate || 0}%`}
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
            Riwayat Invoice Langganan
          </h3>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsOverrideModalOpen(true)}
              className="flex items-center gap-2 px-3 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Wrench className="w-4 h-4" />
              Override Paket
            </button>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari invoice..."
                className="pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 w-64"
                disabled
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                <th className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  No Invoice & Tanggal
                </th>
                <th className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Tenant
                </th>
                <th className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Paket
                </th>
                <th className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Nominal
                </th>
                <th className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    Memuat data invoice...
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    Belum ada riwayat invoice.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr
                    key={inv.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="p-4">
                      <div className="font-medium text-sm text-slate-800 dark:text-slate-200">
                        {inv.invoiceNumber}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        {format(new Date(inv.createdAt), 'dd MMM yyyy HH:mm', { locale: id })}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-sm text-slate-800 dark:text-slate-200">
                        {inv.tenant.name}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">{inv.tenant.email}</div>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-xs font-medium text-slate-600 dark:text-slate-300">
                        {inv.tier}
                      </span>
                    </td>
                    <td className="p-4 font-medium text-sm text-slate-800 dark:text-slate-200">
                      {formatCurrency(inv.amount)}
                    </td>
                    <td className="p-4">{getStatusBadge(inv.status)}</td>
                    <td className="p-4">
                      <button
                        onClick={() => setSelectedMidtransInvoice(inv.invoiceNumber)}
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg transition-colors"
                        title="Detail Pembayaran Midtrans"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <span className="text-sm text-slate-500 dark:text-slate-400">
              Halaman {page} dari {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="px-3 py-1 border border-slate-200 dark:border-slate-700 rounded hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 text-sm"
              >
                Sebelumnya
              </button>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="px-3 py-1 border border-slate-200 dark:border-slate-700 rounded hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 text-sm"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        )}
      </div>

      {isOverrideModalOpen && (
        <PlatformOverrideModal
          onClose={() => setIsOverrideModalOpen(false)}
          onSuccess={() => {
            setIsOverrideModalOpen(false);
            fetchData();
          }}
        />
      )}

      {selectedMidtransInvoice && (
        <PlatformMidtransDetailModal
          invoiceNumber={selectedMidtransInvoice}
          onClose={() => setSelectedMidtransInvoice(null)}
        />
      )}
    </div>
  );
}
