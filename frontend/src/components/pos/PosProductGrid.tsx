import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, AlertTriangle, Package, Coffee, Plus } from 'lucide-react';
import type { Product } from '../../hooks/usePos';
import type { CartItem } from '../../store/useCartStore';
import { PosProductCardSkeleton } from './PosProductCardSkeleton';
import { PosQuickPickRow } from './PosQuickPickRow';

interface PosProductGridProps {
  loadingProducts: boolean;
  filteredProducts: Product[];
  recentProducts: Product[];
  categoriesList: string[];
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  inStockOnly: boolean;
  setInStockOnly: (val: boolean) => void;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  onSearchKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  addToCart: (product: Omit<CartItem, 'quantity'>) => void;
  getRemainingStock: (productId: string, originalStock: number) => number;
  hasProducts: boolean;
}

export const PosProductGrid: React.FC<PosProductGridProps> = ({
  loadingProducts,
  filteredProducts,
  recentProducts,
  categoriesList,
  selectedCategory,
  setSelectedCategory,
  searchQuery,
  setSearchQuery,
  inStockOnly,
  setInStockOnly,
  searchInputRef,
  onSearchKeyDown,
  addToCart,
  getRemainingStock,
  hasProducts,
}) => {
  const navigate = useNavigate();

  return (
    <section className="flex-1 lg:w-[65%] xl:w-[70%] h-full flex flex-col p-4 sm:p-6 lg:p-8 overflow-hidden min-h-0 pb-20 lg:pb-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 shrink-0 gap-4">
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory [-webkit-overflow-scrolling:touch] -mx-1 px-1">
          {categoriesList.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`cursor-pointer px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap snap-start shrink-0 shadow-sm ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setInStockOnly(!inStockOnly)}
            className={`cursor-pointer px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap snap-start shrink-0 shadow-sm ${
              inStockOnly
                ? 'bg-emerald-600 text-white'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
            }`}
          >
            Ada Stok
          </button>
        </div>

        <div className="relative w-full sm:w-72 lg:w-96 shrink-0">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Cari nama / SKU / scan barcode..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={onSearchKeyDown}
            className="w-full pl-11 pr-12 py-3 text-base bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
          />
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 hidden sm:flex items-center justify-center h-6 w-6 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-400 dark:text-slate-500 pointer-events-none select-none">
            /
          </div>
        </div>
      </div>

      {!loadingProducts && recentProducts.length > 0 && (
        <PosQuickPickRow
          products={recentProducts}
          getRemainingStock={getRemainingStock}
          onAddToCart={addToCart}
        />
      )}

      <div className="flex-1 overflow-y-auto pr-2">
        {loadingProducts ? (
          <PosProductCardSkeleton />
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
            {filteredProducts.map((product) => {
              const remainingStock = getRemainingStock(product.id, product.stock);
              const isOutOfStock = remainingStock <= 0;
              const isLowStock =
                !isOutOfStock && product.minStock > 0 && remainingStock < product.minStock;

              return (
                <div
                  key={product.id}
                  onClick={() =>
                    !isOutOfStock &&
                    addToCart({
                      productId: product.id,
                      name: product.name,
                      price: product.price,
                      sku: product.sku,
                      stock: product.stock,
                    })
                  }
                  className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-lg transition-all cursor-pointer group flex flex-col relative ${
                    isOutOfStock ? 'opacity-60 cursor-not-allowed' : ''
                  }`}
                >
                  <div className="h-32 sm:h-40 lg:h-48 w-full bg-slate-100 dark:bg-slate-800 overflow-hidden relative shrink-0">
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className="absolute top-2 left-2 bg-white/90 dark:bg-slate-900/80 text-slate-800 dark:text-slate-100 backdrop-blur-xs border border-slate-200/10 px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-sm">
                      {product.category}
                    </span>
                    {isLowStock && (
                      <span className="absolute top-2 right-2 bg-amber-500/10 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-sm backdrop-blur-xs">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        Mau Habis
                      </span>
                    )}
                    {!isOutOfStock && (
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          addToCart({
                            productId: product.id,
                            name: product.name,
                            price: product.price,
                            sku: product.sku,
                            stock: product.stock,
                          });
                        }}
                        className="cursor-pointer absolute bottom-2 right-2 h-9 w-9 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label={`Tambah ${product.name}`}
                      >
                        <Plus className="h-5 w-5" />
                      </button>
                    )}
                  </div>

                  <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                    <div>
                       <p className="text-xs font-bold text-slate-500 dark:text-slate-300">
                        Kode: {product.sku}
                      </p>
                      <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base mt-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {product.name}
                      </h3>
                    </div>

                    <div className="flex flex-col mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 gap-2">
                      <span className="font-black text-indigo-700 dark:text-indigo-400 text-xl">
                        Rp {product.price.toLocaleString('id-ID')}
                      </span>

                      <span
                        className={`text-sm font-bold flex items-center gap-1.5 ${
                          isOutOfStock
                            ? 'text-red-600 dark:text-red-400'
                            : isLowStock
                            ? 'text-amber-700 dark:text-amber-400'
                            : remainingStock <= 5
                            ? 'text-orange-600 dark:text-orange-400'
                            : 'text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        <Package className="h-4 w-4" />
                        {isOutOfStock ? 'Stok Habis' : `Sisa ${remainingStock}`}
                      </span>
                    </div>
                  </div>

                  {isOutOfStock && (
                    <div className="absolute inset-0 bg-white/70 dark:bg-slate-900/70 flex items-center justify-center">
                      <span className="bg-red-600 text-white px-4 py-2 rounded-xl font-bold shadow-lg">
                        Habis Terjual
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : !hasProducts ? (
          <div className="h-60 w-full flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-3xl bg-white dark:bg-slate-900 p-6 text-center">
            <Coffee className="h-16 w-16 text-slate-300 dark:text-slate-600 mb-4" />
            <p className="font-bold text-slate-700 dark:text-slate-200 text-lg">Barang Belum Ada</p>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 max-w-md">
              Toko kamu belum punya barang yang bisa dijual. Tambah barang di Master Produk.
            </p>
            <button
              type="button"
              onClick={() => navigate('/admin/products')}
              className="cursor-pointer mt-4 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold transition-colors"
            >
              Buka Master Produk
            </button>
          </div>
        ) : (
          <div className="h-60 w-full flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-3xl bg-white dark:bg-slate-900 p-6 text-center">
            <Search className="h-16 w-16 text-slate-300 dark:text-slate-600 mb-4" />
            <p className="font-bold text-slate-700 dark:text-slate-200 text-lg">Pencarian Tidak Ditemukan</p>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 max-w-md">
              Tidak ada barang yang cocok dengan kata kunci "{searchQuery}". Coba periksa ejaan atau gunakan kategori lain.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('SEMUA');
                setInStockOnly(false);
              }}
              className="cursor-pointer mt-4 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold transition-colors"
            >
              Bersihkan Pencarian
            </button>
          </div>
        )}
      </div>
    </section>
  );
};
