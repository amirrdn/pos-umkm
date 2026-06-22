import { ShoppingBag, Trash2, Minus, Plus } from 'lucide-react';
import type { CartItem } from '../../store/useCartStore';
import type { Product } from '../../hooks/usePos';

export interface PosCartItemListProps {
  cart: CartItem[];
  popularProducts?: Product[];
  onUpdateQuantity: (id: string, qty: number) => void;
  onRemoveFromCart: (id: string) => void;
  onAddPopularProduct?: (product: Omit<CartItem, 'quantity'>) => void;
}

export function PosCartItemList({
  cart,
  popularProducts = [],
  onUpdateQuantity,
  onRemoveFromCart,
  onAddPopularProduct,
}: PosCartItemListProps) {
  if (cart.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-12 px-4">
        <ShoppingBag className="h-16 w-16 text-slate-200 dark:text-slate-700 mb-4" />
        <p className="font-bold text-slate-600 dark:text-slate-400 text-base">Keranjang masih kosong</p>
        <p className="text-slate-500 dark:text-slate-500 text-sm mt-2 max-w-xs">
          Ketuk barang di katalog atau gunakan pencarian untuk menambah ke keranjang.
        </p>

        {popularProducts.length > 0 && onAddPopularProduct && (
          <div className="mt-6 w-full">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Cepat Tambah</p>
            <div className="flex flex-wrap justify-center gap-2">
              {popularProducts.slice(0, 4).map((product) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() =>
                    onAddPopularProduct({
                      productId: product.id,
                      name: product.name,
                      price: product.price,
                      sku: product.sku,
                      stock: product.stock,
                    })
                  }
                  className="cursor-pointer px-3 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-xs font-semibold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors"
                >
                  {product.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {cart.map((item) => (
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

          <div className="flex items-center gap-3 justify-between shrink-0 mt-2 xl:mt-0">
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => onUpdateQuantity(item.productId, item.quantity - 1)}
                className="cursor-pointer h-10 w-10 bg-white dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-300 shadow-sm active:scale-95 transition-all"
              >
                <Minus className="h-5 w-5" />
              </button>

              <input
                type="number"
                value={item.quantity}
                onChange={(e) => {
                  const val = e.target.value;
                  onUpdateQuantity(item.productId, val === '' ? 1 : Number(val));
                }}
                min={1}
                max={item.stock}
                className="w-14 text-center text-base font-bold text-slate-800 dark:text-slate-100 bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />

              <button
                type="button"
                onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)}
                disabled={item.quantity >= item.stock}
                className="cursor-pointer h-10 w-10 bg-white dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-300 shadow-sm active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => onRemoveFromCart(item.productId)}
              className="cursor-pointer text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-all shrink-0"
              title="Hapus barang"
            >
              <Trash2 className="h-6 w-6" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
