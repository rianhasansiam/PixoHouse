import type { NextRequest } from "next/server";

import { requireAdmin } from "@/lib/api/guards";
import { ok } from "@/lib/api/response";
import { listAllBannersForAdminCached } from "@/lib/services/banner.service";
import { handleServiceError } from "@/lib/services/service-error";

/**
 * GET /api/admin/banners
 *
 * Admin only. Returns all three banner surfaces (carousel, category,
 * top) in one response so the admin page can hydrate every tab in a
 * single request. Reads pass through `unstable_cache` (tag:
 * `admin-banners`) so the round trip stays cheap on the hot path.
 */
export async function GET(_request: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  try {
    const data = await listAllBannersForAdminCached();
    return ok(data);
  } catch (error) {
    return handleServiceError("admin.banners.GET", error);
  }
}
