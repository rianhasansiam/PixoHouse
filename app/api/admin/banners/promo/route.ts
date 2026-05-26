import type { NextRequest } from "next/server";
import { revalidateTag } from "next/cache";
import { z } from "zod";

import { requireAdmin } from "@/lib/api/guards";
import { created, jsonError } from "@/lib/api/response";
import { createPromoBanner } from "@/lib/services/banner.service";
import { handleServiceError } from "@/lib/services/service-error";
import { createPromoBannerSchema } from "@/lib/validations/banner.validation";

/**
 * POST /api/admin/banners/promo
 *
 * Admin only. Adds a new product-details side-rail promo banner.
 * Busts the admin aggregate plus the public `promo-banners` tag.
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

  const parsed = createPromoBannerSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "Please review the highlighted fields and try again.", {
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    });
  }

  try {
    const banner = await createPromoBanner(parsed.data);
    revalidateTag("admin-banners", "max");
    revalidateTag("promo-banners", "max");
    return created(banner);
  } catch (error) {
    return handleServiceError("admin.banners.promo.POST", error);
  }
}
