import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getAdminRouteContext } from "@/lib/auth/admin";
import { upsertAdminProduct } from "@/lib/repositories/admin-products";
import { adminProductSchema } from "@/lib/validations/admin";

export async function POST(request: Request) {
  const context = await getAdminRouteContext();
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = adminProductSchema.parse(await request.json());
    const productId = await upsertAdminProduct(context.supabase, payload);
    return NextResponse.json({ productId }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid product payload." },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create product." },
      { status: 500 },
    );
  }
}
