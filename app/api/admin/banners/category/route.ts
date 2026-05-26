import type { NextRequest } from "next/server";
import { revalidateTag } from "next/cache";
import { z } from "zod";

import { requireAdmin } from "@/lib/api/guards";
import { created, jsonError } from "@/lib/api/response";
import { createCategoryBanner } from "@/lib/services/banner.service";
import { handleServiceError } from "@/lib/services/service-error";
import { createCategoryBannerSchema } from "@/lib/validations/banner.validation";

/**
 * POST /api/admin/banners/category
 *
 * Admin only. Attaches a new banner to an existing category. Busts
 * `admin-banners`, `category-banners`, and `home-categories` so the
 * home page strip refreshes too.
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

  const parsed = createCategoryBannerSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "Please review the highlighted fields and try again.", {
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    });
  }

  try {
    const banner = await createCategoryBanner(parsed.data);
    revalidateTag("admin-banners", "max");
    revalidateTag("category-banners", "max");
    revalidateTag("home-categories", "max");
    return created(banner);
  } catch (error) {
    return handleServiceError("admin.banners.category.POST", error);
  }
}
