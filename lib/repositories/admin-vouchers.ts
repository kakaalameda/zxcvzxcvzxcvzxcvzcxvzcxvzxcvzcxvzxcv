import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import type { AdminVoucherPayload } from "@/lib/validations/admin";

type AdminSupabaseClient = SupabaseClient<Database>;
type VoucherRow = Database["public"]["Tables"]["vouchers"]["Row"];

export interface AdminVoucherRecord {
  code: string;
  pct: number;
  label: string;
  desc: string;
  active: boolean;
  maxUses: number | null;
  usedCount: number;
  expiresAt: string | null;
  createdAt: string;
}

function mapVoucher(row: VoucherRow): AdminVoucherRecord {
  return {
    code: row.code,
    pct: row.pct,
    label: row.label,
    desc: row.description,
    active: row.active,
    maxUses: row.max_uses,
    usedCount: row.used_count,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
  };
}

export async function getAdminVouchers(supabase: AdminSupabaseClient) {
  const { data, error } = await supabase
    .from("vouchers")
    .select(
      "code, pct, label, description, active, max_uses, used_count, expires_at, created_at",
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return ((data as VoucherRow[] | null) ?? []).map(mapVoucher);
}

export async function upsertAdminVoucher(
  supabase: AdminSupabaseClient,
  payload: AdminVoucherPayload,
  code?: string,
) {
  const mutation = {
    code: payload.code,
    pct: payload.pct,
    label: payload.label,
    description: payload.desc,
    active: payload.active,
    max_uses: payload.maxUses ?? null,
    used_count: payload.usedCount,
    expires_at: payload.expiresAt ? new Date(payload.expiresAt).toISOString() : null,
  };

  if (code) {
    const { error } = await supabase.from("vouchers").update(mutation).eq("code", code);
    if (error) {
      throw new Error(error.message);
    }
    return payload.code;
  }

  const { error } = await supabase.from("vouchers").insert(mutation);
  if (error) {
    throw new Error(error.message);
  }

  return payload.code;
}

export async function deleteAdminVoucher(
  supabase: AdminSupabaseClient,
  code: string,
) {
  const { error } = await supabase.from("vouchers").delete().eq("code", code);
  if (error) {
    throw new Error(error.message);
  }
}
