import React from 'react';
import { Search, RefreshCw, AlertTriangle, Package, Coffee } from 'lucide-react';
import type { Product } from '../../hooks/usePos';
import type { CartItem } from '../../store/useCartStore';

interface PosProductGridProps {
  loadingProducts: boolean;
  filteredProducts: Product[];
  categoriesList: string[];
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  addToCart: (product: Omit<CartItem, 'quantity'>) => void;
  getRemainingStock: (productId: string, originalStock: number) => number;
}

export const PosProductGrid: React.FC<PosProductGridProps> = ({
  loadingProducts,
  filteredProducts,
  categoriesList,
  selectedCategory,
  setSelectedCategory,
  searchQuery,
  setSearchQuery,
  addToCart,
  getRemainingStock,
}) => {
  return (
    <section className="flex-1 lg:w-[65%] xl:w-[70%] h-full flex flex-col p-3 sm:p-4 lg:p-6 overflow-hidden min-h-0 pb-20 lg:pb-6">
      {/* Filter Kategori & Pencarian */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 shrink-0 gap-3 sm:gap-4">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none snap-x snap-mandatory [-webkit-overflow-scrolling:touch] -mx-1 px-1">
          {categoriesList.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`cursor-pointer px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap snap-start shrink-0 ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-150'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Kolom Pencarian */}
        <div className="relative w-full sm:w-64 lg:w-80 shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari SKU atau nama produk..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
          />
        </div>
      </div>

      {/* Grid Katalog Produk */}
      <div className="flex-1 overflow-y-auto pr-2">
        {loadingProducts ? (
          <div className="h-60 w-full flex flex-col items-center justify-center">
            <RefreshCw className="h-10 w-10 text-indigo-600 animate-spin mb-3" />
            <p className="text-sm font-semibold text-slate-500">Loading produk...</p>
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
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
                  className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-800/80 transition-all cursor-pointer group flex flex-col relative ${
                    isOutOfStock ? 'opacity-60 cursor-not-allowed' : ''
                  }`}
                >
                  {/* Gambar Produk */}
                  <div className="h-28 sm:h-36 lg:h-44 w-full bg-slate-100 dark:bg-slate-800 overflow-hidden relative shrink-0">
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className="absolute top-2 left-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm px-2.5 py-1 rounded-lg text-[10px] font-bold text-slate-700 dark:text-slate-350 tracking-wide">
                      {product.category.toUpperCase()}
                    </span>
                    {isLowStock && (
                      <span className="absolute top-2 right-2 bg-rose-500 text-white px-2 py-0.5 rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-sm">
                        <AlertTriangle className="h-3 w-3" />
                        Stok Rendah
                      </span>
                    )}
                  </div>

                  {/* Informasi Produk */}
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-wider">
                        {product.sku}
                      </p>
                      <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm mt-1 leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {product.name}
                      </h3>
                    </div>

                    <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                      <span className="font-extrabold text-slate-900 dark:text-slate-50 text-base">
                        Rp {product.price.toLocaleString('id-ID')}
                      </span>

                      <span
                        className={`text-[11px] font-bold flex items-center gap-1 ${
                          isOutOfStock
                            ? 'text-rose-600'
                            : isLowStock
                            ? 'text-rose-500'
                            : remainingStock <= 5
                            ? 'text-amber-600'
                            : 'text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        <Package className="h-3.5 w-3.5" />
                        {isOutOfStock ? 'Habis' : `${remainingStock} Stok`}
                      </span>
                    </div>
                  </div>

                  {/* Overlay Habis */}
                  {isOutOfStock && (
                    <div className="absolute inset-0 bg-white/40 dark:bg-slate-950/40 backdrop-blur-[1px] flex items-center justify-center font-bold text-rose-700 dark:text-rose-450 text-sm">
                      Stok Habis
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="h-60 w-full flex flex-col items-center justify-center border border-dashed border-slate-300 dark:border-slate-700 rounded-3xl bg-white dark:bg-slate-900 p-6">
            <Coffee className="h-12 w-12 text-slate-300 mb-3" />
            <p className="font-bold text-slate-600 dark:text-slate-300 text-sm">Produk tidak ditemukan</p>
            <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">
              Belum ada produk aktif yang terdaftar di tenant Anda.
            </p>
          </div>
        )}
      </div>
    </section>
  );
};
