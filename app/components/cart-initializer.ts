'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useAppDispatch } from '@/lib/hook';
import { setUser } from '@/lib/features/cart/cartSlice';

export default function CartInitializer() {
  const { data: session, status } = useSession();
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (status === 'loading') return;
    const userId = session?.user?.email || 'guest';
    dispatch(setUser(userId));
  }, [session, status, dispatch]);
  return null; 
}
