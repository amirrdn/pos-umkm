import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, TrendingUp, ShieldCheck, Layers, ArrowRight, Menu, X } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileMenuOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [mobileMenuOpen]);

  const goTo = (path: string) => {
    setMobileMenuOpen(false);
    navigate(path);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col justify-between">
      {/* Header */}
      <header className="relative z-40 max-w-7xl mx-auto w-full px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-6">
        <div className="flex items-center justify-between gap-3 min-w-0">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="cursor-pointer flex items-center gap-2 sm:gap-3 min-w-0 shrink"
            aria-label="UMKM POS beranda"
          >
            <div className="p-1.5 sm:p-2 bg-indigo-600 rounded-xl shadow-md shadow-indigo-500/20 shrink-0">
              <Store className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <span className="text-base sm:text-lg font-black tracking-tight bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent truncate">
              UMKM POS
            </span>
          </button>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-3 lg:gap-4 shrink-0" aria-label="Navigasi utama">
            <button
              type="button"
              onClick={() => navigate('/docs')}
              className="cursor-pointer text-sm font-semibold text-slate-400 hover:text-white transition-all px-2 py-1"
            >
              Dokumentasi
            </button>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="cursor-pointer text-sm font-semibold text-slate-300 hover:text-white transition-all px-2 py-1"
            >
              Masuk
            </button>
            <button
              type="button"
              onClick={() => navigate('/register')}
              className="cursor-pointer px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md shadow-indigo-500/25 transition-all"
            >
              Mulai Gratis
            </button>
          </nav>

          {/* Mobile / tablet actions */}
          <div className="flex md:hidden items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => navigate('/register')}
              className="cursor-pointer px-3 py-2 text-[11px] sm:text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md shadow-indigo-500/25 transition-all whitespace-nowrap"
            >
              Mulai Gratis
            </button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen((open) => !open)}
              className="cursor-pointer p-2 min-h-10 min-w-10 flex items-center justify-center rounded-xl border border-slate-800 text-slate-300 hover:bg-slate-900 transition-all"
              aria-label={mobileMenuOpen ? 'Tutup menu' : 'Buka menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu panel */}
        {mobileMenuOpen && (
          <>
            <button
              type="button"
              className="fixed inset-0 top-[57px] sm:top-[65px] bg-slate-950/70 backdrop-blur-sm md:hidden"
              aria-label="Tutup menu"
              onClick={() => setMobileMenuOpen(false)}
            />
            <nav
              className="md:hidden absolute left-3 right-3 sm:left-4 sm:right-4 top-full mt-2 rounded-2xl border border-slate-800 bg-slate-900/95 backdrop-blur-md shadow-2xl overflow-hidden z-50"
              aria-label="Menu navigasi"
            >
              <button
                type="button"
                onClick={() => goTo('/docs')}
                className="cursor-pointer w-full text-left px-4 py-3.5 text-sm font-semibold text-slate-300 hover:bg-slate-800/80 hover:text-white transition-all border-b border-slate-800/80"
              >
                Dokumentasi
              </button>
              <button
                type="button"
                onClick={() => goTo('/login')}
                className="cursor-pointer w-full text-left px-4 py-3.5 text-sm font-semibold text-slate-300 hover:bg-slate-800/80 hover:text-white transition-all border-b border-slate-800/80"
              >
                Masuk
              </button>
              <button
                type="button"
                onClick={() => goTo('/register')}
                className="cursor-pointer w-full text-left px-4 py-3.5 text-sm font-bold text-indigo-300 hover:bg-indigo-950/40 transition-all"
              >
                Daftar Toko Gratis
              </button>
            </nav>
          </>
        )}
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-12 md:py-24 flex flex-col items-center justify-center text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-slate-300 text-[10px] font-bold tracking-wider uppercase mb-6">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          Sistem Kasir Cloud Terpercaya & Canggih
        </div>

        <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white max-w-3xl leading-tight mb-6">
          Kelola Transaksi Toko Anda dengan{' '}
          <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
            Lebih Cepat & Praktis
          </span>
        </h1>

        <p className="text-slate-400 max-w-xl text-base md:text-lg mb-10 leading-relaxed">
          Aplikasi kasir (POS) modern berbasis cloud untuk UMKM di Indonesia. Tingkatkan penjualan, kelola stok otomatis, dan pantau omset real-time dari mana saja.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 justify-center">
          <button
            onClick={() => navigate('/register')}
            className="cursor-pointer w-full sm:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold rounded-2xl shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2 transition-all text-sm"
          >
            <span>Daftar Toko Sekarang</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate('/login')}
            className="cursor-pointer w-full sm:w-auto px-8 py-4 bg-slate-900 hover:bg-slate-800 border border-slate-800 active:scale-95 text-slate-200 font-bold rounded-2xl transition-all text-sm"
          >
            Buka Dashboard Kasir
          </button>
        </div>

        {/* Feature Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full mt-24 pt-12 border-t border-slate-900">
          {/* Feature 1 */}
          <div className="p-6 bg-slate-900/40 border border-slate-900 rounded-3xl text-left hover:border-slate-800 transition-all">
            <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-2xl w-fit mb-4">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Multi-Cabang & Outlet</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Keamanan data terjamin dengan teknologi cloud modern. Data transaksi dan stok toko Anda terisolasi aman secara mandiri.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="p-6 bg-slate-900/40 border border-slate-900 rounded-3xl text-left hover:border-slate-800 transition-all">
            <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-2xl w-fit mb-4">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Laporan Penjualan Real-time</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Pantau laporan transaksi harian dan bulanan secara visual dengan grafik interaktif langsung di dasbor admin Anda.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="p-6 bg-slate-900/40 border border-slate-900 rounded-3xl text-left hover:border-slate-800 transition-all">
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl w-fit mb-4">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Manajemen Stok & Produk</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Kelola data master barang secara dinamis. Peringatan stok kritis membantu toko Anda tidak pernah kehabisan barang.
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900/80 py-8 text-center text-xs text-slate-600 flex flex-col items-center gap-2">
        <p>© 2026 UMKM POS Platform. Semua Hak Dilindungi Undang-Undang.</p>
        <button
          onClick={() => navigate('/docs')}
          className="cursor-pointer text-[11px] text-indigo-400 hover:text-indigo-300 transition-all font-semibold hover:underline"
        >
          Lihat Dokumentasi Pengguna
        </button>
      </footer>
    </div>
  );
}
