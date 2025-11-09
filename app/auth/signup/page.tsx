'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { notification } from 'antd';
import { useAppDispatch,useAppSelector } from '@/lib/hook';
import { signupThunk } from '@/lib/features/cart/auth-slice';

import AuthForm, { type Field } from '../authform';
import { signupSchema, type SignupData } from '@/lib/validation/auth';

export default function SignupPage() {
    const dispatch = useAppDispatch();
  const [api, contextHolder] = notification.useNotification();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<SignupData>({
    resolver: zodResolver(signupSchema),
    mode: 'onBlur',
    reValidateMode: 'onBlur'
  });
  async function onSubmit(data: SignupData) {
    try {
      // const res = await fetch('/api/auth/signup', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(data),
      // });
      const resultAction = await dispatch(signupThunk(data));


    if (signupThunk.rejected.match(resultAction)) {
      api.error({
        message: 'Signup Failed',
        description: resultAction.payload ?? 'Something went wrong',
        placement: 'topRight',
      });
    } else if (signupThunk.fulfilled.match(resultAction)) {
      api.success({
        message: 'Signup Successful',
        description: 'Your account has been created. Redirecting to login...',
        placement: 'topRight',
        duration: 2,
      });
      setTimeout(() => {
        window.location.href = '/auth/login';
      }, 2000);
    }
    } catch (err) {
      api.error({
        message: 'Network Error',
        description: 'Please try again later',
        placement: 'topRight',
      });
    }
  }
  const fields: Field<SignupData>[] = [
    { name: 'fullname', type: 'text', placeholder: 'Enter your full name', label: 'Full name', required: true },
    { name: 'email', type: 'email', placeholder: 'Enter your email e.g (khadija@gmail.com)', label: 'Email address', required: true },
    { name: 'mobile', type: 'tel', placeholder: 'Enter your mobile number e.g 03333769005)', label: 'Mobile number', required: true },
    { name: 'password', type: 'password', placeholder: 'Enter your password', label: 'Password', required: true },
    { name: 'confirmpassword', type: 'password', placeholder: 'Enter your password again', label: 'Confirm password', required: true },
  ];
  return (
    <>
      {contextHolder}
      <AuthForm<SignupData>
        heading="SignUp"
        fields={fields}
        buttonLabel="Sign Up"
        buttonType="submit"
        disabled={isSubmitting}
        onSubmit={handleSubmit(onSubmit)}
        register={register}
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
