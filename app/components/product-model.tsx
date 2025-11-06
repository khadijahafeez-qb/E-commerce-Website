
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Modal, Input, InputNumber, Button, Image, notification } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { variantSchema } from '@/lib/validation/product';
import { Variant } from '@/app/admin/frontend/product/page';
import { addVariantThunk, updateVariantThunk } from '@/lib/features/cart/product-slice';
import { useAppDispatch } from '@/lib/hook';
import z from 'zod';

interface ProductModalProps {
  open: boolean;
  onCancel: () => void;
  variant?: Variant | null;
  productId: string;
  mode: 'add' | 'edit';
  onSuccess: () => void;
}

type FormData = z.input<typeof variantSchema>;

const ProductModal: React.FC<ProductModalProps> = ({
  open,
  onCancel,
  variant,
  productId,
  mode,
  onSuccess
}) => {
  const dispatch = useAppDispatch();
    const [api, contextHolder] = notification.useNotification(); 
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [img, setImg] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
    trigger,
    reset
  } = useForm<FormData>({
    resolver: zodResolver(variantSchema),
    mode: 'onBlur', // validation triggers on blur
    defaultValues: {
      colour: '',
      colourcode: '',
      size: '',
      price: 0,
      stock: 0,
      img: '',
      availabilityStatus: 'ACTIVE',
    },
  });

  // Prefill when editing
  useEffect(() => {
    if (open) {
      if (variant) {
        // Edit mode: prefill values
        reset({
          colour: variant.colour || '',
          colourcode: variant.colourcode || '',
          size: variant.size || '',
          price: variant.price ?? 0,
          stock: variant.stock ?? 0,
          img: variant.img || '',
          availabilityStatus: 'ACTIVE',
        });
        setImg(variant.img || '');
        setFile(null);
      } else {
        // Add mode: clear all
        reset({
          colour: '',
          colourcode: '',
          size: '',
          price: 0,
          stock: 0,
          img: '',
          availabilityStatus: 'ACTIVE',
        });
        setImg('');
        setFile(null);
      }
    }
  }, [open, variant, reset]);

  const openFilePicker = () => fileInputRef.current?.click();


  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      const blobURL = URL.createObjectURL(selected);
      setImg(blobURL);
      setValue('img', blobURL, { shouldValidate: true }); // ✅ This is good
    } else {
      setImg('');
      setValue('img', '', { shouldValidate: true }); // ✅ Triggers validation if no image
    }

    e.target.value = '';
  };

  const onSubmit = async (data: FormData) => {

    if (mode === 'edit' && !variant?.id) return;

    setIsUploading(true);
    try {
      let imagePath = data.img;

      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadData.error || 'Upload failed');
        imagePath = uploadData.path;
      }

      const payload = { ...data, img: imagePath, productId };

      if (mode === 'edit' && variant?.id) {
        await dispatch(updateVariantThunk({ id: variant.id, data: payload })).unwrap();
        api.success({
          message: 'Variant Updated',
          description: `Variant "${data.colour}" has been updated successfully.`,
          placement: 'topRight',
        });
      } else {

        await dispatch(addVariantThunk({ productId, data: payload })).unwrap();
         api.success({
          message: 'Variant Added',
          description: `Variant "${data.colour}" has been added successfully.`,
          placement: 'topRight',
        });
      }
     if (onSuccess) onSuccess();
      onCancel(); // close modal on success
    }  catch (err: unknown) {
  console.error('Failed to save variant:', err);

  let description = 'Something went wrong while saving variant.';

  if (typeof err === 'object' && err !== null) {
    const maybeErr = err as { error?: string; message?: string };
    if (maybeErr.error) description = maybeErr.error;
    else if (maybeErr.message) description = maybeErr.message;
  } else if (typeof err === 'string') {
    description = err;
  }

  api.error({
    message: 'Action Failed',
    description,
    placement: 'topRight',
  });
}finally {
      setIsUploading(false);
    }
  };

  return (
     <>
      {contextHolder}
    <Modal
      open={open}
      onCancel={onCancel}
      footer={null}
      title={mode === 'edit' ? 'Edit Variant' : 'Add Variant'}
      width={480}
    >
      <form className="flex flex-col gap-4 mt-3" onSubmit={handleSubmit(onSubmit)}>
        {/* Image */}
        <div className={`relative w-full h-48 rounded-lg overflow-hidden border ${errors.img ? 'border-red-500' : 'border-gray-300'}`}>

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
          {errors.img && <p className="text-red-500 text-sm mt-1">{errors.img.message}</p>}
        </div>

        {/* Colour */}
        <div>
          <label className="block text-sm mb-1">Colour</label>
          <Controller
            name="colour"
            control={control}
            render={({ field }) => (
              <Input {...field} onBlur={() => trigger('colour')} />
            )}
          />
          {errors.colour && <p className="text-red-500 text-sm mt-1">{errors.colour.message}</p>}
        </div>

        {/* Colour Code */}
        <div>
          <label className="block text-sm mb-1">Colour Code</label>
          <Controller
            name="colourcode"
            control={control}
            render={({ field }) => (
              <Input {...field} onBlur={() => trigger('colourcode')} placeholder="#000000" />
            )}
          />
          {errors.colourcode && (
            <p className="text-red-500 text-sm mt-1">{errors.colourcode.message}</p>
          )}
        </div>

        {/* Size */}
        <div>
          <label className="block text-sm mb-1">Size</label>
          <Controller
            name="size"
            control={control}
            render={({ field }) => <Input {...field} onBlur={() => trigger('size')} />}
          />
          {errors.size && <p className="text-red-500 text-sm mt-1">{errors.size.message}</p>}
        </div>

        {/* Price */}
        <div>
          <label className="block text-sm mb-1">Price</label>
          <Controller
            name="price"
            control={control}
            render={({ field }) => (
              <InputNumber {...field} className="w-full" onBlur={() => trigger('price')} />
            )}
          />
          {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price.message}</p>}
        </div>

        {/* Stock */}
        <div>
          <label className="block text-sm mb-1">Stock</label>
          <Controller
            name="stock"
            control={control}
            render={({ field }) => (
              <InputNumber {...field} className="w-full" onBlur={() => trigger('stock')} />
            )}
          />
          {errors.stock && <p className="text-red-500 text-sm mt-1">{errors.stock.message}</p>}
        </div>

        <div className="mt-4 flex justify-end">
          <Button type="primary" htmlType="submit" loading={isUploading}>
            {mode === 'edit' ? 'Save Changes' : 'Add Variant'}
          </Button>
        </div>
      </form>
    </Modal>
    </>
  );
};

export default ProductModal;
