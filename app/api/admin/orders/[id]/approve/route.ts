import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getAdminRouteContext } from "@/lib/auth/admin";
import { confirmAdminOrder } from "@/lib/repositories/admin-orders";
import { adminOrderApprovalSchema } from "@/lib/validations/admin";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const context = await getAdminRouteContext();
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = adminOrderApprovalSchema.parse(await request.json());
    const { id } = await params;
    await confirmAdminOrder(context.supabase, id, payload.trackingCode);

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid approval payload." },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to confirm order." },
      { status: 500 },
    );
  }
}
