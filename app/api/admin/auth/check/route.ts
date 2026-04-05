import { NextResponse } from "next/server";
import { getAdminRouteContext } from "@/lib/auth/admin";

export async function GET() {
  const context = await getAdminRouteContext();
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}
