import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getSupabasePublicEnv } from "@/lib/supabase/env";
import type { Database } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

/** Map legacy ProductType values to category slugs */
const CATEGORY_SLUG_MAP: Record<string, string> = {
  Tee: "ao-thun",
  Hoodie: "hoodie",
  Pants: "quan",
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const env = getSupabasePublicEnv();

  if (env) {
    const supabase = createServerClient<Database>(env.url, env.publishableKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      cookies: { getAll() { return []; }, setAll() {} },
    });

    const { data } = await supabase
      .from("products")
      .select("slug, category")
      .eq("id", Number(id))
      .maybeSingle();

    if (data?.slug) {
      const categorySlug = CATEGORY_SLUG_MAP[data.category] ?? "san-pham";
      return NextResponse.redirect(
        new URL(`/san-pham/${categorySlug}/${data.slug}`, request.url),
        { status: 301 },
      );
    }
  }

  // Fallback: keep on the id-based route (shouldn't loop since next.config redirects only /product/:id)
  return NextResponse.redirect(new URL(`/collection`, request.url), { status: 302 });
}
