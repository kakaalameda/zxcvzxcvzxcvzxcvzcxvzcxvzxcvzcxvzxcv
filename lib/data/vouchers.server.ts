import "server-only";

import { createServerClient } from "@supabase/ssr";
import { unstable_cache } from "next/cache";
import { cache } from "react";
import { VOUCHERS, type Voucher } from "@/lib/store";
import { getSupabasePublicEnv } from "@/lib/supabase/env";
import type { Database } from "@/lib/supabase/types";

type VoucherRow = Database["public"]["Tables"]["vouchers"]["Row"];

function isVoucherEligible(voucher: Voucher, now = new Date()): boolean {
  if (voucher.active === false) {
    return false;
  }

  if (
    typeof voucher.maxUses === "number" &&
    typeof voucher.usedCount === "number" &&
    voucher.usedCount >= voucher.maxUses
  ) {
    return false;
  }

  if (voucher.expiresAt && new Date(voucher.expiresAt) < now) {
    return false;
  }

  return true;
}

function buildCachedFetch(tags: string[]): typeof fetch {
  return (input, init) => {
    const currentInit = init as RequestInit & {
      next?: {
        revalidate?: number;
        tags?: string[];
      };
    };

    return fetch(input, {
      ...currentInit,
      next: {
        ...currentInit?.next,
        revalidate: 3600,
        tags: Array.from(new Set([...(currentInit?.next?.tags ?? []), ...tags])),
      },
    });
  };
}

async function fetchVouchersFromSupabase(): Promise<Voucher[]> {
  const env = getSupabasePublicEnv();
  if (!env) {
    console.error(
      "[Vouchers Server]: Thieu bien moi truong Supabase public, su dung du lieu fallback.",
    );
    return VOUCHERS;
  }

  const supabase = createServerClient<Database>(env.url, env.publishableKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      fetch: buildCachedFetch(["store:vouchers"]),
    },
    cookies: {
      getAll() {
        return [];
      },
      setAll() {},
    },
  });

  const { data, error } = await supabase
    .from("vouchers")
    .select(
      "code, pct, label, description, active, max_uses, used_count, expires_at, created_at",
    )
    .eq("active", true)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[Vouchers Server]: Khong the tai voucher tu Supabase.", error);
    return VOUCHERS;
  }

  const rows = (data as VoucherRow[] | null) ?? [];
  if (!rows.length) {
    return VOUCHERS;
  }

  return rows
    .map((voucher) => ({
      code: voucher.code,
      pct: voucher.pct,
      label: voucher.label,
      desc: voucher.description,
      active: voucher.active,
      maxUses: voucher.max_uses,
      usedCount: voucher.used_count,
      expiresAt: voucher.expires_at,
    }))
    .filter((voucher) => isVoucherEligible(voucher));
}

const getCachedVouchersInternal = unstable_cache(
  fetchVouchersFromSupabase,
  ["store:vouchers:list"],
  {
    revalidate: 3600,
    tags: ["store:vouchers"],
  },
);

export const getVouchers = cache(async (): Promise<Voucher[]> => {
  return getCachedVouchersInternal();
});

export const getVoucherByCode = cache(async (code: string): Promise<Voucher | null> => {
  const normalized = code.trim().toUpperCase();
  if (!normalized) {
    return null;
  }

  const vouchers = await getVouchers();
  return vouchers.find((voucher) => voucher.code === normalized) ?? null;
});
