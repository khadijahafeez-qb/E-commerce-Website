'use client';

import React, { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import './page.css';

import { Divider, Table, Image } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

import { Product, fetchOrderDetail } from '@/lib/features/cart/orderdetailslice';
import { useAppSelector, useAppDispatch } from '@/lib/hook';
import type { RootState } from '@/lib/store';
import MainLayout from '@/app/components/mainlayout';
import { tableClasses } from '@/utils/tableClasses';

const OrderDetailPage: React.FC = () => {
  const { id } = useParams();
  const dispatch = useAppDispatch();
  const { products, orderInfo,loading } = useAppSelector((state: RootState) => state.orderDetail);
  const { data: session } = useSession();

  useEffect(() => {
    if (id) dispatch(fetchOrderDetail(id));
  }, [id, dispatch]);

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
      key: 'Price',
      render: (text: number) => (
        <span className={tableClasses.cellLight}> ${text !== undefined && text !== null ? text.toFixed(2) : '0.00'}</span>
      ),
    },
     {
      title: <span className={tableClasses.heading}>Price</span>,
      dataIndex: 'Price',
      key: 'Price',
      render: (price:number,record:Product) => (
         <span className={tableClasses.cell}>
                  ${(price * record.Quantity).toFixed(2)}
                </span>
      ),
    },
    {
      title: <span className={tableClasses.heading}>Quantity</span>,
      dataIndex: 'Quantity',
      key: 'Quantity',
      render: (text: number) => (
        <span className={tableClasses.cell}>{text}</span>
      ),
    },

  ];
  const backLink =
    session?.user?.role === 'ADMIN'
      ? '/admin/frontend/order'
      : '/user/frontend/orders';

  return (
    <MainLayout showHeader={false}>
     <div className='headingdiv'>
        <Link href={backLink}>
          <ArrowLeftOutlined className='!text-blue-500 text-lg' />
        </Link>
        <h4 className='heading'>
          Order Detail
        </h4>
      </div>
     <Divider className='border-t border-[#979797] mb-6' ></Divider>
     <div className='label-div'>
        {orderInfo.map((item, index: number) => (
          <div key={index}>
            <p className='label'>
              {item.label}
            </p>
            <p className='label-val'>{item.value}</p>
          </div>
        ))}
      </div>
     <Divider className='border-t border-[#DEE2E6] mb-4'></Divider>
     <h5 className='product-heading'>
        Product Information
      </h5>
     <div className='overflow-x-auto'>
        <Table<Product>
          loading={loading}
          columns={productColumns}
          dataSource={products}
          pagination={false}
          bordered
          className='rounded-lg min-w-[600px]'
        />
      </div>
    </MainLayout>
  );
};
export default OrderDetailPage;
