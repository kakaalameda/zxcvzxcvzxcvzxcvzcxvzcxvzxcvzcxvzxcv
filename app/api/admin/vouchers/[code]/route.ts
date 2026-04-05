import { NextResponse } from "next/server";
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
    return NextResponse.json({ code: nextCode });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid voucher payload." },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update voucher." },
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
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete voucher." },
      { status: 500 },
    );
  }
}
