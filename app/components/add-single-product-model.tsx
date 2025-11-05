'use client';

import React, { useState, useEffect } from 'react';
import { Modal, Input, Button, Row, Col, InputNumber, Form, notification } from 'antd';
import { PlusOutlined, MinusCircleOutlined, UploadOutlined } from '@ant-design/icons';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { productSchema, ProductInput } from '@/lib/validation/product';
import { addProductThunk } from '@/lib/features/cart/product-slice';
import { useAppDispatch } from '@/lib/hook';

interface AddSingleProductModalProps {
  open: boolean;
  onCancel: () => void;
  onSuccess?: () => void;
}

interface FileState {
  file: File | null;
  preview: string;
  isUploading: boolean;
  uploadedPath?: string;
}

const AddSingleProductModal: React.FC<AddSingleProductModalProps> = ({
  open,
  onCancel,
  onSuccess,
}) => {
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<FileState[]>([]);
  const [api, contextHolder] = notification.useNotification();

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<ProductInput>({
    resolver: zodResolver(productSchema),
    mode: 'onBlur',
    defaultValues: {
      title: '',
      isDeleted: 'active',
      variants: [
        { img: '', colour: '', colourcode: '', size: '', stock: 0, price: 0, availabilityStatus: 'ACTIVE' },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'variants',
  });

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      reset({
        title: '',
        isDeleted: 'active',
        variants: [
          { img: '', colour: '', colourcode: '', size: '', stock: 0, price: 0, availabilityStatus: 'ACTIVE' },
        ],
      });
      setFiles([{ file: null, preview: '', isUploading: false }]);
    }
  }, [open, reset]);

  // Image upload handler
  const handleImageUpload = async (index: number, file: File) => {
    if (!file) return;

    // Set uploading state
    setFiles(prev => {
      const updated = [...prev];
      updated[index] = {
        file,
        preview: URL.createObjectURL(file),
        isUploading: true,
      };
      return updated;
    });

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const uploadData = await res.json();

      if (!res.ok || !uploadData.success) {
        throw new Error(uploadData.error || 'Upload failed');
      }

      setValue(`variants.${index}.img`, uploadData.path);

      setFiles(prev => {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          isUploading: false,
          uploadedPath: uploadData.path,
        };
        return updated;
      });

      api.success({
        message: 'Image Uploaded',
        description: `Image uploaded successfully for variant ${index + 1}`,
        duration: 2,
      });
    } catch (error) {
      setFiles(prev => {
        const updated = [...prev];
        updated[index] = {
          file: null,
          preview: '',
          isUploading: false,
        };
        return updated;
      });

      api.error({
        message: 'Upload Failed',
        description:
          error instanceof Error ? error.message : 'Failed to upload image.',
        duration: 2,
      });
    }
  };

  // Form submit handler
  const onSubmit = async (data: ProductInput) => {
    try {
      setLoading(true);

      const missingImages = data.variants.filter((_, index) => {
        return !files[index]?.uploadedPath;
      });

      if (missingImages.length > 0) {
        throw new Error('Please upload images for all variants.');
      }

      const uploadingInProgress = files.some(file => file.isUploading);
      if (uploadingInProgress) {
        throw new Error('Please wait for images to finish uploading.');
      }

      const resultAction = await dispatch(addProductThunk(data));

      if (addProductThunk.fulfilled.match(resultAction)) {
        api.success({
          message: 'Product Added',
          description: 'Product created successfully with all variants!',
          duration: 2,
        });
        onCancel();
        onSuccess?.();
      } else if (addProductThunk.rejected.match(resultAction)) {
        const errorMessage = resultAction.payload as string;
        api.error({
          message: 'Add Product Failed',
          description:
            errorMessage?.includes('Duplicate variant')
              ? errorMessage
              : errorMessage || 'Failed to create product.',
          duration: 2,
        });
      }
    } catch (error) {
      api.error({
        message: 'Error',
        description:
          error instanceof Error
            ? error.message
            : 'Unexpected error while creating product.',
        duration: 2,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {contextHolder}
      <Modal
        title="Add Product with Variants"
        open={open}
        onCancel={onCancel}
        footer={null}
        width={800}
        destroyOnClose
      >
        <Form layout="vertical" onFinish={handleSubmit(onSubmit)}>
          {/* Product Title */}
          <Form.Item
            label="Product Title"
            validateStatus={errors.title ? 'error' : ''}
            help={errors.title?.message}
          >
            <Controller
              name="title"
              control={control}
              render={({ field }) => (
                <Input {...field} placeholder="Enter product title" size="large" />
              )}
            />
          </Form.Item>

          {/* Variants */}
          <div style={{ marginBottom: 16 }}>
            <h4>Product Variants</h4>
            <p style={{ color: '#666', fontSize: '14px' }}>
              Add multiple variants with different colors, sizes, and images
            </p>
          </div>

          {fields.map((field, index) => (
            <div
              key={field.id}
              style={{
                border: '1px solid #d9d9d9',
                borderRadius: 6,
                padding: 16,
                marginBottom: 16,
                backgroundColor: '#fafafa',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 16,
                }}
              >
                <h4 style={{ margin: 0 }}>Variant {index + 1}</h4>
                {fields.length > 1 && (
                  <Button
                    type="text"
                    danger
                    icon={<MinusCircleOutlined />}
                    onClick={() => {
                      remove(index);
                      setFiles(prev => prev.filter((_, i) => i !== index));
                    }}
                  >
                    Remove
                  </Button>
                )}
              </div>

              <Row gutter={16}>
                {/* Image Upload */}
                <Col span={12}>
                  <Form.Item
                    label="Product Image"
                    required
                    validateStatus={errors.variants?.[index]?.img ? 'error' : ''}
                    help={
                      errors.variants?.[index]?.img?.message ||
                      'Upload an image for this variant.'
                    }
                  >
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        id={`image-upload-${index}`}
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload(index, file);
                        }}
                      />
                      <Button
                        icon={<UploadOutlined />}
                        onClick={() =>
                          document
                            .getElementById(`image-upload-${index}`)
                            ?.click()
                        }
                        loading={files[index]?.isUploading}
                        disabled={files[index]?.isUploading}
                        block
                      >
                        {files[index]?.isUploading
                          ? 'Uploading...'
                          : 'Choose Image'}
                      </Button>

                      {files[index]?.preview && (
                        <div style={{ marginTop: 8, textAlign: 'center' }}>
                          <img
                            src={files[index].preview}
                            alt={`Variant ${index + 1}`}
                            style={{
                              width: 80,
                              height: 80,
                              objectFit: 'cover',
                              border: '1px solid #d9d9d9',
                              borderRadius: 4,
                            }}
                          />
                          <div
                            style={{
                              fontSize: 12,
                              color: '#52c41a',
                              marginTop: 4,
                            }}
                          >
                            {files[index]?.uploadedPath
                              ? '✓ Uploaded'
                              : 'Uploading...'}
                          </div>
                        </div>
                      )}
                    </div>
                  </Form.Item>
                </Col>

                {/* Color and Code */}
                <Col span={12}>
                  <Row gutter={8}>
                    <Col span={12}>
                      <Form.Item
                        label="Color"
                        validateStatus={errors.variants?.[index]?.colour ? 'error' : ''}
                        help={errors.variants?.[index]?.colour?.message}
                      >
                        <Controller
                          name={`variants.${index}.colour`}
                          control={control}
                          render={({ field }) => (
                            <Input {...field} placeholder="Red, Blue, etc." />
                          )}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        label="Color Code"
                        validateStatus={errors.variants?.[index]?.colourcode ? 'error' : ''}
                        help={errors.variants?.[index]?.colourcode?.message}
                      >
                        <Controller
                          name={`variants.${index}.colourcode`}
                          control={control}
                          render={({ field }) => (
                            <Input {...field} placeholder="#FF0000" />
                          )}
                        />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Form.Item
                    label="Size"
                    validateStatus={errors.variants?.[index]?.size ? 'error' : ''}
                    help={errors.variants?.[index]?.size?.message}
                  >
                    <Controller
                      name={`variants.${index}.size`}
                      control={control}
                      render={({ field }) => (
                        <Input {...field} placeholder="S, M, L, XL" />
                      )}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="Stock"
                    validateStatus={errors.variants?.[index]?.stock ? 'error' : ''}
                    help={errors.variants?.[index]?.stock?.message}
                  >
                    <Controller
                      name={`variants.${index}.stock`}
                      control={control}
                      render={({ field }) => (
                        <InputNumber {...field} min={0} style={{ width: '100%' }} />
                      )}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Price"
                    validateStatus={errors.variants?.[index]?.price ? 'error' : ''}
                    help={errors.variants?.[index]?.price?.message}
                  >
                    <Controller
                      name={`variants.${index}.price`}
                      control={control}
                      render={({ field }) => (
                        <InputNumber
                          {...field}
                          min={0}
                          step={0.01}
                          style={{ width: '100%' }}
                        />
                      )}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </div>
          ))}

          {/* Add Variant */}
          <Button
            type="dashed"
            onClick={() => {
              append({
                img: '',
                colour: '',
                colourcode: '',
                size: '',
                stock: 0,
                price: 0,
                availabilityStatus: 'ACTIVE',
              });
              setFiles(prev => [
                ...prev,
                { file: null, preview: '', isUploading: false },
              ]);
            }}
            icon={<PlusOutlined />}
            block
            style={{ marginBottom: 16 }}
          >
            Add Another Variant
          </Button>

          {/* Footer Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button onClick={onCancel}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              Create Product
            </Button>
          </div>
        </Form>
      </Modal>
    </>
  );
};

export default AddSingleProductModal;
