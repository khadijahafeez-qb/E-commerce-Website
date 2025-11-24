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
import { Variant, Product } from '@/app/admin/frontend/product/page';

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
interface UpdateTitlePayload {
  id: string;
  title: string;
}
export const addProductThunk = createAsyncThunk(
  'product/addProduct',
  async (productData: ProductInput, { rejectWithValue }) => {
    try {
      const response = await addProduct(productData);
      return response;
    } catch (error) {
      // Pass the error message to the rejected action
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error occurred');
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
// productSlice.ts getproduct thunk
export const getProductsThunk = createAsyncThunk<
  { products: Product[]; hasMore: boolean },
  { page: number; limit: number; search?: string; sort?: string }
>(
  'product/getProducts',
  async ({ page, limit, search = '', sort = '' }, { rejectWithValue }) => {
    try {
      const res = await fetch(
        `/api/product/get-products?page=${page}&limit=${limit}&search=${encodeURIComponent(
          search
        )}&sort=${encodeURIComponent(sort)}`
      );

      if (!res.ok) throw new Error('Failed to fetch products');

      const dataRaw = await res.json();

      // Map API response to match Product interface exactly
      // ✅ Correct mapping for Product interface
      const products: Product[] = dataRaw.products.map((p: Product) => ({
        id: p.id,
        title: p.title,
        isDeleted: p.isDeleted,
        img: p.img || '', // fallback if missing
        variants: (p.variants || []).map((v: Variant) => ({
          id: v.id,
          img: v.img || '',
          colour: v.colour,
          colourcode: v.colourcode,
          size: v.size,
          stock: v.stock,
          price: v.price,
          availabilityStatus: v.availabilityStatus ?? 'ACTIVE', // fallback if missing
        })),
      }));

      return { products, hasMore: dataRaw.hasMore,total: dataRaw.total};
    } catch (err) {
      if (err instanceof Error) return rejectWithValue(err.message);
      return rejectWithValue('Unknown error while fetching products');
    }
  }
);
export const reactivateVariantThunk = createAsyncThunk(
  'product/reactivateVariant',
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await fetch(`/api/product/reactivate-variant/${id}`, {
        method: 'PATCH',
      });
      if (!res.ok) throw new Error('Failed to activate variant');
      return await res.json();
    } catch (err) {
      return rejectWithValue((err as Error).message);
    }
  }
);
export const updateProductTitleThunk = createAsyncThunk<
  Product, // return type
  UpdateTitlePayload, // argument type
  { rejectValue: string }
>(
  'products/updateTitle',
  async ({ id, title }, { rejectWithValue }) => {
    try {
      const res = await fetch(`/api/product/update-product-title/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });

      const data = await res.json();

      if (!res.ok) {
        return rejectWithValue(data.error || 'Failed to update product title');
      }

      return data.product as Product;
    } catch (err) {
      return rejectWithValue('Network error while updating product title');
    }
  }
);
export const addMultipleVariantsThunk = createAsyncThunk<
  { createdVariants: VariantInput[] },
  { productId: string; variants: VariantInput[] }
>(
  'product/addMultipleVariants',
  async ({ productId, variants }, { rejectWithValue }) => {
    try {
      const res = await fetch(`/api/product/add-variants/${productId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variants })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add variants');
      return data;
    } catch (err) {
      if (err instanceof Error) return rejectWithValue(err.message);
      return rejectWithValue('Unknown error while adding variants');
    }
  }
);

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
      .addCase(addVariantThunk.fulfilled, (state) => {
        state.loading = false;
        
      })

      // Deactivate Variant
      .addCase(deactivateVariantThunk.rejected, (state, action) => {
        state.error = action.payload as string;
      })

      // Update Variant
      .addCase(updateVariantThunk.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      // Fetch products
      .addCase(getProductsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getProductsThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload.products.map(p => ({
          ...p,
          variants: p.variants.map(v => ({
            ...v,
            availabilityStatus: v.availabilityStatus ?? 'ACTIVE', // 👈 default
          })),
        }));
      })
      .addCase(getProductsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearProductError, setProducts } = productSlice.actions;
export default productSlice.reducer;
