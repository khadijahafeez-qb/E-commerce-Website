'use client';

import React, { useState } from 'react';
import { Modal, Form, Input, Button, message } from 'antd';

interface AddSingleProductModalProps {
  open: boolean;
  onCancel: () => void;
  onSuccess?: () => void; // refresh list after adding
  product?: { id?: string; title?: string } | null;
}

const AddSingleProductModal: React.FC<AddSingleProductModalProps> = ({ open, onCancel, onSuccess, product }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const isEdit = !!product?.id;

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const res = await fetch(
        isEdit ? `/api/product/update-product/${product?.id}` : '/api/product/add-product',
        {
          method: isEdit ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values),
        }
      );

      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Request failed');

      message.success(isEdit ? 'Product updated' : 'Product added');
      onCancel();
      onSuccess?.();
      form.resetFields();
    } catch (err: unknown) {
  // ✅ Use type guard to check if err is an Error
  if (err instanceof Error) {
    message.error(err.message);
  } else {
    message.error('Error saving product');
  }
}finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={isEdit ? 'Edit Product' : 'Add a Single Product'}
      open={open}
      onCancel={onCancel}
      footer={null}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{ title: product?.title || '' }}
        className="mt-4"
      >
        <Form.Item
          label="Product Title"
          name="title"
          rules={[{ required: true, message: 'Please enter product title' }]}
        >
          <Input placeholder="Enter product name" />
        </Form.Item>

        <div className="flex justify-end">
          <Button onClick={onCancel} className="mr-2">
            Cancel
          </Button>
          <Button type="primary" loading={loading} onClick={handleSubmit}>
            {isEdit ? 'Update' : 'Add Product'}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default AddSingleProductModal;
