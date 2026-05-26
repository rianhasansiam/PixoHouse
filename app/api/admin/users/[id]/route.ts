import type { NextRequest } from "next/server";

import { requireAdmin } from "@/lib/api/guards";
import { jsonError, ok } from "@/lib/api/response";
import { getUserForAdmin } from "@/lib/services/user.service";
import { handleServiceError } from "@/lib/services/service-error";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/admin/users/[id]
 *
 * Admin only. Returns the full user profile (without secrets).
 */
export async function GET(_request: NextRequest, context: RouteContext) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { id } = await context.params;

  try {
    const user = await getUserForAdmin(id);
    if (!user) return jsonError(404, "User not found.");
    return ok(user);
  } catch (error) {
    return handleServiceError("admin.users/[id].GET", error);
  }
}
