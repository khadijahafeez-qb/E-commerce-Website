'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';

import { notification } from 'antd';

import AuthForm from '../authform';
import { resetPasswordSchema, ResetPasswordData } from '@/lib/validation/auth';

export default function ResetpassPage() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const token = searchParams.get('token') || '';
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [api, contextHolder] = notification.useNotification();
  const [disable, setdisable] = useState(false);
  async function handleSubmit(data: ResetPasswordData) {
    setErrors({});
    setdisable(true);
    const parsed = resetPasswordSchema.safeParse(data);
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
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token, password: data.password }),
      });
      const result = await res.json();
      if (!res.ok) {
        setErrors({ password: result.error || 'Something went wrong' });
        return;
      }
      api.success({
        message: 'Password Reset Successful',
        description: 'Your password has been updated. Redirecting to login...',
        placement: 'topRight',
        duration: 2,
      });

      setTimeout(() => {
        window.location.href = '/auth/login';
      }, 2000);

    } catch (err) {
      setErrors({ password: 'Network error' });
    }finally {
  setdisable(false); 
}
  }
  const fields = [
    { name: 'password', type: 'password', placeholder: 'enter password', label: 'Enter new Password' },
    { name: 'confirmpassword', type: 'password', placeholder: 'confirm password', label: 'Confirm Password' },
  ];
  return (
    <>
      {contextHolder}
      <AuthForm
        heading='Reset Password'
        fields={fields}
        buttonLabel="Reset Password"
        buttonType="submit"
        disabled={disable}
        onSubmit={handleSubmit}
        errors={errors}

      />
    </>
  );
}
