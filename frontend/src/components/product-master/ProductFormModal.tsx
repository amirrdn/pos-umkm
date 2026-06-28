import { Package, Loader2 } from 'lucide-react';
import { ProductGeneralFormTab } from './ProductGeneralFormTab';
import { ProductOutletsFormTab } from './ProductOutletsFormTab';
import type { UseProductMasterReturn } from '../../hooks/useProductMaster';

export interface ProductFormModalProps {
  productMaster: UseProductMasterReturn;
}

export function ProductFormModal({ productMaster }: ProductFormModalProps) {
  const {
    isModalOpen,
    setIsModalOpen,
    modalMode,
    activeTab,
    setActiveTab,
    outlets,
    handleSubmit,
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
    handleImageUpload,
    goToInventoryMutation,
    overridePrices,
    setOverridePrices,
    minStocks,
    setMinStocks,
    handleSavePrice,
    handleSaveMinStock,
    isSubmitting,
  } = productMaster;

  if (!isModalOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-[2px] p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] sm:max-h-[85vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col">
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center shrink-0">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2">
            <Package className="h-4 w-4 text-indigo-600" />
            {modalMode === 'create' ? 'Tambah Produk Baru' : 'Edit Informasi Produk'}
          </h3>
          <button
            onClick={() => setIsModalOpen(false)}
            className="cursor-pointer text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden min-h-0 bg-white dark:bg-slate-900">
          <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0">
            {modalMode === 'edit' && (
              <div className="flex gap-4 border-b border-slate-100 dark:border-slate-800 mb-5 pb-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('general')}
                  className={`cursor-pointer pb-2 text-xs font-bold transition-all ${
                    activeTab === 'general'
                      ? 'text-indigo-600 border-b-2 border-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                      : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-400'
                  }`}
                >
                  Informasi Umum
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('outlets')}
                  className={`cursor-pointer pb-2 text-xs font-bold transition-all ${
                    activeTab === 'outlets'
                      ? 'text-indigo-600 border-b-2 border-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                      : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-400'
                  }`}
                >
                  Pengaturan Cabang ({outlets.length})
                </button>
              </div>
            )}

            {activeTab === 'general' ? (
              <ProductGeneralFormTab
                modalMode={modalMode}
                sku={sku}
                setSku={setSku}
                isAutoSku={isAutoSku}
                setIsAutoSku={setIsAutoSku}
                categoryId={categoryId}
                setCategoryId={setCategoryId}
                categories={categories}
                fetchNextSku={fetchNextSku}
                name={name}
                setName={setName}
                purchasePrice={purchasePrice}
                setPurchasePrice={setPurchasePrice}
                sellingPrice={sellingPrice}
                setSellingPrice={setSellingPrice}
                stock={stock}
                setStock={setStock}
                images={images}
                setImages={setImages}
                uploading={uploading}
                onImageUpload={handleImageUpload}
                onGoToInventoryMutation={goToInventoryMutation}
              />
            ) : (
              <ProductOutletsFormTab
                outlets={outlets}
                sellingPrice={sellingPrice}
                overridePrices={overridePrices}
                setOverridePrices={setOverridePrices}
                minStocks={minStocks}
                setMinStocks={setMinStocks}
                onSavePrice={handleSavePrice}
                onSaveMinStock={handleSaveMinStock}
              />
            )}
          </div>

          <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 shrink-0 bg-white dark:bg-slate-900">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="cursor-pointer px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-95 transition-all"
            >
              {activeTab === 'outlets' ? 'Tutup' : 'Batalkan'}
            </button>
            {activeTab === 'general' && (
              <button
                type="submit"
                disabled={isSubmitting}
                className="cursor-pointer px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold shadow-lg shadow-indigo-100 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {modalMode === 'create' ? 'Tambah Produk' : 'Simpan Perubahan'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
