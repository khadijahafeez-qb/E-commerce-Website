'use client';

import React, { useState, useEffect } from 'react';
import { Table, Input, Button, Tooltip, Modal } from 'antd';
import { SearchOutlined, ExportOutlined, CheckOutlined } from '@ant-design/icons';
import OrderDetailDrawer from '@/app/components/order-detail/order-detail';
import { ordertable } from '@/app/user/frontend/orders/page';
import { updateOrderStatus } from '@/lib/features/cart/orderslice';
import { useAppDispatch } from '@/lib/hook';

interface admin_order_table extends ordertable {
  key: string;
  User: string;
  status: string;

}

interface Order {
  id: string;
  status: string;
  createdAt: string;
  user?: { fullname: string; email: string };
  userId: string;
  total: number;
  _count: { items: number };
}

const Orders: React.FC = () => {
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [confirmOrderId, setConfirmOrderId] = useState<string | null>(null);
  const [data, setData] = useState<admin_order_table[]>([]);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [stats, setStats] = useState({ totalOrders: 0, totalUnits: 0, totalAmount: 0 });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 10;
const dispatch=useAppDispatch();

const handleStatusUpdate = async (orderId: string, newStatus: string) => {
  try {
    await dispatch(updateOrderStatus({ orderId, status: newStatus })).unwrap();
    fetchOrders(currentPage);
  } catch (err) {
    console.error('Error updating status:', err);
  }
};
  const fetchOrders = async (page: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/order?page=${page}&limit=${pageSize}&search=${encodeURIComponent(search)}`);
      const result = await res.json();
      setStats(result.stats || { totalOrders: 0, totalUnits: 0, totalAmount: 0 });
      const mapped: admin_order_table[] = result.orders.map((order: Order) => ({
        key: order.id,
        Date: new Date(order.createdAt).toLocaleDateString(),
        User: order.user?.fullname,
        Order: order.id,
        Products: order._count.items,
        status: order.status,
        Amount: `$${order.total.toFixed(2)}`,
      }));
      setData(mapped);
      setTotal(result.total);
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchOrders(currentPage);
  }, [currentPage, search]);
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
    { title: 'Amount', dataIndex: 'Amount', key: 'Amount' },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <div className="flex items-center gap-2">
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
        </div>
      ),
    },
    {
      title: 'Actions',
      key: 'Actions',
      render: (_: unknown, record: admin_order_table) => (
        <div className="flex items-center gap-2">
          {record.status === 'PAID' && (
            <Tooltip title="Mark as Fulfilled">
              <Button
                type="text"
                icon={<CheckOutlined style={{ color: 'green' }} />}
                onClick={() => showConfirm(record.key) }
              />
            </Tooltip>
          )}
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
      ),
    },
  ];
  return (
    <div className="p-6">
      {/* Stats Cards */}
      <div className="flex justify-between gap-4 w-full mt-6">
        <div className="w-[324px] h-[81px] bg-white rounded-xl shadow-md flex items-center justify-between px-5">
          <div>
            <p className="text-gray-600 text-sm font-medium">Total Orders:</p>
            <p className="text-blue-500 text-2xl font-bold mt-1">{stats.totalOrders}</p>
          </div>
          <div className="bg-blue-100 w-10 h-10 flex items-center justify-center rounded-lg">🧾</div>
        </div>

        <div className="w-[324px] h-[81px] bg-white rounded-xl shadow-md flex items-center justify-between px-5">
          <div>
            <p className="text-gray-600 text-sm font-medium">Total Units:</p>
            <p className="text-blue-500 text-2xl font-bold mt-1">{stats.totalUnits}</p>
          </div>
          <div className="bg-blue-100 w-10 h-10 flex items-center justify-center rounded-lg">📦</div>
        </div>

        <div className="w-[324px] h-[81px] bg-white rounded-xl shadow-md flex items-center justify-between px-5">
          <div>
            <p className="text-gray-600 text-sm font-medium">Total Amount:</p>
            <p className="text-blue-500 text-2xl font-bold mt-1">${stats.totalAmount}</p>
          </div>
          <div className="bg-blue-100 w-10 h-10 flex items-center justify-center rounded-lg">💰</div>
        </div>
      </div>

      {/* Table + Search */}
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
        dataSource={data}
        pagination={{
          current: currentPage,
          pageSize,
          total,
          showSizeChanger: false,
          onChange: (page) => setCurrentPage(page),
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
