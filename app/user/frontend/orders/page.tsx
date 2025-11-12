'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useDebounce } from 'use-debounce';
import './page.css';

import { Table, Button, Input } from 'antd';
import { ExportOutlined, ArrowLeftOutlined, SearchOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import OrderDetailDrawer from '@/app/components/order-detail/order-detail';

import { useAppSelector, useAppDispatch } from '@/lib/hook';
import { fetchOrders, Order } from '@/lib/features/cart/orderslice';
import type { RootState } from '@/lib/store';
import MainLayout from '@/app/components/mainlayout';
import { tableClasses } from '@/utils/tableClasses';

export interface ordertable {
  key: string;
  Date: string,
  Order: string;
  Products: number;
  Amount: number;

}
const Orders: React.FC = () => {
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebounce(search, 500);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const dispatch = useAppDispatch();
  const { data, total, page, limit, loading } = useAppSelector(
    (state: RootState) => state.orders
  );
  useEffect(() => {
    dispatch(fetchOrders({ page: 1, search: debouncedSearch }));
  }, [dispatch, debouncedSearch]);
  const columns: ColumnsType<ordertable> = [
    {
      title: <span className={tableClasses.heading}>Date</span>,
      dataIndex: 'Date',
      key: 'Date',
      render: (createdAt: string) => {
        const dateObj = new Date(createdAt);
        const dateStr = dateObj.toLocaleDateString('en-US');
        const timeStr = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
        return (
          <div>
            <div>{dateStr}</div>
            <div>{timeStr}</div>
          </div>
        );
      },
    },
    {
      title: <span className={tableClasses.heading}>Order#</span>,
      dataIndex: 'Order',
      key: 'Order',
      render: (text: number) => (
        <span className={tableClasses.cellLight}>{text}</span>
      ),
    },

    {
      title: <span className={tableClasses.heading}>Products</span>,
      dataIndex: 'Products',
      key: 'Products',
      render: (text: number) => (
        <span className={tableClasses.cell}>{text}</span>
      ),
    },
    {
      title: <span className={tableClasses.heading}>Amount</span>,
      dataIndex: 'Amount',
      key: 'Amount',
      render: (text: number) => (
        <span className={tableClasses.cell}>${text.toFixed(2)}</span>
      ),
    },
    {
      title: <span className={tableClasses.heading}>Actions</span>,
      key: 'Actions',
      render: (_: unknown, record: ordertable) => (

        <Button
          type='text'
          icon={<ExportOutlined />}
          onClick={() => {
            setSelectedOrderId(record.key);
            setDrawerVisible(true);
          }}

        />

      ),
    },
  ];
  const formattedData: ordertable[] = (data ?? []).map((order: Order) => ({
    key: order.id,
    Date: order.createdAt,
    Order: `#${order.id}`,
    Products: order._count?.items,
    Amount: order.total,
  }));
  return (
    <MainLayout >
      <div className='header'>
        <div className='flex items-center gap-2'>
          <Link href='/user/frontend/shopping-cart'>
            <ArrowLeftOutlined className='!text-blue-500 text-lg' />
          </Link>
          <h4 className='heading'>
            Orders
          </h4>
        </div>
        <div className="relative w-[300px]">
          <Input
            placeholder="Search by order ID"
            prefix={<SearchOutlined className="text-gray-400" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-lg"
          />
        </div>
      </div>
      <div className='overflow-x-auto'>
        <Table<ordertable>
          loading={loading}
          columns={columns}
          dataSource={formattedData}
          pagination={{
            current: page,
            pageSize: limit,
            total,
            showSizeChanger: false,
          }}
          onChange={(pagination) => {
            dispatch(fetchOrders({ page: pagination.current!, search }));
          }}
          bordered
          className='rounded-lg min-w-[600px] '
        />
      </div>
      <div className="total">
        <p className="mb-2 sm:mb-0">
          <span className="font-medium">{total}</span> Total Count
        </p>
      </div>
      <OrderDetailDrawer
  orderId={selectedOrderId}
  visible={drawerVisible}
  onClose={() => setDrawerVisible(false)}
/>
    </MainLayout>
    
  );
};

export default Orders;

