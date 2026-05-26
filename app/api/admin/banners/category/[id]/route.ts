import type { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { revalidateTag } from "next/cache";
import { z } from "zod";

import { requireAdmin } from "@/lib/api/guards";
import { jsonError, ok } from "@/lib/api/response";
import {
  deleteCategoryBanner,
  updateCategoryBanner,
} from "@/lib/services/banner.service";
import { handleServiceError } from "@/lib/services/service-error";
import { updateCategoryBannerSchema } from "@/lib/validations/banner.validation";

type RouteContext = { params: Promise<{ id: string }> };

function bustTags() {
  revalidateTag("admin-banners", "max");
  revalidateTag("category-banners", "max");
  revalidateTag("home-categories", "max");
}

/** PATCH /api/admin/banners/category/[id] — admin only. */
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

  const parsed = updateCategoryBannerSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "Please review the highlighted fields and try again.", {
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    });
  }

  try {
    const banner = await updateCategoryBanner(id, parsed.data);
    bustTags();
    return ok(banner);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return jsonError(404, "Category banner not found.");
    }
    return handleServiceError("admin.banners.category/[id].PATCH", error);
  }
}

/** DELETE /api/admin/banners/category/[id] — admin only, hard delete. */
export async function DELETE(_request: NextRequest, context: RouteContext) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { id } = await context.params;

  try {
    const banner = await deleteCategoryBanner(id);
    bustTags();
    return ok(banner);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return jsonError(404, "Category banner not found.");
    }
    return handleServiceError("admin.banners.category/[id].DELETE", error);
  }
}
