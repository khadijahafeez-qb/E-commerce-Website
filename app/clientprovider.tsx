'use client';

import { SessionProvider } from 'next-auth/react';
import { ConfigProvider } from 'antd';

export default function clientprovider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ConfigProvider>{children}</ConfigProvider>
    </SessionProvider>
  );
}
