'use client';

import React, { useState, useEffect,useRef } from 'react';
import { Modal, Input, InputNumber, Button, message, Image } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import { Variant } from '@/app/admin/frontend/product/page';

interface ProductModalProps {
  open: boolean;
  onCancel: () => void;
  variant?: Variant | null;
  productId: string;
  mode: 'add' | 'edit';
}

const ProductModal: React.FC<ProductModalProps> = ({
  open,
  onCancel,
  variant,
  productId,
  mode,
}) => {
    const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [colour, setColour] = useState('');
  const [colourcode, setColourCode] = useState('');
  const [size, setSize] = useState('');
  const [price, setPrice] = useState<number | null>(null);
  const [stock, setStock] = useState<number | null>(null);
  const [img, setImg] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Prefill when editing
  useEffect(() => {
    if (open && variant) {
      setColour(variant.colour || '');
      setColourCode(variant.colourcode || '');
      setSize(variant.size || '');
      setPrice(variant.price ?? null);
      setStock(variant.stock ?? null);
      setImg(variant.img || '');
      setFile(null);
    } else {
      setColour('');
      setColourCode('');
      setSize('');
      setPrice(null);
      setStock(null);
      setImg('');
      setFile(null);
    }
  }, [open, variant]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      const blobURL = URL.createObjectURL(selected);
      setImg(blobURL);
    }
    // allow same file re-selection
    e.target.value = '';
  };
    const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handleSave = async () => {
    if (mode === 'edit' && !variant?.id) {
      return message.error('Variant ID missing');
    }

    setIsUploading(true);
    let imagePath = img;

    try {
      // Upload image if selected
      if (file) {
        const formData = new FormData();
        formData.append('file', file);

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadData.error || 'Upload failed');

        imagePath = uploadData.path;
      }

      // Prepare payload
      const payload = {
        colour,
        colourcode,
        size,
        price,
        stock,
        img: imagePath,
        productId,
      };

      const url =
        mode === 'edit'
          ? `/api/product/update-product/${variant?.id}`
          : `/api/product/add-variant/${productId}`;
      const method = mode === 'edit' ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save variant');

      message.success(mode === 'edit' ? 'Variant updated!' : 'Variant added!');
      onCancel(); // close modal
    } catch (err) {
      console.error('Error saving variant:', err);
      message.error('Failed to save variant');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      footer={null}
      title={
        <span className="text-lg font-semibold">
          {mode === 'edit' ? 'Edit Variant' : 'Add Variant'}
        </span>
      }
      width={480}
    >
      <div className="flex flex-col gap-4 mt-3">
        {/* 🖼 Image */}
        <div className="relative w-full h-48 rounded-lg overflow-hidden border">
          {img ? (
            <Image
              src={img}
              alt="Variant"
              width="100%"
              height={190}
              style={{ objectFit: 'cover', borderRadius: '8px' }}
              preview={false}
              className="!w-full !h-full !object-contain rounded-md"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              No image selected
            </div>
          )}

           <div
            onClick={openFilePicker}
            className="absolute top-2 right-2 bg-white/80 hover:bg-white p-2 rounded-full shadow cursor-pointer"
          >
            <EditOutlined className="text-blue-500 text-lg" />
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageChange}
          />
        </div>

        {/* 📝 Fields */}
        <div>
          <label className="block text-sm mb-1">Colour</label>
          <Input value={colour} onChange={(e) => setColour(e.target.value)} />
        </div>

        <div>
          <label className="block text-sm mb-1">Colour Code</label>
          <Input
            value={colourcode}
            onChange={(e) => setColourCode(e.target.value)}
            placeholder="#000000"
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Size</label>
          <Input value={size} onChange={(e) => setSize(e.target.value)} />
        </div>

        <div>
          <label className="block text-sm mb-1">Price</label>
          <InputNumber
            value={price ?? 0}
            onChange={(v) => setPrice(v ?? 0)}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Stock</label>
          <InputNumber
            value={stock ?? 0}
            onChange={(v) => setStock(v ?? 0)}
            className="w-full"
          />
        </div>

        <div className="mt-4 flex justify-end">
          <Button type="primary" loading={isUploading} onClick={handleSave}>
            {mode === 'edit' ? 'Save Changes' : 'Add Variant'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ProductModal;
