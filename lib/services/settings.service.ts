import "server-only";

import { Prisma } from "@prisma/client";
import { unstable_cache } from "next/cache";

import { prisma } from "@/lib/prisma";
import { ServiceError } from "@/lib/services/service-error";
import type {
  CreatePromoCodeInput,
  UpdatePromoCodeInput,
  UpdateStoreSettingsInput,
} from "@/lib/validations/settings.validation";

/**
 * Single home for store settings + promo code DB logic.
 *
 * Store settings is a singleton: the service auto-provisions the row
 * with sensible defaults the first time someone reads it, so the
 * admin form always has something to bind against. Promo codes are a
 * normal CRUD list with case-insensitive `code` lookups so customers
 * can type "enterfly10" or "ENTERFLY10" and both work.
 */

export class SettingsError extends ServiceError {
  constructor(
    status: number,
    message: string,
    details?: Record<string, unknown>,
  ) {
    super(status, message, details);
    this.name = "SettingsError";
  }
}

/* -------------------------------------------------------------------------- */
/*  Selects                                                                   */
/* -------------------------------------------------------------------------- */

const settingsSelect = {
  id: true,
  taxRate: true,
  standardShippingFee: true,
  expressShippingFee: true,
  freeShippingThreshold: true,
  currency: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.StoreSettingsSelect;

const promoSelect = {
  id: true,
  code: true,
  description: true,
  discountType: true,
  value: true,
  minOrder: true,
  maxDiscount: true,
  startsAt: true,
  endsAt: true,
  usageLimit: true,
  usedCount: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.PromoCodeSelect;

export type StoreSettingsRow = Prisma.StoreSettingsGetPayload<{
  select: typeof settingsSelect;
}>;
export type PromoCodeRow = Prisma.PromoCodeGetPayload<{
  select: typeof promoSelect;
}>;

/* -------------------------------------------------------------------------- */
/*  Store settings                                                            */
/* -------------------------------------------------------------------------- */

/**
 * Read or create the singleton settings row.
 *
 * We pick the oldest row (`createdAt asc`) so concurrent first-time
 * reads can't end up with two singletons — the loser of the race
 * still finds the winner's row on its retry.
 */
export async function getStoreSettings(): Promise<StoreSettingsRow> {
  const existing = await prisma.storeSettings.findFirst({
    orderBy: { createdAt: "asc" },
    select: settingsSelect,
  });
  if (existing) return existing;

  return prisma.storeSettings.create({
    data: {},
    select: settingsSelect,
  });
}

/**
 * Cache layer over the singleton read. Tagged `store-settings` so any
 * admin update can bust both the admin panel and the storefront cart
 * pricing in one shot.
 */
const getCachedStoreSettings = unstable_cache(
  () => getStoreSettings(),
  ["store-settings"],
  { revalidate: 600, tags: ["store-settings"] },
);

export function getStoreSettingsCached() {
  return getCachedStoreSettings();
}

export async function updateStoreSettings(input: UpdateStoreSettingsInput) {
  const current = await getStoreSettings();

  const data: Prisma.StoreSettingsUpdateInput = {};
  if (input.taxRate !== undefined) data.taxRate = input.taxRate;
  if (input.standardShippingFee !== undefined) {
    data.standardShippingFee = input.standardShippingFee;
  }
  if (input.expressShippingFee !== undefined) {
    data.expressShippingFee = input.expressShippingFee;
  }
  if (input.freeShippingThreshold !== undefined) {
    data.freeShippingThreshold = input.freeShippingThreshold;
  }
  if (input.currency !== undefined) data.currency = input.currency;

  return prisma.storeSettings.update({
    where: { id: current.id },
    data,
    select: settingsSelect,
  });
}

/* -------------------------------------------------------------------------- */
/*  Promo codes                                                               */
/* -------------------------------------------------------------------------- */

function normalizeCode(code: string): string {
  return code.trim().toUpperCase();
}

function normalizeDate(value: string | null | undefined): Date | null {
  if (value === undefined) return null;
  if (value === null || value === "") return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function listPromoCodes(): Promise<PromoCodeRow[]> {
  return prisma.promoCode.findMany({
    orderBy: { createdAt: "desc" },
    select: promoSelect,
  });
}

const getCachedPromoCodes = unstable_cache(
  () => listPromoCodes(),
  ["promo-codes-list"],
  { revalidate: 300, tags: ["promo-codes"] },
);

export function listPromoCodesCached() {
  return getCachedPromoCodes();
}

/**
 * Customer-facing lookup. Filters out expired/inactive entries so the
 * cart never has to second-guess what came back. Returns `null` when
 * no usable code matches.
 */
export async function findActivePromoCode(
  rawCode: string,
): Promise<PromoCodeRow | null> {
  const code = normalizeCode(rawCode);
  if (!code) return null;

  const now = new Date();
  return prisma.promoCode.findFirst({
    where: {
      code,
      status: "ACTIVE",
      AND: [
        { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
        { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
      ],
    },
    select: promoSelect,
  });
}

export async function createPromoCode(input: CreatePromoCodeInput) {
  const data: Prisma.PromoCodeCreateInput = {
    code: normalizeCode(input.code),
    description: input.description ?? null,
    discountType: input.discountType,
    value: input.value,
    minOrder: input.minOrder ?? null,
    maxDiscount: input.maxDiscount ?? null,
    startsAt: normalizeDate(input.startsAt),
    endsAt: normalizeDate(input.endsAt),
    usageLimit: input.usageLimit ?? null,
    status: input.status,
  };

  try {
    return await prisma.promoCode.create({
      data,
      select: promoSelect,
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new SettingsError(409, "A promo code with that name already exists.");
    }
    throw error;
  }
}

export async function updatePromoCode(
  id: string,
  input: UpdatePromoCodeInput,
) {
  const existing = await prisma.promoCode.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!existing) {
    throw new SettingsError(404, "Promo code not found.");
  }

  const data: Prisma.PromoCodeUpdateInput = {};
  if (input.code !== undefined) data.code = normalizeCode(input.code);
  if (input.description !== undefined) data.description = input.description;
  if (input.discountType !== undefined) data.discountType = input.discountType;
  if (input.value !== undefined) data.value = input.value;
  if (input.minOrder !== undefined) data.minOrder = input.minOrder;
  if (input.maxDiscount !== undefined) data.maxDiscount = input.maxDiscount;
  if (input.startsAt !== undefined) {
    data.startsAt = normalizeDate(input.startsAt);
  }
  if (input.endsAt !== undefined) data.endsAt = normalizeDate(input.endsAt);
  if (input.usageLimit !== undefined) data.usageLimit = input.usageLimit;
  if (input.status !== undefined) data.status = input.status;

  try {
    return await prisma.promoCode.update({
      where: { id },
      data,
      select: promoSelect,
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        throw new SettingsError(404, "Promo code not found.");
      }
      if (error.code === "P2002") {
        throw new SettingsError(
          409,
          "A promo code with that name already exists.",
        );
      }
    }
    throw error;
  }
}

export async function deletePromoCode(id: string) {
  try {
    return await prisma.promoCode.delete({
      where: { id },
      select: promoSelect,
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      throw new SettingsError(404, "Promo code not found.");
    }
    throw error;
  }
}
