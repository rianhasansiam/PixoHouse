import type { NextRequest } from "next/server";
import { revalidateTag } from "next/cache";
import { z } from "zod";

import { requireAdmin } from "@/lib/api/guards";
import { created, jsonError, ok } from "@/lib/api/response";
import {
  createPromoCode,
  listPromoCodesCached,
} from "@/lib/services/settings.service";
import { handleServiceError } from "@/lib/services/service-error";
import { createPromoCodeSchema } from "@/lib/validations/settings.validation";

/**
 * GET /api/admin/settings/promo-codes
 *
 * Admin only. Returns every promo code with usage stats and lifecycle
 * dates. Reads pass through `unstable_cache` (tag `promo-codes`).
 */
export async function GET(_request: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  try {
    const items = await listPromoCodesCached();
    return ok(items);
  } catch (error) {
    return handleServiceError("admin.settings.promo-codes.GET", error);
  }
}

/**
 * POST /api/admin/settings/promo-codes
 *
 * Admin only. Creates a new promo code (case-insensitive). Busts the
 * `promo-codes` tag plus the storefront `cart` tag so any open cart
 * can apply the new code on the next pricing pass.
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

  const parsed = createPromoCodeSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "Please review the highlighted fields and try again.", {
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    });
  }

  try {
    const promo = await createPromoCode(parsed.data);
    revalidateTag("promo-codes", "max");
    revalidateTag("cart", "max");
    return created(promo);
  } catch (error) {
    return handleServiceError("admin.settings.promo-codes.POST", error);
  }
}
