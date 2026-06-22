import type { Product } from '../../hooks/usePos';

export interface PosQuickPickRowProps {
  products: Product[];
  getRemainingStock: (productId: string, originalStock: number) => number;
  onAddToCart: (product: Omit<import('../../store/useCartStore').CartItem, 'quantity'>) => void;
}

export function PosQuickPickRow({ products, getRemainingStock, onAddToCart }: PosQuickPickRowProps) {
  if (products.length === 0) {
    return null;
  }

  return (
    <div className="mb-4 shrink-0">
      <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
        Barang Terakhir
      </p>
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none snap-x">
        {products.map((product) => {
          const remaining = getRemainingStock(product.id, product.stock);
          const isOutOfStock = remaining <= 0;

          return (
            <button
              key={product.id}
              type="button"
              disabled={isOutOfStock}
              onClick={() =>
                onAddToCart({
                  productId: product.id,
                  name: product.name,
                  price: product.price,
                  sku: product.sku,
                  stock: product.stock,
                })
              }
              className="cursor-pointer snap-start shrink-0 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-left min-w-[120px] max-w-[180px]"
            >
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{product.name}</p>
              <p className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 mt-0.5">
                Rp {product.price.toLocaleString('id-ID')}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
