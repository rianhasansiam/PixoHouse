import "server-only";

import type { Prisma } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client";

import { prisma } from "@/lib/db/prisma";
import {
  multiply,
  round2,
  sumDecimals,
  toDecimal,
  toNumber,
} from "@/lib/money";
import { ServiceError } from "@/lib/services/service-error";
import type {
  AddCapitalInput,
  CreateOtherCostInput,
  OtherCostQueryInput,
  UpdateOtherCostInput,
} from "@/lib/validations/capital-cost.validation";

/**
 * Admin Capital & Cost Tracker — DB logic.
 *
 * Fully ISOLATED from order/revenue/product mutations. The only place it
 * touches existing data is a READ-ONLY derivation of "product cost"
 * (buyingPrice × on-hand stock) used purely for display. It never writes
 * to Product/Order/etc. and never exposes `buyingPrice` to customers
 * (these endpoints are admin-guarded).
 *
 * `AdminCapital` is an append-only ledger: each "add capital" creates a
 * new row, and total capital is the sum of every contribution. Capital is
 * never edited or overwritten.
 */

/** The admin who performed an action, snapshotted onto the activity feed. */
export type ActivityActor = {
  id?: string | null;
  name?: string | null;
  email?: string | null;
};

/* -------------------------------------------------------------------------- */
/*  Serialized shapes (Decimal → number at the JSON boundary)                 */
/* -------------------------------------------------------------------------- */

