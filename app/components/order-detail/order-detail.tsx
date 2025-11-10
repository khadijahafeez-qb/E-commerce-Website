'use client';

import React, { useEffect, } from 'react';
import { useSession } from 'next-auth/react';

import { Divider, Table, Image, Drawer, Spin } from 'antd';
import type { ColumnsType } from 'antd/es/table';

import { Product, fetchOrderDetail } from '@/lib/features/cart/orderdetailslice';
import { useAppSelector, useAppDispatch } from '@/lib/hook';
import type { RootState } from '@/lib/store';
import { tableClasses } from '@/utils/tableClasses';
import './order-detal.css';

interface OrderDetailDrawerProps {
  orderId: string | null;
  visible: boolean;
  onClose: () => void;
}
const OrderDetailDrawer: React.FC<OrderDetailDrawerProps> = ({ orderId, visible, onClose }) => {
  const { data: session } = useSession();
  const dispatch = useAppDispatch();
  const { products, orderInfo, loading } = useAppSelector((state: RootState) => state.orderDetail);
  useEffect(() => {
    if (orderId && visible) {
      dispatch(fetchOrderDetail(orderId));
    }
  }, [orderId, visible, dispatch]);
  const productColumns: ColumnsType<Product> = [
    {
      title: <span className={tableClasses.heading}>Products</span>,
      dataIndex: 'Title',
      key: 'Title',
      render: (text: string, record: Product) => (
        <div className="flex items-center gap-3">
          <Image
            className="!w-6 !h-6"
            src={record.image}
            alt={record.Title}
          />
          <span className={tableClasses.cellLight}>{record.Title}</span>
        </div>
      ),
    },
    {
      title: <span className={tableClasses.heading}>Unit price</span>,
      dataIndex: 'Price',
      key: 'UnitPrice',
      render: (text: number) => (
        <span className={tableClasses.cellLight}>
          ${text !== undefined && text !== null ? text.toFixed(2) : '0.00'}
        </span>
      ),
    },
    {
      title: <span className={tableClasses.heading}>Quantity</span>,
      dataIndex: 'Quantity',
      key: 'Quantity',
      render: (text: number) => <span className={tableClasses.cell}>{text}</span>,
    },
    {
      title: <span className={tableClasses.heading}>Price</span>,
      dataIndex: 'Price',
      key: 'Price',
      render: (price: number, record: Product) => (
        <span className={tableClasses.cell}>
          ${(price * record.Quantity).toFixed(2)}
        </span>
      ),
    },
  ];
  return (
    <Drawer
      title="Order Detail"
      className='custom-drawer'
      placement="right"
      width={1000}
      onClose={onClose}
      open={visible}
    >
      {loading ? (
        <div className="flex justify-center items-center h-full">
          <Spin size="large" />
        </div>
      ) : (
        <>
          <Divider className="border-t border-[#979797] mb-4" />
          <div className="label-div">
            {orderInfo.map((item, index: number) => {
              if (item.label === 'User' && session?.user?.role !== 'ADMIN') return null;
              return (
                <div key={index}>
                  <p className="label">{item.label}</p>
                  <p className="label-val">{item.value}</p>
                </div>
              );
            })}
          </div>
          <Divider className="border-t border-[#DEE2E6] mb-4" />
          <h5 className="product-heading">Product Information</h5>
          <div className="overflow-x-auto">
            <Table<Product>
              loading={loading}
              columns={productColumns}
              dataSource={products}
              pagination={false}
              bordered
              className="rounded-lg min-w-[400px]"
            />
          </div>
        </>
      )}
    </Drawer>
  );
};
export default OrderDetailDrawer;
