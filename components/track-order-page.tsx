"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { PackageSearch, Search } from "lucide-react";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import {
  trackOrderLookupSchema,
  type TrackOrderLookupPayload,
} from "@/lib/validations/order";

interface TrackOrderItem {
  id: string;
  productName: string;
  variantLabel: string;
  qty: number;
  lineTotal: number;
}

interface TrackOrderRecord {
  id: string;
  orderNumber: string;
  status: "pending" | "confirmed" | "shipped" | "cancelled";
  total: number;
  trackingCode: string | null;
  createdAt: string;
  items: TrackOrderItem[];
}

function formatPrice(value: number) {
  return `${Math.round(value).toLocaleString("vi-VN")}đ`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("vi-VN");
}

const STATUS_MAP: Record<
  TrackOrderRecord["status"],
  { label: string; className: string }
> = {
  pending: {
    label: "Chờ xác nhận",
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
  confirmed: {
    label: "Đã xác nhận",
    className: "bg-store-blue-soft text-store-blue border-[#cfd8ff]",
  },
  shipped: {
    label: "Đang giao",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  cancelled: {
    label: "Đã hủy",
    className: "bg-rose-50 text-rose-700 border-rose-200",
  },
};

export function TrackOrderPage() {
  const [orders, setOrders] = useState<TrackOrderRecord[]>([]);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [lookupMessage, setLookupMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<TrackOrderLookupPayload>({
    resolver: zodResolver(trackOrderLookupSchema),
    defaultValues: { orderNumber: "", phone: "" },
  });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      setLookupError(null);
      setLookupMessage(null);
      const response = await fetch("/api/track-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const result = (await response.json().catch(() => null)) as
        | { error?: string; orders?: TrackOrderRecord[] }
        | null;

      if (!response.ok) {
        setOrders([]);
        setLookupError(result?.error ?? "Không thể tra cứu đơn lúc này.");
        return;
      }

      const nextOrders = result?.orders ?? [];
      setOrders(nextOrders);
      setLookupMessage(
        nextOrders.length
          ? `Tìm thấy ${nextOrders.length} đơn hàng.`
          : "Không tìm thấy đơn hàng với thông tin này.",
      );
    });
  });

  return (
    <div className="min-h-screen bg-[var(--background)] text-[#111111]">
      <section className="border-b border-[var(--border)] bg-white">
        <div className="mx-auto max-w-[1080px] px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
          <p className="font-heading size-label font-semibold uppercase tracking-[0.28em] text-store-blue">
            Tra cứu đơn hàng
          </p>
          <h1 className="mt-4 max-w-[14ch] font-heading type-vn-display size-display-sm font-semibold uppercase text-[#111111] sm:max-w-[15ch] sm:size-display-md">
            Kiểm tra trạng thái đơn nhanh bằng mã đơn và số điện thoại.
          </h1>
          <p className="mt-5 max-w-[620px] size-copy-md text-store-muted">
            Nhập đúng thông tin đã dùng khi đặt hàng để xem trạng thái, tổng tiền
            và mã vận chuyển hiện tại trong một màn hình gọn hơn.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[1080px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-[32px] border border-[var(--border)] bg-white p-5 sm:p-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="font-heading size-kicker-xs font-semibold uppercase tracking-[0.22em] text-store-blue">
                Thông tin tra cứu
              </p>
              <h2 className="mt-2 max-w-[16ch] font-heading type-vn-title size-title-md font-semibold uppercase text-[#111111] sm:max-w-[18ch]">
                Nhập mã đơn và số điện thoại
              </h2>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-store-blue-soft px-4 py-2 text-sm text-store-blue">
              <PackageSearch className="h-4 w-4" />
              Cập nhật theo trạng thái đơn mới nhất
            </div>
          </div>

          <form className="mt-6 grid gap-4 lg:grid-cols-[1fr_1fr_auto]" onSubmit={onSubmit}>
            <div>
              <label
                htmlFor="track-order-number"
                className="mb-1.5 block font-heading size-kicker-xs font-semibold uppercase tracking-[0.18em] text-store-muted"
              >
                Mã đơn hàng
              </label>
              <input
                id="track-order-number"
                placeholder="NH260407123456"
                {...form.register("orderNumber")}
                className="w-full rounded-[22px] border border-[var(--border)] bg-white px-4 py-3.5 size-copy text-[#111111] outline-none transition-colors placeholder:text-store-muted/70 focus:border-store-blue"
              />
              {form.formState.errors.orderNumber?.message ? (
                <p className="mt-1.5 text-sm text-red-500">
                  {form.formState.errors.orderNumber.message}
                </p>
              ) : null}
            </div>

            <div>
              <label
                htmlFor="track-phone"
                className="mb-1.5 block font-heading size-kicker-xs font-semibold uppercase tracking-[0.18em] text-store-muted"
              >
                Số điện thoại
              </label>
              <input
                id="track-phone"
                placeholder="0901234567"
                {...form.register("phone")}
                className="w-full rounded-[22px] border border-[var(--border)] bg-white px-4 py-3.5 size-copy text-[#111111] outline-none transition-colors placeholder:text-store-muted/70 focus:border-store-blue"
              />
              {form.formState.errors.phone?.message ? (
                <p className="mt-1.5 text-sm text-red-500">
                  {form.formState.errors.phone.message}
                </p>
              ) : null}
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="inline-flex h-[54px] items-center justify-center gap-2 rounded-full bg-[#111111] px-6 font-heading size-label font-semibold uppercase tracking-[0.18em] text-white transition-colors hover:bg-store-blue disabled:bg-store-blue-soft disabled:text-store-blue"
            >
              <Search className="h-4 w-4" />
              {isPending ? "Đang tìm..." : "Tra cứu"}
            </button>
          </form>

          {lookupError ? (
            <p className="mt-4 rounded-[22px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {lookupError}
            </p>
          ) : null}

          {lookupMessage ? (
            <p className="mt-4 rounded-[22px] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-store-muted">
              {lookupMessage}
            </p>
          ) : null}
        </div>

        <div className="mt-6 space-y-4">
          {orders.map((order) => {
            const statusInfo = STATUS_MAP[order.status] ?? STATUS_MAP.pending;
            return (
              <article
                key={order.id}
                className="rounded-[32px] border border-[var(--border)] bg-white p-5 sm:p-6"
              >
                <div className="flex flex-col gap-4 border-b border-[var(--border)] pb-5 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-heading size-kicker-xs font-semibold uppercase tracking-[0.18em] text-store-blue">
                      {order.orderNumber}
                    </p>
                    <p className="mt-2 text-sm text-store-muted">{formatDate(order.createdAt)}</p>
                  </div>

                  <div className="flex flex-col items-start gap-2 sm:items-end">
                    <span
                      className={[
                        "rounded-full border px-4 py-2 font-heading size-kicker-xs font-semibold uppercase tracking-[0.16em]",
                        statusInfo.className,
                      ].join(" ")}
                    >
                      {statusInfo.label}
                    </span>
                    <p className="font-heading size-title-md font-semibold text-[#111111]">
                      {formatPrice(order.total)}
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
                  <div className="space-y-3">
                    {order.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-start justify-between gap-3 rounded-[24px] border border-[var(--border)] bg-[var(--surface)] px-4 py-4"
                      >
                        <div>
                          <p className="font-heading size-action font-semibold uppercase tracking-[0.08em] text-[#111111]">
                            {item.productName}
                          </p>
                          <p className="mt-1 text-sm text-store-muted">{item.variantLabel}</p>
                        </div>
                        <div className="text-right text-sm text-store-muted">
                          <p>x{item.qty}</p>
                          <p className="mt-1 font-semibold text-[#111111]">
                            {formatPrice(item.lineTotal)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-[28px] border border-[var(--border)] bg-white p-5">
                    <p className="font-heading size-kicker-xs font-semibold uppercase tracking-[0.18em] text-store-blue">
                      Thông tin vận chuyển
                    </p>
                    <div className="mt-4 space-y-4 text-sm">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-store-muted">Mã vận chuyển</span>
                        <span className="font-semibold text-[#111111]">
                          {order.trackingCode || "Chưa có"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-store-muted">Trạng thái</span>
                        <span className="font-semibold text-[#111111]">{statusInfo.label}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {orders.length === 0 && !lookupError && !lookupMessage ? (
          <div className="mt-6 rounded-[32px] border border-dashed border-[var(--border)] bg-white px-6 py-16 text-center">
            <p className="mx-auto max-w-[14ch] font-heading type-vn-title size-title-sm font-semibold uppercase text-[#111111]">
              Nhập thông tin để bắt đầu tra cứu
            </p>
          </div>
        ) : null}
      </section>
    </div>
  );
}
