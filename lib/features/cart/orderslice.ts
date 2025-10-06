import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export interface Order {
  id: string;
  createdAt: string;
  total: number;
  _count: { items: number };
}
export interface OrdersResponse {
  orders: Order[];
  total: number;
  page: number;
  limit: number;
}
interface OrdersState {
  data: Order[];
  total: number;
  page: number;
  limit: number;
  loading: boolean;
  error: string | null;
}

const initialState: OrdersState = {
  data: [],
  total: 0,
  page: 1,
  limit: 10,
  loading: false,
  error: null,
};
interface FetchOrdersArgs {
  page: number;
  search?: string;
}

export const fetchOrders = createAsyncThunk<OrdersResponse, FetchOrdersArgs, { rejectValue: string }>('orders/fetchOrders', async ({ page, search }, { rejectWithValue }) => {
  try {
    const res = await fetch(`/api/order?page=${page}&limit=10&search=${encodeURIComponent(search || '')}`);
    if (!res.ok) throw new Error('Failed to fetch orders');
    return (await res.json()) as OrdersResponse;
  } catch (err) {
    if (err instanceof Error) {
      return rejectWithValue(err.message);
    }
    return rejectWithValue('Unknown error'); 
  }
});

const ordersSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    resetOrders: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload.orders;
        state.total = action.payload.total;
        state.page = action.payload.page;
        state.limit = action.payload.limit;
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.error = action.payload ?? 'Failed to fetch orders';
      });
  },
});

export const { resetOrders } = ordersSlice.actions;
export default ordersSlice.reducer;
