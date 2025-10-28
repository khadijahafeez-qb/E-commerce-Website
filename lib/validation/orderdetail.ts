import { z } from 'zod';
export const orderdetailParamsSchema = z.object({
  id: z.string().uuid('Invalid order ID format'),
});
export type OrderParams = z.infer<typeof orderdetailParamsSchema>;
