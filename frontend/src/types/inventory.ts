export interface Product {
  id: string;
  name: string;
  sku: string;
  stock: number;
  minStock?: number;
  purchasePrice: string;
  sellingPrice: string;
  category: {
    name: string;
  };
  _count: {
    stockLedgers: number;
  };
}

export interface LedgerEntry {
  id: string;
  type: 'SALE' | 'RESTOCK' | 'ADJUSTMENT_PLUS' | 'ADJUSTMENT_MINUS' | 'RETURN';
  quantity: number;
  stockBefore: number;
  stockAfter: number;
  note: string | null;
  createdAt: string;
  user: {
    name: string;
  };
}

export interface LowStockItem {
  productId: string;
  productName: string;
  sku: string;
  outletId: string;
  outletName: string;
  stock: number;
  minStock: number;
}

export interface MutationForm {
  type: string;
  quantity: number;
  note: string;
  outletId: string;
}

export interface TransferItem {
  productId: string;
  quantity: number;
}

export interface TransferForm {
  fromOutletId: string;
  toOutletId: string;
  note: string;
  items: TransferItem[];
}

export type InventoryTab = 'inventory' | 'requests' | 'transfers';

export interface StockRequest {
  id: string;
  type: string;
  quantity: number;
  note: string | null;
  product: {
    name: string;
    sku: string;
  };
  user: {
    name: string;
  };
}

export type ConfirmModalType = 'info' | 'danger' | 'warning' | 'success';

export interface ConfirmModalState {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void | Promise<void>;
  confirmText?: string;
  cancelText?: string;
  type?: ConfirmModalType;
}
