import { create } from 'zustand';
import { useAuthStore } from './useAuthStore';

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  sku: string;
  stock: number;
  quantity: number;
}

interface CartState {
  cart: CartItem[];
  subTotal: number;
  discountType: 'PERCENT' | 'NOMINAL';
  discountValue: number;
  applyTax: boolean;
  grandTotal: number;
  
  addToCart: (product: Omit<CartItem, 'quantity'>) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  setDiscount: (type: 'PERCENT' | 'NOMINAL', value: number) => void;
  setApplyTax: (apply: boolean) => void;
  clearCart: () => void;
}

const calculateTotals = (
  cart: CartItem[], 
  discountType: 'PERCENT' | 'NOMINAL' = 'NOMINAL', 
  discountValue: number = 0, 
  applyTax: boolean = false
) => {
  const subTotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);
  
  let discountAmount = 0;
  if (discountType === 'PERCENT' && discountValue > 0) {
    discountAmount = subTotal * (discountValue / 100);
  } else if (discountType === 'NOMINAL' && discountValue > 0) {
    discountAmount = discountValue;
  }

  if (discountAmount > subTotal) {
    discountAmount = subTotal;
  }

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

  addToCart: (product) => set((state) => {
    const existingItemIndex = state.cart.findIndex(item => item.productId === product.productId);
    const newCart = [...state.cart];

    if (existingItemIndex > -1) {
      const existingItem = newCart[existingItemIndex];
      if (existingItem.quantity < product.stock) {
        newCart[existingItemIndex] = {
          ...existingItem,
          quantity: existingItem.quantity + 1
        };
      }
    } else {
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

  removeFromCart: (productId) => set((state) => {
    const newCart = state.cart.filter(item => item.productId !== productId);
    return {
      cart: newCart,
      ...calculateTotals(newCart, state.discountType, state.discountValue, state.applyTax)
    };
  }),

  updateQuantity: (productId, quantity) => set((state) => {
    const itemIndex = state.cart.findIndex(item => item.productId === productId);
    if (itemIndex === -1) return {};

    const targetItem = state.cart[itemIndex];
    let newQty = quantity;

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

  setDiscount: (type, value) => set((state) => {
    const nextValue = value < 0 ? 0 : value;
    return {
      discountType: type,
      discountValue: nextValue,
      ...calculateTotals(state.cart, type, nextValue, state.applyTax)
    };
  }),

  setApplyTax: (apply) => set((state) => ({
    applyTax: apply,
    ...calculateTotals(state.cart, state.discountType, state.discountValue, apply)
  })),

  clearCart: () => set({
    cart: [],
    subTotal: 0,
    discountType: 'NOMINAL',
    discountValue: 0,
    applyTax: false,
    grandTotal: 0
  })
}));

useAuthStore.subscribe((state, prevState) => {
  if (state.activeOutletId !== prevState.activeOutletId) {
    useCartStore.getState().clearCart();
  }
});
