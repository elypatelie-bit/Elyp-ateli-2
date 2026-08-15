import { create } from 'zustand';

export interface CartItem {
  productId: string;
  title: string;
  price: number;
  quantity: number;
  image?: string;
  variantName?: string | null;
}

interface CheckoutState {
  cart: CartItem[];
  paymentMethod: 'PIX' | 'SPLIT' | 'CARD';
  splitAmount: number;
  couponCode: string;
  couponDiscount: number;

  addItem: (item: CartItem) => void;
  removeItem: (productId: string, variantName?: string | null) => void;
  updateQuantity: (productId: string, variantName: string | null | undefined, quantity: number) => void;
  setPaymentMethod: (m: CheckoutState['paymentMethod']) => void;
  setSplitAmount: (v: number) => void;
  setCoupon: (code: string, discount: number) => void;
  clearCoupon: () => void;
  getSubtotal: () => number;
  clearCart: () => void;
}

const keyOf = (i: { productId: string; variantName?: string | null }) => i.productId + '::' + (i.variantName || '');

export const useCheckoutStore = create<CheckoutState>((set, get) => ({
  cart: [],
  paymentMethod: 'PIX',
  splitAmount: 0,
  couponCode: '',
  couponDiscount: 0,

  addItem: (item) =>
    set((state) => {
      const k = keyOf(item);
      const existing = state.cart.find((i: CartItem) => keyOf(i) === k);
      if (existing) {
        return { cart: state.cart.map((i: CartItem) => (keyOf(i) === k ? { ...i, quantity: i.quantity + item.quantity } : i)) };
      }
      return { cart: [...state.cart, item] };
    }),

  removeItem: (productId, variantName) =>
    set((state) => ({ cart: state.cart.filter((i: CartItem) => keyOf(i) !== keyOf({ productId, variantName })) })),

  updateQuantity: (productId, variantName, quantity) =>
    set((state) => ({
      cart: state.cart.map((i: CartItem) => (keyOf(i) === keyOf({ productId, variantName }) ? { ...i, quantity: Math.max(1, quantity) } : i))
    })),

  setPaymentMethod: (paymentMethod) => set({ paymentMethod }),
  setSplitAmount: (splitAmount) => set({ splitAmount }),
  setCoupon: (couponCode, couponDiscount) => set({ couponCode, couponDiscount }),
  clearCoupon: () => set({ couponCode: '', couponDiscount: 0 }),

  getSubtotal: () => get().cart.reduce((sum, i) => sum + i.price * i.quantity, 0),

  clearCart: () => set({ cart: [], couponCode: '', couponDiscount: 0, splitAmount: 0 })
}));
