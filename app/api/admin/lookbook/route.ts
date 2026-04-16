import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { getAdminRouteContext } from "@/lib/auth/admin";
import { upsertAdminLookbookSection } from "@/lib/repositories/admin-lookbook";

export async function POST(request: Request) {
  const context = await getAdminRouteContext();
  if (!context) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const payload = await request.json();
    const id = await upsertAdminLookbookSection(context.supabase, {
      eyebrow: payload.eyebrow ?? "",
      title: payload.title ?? "",
      text: payload.text ?? "",
      productId: payload.productId ?? null,
      sortOrder: payload.sortOrder ?? 0,
      active: payload.active ?? true,
    });
    revalidateTag("lookbook", "max");
    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Không thể tạo section." },
      { status: 500 },
    );
  }
}
