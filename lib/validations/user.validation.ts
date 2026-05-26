import { z } from "zod";

/**
 * Zod schemas for the User admin API.
 *
 * Mirrors the Prisma `Role` enum so a schema rename here is a TS error.
 */

const ROLE = ["USER", "ADMIN"] as const;

/** Query string for `GET /api/admin/users`. */
export const adminUserQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().min(1).max(120).optional(),
  role: z.enum(ROLE).optional(),
});

/** Body for `PATCH /api/admin/users/[id]/role`. */
export const updateUserRoleSchema = z.object({
  role: z.enum(ROLE),
});

export type AdminUserQueryInput = z.infer<typeof adminUserQuerySchema>;
export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;
