import "server-only";

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import {
  adminShippingConfigSchema,
  type AdminShippingConfigPayload,
} from "@/lib/validations/admin";

type AdminSupabaseClient = SupabaseClient<Database>;
type ShippingApiConfigRow =
  Database["public"]["Tables"]["shipping_api_configs"]["Row"];

const SHIPPING_PROVIDER = "ghtk";
const SHIPPING_CONFIG_FILE_PATH = path.join(
  process.cwd(),
  ".data",
  "shipping-api-config.json",
);

export interface AdminShippingConfigRecord {
  provider: "ghtk";
  baseUrl: string;
  apiToken: string;
  clientSource: string;
  pickName: string;
  pickAddressId: string | null;
  pickAddress: string;
  pickProvince: string;
  pickDistrict: string;
  pickWard: string | null;
  pickTel: string;
  transport: "road" | "fly";
  defaultProductWeight: number;
  updatedAt: string;
}

function mapShippingConfig(
  row: ShippingApiConfigRow,
): AdminShippingConfigRecord {
  return {
    provider: "ghtk",
    baseUrl: row.base_url,
    apiToken: row.api_token,
    clientSource: row.client_source,
    pickName: row.pick_name,
    pickAddressId: row.pick_address_id,
    pickAddress: row.pick_address,
    pickProvince: row.pick_province,
    pickDistrict: row.pick_district,
    pickWard: row.pick_ward,
    pickTel: row.pick_tel,
    transport: row.transport,
    defaultProductWeight: row.default_product_weight,
    updatedAt: row.updated_at,
  };
}

function shouldFallbackToFileStorage(errorMessage: string) {
  return (
    errorMessage.includes("public.shipping_api_configs") &&
    (errorMessage.includes("schema cache") ||
      errorMessage.includes("does not exist"))
  );
}

function buildConfigRecord(
  payload: AdminShippingConfigPayload,
  updatedAt = new Date().toISOString(),
): AdminShippingConfigRecord {
  return {
    provider: "ghtk",
    baseUrl: payload.baseUrl,
    apiToken: payload.apiToken,
    clientSource: payload.clientSource,
    pickName: payload.pickName,
    pickAddressId: payload.pickAddressId ?? null,
    pickAddress: payload.pickAddress,
    pickProvince: payload.pickProvince,
    pickDistrict: payload.pickDistrict,
    pickWard: payload.pickWard ?? null,
    pickTel: payload.pickTel,
    transport: payload.transport,
    defaultProductWeight: payload.defaultProductWeight,
    updatedAt,
  };
}

async function readShippingConfigFromFile(): Promise<AdminShippingConfigRecord | null> {
  try {
    const fileContent = await readFile(SHIPPING_CONFIG_FILE_PATH, "utf8");
    const parsed = JSON.parse(fileContent) as Partial<AdminShippingConfigRecord>;

    const payload = adminShippingConfigSchema.parse({
      baseUrl: parsed.baseUrl,
      apiToken: parsed.apiToken,
      clientSource: parsed.clientSource,
      pickName: parsed.pickName,
      pickAddressId: parsed.pickAddressId ?? null,
      pickAddress: parsed.pickAddress,
      pickProvince: parsed.pickProvince,
      pickDistrict: parsed.pickDistrict,
      pickWard: parsed.pickWard ?? null,
      pickTel: parsed.pickTel,
      transport: parsed.transport,
      defaultProductWeight: parsed.defaultProductWeight,
    });

    return buildConfigRecord(payload, parsed.updatedAt);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return null;
    }

    throw new Error(
      error instanceof Error
        ? `Failed to read local shipping config. ${error.message}`
        : "Failed to read local shipping config.",
    );
  }
}

async function writeShippingConfigToFile(payload: AdminShippingConfigPayload) {
  const record = buildConfigRecord(payload);
  await mkdir(path.dirname(SHIPPING_CONFIG_FILE_PATH), { recursive: true });
  await writeFile(
    SHIPPING_CONFIG_FILE_PATH,
    `${JSON.stringify(record, null, 2)}\n`,
    "utf8",
  );

  return record;
}

export async function getAdminShippingConfig(
  supabase: AdminSupabaseClient,
): Promise<AdminShippingConfigRecord | null> {
  const { data, error } = await supabase
    .from("shipping_api_configs")
    .select("*")
    .eq("provider", SHIPPING_PROVIDER)
    .maybeSingle();

  if (error) {
    if (shouldFallbackToFileStorage(error.message)) {
      return readShippingConfigFromFile();
    }

    throw new Error(error.message);
  }

  if (data) {
    return mapShippingConfig(data);
  }

  return readShippingConfigFromFile();
}

export async function upsertAdminShippingConfig(
  supabase: AdminSupabaseClient,
  payload: AdminShippingConfigPayload,
): Promise<AdminShippingConfigRecord> {
  const { data, error } = await supabase
    .from("shipping_api_configs")
    .upsert(
      {
        provider: SHIPPING_PROVIDER,
        base_url: payload.baseUrl,
        api_token: payload.apiToken,
        client_source: payload.clientSource,
        pick_name: payload.pickName,
        pick_address_id: payload.pickAddressId ?? null,
        pick_address: payload.pickAddress,
        pick_province: payload.pickProvince,
        pick_district: payload.pickDistrict,
        pick_ward: payload.pickWard ?? null,
        pick_tel: payload.pickTel,
        transport: payload.transport,
        default_product_weight: payload.defaultProductWeight,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "provider",
      },
    )
    .select("*")
    .single();

  if (error) {
    if (shouldFallbackToFileStorage(error.message)) {
      return writeShippingConfigToFile(payload);
    }

    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Failed to save shipping config.");
  }

  return mapShippingConfig(data);
}
