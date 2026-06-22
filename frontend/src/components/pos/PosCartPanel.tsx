import React from 'react';
import { ShoppingBag, X, Trash2, Minus, Plus, DollarSign, CreditCard, Users, Search, RefreshCw } from 'lucide-react';
import { AppSelect } from '../AppSelect';
import type { CartItem } from '../../store/useCartStore';
import type { Customer } from '../../store/useCustomerStore';

interface PosCartPanelProps {
  cart: CartItem[];
  cartItemCount: number;
  showCartPanel: boolean;
  setShowCartPanel: (val: boolean) => void;
  updateQuantity: (id: string, qty: number) => void;
  removeFromCart: (id: string) => void;
  paymentMethod: string;
  setPaymentMethod: (method: string) => void;
  selectedCustomer: Customer | null;
  setSelectedCustomer: (cust: Customer | null) => void;
  customerQuery: string;
  setCustomerQuery: (query: string) => void;
  searchResults: Customer[];
  setSearchResults: (results: Customer[]) => void;
  handleCustomerSearch: (query: string) => void;
  setShowAddCustomerModal: (val: boolean) => void;
  discountType: 'PERCENT' | 'NOMINAL';
  discountValue: number;
  setDiscount: (type: 'PERCENT' | 'NOMINAL', val: number) => void;
  applyTax: boolean;
  setApplyTax: (val: boolean) => void;
  subTotal: number;
  grandTotal: number;
  handleCheckout: () => void;
  isSubmitting: boolean;
}

