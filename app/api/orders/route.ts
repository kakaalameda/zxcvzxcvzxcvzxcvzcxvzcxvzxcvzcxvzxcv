import { NextResponse } from "next/server";
import { ZodError } from "zod";
import {
  createOrder,
  OrderInputError,
} from "@/lib/repositories/orders";
import { guestOrderSchema } from "@/lib/validations/order";

export async function POST(request: Request) {
  try {
    const payload = guestOrderSchema.parse(await request.json());
    const result = await createOrder(payload);

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid order payload." },
        { status: 400 },
      );
    }

    if (error instanceof OrderInputError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const message =
      error instanceof Error ? error.message : "Unexpected order creation failure.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
