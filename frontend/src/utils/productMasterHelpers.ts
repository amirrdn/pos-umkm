import { API_BASE_URL } from '../config';
import type { MasterProduct } from '../types/productMaster';

export function resolveProductImageUrl(url: string): string {
  return url.startsWith('/uploads') ? `${API_BASE_URL}${url}` : url;
}

export function getProductStockBadgeClass(stock: number): string {
  if (stock === 0) {
    return 'bg-rose-50 text-rose-700';
  }
  if (stock <= 5) {
    return 'bg-amber-50 text-amber-700';
  }
  return 'bg-emerald-50 text-emerald-700';
}

export function mapApiProductToMasterProduct(item: {
  id: string;
  sku: string;
  name: string;
  purchasePrice: string | number;
  sellingPrice: string | number;
  stock: number;
  categoryId: string;
  category?: { name?: string };
  images?: MasterProduct['images'];
  outletStocks?: MasterProduct['outletStocks'];
}): MasterProduct {
  return {
    id: item.id,
    sku: item.sku,
    name: item.name,
    purchasePrice: Number(item.purchasePrice),
    sellingPrice: Number(item.sellingPrice),
    stock: item.stock,
    categoryId: item.categoryId,
    categoryName: item.category?.name || 'Umum',
    images: item.images || [],
    outletStocks: item.outletStocks || [],
  };
}

export function canFilterByOutlet(roles: string[] | undefined): boolean {
  return !!roles?.some((role) => ['Owner', 'Admin', 'Manager'].includes(role));
}
