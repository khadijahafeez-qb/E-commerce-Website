import { ProductInput, ProductOutput, VariantInput } from '@/lib/validation/product';

// export async function addProduct(data: ProductInput): Promise<ProductOutput> {
//   const res = await fetch('/api/product/add-product', {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify(data),
//   });

//   const json = await res.json();
//   if (!res.ok || !json.success) throw new Error(json.error || 'Failed to add product');
//   return json.product as ProductOutput;
// }
export const addProduct = async (productData: ProductInput) => {
  try {
    const response = await fetch('/api/product/add-product', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(productData),
    });

    const data = await response.json();

    if (!response.ok) {
      // Throw the error message from the API
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }

    return data;
  } catch (error) {
    // Re-throw the error so Redux thunk can catch it
    throw error;
  }
};

export async function addVariant(productId: string, data: VariantInput): Promise<VariantInput> {
  const res = await fetch(`/api/product/add-variant/${productId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.error || 'Failed to add variant');
  return json.variant as VariantInput;
}

export async function deleteProduct(id: string): Promise<ProductOutput> {
  const res = await fetch(`/api/product/delete-product/${id}`, { method: 'PATCH' });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.error || 'Failed to delete product');
  return json.product as ProductOutput;
}

export async function deactivateVariant(id: string): Promise<VariantInput> {
  const res = await fetch(`/api/product/delete-product-variant/${id}`, { method: 'PUT' });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.error || 'Failed to deactivate variant');
  return json.variant as VariantInput;
}

export async function updateVariant(id: string, data: VariantInput): Promise<VariantInput> {
  const res = await fetch(`/api/product/update-product/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.error || 'Failed to update variant');
  return json.variant as VariantInput;
}
