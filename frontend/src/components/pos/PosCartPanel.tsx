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
  debtFeatureEnabled: boolean;
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
  debtFeatureEnabled,
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
        <div className="py-3 px-4 sm:px-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center shrink-0">
          <h2 className="font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-indigo-600" />
            Keranjang Belanja
          </h2>
          <div className="flex items-center gap-2">
            <span className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
              {cartItemCount} Item
            </span>
            <button
              type="button"
              onClick={() => setShowCartPanel(false)}
              className="cursor-pointer lg:hidden p-1.5 rounded-lg text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Tutup keranjang"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Area Konten Scrollable: Daftar Barang & Form Input */}
        <div className="flex-1 overflow-y-auto">
          {/* Daftar Barang */}
          <div className="p-4 space-y-3 border-b border-slate-100 dark:border-slate-800">
            {cart.length > 0 ? (
              cart.map((item) => (
                <div
                  key={item.productId}
                  className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl group hover:border-indigo-100 dark:hover:border-indigo-900/40 hover:bg-indigo-50/10 dark:hover:bg-slate-800/60 transition-all"
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-slate-800 dark:text-slate-100 text-xs truncate leading-snug">
                      {item.name}
                    </h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">{item.sku}</p>
                    <p className="font-extrabold text-indigo-600 dark:text-indigo-400 text-xs mt-1.5">
                      Rp {item.price.toLocaleString('id-ID')}
                    </p>
                  </div>

                  {/* Kuantitas Control */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      className="cursor-pointer h-7 w-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all shadow-sm"
                    >
                      <Minus className="h-3.5 w-3.5" />
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
                      className="w-10 text-center text-xs font-bold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />

                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      disabled={item.quantity >= item.stock}
                      className="cursor-pointer h-7 w-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Hapus Item */}
                  <button
                    onClick={() => removeFromCart(item.productId)}
                    className="cursor-pointer text-slate-400 dark:text-slate-500 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-12 px-4">
                <ShoppingBag className="h-10 w-10 text-slate-200 dark:text-slate-700 mb-3" />
                <p className="font-bold text-slate-500 dark:text-slate-400 text-xs">Keranjang kosong</p>
                <p className="text-slate-400 dark:text-slate-500 text-[10px] mt-1">
                  Pilih produk di katalog untuk ditambahkan.
                </p>
              </div>
            )}
          </div>

          {/* Form Input Pembayaran */}
          <div className="p-4 bg-slate-50/50 dark:bg-slate-800/20 space-y-4">
            {/* Opsi Metode Pembayaran */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Metode Pembayaran
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('CASH')}
                  className={`cursor-pointer flex items-center justify-center gap-1 py-2 rounded-xl border text-[10px] font-bold transition-all ${
                    paymentMethod === 'CASH'
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-150'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <DollarSign className="h-3.5 w-3.5" />
                  Tunai
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('QRIS')}
                  className={`cursor-pointer flex items-center justify-center gap-1 py-2 rounded-xl border text-[10px] font-bold transition-all ${
                    paymentMethod === 'QRIS'
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-150'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <CreditCard className="h-3.5 w-3.5" />
                  QRIS
                </button>
                <button
                  type="button"
                  disabled={!selectedCustomer || !debtFeatureEnabled}
                  onClick={() => setPaymentMethod('DEBT')}
                  className={`cursor-pointer flex items-center justify-center gap-1 py-2 rounded-xl border text-[10px] font-bold transition-all ${
                    !selectedCustomer || !debtFeatureEnabled
                      ? 'bg-slate-100 dark:bg-slate-850/60 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-655 cursor-not-allowed opacity-50'
                      : paymentMethod === 'DEBT'
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-150'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                  title={
                    !debtFeatureEnabled
                      ? 'Fitur hutang tidak tersedia di paket Anda'
                      : !selectedCustomer
                      ? 'Pilih pelanggan terlebih dahulu untuk metode HUTANG'
                      : 'Metode Hutang'
                  }
                >
                  <Users className="h-3.5 w-3.5" />
                  Hutang
                </button>
              </div>
            </div>

            {/* Database Pelanggan & Membership */}
            <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide flex items-center gap-1">
                  <Users className="h-3 w-3 text-indigo-500" />
                  Pelanggan & Membership
                </span>
                {!selectedCustomer && (
                  <button
                    type="button"
                    onClick={() => setShowAddCustomerModal(true)}
                    className="cursor-pointer text-[9px] font-black text-indigo-600 dark:text-indigo-400 hover:text-indigo-850 dark:hover:text-indigo-300 uppercase tracking-wide flex items-center gap-0.5"
                  >
                    <Plus className="h-2.5 w-2.5" />
                    Pelanggan Baru
                  </button>
                )}
              </div>

              {selectedCustomer ? (
                <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900 rounded-xl p-2 flex justify-between items-start gap-1">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-indigo-950 dark:text-indigo-100">{selectedCustomer.name}</p>
                    {selectedCustomer.phone && (
                      <p className="text-[9px] text-slate-500 dark:text-slate-400 font-medium">{selectedCustomer.phone}</p>
                    )}
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[9px] bg-indigo-100/70 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-200 font-bold px-1.5 py-0.5 rounded">
                        {selectedCustomer.points} Pts
                      </span>
                      {Math.floor(grandTotal / 10000) > 0 && (
                        <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold">
                          +{Math.floor(grandTotal / 10000)} Pts Baru
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCustomer(null);
                      if (paymentMethod === 'DEBT') {
                        setPaymentMethod('CASH');
                      }
                    }}
                    className="cursor-pointer text-slate-400 hover:text-rose-600 p-0.5 transition-colors"
                    title="Lepas Tautan Pelanggan"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <div className="relative flex items-center">
                    <Search className="absolute left-3 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Cari nama / nomor telepon..."
                      value={customerQuery}
                      onChange={(e) => {
                        setCustomerQuery(e.target.value);
                        handleCustomerSearch(e.target.value);
                      }}
                      className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white dark:focus:bg-slate-900 transition-all"
                    />
                    {customerQuery && (
                      <button
                        type="button"
                        onClick={() => {
                          setCustomerQuery('');
                          setSearchResults([]);
                        }}
                        className="cursor-pointer absolute right-3 text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-bold"
                      >
                        Reset
                      </button>
                    )}
                  </div>

                  {/* Dropdown Hasil Pencarian */}
                  {searchResults.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                      {searchResults.map((cust) => (
                        <button
                          key={cust.id}
                          type="button"
                          onClick={() => {
                            setSelectedCustomer(cust);
                            setCustomerQuery('');
                            setSearchResults([]);
                          }}
                          className="cursor-pointer w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors flex items-center justify-between text-xs gap-2"
                        >
                          <div>
                            <p className="text-slate-800 dark:text-slate-100 font-bold">{cust.name}</p>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">{cust.phone || '-'}</p>
                          </div>
                          <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-md">
                            {cust.points} Pts
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Opsi Diskon & Pajak */}
            <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60 space-y-2">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  Diskon Belanja
                </span>
                <div className="flex gap-2">
                  <AppSelect
                    size="sm"
                    className="w-36 shrink-0"
                    value={discountType}
                    onChange={(v) => setDiscount(v as 'PERCENT' | 'NOMINAL', discountValue)}
                    searchable={false}
                    options={[
                      { value: 'NOMINAL', label: 'Nominal (Rp)' },
                      { value: 'PERCENT', label: 'Persentase (%)' },
                    ]}
                  />
                  <input
                    type="number"
                    value={discountValue || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setDiscount(discountType, val === '' ? 0 : Number(val));
                    }}
                    placeholder="Nilai potongan..."
                    className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between py-0.5">
                <label
                  htmlFor="tax-toggle"
                  className="text-[10px] font-black text-slate-500 dark:text-slate-400 cursor-pointer uppercase tracking-wide"
                >
                  Terapkan PPN (11%)
                </label>
                <input
                  id="tax-toggle"
                  type="checkbox"
                  checked={applyTax}
                  onChange={(e) => setApplyTax(e.target.checked)}
                  className="w-4.5 h-4.5 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Tagihan & Checkout (Fixed di Bawah) */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 space-y-3 shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
          {/* Ringkasan Harga */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-[11px] text-slate-500 dark:text-slate-400">
              <span>Subtotal</span>
              <span className="font-bold">Rp {subTotal.toLocaleString('id-ID')}</span>
            </div>

            {/* Baris Diskon jika ada */}
            {discountValue > 0 && (
              <div className="flex justify-between items-center text-[11px] text-rose-600">
                <span>Diskon {discountType === 'PERCENT' ? `(${discountValue}%)` : ''}</span>
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
              <div className="flex justify-between items-center text-[11px] text-amber-700 dark:text-amber-500">
                <span>PPN (11%)</span>
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

            <div className="flex justify-between items-center text-xs font-extrabold text-slate-800 dark:text-slate-100 pt-1 border-t border-slate-200/50 dark:border-slate-850">
              <span>Total Tagihan</span>
              <span className="text-indigo-600 dark:text-indigo-400 text-sm font-black">
                Rp {grandTotal.toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          {/* Tombol Checkout */}
          <button
            onClick={handleCheckout}
            disabled={cart.length === 0 || isSubmitting}
            className={`cursor-pointer w-full py-2.5 rounded-xl font-bold text-xs text-white flex items-center justify-center gap-1.5 shadow-lg transition-all ${
              cart.length === 0
                ? 'bg-slate-300 dark:bg-slate-800 text-slate-500 dark:text-slate-400 shadow-none cursor-not-allowed'
                : isSubmitting
                ? 'bg-indigo-500 cursor-wait'
                : 'bg-indigo-600 hover:bg-indigo-700 active:scale-99 shadow-indigo-200 dark:shadow-none'
            }`}
          >
            {isSubmitting ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : 'Selesaikan Transaksi (Checkout)'}
          </button>
        </div>
      </section>
    </>
  );
};
