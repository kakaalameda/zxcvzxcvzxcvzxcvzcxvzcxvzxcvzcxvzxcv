"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { ColumnDef } from "@tanstack/react-table";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { DataTable } from "@/components/admin/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { AdminVoucherRecord } from "@/lib/repositories/admin-vouchers";
import { adminVoucherSchema } from "@/lib/validations/admin";
import { cn } from "@/lib/utils";

function toDatetimeLocalValue(value: string | null | undefined) {
  if (!value) {
    return undefined;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  const offsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

function buildDefaultValues(voucher?: AdminVoucherRecord) {
  return {
    code: voucher?.code ?? "",
    pct: voucher?.pct ?? 10,
    label: voucher?.label ?? "",
    desc: voucher?.desc ?? "",
    active: voucher?.active ?? true,
    maxUses: voucher?.maxUses ?? null,
    usedCount: voucher?.usedCount ?? 0,
    expiresAt: toDatetimeLocalValue(voucher?.expiresAt),
  };
}

function formatDate(value: string | null) {
  if (!value) {
    return "No expiry";
  }

  return new Date(value).toLocaleString("vi-VN");
}

export function VouchersPage({
  initialVouchers,
}: {
  initialVouchers: AdminVoucherRecord[];
}) {
  const [vouchers, setVouchers] = useState(initialVouchers);
  const [editingVoucher, setEditingVoucher] = useState<AdminVoucherRecord | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const form = useForm({
    resolver: zodResolver(adminVoucherSchema),
    defaultValues: buildDefaultValues(),
  });

  const columns = useMemo<ColumnDef<AdminVoucherRecord>[]>(
    () => [
      {
        accessorKey: "code",
        header: "Code",
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-foreground">{row.original.code}</p>
            <p className="text-xs text-muted-foreground">{row.original.label}</p>
          </div>
        ),
      },
      {
        accessorKey: "pct",
        header: "Discount",
        cell: ({ row }) => <span>{row.original.pct}%</span>,
      },
      {
        accessorKey: "usedCount",
        header: "Usage",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.usedCount}
            {typeof row.original.maxUses === "number" ? ` / ${row.original.maxUses}` : ""}
          </span>
        ),
      },
      {
        accessorKey: "expiresAt",
        header: "Expiry",
        cell: ({ row }) => <span className="text-sm">{formatDate(row.original.expiresAt)}</span>,
      },
      {
        accessorKey: "active",
        header: "Status",
        cell: ({ row }) => (
          <span
            className={cn(
              "inline-flex rounded-full px-2 py-1 text-xs font-medium",
              row.original.active
                ? "bg-emerald-500/15 text-emerald-300"
                : "bg-white/5 text-white/60",
            )}
          >
            {row.original.active ? "Active" : "Inactive"}
          </span>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const voucher = row.original;

          return (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  setEditingVoucher(voucher);
                  form.reset(buildDefaultValues(voucher));
                  setError(null);
                  setMessage(null);
                }}
              >
                <Pencil className="size-4" />
                Edit
              </Button>
              <Button
                type="button"
                size="sm"
                variant="destructive"
                onClick={() => {
                  const confirmed = window.confirm(`Delete voucher ${voucher.code}?`);
                  if (!confirmed) {
                    return;
                  }

                  startTransition(async () => {
                    setError(null);
                    setMessage(null);

                    const response = await fetch(`/api/admin/vouchers/${voucher.code}`, {
                      method: "DELETE",
                    });
                    const result = (await response.json().catch(() => null)) as
                      | { error?: string }
                      | null;

                    if (!response.ok) {
                      setError(result?.error ?? "Failed to delete voucher.");
                      return;
                    }

                    setVouchers((current) =>
                      current.filter((entry) => entry.code !== voucher.code),
                    );
                    if (editingVoucher?.code === voucher.code) {
                      setEditingVoucher(null);
                      form.reset(buildDefaultValues());
                    }
                    setMessage("Voucher deleted.");
                  });
                }}
              >
                <Trash2 className="size-4" />
                Delete
              </Button>
            </div>
          );
        },
      },
    ],
    [editingVoucher?.code, form],
  );

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      setError(null);
      setMessage(null);

      const response = await fetch(
        editingVoucher ? `/api/admin/vouchers/${editingVoucher.code}` : "/api/admin/vouchers",
        {
          method: editingVoucher ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(values),
        },
      );
      const result = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;

      if (!response.ok) {
        setError(result?.error ?? "Failed to save voucher.");
        return;
      }

      setMessage(editingVoucher ? "Voucher updated." : "Voucher created.");
      window.location.reload();
    });
  });

  return (
    <div className="min-h-screen bg-[#050505] px-4 py-6 text-white md:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 xl:grid xl:grid-cols-[1.5fr_1fr]">
        <section className="space-y-4">
          <div className="rounded-3xl border border-white/10 bg-black/40 p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-gold-500">
                  Admin
                </p>
                <h1 className="mt-3 font-display text-4xl tracking-wide">Vouchers</h1>
                <p className="mt-2 text-sm text-white/55">
                  Control expiry, usage caps and voucher activity safely.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditingVoucher(null);
                  form.reset(buildDefaultValues());
                  setError(null);
                  setMessage(null);
                }}
              >
                <Plus className="size-4" />
                New voucher
              </Button>
            </div>
          </div>

          <DataTable
            columns={columns}
            data={vouchers}
            emptyMessage="No vouchers found."
          />
        </section>

        <section className="rounded-3xl border border-white/10 bg-black/50 p-6">
          <div className="mb-6">
            <p className="text-xs uppercase tracking-[0.35em] text-gold-500">
              {editingVoucher ? "Edit" : "Create"}
            </p>
            <h2 className="mt-3 font-display text-3xl tracking-wide">
              {editingVoucher ? editingVoucher.code : "Voucher form"}
            </h2>
          </div>

          <form className="space-y-5" onSubmit={onSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="voucher-code">Code</Label>
                <Input id="voucher-code" {...form.register("code")} />
                <p className="text-xs text-red-400">{form.formState.errors.code?.message}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="voucher-pct">Discount %</Label>
                <Input id="voucher-pct" type="number" min={1} max={100} {...form.register("pct")} />
                <p className="text-xs text-red-400">{form.formState.errors.pct?.message}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="voucher-label">Label</Label>
              <Input id="voucher-label" {...form.register("label")} />
              <p className="text-xs text-red-400">{form.formState.errors.label?.message}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="voucher-desc">Description</Label>
              <Textarea id="voucher-desc" rows={4} {...form.register("desc")} />
              <p className="text-xs text-red-400">{form.formState.errors.desc?.message}</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="voucher-max-uses">Max uses</Label>
                <Input
                  id="voucher-max-uses"
                  type="number"
                  min={1}
                  {...form.register("maxUses")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="voucher-used-count">Used count</Label>
                <Input
                  id="voucher-used-count"
                  type="number"
                  min={0}
                  {...form.register("usedCount")}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="voucher-expires-at">Expires at</Label>
              <Input
                id="voucher-expires-at"
                type="datetime-local"
                {...form.register("expiresAt")}
              />
              <p className="text-xs text-red-400">
                {form.formState.errors.expiresAt?.message}
              </p>
            </div>

            <label className="flex items-center gap-3 text-sm text-white/70">
              <input type="checkbox" {...form.register("active")} />
              Voucher is active
            </label>

            {error ? (
              <p className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </p>
            ) : null}

            {message ? (
              <p className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
                {message}
              </p>
            ) : null}

            <div className="flex gap-3">
              <Button
                type="submit"
                className="bg-gold-500 text-black hover:bg-gold-400"
                disabled={isPending}
              >
                {isPending ? "Saving..." : editingVoucher ? "Update voucher" : "Create voucher"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditingVoucher(null);
                  form.reset(buildDefaultValues());
                  setError(null);
                  setMessage(null);
                }}
              >
                Reset
              </Button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
