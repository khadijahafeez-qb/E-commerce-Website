// /lib/validations/order.schema.ts
import { z } from 'zod';

export const orderdetailParamsSchema = z.object({
  id: z.string().uuid('Invalid order ID format'),
});

// ✅ You can export the type if you want TypeScript autocomplete
export type OrderParams = z.infer<typeof orderdetailParamsSchema>;
