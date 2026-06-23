import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useTransferStore } from '../store/useTransferStore';
import { useOutletStore, type Outlet } from '../store/useOutletStore';
import { useNotificationStore } from '../store/useNotificationStore';
import {
  getLowStockApi,
  getInventoryApi,
  getSettingsApi,
  updateSettingsApi,
  getStockRequestsApi,
  processStockRequestApi,
  getSourceOutletInventoryApi,
  getOutletStockApi,
  mutateStockApi,
  getProductLedgerApi
} from '../api/inventoryApi';
import { getErrorMessage } from '../api/types';
import {
  isOutletAssignedToUser,
  resolveAccessibleOutlets,
} from '../utils/outletAccess';
import { outletsForMutationType } from '../utils/inventoryHelpers';
import type {
  Product,
  LedgerEntry,
  LowStockItem,
  MutationForm,
  TransferForm,
  ConfirmModalState,
  InventoryTab,
  StockRequest,
} from '../types/inventory';
import type { AppSelectGroup } from '../components/AppSelect';

export function useInventory() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const activeOutletId = useAuthStore((state) => state.activeOutletId);
  const currentUser = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<ConfirmModalState>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });
  const [confirmLoading, setConfirmLoading] = useState(false);

  const [isMutationModalOpen, setIsMutationModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [mutationForm, setMutationForm] = useState<MutationForm>({
    type: 'RESTOCK',
    quantity: 1,
    note: '',
    outletId: '',
  });
  const [mutationSubmitting, setMutationSubmitting] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [mutationOutletStock, setMutationOutletStock] = useState<number | null>(null);
  const [mutationStockLoading, setMutationStockLoading] = useState(false);

  const [isLedgerModalOpen, setIsLedgerModalOpen] = useState(false);
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [ledgerProduct, setLedgerProduct] = useState<Product | null>(null);
  const [requireStockApproval, setRequireStockApproval] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [stockRequests, setStockRequests] = useState<StockRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<InventoryTab>('inventory');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryName, setSelectedCategoryName] = useState('');
  const [selectedStockFilter, setSelectedStockFilter] = useState<'all' | 'critical' | 'empty'>('all');

  // State untuk Transfer Stok
  const {
    transfers,
    loading: transfersLoading,
    fetchTransfers,
    createTransfer,
    approveTransfer,
    completeTransfer,
    cancelTransfer
  } = useTransferStore();

  const {
    outlets,
    hierarchy,
    fetchOutlets,
    fetchHierarchy
  } = useOutletStore();

  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferForm, setTransferForm] = useState<TransferForm>({
    fromOutletId: '',
    toOutletId: '',
    note: '',
    items: [{ productId: '', quantity: 1 }]
  });
  const [transferSubmitting, setTransferSubmitting] = useState(false);
  const [transferFormError, setTransferFormError] = useState<string | null>(null);

  const [sourceOutletProducts, setSourceOutletProducts] = useState<Product[]>([]);
  const [sourceOutletLoading, setSourceOutletLoading] = useState(false);
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);

  const refreshDraftCount = useNotificationStore((state) => state.fetchDraftTransferCount);
  const draftTransferCount = useNotificationStore((state) => state.draftTransferCount);

  const shouldLoadSourceInventory = isTransferModalOpen && Boolean(transferForm.fromOutletId);
  const shouldLoadMutationStock =
    isMutationModalOpen && Boolean(selectedProduct && mutationForm.outletId);

  const fetchLowStock = async () => {
    try {
      const res = await getLowStockApi();
      if (res.success) {
        setLowStockItems(res.data.items ?? []);
      }
    } catch (err) {
      console.error('Gagal mengambil stok rendah:', err);
    }
  };

  const fetchInventory = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getInventoryApi();
      setProducts(res.data);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await getSettingsApi();
      if (res.success) {
        setRequireStockApproval(res.data.requireStockApproval);
      }
    } catch (err) {
      console.error('Gagal mengambil pengaturan:', err);
    }
  };

  const fetchStockRequests = async () => {
    try {
      setRequestsLoading(true);
      const res = await getStockRequestsApi();
      if (res.success) {
        setStockRequests(res.data);
      }
    } catch (err) {
      console.error('Gagal mengambil antrean persetujuan:', err);
    } finally {
      setRequestsLoading(false);
    }
  };

  const handleToggleSettings = async () => {
    try {
      setSettingsLoading(true);
      setError(null);
      await updateSettingsApi(!requireStockApproval);
      setRequireStockApproval(!requireStockApproval);
      showSuccess(`Pengaturan persetujuan stok berhasil diperbarui.`);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleProcessRequest = async (id: string, action: 'approve' | 'reject') => {
    try {
      setError(null);
      const res = await processStockRequestApi(id, action);
      showSuccess(res.message || 'Permintaan mutasi stok berhasil diproses.');
      fetchStockRequests();
      fetchInventory();
      fetchLowStock();
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    void (async () => {
      await Promise.resolve();
      await Promise.all([
        fetchInventory(),
        fetchLowStock(),
        fetchSettings(),
        fetchOutlets(),
        fetchHierarchy(),
        fetchTransfers().then(() => refreshDraftCount()),
        ...(currentUser?.roles.some((r) => ['Owner', 'Manager', 'Admin'].includes(r))
          ? [fetchStockRequests()]
          : []),
      ]);
    })();
  }, [isAuthenticated, currentUser, activeOutletId, navigate, fetchOutlets, fetchHierarchy, fetchTransfers, refreshDraftCount]);

  useEffect(() => {
    if (!shouldLoadSourceInventory) return;

    let cancelled = false;
    const fromOutletId = transferForm.fromOutletId;

    void (async () => {
      await Promise.resolve();
      if (cancelled) return;

      try {
        setSourceOutletLoading(true);
        const res = await getSourceOutletInventoryApi(fromOutletId);
        if (cancelled) return;
        if (res.success) {
          setSourceOutletProducts(res.data);
        } else {
          console.error('Gagal mengambil stok outlet asal:', res.message);
        }
      } catch (err) {
        console.error('Gagal mengambil stok outlet asal:', err);
      } finally {
        if (!cancelled) {
          setSourceOutletLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [shouldLoadSourceInventory, transferForm.fromOutletId, isAuthenticated]);

  useEffect(() => {
    if (!shouldLoadMutationStock || !selectedProduct) return;

    let cancelled = false;
    const productId = selectedProduct.id;
    const outletId = mutationForm.outletId;

    void (async () => {
      await Promise.resolve();
      if (cancelled) return;

      setMutationStockLoading(true);
      try {
        const res = await getOutletStockApi(productId, outletId);
        if (cancelled) return;
        if (res.success) {
          setMutationOutletStock(res.data.product?.stock ?? 0);
        }
      } catch (err) {
        console.error('Gagal mengambil stok outlet:', err);
      } finally {
        if (!cancelled) {
          setMutationStockLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [shouldLoadMutationStock, selectedProduct, mutationForm.outletId]);

  const effectiveSourceOutletProducts = shouldLoadSourceInventory ? sourceOutletProducts : [];
  const effectiveMutationOutletStock = shouldLoadMutationStock ? mutationOutletStock : null;

  const allTenantOutlets = useMemo(() => {
    if (outlets.length > 0) return outlets;
    if (!hierarchy) return [];
    const list: Outlet[] = [];
    if (hierarchy.main) list.push(hierarchy.main);
    list.push(...hierarchy.branches);
    return list;
  }, [outlets, hierarchy]);

  const accessibleOutlets = useMemo(
    () => resolveAccessibleOutlets(allTenantOutlets, currentUser),
    [allTenantOutlets, currentUser]
  );

  const mutationEligibleOutlets = useMemo(
    () => outletsForMutationType(accessibleOutlets, mutationForm.type),
    [accessibleOutlets, mutationForm.type]
  );

  const selectedMutationOutlet = mutationEligibleOutlets.find(
    (o) => o.id === mutationForm.outletId
  );

  const mutationOutletGroups = useMemo((): AppSelectGroup[] => {
    const groups: AppSelectGroup[] = [];
    const mains = mutationEligibleOutlets.filter((o) => o.type === 'MAIN');
    const branches = mutationEligibleOutlets.filter((o) => o.type === 'BRANCH');
    if (mains.length > 0) {
      groups.push({
        label: 'Outlet Utama',
        options: mains.map((o) => ({ value: o.id, label: o.name })),
      });
    }
    if (branches.length > 0) {
      groups.push({
        label: 'Cabang',
        options: branches.map((o) => ({
          value: o.id,
          label: o.code ? `${o.name} (${o.code})` : o.name,
        })),
      });
    }
    return groups;
  }, [mutationEligibleOutlets]);

  const transferFromOutletOptions = useMemo(
    () =>
      outlets
        .filter((o) => o.isActive !== false)
        .filter(
          (o) =>
            currentUser?.roles.some((r) => ['Owner', 'Manager', 'Admin'].includes(r)) ||
            isOutletAssignedToUser(currentUser, o.id)
        )
        .map((o) => ({ value: o.id, label: o.name, description: o.type })),
    [outlets, currentUser]
  );

  const transferToOutletOptions = useMemo(() => {
    const fromOutlet = outlets.find((fo) => fo.id === transferForm.fromOutletId);
    if (!fromOutlet) return [];
    return outlets
      .filter((o) => o.isActive !== false)
      .filter((o) => {
        if (o.id === fromOutlet.id) return false;
        return fromOutlet.type === 'MAIN' ? o.type === 'BRANCH' : o.type === 'MAIN';
      })
      .map((o) => ({ value: o.id, label: o.name, description: o.type }));
  }, [outlets, transferForm.fromOutletId]);

  const sourceProductSelectOptions = useMemo(
    () =>
      sourceOutletProducts.map((p) => ({
        value: p.id,
        label: p.name,
        description: `SKU: ${p.sku} · Tersedia: ${p.stock}`,
      })),
    [sourceOutletProducts]
  );

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const openMutationModal = (product: Product) => {
    const eligible = outletsForMutationType(accessibleOutlets, 'RESTOCK');
    const defaultOutletId =
      eligible.length === 1
        ? eligible[0].id
        : activeOutletId && eligible.some((o) => o.id === activeOutletId)
          ? activeOutletId
          : eligible[0]?.id ?? '';

    setSelectedProduct(product);
    setMutationForm({
      type: 'RESTOCK',
      quantity: 1,
      note: '',
      outletId: defaultOutletId,
    });
    setMutationOutletStock(null);
    setMutationError(null);
    setIsMutationModalOpen(true);
  };

  const handleMutationTypeChange = (type: string) => {
    const eligible = outletsForMutationType(accessibleOutlets, type);
    const nextOutletId = eligible.some((o) => o.id === mutationForm.outletId)
      ? mutationForm.outletId
      : eligible.length === 1
        ? eligible[0].id
        : eligible.find((o) => o.type === 'MAIN')?.id ?? eligible[0]?.id ?? '';

    setMutationForm({ ...mutationForm, type, outletId: nextOutletId });
  };

  const handleMutationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    if (!mutationForm.outletId) {
      setMutationError('Pilih outlet tujuan mutasi stok terlebih dahulu.');
      return;
    }

    try {
      setMutationSubmitting(true);
      setMutationError(null);

      const data = await mutateStockApi({
        productId: selectedProduct.id,
        type: mutationForm.type,
        quantity: Number(mutationForm.quantity),
        note: mutationForm.note
      }, mutationForm.outletId);

      if (data.data?.isPendingApproval) {
        showSuccess(data.message || 'Permintaan mutasi stok berhasil diajukan.');
        if (currentUser?.roles.some(r => ['Owner', 'Manager', 'Admin'].includes(r))) {
          fetchStockRequests();
        }
      } else {
        showSuccess(`Stok produk "${selectedProduct.name}" berhasil diperbarui.`);
      }
      setIsMutationModalOpen(false);
      fetchInventory();
      fetchLowStock();
    } catch (err: unknown) {
      setMutationError(getErrorMessage(err));
    } finally {
      setMutationSubmitting(false);
    }
  };

  const openLedgerModal = async (product: Product) => {
    setLedgerProduct(product);
    setIsLedgerModalOpen(true);
    setLedgerLoading(true);
    try {
      const res = await getProductLedgerApi(product.id);
      setLedgerEntries(res.data.ledger);
    } catch (err: unknown) {
      alert(getErrorMessage(err));
      setIsLedgerModalOpen(false);
    } finally {
      setLedgerLoading(false);
    }
  };

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTransferFormError(null);

    if (!transferForm.fromOutletId) {
      setTransferFormError('Silakan pilih outlet asal.');
      return;
    }
    if (!transferForm.toOutletId) {
      setTransferFormError('Silakan pilih outlet tujuan.');
      return;
    }

    const cleanItems = transferForm.items.filter(item => item.productId && item.quantity > 0);
    if (cleanItems.length === 0) {
      setTransferFormError('Silakan tambahkan minimal 1 item barang yang valid.');
      return;
    }

    for (const item of cleanItems) {
      const sourceProd = sourceOutletProducts.find(p => p.id === item.productId);
      const availableStock = sourceProd ? sourceProd.stock : 0;
      if (item.quantity > availableStock) {
        setTransferFormError(`Stok produk '${sourceProd?.name || 'terpilih'}' tidak mencukupi. Tersedia: ${availableStock}, diminta: ${item.quantity}.`);
        return;
      }
    }

    try {
      setTransferSubmitting(true);
      const res = await createTransfer({
        fromOutletId: transferForm.fromOutletId,
        toOutletId: transferForm.toOutletId,
        note: transferForm.note || undefined,
        items: cleanItems
      });

      if (res.success) {
        showSuccess(res.data?.status === 'IN_TRANSIT'
          ? 'Transfer stok berhasil dibuat dan barang dalam perjalanan.'
          : 'Draf transfer stok berhasil diajukan dan menunggu approval.'
        );
        setIsTransferModalOpen(false);
        fetchInventory();
        void refreshDraftCount();
      } else {
        setTransferFormError(res.message || 'Terjadi kesalahan saat memproses transfer.');
      }
    } catch (err: unknown) {
      setTransferFormError(getErrorMessage(err, 'Terjadi kesalahan.'));
    } finally {
      setTransferSubmitting(false);
    }
  };

  const isBelowMinStock = useCallback((prod: Product) =>
    (prod.minStock ?? 0) > 0 && prod.stock < (prod.minStock ?? 0), []);

  const filteredProducts = useMemo(() => {
    return products.filter((prod) => {
      const query = searchQuery.toLowerCase().trim();
      const matchQuery =
        !query ||
        prod.name.toLowerCase().includes(query) ||
        prod.sku.toLowerCase().includes(query);
      if (!matchQuery) return false;

      if (selectedCategoryName && prod.category?.name !== selectedCategoryName) {
        return false;
      }

      if (selectedStockFilter === 'critical') {
        const isCritical = prod.stock > 0 && (isBelowMinStock(prod) || prod.stock <= 10);
        if (!isCritical) return false;
      } else if (selectedStockFilter === 'empty') {
        if (prod.stock !== 0) return false;
      }

      return true;
    });
  }, [products, searchQuery, selectedCategoryName, selectedStockFilter, isBelowMinStock]);

  const categories = useMemo(() => {
    const list = products.map((p) => p.category?.name).filter(Boolean);
    return Array.from(new Set(list));
  }, [products]);

  const summaryStats = useMemo(() => {
    const totalItems = products.length;
    let criticalItems = 0;
    let emptyItems = 0;
    let totalAssetValue = 0;

    products.forEach((prod) => {
      if (prod.stock === 0) {
        emptyItems += 1;
      } else if (isBelowMinStock(prod) || prod.stock <= 10) {
        criticalItems += 1;
      }
      totalAssetValue += prod.stock * Number(prod.purchasePrice || 0);
    });

    return {
      totalItems,
      criticalItems,
      emptyItems,
      totalAssetValue,
    };
  }, [products, isBelowMinStock]);

  const resetFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedCategoryName('');
    setSelectedStockFilter('all');
  }, []);

  const isOwner = currentUser?.roles.includes('Owner');
  const isOwnerOrManager = currentUser?.roles.some(r => ['Owner', 'Manager', 'Admin'].includes(r));
  const canMutate = currentUser?.roles.some(r => ['Owner', 'Manager', 'Admin', 'Staf Gudang'].includes(r));
  const lowStockCount = lowStockItems.length;

  return {
    products,
    filteredProducts,
    searchQuery,
    setSearchQuery,
    selectedCategoryName,
    setSelectedCategoryName,
    selectedStockFilter,
    setSelectedStockFilter,
    categories,
    summaryStats,
    resetFilters,
    loading,
    error,
    setError,
    successMsg,
    confirmModal,
    setConfirmModal,
    confirmLoading,
    setConfirmLoading,
    isMutationModalOpen,
    setIsMutationModalOpen,
    selectedProduct,
    setSelectedProduct,
    mutationForm,
    setMutationForm,
    mutationSubmitting,
    mutationError,
    setMutationError,
    mutationOutletStock: effectiveMutationOutletStock,
    mutationStockLoading,
    isLedgerModalOpen,
    setIsLedgerModalOpen,
    ledgerEntries,
    ledgerLoading,
    ledgerProduct,
    requireStockApproval,
    settingsLoading,
    stockRequests,
    requestsLoading,
    activeTab,
    setActiveTab,
    transfers,
    transfersLoading,
    approveTransfer,
    completeTransfer,
    cancelTransfer,
    outlets,
    isTransferModalOpen,
    setIsTransferModalOpen,
    transferForm,
    setTransferForm,
    transferSubmitting,
    transferFormError,
    setTransferFormError,
    sourceOutletProducts: effectiveSourceOutletProducts,
    sourceOutletLoading,
    lowStockItems,
    lowStockCount,
    isBelowMinStock,
    allTenantOutlets,
    accessibleOutlets,
    mutationEligibleOutlets,
    selectedMutationOutlet,
    mutationOutletGroups,
    transferFromOutletOptions,
    transferToOutletOptions,
    sourceProductSelectOptions,
    showSuccess,
    openMutationModal,
    handleMutationTypeChange,
    handleMutationSubmit,
    openLedgerModal,
    isOwner,
    isOwnerOrManager,
    canMutate,
    draftTransferCount,
    refreshDraftCount,
    handleProcessRequest,
    handleToggleSettings,
    currentUser,
    handleLogout,
    fetchInventory,
    createTransfer,
    handleTransferSubmit
  };
}

export type UseInventoryReturn = ReturnType<typeof useInventory>;
