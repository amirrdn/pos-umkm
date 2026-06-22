import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useSubscriptionStore } from '../store/useSubscriptionStore';
import { getErrorMessage } from '../api/types';
import { getMidtransClientKey, MIDTRANS_IS_PRODUCTION } from '../config';
import { getMidtransSnap, loadMidtransSnapScript } from '../types/midtransSnap';
import { AppShellHeader } from './AppShellHeader';
import { 
  CreditCard, 
  Check, 
  X, 
  ShieldCheck, 
  Zap, 
  ArrowLeft,
  Loader2
} from 'lucide-react';

export default function SubscriptionPricing() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { subscription, loading, fetchActiveSubscription, upgradeSubscription } = useSubscriptionStore();
  const [loadingTier, setLoadingTier] = useState<'GROWTH' | 'ENTERPRISE' | null>(null);

  useEffect(() => {
    fetchActiveSubscription();
  }, [fetchActiveSubscription]);

  const loadSnapScript = (): Promise<boolean> => {
    try {
      return loadMidtransSnapScript(getMidtransClientKey());
    } catch (err) {
      console.error(err);
      return Promise.resolve(false);
    }
  };

  const handleUpgrade = async (tier: 'GROWTH' | 'ENTERPRISE') => {
    try {
      setLoadingTier(tier);
      const isSnapLoaded = await loadSnapScript();
      if (!isSnapLoaded) {
        alert('Gagal memuat pustaka pembayaran Midtrans. Silakan coba lagi.');
        setLoadingTier(null);
        return;
      }

      const invoice = await upgradeSubscription(tier);

      if (!invoice.snapToken) {
        throw new Error('Token pembayaran tidak valid.');
      }

      getMidtransSnap()?.pay(invoice.snapToken, {
        onSuccess: () => {
          alert('Pembayaran berhasil! Mengalihkan ke Halaman Tagihan...');
          fetchActiveSubscription();
          navigate('/admin/billing');
        },
        onPending: () => {
          alert('Menunggu pembayaran. Harap segera selesaikan pembayaran Anda.');
          fetchActiveSubscription();
          navigate('/admin/billing');
        },
        onError: () => {
          alert('Pembayaran gagal. Silakan coba kembali.');
        },
        onClose: () => {
          alert('Popup pembayaran ditutup sebelum transaksi selesai.');
        }
      });
    } catch (err: unknown) {
      console.error('Upgrade error:', err);
      alert(getErrorMessage(err, 'Terjadi kesalahan saat memproses inisiasi pembayaran.'));
    } finally {
      setLoadingTier(null);
    }
  };

  const currentTier = subscription?.tier || 'FREE';

  const pricingTiers = [
    {
      name: 'FREE',
      title: 'Paket Gratis',
      price: 'Rp 0',
      period: 'Selamanya',
      desc: 'Cocok untuk usaha mikro yang baru memulai.',
      features: [
        { text: 'Maks. 150 transaksi / bulan', checked: true },
        { text: 'Maks. 30 produk aktif (SKU)', checked: true },
        { text: 'Hanya 1 Outlet Utama (MAIN)', checked: true },
        { text: 'Maks. 2 Staf (1 Owner + 1 Kasir)', checked: true },
        { text: 'Manajemen Inventaris Dasar', checked: true },
        { text: 'Integrasi QRIS Otomatis', checked: false },
        { text: 'Analisis HPP & Laba Bersih', checked: false },
      ],
      buttonText: currentTier === 'FREE' ? 'Paket Aktif saat Ini' : 'Kembali ke Gratis',
      action: () => navigate('/admin/billing'),
      disabled: currentTier === 'FREE',
      accent: 'slate',
    },
    {
      name: 'GROWTH',
      title: 'Paket Tumbuh',
      price: 'Rp 149.000',
      period: '/ bulan',
      desc: 'Ideal untuk toko retail yang mulai berkembang dan bercabang.',
      features: [
        { text: 'Maks. 3.000 transaksi / bulan', checked: true },
        { text: 'Maks. 500 produk aktif (SKU)', checked: true },
        { text: 'Maks. 3 Outlet (1 Utama + 2 Cabang)', checked: true },
        { text: 'Maks. 5 Staf Aktif', checked: true },
        { text: 'Manajemen Inventaris & Kartu Stok', checked: true },
        { text: 'Integrasi QRIS Otomatis Midtrans', checked: true },
        { text: 'Analisis HPP & Laba Bersih', checked: true },
      ],
      buttonText: currentTier === 'GROWTH' ? 'Paket Aktif saat Ini' : 'Pilih Paket Tumbuh',
      action: () => handleUpgrade('GROWTH'),
      disabled: currentTier === 'GROWTH',
      accent: 'indigo',
    },
    {
      name: 'ENTERPRISE',
      title: 'Paket Enterprise',
      price: 'Rp 349.000',
      period: '/ bulan',
      desc: 'Untuk usaha menengah-besar dengan banyak cabang tanpa batasan kuota.',
      features: [
        { text: 'Kapasitas Transaksi Tak Terbatas', checked: true },
        { text: 'Kapasitas Produk Tak Terbatas', checked: true },
        { text: 'Kapasitas Outlet Tak Terbatas', checked: true },
        { text: 'Kapasitas Staf Tak Terbatas', checked: true },
        { text: 'Manajemen Inventaris Lanjutan', checked: true },
        { text: 'Integrasi QRIS Otomatis Midtrans', checked: true },
        { text: 'Analisis HPP & Laba Bersih', checked: true },
      ],
      buttonText: currentTier === 'ENTERPRISE' ? 'Paket Aktif saat Ini' : 'Pilih Paket Enterprise',
      action: () => handleUpgrade('ENTERPRISE'),
      disabled: currentTier === 'ENTERPRISE',
      accent: 'emerald',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans transition-colors duration-150">
      <AppShellHeader
        title="Daftar Paket Langganan"
        subtitle="Pilih paket terbaik untuk kelangsungan bisnis Anda"
        icon={CreditCard}
        accent="indigo"
        user={user}
        onLogout={() => { logout(); navigate('/login'); }}
        showOutletSwitcher={false}
      />

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Tombol Kembali */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/admin/billing')}
            className="cursor-pointer flex items-center gap-2 text-xs font-bold text-slate-650 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Ringkasan Tagihan</span>
          </button>
        </div>

        {/* Loading Overlay */}
        {loading && !subscription && (
          <div className="h-96 w-full flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          </div>
        )}

        {subscription && (
          <div className="space-y-12">
            {/* Header section */}
            <div className="text-center max-w-2xl mx-auto space-y-4">
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                Fleksibilitas Paket Sesuai Kebutuhan Toko
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Tingkatkan efisiensi kasir dan pencatatan inventaris multi-cabang Anda. Mulai dengan gratis dan upgrade kapan saja seiring pertumbuhan usaha Anda.
              </p>
            </div>

            {/* Pricing cards grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch max-w-6xl mx-auto">
              {pricingTiers.map((tier) => {
                const isGrowth = tier.name === 'GROWTH';
                const isEnterprise = tier.name === 'ENTERPRISE';

                return (
                  <div
                    key={tier.name}
                    className={`flex flex-col bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 relative overflow-hidden transition-all duration-200 hover:-translate-y-1 shadow-sm hover:shadow-lg dark:hover:shadow-none backdrop-blur-sm ${
                      isGrowth ? 'ring-2 ring-indigo-500/50 dark:ring-indigo-400/50 dark:bg-indigo-950/5' : ''
                    }`}
                  >
                    {isGrowth && (
                      <div className="absolute top-4 right-4 px-3 py-1 bg-indigo-500/10 text-indigo-650 dark:text-indigo-350 border border-indigo-500/20 text-[9px] font-black uppercase tracking-wider rounded-full flex items-center gap-1">
                        <Zap className="w-2.5 h-2.5 fill-indigo-655" />
                        <span>Rekomendasi</span>
                      </div>
                    )}

                    <div className="space-y-4 mb-6">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        {tier.title}
                      </h3>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black text-slate-900 dark:text-white font-mono">
                          {tier.price}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                          {tier.period}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 min-h-[32px] leading-relaxed">
                        {tier.desc}
                      </p>
                    </div>

                    {/* Features list */}
                    <div className="space-y-4 flex-1 mb-8">
                      {tier.features.map((feat, fIdx) => (
                        <div key={fIdx} className="flex items-start gap-3 text-xs">
                          {feat.checked ? (
                            <div className={`flex-shrink-0 p-0.5 rounded-full mt-0.5 ${
                              isGrowth ? 'bg-indigo-500/10 text-indigo-650 dark:text-indigo-400' :
                              isEnterprise ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                              'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                            }`}>
                              <Check className="w-3.5 h-3.5" />
                            </div>
                          ) : (
                            <div className="flex-shrink-0 p-0.5 rounded-full mt-0.5 bg-rose-500/10 text-rose-505 dark:text-rose-400">
                              <X className="w-3.5 h-3.5" />
                            </div>
                          )}
                          <span className={feat.checked ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400 dark:text-slate-600 line-through'}>
                            {feat.text}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Action button */}
                    <button
                      onClick={tier.action}
                      disabled={tier.disabled || loading}
                      className={`w-full py-3.5 px-4 text-xs font-bold rounded-2xl transition-all cursor-pointer shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
                        tier.disabled
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-450 border border-slate-200 dark:border-slate-700 shadow-none'
                          : isGrowth
                          ? 'bg-indigo-600 hover:bg-indigo-700 text-white hover:shadow-indigo-500/10'
                          : isEnterprise
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white hover:shadow-emerald-500/10'
                          : 'bg-white hover:bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      {loadingTier === tier.name ? (
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Memproses...</span>
                        </div>
                      ) : (
                        <span>{tier.buttonText}</span>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* In-app security assurances */}
            <div className="max-w-3xl mx-auto p-6 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-3xl text-center shadow-sm backdrop-blur-sm">
              <div className="flex items-center justify-center gap-3 mb-2 text-indigo-650 dark:text-indigo-400">
                <ShieldCheck className="w-5 h-5" />
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Keamanan Transaksi Pembayaran
                </h4>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Pembayaran langganan diproses melalui{' '}
                <strong>Midtrans</strong>, gateway pembayaran resmi dengan standar keamanan PCI DSS.
                Seluruh data kartu dan informasi perbankan ditangani langsung oleh Midtrans—platform
                kami tidak menyimpan detail sensitif pembayaran di server.
                {!MIDTRANS_IS_PRODUCTION && (
                  <span className="block mt-1 text-slate-400 dark:text-slate-500">
                    Lingkungan saat ini: sandbox (uji coba).
                  </span>
                )}
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
