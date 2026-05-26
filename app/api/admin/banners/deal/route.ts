import type { NextRequest } from "next/server";
import { revalidateTag } from "next/cache";
import { z } from "zod";

import { requireAdmin } from "@/lib/api/guards";
import { created, jsonError } from "@/lib/api/response";
import { createDealBanner } from "@/lib/services/banner.service";
import { handleServiceError } from "@/lib/services/service-error";
import { createDealBannerSchema } from "@/lib/validations/banner.validation";

/**
 * POST /api/admin/banners/deal
 *
 * Admin only. Adds a new product-details deal card and busts both the
 * admin aggregate and the public `deal-banners` tag so storefront
 * readers see the change on the next request.
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

  const parsed = createDealBannerSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "Please review the highlighted fields and try again.", {
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    });
  }

  try {
    const banner = await createDealBanner(parsed.data);
    revalidateTag("admin-banners", "max");
    revalidateTag("deal-banners", "max");
    return created(banner);
  } catch (error) {
    return handleServiceError("admin.banners.deal.POST", error);
  }
}
