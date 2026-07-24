import React from 'react';
import type { CartItem } from '../../store/useCartStore';
import type { Customer } from '../../store/useCustomerStore';
import type { Product } from '../../hooks/usePos';
import { MobileCartDrawer } from '../PosView/MobileCartDrawer';
import { PosCartBody } from './PosCartBody';

interface PosCartPanelProps {
  cart: CartItem[];
  cartItemCount: number;
  showCartPanel: boolean;
  setShowCartPanel: (val: boolean) => void;
  updateQuantity: (id: string, qty: number) => void;
  removeFromCart: (id: string) => void;
  paymentMethod: string;
  setPaymentMethod: (method: string) => void;
  splitCashAmount?: number | '';
  setSplitCashAmount?: (val: number | '') => void;
  splitQrisAmount?: number | '';
  setSplitQrisAmount?: (val: number | '') => void;
  selectedCustomer: Customer | null;
  setSelectedCustomer: (cust: Customer | null) => void;
  customerQuery: string;
  setCustomerQuery: (query: string) => void;
  searchResults: Customer[];
  setSearchResults: (results: Customer[]) => void;
  setShowAddCustomerModal: (val: boolean) => void;
  discountType: 'PERCENT' | 'NOMINAL';
  discountValue: number;
  setDiscount: (type: 'PERCENT' | 'NOMINAL', val: number) => void;
  applyTax: boolean;
  setApplyTax: (val: boolean) => void;
  subTotal: number;
  grandTotal: number;
  handleCheckout: () => void;
  isSubmitting: boolean;
  canCheckout: boolean;
  activeShift: boolean;
  popularProducts: Product[];
  onAddToCart: (product: Omit<CartItem, 'quantity'>) => void;
}

export const PosCartPanel: React.FC<PosCartPanelProps> = (props) => {
  const { showCartPanel, setShowCartPanel, ...bodyProps } = props;
  const closeCart = () => setShowCartPanel(false);

  return (
    <>
      <MobileCartDrawer isOpen={showCartPanel} onClose={closeCart}>
        <div className="flex flex-col min-h-0 flex-1">
          <PosCartBody variant="mobile" onClose={closeCart} {...bodyProps} />
        </div>
      </MobileCartDrawer>

      <section
        className="hidden lg:flex flex-col overflow-hidden bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xl h-full lg:static lg:z-10 lg:w-[35%] xl:w-[30%] lg:border-l"
      >
        <PosCartBody variant="desktop" {...bodyProps} />
      </section>
    </>
  );
};
