import "server-only";

import type { AdminShippingConfigRecord } from "@/lib/repositories/admin-shipping-config";
import type { PaymentMethod } from "@/lib/repositories/orders";

export interface GhtkOrderItemPayload {
  productId: number;
  productName: string;
  qty: number;
  unitPrice: number;
}

export interface GhtkOrderPayload {
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  province: string;
  district: string | null;
  ward: string | null;
  address: string;
  note: string | null;
  paymentMethod: PaymentMethod;
  subtotal: number;
  total: number;
  shippingFee: number;
  items: GhtkOrderItemPayload[];
}

type GhtkAddressFields = Pick<
  GhtkOrderPayload,
  "province" | "district" | "ward" | "address"
>;

export interface GhtkAddressNormalizationInput extends GhtkAddressFields {
  itemCount?: number;
  value?: number;
}

export interface GhtkAddressNormalizationResult extends GhtkAddressFields {
  hamlet: string | null;
  changed: boolean;
  deliverable: boolean;
  message: string;
}

interface GhtkApiResponse {
  success?: boolean;
  message?: string;
  error_code?: string | number;
  log_id?: string;
  order?: {
    partner_id?: string;
    label?: string;
    fee?: number | string;
  };
  fee?: {
    delivery?: boolean;
    fee?: number;
    insurance_fee?: number;
  };
  error?: {
    code?: string;
    partner_id?: string;
    ghtk_label?: string;
    created?: string;
    status?: number;
  };
  data?: unknown;
}

interface GhtkParsedAddressNode {
  id?: number;
  name?: string;
  type?: number;
}

interface GhtkParsedAddressData {
  hamlet?: GhtkParsedAddressNode;
  district?: GhtkParsedAddressNode;
  province?: GhtkParsedAddressNode;
  ward?: GhtkParsedAddressNode;
}

export interface GhtkCreateOrderResult {
  trackingCode: string | null;
  message: string;
}

class GhtkDeliverySupportError extends Error {}

function trimToNull(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function sanitizePhone(value: string) {
  return value.replace(/\s+/g, "");
}

function normalizeBaseUrl(value: string) {
  return value.trim().replace(/\/+$/, "");
}

function buildHeaders(config: AdminShippingConfigRecord) {
  return {
    Token: config.apiToken,
    "X-Client-Source": config.clientSource,
    "Content-Type": "application/json",
  };
}

function buildUrl(
  config: AdminShippingConfigRecord,
  path: string,
  query?: Record<string, string | number | null | undefined>,
) {
  const url = new URL(`${normalizeBaseUrl(config.baseUrl)}${path}`);

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === null || value === undefined || value === "") {
        continue;
      }

      url.searchParams.set(key, String(value));
    }
  }

  return url;
}

async function parseJsonResponse(response: Response): Promise<GhtkApiResponse> {
  const text = await response.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text) as GhtkApiResponse;
  } catch {
    throw new Error(`GHTK returned non-JSON response (${response.status}).`);
  }
}

function isOrderIdExistsError(payload: GhtkApiResponse) {
  return payload.error?.code === "ORDER_ID_EXIST";
}

