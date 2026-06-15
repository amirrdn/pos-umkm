import { create } from 'zustand';

// Antarmuka untuk Item di dalam Keranjang Belanja
export interface CartItem {
  productId: string;
  name: string;
  price: number;     // Harga Jual (sellingPrice)
  sku: string;
  stock: number;     // Sisa stok yang tersedia di database
  quantity: number;  // Jumlah yang dibeli
}

// Antarmuka untuk State dan Action Zustand
interface CartState {
  cart: CartItem[];
  subTotal: number;
  discountType: 'PERCENT' | 'NOMINAL';
  discountValue: number;
  applyTax: boolean;
  grandTotal: number;
  
  // Actions
  addToCart: (product: Omit<CartItem, 'quantity'>) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  setDiscount: (type: 'PERCENT' | 'NOMINAL', value: number) => void;
  setApplyTax: (apply: boolean) => void;
  clearCart: () => void;
}

// Fungsi pembantu untuk mengkalkulasi ulang subTotal dan grandTotal
const calculateTotals = (
  cart: CartItem[], 
  discountType: 'PERCENT' | 'NOMINAL' = 'NOMINAL', 
  discountValue: number = 0, 
  applyTax: boolean = false
) => {
  const subTotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);
  
  // Hitung nominal diskon
  let discountAmount = 0;
  if (discountType === 'PERCENT' && discountValue > 0) {
    discountAmount = subTotal * (discountValue / 100);
  } else if (discountType === 'NOMINAL' && discountValue > 0) {
    discountAmount = discountValue;
  }

  // Batasi diskon maksimal sebesar subTotal
  if (discountAmount > subTotal) {
    discountAmount = subTotal;
  }

  // Hitung nominal PPN (11% dari total setelah dikurangi diskon)
  const taxableAmount = subTotal - discountAmount;
  const taxAmount = applyTax ? taxableAmount * 0.11 : 0;

  const grandTotal = taxableAmount + taxAmount;
  return { subTotal, grandTotal };
};

export const useCartStore = create<CartState>((set) => ({
  cart: [],
  subTotal: 0,
  discountType: 'NOMINAL',
  discountValue: 0,
  applyTax: false,
  grandTotal: 0,

  // Menambahkan barang ke dalam keranjang
  addToCart: (product) => set((state) => {
    const existingItemIndex = state.cart.findIndex(item => item.productId === product.productId);
    let newCart = [...state.cart];

    if (existingItemIndex > -1) {
      const existingItem = newCart[existingItemIndex];
      // Pastikan kuantitas tidak melebihi stok yang tersedia
      if (existingItem.quantity < product.stock) {
        newCart[existingItemIndex] = {
          ...existingItem,
          quantity: existingItem.quantity + 1
        };
      }
    } else {
      // Pastikan stok minimal ada 1 untuk bisa dimasukkan keranjang
      if (product.stock > 0) {
        newCart.push({
          ...product,
          quantity: 1
        });
      }
    }

    return {
      cart: newCart,
      ...calculateTotals(newCart, state.discountType, state.discountValue, state.applyTax)
    };
  }),

  // Menghapus barang dari keranjang secara penuh
  removeFromCart: (productId) => set((state) => {
    const newCart = state.cart.filter(item => item.productId !== productId);
    return {
      cart: newCart,
      ...calculateTotals(newCart, state.discountType, state.discountValue, state.applyTax)
    };
  }),

  // Memperbarui jumlah barang secara manual (+/- atau input angka)
  updateQuantity: (productId, quantity) => set((state) => {
    const itemIndex = state.cart.findIndex(item => item.productId === productId);
    if (itemIndex === -1) return {};

    const targetItem = state.cart[itemIndex];
    let newQty = quantity;

    // Batasi kuantitas agar minimal 1 dan maksimal sesuai sisa stok produk
    if (newQty < 1) newQty = 1;
    if (newQty > targetItem.stock) newQty = targetItem.stock;

    const newCart = [...state.cart];
    newCart[itemIndex] = {
      ...targetItem,
      quantity: newQty
    };

    return {
      cart: newCart,
      ...calculateTotals(newCart, state.discountType, state.discountValue, state.applyTax)
    };
  }),

  // Set Diskon
  setDiscount: (type, value) => set((state) => {
    const nextValue = value < 0 ? 0 : value;
    return {
      discountType: type,
      discountValue: nextValue,
      ...calculateTotals(state.cart, type, nextValue, state.applyTax)
    };
  }),

  // Set Pajak PPN
  setApplyTax: (apply) => set((state) => ({
    applyTax: apply,
    ...calculateTotals(state.cart, state.discountType, state.discountValue, apply)
  })),

  // Mengosongkan keranjang belanja
  clearCart: () => set({
    cart: [],
    subTotal: 0,
    discountType: 'NOMINAL',
    discountValue: 0,
    applyTax: false,
    grandTotal: 0
  })
}));
