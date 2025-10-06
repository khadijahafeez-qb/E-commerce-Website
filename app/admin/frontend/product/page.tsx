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
export interface Product {
  id: string;
  title: string;
  price: number;
  stock: number;
  img: string
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
      render: (text: string, record: Product) => (
        <div className="flex items-center gap-3">
          <Image
            src={record.img}
            alt={text}
            className="!w-[24px] !h-[24px] object-cover"
          ></Image>
          <span>{text}</span>
        </div>
      ),
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      render: (price: number) => <span>${price.toFixed(2)}</span>,
    },
    {
      title: 'Stock',
      dataIndex: 'stock',
      key: 'stock',
      render: (stock: number) => <span >{stock}</span>,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: Product) => (
        <div className="flex gap-[12px]">
          <EditOutlined
            className="!text-blue-500 !text-[16px] "
            onClick={() => {
              setSelectedProduct(record);
              setIsEditOpen(true);
            }}
          />
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
        pagination={{
          current: currentPage,
          pageSize,
          total,
          showSizeChanger: false,
          onChange: (page) => setCurrentPage(page),
        }}
        bordered
      />
      <ProductModal open={isEditOpen} onCancel={() => setIsEditOpen(false)} product={selectedProduct} productId={selectedProduct?.id || null}></ProductModal>
      <DeleteConfirmModal open={isDeleteOpen} onCancel={() => setIsDeleteOpen(false)}
        onConfirm={() => {
          if (selectedProduct?.id) {
            handleDeleteProduct(selectedProduct.id);
          }
        }} />
      <AddMultipleProductsModal open={addopen} onCancel={() => setaddOpen(false)} />

    </>
  );
};

export default ProductPage;
