import type { NextRequest } from "next/server";
import { revalidateTag } from "next/cache";
import { z } from "zod";

import { requireAdmin } from "@/lib/api/guards";
import { jsonError, ok } from "@/lib/api/response";
import {
  deletePromoCode,
  updatePromoCode,
} from "@/lib/services/settings.service";
import { handleServiceError } from "@/lib/services/service-error";
import { updatePromoCodeSchema } from "@/lib/validations/settings.validation";

type RouteContext = { params: Promise<{ id: string }> };

function bustTags() {
  revalidateTag("promo-codes", "max");
  revalidateTag("cart", "max");
}

/** PATCH /api/admin/settings/promo-codes/[id] — admin only. */
export async function PATCH(request: NextRequest, context: RouteContext) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { id } = await context.params;

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

  const parsed = updatePromoCodeSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "Please review the highlighted fields and try again.", {
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    });
  }

  try {
    const promo = await updatePromoCode(id, parsed.data);
    bustTags();
    return ok(promo);
  } catch (error) {
    return handleServiceError(
      "admin.settings.promo-codes/[id].PATCH",
      error,
    );
  }
}

/** DELETE /api/admin/settings/promo-codes/[id] — admin only, hard delete. */
export async function DELETE(_request: NextRequest, context: RouteContext) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { id } = await context.params;

  try {
    const promo = await deletePromoCode(id);
    bustTags();
    return ok(promo);
  } catch (error) {
    return handleServiceError(
      "admin.settings.promo-codes/[id].DELETE",
      error,
    );
  }
}
