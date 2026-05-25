import "server-only";

import { NextResponse } from "next/server";

/**
 * Uniform JSON envelopes used by every route in `app/api`.
 *
 * Why a single envelope?
 *   - The client never has to branch on response shape.
 *   - Pagination meta (page, total) lives in a predictable place.
 *   - Adding fields later (e.g. `requestId`) is a one-line change here.
 *
 * Error helpers live in `lib/auth/responses.ts` and are re-exported below
 * so callers only ever import from one file.
 */

export type ApiMeta = {
  page?: number;
  pageSize?: number;
  total?: number;
  totalPages?: number;
  [key: string]: unknown;
};

/** 200 OK with `{ success: true, data, meta? }`. */
export function ok<T>(data: T, meta?: ApiMeta) {
  return NextResponse.json(
    { success: true, data, ...(meta ? { meta } : {}) },
    { status: 200 },
  );
}

/** 201 Created with `{ success: true, data }`. */
export function created<T>(data: T) {
  return NextResponse.json({ success: true, data }, { status: 201 });
}

export { jsonError } from "@/lib/auth/responses";
