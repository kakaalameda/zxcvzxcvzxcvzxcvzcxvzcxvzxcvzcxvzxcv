import { notFound, redirect } from "next/navigation";
import { ProductDetailView } from "@/components/product-detail-view";
import {
  getStoreProductById,
  getStoreRelatedProducts,
} from "@/lib/repositories/storefront";
import { getSupabasePublicEnv } from "@/lib/supabase/env";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/lib/supabase/types";

/** Map legacy ProductType → category slug */
const CATEGORY_SLUG_MAP: Record<string, string> = {
  Tee: "ao-thun",
  Hoodie: "hoodie",
  Pants: "quan",
};

async function resolveSlugUrl(id: string): Promise<string | null> {
  const env = getSupabasePublicEnv();
  if (!env) return null;

  try {
    const supabase = createServerClient<Database>(env.url, env.publishableKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      cookies: { getAll() { return []; }, setAll() {} },
    });

    const { data } = await supabase
      .from("products")
      .select("slug, category")
      .eq("id", Number(id))
      .maybeSingle();

    if (!data?.slug) return null;

    const categorySlug = CATEGORY_SLUG_MAP[data.category] ?? "san-pham";
    return `/san-pham/${categorySlug}/${data.slug}`;
  } catch {
    return null;
  }
}

export const dynamic = "force-dynamic";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // If migration has run and product has a slug, 301 redirect to SEO URL
  const slugUrl = await resolveSlugUrl(id);
  if (slugUrl) {
    redirect(slugUrl);
  }

  const product = await getStoreProductById(id);

  if (!product) {
    notFound();
  }

  const relatedProducts = await getStoreRelatedProducts(product.id);

  return <ProductDetailView product={product} relatedProducts={relatedProducts} />;
}
