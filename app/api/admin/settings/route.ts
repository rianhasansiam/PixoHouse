import type { NextRequest } from "next/server";
import { revalidateTag } from "next/cache";
import { z } from "zod";

import { requireAdmin } from "@/lib/api/guards";
import { jsonError, ok } from "@/lib/api/response";
import {
  getStoreSettingsCached,
  updateStoreSettings,
} from "@/lib/services/settings.service";
import { handleServiceError } from "@/lib/services/service-error";
import { updateStoreSettingsSchema } from "@/lib/validations/settings.validation";

/**
 * GET /api/admin/settings
 *
 * Admin only. Returns the singleton store settings row, auto-creating
 * it on first read so the form always has something to bind against.
 */
export async function GET(_request: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  try {
    const settings = await getStoreSettingsCached();
    return ok(settings);
  } catch (error) {
    return handleServiceError("admin.settings.GET", error);
  }
}

/**
 * PATCH /api/admin/settings
 *
 * Admin only. Updates tax rate, delivery charges, and the free-
 * shipping threshold. Busts both the admin tag and the customer-
 * facing `cart` tag so the cart pricing can pick up the change on
 * the next request.
 */
export async function PATCH(request: NextRequest) {
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

  const parsed = updateStoreSettingsSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "Please review the highlighted fields and try again.", {
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    });
  }

  try {
    const settings = await updateStoreSettings(parsed.data);
    revalidateTag("store-settings", "max");
    revalidateTag("cart", "max");
    return ok(settings);
  } catch (error) {
    return handleServiceError("admin.settings.PATCH", error);
  }
}
