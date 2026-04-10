import { NextResponse } from "next/server";
import { getAdminRouteContext } from "@/lib/auth/admin";
import { cancelAdminOrder } from "@/lib/repositories/admin-orders";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const context = await getAdminRouteContext();
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const result = await cancelAdminOrder(context.supabase, id);

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to cancel order." },
      { status: 500 },
    );
  }
}
