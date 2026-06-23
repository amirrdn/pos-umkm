import React from 'react';
import { ShoppingBag, X, RefreshCw, AlertTriangle } from 'lucide-react';
import type { CartItem } from '../../store/useCartStore';
import type { Customer } from '../../store/useCustomerStore';
import type { Product } from '../../hooks/usePos';
import { PosCartItemList } from './PosCartItemList';
import { PosPaymentSheet } from './PosPaymentSheet';

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
  canCheckout: boolean;
  activeShift: boolean;
  popularProducts: Product[];
  onAddToCart: (product: Omit<CartItem, 'quantity'>) => void;
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
  canCheckout,
  activeShift,
  popularProducts,
  onAddToCart,
}) => {
  return (
    <>
      {showCartPanel && (
        <button
          type="button"
          aria-label="Tutup keranjang"
          onClick={() => setShowCartPanel(false)}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-[2px] lg:hidden cursor-pointer"
        />
      )}

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

        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <PosCartItemList
            cart={cart}
            popularProducts={popularProducts}
            onUpdateQuantity={updateQuantity}
            onRemoveFromCart={removeFromCart}
            onAddPopularProduct={onAddToCart}
          />

          {cart.length > 0 && (
            <PosPaymentSheet
              paymentMethod={paymentMethod}
              setPaymentMethod={setPaymentMethod}
              selectedCustomer={selectedCustomer}
              setSelectedCustomer={setSelectedCustomer}
              customerQuery={customerQuery}
              setCustomerQuery={setCustomerQuery}
              searchResults={searchResults}
              setSearchResults={setSearchResults}
              setShowAddCustomerModal={setShowAddCustomerModal}
              discountType={discountType}
              discountValue={discountValue}
              setDiscount={setDiscount}
              applyTax={applyTax}
              setApplyTax={setApplyTax}
            />
          )}
        </div>

        <div className="p-5 border-t-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 space-y-3 shadow-[0_-10px_20px_rgba(0,0,0,0.05)]">
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm text-slate-600 dark:text-slate-400">
              <span>Total Belanja</span>
              <span className="font-bold">Rp {subTotal.toLocaleString('id-ID')}</span>
            </div>

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

          {!activeShift && cart.length > 0 && (
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 text-xs font-medium bg-amber-50 dark:bg-amber-950/30 p-3 rounded-xl border border-amber-200 dark:border-amber-800">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>Buka shift terlebih dahulu untuk melakukan pembayaran.</span>
            </div>
          )}

          <button
            type="button"
            onClick={handleCheckout}
            disabled={!canCheckout}
            className={`cursor-pointer w-full py-4 rounded-2xl font-bold text-lg text-white flex items-center justify-center gap-2 shadow-lg transition-all ${
              !canCheckout
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
