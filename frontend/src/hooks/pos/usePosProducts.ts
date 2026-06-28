import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useCartStore } from '../../store/useCartStore';
import { useShallow } from 'zustand/react/shallow';
import { getRecentProductIds, pushRecentProductId } from '../../utils/posRecentProducts';
import { getProductsApi, type PosCatalogProduct } from '../../api/posApi';
import {
  type Product,
  type ProductApiImage,
  buildProductAssetUrl,
} from './posUtils';

interface UsePosProductsOptions {
  isAuthenticated: boolean;
  activeOutletId: string | null;
  platformAdmin: boolean;
  showToast: (type: 'success' | 'error', message: string) => void;
  showCartAdded: (payload: { name: string; price: number; quantity: number }) => void;
  checkTokenExpiration: (err: unknown) => boolean;
}

export function usePosProducts({
  isAuthenticated,
  activeOutletId,
  platformAdmin,
  showToast,
  showCartAdded,
  checkTokenExpiration,
}: UsePosProductsOptions) {
  const { cart, addToCart, updateQuantity } = useCartStore(
    useShallow((state) => ({
      cart: state.cart,
      addToCart: state.addToCart,
      updateQuantity: state.updateQuantity,
    }))
  );

  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('SEMUA');
  const [inStockOnly, setInStockOnly] = useState<boolean>(true);
  const [cartBadgePulse, setCartBadgePulse] = useState<boolean>(false);
  const [recentProductIds, setRecentProductIds] = useState<string[]>(() => getRecentProductIds());

  const searchInputRef = useRef<HTMLInputElement>(null);
  const lastScannedRef = useRef<{ sku: string; time: number } | null>(null);

  const focusSearchInput = useCallback(() => {
    searchInputRef.current?.focus();
  }, []);

  const canFetchProducts = Boolean(isAuthenticated && (activeOutletId || platformAdmin));

  useEffect(() => {
    if (!canFetchProducts) return;

    let cancelled = false;

    void (async () => {
      await Promise.resolve();
      if (cancelled) return;

      setLoadingProducts(true);
      try {
        const data = await getProductsApi();
        if (cancelled) return;

        const mappedProducts = (data.data as PosCatalogProduct[]).map((item) => {
          const nameLower = item.name.toLowerCase();
          const categoryName = item.category?.name || 'Umum';
          const catLower = categoryName.toLowerCase();

          const isDrink =
            catLower.includes('minuman') ||
            catLower.includes('drink') ||
            catLower.includes('beverage') ||
            nameLower.includes('teh') ||
            nameLower.includes('kopi') ||
            nameLower.includes('es ') ||
            nameLower.includes('susu') ||
            nameLower.includes('jus') ||
            nameLower.includes('water') ||
            nameLower.includes('vanilla');

          const isFood =
            catLower.includes('makanan') ||
            catLower.includes('food') ||
            catLower.includes('bakery') ||
            nameLower.includes('croissant') ||
            nameLower.includes('roti') ||
            nameLower.includes('nasi') ||
            nameLower.includes('mie') ||
            nameLower.includes('cake') ||
            nameLower.includes('bread') ||
            nameLower.includes('mentega');

          let fallbackUrl = 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&q=80&w=600';
          if (isDrink) {
            fallbackUrl = nameLower.includes('kopi')
              ? 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&q=80&w=600'
              : 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&q=80&w=600';
          } else if (isFood) {
            fallbackUrl = nameLower.includes('croissant')
              ? 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&q=80&w=600'
              : 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=600';
          }

          const mainImage = item.images && item.images.length > 0
            ? (item.images.find((img: ProductApiImage) => img.isMain)?.url || item.images[0].url)
            : null;
          const finalImageUrl = mainImage && mainImage.startsWith('/uploads')
            ? buildProductAssetUrl(mainImage)
            : mainImage;
          return {
            id: item.id,
            sku: item.sku,
            name: item.name,
            price: Number(item.sellingPrice),
            stock: item.stock,
            minStock: item.minStock ?? 0,
            category: categoryName,
            imageUrl: finalImageUrl || fallbackUrl
          };
        });

        setProducts(mappedProducts);
      } catch (err: unknown) {
        if (cancelled) return;
        console.error('Fetch Products Error:', err);
        if (!checkTokenExpiration(err)) {
          const msg = err instanceof Error ? err.message : 'Koneksi ke API produk gagal.';
          showToast('error', msg);
        }
      } finally {
        if (!cancelled) {
          setLoadingProducts(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [canFetchProducts, isAuthenticated, activeOutletId, platformAdmin, checkTokenExpiration, showToast]);


  const catalogProducts = useMemo(
    () => (canFetchProducts ? products : []),
    [canFetchProducts, products]
  );
  const catalogLoading = canFetchProducts ? loadingProducts : false;

  const getRemainingStock = useCallback((productId: string, originalStock: number): number => {
    const cartItem = cart.find(item => item.productId === productId);
    return originalStock - (cartItem ? cartItem.quantity : 0);
  }, [cart]);

  const handleAddToCart = useCallback(
    (product: { productId: string; name: string; price: number; sku: string; stock: number }) => {
      const now = Date.now();
      const lastScan = lastScannedRef.current;

      if (lastScan && lastScan.sku === product.sku && now - lastScan.time < 500) {
        return;
      }

      lastScannedRef.current = { sku: product.sku, time: now };

      addToCart(product);
      const cartItem = useCartStore.getState().cart.find((item) => item.productId === product.productId);
      const nextRecent = pushRecentProductId(product.productId);
      setRecentProductIds(nextRecent);
      setCartBadgePulse(true);
      setTimeout(() => setCartBadgePulse(false), 600);
      showCartAdded({
        name: product.name,
        price: product.price,
        quantity: cartItem?.quantity ?? 1,
      });
    },
    [addToCart, showCartAdded]
  );

  useEffect(() => {
    let barcodeBuffer = '';
    let lastKeyTime = Date.now();

    const handleGlobalKeydown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName.toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') return;

      const currentTime = Date.now();
      if (currentTime - lastKeyTime > 50) {
        barcodeBuffer = '';
      }
      lastKeyTime = currentTime;

      if (e.key === 'Enter' && barcodeBuffer.length > 3) {
        e.preventDefault();
        const query = barcodeBuffer.toLowerCase();
        const exactMatch = catalogProducts.find((p) => p.sku.toLowerCase() === query);

        if (exactMatch) {
          const remaining = getRemainingStock(exactMatch.id, exactMatch.stock);
          if (remaining > 0) {
            handleAddToCart({
              productId: exactMatch.id,
              name: exactMatch.name,
              price: exactMatch.price,
              sku: exactMatch.sku,
              stock: exactMatch.stock,
            });
          } else {
            showToast('error', `${exactMatch.name} stok habis.`);
          }
        } else {
          showToast('error', `Barcode ${barcodeBuffer} tidak ditemukan.`);
        }
        barcodeBuffer = '';
      } else if (e.key.length === 1) {
        barcodeBuffer += e.key;
      }
    };

    window.addEventListener('keydown', handleGlobalKeydown);
    return () => window.removeEventListener('keydown', handleGlobalKeydown);
  }, [catalogProducts, getRemainingStock, handleAddToCart, showToast]);

  const handleSearchKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key !== 'Enter' || !searchQuery.trim()) return;

      const query = searchQuery.trim().toLowerCase();
      const exactMatch = catalogProducts.find(
        (product) =>
          product.sku.toLowerCase() === query ||
          product.name.toLowerCase() === query
      );

      if (!exactMatch) return;

      const remaining = getRemainingStock(exactMatch.id, exactMatch.stock);
      if (remaining <= 0) {
        showToast('error', `${exactMatch.name} stok habis.`);
        return;
      }

      handleAddToCart({
        productId: exactMatch.id,
        name: exactMatch.name,
        price: exactMatch.price,
        sku: exactMatch.sku,
        stock: exactMatch.stock,
      });
      setSearchQuery('');
    },
    [searchQuery, catalogProducts, handleAddToCart, showToast, getRemainingStock]
  );

  const incrementLastCartItem = useCallback(() => {
    const lastItem = cart[cart.length - 1];
    if (!lastItem) return;
    if (lastItem.quantity >= lastItem.stock) {
      showToast('error', 'Stok tidak mencukupi.');
      return;
    }
    updateQuantity(lastItem.productId, lastItem.quantity + 1);
  }, [cart, updateQuantity, showToast]);

  const decrementLastCartItem = useCallback(() => {
    const lastItem = cart[cart.length - 1];
    if (!lastItem) return;
    updateQuantity(lastItem.productId, lastItem.quantity - 1);
  }, [cart, updateQuantity]);

  const filteredProducts = useMemo(() => {
    return catalogProducts.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'SEMUA' || product.category === selectedCategory;
      const remaining = getRemainingStock(product.id, product.stock);
      const matchesStock = !inStockOnly || remaining > 0;
      return matchesSearch && matchesCategory && matchesStock;
    });
  }, [catalogProducts, searchQuery, selectedCategory, inStockOnly, getRemainingStock]);

  const categoriesList = useMemo(() => {
    return ['SEMUA', ...Array.from(new Set(catalogProducts.map(p => p.category)))];
  }, [catalogProducts]);

  const recentProducts = useMemo(() => {
    return recentProductIds
      .map((id) => catalogProducts.find((product) => product.id === id))
      .filter((product): product is Product => Boolean(product));
  }, [recentProductIds, catalogProducts]);

  const popularProducts = useMemo(() => {
    return [...catalogProducts]
      .filter((product) => getRemainingStock(product.id, product.stock) > 0)
      .sort((a, b) => b.stock - a.stock)
      .slice(0, 4);
  }, [catalogProducts, getRemainingStock]);

  return {
    products,
    setProducts,
    loadingProducts,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    inStockOnly,
    setInStockOnly,
    cartBadgePulse,
    setCartBadgePulse,
    recentProductIds,
    setRecentProductIds,
    searchInputRef,
    focusSearchInput,
    catalogProducts,
    catalogLoading,
    getRemainingStock,
    handleAddToCart,
    handleSearchKeyDown,
    incrementLastCartItem,
    decrementLastCartItem,
    filteredProducts,
    categoriesList,
    recentProducts,
    popularProducts,
  };
}
