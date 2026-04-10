import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { ZodError } from "zod";
import { getAdminRouteContext } from "@/lib/auth/admin";
import {
  deleteAdminVoucher,
  upsertAdminVoucher,
} from "@/lib/repositories/admin-vouchers";
import { adminVoucherSchema } from "@/lib/validations/admin";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const context = await getAdminRouteContext();
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = adminVoucherSchema.parse(await request.json());
    const { code } = await params;
    const nextCode = await upsertAdminVoucher(context.supabase, payload, code);
    revalidateTag("store:vouchers", "max");
    return NextResponse.json({ code: nextCode });
  } catch (error) {
    if (error instanceof ZodError) {
      console.error("[Admin Vouchers API][PATCH][Payload]:", error);
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Payload voucher khong hop le." },
        { status: 400 },
      );
    }

    console.error("[Admin Vouchers API][PATCH]:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Khong the cap nhat voucher." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const context = await getAdminRouteContext();
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { code } = await params;
    await deleteAdminVoucher(context.supabase, code);
    revalidateTag("store:vouchers", "max");
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[Admin Vouchers API][DELETE]:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Khong the xoa voucher." },
      { status: 500 },
    );
  }
}
