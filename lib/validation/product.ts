import { z } from 'zod';

export const variantSchema = z.object({
  img: z
    .union([z.string(), z.undefined()])
    .transform((val) => val ?? '')
    .refine((val) => val.trim().length > 0, { message: 'Image is required' }),

  colour: z
    .union([z.string(), z.undefined()])
    .transform((val) => val ?? '')
    .refine((val) => val.trim().length > 0, { message: 'Colour is required' }),

  colourcode: z
    .union([z.string(), z.undefined()])
    .transform((val) => val ?? '')
    .refine((val) => val.trim().length > 0, { message: 'Colour code is required' })
    .refine(
      (val) => /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(val),
      { message: 'Invalid colour code' }
    ),

  size: z
    .union([z.string(), z.undefined()])
    .transform((val) => val ?? '')
    .refine((val) => val.trim().length > 0, { message: 'Size is required' }),

  stock: z.number()
    .refine(val => val !== undefined, { message: 'Stock is required' })
    .refine((val) => Number.isInteger(val), { message: 'Stock must be an integer' })
    .refine((val) => val >= 0, { message: 'Stock cannot be negative' }),

  price: z.number()
    .refine(val => val !== undefined, { message: 'Price is required' })
    .refine(val => val > 0, { message: 'Price must be greater than 0' }),


  availabilityStatus: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
});

export const productSchema = z.object({
  title: z
    .union([z.string(), z.undefined()])
    .transform((val) => val ?? '')
    .refine((val) => val.trim().length > 0, { message: 'Title is required' }),

  isDeleted: z.enum(['active', 'deleted']).default('active'),

  variants: z
    .array(variantSchema)
    .min(1, 'At least one variant is required'),
});


export const productIdSchema = z.object({
  id: z.string().uuid({ message: 'Invalid product ID' }),
});

export const productQuerySchema = z
  .object({
    page: z
      .string()
      .optional()
      .refine((val) => !val || /^\d+$/.test(val), {
        message: 'Page must be a valid number',
      })
      .transform((val) => (val ? parseInt(val, 10) : 1))
      .refine((val) => val > 0, { message: 'Page must be greater than 0' }),

    limit: z
      .string()
      .optional()
      .refine((val) => !val || /^\d+$/.test(val), {
        message: 'Limit must be a valid number',
      })
      .transform((val) => (val ? parseInt(val, 10) : 8))
      .refine((val) => val > 0, { message: 'Limit must be greater than 0' }),

    search: z.string().optional(),
    sort: z.enum(['', 'title-asc', 'title-desc', 'date-asc', 'date-desc']).optional(),
  })
  .strict(); // 🚫 no unknown query keys

// Types
export type ProductInput = z.input<typeof productSchema>;
export type ProductOutput = z.output<typeof productSchema>;
export type VariantInput = z.input<typeof variantSchema>;
