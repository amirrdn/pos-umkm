import { useEffect, useState } from 'react';
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
  Loader2,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  Infinity as InfinityIcon
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

  const [isDowngrading, setIsDowngrading] = useState(false);

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
      '• Cabang tambahan (BRANCH) Anda otomatis dinonaktifkan.\n' +
      '• Hanya 2 staf terlama yang akan tetap aktif.\n' +
      '• Seluruh data Anda tetap tersimpan dengan aman, namun kapasitas penulisan data baru akan dibatasi.';

    if (window.confirm(confirmMsg)) {
      try {
        setIsDowngrading(true);
        await downgradeSubscription();
        alert('Platform berhasil diturunkan ke paket GRATIS secara aman.');
        fetchActiveSubscription();
        fetchInvoices();
      } catch (err: unknown) {
        alert(getErrorMessage(err, 'Gagal menurunkan paket.'));
      } finally {
        setIsDowngrading(false);
      }
    }
  };

  const renderLimitCard = (title: string, icon: LucideIcon, details: UsageDetail, maxText: string) => {
    const IconComponent = icon;
    const isUnlimited = isUnlimitedUsageLimit(details.limit);
    const percentage =
      isUnlimited || details.limit == null
        ? 0
        : Math.min((details.current / details.limit) * 100, 100);
    
    let strokeColor = 'stroke-indigo-600 dark:stroke-indigo-400';
    let badgeStyle = null;

    if (details.isFull) {
      strokeColor = 'stroke-rose-500';
      badgeStyle = (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
          <AlertTriangle className="w-2.5 h-2.5" /> Penuh
        </span>
      );
    } else if (details.isNearLimit) {
      strokeColor = 'stroke-amber-500';
      badgeStyle = (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
          <AlertTriangle className="w-2.5 h-2.5" /> Batas Kuota
        </span>
      );
    }

    return (
      <div className="group relative p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200 shadow-xs hover:shadow-md flex flex-col justify-between overflow-hidden">
        {/* Background highlight pattern */}
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-20 h-20 bg-slate-50 dark:bg-slate-800/30 rounded-full blur-xl group-hover:bg-indigo-500/5 transition-colors" />

        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950/40 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                <IconComponent className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">{title}</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {isUnlimited ? 'Kapasitas Tanpa Batas' : `Maksimal: ${details.limit} ${maxText}`}
                </p>
              </div>
            </div>
            {badgeStyle}
          </div>

          <div className="flex items-baseline justify-between mt-2 mb-3">
            <div className="text-2xl font-black font-mono tracking-tight text-slate-900 dark:text-white">
              {details.current.toLocaleString('id-ID')}
            </div>
            <div className="text-xs font-bold font-mono text-slate-400 dark:text-slate-500 flex items-center gap-1">
              {isUnlimited ? (
                <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-semibold text-[11px]">
                  <InfinityIcon className="w-3.5 h-3.5" /> Unlimited
                </span>
              ) : (
                `/ ${details.limit}`
              )}
            </div>
          </div>
        </div>

        {!isUnlimited && (
          <div className="mt-3 space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800/60">
            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${strokeColor.replace('stroke-', 'bg-')}`}
                style={{ width: `${percentage}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 font-medium">
              <span>Terpakai</span>
              <span className="font-mono font-bold">{percentage.toFixed(0)}%</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60';
      case 'PENDING':
        return 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800/60';
      case 'FAILED':
        return 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200 dark:border-rose-800/60';
      default:
        return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700';
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
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#090D16] text-slate-800 dark:text-slate-100 font-sans antialiased selection:bg-indigo-500 selection:text-white transition-colors duration-150">
      <AppShellHeader
        title="Billing & Ringkasan Paket"
        subtitle="Kelola status berlangganan, batasan penggunaan, dan histori tagihan"
        icon={CreditCard}
        accent="indigo"
        user={user}
        onLogout={() => { logout(); navigate('/login'); }}
        showOutletSwitcher={false}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {loading && !subscription && (
          <div className="h-96 w-full flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-indigo-600 dark:text-indigo-400 animate-spin" />
            <p className="text-xs font-medium text-slate-500">Memuat data berlangganan...</p>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 rounded-2xl text-xs font-semibold flex items-center gap-3 shadow-xs backdrop-blur-sm">
            <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {subscription && (
          <div className="space-y-8">
            {/* HERO CARD: Plan Status */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-900/80 border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-sm">
              {/* Background Glow Accent */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
                <div className="space-y-4">
                  <div className="flex items-center gap-2.5">
                    <span className={`px-3 py-1 text-[10px] font-extrabold tracking-wider uppercase rounded-full border ${
                      activeTier === 'ENTERPRISE' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' :
                      activeTier === 'GROWTH' ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800' :
                      'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}>
                      Paket {activeTier}
                    </span>

                    {activeStatus === 'ACTIVE' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Aktif
                      </span>
                    )}
                  </div>

                  <div>
                    <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                      {activeTier === 'FREE' ? 'SaaSPOS Free Starter' :
                       activeTier === 'GROWTH' ? 'SaaSPOS Growth Business' :
                       'SaaSPOS Enterprise Suite'}
                      {activeTier === 'ENTERPRISE' && <Sparkles className="w-5 h-5 text-amber-500 fill-amber-500/20" />}
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
                      {activeStatus === 'EXPIRED' ? (
                        <span className="text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1.5 mt-2">
                          <AlertTriangle className="w-4 h-4 shrink-0" />
                          Masa berlaku paket telah habis. Layanan beroperasi dalam mode Read-Only.
                        </span>
                      ) : activeTier === 'FREE' ? (
                        'Anda dapat menggunakan paket gratis ini tanpa batas waktu dengan batasan kuota standar.'
                      ) : (
                        `Masa aktif paket berlaku hingga ${formatDate(subscription.expiresAt)}.`
                      )}
                    </p>
                  </div>

                  <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 font-medium">
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-indigo-500" /> Jaminan Enkripsi Data
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-indigo-500" /> Transaksi Midtrans Resmi
                    </span>
                  </div>
                </div>

                {/* Call-to-Actions */}
                <div className="flex flex-col sm:flex-row lg:flex-col gap-3 min-w-[220px] justify-center">
                  <button
                    onClick={() => navigate('/admin/pricing')}
                    className="cursor-pointer py-3.5 px-6 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-all duration-150 shadow-sm hover:shadow-indigo-500/20 hover:-translate-y-0.5 flex items-center justify-center gap-2 active:translate-y-0"
                  >
                    <Zap className="w-4 h-4 fill-white" />
                    <span>Upgrade / Ganti Paket</span>
                  </button>

                  {activeTier !== 'FREE' && (
                    <button
                      onClick={handleDowngrade}
                      disabled={isDowngrading}
                      className="cursor-pointer py-3.5 px-6 text-xs font-semibold rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 transition-all duration-150 flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50"
                    >
                      {isDowngrading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowDownCircle className="w-4 h-4 text-slate-400" />}
                      <span>Downgrade ke Paket Gratis</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* USAGE METRICS GRID */}
            <div>
              <div className="flex items-center justify-between mb-4 px-1">
                <div>
                  <h3 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-widest">
                    Penggunaan Kapasitas
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Statistik kuota fitur aktif pada toko Anda.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {renderLimitCard('Transaksi Sukses', ShoppingCart, subscription.usage.transactions, 'trxs')}
                {renderLimitCard('Katalog Produk', Package, subscription.usage.products, 'SKU')}
                {renderLimitCard('Jumlah Outlet', Store, subscription.usage.outlets, 'cabang')}
                {renderLimitCard('Pengguna / Staf', Users, subscription.usage.staff, 'orang')}
              </div>
            </div>

            {/* INVOICES HISTORY TABLE */}
            <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-widest">
                    Riwayat Invoice & Tagihan
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Daftar seluruh riwayat pembayaran paket langganan Anda.
                  </p>
                </div>

                <button
                  onClick={fetchInvoices}
                  disabled={loading}
                  className="cursor-pointer p-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700/60 border border-slate-200 dark:border-slate-700 rounded-xl transition-all active:scale-95 text-slate-600 dark:text-slate-300 disabled:opacity-50"
                  title="Refresh Data"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {invoices.length === 0 ? (
                <div className="border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center">
                  <Clock className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-400">Belum Ada Riwayat Transaksi</p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Invoice tagihan akan otomatis muncul setelah pembayaran dibuat.</p>
                </div>
              ) : (
                <div className="overflow-x-auto -mx-6 sm:mx-0">
                  <table className="w-full text-left text-xs border-collapse min-w-[640px]">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                        <th className="py-3 px-6 sm:px-4">No. Invoice</th>
                        <th className="py-3 px-4">Paket</th>
                        <th className="py-3 px-4">Tanggal Tagihan</th>
                        <th className="py-3 px-4 text-right">Jumlah Total</th>
                        <th className="py-3 px-4 text-center">Status</th>
                        <th className="py-3 px-6 sm:px-4 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {invoices.map((inv) => (
                        <tr key={inv.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="py-4 px-6 sm:px-4 font-bold text-slate-900 dark:text-slate-100 font-mono">
                            {inv.invoiceNumber}
                          </td>
                          <td className="py-4 px-4">
                            <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-extrabold tracking-wide uppercase ${
                              inv.tier === 'ENTERPRISE' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400' :
                              inv.tier === 'GROWTH' ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400' :
                              'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            }`}>
                              {inv.tier}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                            {new Date(inv.createdAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                          </td>
                          <td className="py-4 px-4 text-right font-black font-mono text-slate-900 dark:text-white">
                            {formatRupiah(Number(inv.amount))}
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusBadgeClass(inv.status)}`}>
                              {getStatusText(inv.status)}
                            </span>
                          </td>
                          <td className="py-4 px-6 sm:px-4 text-right">
                            {inv.status === 'PENDING' && inv.paymentToken ? (
                              <button
                                onClick={() => handlePayPendingInvoice(inv.paymentToken!)}
                                className="cursor-pointer py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-bold transition-all shadow-xs inline-flex items-center gap-1.5 active:scale-95"
                              >
                                <span>Bayar Sekarang</span>
                                <ExternalLink className="w-3 h-3" />
                              </button>
                            ) : inv.status === 'PAID' && inv.paidAt ? (
                              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium inline-flex items-center justify-end gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                <span>Lunas {new Date(inv.paidAt).toLocaleDateString('id-ID')}</span>
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-400 dark:text-slate-600">-</span>
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