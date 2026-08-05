import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  ArrowLeft,
  Key,
  ShoppingBag,
  Store,
  CreditCard,
  Monitor,
  Package,
  ChevronRight,
  Search,
  CheckCircle,
  HelpCircle,
  AlertCircle,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import { usePageSeo } from '../hooks/usePageSeo';
import { PAGE_SEO } from '../utils/pageSeo';

interface DocSection {
  id: string;
  title: string;
  icon: LucideIcon;
  category: string;
  content: React.ReactNode;
}

export default function UserDocumentation() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('getting-started');
  const [searchQuery, setSearchQuery] = useState('');

  usePageSeo(PAGE_SEO.docs);

  const sections: DocSection[] = [
    {
      id: 'getting-started',
      title: 'Pendaftaran & Akses Masuk',
      icon: Key,
      category: 'Memulai',
      content: (
        <div className="space-y-6">
          <p className="text-sm text-slate-300 leading-relaxed">
            Untuk mulai menggunakan SaaSPOS, Anda dapat mendaftarkan toko baru Anda secara gratis dalam beberapa langkah mudah:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/30 space-y-3">
              <span className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider bg-indigo-500/10 text-indigo-400 rounded-md border border-indigo-500/20">Langkah 1</span>
              <h4 className="text-xs font-bold text-white">Daftar Akun Baru</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Klik tombol <strong>Mulai Gratis</strong> di halaman utama. Isi data diri Anda, nama toko yang ingin dibuat, alamat email aktif, dan kata sandi Anda.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/30 space-y-3">
              <span className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider bg-indigo-500/10 text-indigo-400 rounded-md border border-indigo-500/20">Langkah 2</span>
              <h4 className="text-xs font-bold text-white">Verifikasi Email</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Periksa kotak masuk email yang Anda daftarkan. Klik tautan verifikasi yang kami kirimkan untuk mengaktifkan akun toko dan tenant Anda secara aman.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/30 space-y-3">
              <span className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider bg-indigo-500/10 text-indigo-400 rounded-md border border-indigo-500/20">Langkah 3</span>
              <h4 className="text-xs font-bold text-white">Masuk Aplikasi</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Buka halaman masuk, masukkan email serta kata sandi Anda. Anda akan langsung dialihkan ke dashboard utama atau terminal kasir POS.
              </p>
            </div>
          </div>

          <div className="p-5 rounded-2xl border border-indigo-500/10 bg-indigo-550/5 text-xs text-indigo-300 space-y-2 leading-relaxed">
            <h4 className="font-bold flex items-center gap-2 text-indigo-400">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              Peran Akun Pengguna (Role)
            </h4>
            <p>
              Setiap toko memiliki peran pengguna yang terbagi menjadi <strong>Owner (Pemilik Toko)</strong> dengan hak akses penuh ke seluruh pengaturan, laporan finansial, dan billing, serta <strong>Kasir/Karyawan</strong> dengan hak akses terbatas yang didesain khusus untuk transaksi kasir di terminal POS saja.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'terminal-pos',
      title: 'Terminal Kasir & Transaksi',
      icon: ShoppingBag,
      category: 'Operasional',
      content: (
        <div className="space-y-6">
          <p className="text-sm text-slate-300 leading-relaxed">
            Modul Point of Sale (POS) didesain sangat responsif dan aman menggunakan arsitektur penanganan stok real-time (ACID transaction) untuk memastikan integritas data penjualan di toko Anda.
          </p>

          <div className="space-y-5">
            <div className="flex gap-4">
              <div className="h-7 w-7 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-black shrink-0 mt-0.5">1</div>
              <div>
                <h4 className="text-sm font-bold text-white mb-1">Membuka Shift Kasir</h4>
                <p className="text-xs text-slate-400 leading-relaxed">Saat pertama kali masuk ke menu POS, kasir wajib memasukkan jumlah uang modal awal laci kasir. Transaksi tidak dapat berjalan jika shift kas belum dibuka.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="h-7 w-7 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-black shrink-0 mt-0.5">2</div>
              <div>
                <h4 className="text-sm font-bold text-white mb-1">Menyusun Keranjang Belanja</h4>
                <p className="text-xs text-slate-400 leading-relaxed">Cari produk berdasarkan nama atau SKU, lalu klik produk untuk memasukkannya ke dalam keranjang belanja. Jumlah stok produk selalu disinkronkan secara real-time berdasarkan outlet aktif kasir yang bertugas.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="h-7 w-7 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-black shrink-0 mt-0.5">3</div>
              <div>
                <h4 className="text-sm font-bold text-white mb-1">Melakukan Checkout Penjualan</h4>
                <p className="text-xs text-slate-400 leading-relaxed">Klik tombol bayar di keranjang belanja, kemudian pilih metode pembayaran yang sesuai dan selesaikan transaksi penjualan.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="h-7 w-7 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-black shrink-0 mt-0.5">4</div>
              <div>
                <h4 className="text-sm font-bold text-white mb-1">Penutupan Shift & Rekonsiliasi</h4>
                <p className="text-xs text-slate-400 leading-relaxed">Kasir wajib mencatat jumlah uang fisik aktual di laci kas saat pergantian shift atau tutup toko. Sistem mendeteksi otomatis jika ada selisih uang (selisih lebih/kurang) untuk laporan audit pemilik.</p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'payment-flow',
      title: 'Metode Pembayaran & QRIS',
      icon: CreditCard,
      category: 'Operasional',
      content: (
        <div className="space-y-6">
          <p className="text-sm text-slate-300 leading-relaxed">
            Platform mendukung berbagai metode checkout pembayaran yang dapat disesuaikan dengan preferensi pelanggan Anda:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/10 space-y-2">
              <span className="text-lg">💰</span>
              <h4 className="text-xs font-bold text-white">Tunai (Cash)</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Metode pembayaran tunai konvensional. Kasir memasukkan nominal uang yang diterima dari pelanggan untuk menghitung kembalian uang laci kasir secara otomatis.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/10 space-y-2">
              <span className="text-lg">📱</span>
              <h4 className="text-xs font-bold text-indigo-400">QRIS Dinamis</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Menghasilkan kode QR otomatis. Status pembayaran terintegrasi langsung dengan payment gateway. Kasir tidak perlu konfirmasi manual; sistem mendeteksi pelunasan secara real-time.
              </p>
            </div>

          </div>
        </div>
      )
    },
    {
      id: 'multi-outlet',
      title: 'Multi-Outlet (Cabang)',
      icon: Store,
      category: 'Operasional',
      content: (
        <div className="space-y-6">
          <p className="text-sm text-slate-300 leading-relaxed">
            SaaSPOS mendukung pengelolaan operasional cabang/outlet dalam jumlah banyak secara terpusat untuk ekspansi bisnis Anda dengan aman.
          </p>

          <div className="space-y-4">
            <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/20 space-y-2.5">
              <h4 className="text-xs font-bold text-white flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-indigo-400" />
                Isolasi Data Cabang
              </h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Stok produk, penugasan karyawan/staf, transaksi kasir, dan kas laci kasir sepenuhnya diisolasi per outlet. Kasir yang ditugaskan ke Cabang A hanya dapat melakukan penjualan stok fisik milik Cabang A.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/20 space-y-2.5">
              <h4 className="text-xs font-bold text-white flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-indigo-400" />
                Global Switcher (Owner & Manager)
              </h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Khusus untuk peran Owner dan Manager, tersedia dropdown <strong>Outlet Switcher</strong> di bilah navigasi atas (header). Anda dapat berpindah konteks dari satu cabang ke cabang lainnya untuk memantau performa penjualan secara instan.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/20 space-y-2.5">
              <h4 className="text-xs font-bold text-white flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-indigo-400" />
                Harga Jual Kustom per Lokasi
              </h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Sistem memungkinkan Anda untuk menetapkan harga jual barang yang berbeda-beda di masing-masing cabang untuk mengadaptasi daya beli lokal.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'inventory-cogs',
      title: 'Inventaris & Perhitungan Laba',
      icon: Package,
      category: 'Analitik',
      content: (
        <div className="space-y-6">
          <p className="text-sm text-slate-300 leading-relaxed">
            SaaSPOS merekam keuntungan bersih toko Anda secara akurat berdasarkan metode <strong>HPP (Harga Pokok Penjualan) / COGS</strong>.
          </p>

          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-indigo-400">Prinsip Perhitungan Keuntungan:</h4>

            <div className="relative border-l-2 border-slate-800 pl-6 space-y-6 ml-2">
              <div className="relative">
                <span className="absolute -left-[31px] top-1 h-2.5 w-2.5 rounded-full bg-indigo-500 ring-4 ring-indigo-950"></span>
                <h5 className="text-xs font-bold text-white">1. Pengisian Harga Beli Produk</h5>
                <p className="text-[11px] text-slate-400 mt-1">Saat meregistrasikan produk baru di master barang, Anda wajib menginput nilai **Harga Beli (Modal)** dan **Harga Jual (Retail)**.</p>
              </div>

              <div className="relative">
                <span className="absolute -left-[31px] top-1 h-2.5 w-2.5 rounded-full bg-indigo-500 ring-4 ring-indigo-950"></span>
                <h5 className="text-xs font-bold text-white">2. Snapshot HPP Detik Transaksi</h5>
                <p className="text-[11px] text-slate-400 mt-1">Ketika kasir memproses checkout penjualan, sistem mencatat snapshot harga beli saat itu sebagai HPP pesanan. Hal ini memastikan bahwa perubahan harga modal di masa depan tidak akan memengaruhi data keuntungan transaksi historis.</p>
              </div>

              <div className="relative">
                <span className="absolute -left-[31px] top-1 h-2.5 w-2.5 rounded-full bg-indigo-500 ring-4 ring-indigo-950"></span>
                <h5 className="text-xs font-bold text-white">3. Analitik Laba Bersih Real-Time</h5>
                <p className="text-[11px] text-slate-400 mt-1">Dashboard Admin menampilkan visualisasi diagram Omset vs Laba Bersih (Omset Kotor dikurangi nominal snapshot HPP transaksi tersebut) agar performa margin toko terlihat sangat presisi.</p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'saas-billing',
      title: 'Sistem Langganan SaaS & Limit',
      icon: CreditCard,
      category: 'Administrasi',
      content: (
        <div className="space-y-6">
          <p className="text-sm text-slate-300 leading-relaxed">
            SaaSPOS membagi tingkat layanan toko menjadi tiga jenis paket berlangganan dengan limitasi kuota data yang dikontrol secara ketat:
          </p>

          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-indigo-400">Limitasi & Skema Fitur Paket:</h4>

            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/20">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900/60 border-b border-slate-800 text-slate-200">
                    <th className="p-3.5 font-bold">Fitur / Limit</th>
                    <th className="p-3.5 font-bold text-slate-400">FREE</th>
                    <th className="p-3.5 font-bold text-indigo-400">GROWTH</th>
                    <th className="p-3.5 font-bold text-emerald-400">ENTERPRISE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900 text-slate-400">
                  <tr>
                    <td className="p-3.5 font-semibold text-slate-300">Biaya Tagihan</td>
                    <td className="p-3.5">Rp 0</td>
                    <td className="p-3.5 font-mono text-slate-200">Rp 149.000 / bln</td>
                    <td className="p-3.5 font-mono text-slate-200">Rp 349.000 / bln</td>
                  </tr>
                  <tr>
                    <td className="p-3.5 font-semibold text-slate-300">Batas Transaksi</td>
                    <td className="p-3.5">150 / bulan</td>
                    <td className="p-3.5">3.000 / bulan</td>
                    <td className="p-3.5 text-emerald-400 font-bold">Tanpa Batas</td>
                  </tr>
                  <tr>
                    <td className="p-3.5 font-semibold text-slate-300">Kapasitas Produk</td>
                    <td className="p-3.5">30 SKU</td>
                    <td className="p-3.5">500 SKU</td>
                    <td className="p-3.5 text-emerald-400 font-bold">Tanpa Batas</td>
                  </tr>
                  <tr>
                    <td className="p-3.5 font-semibold text-slate-300">Jumlah Outlet</td>
                    <td className="p-3.5">1 (Pusat saja)</td>
                    <td className="p-3.5">3 Outlet</td>
                    <td className="p-3.5 text-emerald-400 font-bold">Tanpa Batas</td>
                  </tr>
                  <tr>
                    <td className="p-3.5 font-semibold text-slate-300">Jumlah Karyawan</td>
                    <td className="p-3.5">2 Staf</td>
                    <td className="p-3.5">5 Staf</td>
                    <td className="p-3.5 text-emerald-400 font-bold">Tanpa Batas</td>
                  </tr>
                  <tr>
                    <td className="p-3.5 font-semibold text-slate-300">Modul QRIS & HPP</td>
                    <td className="p-3.5 text-rose-500">❌ Tidak Ada</td>
                    <td className="p-3.5 text-emerald-400">✔️ Tersedia</td>
                    <td className="p-3.5 text-emerald-400">✔️ Tersedia</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="p-5 rounded-2xl border border-amber-500/10 bg-amber-550/5 space-y-2">
              <h4 className="text-xs font-bold text-amber-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                Mekanisme Graceful Downgrade
              </h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Jika paket berbayar Anda berakhir atau Anda mengajukan downgrade ke paket FREE, **sistem tidak akan pernah menghapus data penting Anda**. Melainkan sistem menerapkan pembatasan bertahap yang aman:
              </p>
              <ul className="list-disc pl-5 text-[10.5px] text-slate-400 space-y-1 mt-1.5">
                <li>Seluruh outlet cabang tambahan otomatis dinonaktifkan (`isActive = false`).</li>
                <li>Hanya 2 akun staf terlama yang tetap berstatus `APPROVED`, sementara staf selebihnya otomatis diubah menjadi `PENDING` (tidak dapat masuk kasir).</li>
                <li>Seluruh katalog produk di atas batas 30 SKU tetap disimpan aman, namun Anda tidak diperkenankan menambah produk baru sebelum produk lama dihapus/diarsipkan di bawah 30 SKU.</li>
              </ul>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'customer-display',
      title: 'Layar Tampilan Pelanggan',
      icon: Monitor,
      category: 'Administrasi',
      content: (
        <div className="space-y-6">
          <p className="text-sm text-slate-300 leading-relaxed">
            Platform mendukung antarmuka monitor kedua khusus yang menghadap ke arah pelanggan (Customer Display) agar transaksi terasa transparan dan profesional.
          </p>

          <div className="space-y-4">
            <div className="flex gap-4 items-start p-5 rounded-2xl border border-slate-800 bg-slate-900/20">
              <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl shrink-0">
                <Monitor className="w-5 h-5" />
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-bold text-white">Cara Menghubungkan Layar Kedua:</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Pada monitor eksternal/layar kedua kasir Anda, buka alamat publik berikut (tidak membutuhkan login apa pun):
                </p>
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-900 font-mono text-[11px] text-indigo-300 w-fit my-2 px-3 py-1.5 rounded-lg border border-slate-850">
                  /customer-display
                </div>
                <p className="text-xs text-slate-450 dark:text-slate-400 leading-relaxed">
                  Layar ini akan mendengarkan pembaruan state keranjang transaksi kasir secara real-time. Ketika kasir menambahkan barang ke keranjang di terminal utama, monitor kedua akan menampilkan daftar belanja pelanggan beserta kode QRIS dinamis pembayaran pada saat checkout.
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    }
  ];

  const filteredSections = sections.filter(
    (sec) =>
      sec.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sec.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeSectionData = sections.find((sec) => sec.id === activeSection);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col justify-between selection:bg-indigo-500/30">

      <header className="border-b border-slate-900 bg-slate-950/70 backdrop-blur-md sticky top-0 z-50 shrink-0">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="cursor-pointer p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-all active:scale-95 flex items-center justify-center"
              title="Kembali ke Landing Page"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-400" />
              <h1 className="text-sm font-black tracking-tight text-white uppercase tracking-wider">Dokumentasi Pengguna</h1>
            </div>
          </div>
          <button
            onClick={() => navigate('/login')}
            className="cursor-pointer py-2 px-5 text-xs font-bold rounded-xl bg-indigo-650 hover:bg-indigo-600 active:bg-indigo-700 text-white shadow-md shadow-indigo-500/10 active:scale-95 transition-all border border-indigo-500/35"
          >
            Masuk Kasir
          </button>
        </div>
      </header>

      <div className="flex-1 max-w-7xl mx-auto w-full px-6 py-8 flex flex-col md:flex-row gap-8 overflow-hidden">

        <aside className="w-full md:w-80 shrink-0 space-y-6">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-550" />
            <input
              type="text"
              placeholder="Cari panduan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 text-xs bg-slate-900/80 border border-slate-850 text-slate-200 placeholder-slate-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-550 transition-all shadow-inner"
            />
          </div>

          <div className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-500 px-3">Topik Panduan</h3>

            <nav className="space-y-1.5 max-h-[50vh] md:max-h-none overflow-y-auto pr-1">
              {filteredSections.map((sec) => {
                const Icon = sec.icon;
                const isActive = activeSection === sec.id;

                return (
                  <button
                    key={sec.id}
                    onClick={() => setActiveSection(sec.id)}
                    className={`cursor-pointer w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-left transition-all ${isActive
                      ? 'bg-indigo-600/90 text-white shadow-lg shadow-indigo-650/20 font-bold border-l-4 border-indigo-400'
                      : 'text-slate-400 hover:bg-slate-900/40 hover:text-slate-200 border-l-4 border-transparent'
                      }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                      <span className="text-xs truncate">{sec.title}</span>
                    </div>
                    <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isActive ? 'translate-x-0.5 text-white' : 'text-slate-600 opacity-60'}`} />
                  </button>
                );
              })}

              {filteredSections.length === 0 && (
                <div className="p-6 text-center text-xs text-slate-550 border border-dashed border-slate-800 rounded-xl">
                  Topik tidak ditemukan.
                </div>
              )}
            </nav>
          </div>
        </aside>

        <main className="flex-1 bg-slate-900/20 border border-slate-900 rounded-3xl p-6 md:p-8 backdrop-blur-sm overflow-y-auto">
          {activeSectionData ? (
            <div className="space-y-6">
              <div className="flex items-center gap-4 border-b border-slate-900 pb-5">
                <div className="p-3.5 bg-indigo-500/10 text-indigo-400 rounded-2xl border border-indigo-500/20">
                  {(() => {
                    const Icon = activeSectionData.icon;
                    return <Icon className="w-6 h-6" />;
                  })()}
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-indigo-400">{activeSectionData.category}</span>
                  <h2 className="text-xl md:text-2xl font-black text-white leading-tight mt-1">{activeSectionData.title}</h2>
                </div>
              </div>

              <div className="prose prose-invert max-w-none">
                {activeSectionData.content}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 py-12">
              <HelpCircle className="w-12 h-12 mb-3 opacity-30 animate-pulse text-indigo-500" />
              <p className="text-xs">Silakan pilih topik di menu sebelah kiri untuk membaca panduan.</p>
            </div>
          )}
        </main>
      </div>

      <footer className="border-t border-slate-900/80 py-6 text-center text-[10px] text-slate-650 shrink-0">
        <p>© 2026 UMKM POS Platform. Semua Hak Dilindungi Undang-Undang.</p>
      </footer>
    </div>
  );
}
