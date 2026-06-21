import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useSubscriptionStore, type UsageDetail, isUnlimitedUsageLimit } from '../store/useSubscriptionStore';
import { getErrorMessage } from '../api/types';
import { getMidtransClientKey } from '../config';
import { getMidtransSnap, loadMidtransSnapScript } from '../types/midtransSnap';
import { AppShellHeader } from './AppShellHeader';
import {
  CreditCard,
  Zap,
  Calendar,
  AlertTriangle,
  RefreshCw,
  Package,
  Store,
  Users,
  ShoppingCart,
  Clock,
  ExternalLink,
  ArrowDownCircle,
  Loader2
} from 'lucide-react';

export default function BillingDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const {
    subscription,
    invoices,
    loading,
    error,
    fetchActiveSubscription,
    fetchInvoices,
    downgradeSubscription
  } = useSubscriptionStore();

  useEffect(() => {
    fetchActiveSubscription();
    fetchInvoices();
  }, [fetchActiveSubscription, fetchInvoices]);

  const formatRupiah = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const loadSnapScript = (): Promise<boolean> => {
    try {
      return loadMidtransSnapScript(getMidtransClientKey());
    } catch (err) {
      console.error(err);
      return Promise.resolve(false);
    }
  };

  const handlePayPendingInvoice = async (snapToken: string) => {
    try {
      const isSnapLoaded = await loadSnapScript();
      if (!isSnapLoaded) {
        alert('Gagal memuat pustaka pembayaran Midtrans.');
        return;
      }

      getMidtransSnap()?.pay(snapToken, {
        onSuccess: () => {
          alert('Pembayaran berhasil! Mengubah status paket...');
          fetchActiveSubscription();
          fetchInvoices();
        },
        onPending: () => {
          alert('Menunggu pembayaran. Silakan selesaikan tagihan Anda.');
          fetchActiveSubscription();
          fetchInvoices();
        },
        onError: () => {
          alert('Pembayaran gagal atau kedaluwarsa.');
        }
      });
    } catch (err: unknown) {
      alert(getErrorMessage(err, 'Gagal memuat pembayaran.'));
    }
  };

  const handleDowngrade = async () => {
    const confirmMsg = 
      'Apakah Anda yakin ingin men-downgrade ke Paket GRATIS?\n\n' +
      'PERINGATAN:\n' +
      '- Cabang tambahan (BRANCH) Anda otomatis dinonaktifkan.\n' +
      '- Hanya 2 staf terlama yang akan tetap aktif.\n' +
      '- Seluruh data Anda di database tetap tersimpan dengan aman, namun kapasitas tulis di atas limit baru akan diblokir.';

    if (window.confirm(confirmMsg)) {
      try {
        await downgradeSubscription();
        alert('Platform berhasil diturunkan ke paket GRATIS secara aman.');
        fetchActiveSubscription();
        fetchInvoices();
      } catch (err: unknown) {
        alert(getErrorMessage(err, 'Gagal menurunkan paket.'));
      }
    }
  };

  const renderLimitBar = (title: string, icon: LucideIcon, details: UsageDetail, maxText: string) => {
    const IconComponent = icon;
    const isUnlimited = isUnlimitedUsageLimit(details.limit);
    const percentage =
      isUnlimited || details.limit == null
        ? 0
        : Math.min((details.current / details.limit) * 100, 100);
    
    let barColor = 'bg-indigo-500';
    if (details.isFull) barColor = 'bg-rose-500';
    else if (details.isNearLimit) barColor = 'bg-amber-500';

    return (
      <div className="bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl border ${
              details.isFull ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
              details.isNearLimit ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' :
              'bg-slate-100 text-slate-650 dark:bg-slate-900 border-slate-200 dark:border-slate-800'
            }`}>
              <IconComponent className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">{title}</h4>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                {isUnlimited ? 'Kapasitas Tanpa Batas' : `Maksimal kuota: ${details.limit} ${maxText}`}
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-sm font-black font-mono text-slate-800 dark:text-slate-100">{details.current}</span>
            {!isUnlimited && (
              <span className="text-xs text-slate-400 font-semibold font-mono"> / {details.limit}</span>
            )}
            {isUnlimited && (
              <span className="text-xs text-slate-400 font-semibold font-mono"> / ∞</span>
            )}
          </div>
        </div>

        {!isUnlimited && (
          <div className="space-y-1">
            <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-350 ${barColor}`}
                style={{ width: `${percentage}%` }}
              />
            </div>
            {details.isFull && (
              <p className="text-[9px] text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1">
                <AlertTriangle className="w-2.5 h-2.5" />
                <span>Kapasitas penuh! Upgrade paket Anda segera.</span>
              </p>
            )}
            {!details.isFull && details.isNearLimit && (
              <p className="text-[9px] text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
                <AlertTriangle className="w-2.5 h-2.5" />
                <span>Kapasitas hampir penuh (&gt;90%).</span>
              </p>
            )}
          </div>
        )}
      </div>
    );
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-350 border border-emerald-200 dark:border-emerald-900/50';
      case 'PENDING':
        return 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-455 border border-amber-200 dark:border-amber-900/50';
      case 'FAILED':
        return 'bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-350 border border-rose-200 dark:border-rose-900/50';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PAID': return 'Lunas';
      case 'PENDING': return 'Menunggu Pembayaran';
      case 'FAILED': return 'Gagal / Expired';
      default: return status;
    }
  };

  const activeTier = subscription?.tier || 'FREE';
  const activeStatus = subscription?.status || 'ACTIVE';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans transition-colors duration-150">
      <AppShellHeader
        title="Ringkasan Billing & Tagihan"
        subtitle="Manajemen paket langganan dan tagihan SaaS"
        icon={CreditCard}
        accent="indigo"
        user={user}
        onLogout={() => { logout(); navigate('/login'); }}
        showOutletSwitcher={false}
      />

      <main className="max-w-7xl mx-auto px-6 py-8">
        {loading && !subscription && (
          <div className="h-96 w-full flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          </div>
        )}

        {error && (
          <div className="mb-8 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 rounded-2xl text-xs font-medium flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-500" />
            {error}
          </div>
        )}

        {subscription && (
          <div className="space-y-8">
            {/* Top Widget: Plan Info */}
            <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm dark:shadow-lg flex flex-col md:flex-row justify-between items-stretch gap-6 backdrop-blur-sm">
              <div className="space-y-4">
                <span className={`px-3 py-1 text-[9px] font-black uppercase tracking-wider rounded-full border ${
                  activeTier === 'ENTERPRISE' ? 'bg-emerald-500/10 text-emerald-650 border-emerald-500/20' :
                  activeTier === 'GROWTH' ? 'bg-indigo-500/10 text-indigo-650 border-indigo-500/20' :
                  'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-800'
                }`}>
                  Paket {activeTier}
                </span>

                <div className="space-y-1">
                  <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                    {activeTier === 'FREE' ? 'SaaSPOS — Layanan Gratis' :
                     activeTier === 'GROWTH' ? 'SaaSPOS — Layanan Tumbuh' :
                     'SaaSPOS — Layanan Enterprise'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {activeStatus === 'EXPIRED' ? (
                      <span className="text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 animate-bounce" />
                        Masa langganan Anda telah kedaluwarsa. Layanan terkunci (Read-Only).
                      </span>
                    ) : activeTier === 'FREE' ? (
                      'Anda sedang menggunakan paket selamanya gratis dengan kapasitas terbatas.'
                    ) : (
                      `Paket aktif sampai dengan tanggal: ${formatDate(subscription.expiresAt)}`
                    )}
                  </p>
                </div>

                {subscription.expiresAt && activeStatus !== 'EXPIRED' && (
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
                    <Calendar className="w-4 h-4 text-indigo-500" />
                    <span>Perpanjangan otomatis dinonaktifkan di sandbox mode.</span>
                  </div>
                )}
              </div>

              {/* Call to Actions */}
              <div className="flex flex-col sm:flex-row md:flex-col justify-center gap-3 min-w-[200px]">
                <button
                  onClick={() => navigate('/admin/pricing')}
                  className="cursor-pointer py-3 px-5 text-xs font-bold rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-sm flex items-center justify-center gap-2 active:scale-95"
                >
                  <Zap className="w-3.5 h-3.5 fill-white" />
                  <span>Upgrade / Ganti Paket</span>
                </button>

                {activeTier !== 'FREE' && (
                  <button
                    onClick={handleDowngrade}
                    className="cursor-pointer py-3 px-5 text-xs font-bold rounded-2xl bg-white hover:bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 transition-all flex items-center justify-center gap-2 active:scale-95"
                  >
                    <ArrowDownCircle className="w-3.5 h-3.5" />
                    <span>Kembali ke Paket Gratis</span>
                  </button>
                )}
              </div>
            </div>

            {/* Middle Section: Capacity limit progress bars */}
            <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm dark:shadow-lg backdrop-blur-sm">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-6 uppercase tracking-wider">
                Penggunaan Kapasitas Data Bulan Ini
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {renderLimitBar('Transaksi Sukses', ShoppingCart, subscription.usage.transactions, 'trxs')}
                {renderLimitBar('Katalog Produk', Package, subscription.usage.products, 'SKU')}
                {renderLimitBar('Jumlah Outlet', Store, subscription.usage.outlets, 'cabang')}
                {renderLimitBar('Pengguna / Staf', Users, subscription.usage.staff, 'orang')}
              </div>
            </div>

            {/* Bottom Widget: Billing History Invoices */}
            <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm dark:shadow-lg backdrop-blur-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  Riwayat Tagihan & Pembayaran Langganan
                </h3>
                <button
                  onClick={fetchInvoices}
                  className="cursor-pointer p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl transition-all disabled:opacity-50"
                  disabled={loading}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {invoices.length === 0 ? (
                <div className="border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center text-slate-505 dark:text-slate-500">
                  <Clock className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-xs">Belum ada riwayat transaksi pembayaran.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                        <th className="pb-3 pt-2 font-black">Nomor Invoice</th>
                        <th className="pb-3 pt-2 font-black">Paket</th>
                        <th className="pb-3 pt-2 font-black">Tanggal Tagihan</th>
                        <th className="pb-3 pt-2 font-black text-right">Biaya Langganan</th>
                        <th className="pb-3 pt-2 font-black text-center">Status</th>
                        <th className="pb-3 pt-2 font-black text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.map((inv) => (
                        <tr key={inv.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-colors">
                          <td className="py-4 font-bold text-slate-800 dark:text-slate-250 font-mono">
                            {inv.invoiceNumber}
                          </td>
                          <td className="py-4 font-semibold">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              inv.tier === 'ENTERPRISE' ? 'bg-emerald-500/10 text-emerald-650' :
                              inv.tier === 'GROWTH' ? 'bg-indigo-500/10 text-indigo-650' :
                              'bg-slate-100 text-slate-600 dark:bg-slate-800'
                            }`}>
                              {inv.tier}
                            </span>
                          </td>
                          <td className="py-4 text-slate-500 dark:text-slate-400 font-mono">
                            {new Date(inv.createdAt).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
                          </td>
                          <td className="py-4 text-right font-black font-mono text-slate-800 dark:text-slate-100">
                            {formatRupiah(Number(inv.amount))}
                          </td>
                          <td className="py-4 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${getStatusBadgeClass(inv.status)}`}>
                              {getStatusText(inv.status)}
                            </span>
                          </td>
                          <td className="py-4 text-right">
                            {inv.status === 'PENDING' && inv.paymentToken ? (
                              <button
                                onClick={() => handlePayPendingInvoice(inv.paymentToken!)}
                                className="cursor-pointer py-1 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold transition-all shadow-sm inline-flex items-center gap-1 active:scale-95"
                              >
                                <span>Bayar Sekarang</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </button>
                            ) : inv.status === 'PAID' && inv.paidAt ? (
                              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                                Lunas pada {new Date(inv.paidAt).toLocaleDateString('id-ID')}
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
