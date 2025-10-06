'use client';

import { useForm } from 'react-hook-form';

import { notification } from 'antd';
import { zodResolver } from '@hookform/resolvers/zod';

import AuthForm, { type Field } from '../authform';
import { ForgotPasswordData, forgotPasswordSchema } from '@/lib/validation/auth';

export default function ForgotpassPage() {
  const [api, contextHolder] = notification.useNotification();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ForgotPasswordData>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: 'onBlur',
    reValidateMode: 'onBlur'
  });
  async function onSubmit(data: ForgotPasswordData) {
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) {
        api.error({
          message: 'Forgot-password Failed',
          description: result.message || 'Something went wrong',
          placement: 'topRight',
        });
        return;
      }
      api.success({
        message: 'Email Sent',
        description: result.message || 'Reset Password Instructions has been sent to your email address. ',
        placement: 'topRight',
        duration: 3,
      });
    } catch (err) {
      api.error({
        message: 'Network Error',
        description: 'Please try again later',
        placement: 'topRight',
      });
    }
  }
  const fields: Field<ForgotPasswordData>[] = [
    { name: 'email', type: 'email', placeholder: 'Enter your email', label: 'Email address', required: true },
  ];
  return (
    <>
      {contextHolder}
      <AuthForm<ForgotPasswordData>
        heading='Forgot Password'
        fields={fields}
        errors={errors}
        buttonLabel="Forgot Password"
        buttonType="submit"
        disabled={isSubmitting}
        onSubmit={handleSubmit(onSubmit)}
        register={register}
        footer={
          <>
            <div className="flex flex-col items-center mt-4">
              <p className="text-[#5A5F7D]">
                No, I remember my password{' '}
                <a href='/auth/login' className='font-inter font-normal text-[#3C76FF]'>
                  Login
                </a>
              </p>
            </div>
          </>
        }
      />
    </>
  );
}
