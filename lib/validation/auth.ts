import { z } from 'zod';


export const signupSchema = z.object({
  fullname: z.string().min(8, 'Full name must be at least 8 characters'),
  email: z.string().email('Invalid email address')
         .regex(/^[\w.%+-]+@[A-Za-z0-9.-]+\.(pk|co|com|org)$/, 'Only .pk, .co, .com, .org emails are allowed'),
  mobile: z
    .string()
    .regex(/^03[0-9]{9}$/, 'Enter a valid number like (03001234567)'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least 1 uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least 1 lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least 1 number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least 1 special character'),
  confirmpassword: z.string(),
}).refine((data) => data.password === data.confirmpassword, {
  message: 'Passwords do not match',
  path: ['confirmpassword'],
});


export const loginSchema = z.object({
  email: z.string().email('Invalid email')
  .regex(/^[\w.%+-]+@[A-Za-z0-9.-]+\.(pk|co|com|org)$/, 'Only .pk, .co, .com, .org emails are allowed'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});



export const forgotPasswordSchema = z.object({
  email: z
    .string().email('Invalid email').regex(
      /^[\w.%+-]+@[A-Za-z0-9.-]+\.(pk|co|com|org)$/,
      'Only .pk, .co, .com, .org emails are allowed'
    ),
});

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least 1 uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least 1 lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least 1 number')
      .regex(/[^A-Za-z0-9]/, 'Password must contain at least 1 special character'),
    confirmpassword: z.string(),
  })
  .refine((data) => data.password === data.confirmpassword, {
    message: 'Passwords do not match',
    path: ['confirmpassword'],
  });


// ✅ Types auto-generated from schemas
export type SignupData = z.infer<typeof signupSchema>;
export type LoginData = z.infer<typeof loginSchema>;
export type ForgotPasswordData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordData = z.infer<typeof resetPasswordSchema>;

