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
  stats?: {
    totalOrders: number;
    totalUnits: number;
    totalAmount: number;
    lastUpdated?: string;
  };
}
interface OrdersState {
  data: Order[];
  total: number;
  page: number;
  limit: number;
  loading: boolean;
  stats: {
    totalOrders: number;
    totalUnits: number;
    totalAmount: number;
    lastUpdated?: string;
  };
  error: string | null;
}

const initialState: OrdersState = {
  data: [],
  total: 0,
  page: 1,
  limit: 10,
  loading: false,
  stats: { totalOrders: 0, totalUnits: 0, totalAmount: 0 },
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
export const updateOrderStatus = createAsyncThunk<
  Order, // return type
  { orderId: string; status: string }, // args
  { rejectValue: string }
>(
  'orders/updateOrderStatus',
  async ({ orderId, status }, { rejectWithValue }) => {
    try {
      const res = await fetch(`/api/order/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to update order status');
      }
      return await res.json();
    } catch (err) {
      if (err instanceof Error) return rejectWithValue(err.message);
      return rejectWithValue('Unknown error');
    }
  }
);
const ordersSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    resetOrders: () => initialState,
  },
extraReducers: (builder) => {
  builder
    // FETCH ORDERS
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
      state.stats = action.payload.stats || { totalOrders: 0, totalUnits: 0, totalAmount: 0 };
    })
    .addCase(fetchOrders.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload ?? 'Failed to fetch orders';
    })

    // UPDATE ORDER STATUS
    .addCase(updateOrderStatus.pending, (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase(updateOrderStatus.fulfilled, (state, action) => {
      state.loading = false;
      const updatedOrder = action.payload;
      const index = state.data.findIndex((o) => o.id === updatedOrder.id);
      if (index !== -1) {
        state.data[index] = { ...state.data[index], ...updatedOrder };
      }
    })
    .addCase(updateOrderStatus.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload ?? 'Failed to update order status';
    });
},

});

export const { resetOrders } = ordersSlice.actions;
export default ordersSlice.reducer;
