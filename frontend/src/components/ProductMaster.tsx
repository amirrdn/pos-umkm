import { Plus, Package } from 'lucide-react';
import { useProductMaster } from '../hooks/useProductMaster';
import { AppShellHeader } from './AppShellHeader';
import { ProductContent, ProductModals } from './product-master';

export const ProductMaster = () => {
  const productMaster = useProductMaster();

  return (
    <div className="h-screen w-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans overflow-hidden transition-colors duration-150">
      <AppShellHeader
        title="Master Produk"
        subtitle="Pengelolaan barang & katalog jual"
        icon={Package}
        accent="indigo"
        user={productMaster.user}
        onLogout={productMaster.handleLogout}
        showOutletSwitcher={false}
        trailingActions={
          <button
            onClick={productMaster.handleOpenCreate}
            type="button"
            className="cursor-pointer flex items-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-all shadow-sm shadow-indigo-500/20 active:scale-95"
          >
            <Plus className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">Tambah Produk</span>
          </button>
        }
      />

      <ProductContent productMaster={productMaster} />
      <ProductModals productMaster={productMaster} />
    </div>
  );
};
