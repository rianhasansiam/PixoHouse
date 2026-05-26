import type { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { revalidateTag } from "next/cache";
import { z } from "zod";

import { requireAdmin } from "@/lib/api/guards";
import { jsonError, ok } from "@/lib/api/response";
import {
  deleteCarouselBanner,
  updateCarouselBanner,
} from "@/lib/services/banner.service";
import { handleServiceError } from "@/lib/services/service-error";
import { updateCarouselBannerSchema } from "@/lib/validations/banner.validation";

type RouteContext = { params: Promise<{ id: string }> };

/** PATCH /api/admin/banners/carousel/[id] — admin only. */
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

  const parsed = updateCarouselBannerSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "Please review the highlighted fields and try again.", {
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    });
  }

  try {
    const banner = await updateCarouselBanner(id, parsed.data);
    revalidateTag("admin-banners", "max");
    revalidateTag("carousel-banners", "max");
    return ok(banner);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return jsonError(404, "Carousel banner not found.");
    }
    return handleServiceError("admin.banners.carousel/[id].PATCH", error);
  }
}

/** DELETE /api/admin/banners/carousel/[id] — admin only, hard delete. */
export async function DELETE(_request: NextRequest, context: RouteContext) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { id } = await context.params;

  try {
    const banner = await deleteCarouselBanner(id);
    revalidateTag("admin-banners", "max");
    revalidateTag("carousel-banners", "max");
    return ok(banner);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return jsonError(404, "Carousel banner not found.");
    }
    return handleServiceError("admin.banners.carousel/[id].DELETE", error);
  }
}
