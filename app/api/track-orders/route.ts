import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import {
  applyTrackOrderRateLimit,
  getRequestIp,
} from "@/lib/rate-limit";
import { findTrackOrder } from "@/lib/repositories/admin-orders";
import { trackOrderLookupSchema } from "@/lib/validations/order";

export async function POST(request: NextRequest) {
  const clientIp = getRequestIp(request.headers);
  const rateLimit = await applyTrackOrderRateLimit(`track-orders:${clientIp}`);

  if (rateLimit && !rateLimit.success) {
    return NextResponse.json(
      {
        error: "Too many tracking attempts. Please try again in a few minutes.",
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimit.retryAfterSeconds),
          "X-RateLimit-Limit": String(rateLimit.limit),
          "X-RateLimit-Remaining": String(rateLimit.remaining),
          "X-RateLimit-Reset": String(Math.floor(rateLimit.resetAt / 1000)),
        },
      },
    );
  }

  try {
    const payload = trackOrderLookupSchema.parse(await request.json());
    const order = await findTrackOrder(payload.phone, payload.orderNumber);

    return NextResponse.json(
      {
        orders: order
          ? [
              {
                id: order.id,
                orderNumber: order.orderNumber,
                status: order.status,
                total: order.total,
                trackingCode: order.trackingCode,
                createdAt: order.createdAt,
                items: order.items.map((item) => ({
                  id: item.id,
                  productName: item.product_name,
                  variantLabel: item.variant_label,
                  qty: item.qty,
                  lineTotal: item.line_total,
                })),
              },
            ]
          : [],
      },
      {
        headers: rateLimit
          ? {
              "X-RateLimit-Limit": String(rateLimit.limit),
              "X-RateLimit-Remaining": String(rateLimit.remaining),
              "X-RateLimit-Reset": String(Math.floor(rateLimit.resetAt / 1000)),
            }
          : undefined,
      },
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid lookup payload." },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to lookup orders.",
      },
      { status: 500 },
    );
  }
}
