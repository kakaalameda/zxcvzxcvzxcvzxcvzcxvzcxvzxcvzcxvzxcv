import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { getAdminRouteContext } from "@/lib/auth/admin";
import {
  deleteAdminLookbookSection,
  upsertAdminLookbookSection,
} from "@/lib/repositories/admin-lookbook";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const context = await getAdminRouteContext();
  if (!context) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const payload = await request.json();
    await upsertAdminLookbookSection(
      context.supabase,
      {
        eyebrow: payload.eyebrow ?? "",
        title: payload.title ?? "",
        text: payload.text ?? "",
        productId: payload.productId ?? null,
        sortOrder: payload.sortOrder ?? 0,
        active: payload.active ?? true,
      },
      Number(id),
    );
    revalidateTag("lookbook", "max");
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Không thể cập nhật section." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const context = await getAdminRouteContext();
  if (!context) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    await deleteAdminLookbookSection(context.supabase, Number(id));
    revalidateTag("lookbook", "max");
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Không thể xoá section." },
      { status: 500 },
    );
  }
}
