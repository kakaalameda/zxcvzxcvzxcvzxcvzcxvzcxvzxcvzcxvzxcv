import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
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
    revalidateTag("store:products", "max");
    return NextResponse.json({ productId }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      console.error("[Admin Products API][POST][Payload]:", error);
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Payload san pham khong hop le." },
        { status: 400 },
      );
    }

    console.error("[Admin Products API][POST]:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Khong the tao san pham." },
      { status: 500 },
    );
  }
}
