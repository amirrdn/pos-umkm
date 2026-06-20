import { z } from 'zod';
import { SubscriptionTier } from '@prisma/client';

export const upgradeSubscriptionSchema = z.object({
  tier: z.nativeEnum(SubscriptionTier),
});

export const midtransWebhookSchema = z.object({
  transaction_status: z.string(),
  order_id: z.string(),
  gross_amount: z.string(),
  payment_type: z.string().optional(),
  signature_key: z.string(),
});
