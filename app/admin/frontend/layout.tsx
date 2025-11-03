'use client';

import React, { useState, ReactNode } from 'react';
import { signOut } from 'next-auth/react';
import { Layout, Button } from 'antd';
import {
  AppstoreOutlined,
  ShoppingOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import './layout.css';
import Productpage from './product/page';
import Orders from './order/page';



const { Header, Sider, Content } = Layout;
interface AdminLayoutProps {
  children: ReactNode;
  fullname?: string;
}

const headerStyle: React.CSSProperties = {
  height: 48,
  backgroundColor: '#FFFFFF',
   textAlign: 'right',   
  paddingRight: 36 , 
   display: 'flex',
  alignItems: 'center',      
  justifyContent: 'flex-end', 
    fontFamily: 'Inter, sans-serif',
  fontWeight: 500,
  fontSize: 12,
  lineHeight: '12px',
  color: '#007BFF',  
  boxShadow: '0px 4px 24px 0px #00000012', 
};

const contentStyle: React.CSSProperties = {
  background:'#F8F9FA',
  minHeight: 120,
  paddingRight:36,
  paddingLeft:36
};

const siderStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  paddingRight: '20px',
  paddingLeft: '20px',
  paddingBottom: '16px',
  paddingTop: '12px',
  backgroundColor: '#FFFFFF',
  borderRight: '1px solid #E8E8EC',
};

const AdminLayout: React.FC<AdminLayoutProps> = ({  fullname }) => {
  const [active, setActive] = useState<'products' | 'orders'>('products');
  const renderContent = () => {
    switch (active) {
      case 'products':
        return <Productpage></Productpage>;
      case 'orders':
        return <Orders></Orders>;
      default:
        return ;
    }};

  return (
    <Layout className="h-screen" >
      <Sider width={257} style={siderStyle}>
        <div className="flex flex-col justify-between h-full">
          <div>
            <p className="font-inter font-bold text-[16px] leading-6 " style={{color: 'black'}}>
              E-commerce
            </p>
            <Button
              icon={<AppstoreOutlined />}
              onClick={() => setActive('products')}
              block
              className={`mt-[24px] sidebar-button ${active === 'products' ? 'active' : 'inactive'}`}
            >
              Products
            </Button>
            <Button
              icon={<ShoppingOutlined />}
              onClick={() => setActive('orders')}
              block
              className={`!mt-3 sidebar-button ${active === 'orders' ? 'active' : 'inactive'}`}
            >
              Orders
            </Button>
          </div>

          <Button
            icon={<LogoutOutlined />}
             onClick={() => signOut({ callbackUrl: '/auth/login' })}
            block
            className="logout-button"
          >
            Logout
          </Button>
        </div>
      </Sider>

      <Layout>
        <Header style={headerStyle}>
        {fullname} 
        </Header>

        <Content style={contentStyle}> {renderContent()}</Content>
      </Layout>
    </Layout>
  );
};

export default AdminLayout;
