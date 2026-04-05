"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Search } from "lucide-react";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trackOrderLookupSchema, type TrackOrderLookupPayload } from "@/lib/validations/order";
import { cn } from "@/lib/utils";

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
  return `${Math.round(value).toLocaleString("vi-VN")}d`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("vi-VN");
}

function statusClass(status: TrackOrderRecord["status"]) {
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

export function TrackOrderPage() {
  const [orders, setOrders] = useState<TrackOrderRecord[]>([]);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [lookupMessage, setLookupMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const form = useForm<TrackOrderLookupPayload>({
    resolver: zodResolver(trackOrderLookupSchema),
    defaultValues: {
      phone: "",
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      setLookupError(null);
      setLookupMessage(null);

      const response = await fetch("/api/track-orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });
      const result = (await response.json().catch(() => null)) as
        | { error?: string; orders?: TrackOrderRecord[] }
        | null;

      if (!response.ok) {
        setOrders([]);
        setLookupError(result?.error ?? "Lookup failed.");
        return;
      }

      const nextOrders = result?.orders ?? [];
      setOrders(nextOrders);
      setLookupMessage(
        nextOrders.length
          ? `Found ${nextOrders.length} order(s) for this phone number.`
          : "No orders matched this phone number.",
      );
    });
  });

  return (
    <div className="min-h-screen bg-brand-black px-5 py-10 text-white md:px-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <section className="rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(245,168,0,0.10),transparent_35%),rgba(255,255,255,0.02)] p-6 md:p-8">
          <p className="text-xs uppercase tracking-[0.35em] text-gold-500">Track order</p>
          <h1 className="mt-4 font-display text-5xl leading-none tracking-wide">
            LOOK UP YOUR ORDER
          </h1>
          <p className="mt-4 max-w-2xl text-sm text-white/60">
            Enter the phone number used at checkout to see all matching guest orders.
          </p>

          <form className="mt-8 space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label htmlFor="track-phone">Phone number</Label>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Input
                  id="track-phone"
                  placeholder="0901234567"
                  {...form.register("phone")}
                />
                <Button
                  type="submit"
                  className="bg-gold-500 text-black hover:bg-gold-400"
                  disabled={isPending}
                >
                  <Search className="size-4" />
                  {isPending ? "Searching..." : "Search"}
                </Button>
              </div>
              <p className="text-xs text-red-400">{form.formState.errors.phone?.message}</p>
            </div>
          </form>

          {lookupError ? (
            <p className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {lookupError}
            </p>
          ) : null}

          {lookupMessage ? (
            <p className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/70">
              {lookupMessage}
            </p>
          ) : null}
        </section>

        <section className="space-y-4">
          {orders.length ? (
            orders.map((order) => (
              <article
                key={order.id}
                className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-6"
              >
                <div className="flex flex-col gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-gold-500">
                      {order.orderNumber}
                    </p>
                    <p className="mt-2 text-sm text-white/50">{formatDate(order.createdAt)}</p>
                  </div>
                  <div className="flex flex-col items-start gap-2 sm:items-end">
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2 py-1 text-xs font-medium capitalize",
                        statusClass(order.status),
                      )}
                    >
                      {order.status}
                    </span>
                    <p className="font-display text-2xl text-gold-500">
                      {formatPrice(order.total)}
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid gap-5 lg:grid-cols-[1.6fr_0.8fr]">
                  <div className="space-y-3">
                    {order.items.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-2xl border border-white/10 px-4 py-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium">{item.productName}</p>
                            <p className="text-sm text-white/50">{item.variantLabel}</p>
                          </div>
                          <div className="text-right text-sm text-white/60">
                            <p>x{item.qty}</p>
                            <p>{formatPrice(item.lineTotal)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-white/45">
                      Shipment
                    </p>
                    <div className="mt-3 space-y-2 text-sm">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-white/55">Tracking code</span>
                        <span className="text-white/80">
                          {order.trackingCode || "Not assigned"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-white/55">Status</span>
                        <span className="text-white/80 capitalize">{order.status}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <div className="rounded-[2rem] border border-dashed border-white/10 px-6 py-14 text-center text-sm text-white/40">
              Search with your checkout phone number to load order history.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
