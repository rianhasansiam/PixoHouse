import "server-only";

import { Prisma } from "@prisma/client";
import { unstable_cache } from "next/cache";

import { prisma } from "@/lib/prisma";
import { ServiceError } from "@/lib/services/service-error";
import type {
  CreateCarouselBannerInput,
  CreateCategoryBannerInput,
  CreateDealBannerInput,
  CreatePromoBannerInput,
  CreateTopBannerInput,
  UpdateCarouselBannerInput,
  UpdateCategoryBannerInput,
  UpdateDealBannerInput,
  UpdatePromoBannerInput,
  UpdateTopBannerInput,
} from "@/lib/validations/banner.validation";

/**
 * The single home for Banner DB logic.
 *
 * Three independent surfaces (carousel, category, top) live in their
 * own Prisma models. We expose CRUD helpers per surface plus one
 * `listAllBannersForAdmin` aggregate so the admin page can hydrate
 * every tab in a single round trip.
 */

export class BannerError extends ServiceError {
  constructor(
    status: number,
    message: string,
    details?: Record<string, unknown>,
  ) {
    super(status, message, details);
    this.name = "BannerError";
  }
}

/* -------------------------------------------------------------------------- */
/*  Selects                                                                   */
/* -------------------------------------------------------------------------- */

const carouselSelect = {
  id: true,
  image: true,
  title: true,
  subtitle: true,
  description: true,
  badge: true,
  bgFrom: true,
  bgVia: true,
  bgTo: true,
  link: true,
  position: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.CarouselBannerSelect;

const categoryBannerSelect = {
  id: true,
  image: true,
  label: true,
  heading: true,
  discount: true,
  description: true,
  link: true,
  categoryId: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  category: { select: { id: true, name: true, slug: true } },
} satisfies Prisma.CategoryBannerSelect;

const topBannerSelect = {
  id: true,
  icon: true,
  badge: true,
  discount: true,
  description: true,
  tag: true,
  tagIcon: true,
  position: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.TopBannerSelect;

const dealBannerSelect = {
  id: true,
  image: true,
  title: true,
  subtitle: true,
  bgClass: true,
  link: true,
  position: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.DealBannerSelect;

const promoBannerSelect = {
  id: true,
  image: true,
  title: true,
  subtitle: true,
  discount: true,
  bgClass: true,
  link: true,
  position: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.PromoBannerSelect;

export type CarouselBannerRow = Prisma.CarouselBannerGetPayload<{
  select: typeof carouselSelect;
}>;
export type CategoryBannerRow = Prisma.CategoryBannerGetPayload<{
  select: typeof categoryBannerSelect;
}>;
export type TopBannerRow = Prisma.TopBannerGetPayload<{
  select: typeof topBannerSelect;
}>;
export type DealBannerRow = Prisma.DealBannerGetPayload<{
  select: typeof dealBannerSelect;
}>;
export type PromoBannerRow = Prisma.PromoBannerGetPayload<{
  select: typeof promoBannerSelect;
}>;

/* -------------------------------------------------------------------------- */
/*  Aggregate read for admin                                                  */
/* -------------------------------------------------------------------------- */

export async function listAllBannersForAdmin() {
  const [carousel, category, top, deal, promo] = await Promise.all([
    prisma.carouselBanner.findMany({
      orderBy: [{ position: "asc" }, { createdAt: "desc" }],
      select: carouselSelect,
    }),
    prisma.categoryBanner.findMany({
      orderBy: { createdAt: "desc" },
      select: categoryBannerSelect,
    }),
    prisma.topBanner.findMany({
      orderBy: [{ position: "asc" }, { createdAt: "desc" }],
      select: topBannerSelect,
    }),
    prisma.dealBanner.findMany({
      orderBy: [{ position: "asc" }, { createdAt: "desc" }],
      select: dealBannerSelect,
    }),
    prisma.promoBanner.findMany({
      orderBy: [{ position: "asc" }, { createdAt: "desc" }],
      select: promoBannerSelect,
    }),
  ]);

  return { carousel, category, top, deal, promo };
}

/**
 * Cache layer over the admin aggregate. Tagged `admin-banners` so any
 * mutation across all three surfaces busts a single tag. Public-facing
 * banner reads (used by the storefront when wired) carry their own
 * tags — `carousel-banners`, `category-banners`, `top-banners` — so
 * they can be revalidated independently.
 */
const getCachedAdminBanners = unstable_cache(
  async () => listAllBannersForAdmin(),
  ["admin-banners-aggregate"],
  { revalidate: 300, tags: ["admin-banners"] },
);

export function listAllBannersForAdminCached() {
  return getCachedAdminBanners();
}

/* -------------------------------------------------------------------------- */
/*  Carousel CRUD                                                             */
/* -------------------------------------------------------------------------- */

export function createCarouselBanner(input: CreateCarouselBannerInput) {
  return prisma.carouselBanner.create({
    data: {
      image: input.image,
      title: input.title,
      subtitle: input.subtitle,
      description: input.description,
      badge: input.badge,
      bgFrom: input.bgFrom,
      bgVia: input.bgVia ?? null,
      bgTo: input.bgTo,
      link: input.link ?? null,
      position: input.position,
      status: input.status,
    },
    select: carouselSelect,
  });
}

export async function updateCarouselBanner(
  id: string,
  input: UpdateCarouselBannerInput,
) {
  const data: Prisma.CarouselBannerUpdateInput = {};
  if (input.image !== undefined) data.image = input.image;
  if (input.title !== undefined) data.title = input.title;
  if (input.subtitle !== undefined) data.subtitle = input.subtitle;
  if (input.description !== undefined) data.description = input.description;
  if (input.badge !== undefined) data.badge = input.badge;
  if (input.bgFrom !== undefined) data.bgFrom = input.bgFrom;
  if (input.bgVia !== undefined) data.bgVia = input.bgVia;
  if (input.bgTo !== undefined) data.bgTo = input.bgTo;
  if (input.link !== undefined) data.link = input.link;
  if (input.position !== undefined) data.position = input.position;
  if (input.status !== undefined) data.status = input.status;

  return prisma.carouselBanner.update({
    where: { id },
    data,
    select: carouselSelect,
  });
}

export function deleteCarouselBanner(id: string) {
  return prisma.carouselBanner.delete({
    where: { id },
    select: carouselSelect,
  });
}

/* -------------------------------------------------------------------------- */
/*  Category banner CRUD                                                      */
/* -------------------------------------------------------------------------- */

export async function createCategoryBanner(input: CreateCategoryBannerInput) {
  // Defensive existence check so we can return a clean 404 instead of
  // letting Prisma raise a generic FK violation.
  const category = await prisma.category.findUnique({
    where: { id: input.categoryId },
    select: { id: true },
  });
  if (!category) {
    throw new BannerError(404, "Category not found.");
  }

  return prisma.categoryBanner.create({
    data: {
      image: input.image,
      label: input.label,
      heading: input.heading,
      discount: input.discount,
      description: input.description,
      link: input.link ?? null,
      categoryId: input.categoryId,
      status: input.status,
    },
    select: categoryBannerSelect,
  });
}

export async function updateCategoryBanner(
  id: string,
  input: UpdateCategoryBannerInput,
) {
  if (input.categoryId !== undefined) {
    const category = await prisma.category.findUnique({
      where: { id: input.categoryId },
      select: { id: true },
    });
    if (!category) {
      throw new BannerError(404, "Category not found.");
    }
  }

  const data: Prisma.CategoryBannerUpdateInput = {};
  if (input.image !== undefined) data.image = input.image;
  if (input.label !== undefined) data.label = input.label;
  if (input.heading !== undefined) data.heading = input.heading;
  if (input.discount !== undefined) data.discount = input.discount;
  if (input.description !== undefined) data.description = input.description;
  if (input.link !== undefined) data.link = input.link;
  if (input.status !== undefined) data.status = input.status;
  if (input.categoryId !== undefined) {
    data.category = { connect: { id: input.categoryId } };
  }

  return prisma.categoryBanner.update({
    where: { id },
    data,
    select: categoryBannerSelect,
  });
}

export function deleteCategoryBanner(id: string) {
  return prisma.categoryBanner.delete({
    where: { id },
    select: categoryBannerSelect,
  });
}

/* -------------------------------------------------------------------------- */
/*  Top banner CRUD                                                           */
/* -------------------------------------------------------------------------- */

export function createTopBanner(input: CreateTopBannerInput) {
  return prisma.topBanner.create({
    data: {
      icon: input.icon,
      badge: input.badge,
      discount: input.discount,
      description: input.description,
      tag: input.tag,
      tagIcon: input.tagIcon,
      position: input.position,
      status: input.status,
    },
    select: topBannerSelect,
  });
}

export async function updateTopBanner(
  id: string,
  input: UpdateTopBannerInput,
) {
  const data: Prisma.TopBannerUpdateInput = {};
  if (input.icon !== undefined) data.icon = input.icon;
  if (input.badge !== undefined) data.badge = input.badge;
  if (input.discount !== undefined) data.discount = input.discount;
  if (input.description !== undefined) data.description = input.description;
  if (input.tag !== undefined) data.tag = input.tag;
  if (input.tagIcon !== undefined) data.tagIcon = input.tagIcon;
  if (input.position !== undefined) data.position = input.position;
  if (input.status !== undefined) data.status = input.status;

  return prisma.topBanner.update({
    where: { id },
    data,
    select: topBannerSelect,
  });
}

export function deleteTopBanner(id: string) {
  return prisma.topBanner.delete({
    where: { id },
    select: topBannerSelect,
  });
}

/* -------------------------------------------------------------------------- */
/*  Deal banner CRUD (product-details carousel)                               */
/* -------------------------------------------------------------------------- */

export function createDealBanner(input: CreateDealBannerInput) {
  return prisma.dealBanner.create({
    data: {
      image: input.image,
      title: input.title,
      subtitle: input.subtitle,
      bgClass: input.bgClass,
      link: input.link ?? null,
      position: input.position,
      status: input.status,
    },
    select: dealBannerSelect,
  });
}

export async function updateDealBanner(
  id: string,
  input: UpdateDealBannerInput,
) {
  const data: Prisma.DealBannerUpdateInput = {};
  if (input.image !== undefined) data.image = input.image;
  if (input.title !== undefined) data.title = input.title;
  if (input.subtitle !== undefined) data.subtitle = input.subtitle;
  if (input.bgClass !== undefined) data.bgClass = input.bgClass;
  if (input.link !== undefined) data.link = input.link;
  if (input.position !== undefined) data.position = input.position;
  if (input.status !== undefined) data.status = input.status;

  return prisma.dealBanner.update({
    where: { id },
    data,
    select: dealBannerSelect,
  });
}

export function deleteDealBanner(id: string) {
  return prisma.dealBanner.delete({
    where: { id },
    select: dealBannerSelect,
  });
}

/* -------------------------------------------------------------------------- */
/*  Promo banner CRUD (product-details side rail)                             */
/* -------------------------------------------------------------------------- */

export function createPromoBanner(input: CreatePromoBannerInput) {
  return prisma.promoBanner.create({
    data: {
      image: input.image,
      title: input.title,
      subtitle: input.subtitle,
      discount: input.discount,
      bgClass: input.bgClass,
      link: input.link ?? null,
      position: input.position,
      status: input.status,
    },
    select: promoBannerSelect,
  });
}

export async function updatePromoBanner(
  id: string,
  input: UpdatePromoBannerInput,
) {
  const data: Prisma.PromoBannerUpdateInput = {};
  if (input.image !== undefined) data.image = input.image;
  if (input.title !== undefined) data.title = input.title;
  if (input.subtitle !== undefined) data.subtitle = input.subtitle;
  if (input.discount !== undefined) data.discount = input.discount;
  if (input.bgClass !== undefined) data.bgClass = input.bgClass;
  if (input.link !== undefined) data.link = input.link;
  if (input.position !== undefined) data.position = input.position;
  if (input.status !== undefined) data.status = input.status;

  return prisma.promoBanner.update({
    where: { id },
    data,
    select: promoBannerSelect,
  });
}

export function deletePromoBanner(id: string) {
  return prisma.promoBanner.delete({
    where: { id },
    select: promoBannerSelect,
  });
}

/* -------------------------------------------------------------------------- */
/*  Public reads for the product-details page                                 */
/* -------------------------------------------------------------------------- */

/**
 * Active deal banners ordered for display. Tagged `deal-banners` so
 * admin mutations can bust this cache without touching the heavier
 * `admin-banners` aggregate. 5 minute TTL with stale-while-revalidate
 * via `revalidateTag(..., "max")`.
 */
const getCachedActiveDealBanners = unstable_cache(
  async (): Promise<DealBannerRow[]> => {
    return prisma.dealBanner.findMany({
      where: { status: "ACTIVE" },
      orderBy: [{ position: "asc" }, { createdAt: "desc" }],
      select: dealBannerSelect,
    });
  },
  ["deal-banners-active"],
  { revalidate: 300, tags: ["deal-banners"] },
);

export function getActiveDealBanners() {
  return getCachedActiveDealBanners();
}

/** Same idea, but for the side-rail promo banners. */
const getCachedActivePromoBanners = unstable_cache(
  async (): Promise<PromoBannerRow[]> => {
    return prisma.promoBanner.findMany({
      where: { status: "ACTIVE" },
      orderBy: [{ position: "asc" }, { createdAt: "desc" }],
      select: promoBannerSelect,
    });
  },
  ["promo-banners-active"],
  { revalidate: 300, tags: ["promo-banners"] },
);

export function getActivePromoBanners() {
  return getCachedActivePromoBanners();
}
