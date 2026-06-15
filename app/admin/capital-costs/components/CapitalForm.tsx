"use client";

import { Loader2, Plus, RotateCcw, Wallet } from "lucide-react";

import type { CapitalFormState } from "@/features/admin-capital-costs/api";
import Field from "@/app/admin/components/Field";

export default function CapitalForm({
  form,
  setForm,
  currency,
  hasCapital,
  isLoading,
  isSaving,
  error,
  note,
  onRefresh,
  onSubmit,
}: {
  form: CapitalFormState;
  setForm: React.Dispatch<React.SetStateAction<CapitalFormState>>;
  currency: string;
  hasCapital: boolean;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  note: string | null;
  onRefresh: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <div className="rounded-2xl border border-brand-border bg-brand-white p-5 shadow-sm">
      <header className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-base font-bold text-gray-900">
            <Wallet className="h-4 w-4 text-brand-red" />
            Add business capital
          </h2>
          <p className="mt-1 text-xs text-gray-500">
            Each entry is added to your running total capital. Contributions
            are kept as a history and are never overwritten.
          </p>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex h-9 items-center gap-2 rounded-xl border border-brand-border px-3 text-xs font-semibold text-foreground transition hover:bg-brand-light-bg"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Refresh
        </button>
      </header>

      {error && (
        <div className="mb-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {note && (
        <div className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          {note}
        </div>
      )}

      {isLoading && !hasCapital ? (
        <div className="rounded-xl border border-brand-border bg-brand-light-bg p-6 text-center text-sm text-brand-text-muted">
          <span className="inline-flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading capital...
          </span>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <Field
              label={`Amount to add (${currency})`}
              hint="Must be greater than zero."
              required
            >
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.amount}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, amount: e.target.value }))
                }
                className="h-10 w-full rounded-xl border border-brand-border px-3 text-sm outline-none transition focus:border-brand-red"
                placeholder="100000"
              />
            </Field>

            <Field label="Note" hint="Optional, e.g. funding source.">
              <input
                type="text"
                value={form.note}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, note: e.target.value }))
                }
                className="h-10 w-full rounded-xl border border-brand-border px-3 text-sm outline-none transition focus:border-brand-red"
                placeholder="Initial investment"
              />
            </Field>
          </div>

          <div className="flex items-center justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand-red px-4 text-sm font-semibold text-white transition hover:bg-brand-red-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Add capital
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
