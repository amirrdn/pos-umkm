import { useState } from 'react';
import { ChevronDown, ChevronUp, CreditCard, DollarSign, Plus, Search, Trash2, Users } from 'lucide-react';
import { AppSelect } from '../AppSelect';
import type { Customer } from '../../store/useCustomerStore';

export interface PosPaymentSheetProps {
  paymentMethod: string;
  setPaymentMethod: (method: string) => void;
  splitCashAmount?: number | '';
  setSplitCashAmount?: (val: number | '') => void;
  splitQrisAmount?: number | '';
  setSplitQrisAmount?: (val: number | '') => void;
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
}

export function PosPaymentSheet({
  paymentMethod,
  setPaymentMethod,
  splitCashAmount = '',
  setSplitCashAmount,
  splitQrisAmount = '',
  setSplitQrisAmount,
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
}: PosPaymentSheetProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <div className="p-5 bg-slate-50 dark:bg-slate-800/20 space-y-4 border-t border-slate-100 dark:border-slate-800">
      <div className="space-y-3">
        <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-indigo-500" />
          Cara Pembayaran
        </label>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setPaymentMethod('CASH')}
            className={`cursor-pointer flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl border-2 text-xs font-bold transition-all ${
              paymentMethod === 'CASH'
                ? 'bg-indigo-50 dark:bg-indigo-950/30 border-indigo-600 dark:border-indigo-500 text-indigo-700 dark:text-indigo-400'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
            }`}
          >
            <DollarSign className="h-4 w-4" />
            Tunai
          </button>
          <button
            type="button"
            onClick={() => setPaymentMethod('QRIS')}
            className={`cursor-pointer flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl border-2 text-xs font-bold transition-all ${
              paymentMethod === 'QRIS'
                ? 'bg-indigo-50 dark:bg-indigo-950/30 border-indigo-600 dark:border-indigo-500 text-indigo-700 dark:text-indigo-400'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
            }`}
          >
            <CreditCard className="h-4 w-4" />
            QRIS
          </button>
          <button
            type="button"
            onClick={() => setPaymentMethod('SPLIT')}
            className={`cursor-pointer flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl border-2 text-xs font-bold transition-all ${
              paymentMethod === 'SPLIT'
                ? 'bg-indigo-50 dark:bg-indigo-950/30 border-indigo-600 dark:border-indigo-500 text-indigo-700 dark:text-indigo-400'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
            }`}
          >
            <Plus className="h-4 w-4" />
            Campuran
          </button>
        </div>

        {paymentMethod === 'SPLIT' && (
          <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-indigo-200 dark:border-indigo-800/60 space-y-2.5">
            <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-400">Pembayaran Campuran (Split Payment)</p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">Nominal Tunai (Rp)</label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={splitCashAmount}
                  onChange={(e) => setSplitCashAmount?.(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">Nominal QRIS (Rp)</label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={splitQrisAmount}
                  onChange={(e) => setSplitQrisAmount?.(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-lg"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-3">
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
              <p className="text-sm font-bold text-indigo-900 dark:text-indigo-100">{selectedCustomer.name}</p>
              {selectedCustomer.phone && (
                <p className="text-xs text-indigo-700 dark:text-indigo-300 mt-1">{selectedCustomer.phone}</p>
              )}
              <p className="text-xs font-bold text-indigo-800 dark:text-indigo-200 mt-2">
                Poin: {selectedCustomer.points}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedCustomer(null)}
              className="cursor-pointer text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 p-2.5 rounded-xl transition-colors"
              title="Ganti Pembeli"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        ) : (
          <div className="relative">
            <div className="relative flex items-center">
              <Search className="absolute left-4 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama atau nomor HP pembeli..."
                value={customerQuery}
                onChange={(e) => setCustomerQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
              />
              {customerQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setCustomerQuery('');
                    setSearchResults([]);
                  }}
                  className="cursor-pointer absolute right-4 text-xs text-slate-400 hover:text-slate-600 font-bold"
                >
                  Batal
                </button>
              )}
            </div>

            {searchResults.length > 0 && (
              <div className="absolute z-20 w-full mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                {searchResults.map((cust) => (
                  <button
                    key={cust.id}
                    type="button"
                    onClick={() => {
                      setSelectedCustomer(cust);
                      setCustomerQuery('');
                      setSearchResults([]);
                    }}
                    className="cursor-pointer w-full text-left px-4 py-2.5 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors flex items-center justify-between border-b border-slate-100 dark:border-slate-800 last:border-0"
                  >
                    <div>
                      <p className="text-slate-800 dark:text-slate-100 font-semibold text-sm">{cust.name}</p>
                      <p className="text-xs text-slate-500">{cust.phone || 'Tidak ada no. HP'}</p>
                    </div>
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/40 px-2.5 py-1 rounded-lg">
                      {cust.points} Poin
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => setShowAdvanced((prev) => !prev)}
        className="cursor-pointer w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
      >
        <span>Diskon & PPN</span>
        {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {showAdvanced && (
        <div className="space-y-4 pt-1">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Ada Potongan Harga?</label>
              <div className="space-y-3">
                <AppSelect
                  size="md"
                  className="w-full"
                  value={discountType}
                  onChange={(v) => setDiscount(v as 'PERCENT' | 'NOMINAL', discountValue)}
                  searchable={false}
                  options={[
                    { value: 'NOMINAL', label: 'Rupiah (Rp)' },
                    { value: 'PERCENT', label: 'Persen (%)' },
                  ]}
                />
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400 pointer-events-none">
                    {discountType === 'NOMINAL' ? 'Rp' : '%'}
                  </span>
                  <input
                    type="number"
                    value={discountValue || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setDiscount(discountType, val === '' ? 0 : Number(val));
                    }}
                    placeholder={discountType === 'NOMINAL' ? 'Jumlah potongan' : 'Persentase diskon'}
                    className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
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
      )}
    </div>
  );
}
