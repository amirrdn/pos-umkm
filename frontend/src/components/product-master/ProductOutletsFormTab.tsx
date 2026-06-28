import { Store } from 'lucide-react';
import type { OutletSummary } from '../../types/productMaster';

export interface ProductOutletsFormTabProps {
  outlets: OutletSummary[];
  sellingPrice: number;
  overridePrices: Record<string, number | undefined>;
  setOverridePrices: React.Dispatch<React.SetStateAction<Record<string, number | undefined>>>;
  minStocks: Record<string, number>;
  setMinStocks: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  onSavePrice: (outletId: string, price: number | undefined) => void;
  onSaveMinStock: (outletId: string, minStock: number) => void;
}

export function ProductOutletsFormTab({
  outlets,
  sellingPrice,
  overridePrices,
  setOverridePrices,
  minStocks,
  setMinStocks,
  onSavePrice,
  onSaveMinStock,
}: ProductOutletsFormTabProps) {
  return (
    <div className="space-y-4">
      <p className="text-[11px] text-slate-500 dark:text-slate-400">
        Tentukan harga jual khusus dan batas limit stok minimum untuk masing-masing cabang. Jika harga khusus dikosongkan, sistem akan otomatis menggunakan harga jual utama (Rp {sellingPrice.toLocaleString('id-ID')}).
      </p>
      <div className="space-y-3">
        {outlets.map((outlet) => {
          const customPrice = overridePrices[outlet.id];
          const minStockVal = minStocks[outlet.id] ?? 0;

          return (
            <div key={outlet.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Store className="h-4 w-4 text-indigo-500" />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100">{outlet.name}</span>
                </div>
                <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase ${outlet.type === 'MAIN' ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'}`}>
                  {outlet.type === 'MAIN' ? 'Pusat' : 'Cabang'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Harga Jual Khusus</label>
                  <div className="flex gap-1.5">
                    <div className="relative flex-1">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">Rp</span>
                      <input
                        type="number"
                        placeholder="Gunakan harga utama"
                        value={customPrice === undefined ? '' : customPrice}
                        onChange={(e) => {
                          const val = e.target.value;
                          setOverridePrices({
                            ...overridePrices,
                            [outlet.id]: val === '' ? undefined : Number(val),
                          });
                        }}
                        className="w-full pl-7 pr-1.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-850 dark:text-slate-100"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => onSavePrice(outlet.id, customPrice)}
                      className="cursor-pointer px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-[10px] font-bold rounded-lg shadow-sm transition-all"
                    >
                      Simpan
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Limit Stok Minimum</label>
                  <div className="flex gap-1.5">
                    <input
                      type="number"
                      placeholder="0"
                      value={minStockVal}
                      onChange={(e) => {
                        setMinStocks({
                          ...minStocks,
                          [outlet.id]: Number(e.target.value),
                        });
                      }}
                      className="flex-1 px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-850 dark:text-slate-100"
                    />
                    <button
                      type="button"
                      onClick={() => onSaveMinStock(outlet.id, minStockVal)}
                      className="cursor-pointer px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-[10px] font-bold rounded-lg shadow-sm transition-all"
                    >
                      Simpan
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
