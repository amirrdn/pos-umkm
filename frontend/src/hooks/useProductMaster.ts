import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import {
  getProductsApi,
  getCategoriesApi,
  getOutletsApi,
  getNextSkuApi,
  getProductOutletSettingsApi,
  createProductApi,
  updateProductApi,
  deleteProductApi,
  uploadProductImageApi,
  savePriceOverrideApi,
  deletePriceOverrideApi,
  saveMinStockApi,
} from '../api/productMasterApi';
import type {
  MasterProduct,
  ProductCategory,
  OutletSummary,
  ProductFormImage,
  ProductModalMode,
  ProductModalTab,
  ProductNotification,
} from '../types/productMaster';

export function useProductMaster() {
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const [products, setProducts] = useState<MasterProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ProductModalMode>('create');
  const [notification, setNotification] = useState<ProductNotification | null>(null);

  const [currentId, setCurrentId] = useState('');
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [categoryId, setCategoryId] = useState('cat-minuman-111');
  const [purchasePrice, setPurchasePrice] = useState(0);
  const [sellingPrice, setSellingPrice] = useState(0);
  const [stock, setStock] = useState(0);
  const [images, setImages] = useState<ProductFormImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [isAutoSku, setIsAutoSku] = useState(true);
  const [activeTab, setActiveTab] = useState<ProductModalTab>('general');
  const [outlets, setOutlets] = useState<OutletSummary[]>([]);
  const [overridePrices, setOverridePrices] = useState<Record<string, number | undefined>>({});
  const [minStocks, setMinStocks] = useState<Record<string, number>>({});
  const [filterOutletId, setFilterOutletId] = useState('');

  const showToast = (type: ProductNotification['type'], message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const fetchOutlets = useCallback(async () => {
    try {
      setOutlets(await getOutletsApi());
    } catch (err) {
      console.error('Gagal mengambil daftar outlet:', err);
    }
  }, []);

  const fetchOutletSettings = async (prodId: string) => {
    try {
      const outletList = await getOutletsApi();
      setOutlets(outletList);

      const settings = await getProductOutletSettingsApi(prodId);
      if (settings) {
        const priceMap: Record<string, number> = {};
        const stockMap: Record<string, number> = {};
        (settings.prices || []).forEach((p) => {
          priceMap[p.outletId] = Number(p.price);
        });
        (settings.stocks || []).forEach((s) => {
          stockMap[s.outletId] = Number(s.minStock);
        });
        setOverridePrices(priceMap);
        setMinStocks(stockMap);
      }
    } catch (err) {
      console.error('Gagal mengambil detail cabang:', err);
    }
  };

  const fetchProducts = useCallback(async (selectedOutletId: string) => {
    setLoading(true);
    try {
      setProducts(await getProductsApi(selectedOutletId || undefined));
    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error ? err.message : 'Koneksi ke API produk gagal.';
      showToast('error', message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      setCategories(await getCategoriesApi());
    } catch (err) {
      console.error('Gagal mengambil kategori:', err);
    }
  }, []);

  const fetchNextSku = async (catId: string) => {
    if (!catId) return;
    try {
      const nextSku = await getNextSkuApi(catId);
      if (nextSku) {
        setSku(nextSku);
      }
    } catch (err) {
      console.error('Gagal mengambil SKU otomatis:', err);
    }
  };

  useEffect(() => {
    if (!token) return;

    let cancelled = false;

    void (async () => {
      await Promise.resolve();
      if (cancelled) return;
      await Promise.all([fetchCategories(), fetchOutlets()]);
    })();

    return () => {
      cancelled = true;
    };
  }, [token, fetchCategories, fetchOutlets]);

  useEffect(() => {
    if (!token) return;

    let cancelled = false;

    void (async () => {
      await Promise.resolve();
      if (cancelled) return;
      await fetchProducts(filterOutletId);
    })();

    return () => {
      cancelled = true;
    };
  }, [token, filterOutletId, fetchProducts]);

  const handleOpenCreate = () => {
    setModalMode('create');
    setCurrentId('');
    setName('');
    setSku('');
    setPurchasePrice(0);
    setSellingPrice(0);
    setStock(0);
    setImages([]);
    setIsAutoSku(true);
    setOverridePrices({});
    setMinStocks({});
    setActiveTab('general');
    if (categories.length > 0) {
      setCategoryId(categories[0].id);
      fetchNextSku(categories[0].id);
    }
    setIsModalOpen(true);
  };

  const handleOpenEdit = (product: MasterProduct) => {
    setModalMode('edit');
    setActiveTab('general');
    setCurrentId(product.id);
    setName(product.name);
    setSku(product.sku);
    setCategoryId(product.categoryId);
    setPurchasePrice(product.purchasePrice);
    setSellingPrice(product.sellingPrice);
    setStock(product.stock);
    setImages(product.images ? product.images.map((img) => ({ url: img.url, isMain: img.isMain })) : []);
    setIsAutoSku(false);
    setOverridePrices({});
    setMinStocks({});
    fetchOutletSettings(product.id);
    setIsModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showToast('error', 'Ukuran file terlalu besar. Maksimal adalah 5 MB.');
      return;
    }

    setUploading(true);
    try {
      const url = await uploadProductImageApi(file);
      showToast('success', 'Gambar berhasil diunggah.');
      setImages([...images, { url, isMain: images.length === 0 }]);
    } catch (err: unknown) {
      console.error('Image Upload Error:', err);
      const message = err instanceof Error ? err.message : 'Terjadi kesalahan jaringan saat mengunggah gambar.';
      showToast('error', message);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !sku || purchasePrice <= 0 || sellingPrice <= 0 || stock < 0) {
      showToast('error', 'Semua kolom wajib diisi dengan nilai yang valid.');
      return;
    }

    const payload = {
      categoryId,
      name,
      sku,
      purchasePrice,
      sellingPrice,
      stock,
      images: images.filter((img) => img.url.trim() !== ''),
    };

    setIsSubmitting(true);
    try {
      if (modalMode === 'create') {
        await createProductApi(payload);
      } else {
        await updateProductApi(currentId, payload);
      }

      showToast('success', modalMode === 'create' ? 'Produk berhasil ditambahkan!' : 'Produk berhasil diperbarui!');
      setIsModalOpen(false);
      fetchProducts(filterOutletId);
    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error ? err.message : 'Terjadi kesalahan saat memproses data.';
      showToast('error', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (productId: string) => {
    const confirmed = window.confirm('Apakah Anda yakin ingin menghapus produk ini?');
    if (!confirmed) return;

    try {
      await deleteProductApi(productId);
      showToast('success', 'Produk berhasil dihapus.');
      fetchProducts(filterOutletId);
    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error ? err.message : 'Terjadi kesalahan saat menghapus.';
      showToast('error', message);
    }
  };

  const handleSavePrice = async (outletId: string, price: number | undefined) => {
    try {
      if (price === undefined || isNaN(price) || price <= 0) {
        await deletePriceOverrideApi(outletId, currentId);
        showToast('success', 'Harga khusus cabang dihapus (menggunakan harga dasar).');
        const newPrices = { ...overridePrices };
        delete newPrices[outletId];
        setOverridePrices(newPrices);
      } else {
        await savePriceOverrideApi(outletId, currentId, price);
        showToast('success', 'Harga khusus cabang berhasil disimpan!');
      }
    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error ? err.message : 'Gagal memproses harga khusus.';
      showToast('error', message);
    }
  };

  const handleSaveMinStock = async (outletId: string, minStock: number) => {
    try {
      await saveMinStockApi(outletId, currentId, minStock);
      showToast('success', 'Limit stok minimum cabang berhasil disimpan!');
    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error ? err.message : 'Gagal menyimpan limit stok.';
      showToast('error', message);
    }
  };

  const handleFilterOutletChange = (outletId: string) => {
    setFilterOutletId(outletId);
  };

  const goToInventoryMutation = () => {
    setIsModalOpen(false);
    navigate('/admin/inventory');
  };

  return {
    user,
    handleLogout,
    products,
    loading,
    isModalOpen,
    setIsModalOpen,
    modalMode,
    notification,
    setNotification,
    currentId,
    name,
    setName,
    sku,
    setSku,
    categoryId,
    setCategoryId,
    purchasePrice,
    setPurchasePrice,
    sellingPrice,
    setSellingPrice,
    stock,
    setStock,
    images,
    setImages,
    uploading,
    categories,
    isAutoSku,
    setIsAutoSku,
    activeTab,
    setActiveTab,
    outlets,
    overridePrices,
    setOverridePrices,
    minStocks,
    setMinStocks,
    filterOutletId,
    fetchProducts,
    fetchNextSku,
    handleOpenCreate,
    handleOpenEdit,
    handleImageUpload,
    handleSubmit,
    handleDelete,
    handleSavePrice,
    handleSaveMinStock,
    handleFilterOutletChange,
    goToInventoryMutation,
    isSubmitting,
  };
}

export type UseProductMasterReturn = ReturnType<typeof useProductMaster>;
