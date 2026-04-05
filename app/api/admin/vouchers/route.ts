import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getAdminRouteContext } from "@/lib/auth/admin";
import { upsertAdminVoucher } from "@/lib/repositories/admin-vouchers";
import { adminVoucherSchema } from "@/lib/validations/admin";

export async function POST(request: Request) {
  const context = await getAdminRouteContext();
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = adminVoucherSchema.parse(await request.json());
    const code = await upsertAdminVoucher(context.supabase, payload);
    return NextResponse.json({ code }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid voucher payload." },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create voucher." },
      { status: 500 },
    );
  }
}
