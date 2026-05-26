import type { NextRequest } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/api/guards";
import { jsonError, ok } from "@/lib/api/response";
import { listUsersForAdminCached } from "@/lib/services/user.service";
import { handleServiceError } from "@/lib/services/service-error";
import { adminUserQuerySchema } from "@/lib/validations/user.validation";

/**
 * GET /api/admin/users
 *
 * Admin only. Pagination, search by name/email/phone, filter by role.
 * Each row carries lightweight aggregates (orders count, total spend,
 * last order date) so the customer table can render meaningful data
 * without follow-up requests.
 */
export async function GET(request: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const params = Object.fromEntries(request.nextUrl.searchParams);
  const parsed = adminUserQuerySchema.safeParse(params);
  if (!parsed.success) {
    return jsonError(400, "Invalid query parameters.", {
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    });
  }

  try {
    const { items, meta } = await listUsersForAdminCached(parsed.data);
    return ok(items, meta);
  } catch (error) {
    return handleServiceError("admin.users.GET", error);
  }
}