export type SerializedCapital = {
  id: string;
  amount: number;
  note: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SerializedOtherCost = {
  id: string;
  amount: number;
  reason: string;
  description: string | null;
  costDate: string;
  createdAt: string;
  updatedAt: string;
};

export type ProductCostSummary = {
  totalProductCost: number;
  productCount: number;
  totalUnits: number;
};

export type CapitalCostSummary = {
  totalCapital: number;
  productCosts: number;
  otherCosts: number;
  allCosts: number;
  remainingBalance: number;
};

export type CapitalCostActivityKind =
  | "CAPITAL_SET"
  | "CAPITAL_UPDATED"
  | "CAPITAL_ADDED"
  | "COST_CREATED"
  | "COST_UPDATED"
  | "COST_DELETED";

export type SerializedActivity = {
  id: string;
  type: CapitalCostActivityKind;
  description: string;
  amount: number | null;
  note: string | null;
  entityId: string | null;
  actorName: string | null;
  actorEmail: string | null;
  createdAt: string;
};

export type CapitalCostOverview = {
  capital: SerializedCapital | null;
  productCost: ProductCostSummary;
  otherCosts: { items: SerializedOtherCost[]; total: number };
  summary: CapitalCostSummary;
  activity: SerializedActivity[];
};

/* -------------------------------------------------------------------------- */
/*  Selects + serializers                                                     */
/* -------------------------------------------------------------------------- */

const capitalSelect = {
  id: true,
  amount: true,
  note: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.AdminCapitalSelect;

const otherCostSelect = {
  id: true,
  amount: true,
  reason: true,
  description: true,
  costDate: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.AdminOtherCostSelect;

function serializeCapital(row: {
  id: string;
  amount: Prisma.Decimal;
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
}): SerializedCapital {
  return {
    id: row.id,
    amount: toNumber(row.amount),
    note: row.note,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function serializeOtherCost(row: {
  id: string;
  amount: Prisma.Decimal;
  reason: string;
  description: string | null;
  costDate: Date;
  createdAt: Date;
  updatedAt: Date;
}): SerializedOtherCost {
  return {
    id: row.id,
    amount: toNumber(row.amount),
    reason: row.reason,
    description: row.description,
    costDate: row.costDate.toISOString(),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

/* -------------------------------------------------------------------------- */
/*  Activity log (append-only)                                                */
/* -------------------------------------------------------------------------- */

const activitySelect = {
  id: true,
  type: true,
  description: true,
  amount: true,
  note: true,
  entityId: true,
  actorName: true,
  actorEmail: true,
  createdAt: true,
} satisfies Prisma.AdminCapitalCostActivitySelect;

function serializeActivity(row: {
  id: string;
  type: CapitalCostActivityKind;
  description: string;
  amount: Prisma.Decimal | null;
  note: string | null;
  entityId: string | null;
  actorName: string | null;
  actorEmail: string | null;
  createdAt: Date;
}): SerializedActivity {
  return {
    id: row.id,
    type: row.type,
    description: row.description,
    amount: row.amount == null ? null : toNumber(row.amount),
    note: row.note,
    entityId: row.entityId,
    actorName: row.actorName,
    actorEmail: row.actorEmail,
    createdAt: row.createdAt.toISOString(),
  };
}

/** Compact money string for activity descriptions, e.g. "BDT 100,000". */
function formatMoney(value: number): string {
  const rounded = round2(value);
  return `BDT ${rounded.toLocaleString("en-US", {
    minimumFractionDigits: Math.abs(rounded % 1) > 0.0001 ? 2 : 0,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Record an action on this page. Best-effort: a logging failure must
 * never roll back the actual mutation the admin performed, so callers
 * swallow errors from here.
 */
async function logActivity(entry: {
  type: CapitalCostActivityKind;
  description: string;
  amount?: number | null;
  note?: string | null;
  entityId?: string | null;
  actor?: ActivityActor | null;
}): Promise<void> {
  try {
    await prisma.adminCapitalCostActivity.create({
      data: {
        type: entry.type,
        description: entry.description,
        amount: entry.amount ?? null,
        note: entry.note ?? null,
        entityId: entry.entityId ?? null,
        actorId: entry.actor?.id ?? null,
        actorName: entry.actor?.name ?? null,
        actorEmail: entry.actor?.email ?? null,
      },
    });
  } catch (error) {
    console.error("[admin.capital-costs.activity] log failed", error);
  }
}

/** Most recent activity entries, newest first. */
export async function listRecentActivity(
  limit = 20,
): Promise<SerializedActivity[]> {
  const rows = await prisma.adminCapitalCostActivity.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: activitySelect,
  });
  return rows.map(serializeActivity);
}

/* -------------------------------------------------------------------------- */
/*  Capital (append-only ledger)                                              */
/* -------------------------------------------------------------------------- */

/** Total capital (sum of every contribution) + the latest contribution. */
async function readCapital(): Promise<{
  total: number;
  latest: SerializedCapital | null;
}> {
  const [rows, latest] = await Promise.all([
    prisma.adminCapital.findMany({ select: { amount: true } }),
    prisma.adminCapital.findFirst({
      orderBy: { createdAt: "desc" },
      select: capitalSelect,
    }),
  ]);

  return {
    total: round2(sumDecimals(rows.map((row) => row.amount))),
    latest: latest ? serializeCapital(latest) : null,
  };
}

/**
 * The most recent capital contribution, or `null` when none exists yet.
 * Used for the "has capital" check; the headline figure is the *sum* of
 * all contributions (see the overview).
 */
export async function getCapital(): Promise<SerializedCapital | null> {
  return (await readCapital()).latest;
}

/**
 * Add a capital contribution. Append-only — every call creates a new row
 * and the running total grows by `input.amount`. Capital is never edited
 * or overwritten.
 */
export async function addCapital(
  input: AddCapitalInput,
  actor?: ActivityActor,
): Promise<SerializedCapital> {
  const created = await prisma.adminCapital.create({
    data: { amount: input.amount, note: input.note ?? null },
    select: capitalSelect,
  });

  await logActivity({
    type: "CAPITAL_ADDED",
    description: `Added ${formatMoney(created.amount.toNumber())} to capital`,
    amount: created.amount.toNumber(),
    note: created.note,
    entityId: created.id,
    actor,
  });

  return serializeCapital(created);
}

/* -------------------------------------------------------------------------- */
/*  Product cost (READ-ONLY derivation from the catalog)                      */
/* -------------------------------------------------------------------------- */

/**
 * Derive capital tied up in inventory: for each product,
 * `buyingPrice × (sum of its variant stock)`. Purely informational — no
 * writes, and never persisted into this feature's tables.
 */
export async function getProductCost(): Promise<ProductCostSummary> {
  const products = await prisma.product.findMany({
    select: {
      buyingPrice: true,
      variants: { select: { stock: true } },
    },
  });

  let totalCost = toDecimal(0);
  let totalUnits = 0;
  let productCount = 0;

  for (const product of products) {
    const units = product.variants.reduce(
      (sum, variant) => sum + variant.stock,
      0,
    );
    if (units <= 0) continue;

    totalCost = totalCost.plus(multiply(product.buyingPrice, units));
    totalUnits += units;
    productCount += 1;
  }

  return {
    totalProductCost: round2(totalCost),
    productCount,
    totalUnits,
  };
}

/* -------------------------------------------------------------------------- */
/*  Other costs (CRUD)                                                        */
/* -------------------------------------------------------------------------- */

function buildOtherCostWhere(
  query: Partial<OtherCostQueryInput>,
): Prisma.AdminOtherCostWhereInput {
  const where: Prisma.AdminOtherCostWhereInput = {};

  if (query.search) {
    where.OR = [
      { reason: { contains: query.search, mode: "insensitive" } },
      { description: { contains: query.search, mode: "insensitive" } },
    ];
  }

  if (query.dateFrom || query.dateTo) {
    const costDate: Prisma.DateTimeFilter = {};
    if (query.dateFrom) costDate.gte = query.dateFrom;
    if (query.dateTo) {
      // The picker yields a midnight Date; include the whole day.
      const end = new Date(query.dateTo);
      end.setHours(23, 59, 59, 999);
      costDate.lte = end;
    }
    where.costDate = costDate;
  }

  if (query.minAmount !== undefined || query.maxAmount !== undefined) {
    const amount: Prisma.DecimalFilter = {};
    if (query.minAmount !== undefined) amount.gte = query.minAmount;
    if (query.maxAmount !== undefined) amount.lte = query.maxAmount;
    where.amount = amount;
  }

  return where;
}

/**
 * List manual "other costs" with optional filtering. Returns the matched
 * rows plus the exact (Decimal-safe) sum of their amounts so the UI can
 * show a "filtered total" without re-summing client-side floats.
 */
export async function listOtherCosts(query: OtherCostQueryInput): Promise<{
  items: SerializedOtherCost[];
  total: number;
  filteredTotalAmount: number;
  meta: { page: number; pageSize: number; total: number; totalPages: number };
}> {
  const where = buildOtherCostWhere(query);
  const skip = (query.page - 1) * query.pageSize;

  const [rows, count, amountRows] = await Promise.all([
    prisma.adminOtherCost.findMany({
      where,
      orderBy: [{ costDate: "desc" }, { createdAt: "desc" }],
      skip,
      take: query.pageSize,
      select: otherCostSelect,
    }),
    prisma.adminOtherCost.count({ where }),
    prisma.adminOtherCost.findMany({ where, select: { amount: true } }),
  ]);

  const filteredTotalAmount = round2(
    sumDecimals(amountRows.map((row) => row.amount)),
  );

  return {
    items: rows.map(serializeOtherCost),
    total: count,
    filteredTotalAmount,
    meta: {
      page: query.page,
      pageSize: query.pageSize,
      total: count,
      totalPages: Math.max(1, Math.ceil(count / query.pageSize)),
    },
  };
}

export async function createOtherCost(
  input: CreateOtherCostInput,
  actor?: ActivityActor,
): Promise<SerializedOtherCost> {
  const row = await prisma.adminOtherCost.create({
    data: {
      amount: input.amount,
      reason: input.reason,
      description: input.description ?? null,
      costDate: input.costDate,
    },
    select: otherCostSelect,
  });
  await logActivity({
    type: "COST_CREATED",
    description: `Added cost "${row.reason}" for ${formatMoney(row.amount.toNumber())}`,
    amount: row.amount.toNumber(),
    note: row.reason,
    entityId: row.id,
    actor,
  });
  return serializeOtherCost(row);
}

export async function updateOtherCost(
  id: string,
  input: UpdateOtherCostInput,
  actor?: ActivityActor,
): Promise<SerializedOtherCost> {
  const data: Prisma.AdminOtherCostUpdateInput = {};
  if (input.amount !== undefined) data.amount = input.amount;
  if (input.reason !== undefined) data.reason = input.reason;
  if (input.description !== undefined) data.description = input.description;
  if (input.costDate !== undefined) data.costDate = input.costDate;

  try {
    const row = await prisma.adminOtherCost.update({
      where: { id },
      data,
      select: otherCostSelect,
    });
    await logActivity({
      type: "COST_UPDATED",
      description: `Updated cost "${row.reason}" (${formatMoney(row.amount.toNumber())})`,
      amount: row.amount.toNumber(),
      note: row.reason,
      entityId: row.id,
      actor,
    });
    return serializeOtherCost(row);
  } catch (error) {
    if (
      error instanceof PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      throw new ServiceError(404, "Cost record not found.");
    }
    throw error;
  }
}

export async function deleteOtherCost(
  id: string,
  actor?: ActivityActor,
): Promise<{ id: string }> {
  try {
    const row = await prisma.adminOtherCost.delete({
      where: { id },
      select: otherCostSelect,
    });
    await logActivity({
      type: "COST_DELETED",
      description: `Deleted cost "${row.reason}" (${formatMoney(row.amount.toNumber())})`,
      amount: row.amount.toNumber(),
      note: row.reason,
      entityId: row.id,
      actor,
    });
    return { id };
  } catch (error) {
    if (
      error instanceof PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      throw new ServiceError(404, "Cost record not found.");
    }
    throw error;
  }
}

/* -------------------------------------------------------------------------- */
/*  Overview (cards + capital + first page of costs)                          */
/* -------------------------------------------------------------------------- */

/**
 * One-shot snapshot for the page: capital, derived product cost, the
 * (unfiltered) other-cost list, and the headline summary numbers. All
 * money math flows through Decimal helpers and is rounded once at the end.
 */
export async function getCapitalCostOverview(): Promise<CapitalCostOverview> {
  const [capitalState, productCost, otherList] = await Promise.all([
    readCapital(),
    getProductCost(),
    listOtherCosts({ page: 1, pageSize: 200 }),
  ]);

  const totalCapital = capitalState.total;
  const productCosts = productCost.totalProductCost;
  const otherCosts = otherList.filteredTotalAmount;
  const allCosts = round2(toDecimal(productCosts).plus(toDecimal(otherCosts)));
  const remainingBalance = round2(
    toDecimal(totalCapital).minus(toDecimal(allCosts)),
  );

  const activity = await listRecentActivity(20);

  return {
    capital: capitalState.latest,
    productCost,
    otherCosts: { items: otherList.items, total: otherCosts },
    summary: {
      totalCapital,
      productCosts,
      otherCosts,
      allCosts,
      remainingBalance,
    },
    activity,
  };
}
