'use client';

import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { useAppDispatch } from '@/lib/hook';

import { notification } from 'antd';

import AuthForm, { type Field } from '../authform';
import { resetPasswordSchema, ResetPasswordData } from '@/lib/validation/auth';
import { resetPasswordThunk } from '@/lib/features/cart/auth-slice';
import { zodResolver } from '@hookform/resolvers/zod';

export default function ResetpassPage() {
  const dispatch = useAppDispatch();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const token = searchParams.get('token') || '';
  const [api, contextHolder] = notification.useNotification();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ResetPasswordData>({
    resolver: zodResolver(resetPasswordSchema),
    mode: 'onBlur',
    reValidateMode: 'onBlur'
  });
  async function onSubmit(data: ResetPasswordData) {
 try {
      const resultAction = await dispatch(resetPasswordThunk({
        email,
        token,
        password: data.password
        
      }));

      if (resetPasswordThunk.rejected.match(resultAction)) {
        api.error({
          message: 'Error',
          description: resultAction.payload || 'Password reset failed',
          placement: 'topRight',
        });
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
      api.error({
        message: 'Network Error',
        description: 'Please try again later',
        placement: 'topRight',
      });
    }
  }
  const fields: Field<ResetPasswordData>[] = [
    { name: 'password', type: 'password', placeholder: 'Enter your password', label: 'Password', required: true },
    { name: 'confirmpassword', type: 'password', placeholder: 'Enter your password again', label: 'Confirm password', required: true },
  ];
  return (
    <>
      {contextHolder}
      <AuthForm<ResetPasswordData>
        heading='Reset Password'
        fields={fields}
        buttonLabel="Reset Password"
        buttonType="submit"
        disabled={isSubmitting}
        onSubmit={handleSubmit(onSubmit)}
        register={register}
        errors={errors}

      />
    </>
  );
}
