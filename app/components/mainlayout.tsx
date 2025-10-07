'use client';
import { useSession, signOut } from 'next-auth/react';

import { Layout, Dropdown } from 'antd';
import { ShoppingCartOutlined, BellOutlined, UserOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { Badge } from 'antd';
const { Header, Content } = Layout;

import CartInitializer from './cart-initializer';
import { useAppSelector } from '@/lib/hook';
import { selectUniqueCartCount } from '@/lib/features/cart/cartSlice';

interface MainLayoutProps {
  children: React.ReactNode;
  showHeader?: boolean;
}
const MainLayout: React.FC<MainLayoutProps> = ({ children, showHeader = true, }) => {
  const { data: session } = useSession();
  const count = useAppSelector(selectUniqueCartCount);
  const items = [
    {
      key: 'orders',
      label: <Link href='/user/frontend/orders'>Orders</Link>,
    },
    {
      key: 'logout',
      label: (
        <button
          onClick={() => signOut({ callbackUrl: '/auth/login' })}
          className="w-full text-left"
        >
          Logout
        </button>
      ),
    },
  ];
  return (
    <Layout className='!bg-transparent'>
      <CartInitializer></CartInitializer>
      {showHeader && (
        <Header className='w-full  flex justify-between items-center !bg-white !py-3 !px-9 !h-[48px]'>
          <p className='font-inter font-bold text-[16px] leading-6 ' >E-commerce</p>
          <div className='flex items-center gap-5 max-w-[12rem] justify-end' >
            <Link href='/user/frontend/shopping-cart'>
              <Badge count={count} offset={[-2, 2]} style={{ minWidth: '18px', height: '18px' }}>
                <ShoppingCartOutlined className='w-4 h-4 !text-blue-500' />
              </Badge>
            </Link>
            <BellOutlined className='w-4 h-4 !text-blue-500' />
            {!session ? (
              <Link
                href='/auth/login'
                className='w-[32px] h-[12px] flex items-center justify-center !text-blue-500'
              >
                Login
              </Link>
            ) : (
              <Dropdown menu={{ items }} placement='bottomRight' arrow>
                < UserOutlined className='w-4 h-4 !text-blue-500' />
              </Dropdown>
            )}
          </div>
        </Header>
      )}
      <Content className='w-full pt-8 px-15 mb-6'>
        {children}
      </Content>
    </Layout>
  );
};
export default MainLayout;
