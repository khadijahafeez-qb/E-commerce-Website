'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAppDispatch } from '@/lib/hook';
import z from 'zod';

import { Modal, Input, InputNumber, Button, Image, notification } from 'antd';
import { EditOutlined, PlusOutlined, MinusCircleOutlined } from '@ant-design/icons';

import { variantSchema } from '@/lib/validation/product';
import { addMultipleVariantsThunk } from '@/lib/features/cart/product-slice';

interface ProductModalProps {
  open: boolean;
  onCancel: () => void;
  productId: string;
  onSuccess: () => void;
}

type FormData = {
  variants: z.input<typeof variantSchema>[];
};

const AddVarinatModal: React.FC<ProductModalProps> = ({ open, onCancel, productId, onSuccess }) => {
  const dispatch = useAppDispatch();
  const [api, contextHolder] = notification.useNotification();
  const fileInputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const [files, setFiles] = useState<(File | null)[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    trigger,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(z.object({ variants: z.array(variantSchema) })),
    mode: 'onBlur',
    defaultValues: {
      variants: [
        { colour: '', colourcode: '', size: '', price: undefined, stock: undefined, img: '', availabilityStatus: 'ACTIVE' },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'variants',
  });

  useEffect(() => {
    if (open) {
      reset({
        variants: [
          { colour: '', colourcode: '', size: '', price: undefined, stock: undefined, img: '', availabilityStatus: 'ACTIVE' },
        ],
      });
      setFiles([null]);
      setImages(['']);
      fileInputRefs.current = [];
    }
  }, [open, reset]);

  const openFilePicker = (index: number) => fileInputRefs.current[index]?.click();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const selected = e.target.files?.[0];
    if (selected) {
      const blobURL = URL.createObjectURL(selected);
      const newFiles = [...files];
      const newImages = [...images];
      newFiles[index] = selected;
      newImages[index] = blobURL;
      setFiles(newFiles);
      setImages(newImages);
      setValue(`variants.${index}.img`, blobURL, { shouldValidate: true });
    } else {
      const newFiles = [...files];
      const newImages = [...images];
      newFiles[index] = null;
      newImages[index] = '';
      setFiles(newFiles);
      setImages(newImages);
      setValue(`variants.${index}.img`, '', { shouldValidate: true });
    }
    e.target.value = '';
  };

const onSubmit = async (data: FormData) => {
  setIsUploading(true);
  try {
    const finalVariants = await Promise.all(
      data.variants.map(async (v, idx) => {
        let imagePath = v.img;
        if (files[idx]) {
          const formData = new FormData();
          formData.append('file', files[idx]!);
          const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
          const uploadData = await uploadRes.json();
          if (!uploadRes.ok) throw new Error(uploadData.error || 'Upload failed');
          imagePath = uploadData.path;
        }
        return { ...v, img: imagePath };
      })
    );
    const res = await dispatch(addMultipleVariantsThunk({ productId, variants: finalVariants })).unwrap();
    api.success({
      message: 'Variants Added',
      description: `${res.createdVariants.length} variant(s) added successfully.`,
      placement: 'topRight',
    });

    onSuccess();
    onCancel();
  } catch (err: unknown) {
    console.error('Failed to save variants:', err);
    let description = 'Something went wrong while saving variants.';
    if (typeof err === 'string') {
      description = err;
    } else if (err instanceof Error) {
      description = err.message;
    } else if (typeof err === 'object' && err !== null) {
      const maybeErr = err as { error?: string; message?: string };
      if (maybeErr.error) description = maybeErr.error;
      else if (maybeErr.message) description = maybeErr.message;
    }

    api.error({
      message: 'Action Failed',
      description,
      placement: 'topRight',
    });
  } finally {
    setIsUploading(false);
  }
};


  return (
    <>
      {contextHolder}
      <Modal open={open} onCancel={onCancel} footer={null} title="Add Variants" width={600}>
        <form className="flex flex-col gap-4 mt-3" onSubmit={handleSubmit(onSubmit)}>
          {fields.map((field, index) => (
            <div key={field.id} className="border p-4 rounded relative">
              <label className="block text-sm mb-1">
                Variant Image <span className="text-red-500">*</span>
              </label>
              <div className={`relative w-full h-48 rounded-lg overflow-hidden border ${errors.variants?.[index]?.img ? 'border-red-500' : 'border-gray-300'}`}>
                {images[index] ? (
                  <Image
                    src={images[index]}
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
                  onClick={() => openFilePicker(index)}
                  className="absolute top-2 right-2 bg-white/80 hover:bg-white p-2 rounded-full shadow cursor-pointer"
                >
                  <EditOutlined className="text-blue-500 text-lg" />
                </div>
                <input
                  ref={el => { fileInputRefs.current[index] = el; }}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => handleImageChange(e, index)}
                />
                {errors.variants?.[index]?.img && (
                  <p className="text-red-500 text-sm mt-1">{errors.variants[index]?.img?.message}</p>
                )}
              </div>

              {/* Colour */}
              <div>
                <label className="block text-sm mb-1">Colour<span className="text-red-500"> *</span></label>
                <Controller
                  name={`variants.${index}.colour`}
                  control={control}
                  render={({ field }) => <Input {...field} onBlur={() => trigger(`variants.${index}.colour`)} />}
                />
                {errors.variants?.[index]?.colour && (
                  <p className="text-red-500 text-sm mt-1">{errors.variants[index]?.colour?.message}</p>
                )}
              </div>

              {/* Colour Code */}
              <div>
                <label className="block text-sm mb-1">Colour Code<span className="text-red-500"> *</span></label>
                <Controller
                  name={`variants.${index}.colourcode`}
                  control={control}
                  render={({ field }) => <Input {...field} placeholder="#000000" onBlur={() => trigger(`variants.${index}.colourcode`)} />}
                />
                {errors.variants?.[index]?.colourcode && (
                  <p className="text-red-500 text-sm mt-1">{errors.variants[index]?.colourcode?.message}</p>
                )}
              </div>

              {/* Size */}
              <div>
                <label className="block text-sm mb-1">Size<span className="text-red-500"> *</span></label>
                <Controller
                  name={`variants.${index}.size`}
                  control={control}
                  render={({ field }) => <Input {...field} onBlur={() => trigger(`variants.${index}.size`)} />}
                />
                {errors.variants?.[index]?.size && (
                  <p className="text-red-500 text-sm mt-1">{errors.variants[index]?.size?.message}</p>
                )}
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm mb-1">Price<span className="text-red-500"> *</span></label>
                <Controller
                  name={`variants.${index}.price`}
                  control={control}
                  render={({ field }) => <InputNumber {...field} className="w-full" onBlur={() => trigger(`variants.${index}.price`)}  placeholder="Enter price"/>}
                />
                {errors.variants?.[index]?.price && (
                  <p className="text-red-500 text-sm mt-1">{errors.variants[index]?.price?.message}</p>
                )}
              </div>

              {/* Stock */}
              <div>
                <label className="block text-sm mb-1">Stock<span className="text-red-500"> *</span></label>
                <Controller
                  name={`variants.${index}.stock`}
                  control={control}
                  render={({ field }) => <InputNumber {...field} className="w-full" onBlur={() => trigger(`variants.${index}.stock`)} placeholder="Enter stock"/>}
                />
                {errors.variants?.[index]?.stock && (
                  <p className="text-red-500 text-sm mt-1">{errors.variants[index]?.stock?.message}</p>
                )}
              </div>

              {/* Remove Button */}
              {fields.length > 1 && (
                <Button
                  type="dashed"
                  danger
                  className="mt-2"
                  icon={<MinusCircleOutlined />}
                  onClick={() => {
                    remove(index);
                    const newFiles = [...files];
                    const newImages = [...images];
                    newFiles.splice(index, 1);
                    newImages.splice(index, 1);
                    setFiles(newFiles);
                    setImages(newImages);
                  }}
                >
                  Remove Variant
                </Button>
              )}
            </div>
          ))}

          <Button
            type="dashed"
            className="mt-4"
            icon={<PlusOutlined />}
            onClick={() => {
              append({ colour: '', colourcode: '', size: '', price: 0, stock: 0, img: '', availabilityStatus: 'ACTIVE' });
              setFiles([...files, null]);
              setImages([...images, '']);
            }}
          >
            Add Another Variant
          </Button>

          <div className="mt-4 flex justify-end">
            <Button type="primary" htmlType="submit" loading={isUploading}>
              Add Variants
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
};

export default AddVarinatModal;
