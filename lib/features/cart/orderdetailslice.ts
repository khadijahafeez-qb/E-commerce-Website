import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export interface Product {
  id: string;
  Title: string;
  Price: number;
  Quantity: number;
  image: string;
}

export interface OrderInfo {
  label: string;
  value: string | number;
}

export interface OrderDetailState {
  products: Product[];
  orderInfo: OrderInfo[];
  loading: boolean;
  error: string | null;
}

const initialState: OrderDetailState = {
  products: [],
  orderInfo: [],
  loading: false,
  error: null,
};

export const fetchOrderDetail = createAsyncThunk<{ products: Product[]; orderInfo: OrderInfo[] }, string | string[], { rejectValue: string }>('orderDetail/fetchOrderDetail', async (id, { rejectWithValue }) => {
  try {
    const res = await fetch(`/api/orderdetail/${id}`);
    if (!res.ok) throw new Error('Failed to fetch order detail');
    const data = await res.json();
    const products: Product[] = data.products.map((item: Product, index: number) => ({
      id: `prod-${index}`,
      Title: item.Title,
      Price: item.Price,
      Quantity: item.Quantity,
      image: item.image,
    }));
    const subtotal = products.reduce((acc, product) => acc + product.Price * product.Quantity, 0);
    const tax = subtotal * 0.10;
    const orderInfo: OrderInfo[] = data.orderInfo
      ? [
        { label: 'Date', value: new Date(data.orderInfo.date).toLocaleDateString() },
        { label: 'Order #', value: `${data.orderInfo.id.slice(0, 6)}` },
        { label: 'User', value: `${data.orderInfo.name}` },
        { label: 'Products', value: products.length },
        { label: 'Amount', value: `${data.orderInfo.total}` },
        { label: 'Tax (10%)', value: `$${tax.toFixed(2)}` },
      ]
      : [];
    return {
      products,
      orderInfo
    };
  } catch (err) {
    if (err instanceof Error) {
      return rejectWithValue(err.message);
    }
    return rejectWithValue('Unknown error');
  }
}
);
const orderDetailSlice = createSlice({
  name: 'orderDetail',
  initialState,
  reducers: {
    resetOrderDetail: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrderDetail.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrderDetail.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload.products;
        state.orderInfo = action.payload.orderInfo;
      })
      .addCase(fetchOrderDetail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'Failed to fetch order detail';
      });
  },
});

export const { resetOrderDetail } = orderDetailSlice.actions;
export default orderDetailSlice.reducer;
