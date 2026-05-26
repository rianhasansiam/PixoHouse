import type { NextRequest } from "next/server";
import { revalidateTag } from "next/cache";
import { z } from "zod";

import { requireAdmin } from "@/lib/api/guards";
import { created, jsonError } from "@/lib/api/response";
import { createCarouselBanner } from "@/lib/services/banner.service";
import { handleServiceError } from "@/lib/services/service-error";
import { createCarouselBannerSchema } from "@/lib/validations/banner.validation";

/**
 * POST /api/admin/banners/carousel
 *
 * Admin only. Adds a new home page carousel slide and busts the
 * `admin-banners` and `carousel-banners` cache tags so both the admin
 * panel and any storefront readers see the change on next request.
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

  const parsed = createCarouselBannerSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "Please review the highlighted fields and try again.", {
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    });
  }

  try {
    const banner = await createCarouselBanner(parsed.data);
    revalidateTag("admin-banners", "max");
    revalidateTag("carousel-banners", "max");
    return created(banner);
  } catch (error) {
    return handleServiceError("admin.banners.carousel.POST", error);
  }
}
