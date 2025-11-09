import { z } from 'zod';

export const signupSchema = z.object({
  fullname: z
    .string()
    .min(1, { message: 'Full name is required' })
    .min(8, { message: 'Full name must be at least 8 characters long' }),
  email: z
    .string()
    .min(1, { message: 'Email is required' })
    .email({ message: 'Invalid email address' })
    .regex(/^[\w.%+-]+@[A-Za-z0-9.-]+\.(pk|co|com|org)$/, {
      message: 'Only .pk, .co, .com, .org emails are allowed',
    }),
  mobile: z
    .string()
    .min(1, { message: 'Mobile number is required' })
    .regex(/^03[0-9]{9}$/, { message: 'Enter a valid number' }),

  password: z
    .string()
    .min(1, { message: 'Password is required' })
    .min(8, { message: 'Password must be at least 8 characters' })
    .refine(
      (val) =>
        /[A-Z]/.test(val) &&
        /[a-z]/.test(val) &&
        /[0-9]/.test(val) &&
        /[^A-Za-z0-9]/.test(val),
      {
        message:
          'Password must include uppercase, lowercase, number, and special character',
      }
    ),
  confirmpassword: z
    .string()
    .min(1, { message: 'Confirm password is required' }),
})
  .refine((data) => data.password === data.confirmpassword, {
    message: 'Passwords do not match',
    path: ['confirmpassword'],
  });
export const loginSchema = z.object({
  email: z
    .string()
    .nonempty('Email is required')
    .email('Invalid email')
    .regex(
      /^[\w.%+-]+@[A-Za-z0-9.-]+\.(pk|co|com|org)$/,
      'Only .pk, .co, .com, .org emails are allowed'
    ),
  password: z.string().nonempty('Password is required'),
});

export const forgotPasswordSchema = z.object({

  email: z
    .union([z.string(), z.undefined()])
    .transform((val) => val ?? '')
    .refine((val) => val.trim().length > 0, { message: 'Email is required' })
    .refine((val) => val.includes('@'), {
      message: 'Email must contain @ symbol',
    })
    .refine((val) => /\S+@\S+\.\S+/.test(val), {
      message: 'Invalid email address format',
    })
    .refine(
      (val) => /^[\w.%+-]+@[A-Za-z0-9.-]+\.(pk|co|com|org)$/.test(val),
      { message: 'Only .pk, .co, .com, .org emails are allowed' }
    ),
});

export const resetPasswordSchema = z.object({
  password: z.string()
    .nonempty('Password is required')
    .refine((val) => {
      const minLength = val.length >= 8;
      const upper = /[A-Z]/.test(val);
      const lower = /[a-z]/.test(val);
      const number = /[0-9]/.test(val);
      const special = /[^A-Za-z0-9]/.test(val);
      return minLength && upper && lower && number && special;
    }, {
      message:
        'Password must be at least 8 chars and include uppercase, lowercase, number, and special character',
    }),
  confirmpassword: z.string().nonempty('Confirm password is required'),
}).refine((data) => data.password === data.confirmpassword, {
  message: 'Passwords do not match',
  path: ['confirmpassword'],
});

export const resetPasswordApiSchema = z
  .object({
    email: z
      .union([z.string(), z.undefined()])
      .transform((val) => val ?? '')
      .refine((val) => val.trim().length > 0, { message: 'Email is required' })
      .refine((val) => val.includes('@'), { message: 'Email must contain @ symbol' })
      .refine((val) => /\S+@\S+\.\S+/.test(val), {
        message: 'Invalid email address format',
      })
      .refine(
        (val) => /^[\w.%+-]+@[A-Za-z0-9.-]+\.(pk|co|com|org)$/.test(val),
        { message: 'Only .pk, .co, .com, .org emails are allowed' }
      ),
    token: z
      .union([z.string(), z.undefined()])
      .transform((val) => val ?? '')
      .refine((val) => val.trim().length > 0, { message: 'Token is required' })
      .transform((val) => val ?? '')
      .refine((val) => val.trim().length >= 32, { message: 'Invalid token' }),

    password: z
      .union([z.string(), z.undefined()])
      .transform((val) => val ?? '')
      .refine((val) => val.trim().length > 0, { message: 'Password is required' })
      .refine((val) => {
        const minLength = val.length >= 8;
        const upper = /[A-Z]/.test(val);
        const lower = /[a-z]/.test(val);
        const number = /[0-9]/.test(val);
        const special = /[^A-Za-z0-9]/.test(val);
        return minLength && upper && lower && number && special;
      }, {
        message:
          'Password must be at least 8 chars and include uppercase, lowercase, number, and special character',
      }),

  });

export type SignupData = z.infer<typeof signupSchema>;
export type LoginData = z.infer<typeof loginSchema>;
export type ForgotPasswordData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordData = z.infer<typeof resetPasswordSchema>;

