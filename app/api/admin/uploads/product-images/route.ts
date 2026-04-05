import { NextResponse } from "next/server";
import { getAdminRouteContext } from "@/lib/auth/admin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

function sanitizeFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9.\-_]/g, "-").toLowerCase();
}

export async function POST(request: Request) {
  const context = await getAdminRouteContext();
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase admin client is not configured." },
      { status: 500 },
    );
  }

  try {
    const formData = await request.formData();
    const files = formData
      .getAll("files")
      .filter((entry): entry is File => entry instanceof File);

    if (!files.length) {
      return NextResponse.json({ error: "No files uploaded." }, { status: 400 });
    }

    const imageUrls: string[] = [];

    for (const file of files) {
      const storagePath = `admin/${Date.now()}-${sanitizeFilename(file.name)}`;
      const { error } = await supabase.storage
        .from("product-images")
        .upload(storagePath, await file.arrayBuffer(), {
          contentType: file.type || "application/octet-stream",
          upsert: false,
        });

      if (error) {
        throw new Error(error.message);
      }

      const { data } = supabase.storage
        .from("product-images")
        .getPublicUrl(storagePath);

      imageUrls.push(data.publicUrl);
    }

    return NextResponse.json({ imageUrls }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to upload images." },
      { status: 500 },
    );
  }
}
