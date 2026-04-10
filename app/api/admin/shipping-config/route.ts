import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getAdminRouteContext } from "@/lib/auth/admin";
import { upsertAdminShippingConfig } from "@/lib/repositories/admin-shipping-config";
import { adminShippingConfigSchema } from "@/lib/validations/admin";

export async function POST(request: Request) {
  const context = await getAdminRouteContext();
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = adminShippingConfigSchema.parse(await request.json());
    await upsertAdminShippingConfig(context.supabase, payload);

    return NextResponse.json({
      ok: true,
      message: "GHTK config saved.",
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid shipping config payload." },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to save shipping config.",
      },
      { status: 500 },
    );
  }
}
