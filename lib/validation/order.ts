import { z } from 'zod';

// GET /api/order
export const getOrdersSchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .refine((n) => n > 0, 'Page must be greater than 0'),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 10))
    .refine((n) => n > 0 && n <= 100, 'Limit must be between 1 and 100'),
  search: z.string().optional().default(''),
});

// PATCH /api/order/[id]/status
export const updateOrderStatusSchema = {
  param: z.object({
    id: z.string().uuid('Invalid order ID format'),
  }),
  body: z.object({
    status: z
      .enum(['FULFILLED', 'CANCELLED', 'PAID'])
      .refine(
        (val) => ['FULFILLED', 'CANCELLED', 'PAID'].includes(val),
        { message: 'Status must be FULFILLED, CANCELLED, or PAID' }
      ),
  }),
};
