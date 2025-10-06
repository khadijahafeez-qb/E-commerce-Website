'use client';
import { useState } from 'react';

import AuthForm from '../authform';
import { notification } from 'antd';

import { ForgotPasswordData, forgotPasswordSchema } from '@/lib/validation/auth';

export default function ForgotpassPage() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [api, contextHolder] = notification.useNotification();
  const [disable, setdisable] = useState(false);
  async function handleSubmit(data: ForgotPasswordData) {
    setErrors({});
    setdisable(true);
    const parsed = forgotPasswordSchema.safeParse(data);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.issues.forEach((issue) => {
        const field = issue.path[0] as string; 
        fieldErrors[field] = issue.message;
      });
      setErrors(fieldErrors);
      setdisable(false);
      return;
    }
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();

      if (!res.ok) {
        setErrors({ email: result.error || 'Something went wrong' });
        return;
      }

      api.success({
        message: 'Email Sent',
        description: result.message || 'Reset Password Instructions has been sent to your email address. ',
        placement: 'topRight',
        duration: 3,
      });
    } catch (err) {
      setErrors({ email: 'Network error' });
    }finally{
      setdisable(false);
    }
  }
  const fields = [
    { name: 'email', type: 'email', placeholder: 'Please Enter your email', label: 'Enter email Address' },
  ];
  return (
    <>
      {contextHolder}
      <AuthForm
        heading='Forgot Password'
        fields={fields}
        errors={errors}
        buttonLabel="Forgot Password"
        buttonType="submit"
        disabled={disable}
        onSubmit={handleSubmit}
        
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
