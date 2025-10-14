import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import {
  addProduct,
  addVariant,
  deleteProduct,
  deactivateVariant,
  updateVariant,
} from '@/lib/services/productApi';
import type {
  ProductInput,
  ProductOutput,
  VariantInput,
} from '@/lib/validation/product';

export interface ProductState {
  products: ProductOutput[];
  loading: boolean;
  error: string | null;
}

const initialState: ProductState = {
  products: [],
  loading: false,
  error: null,
};

// 🧩 Add product
export const addProductThunk = createAsyncThunk<ProductOutput, ProductInput>(
  'product/addProduct',
  async (data, { rejectWithValue }) => {
    try {
      return await addProduct(data);
    } catch (err) {
      if (err instanceof Error) return rejectWithValue(err.message);
      return rejectWithValue('Unknown error while adding product');
    }
  }
);

// 🧩 Add variant
export const addVariantThunk = createAsyncThunk<
  VariantInput,
  { productId: string; data: VariantInput }
>('product/addVariant', async ({ productId, data }, { rejectWithValue }) => {
  try {
    return await addVariant(productId, data);
  } catch (err) {
    if (err instanceof Error) return rejectWithValue(err.message);
    return rejectWithValue('Unknown error while adding variant');
  }
});

// 🧩 Delete product
export const deleteProductThunk = createAsyncThunk<ProductOutput, string>(
  'product/deleteProduct',
  async (id, { rejectWithValue }) => {
    try {
      return await deleteProduct(id);
    } catch (err) {
      if (err instanceof Error) return rejectWithValue(err.message);
      return rejectWithValue('Unknown error while deleting product');
    }
  }
);

// 🧩 Deactivate variant
export const deactivateVariantThunk = createAsyncThunk<
  VariantInput,
  string
>('product/deactivateVariant', async (id, { rejectWithValue }) => {
  try {
    return await deactivateVariant(id);
  } catch (err) {
    if (err instanceof Error) return rejectWithValue(err.message);
    return rejectWithValue('Unknown error while deactivating variant');
  }
});

// 🧩 Update variant
export const updateVariantThunk = createAsyncThunk<
  VariantInput,
  { id: string; data: VariantInput }
>('product/updateVariant', async ({ id, data }, { rejectWithValue }) => {
  try {
    return await updateVariant(id, data);
  } catch (err) {
    if (err instanceof Error) return rejectWithValue(err.message);
    return rejectWithValue('Unknown error while updating variant');
  }
});

// 🧱 Slice
const productSlice = createSlice({
  name: 'product',
  initialState,
  reducers: {
    clearProductError(state) {
      state.error = null;
    },
    setProducts(state, action: PayloadAction<ProductOutput[]>) {
      state.products = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Add Product
      .addCase(addProductThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addProductThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.products.push(action.payload);
      })
      .addCase(addProductThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Delete Product
      .addCase(deleteProductThunk.fulfilled, (state, action) => {
        state.products = state.products.filter(
          (p) => p.title !== action.payload.title
        );
      })
      .addCase(deleteProductThunk.rejected, (state, action) => {
        state.error = action.payload as string;
      })

      // Add Variant (merge with existing product if needed)
      .addCase(addVariantThunk.fulfilled, (state, action) => {
        state.loading = false;
        const variant = action.payload;
        // Find the product and add variant manually if desired
        // (depends on your state shape)
      })

      // Deactivate Variant
      .addCase(deactivateVariantThunk.rejected, (state, action) => {
        state.error = action.payload as string;
      })

      // Update Variant
      .addCase(updateVariantThunk.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const { clearProductError, setProducts } = productSlice.actions;
export default productSlice.reducer;
