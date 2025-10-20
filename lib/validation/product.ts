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

// stock: z
//   .union([z.number(), z.undefined()])
//   .refine((val) => val !== undefined, { message: 'Stock is required' })
//   .refine((val) => val! > 0, { message: 'Stock must be greater than 0' }),

// price: z
//   .union([z.number(), z.undefined()])
//   .refine((val) => val !== undefined, { message: 'Price is required' })
//   .refine((val) => val! > 0, { message: 'Price must be greater than 0' }),
stock: z.number()
  .refine(val => val !== undefined, { message: 'Stock is required' })
  .refine(val => Number.isInteger(val), { message: 'Stock must be an integer' })
  .refine(val => val > 0, { message: 'Stock must be greater than 0' }),

price: z.number()
  .refine(val => val !== undefined, { message: 'Price is required' })
  .refine(val => val > 0, { message: 'Price must be greater than 0' }),


  availabilityStatus: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
});

export const productSchema = z
  .object({
    title: z
      .union([z.string(), z.undefined()])
      .transform((val) => val ?? '')
      .refine((val) => val.trim().length > 0, { message: 'Title is required' }),

    isDeleted: z.enum(['active', 'deleted']).default('active'),

    variants: z
      .array(variantSchema)
      .min(1, 'At least one variant is required'),
  })
  .refine((data) => {
    const combos = data.variants.map((v) => `${v.colour}-${v.size}`);
    return new Set(combos).size === combos.length;
  }, { message: 'Variants must have unique colour + size combinations' });


// Types
export type ProductInput = z.input<typeof productSchema>;
export type ProductOutput = z.output<typeof productSchema>;
export type VariantInput = z.input<typeof variantSchema>;
