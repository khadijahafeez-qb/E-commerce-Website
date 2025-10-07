import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '@/lib/store';

export interface Product {
  id: string;
  title: string;
  img: string;
  price: number;
  colour: string;
  size: string;
  stock: number;
  count: number;
}

interface CartState {
  userCarts: Record<string, Product[]>; 
  activeUserId: string | null;         
}

const initialState: CartState = {
  userCarts: {},
  activeUserId: null,
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<string | null>) {
      if (!state.userCarts) {
        state.userCarts = {};
      }
      state.activeUserId = action.payload;
      if (action.payload && !state.userCarts[action.payload]) {
        state.userCarts[action.payload] = [];
      }
    },
    addToCart(state, action: PayloadAction<Product>) {
      if (!state.activeUserId) return;
      const items = state.userCarts[state.activeUserId] || [];
      const existing = items.find((item) => item.id === action.payload.id);
      if (existing) {
        existing.count += action.payload.count;
      } else {
        items.push(action.payload);
      }
      state.userCarts[state.activeUserId] = items;
    },
    removeFromCart(state, action: PayloadAction<string>) {
      if (!state.activeUserId) return;
      const items = state.userCarts[state.activeUserId] || [];
      state.userCarts[state.activeUserId] = items.filter(
        (item) => item.id !== action.payload
      );
    },
    clearCart(state) {
      if (state.activeUserId) {
        state.userCarts[state.activeUserId] = [];
      }
    },
    updateQty(state, action: PayloadAction<{ id: string; count: number }>) {
      if (!state.activeUserId) return;
      const { id, count } = action.payload;
      const items = state.userCarts[state.activeUserId] || [];
      const product = items.find((item) => item.id === id);
      if (product) {
        product.count = Math.max(1, count);
      }
    },
  },
});
export const selectCartItems = (state: RootState) => {
  const cart = state?.cart;
  if (!cart) return [];
  const { activeUserId, userCarts } = cart;
  if (!activeUserId || !userCarts) return [];
  return userCarts[activeUserId] || [];
};
export const selectUniqueCartCount = (state: RootState) => selectCartItems(state).length;
export const { setUser, addToCart, removeFromCart, clearCart, updateQty } = cartSlice.actions;
export default cartSlice.reducer;
