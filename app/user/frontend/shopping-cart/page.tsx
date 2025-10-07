'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import './page.css';

import { Table, Button, Checkbox, notification, Image } from 'antd';
import { DeleteOutlined, PlusOutlined, MinusOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

import { useAppSelector, useAppDispatch } from '@/lib/hook';
import { selectCartItems, removeFromCart, updateQty, clearCart } from '@/lib/features/cart/cartSlice';
import MainLayout from '@/app/components/mainlayout';
import DeleteConfirmModal from '@/app/components/deleteconfirmmodal';
import { tableClasses } from '@/utils/tableClasses';

interface cartList {
  key: string;
  title: string;
  color: string;
  size: string;
  qty: number;
  price: number;
  image: string;
  stock: number;
}

const ShoppingCartPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const [api, contextHolder] = notification.useNotification();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteKey, setDeleteKey] = useState<string | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const cartItems = useAppSelector(selectCartItems);

  const addplaceholder = async () => {
    const res = await fetch('/api/placeorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cartItems, total })
    });
    if (res.ok) {
      api.success({
        message: 'Order placed ',
        description: 'Order has been placed',
        placement: 'topRight',
      });
      dispatch(clearCart());
    }
  };
  const data: cartList[] = (cartItems || []).map((item) => ({
    key: item.id,
    title: item.title,
    color: item.colour,
    size: item.size,
    qty: item.count,
    price: item.price,
    image: item.img,
    stock: item.stock
  }));
  const showModal = (key: string) => {
    setDeleteKey(key);
    setIsModalOpen(true);
  };
  const handleCancel = () => {
    setIsModalOpen(false);
    setDeleteKey(null);
  };
  const handleConfirm = () => {
    if (deleteKey) {
      dispatch(removeFromCart(deleteKey));
    }
    setIsModalOpen(false);
  };
  const handleCheck = (key: string, checked: boolean) => {
    setSelectedRowKeys((prev) =>
      checked ? [...prev, key] : prev.filter((k) => k !== key)
    );
  };
  const updateQtyHandler = (key: string, action: 'inc' | 'dec') => {
    const product = cartItems.find((item) => item.id === key);
    if (!product) return;
    let newCount = product.count;
    if (action === 'inc') {
      newCount = Math.min(product.count + 1, product.stock);
    } else {
      newCount = Math.max(1, product.count - 1);
    }
    dispatch(updateQty({ id: product.id, count: newCount }));
  };
  const columns: ColumnsType<cartList> = [
    {
      title: (
        <div className='flex items-center gap-2'>
          <Checkbox
            checked={selectedRowKeys.length === data.length}
            indeterminate={selectedRowKeys.length > 0 && selectedRowKeys.length < data.length}
            onChange={(e) => {
              if (e.target.checked) { setSelectedRowKeys(data.map((item) => item.key)); }
              else { setSelectedRowKeys([]); }
            }}
          />
          <span className={tableClasses.heading}>Products</span>
        </div>
      ),
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: cartList) => (
        <div className='flex items-center gap-3'>
          <Checkbox
            checked={selectedRowKeys.includes(record.key)}
            onChange={(e) => handleCheck(record.key, e.target.checked)}
            style={{ transform: 'scale(0.8)' }}
          />
          <Image
            src={record.image}
            alt="product"
            preview={false}
            className="cart-img"
            style={{ width: '1.5rem', height: '1.5rem', }}
          />
          <span className={tableClasses.cellLight}>{text}</span>
        </div>
      ),
    },
    {
      title: <span className={tableClasses.heading}>Color</span>,
      dataIndex: 'color',
      key: 'color',
      render: (color: string) => <span className={tableClasses.cellLight}>{color}</span>,
    },
    {
      title: <span className={tableClasses.heading}>Size</span>,
      dataIndex: 'size',
      key: 'size',
      render: (size: string) => <span className={tableClasses.cell}>{size}</span>,
    },

    {
      title: <span className={tableClasses.heading}>Unit Price</span>,
      dataIndex: 'price',
      key: 'unitPrice',
      render: (price: number) => (
        <span className={tableClasses.cell}>${price.toFixed(2)}</span>
      ),
    },
    {
      title: <span className={tableClasses.heading}>qty</span>,
      dataIndex: 'qty',
      key: 'qty',
      render: (qty: number, record: cartList) => (
        <div className='flex items-center gap-2'>
          <button
            onClick={() => updateQtyHandler(record.key, 'dec')}
            className='cart-btn'
            disabled={qty <= 1}>
            <MinusOutlined className='!text-blue-500' />
          </button>
          <div className='cart-btn-display'>
            {qty}
          </div>
          <button
            onClick={() => updateQtyHandler(record.key, 'inc')}
            className='cart-btn'
            disabled={qty >= record.stock}>
            <PlusOutlined className='!text-blue-500' />
          </button>
        </div>
      ),
    },
    {
      title: <span className={tableClasses.heading}>Price</span>,
      dataIndex: 'price',
      key: 'price',
      render: (price: number, record: cartList) => (
        <span className={tableClasses.cell}>
          ${(price * record.qty).toFixed(2)}
        </span>
      ),
    },
    {
      title: <span className={tableClasses.heading}>Price</span>,
      key: 'actions',
      render: (_: unknown, record: cartList) => (
        <Button
          danger
          icon={<DeleteOutlined />}
          onClick={() => showModal(record.key)} />
      ),
    },
  ];
  const subtotal = data.reduce((acc, item) => acc + item.price * item.qty, 0);
  const tax = subtotal * 0.10;
  const total = subtotal + tax;
  return (
    <>
      {contextHolder}
      <MainLayout>
        <div className='flex items-center mb-6 gap-2'>
          <Link href='/user/frontend/productlist'>
            <ArrowLeftOutlined className='!text-blue-500 text-lg' />
          </Link>
          <h4 className='heading'>
            Your Shopping Bag
          </h4>
        </div>
        <div className='overflow-x-auto'>
          <Table<cartList>
            columns={columns}
            dataSource={data}
            pagination={{
              pageSize: 8,
              showSizeChanger: false,
            }}
            bordered
            className='rounded-lg min-w-[600px] '
          />
        </div>
        <div className='flex justify-end mt-6'>
          <div className='flex flex-col items-end  gap-[14px]'>
            <div className='text-div'>
              <p className='text-label'>Subtotal:</p>
              <p className='text-value'>${subtotal.toFixed(2)}</p>
            </div>
            <div className='text-div'>
              <p className='text-label'>Tax (10%):</p>
              <p className='text-value'>${tax.toFixed(2)}</p>
            </div>
            <div className='text-div'>
              <p className='text-label'>Total:</p>
              <p className='text-value'>${total.toFixed(2)}</p>
            </div>
          </div>
        </div>
        <div className='flex justify-end mt-6'>
          <Button onClick={addplaceholder} type='primary' className='placeorder-button'>
            Place Order
          </Button>
        </div>
        <DeleteConfirmModal open={isModalOpen} onCancel={handleCancel} onConfirm={handleConfirm} />
      </MainLayout>
    </>
  );
};
export default ShoppingCartPage;