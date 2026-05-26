import type { NextRequest } from "next/server";
import { revalidateTag } from "next/cache";
import { z } from "zod";

import { requireAdmin } from "@/lib/api/guards";
import { created, jsonError } from "@/lib/api/response";
import { createTopBanner } from "@/lib/services/banner.service";
import { handleServiceError } from "@/lib/services/service-error";
import { createTopBannerSchema } from "@/lib/validations/banner.validation";

/**
 * POST /api/admin/banners/top
 *
 * Admin only. Adds a new top promotional strip slide. Busts
 * `admin-banners` and `top-banners` so any storefront reader sees the
 * new slide on the next request.
 */
export async function POST(request: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return jsonError(415, "Content-Type must be application/json.");
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, "Invalid JSON payload.");
  }

  const parsed = createTopBannerSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "Please review the highlighted fields and try again.", {
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    });
  }

  try {
    const banner = await createTopBanner(parsed.data);
    revalidateTag("admin-banners", "max");
    revalidateTag("top-banners", "max");
    return created(banner);
  } catch (error) {
    return handleServiceError("admin.banners.top.POST", error);
  }
}