export const PosCartPanel: React.FC<PosCartPanelProps> = ({
  cart,
  cartItemCount,
  showCartPanel,
  setShowCartPanel,
  updateQuantity,
  removeFromCart,
  paymentMethod,
  setPaymentMethod,
  selectedCustomer,
  setSelectedCustomer,
  customerQuery,
  setCustomerQuery,
  searchResults,
  setSearchResults,
  handleCustomerSearch,
  setShowAddCustomerModal,
  discountType,
  discountValue,
  setDiscount,
  applyTax,
  setApplyTax,
  subTotal,
  grandTotal,
  handleCheckout,
  isSubmitting,
}) => {
  return (
    <>
      {/* Backdrop keranjang mobile/tablet */}
      {showCartPanel && (
        <button
          type="button"
          aria-label="Tutup keranjang"
          onClick={() => setShowCartPanel(false)}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-[2px] lg:hidden cursor-pointer"
        />
      )}

      {/* KOLOM KANAN: Panel Keranjang Belanja */}
      <section
        className={`
          flex flex-col overflow-hidden bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xl
          h-full
          fixed inset-y-0 right-0 z-50 w-full max-w-md border-l
          transition-transform duration-300 ease-out lg:transition-none
          lg:static lg:z-10 lg:max-w-none lg:w-[35%] xl:w-[30%] lg:translate-x-0 lg:shadow-2xl
          ${showCartPanel ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Header Panel */}
        <div className="py-4 px-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center shrink-0 bg-white dark:bg-slate-900">
          <h2 className="font-bold text-slate-800 dark:text-slate-100 text-lg flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-indigo-600" />
            Daftar Belanjaan
          </h2>
          <div className="flex items-center gap-3">
            <span className="bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-xs font-bold px-3 py-1 rounded-full">
              {cartItemCount} Barang
            </span>
            <button
              type="button"
              onClick={() => setShowCartPanel(false)}
              className="cursor-pointer lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Tutup keranjang"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Area Konten Scrollable: Daftar Barang & Form Input */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          {/* Daftar Barang */}
          <div className="p-4 space-y-4 border-b border-slate-100 dark:border-slate-800">
            {cart.length > 0 ? (
              cart.map((item) => (
                <div
                  key={item.productId}
                  className="flex flex-col xl:flex-row xl:items-center gap-4 bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 p-4 rounded-xl shadow-sm hover:border-indigo-200 dark:hover:border-indigo-700 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm leading-snug truncate">
                      {item.name}
                    </h4>
                    <p className="font-black text-indigo-600 dark:text-indigo-400 text-base mt-1">
                      Rp {item.price.toLocaleString('id-ID')}
                    </p>
                  </div>

                  {/* Kuantitas Control (Tombol Raksasa) */}
                  <div className="flex items-center gap-3 justify-between shrink-0 mt-2 xl:mt-0">
                    <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        className="cursor-pointer h-10 w-10 bg-white dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-300 shadow-sm active:scale-95 transition-all"
                      >
                        <Minus className="h-5 w-5" />
                      </button>

                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => {
                          const val = e.target.value;
                          updateQuantity(item.productId, val === '' ? 1 : Number(val));
                        }}
                        min={1}
                        max={item.stock}
                        className="w-14 text-center text-base font-bold text-slate-800 dark:text-slate-100 bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />

                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        disabled={item.quantity >= item.stock}
                        className="cursor-pointer h-10 w-10 bg-white dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-300 shadow-sm active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Plus className="h-5 w-5" />
                      </button>
                    </div>

                    {/* Hapus Item */}
                    <button
                      onClick={() => removeFromCart(item.productId)}
                      className="cursor-pointer text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-all shrink-0"
                      title="Hapus barang"
                    >
                      <Trash2 className="h-6 w-6" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-16 px-4">
                <ShoppingBag className="h-16 w-16 text-slate-200 dark:text-slate-700 mb-4" />
                <p className="font-bold text-slate-600 dark:text-slate-400 text-base">Keranjang masih kosong</p>
                <p className="text-slate-500 dark:text-slate-500 text-sm mt-2">
                  Silakan pencet barang di sebelah kiri untuk menambah ke keranjang.
                </p>
              </div>
            )}
          </div>

          {/* Form Input Pembayaran */}
          <div className="p-5 bg-slate-50 dark:bg-slate-800/20 space-y-6">
            {/* Opsi Metode Pembayaran */}
            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-indigo-500" />
                Cara Pembayaran
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('CASH')}
                  className={`cursor-pointer flex flex-col items-center justify-center gap-2 py-4 rounded-xl border-2 text-sm font-bold transition-all ${
                    paymentMethod === 'CASH'
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200/50'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <DollarSign className="h-6 w-6" />
                  Tunai
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('QRIS')}
                  className={`cursor-pointer flex flex-col items-center justify-center gap-2 py-4 rounded-xl border-2 text-sm font-bold transition-all ${
                    paymentMethod === 'QRIS'
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200/50'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <CreditCard className="h-6 w-6" />
                  QRIS
                </button>
              </div>
            </div>

            {/* Database Pelanggan & Membership */}
            <div className="pt-5 border-t border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Users className="h-5 w-5 text-indigo-500" />
                  Nama Pembeli (Opsional)
                </label>
                {!selectedCustomer && (
                  <button
                    type="button"
                    onClick={() => setShowAddCustomerModal(true)}
                    className="cursor-pointer text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 flex items-center gap-1 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1.5 rounded-lg"
                  >
                    <Plus className="h-4 w-4" />
                    Baru
                  </button>
                )}
              </div>

              {selectedCustomer ? (
                <div className="bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 rounded-xl p-4 flex justify-between items-center">
                  <div>
                    <p className="text-base font-bold text-indigo-900 dark:text-indigo-100">{selectedCustomer.name}</p>
                    {selectedCustomer.phone && (
                      <p className="text-sm text-indigo-700 dark:text-indigo-300 mt-1">{selectedCustomer.phone}</p>
                    )}
                    <p className="text-sm font-bold text-indigo-800 dark:text-indigo-200 mt-2">
                      Poin: {selectedCustomer.points}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCustomer(null);
                    }}
                    className="cursor-pointer text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 p-3 rounded-xl transition-colors"
                    title="Ganti Pembeli"
                  >
                    <Trash2 className="h-6 w-6" />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <div className="relative flex items-center">
                    <Search className="absolute left-4 h-5 w-5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Ketik nama atau nomor HP pembeli..."
                      value={customerQuery}
                      onChange={(e) => {
                        setCustomerQuery(e.target.value);
                        handleCustomerSearch(e.target.value);
                      }}
                      className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
                    />
                    {customerQuery && (
                      <button
                        type="button"
                        onClick={() => {
                          setCustomerQuery('');
                          setSearchResults([]);
                        }}
                        className="cursor-pointer absolute right-4 text-sm text-slate-400 hover:text-slate-600 font-bold"
                      >
                        Batal
                      </button>
                    )}
                  </div>

                  {/* Dropdown Hasil Pencarian */}
                  {searchResults.length > 0 && (
                    <div className="absolute z-10 w-full mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                      {searchResults.map((cust) => (
                        <button
                          key={cust.id}
                          type="button"
                          onClick={() => {
                            setSelectedCustomer(cust);
                            setCustomerQuery('');
                            setSearchResults([]);
                          }}
                          className="cursor-pointer w-full text-left px-5 py-3 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors flex items-center justify-between border-b border-slate-100 dark:border-slate-800 last:border-0"
                        >
                          <div>
                            <p className="text-slate-800 dark:text-slate-100 font-bold text-sm">{cust.name}</p>
                            <p className="text-sm text-slate-500">{cust.phone || 'Tidak ada no. HP'}</p>
                          </div>
                          <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/40 px-3 py-1 rounded-lg">
                            {cust.points} Poin
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Opsi Diskon & Pajak */}
            <div className="pt-5 border-t border-slate-200 dark:border-slate-700 space-y-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  Ada Potongan Harga?
                </label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <AppSelect
                    size="md"
                    className="w-full sm:w-48 shrink-0"
                    value={discountType}
                    onChange={(v) => setDiscount(v as 'PERCENT' | 'NOMINAL', discountValue)}
                    searchable={false}
                    options={[
                      { value: 'NOMINAL', label: 'Rupiah (Rp)' },
                      { value: 'PERCENT', label: 'Persen (%)' },
                    ]}
                  />
                  <input
                    type="number"
                    value={discountValue || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setDiscount(discountType, val === '' ? 0 : Number(val));
                    }}
                    placeholder="Ketik jumlah potongan..."
                    className="flex-1 min-w-0 px-4 py-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-base font-bold text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-4 rounded-xl shadow-sm">
                <label
                  htmlFor="tax-toggle"
                  className="text-sm font-bold text-slate-700 dark:text-slate-300 cursor-pointer flex-1"
                >
                  Kena Pajak PPN (11%)
                </label>
                <input
                  id="tax-toggle"
                  type="checkbox"
                  checked={applyTax}
                  onChange={(e) => setApplyTax(e.target.checked)}
                  className="w-6 h-6 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Tagihan & Checkout (Fixed di Bawah) */}
        <div className="p-5 border-t-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 space-y-4 shadow-[0_-10px_20px_rgba(0,0,0,0.05)]">
          {/* Ringkasan Harga */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm text-slate-600 dark:text-slate-400">
              <span>Total Belanja</span>
              <span className="font-bold">Rp {subTotal.toLocaleString('id-ID')}</span>
            </div>

            {/* Baris Diskon jika ada */}
            {discountValue > 0 && (
              <div className="flex justify-between items-center text-sm text-red-600 font-medium">
                <span>Potongan {discountType === 'PERCENT' ? `(${discountValue}%)` : ''}</span>
                <span className="font-bold">
                  - Rp{' '}
                  {Math.min(
                    subTotal,
                    discountType === 'PERCENT' ? (subTotal * discountValue) / 100 : discountValue
                  ).toLocaleString('id-ID')}
                </span>
              </div>
            )}

            {/* Baris PPN jika ada */}
            {applyTax && (
              <div className="flex justify-between items-center text-sm text-orange-600 font-medium">
                <span>Pajak (11%)</span>
                <span className="font-bold">
                  Rp{' '}
                  {Math.max(
                    0,
                    (subTotal -
                      (discountType === 'PERCENT' ? (subTotal * discountValue) / 100 : discountValue)) *
                      0.11
                  ).toLocaleString('id-ID')}
                </span>
              </div>
            )}

            <div className="flex justify-between items-center pt-3 border-t border-slate-200 dark:border-slate-800">
              <span className="text-base font-bold text-slate-800 dark:text-slate-200">Total Tagihan</span>
              <span className="text-2xl font-black text-indigo-700 dark:text-indigo-400">
                Rp {grandTotal.toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          {/* Tombol Checkout */}
          <button
            onClick={handleCheckout}
            disabled={cart.length === 0 || isSubmitting}
            className={`cursor-pointer w-full py-4 rounded-2xl font-bold text-lg text-white flex items-center justify-center gap-2 shadow-lg transition-all ${
              cart.length === 0
                ? 'bg-slate-300 dark:bg-slate-700 text-slate-500 shadow-none cursor-not-allowed'
                : isSubmitting
                ? 'bg-indigo-400 cursor-wait'
                : 'bg-indigo-600 hover:bg-indigo-700 active:scale-95 shadow-indigo-300/50 dark:shadow-none'
            }`}
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="h-6 w-6 animate-spin" />
                Membayar...
              </>
            ) : (
              'Bayar Sekarang'
            )}
          </button>
        </div>
      </section>
    </>
  );
};
