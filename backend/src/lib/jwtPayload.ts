import { z } from 'zod';

export const jwtPayloadSchema = z.object({
  id: z.string(),
  tenantId: z.string().nullable().optional(),
  name: z.string(),
  email: z.string().email(),
  roles: z.array(z.string()),
  permissions: z.array(z.string()),
  outletIds: z.array(z.string()).optional()
});

export type UserPayload = z.infer<typeof jwtPayloadSchema>;

/**
 * Validates JWT payload shape at runtime. Throws ZodError if payload is malformed.
 */
export function validateJwtPayload(payload: unknown): UserPayload {
  return jwtPayloadSchema.parse(payload);
}
