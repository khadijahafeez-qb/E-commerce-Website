'use client';

import React, { useState } from 'react';
import { Table, Button } from 'antd';
import { useEffect } from 'react';
import './page.css';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { Image } from 'antd';
import ProductModal from '@/app/components/product-model';
import DeleteConfirmModal from '@/app/components/deleteconfirmmodal';
import AddMultipleProductsModal from '@/app/components/add-multiple-product-model';
import AddSingleProductModal from '@/app/components/add-single-product-model';

export interface Variant {
  id: string;
  colour: string;
  size: string;
  colourcode: string;
  price: number;
  stock: number;
  img: string
}

export interface Product {
  id: string;
  isDeleted:'active'|'deleted';
  title: string;
  img: string;
  variants: Variant[]; // ⬅️ Add this
}

const ProductPage: React.FC = () => {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [addopen, setaddOpen] = useState(false);
  const [data, setData] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 12;
  const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [isVariantDeleteModalOpen, setIsVariantDeleteModalOpen] = useState(false);
  const [variantToDelete, setVariantToDelete] = useState<{ id: string; productId: string } | null>(null);



  const handleInactivateVariant = async () => {
    if (!variantToDelete) return;

    try {
      const res = await fetch(`/api/product/delete-product-variant/${variantToDelete.id}`, {
        method: 'PUT',
      });

      const result = await res.json();
      if (!result.success) throw new Error(result.error || 'Failed to inactivate variant');

      // Update local state so variant disappears or gets flagged
      setData((prev) =>
        prev.map((p) =>
          p.id === variantToDelete.productId
            ? {
              ...p,
              variants: p.variants.filter((v) => v.id !== variantToDelete.id),
            }
            : p
        )
      );

      setIsVariantDeleteModalOpen(false);
      setVariantToDelete(null);
    } catch (err) {
      console.error('Inactivate variant failed:', err);
    }
  };


  const fetchProducts = async (page: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/product?page=${page}&limit=${pageSize}`);
      if (!res.ok) throw new Error('Failed to fetch products');
      const result = await res.json();
      setData(result.products);
      setTotal(result.total); // you need to return total count from your API
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts(currentPage);
  }, [currentPage]);
  const handleDeleteProduct = async (id: string) => {
    try {
      const res = await fetch(`/api/product/delete-product/${id}`, {
        method: 'DELETE',
      });

      const data: { success: boolean; error?: string } = await res.json();

      if (!data.success) {
        throw new Error(data.error ?? 'Failed to delete product');
      }

      setData((prev) => prev.filter((p) => p.id !== id));
      setIsDeleteOpen(false);
      setSelectedProduct(null);
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };


  const columns = [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      render: (text: string) => (
        <div className="flex items-center gap-3">
          <span>{text}</span>
        </div>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: Product) => (
        <div className="flex gap-[12px]">
          <DeleteOutlined
            className="!text-red-500 !text-[16px] "
            onClick={() => {
              setSelectedProduct(record);
              setIsDeleteOpen(true);
            }}
          />
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="flex justify-between items-center mt-9 ">
        <h4 className="font-inter font-medium text-[24px] leading-[28.8px] text-[#007BFF]">Products</h4>
        <div className="flex gap-3">
          <Button className=" !w-[203px] !h-[36px] !bg-white !text-[#007BFF] !border !border-[#007BFF]"
            onClick={() => {
              setSelectedProduct(null); // reset → open Add mode
              setIsEditOpen(true);
            }} >+ Add a Single Product</Button>
          <Button type="primary" className="!w-[203px] !h-[36px]" onClick={() => setaddOpen(true)}>+ Add Multiple Products</Button>
        </div>
      </div>
      <Table
        className="mt-4"
        columns={columns}
        loading={loading}
        rowKey="id"
        dataSource={data}
        expandable={{
          expandedRowRender: (product: Product) => {
            const hasScroll = product.variants.length > 10;

            return (
              <div className="overflow-x-auto bg-[#fafafa] rounded-md p-4 border border-gray-200">
                <Table<Variant>
                  size="small"
                  pagination={false}
                  scroll={hasScroll ? { y: 300 } : undefined} // 👈 enable scroll if >10
                  columns={[
                    {
                      title: 'Image',
                      dataIndex: 'img',
                      key: 'img',
                      render: (text: string, record: Variant) => (

                        <Image
                          src={record.img}
                          alt={text}
                          className="!w-[24px] !h-[24px] object-cover"
                        ></Image>


                      ),
                    },
                    {
                      title: 'Colour Code',
                      dataIndex: 'colourcode',
                      key: 'colourcode',
                      render: (colourcode: string) => (
                        <div className="flex items-center gap-2">
                          <div
                            style={{
                              width: 20,
                              height: 20,
                              borderRadius: '50%',
                              backgroundColor: colourcode,
                              border: '1px solid #ccc',
                            }}
                          />
                        </div>
                      ),
                    },
                    { title: 'Colour', dataIndex: 'colour', key: 'colour' },
                    { title: 'Size', dataIndex: 'size', key: 'size' },
                    {
                      title: 'Price',
                      dataIndex: 'price',
                      key: 'price',
                      render: (price: number) => `$${price.toFixed(2)}`,
                    },
                    { title: 'Stock', dataIndex: 'stock', key: 'stock' },
                    {
                      title: 'Actions',
                      key: 'actions',
                      render: (variant: Variant) => (
                        <div className="flex gap-[12px]">
                          <EditOutlined
                            className="!text-blue-500 !text-[16px]"
                            onClick={() => {
                              setSelectedVariant(variant);
                              setSelectedProduct(product); // store parent product
                              setIsVariantModalOpen(true);
                            }}
                          />
                          <DeleteOutlined
                            className="!text-red-500 !text-[16px]"
                            onClick={() => {
                              setVariantToDelete({ id: variant.id, productId: product.id });
                              setIsVariantDeleteModalOpen(true);
                            }}
                          />
                        </div>
                      ),
                    },
                  ]}
                  rowKey="id"
                  dataSource={product.variants}
                />

                {/* Optional Add Variant Button */}
                <div className="mt-2 flex justify-end">
                  <Button
                    type="dashed"
                    size="small"
                    onClick={() => {
                      setSelectedProduct(product);
                      setIsVariantModalOpen(true);
                      // open modal for adding variant
                    }}
                  >
                    + Add Variant
                  </Button>
                </div>
              </div>
            );
          },
        }}

        pagination={{
          current: currentPage,
          pageSize,
          total,
          showSizeChanger: false,
          onChange: (page) => setCurrentPage(page),
        }}
        bordered
      />
<ProductModal
  open={isVariantModalOpen}
  onCancel={() => {
    setIsVariantModalOpen(false);
    setSelectedVariant(null);
  }}
  variant={selectedVariant}
  productId={selectedProduct?.id || ''}
  mode={selectedVariant ? 'edit' : 'add'} // 👈 key change
/>


        <DeleteConfirmModal
  open={isVariantDeleteModalOpen}
  onCancel={() => setIsVariantDeleteModalOpen(false)}
  onConfirm={handleInactivateVariant}
/>

{/* ✅ Delete Product Modal */}
<DeleteConfirmModal
  open={isDeleteOpen}
  onCancel={() => setIsDeleteOpen(false)}
  onConfirm={() => {
    if (selectedProduct) handleDeleteProduct(selectedProduct.id);
  }}
/>



<AddSingleProductModal
  open={isEditOpen}
  onCancel={() => setIsEditOpen(false)}
  onSuccess={() => fetchProducts(currentPage)}
/>
      <AddMultipleProductsModal open={addopen} onCancel={() => setaddOpen(false)} />

    </>
  );
};

export default ProductPage;