function normalizeForMatch(value: string | null | undefined) {
  const trimmed = trimToNull(value);
  if (!trimmed) {
    return null;
  }

  return trimmed.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function extractErrorCode(payload: GhtkApiResponse) {
  const rawCode = payload.error_code ?? payload.error?.code;
  if (rawCode === null || rawCode === undefined) {
    return null;
  }

  return trimToNull(String(rawCode));
}

function formatDiagnostics(payload: GhtkApiResponse) {
  const parts: string[] = [];
  const errorCode = extractErrorCode(payload);
  const logId = trimToNull(payload.log_id);

  if (errorCode) {
    parts.push(`error_code=${errorCode}`);
  }

  if (logId) {
    parts.push(`log_id=${logId}`);
  }

  return parts.length ? ` (${parts.join(", ")})` : "";
}

function extractMessage(payload: GhtkApiResponse, fallback: string) {
  const baseMessage = trimToNull(payload.message) ?? fallback;
  return `${baseMessage}${formatDiagnostics(payload)}`;
}

function isAlreadyCanceledResponse(payload: GhtkApiResponse) {
  if (extractErrorCode(payload) === "50101") {
    return true;
  }

  const normalizedMessage = normalizeForMatch(payload.message);
  return normalizedMessage?.includes("trang thai huy") ?? false;
}

function normalizeAddressFields<T extends GhtkAddressFields>(value: T): T {
  return {
    ...value,
    province: trimToNull(value.province) ?? "",
    district: trimToNull(value.district) ?? "",
    ward: trimToNull(value.ward) ?? "",
    address: trimToNull(value.address) ?? "",
  };
}

function hasAddressFieldChanged(
  current: string | null | undefined,
  next: string | null | undefined,
) {
  return normalizeForMatch(current) !== normalizeForMatch(next);
}

function buildParseAddressQuery(address: GhtkAddressFields) {
  return [
    trimToNull(address.address),
    trimToNull(address.ward),
    trimToNull(address.district),
    trimToNull(address.province),
  ]
    .filter((value): value is string => Boolean(value))
    .join(", ");
}

function formatSuggestionMessage(suggestions: string[]) {
  if (!suggestions.length) {
    return "";
  }

  return `Goi y duong/khu vuc gan do: ${suggestions.slice(0, 5).join(" | ")}.`;
}

function normalizeAddressCandidate(value: string | null | undefined) {
  return trimToNull(value)?.replace(/\s+/g, " ") ?? null;
}

function pushAddressCandidate(target: Set<string>, value: string | null | undefined) {
  const normalized = normalizeAddressCandidate(value);
  if (normalized) {
    target.add(normalized);
  }
}

function buildAddressValidationCandidates(address: string) {
  const candidates = new Set<string>();
  const normalizedAddress = normalizeAddressCandidate(address);

  if (!normalizedAddress) {
    return [] as string[];
  }

  pushAddressCandidate(candidates, normalizedAddress);

  const withoutLeadingHouseNumber = normalizedAddress.replace(
    /^(?:so|số)\s+(?:nha|nhà)\s+/i,
    "",
  );
  pushAddressCandidate(candidates, withoutLeadingHouseNumber);

  const withoutLeadingBuildingToken = withoutLeadingHouseNumber.replace(
    /^(?:\d+[a-z]?)(?:[/.-]\d+[a-z]?)*\s*,?\s*/i,
    "",
  );
  pushAddressCandidate(candidates, withoutLeadingBuildingToken);

  const streetOnlyMatch = withoutLeadingBuildingToken.match(
    /(?:duong|đường|pho|phố|quoc lo|quốc lộ|tinh lo|tỉnh lộ)\s+(.+)$/i,
  );
  if (streetOnlyMatch) {
    pushAddressCandidate(candidates, streetOnlyMatch[0]);
    pushAddressCandidate(candidates, streetOnlyMatch[1]);
  }

  const innerStreetMatch = withoutLeadingBuildingToken.match(
    /(?:ngo|ngõ|ngach|ngách|hem|hẻm)\s+\S+\s+(.+)$/i,
  );
  if (innerStreetMatch) {
    pushAddressCandidate(candidates, innerStreetMatch[1]);
  }

  return [...candidates];
}

function buildDeliverySupportFailureMessage(
  payload: GhtkApiResponse,
  suggestions: string[],
) {
  const normalizedMessage = normalizeForMatch(payload.message);

  if (
    payload.fee?.delivery === false ||
    normalizedMessage?.includes("does not support this delivery address yet")
  ) {
    return `GHTK chua xac nhan duoc cap duong pho nay. ${formatSuggestionMessage(
      suggestions,
    )}`.trim();
  }

  return `${extractMessage(
    payload,
    "Khong the kiem tra pham vi giao hang voi GHTK.",
  )} ${formatSuggestionMessage(suggestions)}`.trim();
}

async function requestJson(
  config: AdminShippingConfigRecord,
  path: string,
  init?: RequestInit,
  query?: Record<string, string | number | null | undefined>,
) {
  const response = await fetch(buildUrl(config, path, query), {
    ...init,
    cache: "no-store",
    headers: {
      ...buildHeaders(config),
      ...(init?.headers ?? {}),
    },
  });

  const payload = await parseJsonResponse(response);

  return {
    response,
    payload,
  };
}

function assertShipmentAddress(address: GhtkAddressFields) {
  if (!trimToNull(address.province)) {
    throw new Error("Order is missing province for GHTK.");
  }

  if (!trimToNull(address.district)) {
    throw new Error("Order is missing district for GHTK.");
  }

  if (!trimToNull(address.ward)) {
    throw new Error("Order is missing ward for GHTK.");
  }
}

function buildWeight(order: GhtkOrderPayload, config: AdminShippingConfigRecord) {
  const totalQuantity = order.items.reduce((sum, item) => sum + item.qty, 0);
  const totalWeightKg = Number(
    (config.defaultProductWeight * Math.max(totalQuantity, 1)).toFixed(3),
  );

  return {
    totalWeightKg,
    totalWeightGrams: Math.max(1, Math.round(totalWeightKg * 1000)),
  };
}

async function fetchAddressLevel4Suggestions(
  config: AdminShippingConfigRecord,
  address: GhtkAddressFields,
) {
  const district = trimToNull(address.district);
  const ward = trimToNull(address.ward);
  const province = trimToNull(address.province);

  if (!province || !district || !ward) {
    return [] as string[];
  }

  try {
    const { payload } = await requestJson(
      config,
      "/services/address/getAddressLevel4",
      {
        method: "GET",
      },
      {
        address: address.address,
        province,
        district,
        ward_street: ward,
      },
    );

    return Array.isArray(payload.data)
      ? payload.data.filter((entry): entry is string => typeof entry === "string")
      : [];
  } catch {
    return [];
  }
}

function buildValidationWeightGrams(
  config: AdminShippingConfigRecord,
  itemCount: number | null | undefined,
) {
  const normalizedItemCount = Math.max(1, Math.round(itemCount ?? 1));
  const totalWeightKg = Number(
    (config.defaultProductWeight * normalizedItemCount).toFixed(3),
  );

  return Math.max(1, Math.round(totalWeightKg * 1000));
}

async function parseAddressWithGhtk(
  config: AdminShippingConfigRecord,
  address: GhtkAddressFields,
) {
  const query = buildParseAddressQuery(address);
  if (!query) {
    return null;
  }

  const { payload } = await requestJson(
    config,
    "/open/api/v1/address/parse-address",
    {
      method: "GET",
    },
    {
      address: query,
    },
  );

  if (!payload.success || !payload.data || typeof payload.data !== "object") {
    return null;
  }

  return payload.data as GhtkParsedAddressData;
}

async function validateDeliveryAddressSupport(
  config: AdminShippingConfigRecord,
  address: GhtkAddressFields,
  options: {
    totalWeightGrams: number;
    value: number;
  },
) {
  assertShipmentAddress(address);
  const addressCandidates = buildAddressValidationCandidates(address.address);
  let lastErrorMessage = "GHTK chua xac nhan duoc dia chi giao hang nay.";

  for (const candidateAddress of addressCandidates) {
    const { payload } = await requestJson(
      config,
      "/services/shipment/fee",
      {
        method: "GET",
      },
      {
        pick_address_id: trimToNull(config.pickAddressId),
        pick_address: config.pickAddress,
        pick_province: config.pickProvince,
        pick_district: config.pickDistrict,
        pick_ward: trimToNull(config.pickWard),
        address: candidateAddress,
        province: address.province,
        district: address.district,
        ward: address.ward,
        weight: options.totalWeightGrams,
        value: Math.max(options.value, 1),
        transport: config.transport,
      },
    );

    if (payload.success && payload.fee?.delivery !== false) {
      return;
    }

    const suggestions = await fetchAddressLevel4Suggestions(config, {
      ...address,
      address: candidateAddress,
    });
    lastErrorMessage = buildDeliverySupportFailureMessage(payload, suggestions);
  }

  throw new GhtkDeliverySupportError(lastErrorMessage);
}

async function validateDeliverySupport(
  config: AdminShippingConfigRecord,
  order: GhtkOrderPayload,
) {
  const { totalWeightGrams } = buildWeight(order, config);
  await validateDeliveryAddressSupport(config, order, {
    totalWeightGrams,
    value: order.subtotal,
  });
}

function limitNote(value: string | null) {
  return value?.trim().slice(0, 120) || undefined;
}

export async function normalizeGhtkAddress(
  config: AdminShippingConfigRecord,
  input: GhtkAddressNormalizationInput,
): Promise<GhtkAddressNormalizationResult> {
  const original = normalizeAddressFields(input);
  const parsed = await parseAddressWithGhtk(config, original);

  const normalized: GhtkAddressNormalizationResult = {
    province: trimToNull(parsed?.province?.name) ?? original.province,
    district: trimToNull(parsed?.district?.name) ?? original.district,
    ward: trimToNull(parsed?.ward?.name) ?? original.ward,
    address: original.address,
    hamlet: trimToNull(parsed?.hamlet?.name),
    changed: false,
    deliverable: true,
    message: "",
  };

  normalized.changed =
    hasAddressFieldChanged(original.province, normalized.province) ||
    hasAddressFieldChanged(original.district, normalized.district) ||
    hasAddressFieldChanged(original.ward, normalized.ward);

  try {
    await validateDeliveryAddressSupport(config, normalized, {
      totalWeightGrams: buildValidationWeightGrams(config, input.itemCount),
      value: input.value ?? 1,
    });
  } catch (error) {
    if (!(error instanceof GhtkDeliverySupportError)) {
      throw error;
    }

    normalized.deliverable = false;
    normalized.message = `${
      error instanceof Error
        ? error.message
        : "GHTK chua xac nhan duoc cap duong pho nay."
    } Ban van co the tiep tuc dat hang; shop se kiem tra lai khi duyet don.`;
    return normalized;
  }

  normalized.message = normalized.changed
    ? "Dia chi da duoc chuan hoa theo danh muc GHTK."
    : "Dia chi da khop danh muc GHTK.";

  return normalized;
}

export async function createGhtkOrder(
  config: AdminShippingConfigRecord,
  order: GhtkOrderPayload,
): Promise<GhtkCreateOrderResult> {
  await validateDeliverySupport(config, order);
  const { totalWeightKg } = buildWeight(order, config);

  const body = {
    products: order.items.map((item) => ({
      name: item.productName,
      price: item.unitPrice,
      weight: config.defaultProductWeight,
      quantity: item.qty,
      product_code: String(item.productId),
    })),
    order: {
      id: order.orderNumber,
      pick_name: config.pickName,
      pick_address_id: trimToNull(config.pickAddressId) ?? undefined,
      pick_address: config.pickAddress,
      pick_province: config.pickProvince,
      pick_district: config.pickDistrict,
      pick_ward: trimToNull(config.pickWard) ?? undefined,
      pick_tel: sanitizePhone(config.pickTel),
      name: order.customerName,
      address: order.address,
      province: order.province,
      district: order.district,
      ward: order.ward,
      hamlet: "Khac",
      tel: sanitizePhone(order.customerPhone),
      note: limitNote(order.note),
      value: Math.max(order.subtotal, 1),
      pick_money: order.paymentMethod === "cod" ? order.total : 0,
      is_freeship: 1,
      pick_option: "cod",
      transport: config.transport,
      weight_option: "kilogram",
      total_weight: totalWeightKg,
      use_return_address: 0,
    },
  };

  const { payload } = await requestJson(
    config,
    "/services/shipment/order/",
    {
      method: "POST",
      body: JSON.stringify(body),
    },
    {
      ver: "1.5",
    },
  );

  if (payload.success) {
    return {
      trackingCode: trimToNull(payload.order?.label),
      message: "GHTK shipment created.",
    };
  }

  if (isOrderIdExistsError(payload)) {
    return {
      trackingCode: trimToNull(payload.error?.ghtk_label),
      message: "This order already exists on GHTK.",
    };
  }

  throw new Error(extractMessage(payload, "Failed to create GHTK shipment."));
}

export async function cancelGhtkOrder(args: {
  config: AdminShippingConfigRecord;
  trackingCode: string | null;
  partnerOrderCode: string;
}) {
  const target =
    trimToNull(args.trackingCode) ?? `partner_id:${args.partnerOrderCode}`;

  const tryRequest = async (method: "POST" | "GET") =>
    requestJson(args.config, `/services/shipment/cancel/${encodeURIComponent(target)}`, {
      method,
    });

  let { response, payload } = await tryRequest("POST");

  if (response.status === 404 || response.status === 405) {
    ({ response, payload } = await tryRequest("GET"));
  }

  if (payload.success) {
    return;
  }

  if (isAlreadyCanceledResponse(payload)) {
    return;
  }

  throw new Error(extractMessage(payload, "Failed to cancel GHTK shipment."));
}
