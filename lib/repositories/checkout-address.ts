import "server-only";

import {
  normalizeGhtkAddress,
  type GhtkAddressNormalizationResult,
} from "@/lib/integrations/ghtk";
import { getAdminShippingConfig } from "@/lib/repositories/admin-shipping-config";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  checkoutAddressNormalizationSchema,
  type CheckoutAddressNormalizationPayload,
} from "@/lib/validations/order";

export class CheckoutAddressInputError extends Error {}

export class CheckoutAddressServiceError extends Error {}

function mapNormalizeAddressErrorMessage(message: string) {
  const normalizedMessage = message.toLowerCase();

  if (
    normalizedMessage.includes("missing district") ||
    normalizedMessage.includes("missing ward") ||
    normalizedMessage.includes("missing province")
  ) {
    return "GHTK chua xac dinh du tinh, quan/huyen, phuong/xa. Vui long kiem tra lai dia chi.";
  }

  return message;
}

export async function normalizeCheckoutAddress(
  rawInput: unknown,
): Promise<GhtkAddressNormalizationResult> {
  const input = checkoutAddressNormalizationSchema.parse(
    rawInput,
  ) as CheckoutAddressNormalizationPayload;

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    throw new CheckoutAddressServiceError(
      "Shop chua san sang chuan hoa dia chi GHTK. Vui long thu lai sau.",
    );
  }

  const config = await getAdminShippingConfig(supabase);
  if (!config) {
    throw new CheckoutAddressServiceError(
      "Shop chua cau hinh GHTK. Vui long thu lai sau.",
    );
  }

  try {
    return await normalizeGhtkAddress(config, {
      province: input.customer.province,
      district: input.customer.district,
      ward: input.customer.ward,
      address: input.customer.address,
      itemCount: input.itemCount,
      value: input.value,
    });
  } catch (error) {
    throw new CheckoutAddressInputError(
      error instanceof Error
        ? mapNormalizeAddressErrorMessage(error.message)
        : "Could not normalize shipping address with GHTK.",
    );
  }
}
