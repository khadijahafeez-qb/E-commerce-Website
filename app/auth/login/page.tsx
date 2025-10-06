'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';

import { notification } from 'antd';

import AuthForm from '../authform';
import { LoginData } from '@/lib/validation/auth';
import { getSession } from 'next-auth/react';

export default function LoginPage() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [rememberMe, setRememberMe] = useState(false);
  const [api, contextHolder] = notification.useNotification();
  const [disable, setdisable] = useState(false);
  async function handleSubmit(data: LoginData) {
    setErrors({});
    setdisable(true);
    try {
      const res = await signIn('credentials', {
        redirect: false,
        email: data.email,
        password: data.password,
        rememberMe: rememberMe,
      });
      if (res?.error) {
        setErrors({ password: 'inavlid credentials' });
        api.error({
          message: 'Login Failed',
          description: 'Wrong username or password. Please try again.',
          placement: 'topRight',
          duration: 2,
        });
        return;
      }
      if (res?.ok) {
        api.success({
          message: 'Login Successful 🎉',
          description: 'Welcome back!',
          placement: 'topRight',
          duration: 2,
        });
        const session = await getSession();
        const role = session?.user.role;
        setTimeout(() => {
          if (role === 'ADMIN') {
            window.location.href = '/admin/frontend/product';
          } else {
            window.location.href = '/user/frontend/productlist';
          }
        }, 1500);

      }
    } finally {
      setdisable(false);
    }
  }
  const fields = [
    { name: 'email', type: 'email', placeholder: 'Enter your email', label: 'Enter email Address' },
    { name: 'password', type: 'password', placeholder: 'Enter your password', label: 'Password' },
  ];
  return (
    <>
      {contextHolder}
      <AuthForm
        heading="Login"
        fields={fields}
        onSubmit={handleSubmit}
        buttonLabel="Login"
        buttonType="submit"
        disabled={disable}
        errors={errors}
        footer={
          <>
            <div className='flex flex-col items-center gap-2 mt-4'>
              <div className='flex gap-2 mb-6'>
                <p className='font-inter font-normal leading-[21px] text-[#5A5F7D]'>
                  Forgot Password?
                </p>
                <a href='/auth/forgot-password' className='font-inter font-normal leading-[21px] text-[#3C76FF]'>
                  Reset
                </a>
              </div>
              <p className='text-[#5A5F7D]'>
                Don’t have an account?{' '}
                <a href='/auth/signup' className='font-inter font-normal text-[#3C76FF]'>
                  Sign up
                </a>
              </p>
            </div>
          </>
        }
      >
        <div className='flex items-center gap-2 mt-4'>
          <input
            id='rememberMe'
            name='rememberMe'
            type='checkbox'
            className='h-[13px] w-[13px] border rounded'
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
          />
          <label htmlFor='remember' className='text-sm text-[#6C757D]'>
            Remember me
          </label>
        </div>
      </AuthForm>
    </>

  );
}
