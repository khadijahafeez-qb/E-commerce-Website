'use client';

import { useState } from 'react';

import { notification } from 'antd';

import AuthForm from '../authform';
import { signupSchema, type SignupData } from '@/lib/validation/auth';

export default function SignupPage() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [api, contextHolder] = notification.useNotification();
  const [disable, setdisable] = useState(false);
  async function handleSubmit(data: SignupData) {
    setErrors({});
    setdisable(true);
    const parsed = signupSchema.safeParse(data);
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
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });
      const result = await res.json();
      if (!res.ok) {
        setErrors(result.errors || {});
        return;
      }
      setErrors({});
      api.success({
        message: 'Signup Successful',
        description: 'Your account has been created. Redirecting to login...',
        placement: 'topRight',
        duration: 2,
      });
      setTimeout(() => {
        window.location.href = '/auth/login';
      }, 2000);
    } catch (err) {
      setErrors({ general: 'Network error. Please try again.' });
    } finally {
      setdisable(false);
    }
  }
  const fields = [
    { name: 'fullname', type: 'text', placeholder: 'Fullname', label: 'Fullname' },
    { name: 'email', type: 'email', placeholder: 'email address', label: 'Email Address' },
    { name: 'mobile', type: 'tel', placeholder: 'mobile number', label: 'Mobile' },
    { name: 'password', type: 'password', placeholder: 'password', label: 'Password' },
    { name: 'confirmpassword', type: 'password', placeholder: 'Password', label: 'Confirm Password' },
  ];
  return (
    <>

      {contextHolder}
      <AuthForm
        heading="SignUp"
        fields={fields}
        buttonLabel="Sign Up"
        buttonType="submit"
        disabled={disable}
        onSubmit={handleSubmit}
        errors={errors}
        footer={
          <>
            <div className='flex flex-col items-center gap-2 mt-4'>
              <p className='text-[#5A5F7D]'>
                Already have an account!{' '}
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
