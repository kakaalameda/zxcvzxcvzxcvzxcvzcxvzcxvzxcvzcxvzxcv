import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { ZodError } from "zod";
import { applyOrderRateLimit, getRequestIp } from "@/lib/rate-limit";
import {
  createOrder,
  OrderInputError,
} from "@/lib/repositories/orders";
import {
  CheckoutAddressInputError,
  CheckoutAddressServiceError,
  normalizeCheckoutAddress,
} from "@/lib/repositories/checkout-address";
import { guestOrderSchema } from "@/lib/validations/order";

export async function POST(request: NextRequest) {
  const clientIp = getRequestIp(request.headers);
  const rateLimit = await applyOrderRateLimit(`orders:${clientIp}`);

  if (rateLimit && !rateLimit.success) {
    console.error("[Loi Rate Limit][Don Hang]:", {
      clientIp,
      limit: rateLimit.limit,
      resetAt: new Date(rateLimit.resetAt).toISOString(),
    });

    return NextResponse.json(
      {
        error: "Ban gui don qua nhanh. Vui long thu lai sau it phut.",
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
    const payload = guestOrderSchema.parse(await request.json());
    const normalizedAddress = await normalizeCheckoutAddress({
      customer: {
        province: payload.customer.province,
        district: payload.customer.district,
        ward: payload.customer.ward,
        address: payload.customer.address,
      },
      itemCount: payload.items.reduce((sum, item) => sum + item.qty, 0),
      value: payload.items.reduce(
        (sum, item) => sum + (item.price ?? 0) * item.qty,
        0,
      ),
    });

    const result = await createOrder({
      ...payload,
      customer: {
        ...payload.customer,
        province: normalizedAddress.province,
        district: normalizedAddress.district,
        ward: normalizedAddress.ward,
        address: normalizedAddress.address,
      },
    });
    revalidateTag("store:products", "max");

    return NextResponse.json(result, {
      status: 201,
      headers: rateLimit
        ? {
            "X-RateLimit-Limit": String(rateLimit.limit),
            "X-RateLimit-Remaining": String(rateLimit.remaining),
            "X-RateLimit-Reset": String(Math.floor(rateLimit.resetAt / 1000)),
          }
        : undefined,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      console.error("[Loi API Don Hang][Payload]:", error);

      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Du lieu don hang khong hop le." },
        { status: 400 },
      );
    }

    if (error instanceof OrderInputError) {
      console.error("[Loi API Don Hang][Input]:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (error instanceof CheckoutAddressInputError) {
      console.error("[Loi API Don Hang][Dia Chi]:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (error instanceof CheckoutAddressServiceError) {
      console.error("[Loi API Don Hang][GHTK]:", error);
      return NextResponse.json({ error: error.message }, { status: 503 });
    }

    const message =
      error instanceof Error ? error.message : "Co loi khong mong doi khi tao don hang.";

    console.error("[Loi API Don Hang][He Thong]:", error);

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
