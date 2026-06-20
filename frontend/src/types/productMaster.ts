export interface ProductImage {
  id?: string;
  url: string;
  isMain: boolean;
}

export interface ProductOutletStock {
  outletId: string;
  stock: number;
  outlet?: {
    name: string;
  };
}

export interface ProductCategory {
  id: string;
  name: string;
  prefix: string;
}

export interface OutletSummary {
  id: string;
  name: string;
  type: 'MAIN' | 'BRANCH';
}

export interface MasterProduct {
  id: string;
  sku: string;
  name: string;
  purchasePrice: number;
  sellingPrice: number;
  stock: number;
  categoryId: string;
  categoryName: string;
  images?: ProductImage[];
  outletStocks?: ProductOutletStock[];
}

export type ProductModalMode = 'create' | 'edit';
export type ProductModalTab = 'general' | 'outlets';

export interface ProductNotification {
  type: 'success' | 'error';
  message: string;
}

export interface ProductFormImage {
  url: string;
  isMain: boolean;
}

export interface ProductFormPayload {
  categoryId: string;
  name: string;
  sku: string;
  purchasePrice: number;
  sellingPrice: number;
  stock: number;
  images: ProductFormImage[];
}

export interface OutletSettingsData {
  prices: { outletId: string; price: string | number }[];
  stocks: { outletId: string; minStock: string | number }[];
}
