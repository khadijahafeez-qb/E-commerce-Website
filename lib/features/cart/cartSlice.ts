// lib/features/cart/cartSlice.ts
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
  items: Product[];
}

const initialState: CartState = {
  items: [],
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart(state, action: PayloadAction<Product>) {
      const existing = state.items.find(
        (item) => item.id === action.payload.id);
      if (existing) {
        existing.count += action.payload.count;
      } else {
        state.items.push(action.payload);
      }
   
    },
    removeFromCart(state, action: PayloadAction<string>) {
      state.items = state.items.filter((item) => item.id !== action.payload);
    
    },
    clearCart(state) {
       
      state.items = [];  
      
    },
    updateQty(state,action: PayloadAction<{ id: string; count: number }>) {
      const { id, count } = action.payload;
      const product = state.items.find((item) => item.id === id);
      if (product) {
        product.count = Math.max(1,count); 
      
      }
    },
  
  },
 
});

export const selectUniqueCartCount = (state: RootState) =>
  state.cart.items.length;
export const { addToCart, removeFromCart, clearCart,updateQty } = cartSlice.actions;
export default cartSlice.reducer;
