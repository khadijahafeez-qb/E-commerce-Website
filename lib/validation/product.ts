import { z } from 'zod';

export const AVAILABILITY_STATUS = ['ACTIVE', 'INACTIVE'] as const;
export const DELETE_STATUS = ['active', 'deleted'] as const;
export const SORT_OPTIONS = ['', 'title-asc', 'title-desc', 'date-asc', 'date-desc'] as const;

export const variantSchema = z.object({
  img: z.string()
    .min(1, { message: 'Image is required' }),

  colour: z.string()
    .min(1, { message: 'Colour is required' }),

  colourcode: z.string()
    .min(1, { message: 'Colour code is required' })
    .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, { message: 'Invalid colour code' }),

  size: z.string()
    .min(1, { message: 'Size is required' }),

  stock: z.number()
    .int({ message: 'Stock must be an integer' })
    .nonnegative({ message: 'Stock cannot be negative' }),

  price: z.number()
    .positive({ message: 'Price must be greater than 0' }),

  availabilityStatus: z.enum(AVAILABILITY_STATUS).default('ACTIVE'),
});
export const productSchema = z.object({
  title: z.string()
    .min(1, { message: 'Title is required' }),

  isDeleted: z.enum(DELETE_STATUS).default('active'),

  variants: z.array(variantSchema)
    .min(1, { message: 'At least one variant is required' }),
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
    sort: z.enum(SORT_OPTIONS).optional(),
  })
  .strict(); 

// Types
export type ProductInput = z.input<typeof productSchema>;
export type ProductOutput = z.output<typeof productSchema>;
export type VariantInput = z.input<typeof variantSchema>;
