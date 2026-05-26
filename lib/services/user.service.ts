import "server-only";

import { Prisma } from "@prisma/client";
import { unstable_cache } from "next/cache";

import { prisma } from "@/lib/prisma";
import { ServiceError } from "@/lib/services/service-error";
import type {
  AdminUserQueryInput,
  UpdateUserRoleInput,
} from "@/lib/validations/user.validation";

/**
 * The single home for User admin DB logic.
 *
 * Route handlers stay thin and these helpers stay reusable. Domain
 * rules live here:
 *   - role updates can't promote/demote yourself (caller decides UX,
 *     service enforces the basic invariant — last admin standing).
 *   - reads are served from `unstable_cache` and busted on demand
 *     when a write happens.
 */

export class UserError extends ServiceError {
  constructor(
    status: number,
    message: string,
    details?: Record<string, unknown>,
  ) {
    super(status, message, details);
    this.name = "UserError";
  }
}

/* -------------------------------------------------------------------------- */
/*  Admin reads                                                               */
/* -------------------------------------------------------------------------- */

function buildAdminWhere(query: AdminUserQueryInput): Prisma.UserWhereInput {
  const where: Prisma.UserWhereInput = {};

  if (query.role) where.role = query.role;

  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: "insensitive" } },
      { email: { contains: query.search, mode: "insensitive" } },
      { phone: { contains: query.search, mode: "insensitive" } },
    ];
  }

  return where;
}

/**
 * Paginated list of users for the admin panel. Each row includes
 * lightweight aggregates (order count, total spend, last order date)
 * so the UI can render a meaningful customer table without N+1s.
 */
export async function listUsersForAdmin(query: AdminUserQueryInput) {
  const where = buildAdminWhere(query);
  const skip = (query.page - 1) * query.pageSize;

  const [rows, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: query.pageSize,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        city: true,
        image: true,
        role: true,
        termsAcceptedAt: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { orders: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  // Pull per-user spend / last order date in one round trip.
  // We aggregate by `userId` and exclude cancelled orders so the
  // numbers reflect actual revenue earned from each customer.
  const userIds = rows.map((row) => row.id);
  const aggregates =
    userIds.length === 0
      ? []
      : await prisma.order.groupBy({
          by: ["userId"],
          where: {
            userId: { in: userIds },
            status: { not: "CANCELLED" },
          },
          _sum: { totalAmount: true },
          _max: { createdAt: true },
          _count: { _all: true },
        });

  const aggregateMap = new Map(
    aggregates.map((row) => [
      row.userId,
      {
        totalSpend: row._sum.totalAmount ?? 0,
        lastOrderAt: row._max.createdAt ?? null,
        liveOrders: row._count._all,
      },
    ]),
  );

  const items = rows.map((row) => {
    const { _count, ...rest } = row;
    const stats = aggregateMap.get(row.id);
    return {
      ...rest,
      ordersCount: _count.orders,
      liveOrdersCount: stats?.liveOrders ?? 0,
      totalSpend: stats?.totalSpend ?? 0,
      lastOrderAt: stats?.lastOrderAt ?? null,
    };
  });

  return {
    items,
    meta: {
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
    },
  };
}

/**
 * Cache layer over `listUsersForAdmin`. Tagged `admin-users` so role
 * changes (and new sign-ups, when wired) can bust it on demand via
 * `revalidateTag("admin-users", "max")`.
 */
const getCachedUsersForAdmin = unstable_cache(
  async (query: AdminUserQueryInput) => listUsersForAdmin(query),
  ["admin-users-list"],
  { revalidate: 300, tags: ["admin-users"] },
);

export function listUsersForAdminCached(query: AdminUserQueryInput) {
  return getCachedUsersForAdmin(query);
}

export function getUserForAdmin(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      city: true,
      image: true,
      role: true,
      termsAcceptedAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

/* -------------------------------------------------------------------------- */
/*  Admin updates                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Flip a user's role between USER and ADMIN.
 *
 * Guards:
 *   - 404 when the user doesn't exist.
 *   - 409 when the role is already what was requested (no-op).
 *   - 409 when demoting the last remaining ADMIN — we always keep at
 *     least one admin so the panel can never lock itself out.
 */
export async function updateUserRole(
  userId: string,
  input: UpdateUserRoleInput,
) {
  const existing = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });
  if (!existing) throw new UserError(404, "User not found.");

  if (existing.role === input.role) {
    throw new UserError(409, `User is already ${input.role}.`);
  }

  if (existing.role === "ADMIN" && input.role === "USER") {
    const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
    if (adminCount <= 1) {
      throw new UserError(
        409,
        "At least one admin must remain. Promote another user first.",
      );
    }
  }

  return prisma.user.update({
    where: { id: userId },
    data: { role: input.role },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      city: true,
      image: true,
      role: true,
      termsAcceptedAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}
