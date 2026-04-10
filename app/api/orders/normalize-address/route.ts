import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import {
  applyCheckoutAddressRateLimit,
  getRequestIp,
} from "@/lib/rate-limit";
import {
  CheckoutAddressInputError,
  CheckoutAddressServiceError,
  normalizeCheckoutAddress,
} from "@/lib/repositories/checkout-address";

export async function POST(request: NextRequest) {
  const clientIp = getRequestIp(request.headers);
  const rateLimit = await applyCheckoutAddressRateLimit(
    `checkout-address:${clientIp}`,
  );

  if (rateLimit && !rateLimit.success) {
    return NextResponse.json(
      {
        error: "Ban kiem tra dia chi qua nhanh. Vui long thu lai sau it phut.",
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
    const result = await normalizeCheckoutAddress(await request.json());

    return NextResponse.json(result, {
      headers: rateLimit
        ? {
            "X-RateLimit-Limit": String(rateLimit.limit),
            "X-RateLimit-Remaining": String(rateLimit.remaining),
            "X-RateLimit-Reset": String(Math.floor(rateLimit.resetAt / 1000)),
          }
        : undefined,
    });
  } catch (error) {
    if (error instanceof ZodError || error instanceof CheckoutAddressInputError) {
      const message =
        error instanceof ZodError
          ? error.issues[0]?.message ?? "Du lieu dia chi khong hop le."
          : error.message;

      return NextResponse.json({ error: message }, { status: 400 });
    }

    if (error instanceof CheckoutAddressServiceError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }

    const message =
      error instanceof Error
        ? error.message
        : "Co loi khong mong doi khi chuan hoa dia chi.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
