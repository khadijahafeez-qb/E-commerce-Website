'use client';
import { useAppDispatch } from '@/lib/hook';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { notification } from 'antd';

import AuthForm, { type Field } from '../authform';
import { ForgotPasswordData, forgotPasswordSchema } from '@/lib/validation/auth';
import { forgotPasswordThunk } from '@/lib/features/cart/auth-slice';

export default function ForgotpassPage() {
  const dispatch = useAppDispatch();
  const [api, contextHolder] = notification.useNotification();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ForgotPasswordData>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: 'onBlur',
    reValidateMode: 'onBlur'
  });
  async function onSubmit(data: ForgotPasswordData) {
    const resultAction = await dispatch(forgotPasswordThunk(data));
    if (forgotPasswordThunk.rejected.match(resultAction)) {
      api.error({
        message: 'Forgot Password Failed',
        description: resultAction.payload || 'Something went wrong',
        placement: 'topRight',
      });
      return;
    }
    api.success({
      message: 'Email Sent',
      description: resultAction.payload || 'Reset password link sent to your email.',
      placement: 'topRight',
      duration: 3,
    });
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
