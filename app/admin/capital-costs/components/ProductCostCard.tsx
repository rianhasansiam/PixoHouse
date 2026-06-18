"use client";

import { Boxes, Info, Loader2 } from "lucide-react";

import type { ProductCostSummary } from "@/features/admin-capital-costs/api";
import { formatCurrency } from "@/features/admin-capital-costs/api";

/**
 * Read-only product-cost summary.
 *
 * Product cost is DERIVED from the existing catalog — buying price ×
 * on-hand variant stock — and is never editable here. The admin manages
 * product data on the Products page; this card only reports the value.
 */
export default function ProductCostCard({
  productCost,
  currency,
  isLoading,
}: {
  productCost: ProductCostSummary | null;
  currency: string;
  isLoading: boolean;
}) {
  return (
    <div className="rounded-2xl border border-brand-border bg-brand-white p-5 shadow-sm">
      <header className="mb-4">
        <h2 className="flex items-center gap-2 text-base font-bold text-gray-900">
          <Boxes className="h-4 w-4 text-brand-red" />
          Product costs
          <span className="rounded-full bg-brand-light-bg px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gray-500">
            Read only
          </span>
        </h2>
        <p className="mt-1 text-xs text-gray-500">
          Calculated from each product&apos;s buying price multiplied by its
          on-hand stock. Manage products on the Products page.
        </p>
      </header>

      {isLoading && !productCost ? (
        <div className="rounded-xl border border-brand-border bg-brand-light-bg p-6 text-center text-sm text-brand-text-muted">
          <span className="inline-flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Calculating product cost...
          </span>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-brand-border bg-brand-light-bg p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              Total product cost
            </p>
            <p className="mt-1 text-lg font-extrabold text-brand-black">
              {formatCurrency(productCost?.totalProductCost ?? 0, currency)}
            </p>
          </div>
          <div className="rounded-xl border border-brand-border bg-brand-light-bg p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              Catalog products
            </p>
            <p className="mt-1 text-lg font-extrabold text-brand-black">
              {(productCost?.productCount ?? 0).toLocaleString()}
            </p>
          </div>
          <div className="rounded-xl border border-brand-border bg-brand-light-bg p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              Total units
            </p>
            <p className="mt-1 text-lg font-extrabold text-brand-black">
              {(productCost?.totalUnits ?? 0).toLocaleString()}
            </p>
          </div>
        </div>
      )}

      <p className="mt-4 flex items-start gap-2 rounded-xl bg-brand-light-bg p-3 text-[11px] text-gray-600">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-red" />
        Buying price is admin-only and never exposed to customers. This figure
        reflects capital currently tied up in inventory; zero-stock products
        are counted as catalog products but add no inventory cost.
      </p>
    </div>
  );
}
