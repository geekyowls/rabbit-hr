import { z } from 'zod/v4';

export const roleSchema = z.object({
  name: z.string().min(1, 'Role name is required').trim(),
  permissions: z.array(z.string()),
});

export type RoleFormData = z.infer<typeof roleSchema>;
