'use client';

import React, { useState, useEffect } from 'react';
import { Modal, Input, InputNumber, Button, Upload, message, Image } from 'antd';
import { UploadOutlined, EditOutlined } from '@ant-design/icons';
import { Variant } from '@/app/admin/frontend/product/page';

interface VariantModalProps {
  open: boolean;
  onCancel: () => void;
  variant?: Variant | null;
  productId: string;
}

const VariantModal: React.FC<VariantModalProps> = ({ open, onCancel, variant, productId }) => {
  const [colour, setColour] = useState('');
  const [size, setSize] = useState('');
  const [price, setPrice] = useState<number | null>(null);
  const [stock, setStock] = useState<number | null>(null);
  const [img, setImg] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [colourcode, setColourCode] = useState('');

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
      setImg(URL.createObjectURL(selected));
    }
  };

  const handleSave = async () => {
    if (!variant?.id) return message.error('Variant ID missing');
    setIsUploading(true);

    let imagePath = img;

    // Step 1: Upload image if new file is selected
    if (file) {
      const formData = new FormData();
      formData.append('file', file);

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) {
        setIsUploading(false);
        return message.error(uploadData.error || 'Image upload failed');
      }

      imagePath = uploadData.path; // e.g., /uploads/myfile.jpg
    }

    // Step 2: Update variant
    const payload = {
      colour,
      size,
      price,
      stock,
      img: imagePath,
      productId,
      colourcode
    };

    try {
      const res = await fetch(`/api/product/update-product/${variant.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update variant');
      message.success('Variant updated successfully');
      onCancel();
    } catch (err) {
      console.error('Error updating variant:', err);
      message.error('Failed to update variant');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      footer={null}
      title={<span className='text-lg font-semibold'>Edit Variant</span>}
      width={480}
    >
      <div className='flex flex-col gap-4 mt-3'>
        {/* 🖼 Image Display */}
        <div className='relative w-full h-48 rounded-lg overflow-hidden border'>
          {img ? (
            <Image
              src={img}
              alt='Variant'
              width='100%'
              height={190}
              style={{ objectFit: 'cover', borderRadius: '8px' }}
              preview={false}
              className="!w-full !h-full !object-contain rounded-md"
            />
          ) : (
            <div className='flex items-center justify-center h-full text-gray-400'>
              No image selected
            </div>
          )}

          {/* ✏️ Edit icon overlay */}
          <label
            htmlFor='fileUpload'
            className='absolute top-2 right-2 bg-white/80 hover:bg-white p-2 rounded-full shadow cursor-pointer'
          >
            <EditOutlined className='text-blue-500 text-lg' />
          </label>
          <input
            id='fileUpload'
            type='file'
            accept='image/*'
            className='hidden'
            onChange={handleImageChange}
          />
        </div>

        {/* 📝 Editable fields */}
        <div>
          <label className='block text-sm mb-1'>Colour</label>
          <Input value={colour} onChange={(e) => setColour(e.target.value)} />
        </div>
  
       <div>
          <label className='block text-sm mb-1'>Colour Code</label>
          <Input
            value={colourcode}
            onChange={(e) => setColourCode(e.target.value)}
            placeholder='#000000'
          />
        </div>
        <div>
          <label className='block text-sm mb-1'>Size</label>
          <Input value={size} onChange={(e) => setSize(e.target.value)} />
        </div>

        <div>
          <label className='block text-sm mb-1'>Price</label>
          <InputNumber
            value={price ?? 0}
            onChange={(v) => setPrice(v ?? 0)}
            className='w-full'
          />
        </div>

        <div>
          <label className='block text-sm mb-1'>Stock</label>
          <InputNumber
            value={stock ?? 0}
            onChange={(v) => setStock(v ?? 0)}
            className='w-full'
          />
        </div>

        <div className='mt-4 flex justify-end'>
          <Button type='primary' loading={isUploading} onClick={handleSave}>
            Save Changes
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default VariantModal;
