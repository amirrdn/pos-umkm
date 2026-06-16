import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';
import { useReactToPrint } from 'react-to-print';
import { ReceiptTemplate } from './ReceiptTemplate';
import { API_BASE_URL } from '../config';
import {
  ShoppingBag,
  Package,
  BarChart2,
  History,
  Search,
  Printer,
  X,
  RefreshCw,
  LogOut,
  User,
  Eye,
  Calendar,
  CreditCard,
  Sun,
  Moon
} from 'lucide-react';

interface TransactionItem {
  id: string;
  productId: string;
  quantity: number;
  priceAtTransaction: number;
  subtotal: number;
  product: {
    name: string;
    sku: string;
  };
}

interface Transaction {
  id: string;
  invoiceNumber: string;
  grandTotal: number;
  status: string;
  createdAt: string;
  items: TransactionItem[];
  subTotal?: number;
  discount?: number;
  tax?: number;
  paymentMethod?: string;
  qrisUrl?: string | null;
  customer?: {
    id: string;
    name: string;
    phone?: string | null;
  } | null;
}

export const TransactionHistory: React.FC = () => {
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const { theme, toggleTheme } = useThemeStore();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  const componentRef = useRef<HTMLDivElement>(null);
  const pollingIntervalRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (selectedTransaction && selectedTransaction.status === 'PENDING' && selectedTransaction.paymentMethod === 'QRIS') {
      pollingIntervalRef.current = setInterval(async () => {
        try {
          const response = await fetch(`${API_BASE_URL}/api/transactions/status/${selectedTransaction.invoiceNumber}`, {
            headers: {
              'x-tenant-id': user?.tenantId || '',
              'Authorization': `Bearer ${token}`
            }
          });
          if (response.ok) {
            const resData = await response.json();
            if (resData.data?.status !== 'PENDING') {
              setSelectedTransaction(prev => {
                if (!prev) return null;
                return { ...prev, status: resData.data.status };
              });
              fetchHistory();
              if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
              }
            }
          }
        } catch (err) {
          console.error('Error polling status in history:', err);
        }
      }, 3000);
    } else {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    }
  }, [selectedTransaction]);

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
  });
  const fetchHistory = async () => {
    if (!token || !user?.tenantId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/transactions/history`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-tenant-id': user.tenantId
        }
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Gagal mengambil data riwayat transaksi.');
      }
      setTransactions(data.data || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Terjadi kesalahan saat menghubungi server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [token, user]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };
  const filteredTransactions = transactions.filter((tx) =>
    tx.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const getReceiptData = () => {
    if (!selectedTransaction) return null;
    return {
      invoiceNumber: selectedTransaction.invoiceNumber,
      createdAt: selectedTransaction.createdAt,
      grandTotal: selectedTransaction.grandTotal,
      paymentMethod: 'CASH',
      cashierName: user?.name,
      tenantName: user?.tenantId === 'tenant-uuid-xyz-123' ? 'Toko Utama' : 'UMKM POS',
      items: selectedTransaction.items.map(item => ({
        id: item.id,
        quantity: item.quantity,
        priceAtTransaction: Number(item.priceAtTransaction),
        subtotal: Number(item.subtotal),
        product: {
          name: item.product?.name || 'Produk',
          sku: item.product?.sku || ''
        }
      })),
      subTotal: selectedTransaction.subTotal ? Number(selectedTransaction.subTotal) : undefined,
      discount: selectedTransaction.discount ? Number(selectedTransaction.discount) : undefined,
      tax: selectedTransaction.tax ? Number(selectedTransaction.tax) : undefined,
    };
  };

  return (
    <div className="h-screen w-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans overflow-hidden transition-colors duration-150">

      {/* Template Struk Tersembunyi (hanya terlihat saat cetak) */}
      <div className="hidden print:block">
        <ReceiptTemplate ref={componentRef} transactionData={getReceiptData()} />
      </div>

      {/* Header Utama */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-md shadow-indigo-150">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100 leading-tight">UMKM POS</h1>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium tracking-wide uppercase">Riwayat Transaksi</p>
          </div>
        </div>

        {/* Menu Navigasi Global */}
        <nav className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => navigate('/pos')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-all"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            Kasir POS
          </button>
          <button
            onClick={() => navigate('/pos/history')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-indigo-600 text-white shadow-sm"
          >
            <History className="w-3.5 h-3.5" />
            Riwayat
          </button>
          <button
            onClick={() => navigate('/admin/products')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-all"
          >
            <Package className="w-3.5 h-3.5" />
            Master Produk
          </button>
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-all"
          >
            <BarChart2 className="w-3.5 h-3.5" />
            Dashboard
          </button>
        </nav>

        {/* Informasi Akun & Logout */}
        <div className="flex items-center gap-4">
          {/* Tombol Switcher Tema (Dark / Light) */}
          <button
            onClick={toggleTheme}
            type="button"
            className="p-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all duration-150 active:scale-95"
            title={theme === 'light' ? 'Mode Gelap' : 'Mode Terang'}
          >
            {theme === 'light' ? (
              <Moon className="h-4 w-4 text-slate-600" />
            ) : (
              <Sun className="h-4 w-4 text-amber-400" />
            )}
          </button>

          <div className="flex items-center gap-2.5 bg-slate-50 dark:bg-slate-800 px-3.5 py-1.5 rounded-xl border border-slate-100 dark:border-slate-700">
            <div className="bg-slate-200 dark:bg-slate-700 h-7 w-7 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300">
              <User className="w-4 h-4" />
            </div>
            <div className="text-left">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-none">{user?.name || 'User'}</p>
              <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                {user?.roles?.[0] || 'Staff'}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center p-2 rounded-xl text-slate-400 dark:text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-transparent hover:border-rose-100 transition-all"
            title="Keluar"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Konten Utama */}
      <main className="flex-1 overflow-hidden p-6 flex flex-col gap-6 bg-slate-50 dark:bg-slate-950">

        {/* Kontrol & Pencarian */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 shrink-0">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Cari berdasarkan nomor invoice..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>
          <button
            onClick={fetchHistory}
            disabled={loading}
            className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-200/60 dark:hover:bg-slate-700 active:scale-95 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 self-end sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Segarkan Data
          </button>
        </div>

        {/* Tabel Riwayat */}
        <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 py-20">
              <RefreshCw className="h-8 w-8 text-indigo-600 animate-spin" />
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Memuat riwayat transaksi...</p>
            </div>
          ) : error ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center py-20 px-6">
              <div className="bg-rose-50 text-rose-600 p-3 rounded-full border border-rose-100">
                <X className="h-6 h-6" />
              </div>
              <p className="text-xs font-bold text-rose-600">{error}</p>
              <button
                onClick={fetchHistory}
                className="bg-indigo-600 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-md"
              >
                Coba Lagi
              </button>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-20 px-6">
              <div className="bg-slate-50 dark:bg-slate-800 text-slate-400 p-4 rounded-full mb-3">
                <History className="h-8 w-8" />
              </div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Tidak ada transaksi ditemukan</p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Belum ada riwayat transaksi yang tercatat di tenant Anda.</p>
            </div>
          ) : (
            <div className="flex-1 overflow-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100 dark:border-slate-700">
                    <th className="py-4 px-6">Nomor Invoice</th>
                    <th className="py-4 px-6">Tanggal & Waktu</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6">Total Tagihan</th>
                    <th className="py-4 px-6 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-300">
                  {filteredTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-all">
                      <td className="py-4 px-6 font-bold text-slate-900 dark:text-slate-100 font-mono">{tx.invoiceNumber}</td>
                      <td className="py-4 px-6 text-slate-500 dark:text-slate-400">
                        {new Date(tx.createdAt).toLocaleString('id-ID')}
                      </td>
                      <td className="py-4 px-6">
                        {tx.status === 'COMPLETED' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black tracking-wide uppercase bg-emerald-50 text-emerald-800 border border-emerald-100">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600"></span>
                            COMPLETED
                          </span>
                        ) : tx.status === 'PENDING' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black tracking-wide uppercase bg-amber-50 text-amber-800 border border-amber-100">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                            PENDING
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black tracking-wide uppercase bg-rose-50 text-rose-800 border border-rose-100">
                            <span className="h-1.5 w-1.5 rounded-full bg-rose-500"></span>
                            VOID
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 font-black text-indigo-600 text-[13px]">
                        Rp {Number(tx.grandTotal).toLocaleString('id-ID')}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <button
                          type="button"
                          onClick={() => setSelectedTransaction(tx)}
                          className="inline-flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 border border-slate-200 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-800 text-slate-600 dark:text-slate-300 hover:text-indigo-800 dark:hover:text-indigo-400 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-97"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Detail / Cetak Ulang
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Modal Detail Transaksi & Cetak Ulang */}
      {selectedTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 dark:border-slate-800 flex flex-col transform transition-all duration-300 scale-100 animate-in fade-in zoom-in-95">

            {/* Header Modal */}
            <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-6 py-5 flex items-center justify-between text-white shrink-0">
              <div className="flex items-center gap-2.5">
                <History className="h-5 w-5 text-indigo-400" />
                <div>
                  <h3 className="text-sm font-black tracking-wide uppercase">Detail Transaksi</h3>
                  <p className="text-[10px] text-slate-300 font-mono mt-0.5">{selectedTransaction.invoiceNumber}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedTransaction(null)}
                className="text-slate-400 hover:text-white bg-slate-800/40 p-1.5 rounded-xl transition-all"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Konten Modal */}
            <div className="p-6 space-y-6 flex-1 overflow-auto max-h-[60vh] bg-white dark:bg-slate-900">

              {/* Ringkasan Modal */}
              <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700 space-y-2.5">
                <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Tanggal Transaksi</span>
                  <span className="font-bold text-slate-700 dark:text-slate-200">
                    {new Date(selectedTransaction.createdAt).toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1.5"><CreditCard className="w-3.5 h-3.5" /> Status Pembayaran</span>
                  <span className="font-bold uppercase">
                    {selectedTransaction.status === 'COMPLETED' ? (
                      <span className="text-emerald-600 font-extrabold">COMPLETED</span>
                    ) : selectedTransaction.status === 'PENDING' ? (
                      <span className="text-amber-500 font-extrabold animate-pulse">PENDING</span>
                    ) : (
                      <span className="text-rose-600 font-extrabold">VOID</span>
                    )}
                  </span>
                </div>

                {/* Customer */}
                <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> Pelanggan</span>
                  <span className="font-bold text-slate-700 dark:text-slate-200 text-right">
                    {selectedTransaction.customer ? (
                      <span className="flex flex-col items-end">
                        <span>{selectedTransaction.customer.name}</span>
                        {selectedTransaction.customer.phone && (
                          <span className="text-[10px] text-slate-400 font-normal">{selectedTransaction.customer.phone}</span>
                        )}
                      </span>
                    ) : (
                      <span className="text-slate-400 font-normal italic">Umum / Walk-in</span>
                    )}
                  </span>
                </div>

                <div className="border-t border-slate-200/60 dark:border-slate-700 pt-2.5 space-y-1.5">
                  {selectedTransaction.subTotal !== undefined && (
                    <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400">
                      <span>Subtotal</span>
                      <span className="font-bold text-slate-700">
                        Rp {Number(selectedTransaction.subTotal).toLocaleString('id-ID')}
                      </span>
                    </div>
                  )}
                  {selectedTransaction.discount !== undefined && Number(selectedTransaction.discount) > 0 && (
                    <div className="flex justify-between items-center text-xs text-rose-600">
                      <span>Diskon</span>
                      <span className="font-bold">
                        - Rp {Number(selectedTransaction.discount).toLocaleString('id-ID')}
                      </span>
                    </div>
                  )}
                  {selectedTransaction.tax !== undefined && Number(selectedTransaction.tax) > 0 && (
                    <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400">
                      <span>PPN (11%)</span>
                      <span className="font-bold text-slate-700">
                        Rp {Number(selectedTransaction.tax).toLocaleString('id-ID')}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-sm font-extrabold text-slate-800 dark:text-slate-100 pt-2 border-t border-dashed border-slate-200 dark:border-slate-700">
                    <span>Total Transaksi</span>
                    <span className="text-indigo-600 text-base">
                      Rp {Number(selectedTransaction.grandTotal).toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Box QRIS jika status masih PENDING dan menggunakan metode QRIS */}
              {selectedTransaction.status === 'PENDING' && selectedTransaction.paymentMethod === 'QRIS' && selectedTransaction.qrisUrl && (
                <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 flex flex-col items-center gap-3">
                  <div className="text-center">
                    <span className="text-[10px] font-black text-indigo-500 uppercase tracking-wider block">Scan QRIS untuk Melunasi</span>
                    <span className="text-lg font-black text-indigo-900 block mt-0.5">
                      Rp {Number(selectedTransaction.grandTotal).toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-indigo-100 shadow-sm flex items-center justify-center w-40 h-40">
                    <img
                      src={selectedTransaction.qrisUrl}
                      alt="QRIS Code"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-700">
                    <RefreshCw className="h-3 w-3 animate-spin" />
                    <span className="animate-pulse">Menunggu Pembayaran (Polling)...</span>
                  </div>
                </div>
              )}

              {/* Rincian Produk Belanja */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Daftar Produk Belanja</h4>
                <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-700">
                  {selectedTransaction.items.map((item) => (
                    <div key={item.id} className="p-4 flex items-center justify-between gap-4 bg-white dark:bg-slate-900 hover:bg-slate-50/30 dark:hover:bg-slate-800/30 transition-all">
                      <div className="space-y-1 min-w-0">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">{item.product?.name || 'Produk'}</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono tracking-wider">{item.product?.sku || 'SKU'}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-black text-slate-800 dark:text-slate-100">
                          Rp {Number(item.subtotal).toLocaleString('id-ID')}
                        </p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                          {item.quantity} x Rp {Number(item.priceAtTransaction).toLocaleString('id-ID')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer Modal / Tombol Aksi */}
            <div className="p-6 bg-slate-50 dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setSelectedTransaction(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-600 active:scale-97 transition-all shadow-sm"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => handlePrint()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-100 active:scale-97 transition-all"
              >
                <Printer className="h-4 w-4" />
                Cetak Ulang Struk
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
