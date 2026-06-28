import { Tag, Trash2, RefreshCw, Upload } from 'lucide-react';
import { AppSelect } from '../AppSelect';
import { resolveProductImageUrl } from '../../utils/productMasterHelpers';
import type {
  ProductCategory,
  ProductFormImage,
  ProductModalMode,
} from '../../types/productMaster';

export interface ProductGeneralFormTabProps {
  modalMode: ProductModalMode;
  sku: string;
  setSku: (value: string) => void;
  isAutoSku: boolean;
  setIsAutoSku: (value: boolean) => void;
  categoryId: string;
  setCategoryId: (value: string) => void;
  categories: ProductCategory[];
  fetchNextSku: (catId: string) => void;
  name: string;
  setName: (value: string) => void;
  purchasePrice: number;
  setPurchasePrice: (value: number) => void;
  sellingPrice: number;
  setSellingPrice: (value: number) => void;
  stock: number;
  setStock: (value: number) => void;
  images: ProductFormImage[];
  setImages: React.Dispatch<React.SetStateAction<ProductFormImage[]>>;
  uploading: boolean;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onGoToInventoryMutation: () => void;
}

export function ProductGeneralFormTab({
  modalMode,
  sku,
  setSku,
  isAutoSku,
  setIsAutoSku,
  categoryId,
  setCategoryId,
  categories,
  fetchNextSku,
  name,
  setName,
  purchasePrice,
  setPurchasePrice,
  sellingPrice,
  setSellingPrice,
  stock,
  setStock,
  images,
  setImages,
  uploading,
  onImageUpload,
  onGoToInventoryMutation,
}: ProductGeneralFormTabProps) {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">SKU / Kode Barang</label>
            {modalMode === 'create' && (
              <label className="flex items-center gap-1 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isAutoSku}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setIsAutoSku(checked);
                    if (checked && categoryId) {
                      fetchNextSku(categoryId);
                    }
                  }}
                  className="text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 rounded border-slate-300"
                />
                <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400">Otomatis</span>
              </label>
            )}
          </div>
          <input
            type="text"
            placeholder="Contoh: MNM-001"
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            disabled={modalMode === 'create' && isAutoSku}
            className={`w-full px-3.5 py-2.5 border rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${modalMode === 'create' && isAutoSku
              ? 'bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
              : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-700'
              }`}
            required
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Kategori Produk</label>
          <AppSelect
            value={categoryId}
            onChange={(newCatId) => {
              setCategoryId(newCatId);
              if (modalMode === 'create' && isAutoSku) {
                fetchNextSku(newCatId);
              }
            }}
            placeholder="-- Pilih Kategori --"
            searchable={categories.length > 4}
            options={categories.map((cat) => ({ value: cat.id, label: cat.name }))}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Nama Lengkap Produk</label>
        <div className="relative">
          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Contoh: Kopi Latte Dingin"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-700 transition-all text-slate-800 dark:text-slate-100"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Harga Beli</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">Rp</span>
            <input
              type="number"
              placeholder="10000"
              value={purchasePrice || ''}
              onChange={(e) => setPurchasePrice(Number(e.target.value))}
              className="w-full pl-8 pr-2 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-700 transition-all text-slate-800 dark:text-slate-100"
              required
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Harga Jual</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">Rp</span>
            <input
              type="number"
              placeholder="18000"
              value={sellingPrice || ''}
              onChange={(e) => setSellingPrice(Number(e.target.value))}
              className="w-full pl-8 pr-2 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-700 transition-all text-slate-800 dark:text-slate-100"
              required
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            {modalMode === 'create' ? 'Stok Awal' : 'Stok Saat Ini'}
          </label>

          {modalMode === 'create' ? (
            <input
              type="number"
              placeholder="50"
              value={stock || ''}
              onChange={(e) => setStock(Number(e.target.value))}
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-700 transition-all text-slate-800 dark:text-slate-100"
              required
            />
          ) : (
            <div className="flex items-center gap-3 px-3 py-2.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/50 rounded-xl">
              <div className="flex-shrink-0 h-7 w-7 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
                <span className="text-amber-600 dark:text-amber-400 text-sm font-black">{stock}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-amber-700 dark:text-amber-400">Stok terkunci</p>
                <p className="text-[10px] text-amber-600/80 dark:text-amber-500/80 leading-tight">
                  Ubah melalui{' '}
                  <button
                    type="button"
                    onClick={onGoToInventoryMutation}
                    className="cursor-pointer font-extrabold underline hover:no-underline"
                  >
                    Mutasi Stok
                  </button>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3 pt-2">
        <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide block">
          Gambar Produk ({images.length}/8)
        </label>

        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-48 overflow-y-auto pr-1">
          {images.map((img, index) => {
            const displayUrl = resolveProductImageUrl(img.url);
            return (
              <div
                key={index}
                className={`relative aspect-square rounded-xl border overflow-hidden group transition-all duration-200 ${img.isMain
                  ? 'border-indigo-500 ring-2 ring-indigo-500/20'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-350 dark:hover:border-slate-600'
                  }`}
              >
                <img
                  src={displayUrl}
                  alt="Pratinjau Produk"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://placehold.co/100x100?text=Error';
                  }}
                />

                <button
                  type="button"
                  title="Jadikan gambar utama"
                  onClick={() => {
                    const newImgs = images.map((im, idx) => ({
                      ...im,
                      isMain: idx === index,
                    }));
                    setImages(newImgs);
                  }}
                  className={`cursor-pointer absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-lg text-[9px] font-extrabold transition-all duration-200 shadow-sm ${img.isMain
                    ? 'bg-indigo-600 text-white ring-2 ring-indigo-200 dark:ring-indigo-900'
                    : 'bg-white/90 hover:bg-white dark:bg-slate-800/90 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                    }`}
                >
                  Utama
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const newImgs = images.filter((_, idx) => idx !== index);
                    if (img.isMain && newImgs.length > 0) {
                      newImgs[0].isMain = true;
                    }
                    setImages(newImgs);
                  }}
                  className="cursor-pointer absolute top-1.5 right-1.5 p-1 rounded-lg bg-rose-500 text-white opacity-0 group-hover:opacity-100 hover:bg-rose-600 transition-all duration-200 shadow-sm"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}

          {images.length < 8 && (
            <label
              className={`relative aspect-square rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 cursor-pointer flex flex-col items-center justify-center gap-1 transition-all duration-200 group ${uploading ? 'opacity-50 pointer-events-none' : ''
                }`}
            >
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onImageUpload}
                disabled={uploading}
              />
              {uploading ? (
                <RefreshCw className="h-5 w-5 text-indigo-500 animate-spin" />
              ) : (
                <>
                  <Upload className="h-5 w-5 text-slate-400 dark:text-slate-500 group-hover:text-indigo-500 transition-colors duration-200" />
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 group-hover:text-indigo-500 transition-colors duration-200">
                    Unggah
                  </span>
                </>
              )}
            </label>
          )}
        </div>

        {images.length === 0 && !uploading && (
          <p className="text-[10px] text-slate-400 dark:text-slate-500 italic">
            Belum ada gambar ditambahkan. Produk akan menampilkan placeholder default di POS.
          </p>
        )}
      </div>
    </>
  );
}
