import "server-only";

import { createServerClient } from "@supabase/ssr";
import { unstable_cache } from "next/cache";
import { getSupabasePublicEnv } from "@/lib/supabase/env";
import { LOOKBOOK_SECTIONS } from "@/lib/store";
import type { Database } from "@/lib/supabase/types";

export interface StorefrontLookbookSection {
  id: number;
  eyebrow: string;
  title: string;
  text: string;
  productId: number | null;
}

async function fetchLookbookSectionsFromSupabase(): Promise<StorefrontLookbookSection[]> {
  const env = getSupabasePublicEnv();
  if (!env) return getFallbackSections();

  const supabase = createServerClient<Database>(env.url, env.publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    cookies: { getAll() { return []; }, setAll() {} },
  });

  const { data, error } = await supabase
    .from("lookbook_sections")
    .select("id, eyebrow, title, text, product_id, sort_order")
    .eq("active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    // Table may not exist yet (migration not run)
    console.warn("[Lookbook]: lookbook_sections table missing, using fallback.");
    return getFallbackSections();
  }

  if (!data?.length) return getFallbackSections();

  return data.map((row) => ({
    id: row.id,
    eyebrow: row.eyebrow,
    title: row.title,
    text: row.text,
    productId: row.product_id,
  }));
}

function getFallbackSections(): StorefrontLookbookSection[] {
  return LOOKBOOK_SECTIONS.map((section, index) => ({
    id: index + 1,
    eyebrow: section.eyebrow,
    title: section.title,
    text: section.text,
    productId: section.productId,
  }));
}

export const getLookbookSections = unstable_cache(
  fetchLookbookSectionsFromSupabase,
  ["storefront:lookbook"],
  { revalidate: 3600, tags: ["lookbook"] },
);
