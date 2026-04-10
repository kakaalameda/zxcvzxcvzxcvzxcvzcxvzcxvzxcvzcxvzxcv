import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
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
    revalidateTag("store:vouchers", "max");
    return NextResponse.json({ code }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      console.error("[Admin Vouchers API][POST][Payload]:", error);
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Payload voucher khong hop le." },
        { status: 400 },
      );
    }

    console.error("[Admin Vouchers API][POST]:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Khong the tao voucher." },
      { status: 500 },
    );
  }
}
