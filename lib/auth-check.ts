import "server-only";

import type { Session } from "next-auth";

import { auth } from "@/lib/auth/auth";
import { jsonError } from "@/lib/auth/responses";

/**
 * Centralized admin gate for protected routes.
 *
 * Returning a discriminated union (instead of throwing) keeps the route
 * handler in normal control flow: caller checks `result.ok` and either
 * returns `result.response` or proceeds with `result.session`.
 *
 *   const guard = await requireAdmin();
 *   if (!guard.ok) return guard.response;
 *   // ...do admin work, guard.session.user.id is available
 */
export type AdminGuard =| { ok: true; session: Session } | { ok: false; response: Response };

export async function requireAdmin(): Promise<AdminGuard> {
  // NextAuth's `auth()` is overloaded; the no-arg form returns the session.
  const session = (await auth()) as Session | null;

  if (!session?.user) {
    return { ok: false, response: jsonError(401, "Authentication required.") };
  }

  if (session.user.role !== "ADMIN") {
    return { ok: false, response: jsonError(403, "Admin access only.") };
  }

  return { ok: true, session };
}
