import { z } from 'zod';


export const signupSchema = z.object({
  fullname: z.string().nonempty('Full name is required').min(8, 'Full name must be at least 8 characters'),
  email: z.string()
    .nonempty('Email is required')
    .email('Invalid email address')
    .regex(/^[\w.%+-]+@[A-Za-z0-9.-]+\.(pk|co|com|org)$/, 'Only .pk, .co, .com, .org emails are allowed'),
  mobile: z
    .string()
    .nonempty('Mobile number is required')
    .regex(/^03[0-9]{9}$/, 'Enter a valid number'),
  password: z
    .string()
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
    .string()
    .nonempty('Email is required')
    .email('Invalid email').regex(
      /^[\w.%+-]+@[A-Za-z0-9.-]+\.(pk|co|com|org)$/,
      'Only .pk, .co, .com, .org emails are allowed'
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


  export const resetPasswordApiSchema = resetPasswordSchema
  .safeExtend({
    email: z.string()
    .nonempty('Email is required')
    .email('Invalid email address')
    .regex(/^[\w.%+-]+@[A-Za-z0-9.-]+\.(pk|co|com|org)$/, 'Only .pk, .co, .com, .org emails are allowed'),
    token: z.string().min(32, 'Invalid token'), // adjust length as needed
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

