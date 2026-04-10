import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { ZodError } from "zod";
import { getAdminRouteContext } from "@/lib/auth/admin";
import {
  deleteAdminProduct,
  upsertAdminProduct,
} from "@/lib/repositories/admin-products";
import { adminProductSchema } from "@/lib/validations/admin";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const context = await getAdminRouteContext();
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = adminProductSchema.parse(await request.json());
    const { id } = await params;
    const productId = await upsertAdminProduct(
      context.supabase,
      payload,
      Number(id),
    );
    revalidateTag("store:products", "max");

    return NextResponse.json({ productId });
  } catch (error) {
    if (error instanceof ZodError) {
      console.error("[Admin Products API][PATCH][Payload]:", error);
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Payload san pham khong hop le." },
        { status: 400 },
      );
    }

    console.error("[Admin Products API][PATCH]:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Khong the cap nhat san pham." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const context = await getAdminRouteContext();
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    await deleteAdminProduct(context.supabase, Number(id));
    revalidateTag("store:products", "max");
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[Admin Products API][DELETE]:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Khong the xoa san pham." },
      { status: 500 },
    );
  }
}
