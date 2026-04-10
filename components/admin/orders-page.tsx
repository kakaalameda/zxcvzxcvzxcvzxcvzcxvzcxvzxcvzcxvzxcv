"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { PackageCheck, XCircle } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { DataTable } from "@/components/admin/data-table";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AdminOrderRecord } from "@/lib/repositories/admin-orders";

const STATUS_OPTIONS = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "shipped", label: "Shipped" },
  { value: "cancelled", label: "Cancelled" },
] as const;

type StatusFilter = (typeof STATUS_OPTIONS)[number]["value"];

function formatPrice(value: number) {
  return `${Math.round(value).toLocaleString("vi-VN")}d`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("vi-VN");
}

function statusClass(status: AdminOrderRecord["status"]) {
  switch (status) {
    case "pending":
      return "bg-amber-500/15 text-amber-300";
    case "confirmed":
      return "bg-sky-500/15 text-sky-300";
    case "shipped":
      return "bg-emerald-500/15 text-emerald-300";
    case "cancelled":
      return "bg-red-500/15 text-red-300";
    default:
      return "bg-white/5 text-white/60";
  }
}

interface OrderActionResponse {
  error?: string;
  message?: string;
  status?: AdminOrderRecord["status"];
  trackingCode?: string | null;
}

export function OrdersPage({
  initialOrders,
}: {
  initialOrders: AdminOrderRecord[];
}) {
  const [orders, setOrders] = useState(initialOrders);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(
    initialOrders[0]?.id ?? null,
  );
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filteredOrders = useMemo(
    () =>
      orders.filter((order) => {
        if (statusFilter === "all") {
          return true;
        }

        return order.status === statusFilter;
      }),
    [orders, statusFilter],
  );

  const selectedOrder =
    orders.find((order) => order.id === selectedOrderId) ?? filteredOrders[0] ?? null;

  const columns = useMemo<ColumnDef<AdminOrderRecord>[]>(
    () => [
      {
        accessorKey: "orderNumber",
        header: "Order",
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-foreground">{row.original.orderNumber}</p>
            <p className="text-xs text-muted-foreground">
              {formatDate(row.original.createdAt)}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "customerName",
        header: "Customer",
        cell: ({ row }) => (
          <div>
            <p>{row.original.customerName}</p>
            <p className="text-xs text-muted-foreground">{row.original.customerPhone}</p>
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <span
            className={cn(
              "inline-flex rounded-full px-2 py-1 text-xs font-medium capitalize",
              statusClass(row.original.status),
            )}
          >
            {row.original.status}
          </span>
        ),
      },
      {
        accessorKey: "total",
        header: "Total",
        cell: ({ row }) => <span>{formatPrice(row.original.total)}</span>,
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              setSelectedOrderId(row.original.id);
              setError(null);
              setMessage(null);
            }}
          >
            View
          </Button>
        ),
      },
    ],
    [],
  );

  const updateOrderState = (
    orderId: string,
    nextStatus: AdminOrderRecord["status"],
    nextTrackingCode: string | null | undefined,
  ) => {
    setOrders((current) =>
      current.map((order) =>
        order.id === orderId
          ? {
              ...order,
              status: nextStatus,
              trackingCode:
                typeof nextTrackingCode === "undefined"
                  ? order.trackingCode
                  : nextTrackingCode,
            }
          : order,
      ),
    );
  };

  const runOrderAction = (
    path: string,
    onSuccess: (result: OrderActionResponse) => void,
    fallbackError: string,
  ) => {
    startTransition(async () => {
      setError(null);
      setMessage(null);

      const response = await fetch(path, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      const result = (await response.json().catch(() => null)) as
        | OrderActionResponse
        | null;

      if (!response.ok) {
        setError(result?.error ?? fallbackError);
        return;
      }

      onSuccess(result ?? {});
      setMessage(result?.message ?? "Order updated.");
    });
  };

  const approveOrder = () => {
    if (!selectedOrder || selectedOrder.status !== "pending") {
      return;
    }

    runOrderAction(
      `/api/admin/orders/${selectedOrder.id}/approve`,
      (result) => {
        updateOrderState(
          selectedOrder.id,
          result.status ?? "confirmed",
          result.trackingCode,
        );
      },
      "Failed to approve order.",
    );
  };

  const cancelOrder = () => {
    if (!selectedOrder || !["pending", "confirmed"].includes(selectedOrder.status)) {
      return;
    }

    const confirmed = window.confirm(
      selectedOrder.status === "confirmed"
        ? "Cancel this order on both GHTK and the local system?"
        : "Cancel this pending order?",
    );

    if (!confirmed) {
      return;
    }

    runOrderAction(
      `/api/admin/orders/${selectedOrder.id}/cancel`,
      (result) => {
        updateOrderState(
          selectedOrder.id,
          result.status ?? "cancelled",
          result.trackingCode,
        );
      },
      "Failed to cancel order.",
    );
  };

  const canApprove = selectedOrder?.status === "pending";
  const canCancel =
    selectedOrder?.status === "pending" || selectedOrder?.status === "confirmed";

  return (
    <div className="min-h-screen bg-[#050505] px-4 py-6 text-white md:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 xl:grid xl:grid-cols-[1.6fr_1fr]">
        <section className="space-y-4">
          <div className="rounded-3xl border border-white/10 bg-black/40 p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-gold-500">
                  Admin
                </p>
                <h1 className="mt-3 font-display text-4xl tracking-wide">Orders</h1>
                <p className="mt-2 text-sm text-white/55">
                  Review orders, create GHTK shipments, and cancel safely.
                </p>
              </div>
              <div className="space-y-2">
                <LabelLine>Filter by status</LabelLine>
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
                  className="flex h-8 rounded-lg border border-input bg-transparent px-3 text-sm"
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value} className="bg-black text-white">
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <DataTable
            columns={columns}
            data={filteredOrders}
            emptyMessage="No orders matched this filter."
          />
        </section>

        <section className="rounded-3xl border border-white/10 bg-black/50 p-6">
          {selectedOrder ? (
            <div className="space-y-6">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-gold-500">
                  Order detail
                </p>
                <h2 className="mt-3 font-display text-3xl tracking-wide">
                  {selectedOrder.orderNumber}
                </h2>
                <div className="mt-3 flex items-center gap-3">
                  <span
                    className={cn(
                      "inline-flex rounded-full px-2 py-1 text-xs font-medium capitalize",
                      statusClass(selectedOrder.status),
                    )}
                  >
                    {selectedOrder.status}
                  </span>
                  <span className="text-sm text-white/45">
                    {formatDate(selectedOrder.createdAt)}
                  </span>
                </div>
              </div>

              <CardBlock title="Customer">
                <p>{selectedOrder.customerName}</p>
                <p className="text-white/60">{selectedOrder.customerPhone}</p>
                {selectedOrder.customerEmail ? (
                  <p className="text-white/60">{selectedOrder.customerEmail}</p>
                ) : null}
                <p className="text-sm text-white/70">
                  {[
                    selectedOrder.address,
                    selectedOrder.ward,
                    selectedOrder.district,
                    selectedOrder.province,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </p>
                {selectedOrder.note ? (
                  <p className="text-sm text-white/45">Note: {selectedOrder.note}</p>
                ) : null}
              </CardBlock>

              <CardBlock title="Items">
                <div className="space-y-3">
                  {selectedOrder.items.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-white/10 px-3 py-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium">{item.product_name}</p>
                          <p className="text-sm text-white/55">{item.variant_label}</p>
                        </div>
                        <div className="text-right text-sm text-white/60">
                          <p>x{item.qty}</p>
                          <p>{formatPrice(item.line_total)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardBlock>

              <CardBlock title="Summary">
                <div className="space-y-2 text-sm">
                  <SummaryRow label="Payment" value={selectedOrder.paymentMethod.toUpperCase()} />
                  <SummaryRow label="Subtotal" value={formatPrice(selectedOrder.subtotal)} />
                  <SummaryRow
                    label="Discount"
                    value={`-${formatPrice(selectedOrder.discountAmount)}`}
                  />
                  <SummaryRow label="Shipping" value={formatPrice(selectedOrder.shippingFee)} />
                  <SummaryRow label="Total" value={formatPrice(selectedOrder.total)} strong />
                  {selectedOrder.voucherCode ? (
                    <SummaryRow label="Voucher" value={selectedOrder.voucherCode} />
                  ) : null}
                </div>
              </CardBlock>

              <CardBlock title="Shipping">
                <div className="space-y-3">
                  <SummaryRow
                    label="Tracking"
                    value={selectedOrder.trackingCode ?? "Not created yet"}
                  />
                  <p className="text-xs text-white/45">
                    Approve creates a shipment on GHTK using the config from
                    /admin/cauhinhapi.
                  </p>
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      className="flex-1 bg-gold-500 text-black hover:bg-gold-400"
                      disabled={!canApprove || isPending}
                      onClick={approveOrder}
                    >
                      <PackageCheck className="size-4" />
                      {isPending ? "Processing..." : "Approve order"}
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      className="flex-1"
                      disabled={!canCancel || isPending}
                      onClick={cancelOrder}
                    >
                      <XCircle className="size-4" />
                      {isPending ? "Processing..." : "Cancel order"}
                    </Button>
                  </div>
                </div>
              </CardBlock>

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
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-white/10 px-5 py-12 text-center text-sm text-white/45">
              Select an order to inspect details.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function LabelLine({ children }: { children: React.ReactNode }) {
  return <p className="text-xs uppercase tracking-[0.2em] text-white/45">{children}</p>;
}

function CardBlock({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-4">
      <LabelLine>{title}</LabelLine>
      <div className="mt-3 space-y-2">{children}</div>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-white/55">{label}</span>
      <span className={strong ? "font-medium text-white" : "text-white/80"}>{value}</span>
    </div>
  );
}
