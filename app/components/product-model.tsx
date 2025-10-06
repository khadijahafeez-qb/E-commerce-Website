'use client';

import React, { useState, useEffect, useRef } from 'react';

import { Modal, Input, Button, Image } from 'antd';
import { EditOutlined, UploadOutlined } from '@ant-design/icons';

import { Product } from '../admin/frontend/product/page';


interface ProductModalProps {
  open: boolean
  onCancel: () => void
  product?: Product | null;
  productId?: string | null;
}
const ProductModal: React.FC<ProductModalProps> = ({ open, onCancel, product, productId }) => {

  const [productName, setProductName] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [preview, setPreview] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    if (!productId && (!productName || !price || !quantity)) {
      alert('Please fill all required fields.');
      return;
    }
    const formData = new FormData();
    formData.append('title', productName);
    formData.append('price', price);
    formData.append('stock', quantity);
    if (fileInputRef.current?.files?.[0]) {
      formData.append('img', fileInputRef.current.files[0]);
    }
    const url = productId
      ? `/api/product/update-product/${productId}`
      : `/api/product/add-product`;
    const method = productId ? 'PUT' : 'POST';
    try {
      const res = await fetch(url, { method, body: formData });
      const data = await res.json();
      if (!res.ok) {
        console.error(data.error || 'Something went wrong');
        return;
      }
      onCancel();
    } catch (err) {
      console.error('Network error', err);
    }
  };
  useEffect(() => {
    if (open) {
      if (product) {
        setProductName(product.title);
        setPrice(product.price.toString());
        setQuantity(product.stock.toString());
        setPreview(product.img || '');
      } else {
        setProductName('');
        setPrice('');
        setQuantity('');
        setPreview('');
      }
    }
  }, [open, product]);
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPreview(URL.createObjectURL(file)); // show preview
    }
  };
  const handleUploadClick = () => {
    fileInputRef.current?.click(); // programmatically trigger file input
  };
  return (
    <Modal
      open={open}
      onCancel={onCancel}
      footer={null}
      title={<span className='text-xl font-semibold'>
        {product ? 'Edit a Single Product' : 'Add a Single Product'}
      </span>}
      className='rounded-lg'
      width={696}>
      <div className='h-[768px] border-t mt-2 pt-4'>
        <div className='flex gap-4'>
          <div className='relative w-32 h-32 border rounded-lg flex items-center justify-center overflow-hidden'>
            {preview ? (
              <>
                <Image
                  src={preview}
                  alt='product'
                  className='!w-full !h-full !object-cover rounded-lg' />

                <div className='absolute top-1 right-1 bg-white border rounded-full p-1 cursor-pointer shadow' onClick={handleUploadClick} >
                  <EditOutlined className='text-blue-500 text-lg' />
                </div>
              </>
            ) : (
              <div className="w-32 h-32  rounded-lg flex flex-col items-center justify-center">
                <UploadOutlined className="!text-blue-500 text-2xl mb-9" />
                <Button type='primary' onClick={handleUploadClick}>Upload</Button>
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type='file'
            accept='image/*'
            className='hidden'
            onChange={handleFileChange}
          />
          <div className='flex flex-col flex-1 gap-4'>
            <div>
              <label className='block text-sm font-medium mb-1'>Product Name</label>
              <Input
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                className='rounded-md'
              />
            </div>
            <div className='flex gap-4'>
              <div className='flex-1'>
                <label className='block text-sm font-medium mb-1'>Price</label>
                <Input
                  prefix='$'
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className='rounded-md'
                />
              </div>
              <div className='flex-1'>
                <label className='block text-sm font-medium mb-1'>Quantity</label>
                <Input
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className='rounded-md'
                />
              </div>
            </div>
          </div>
        </div>
        <div className='mt-6 flex justify-end'>
          <Button
            type='primary'
            onClick={handleSave}
            className='px-6 h-10 rounded-md'
          >
            {product ? 'Update' : 'Add'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ProductModal;
