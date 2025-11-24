'use client';

import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/lib/hook';
import { useDebounce } from 'use-debounce';

import { SearchOutlined, ExportOutlined, CheckOutlined } from '@ant-design/icons';
import {
  Table,
  Input,
  Button,
  Tooltip,
  Modal,
  notification,
  Skeleton
} from 'antd';

import { ordertable } from '@/app/user/frontend/orders/page';
import { updateOrderStatus, fetchOrders } from '@/lib/features/cart/orderslice';
import OrderDetailDrawer from '@/app/components/order-detail/order-detail';
import type { Order } from '@/lib/features/cart/orderslice';

interface admin_order_table extends Omit<ordertable, 'Status'> {
  key: string;
  User: string;
  status: 'PAID' | 'PENDING' | 'FULFILLED';
}
interface ExtendedOrder extends Order {
  user?: { fullname: string; email: string };
}
const Orders: React.FC = () => {
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebounce(search, 500);
  const [api, contextHolder] = notification.useNotification();
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [confirmOrderId, setConfirmOrderId] = useState<string | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const pageSize = 10;
  const dispatch = useAppDispatch();
  const { stats, data, total, loading, page } = useAppSelector((state) => state.orders);
  const loadOrders = async (pageNum: number) => {
    await dispatch(fetchOrders({ page: pageNum, search: debouncedSearch }));
  };
  useEffect(() => {
    loadOrders(1);
  }, [debouncedSearch]);
  const handlePageChange = (p: number) => {
  loadOrders(p);
};
  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      await dispatch(updateOrderStatus({ orderId, status: newStatus })).unwrap();
      api.success({
        message: 'Status Updated',
        description: `Order marked as ${newStatus}`,
        placement: 'topRight',
        duration: 2000
      });
      return true;
    } catch (err: unknown) {
      let errorMsg = 'Unknown error';
      if (err instanceof Error) {
        errorMsg = err.message;
      } else if (typeof err === 'object' && err !== null && 'message' in err) {
        errorMsg = String((err as { message: unknown }).message);
      }
      api.error({
        message: 'Update Failed',
        description: `Failed to update order ${orderId}: ${errorMsg}`,
        placement: 'topRight',
      });
      return false;
    }
  };
  const showConfirm = (orderId: string) => {
    setConfirmOrderId(orderId);
    setConfirmVisible(true);
  };
  const handleConfirmOk = async () => {
    if (!confirmOrderId) return;
    setConfirmLoading(true);
    try {
      await handleStatusUpdate(confirmOrderId, 'FULFILLED');
    } catch (err) {
      console.error('confirm ok error', err);
    } finally {
      setConfirmLoading(false);
      setConfirmVisible(false);
      setConfirmOrderId(null);
    }
  };
  const handleConfirmCancel = () => {
    setConfirmVisible(false);
    setConfirmOrderId(null);
  };
  const columns = [
    { title: 'Date', dataIndex: 'Date', key: 'Date' },
    { title: 'User', dataIndex: 'User', key: 'User' },
    { title: 'Order#', dataIndex: 'Order', key: 'Order' },
    { title: 'Products', dataIndex: 'Products', key: 'Products' },
    {
      title: 'Amount',
      dataIndex: 'Amount',
      key: 'Amount',
      render: (value?: number) => `$${(value ?? 0).toFixed(2)}`
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <span
          className={`px-2 py-1 rounded text-sm font-medium ${status === 'FULFILLED'
            ? 'bg-green-100 text-green-700'
            : status === 'PAID'
              ? 'bg-yellow-100 text-yellow-700'
              : 'bg-gray-100 text-gray-600'
            }`}
        >
          {status}
        </span>
      ),
    },
    {
      title: 'Actions',
      key: 'Actions',
      render: (_: unknown, record: admin_order_table) => {
        let tooltipText = '';
        if (record.status === 'PAID') tooltipText = 'Mark as Fulfilled';
        else if (record.status === 'PENDING') tooltipText = 'Cannot fulfill yet';
        else if (record.status === 'FULFILLED') tooltipText = 'Order is already fulfilled';
        const checkColor =
          record.status === 'PAID' ? 'green' :
            record.status === 'PENDING' ? 'gray' :
              'blue';
        const isDisabled = record.status !== 'PAID';
        return (
          <div className="flex items-center gap-2">
            <Tooltip title={tooltipText}>
              <span>
                <Button
                  type="text"
                  icon={<CheckOutlined style={{ color: checkColor }} />}
                  onClick={() => showConfirm(record.key)}
                  disabled={isDisabled}
                />
              </span>
            </Tooltip>
            <Tooltip title="View Details">
              <Button
                type="text"
                icon={<ExportOutlined />}
                onClick={() => {
                  setSelectedOrderId(record.key);
                  setDrawerVisible(true);
                }}
              />
            </Tooltip>
          </div>
        );
      },
    }
  ];
  const tableData: admin_order_table[] = data.map((order: ExtendedOrder) => ({
    key: order.id,
    Date: new Date(order.createdAt).toLocaleDateString(),
    User: order.user?.fullname || '-',
    Order: order.id,
    Products: order._count.items,
    status: order.status,
    Amount: order.total
  }));
  return (
    <div className="p-6">
      {contextHolder}
      <div className="flex justify-between gap-4 w-full mt-6">
        <div className="w-[324px] h-[81px] bg-white rounded-xl shadow-md flex items-center justify-between px-5">
          <div>
            <p className="text-gray-600 text-sm font-medium">Total Orders:</p>
            {loading ? (
              <Skeleton.Input style={{ width: 80 }} active size="small" />
            ) : (
              <p className="text-blue-500 text-2xl font-bold mt-1">{stats.totalOrders}</p>
            )}
          </div>
          <div className="bg-blue-100 w-10 h-10 flex items-center justify-center rounded-lg">🧾</div>
        </div>
        <div className="w-[324px] h-[81px] bg-white rounded-xl shadow-md flex items-center justify-between px-5">
          <div>
            <p className="text-gray-600 text-sm font-medium">Total Units:</p>
            {loading ? (
              <Skeleton.Input style={{ width: 80 }} active size="small" />
            ) : (
              <p className="text-blue-500 text-2xl font-bold mt-1">{stats.totalUnits}</p>
            )}
          </div>
          <div className="bg-blue-100 w-10 h-10 flex items-center justify-center rounded-lg">📦</div>
        </div>
        <div className="w-[324px] h-[81px] bg-white rounded-xl shadow-md flex items-center justify-between px-5">
          <div>
            <p className="text-gray-600 text-sm font-medium">Total Amount:</p>
            {loading ? (
              <Skeleton.Input style={{ width: 80 }} active size="small" />
            ) : (
              <p className="text-blue-500 text-2xl font-bold mt-1">${stats.totalAmount.toFixed(2)}</p>
            )}
          </div>
          <div className="bg-blue-100 w-10 h-10 flex items-center justify-center rounded-lg">💰</div>
        </div>
      </div>
      <div className="flex justify-between items-center mt-9">
        <h4 className="font-medium text-[24px] text-[#007BFF]">Orders</h4>
        <div className="relative w-[300px]">
          <Input
            placeholder="Search by user or order ID"
            prefix={<SearchOutlined className="text-gray-400" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-lg"
          />
        </div>
      </div>
      <Table
        className="mt-4"
        columns={columns}
        loading={loading}
        dataSource={tableData}
        pagination={{
          current: page,
          pageSize,
          total,
          showSizeChanger: false,
          onChange:handlePageChange,
        }}
        bordered
      />
      <OrderDetailDrawer
        orderId={selectedOrderId}
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
      />
      <Modal
        title="Confirm Status Update"
        open={confirmVisible}
        onOk={handleConfirmOk}
        confirmLoading={confirmLoading}
        onCancel={handleConfirmCancel}
        centered
      >
        <p>Are you sure you want to mark this order as FULFILLED?</p>
      </Modal>
    </div>
  );
};
export default Orders;
