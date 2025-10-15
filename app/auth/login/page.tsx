'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { notification, Button, Image } from 'antd';
import { zodResolver } from '@hookform/resolvers/zod';
import { getSession } from 'next-auth/react';

import AuthForm, { type Field } from '../authform';
import { LoginData, loginSchema } from '@/lib/validation/auth';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [rememberMe, setRememberMe] = useState(false);
  const [api, contextHolder] = notification.useNotification();
  const router = useRouter();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur',
    reValidateMode: 'onBlur'
  });

  async function onSubmit(data: LoginData) {
    try {

      const res = await signIn('credentials', {
        redirect: false,
        email: data.email,
        password: data.password,
        rememberMe: rememberMe,
      });
      if (res?.error) {
        api.error({
          message: 'Login Failed',
          description: 'Wrong email address or password. Please try again.',
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
        console.log('session:', session);
        setTimeout(() => {
          if (role === 'ADMIN') {
            router.push('/admin/frontend/product');
          } else {
            router.push('/user/frontend/productlist');
          }
        }, 1500);

      }
    } catch {
      api.error({
        message: 'Network Error',
        description: 'Please try again later',
        placement: 'topRight',
      });
    }
  }
  const fields: Field<LoginData>[] = [
    { name: 'email', type: 'email', placeholder: 'Enter your email', label: 'Email address', required: true },
    { name: 'password', type: 'password', placeholder: 'Enter your password', label: 'Password', required: true },
  ];
  return (
    <>
      {contextHolder}
      <AuthForm<LoginData>
        heading="Login"
        fields={fields}
        buttonLabel="Login"
        buttonType="submit"
        disabled={isSubmitting}
        onSubmit={handleSubmit(onSubmit)}
        register={register}
        errors={errors}
        footer={
          <>
            <div className='flex flex-col items-center gap-2 mt-4'>
              <Button
                type="default"
                className="flex items-center justify-center gap-2 w-full border border-gray-300 rounded-md hover:bg-gray-50 transition"
                onClick={() => signIn('google', { callbackUrl: '/' })}
              >
                <Image
                  src="https://media.wired.com/photos/5926ffe47034dc5f91bed4e8/master/pass/google-logo.jpg"
                  alt="Google Logo"
                  width={40}
                  height={20}
                />
                <span className="text-gray-700 font-medium">Sign in with Google</span>
              </Button>
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
