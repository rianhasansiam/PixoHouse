"use client";

/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Loader2,
  RotateCcw,
  Search,
  ShieldCheck,
  UserRound,
  Users,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useDispatch, useSelector } from "react-redux";

import {
  patchAdminUser,
  setAdminUsers,
  setAdminUsersError,
  setAdminUsersLoading,
} from "@/store/slices/admin-users.slice";
import type { AppDispatch, RootState } from "@/store";
import {
  fetchAllAdminUsersSnapshot,
  formatCurrency,
  formatDate,
  getInitials,
  patchUserRole,
  ROLE_VALUES,
  type AdminUserRow,
  type Role,
} from "@/features/admin-users/api";
import { cn } from "@/lib/utils";

const ROLE_BADGE: Record<Role, string> = {
  USER: "bg-violet-50 text-violet-700 ring-violet-200",
  ADMIN: "bg-emerald-50 text-emerald-700 ring-emerald-200",
};

type RoleFilter = "ALL" | Role;

export default function AdminCustomersPage() {
  const dispatch = useDispatch<AppDispatch>();
  const users = useSelector((state: RootState) => state.adminUsers.items);
  const isLoading = useSelector(
    (state: RootState) => state.adminUsers.isLoading,
  );
  const isHydrated = useSelector(
    (state: RootState) => state.adminUsers.isHydrated,
  );
  const error = useSelector((state: RootState) => state.adminUsers.error);

  const { data: session } = useSession();
  const currentUserId = session?.user?.id ?? null;

  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("ALL");

  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [successNote, setSuccessNote] = useState<string | null>(null);

  const refreshUsers = useCallback(async () => {
    dispatch(setAdminUsersLoading(true));
    dispatch(setAdminUsersError(null));
    try {
      const items = await fetchAllAdminUsersSnapshot();
      dispatch(setAdminUsers(items));
    } catch (loadError) {
      const message =
        loadError instanceof Error
          ? loadError.message
          : "Failed to load customers.";
      dispatch(setAdminUsersError(message));
    } finally {
      dispatch(setAdminUsersLoading(false));
    }
  }, [dispatch]);

  useEffect(() => {
    if (isHydrated) return;
    void refreshUsers();
  }, [isHydrated, refreshUsers]);

  const visibleUsers = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((user) => {
      const matchQuery =
        !q ||
        user.name.toLowerCase().includes(q) ||
        user.email.toLowerCase().includes(q) ||
        (user.phone ?? "").toLowerCase().includes(q) ||
        (user.city ?? "").toLowerCase().includes(q);

      const matchRole = roleFilter === "ALL" || user.role === roleFilter;
      return matchQuery && matchRole;
    });
  }, [query, roleFilter, users]);

  const totals = useMemo(() => {
    let admins = 0;
    let withOrders = 0;
    let lifetimeRevenue = 0;
    for (const user of users) {
      if (user.role === "ADMIN") admins += 1;
      if (user.ordersCount > 0) withOrders += 1;
      lifetimeRevenue += user.totalSpend;
    }
    return { admins, withOrders, lifetimeRevenue };
  }, [users]);

  const handleToggleRole = async (user: AdminUserRow) => {
    if (user.id === currentUserId) {
      setMutationError("You can't change your own role.");
      return;
    }

    const next: Role = user.role === "ADMIN" ? "USER" : "ADMIN";
    setMutationError(null);
    setSuccessNote(null);
    setBusyUserId(user.id);

    try {
      const updated = await patchUserRole(user.id, next);
      dispatch(
        patchAdminUser({
          id: user.id,
          changes: { role: updated.role, updatedAt: updated.updatedAt },
        }),
      );
      setSuccessNote(`${user.name || user.email} is now ${next}.`);
    } catch (mutation) {
      const message =
        mutation instanceof Error ? mutation.message : "Failed to update role.";
      setMutationError(message);
    } finally {
      setBusyUserId(null);
    }
  };

  return (
    <section className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryCard
          icon={<Users className="h-4 w-4" />}
          label="Total customers"
          value={users.length.toLocaleString()}
          accent="violet"
        />
        <SummaryCard
          icon={<ShieldCheck className="h-4 w-4" />}
          label="Admins"
          value={totals.admins.toLocaleString()}
          accent="emerald"
        />
        <SummaryCard
          icon={<UserRound className="h-4 w-4" />}
          label="With orders"
          value={`${totals.withOrders} · ${formatCurrency(totals.lifetimeRevenue)}`}
          accent="amber"
        />
      </div>

      <div className="rounded-2xl border border-violet-100 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
            <label className="relative flex flex-1 items-center">
              <Search className="pointer-events-none absolute left-3 h-4 w-4 text-violet-400" />
              <input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by name, email, phone, or city..."
                className="h-10 w-full rounded-xl border border-violet-200 pl-9 pr-3 text-sm outline-none transition focus:border-violet-500"
              />
            </label>

            <select
              value={roleFilter}
              onChange={(event) =>
                setRoleFilter(event.target.value as RoleFilter)
              }
              className="h-10 rounded-xl border border-violet-200 px-3 text-sm outline-none transition focus:border-violet-500"
            >
              <option value="ALL">All roles</option>
              {ROLE_VALUES.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => {
              void refreshUsers();
            }}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-violet-200 px-3 text-sm font-semibold text-violet-700 transition hover:bg-violet-50"
          >
            <RotateCcw className="h-4 w-4" />
            Refresh
          </button>
        </div>

        <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
          <span>
            {visibleUsers.length} / {users.length} customers
          </span>
          {isLoading && <span>Syncing customers...</span>}
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {mutationError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {mutationError}
        </div>
      )}

      {successNote && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          {successNote}
        </div>
      )}

      {isLoading && users.length === 0 ? (
        <div className="rounded-2xl border border-violet-100 bg-white p-10 text-center text-sm text-violet-700 shadow-sm">
          <span className="inline-flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading customers...
          </span>
        </div>
      ) : visibleUsers.length === 0 ? (
        <div className="rounded-2xl border border-violet-100 bg-white p-10 text-center text-sm text-gray-600 shadow-sm">
          <Users className="mx-auto mb-2 h-8 w-8 text-violet-300" />
          No customers match the current filters.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-violet-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-violet-50 text-left text-xs uppercase tracking-wider text-violet-700">
                <tr>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Orders</th>
                  <th className="px-4 py-3">Spend</th>
                  <th className="px-4 py-3">Joined</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleUsers.map((user) => {
                  const isBusy = busyUserId === user.id;
                  const isSelf = user.id === currentUserId;
                  const nextRole: Role = user.role === "ADMIN" ? "USER" : "ADMIN";

                  return (
                    <tr
                      key={user.id}
                      className="border-t border-violet-100/70 align-top"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {user.image ? (
                            <img
                              src={user.image}
                              alt={user.name}
                              className="h-10 w-10 rounded-full border border-violet-100 object-cover"
                            />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-linear-to-br from-violet-500 to-indigo-600 text-xs font-bold text-white">
                              {getInitials(user.name, user.email)}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-gray-900">
                              {user.name || "—"}
                            </p>
                            <p className="truncate text-xs text-gray-500">
                              {user.city || "No city set"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="truncate text-gray-700">{user.email}</p>
                        <p className="truncate text-xs text-gray-500">
                          {user.phone || "No phone"}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold ring-1 ring-inset",
                            ROLE_BADGE[user.role],
                          )}
                        >
                          {user.role}
                        </span>
                        {isSelf && (
                          <p className="mt-1 text-[11px] uppercase tracking-wide text-violet-500">
                            You
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        <p className="font-semibold text-gray-900">
                          {user.ordersCount}
                        </p>
                        {user.liveOrdersCount > 0 && (
                          <p className="text-xs text-gray-500">
                            {user.liveOrdersCount} active
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-gray-900">
                          {formatCurrency(user.totalSpend)}
                        </p>
                        <p className="text-xs text-gray-500">
                          Last: {formatDate(user.lastOrderAt)}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              void handleToggleRole(user);
                            }}
                            disabled={isBusy || isSelf}
                            className={cn(
                              "inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60",
                              user.role === "ADMIN"
                                ? "border-amber-200 text-amber-700 hover:bg-amber-50"
                                : "border-emerald-200 text-emerald-700 hover:bg-emerald-50",
                            )}
                          >
                            {isBusy ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <ShieldCheck className="h-3.5 w-3.5" />
                            )}
                            Make {nextRole}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}

type SummaryAccent = "violet" | "emerald" | "amber";

const ACCENT_STYLES: Record<SummaryAccent, string> = {
  violet: "from-violet-500/10 to-indigo-500/10 text-violet-700",
  emerald: "from-emerald-500/10 to-teal-500/10 text-emerald-700",
  amber: "from-amber-500/10 to-orange-500/10 text-amber-700",
};

function SummaryCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent: SummaryAccent;
}) {
  return (
    <div className="rounded-2xl border border-violet-100 bg-white p-4 shadow-sm">
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
        {icon}
        {label}
      </p>
      <p
        className={cn(
          "mt-2 inline-flex rounded-xl bg-linear-to-r px-3 py-1.5 text-sm font-bold",
          ACCENT_STYLES[accent],
        )}
      >
        {value}
      </p>
    </div>
  );
}
