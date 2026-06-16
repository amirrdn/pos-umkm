import { useNavigate } from 'react-router-dom';
import { Store, TrendingUp, ShieldCheck, Layers, ArrowRight } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col justify-between">
      {/* Header */}
      <header className="max-w-7xl mx-auto w-full px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600 rounded-xl shadow-md shadow-indigo-500/20">
            <Store className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-black tracking-tight bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
            UMKM POS
          </span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/login')}
            className="text-sm font-semibold text-slate-300 hover:text-white transition-all"
          >
            Masuk
          </button>
          <button
            onClick={() => navigate('/register')}
            className="px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md shadow-indigo-500/25 transition-all"
          >
            Mulai Gratis
          </button>
        </div>
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
            className="w-full sm:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold rounded-2xl shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2 transition-all text-sm"
          >
            <span>Daftar Toko Sekarang</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate('/login')}
            className="w-full sm:w-auto px-8 py-4 bg-slate-900 hover:bg-slate-800 border border-slate-800 active:scale-95 text-slate-200 font-bold rounded-2xl transition-all text-sm"
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
      <footer className="border-t border-slate-900/80 py-8 text-center text-xs text-slate-600">
        <p>© 2026 UMKM POS Platform. Semua Hak Dilindungi Undang-Undang.</p>
      </footer>
    </div>
  );
}
