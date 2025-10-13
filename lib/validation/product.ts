import { z } from 'zod';

export const variantSchema = z.object({
  img: z.string().trim().min(1, 'Image is required'),
  colour: z.string().trim().min(1, 'Colour is required'),
  colourcode: z
    .string()
    .trim()
    .min(1, 'Colour code is required')
    .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid colour code'),
  size: z.string().trim().min(1, 'Size is required'),
  stock: z.coerce.number()
    .int('Stock must be an integer')
    .positive('Stock must be greater than 0')
    .refine((val) => !isNaN(val), { message: 'Stock must be a number' }),
  price: z.coerce.number()
    .positive('Price must be greater than 0')
    .refine((val) => !isNaN(val), { message: 'Price must be a number' }),
  availabilityStatus: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
});

export const productSchema = z
  .object({
    title: z.string().min(1, 'Title is required'),
    isDeleted: z.enum(['active', 'deleted']).default('active'),
    variants: z.array(variantSchema).min(1, 'At least one variant is required'),
  })
  .refine((data) => {
    const combos = data.variants.map((v) => `${v.colour}-${v.size}`);
    return new Set(combos).size === combos.length;
  }, { message: 'Variants must have unique colour + size combinations' });

// Types
export type ProductInput = z.input<typeof productSchema>;
export type ProductOutput = z.output<typeof productSchema>;
export type VariantInput = z.input<typeof variantSchema>;
