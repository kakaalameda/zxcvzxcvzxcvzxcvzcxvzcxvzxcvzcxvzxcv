import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { findOrdersByPhone } from "@/lib/repositories/admin-orders";
import { trackOrderLookupSchema } from "@/lib/validations/order";

export async function POST(request: Request) {
  try {
    const payload = trackOrderLookupSchema.parse(await request.json());
    const orders = await findOrdersByPhone(payload.phone);

    return NextResponse.json({
      orders: orders.map((order) => ({
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
      })),
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid lookup payload." },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to lookup orders." },
      { status: 500 },
    );
  }
}
