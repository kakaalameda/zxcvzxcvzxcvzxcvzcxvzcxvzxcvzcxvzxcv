import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

type AdminSupabaseClient = SupabaseClient<Database>;

export interface AdminLookbookSection {
  id: number;
  eyebrow: string;
  title: string;
  text: string;
  productId: number | null;
  sortOrder: number;
  active: boolean;
}

export interface AdminLookbookPayload {
  eyebrow: string;
  title: string;
  text: string;
  productId: number | null;
  sortOrder: number;
  active: boolean;
}

function mapRow(row: Database["public"]["Tables"]["lookbook_sections"]["Row"]): AdminLookbookSection {
  return {
    id: row.id,
    eyebrow: row.eyebrow,
    title: row.title,
    text: row.text,
    productId: row.product_id,
    sortOrder: row.sort_order,
    active: row.active,
  };
}

export async function getAdminLookbookSections(
  supabase: AdminSupabaseClient,
): Promise<AdminLookbookSection[]> {
  const { data, error } = await supabase
    .from("lookbook_sections")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []).map(mapRow);
}

export async function upsertAdminLookbookSection(
  supabase: AdminSupabaseClient,
  payload: AdminLookbookPayload,
  id?: number,
): Promise<number> {
  const row = {
    eyebrow: payload.eyebrow,
    title: payload.title,
    text: payload.text,
    product_id: payload.productId,
    sort_order: payload.sortOrder,
    active: payload.active,
  };

  if (id) {
    const { error } = await supabase.from("lookbook_sections").update(row).eq("id", id);
    if (error) throw new Error(error.message);
    return id;
  }

  const { data, error } = await supabase
    .from("lookbook_sections")
    .insert(row)
    .select("id")
    .single();

  if (error || !data?.id) throw new Error(error?.message ?? "Không thể tạo section.");
  return data.id;
}

export async function deleteAdminLookbookSection(
  supabase: AdminSupabaseClient,
  id: number,
): Promise<void> {
  const { error } = await supabase.from("lookbook_sections").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
