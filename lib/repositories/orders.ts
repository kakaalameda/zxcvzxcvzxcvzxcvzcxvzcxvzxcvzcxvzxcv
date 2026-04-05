import {
  getProductHref,
  getProductVariantLabel,
  getShippingFee,
  type NewCartItem,
  type Product,
  type ProductColor,
  type ProductSize,
  type Voucher,
} from "@/lib/store";
import {
  getStoreProductById,
  getStoreVoucherByCode,
} from "@/lib/repositories/storefront";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseAdminEnv } from "@/lib/supabase/env";
import { guestOrderSchema, type GuestOrderPayload } from "@/lib/validations/order";

export type PaymentMethod = "cod" | "qr";

export interface CheckoutCustomerInput {
  name: string;
  phone: string;
  email: string;
  province: string;
  district: string;
  ward: string;
  address: string;
  note: string;
}

export interface CreateOrderInput {
  customer: CheckoutCustomerInput;
  items: NewCartItem[];
  paymentMethod: PaymentMethod;
  voucherCode?: string | null;
}

export interface CreateOrderResult {
  orderNumber: string;
  persisted: true;
}

export class OrderInputError extends Error {}

interface ResolvedOrderItem {
  key: string;
  productId: number;
  qty: number;
  href: string;
  name: string;
  sub: string;
  price: number;
  bgClass: string;
}

function cleanText(value: string | null | undefined): string {
  return value?.trim() ?? "";
}

function normalizePhone(phone: string): string {
  return phone.replace(/\s+/g, "");
}

function toNullable(value: string): string | null {
  return value ? value : null;
}

function buildOrderNumber(): string {
  const date = new Date();
  const yymmdd = [
    String(date.getFullYear()).slice(-2),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("");
  const suffix = Math.random().toString().slice(2, 8);
  return `NH${yymmdd}${suffix}`;
}

function validateCustomer(customer: CheckoutCustomerInput): CheckoutCustomerInput {
  const normalized = {
    name: cleanText(customer.name),
    phone: normalizePhone(cleanText(customer.phone)),
    email: cleanText(customer.email),
    province: cleanText(customer.province),
    district: cleanText(customer.district),
    ward: cleanText(customer.ward),
    address: cleanText(customer.address),
    note: cleanText(customer.note),
  };

  if (!normalized.name) {
    throw new OrderInputError("Missing customer name.");
  }

  if (!/^0\d{9,10}$/.test(normalized.phone)) {
    throw new OrderInputError("Invalid phone number.");
  }

  if (!normalized.province) {
    throw new OrderInputError("Missing province.");
  }

  if (!normalized.address) {
    throw new OrderInputError("Missing address.");
  }

  return normalized;
}

function extractVariant(
  item: NewCartItem,
  product: Product,
): {
  color: ProductColor;
  size: ProductSize;
} {
  const keyParts = item.key.split(":");
  const colorName =
    item.colorName ??
    (keyParts.length >= 3 ? keyParts.slice(1, -1).join(":").trim() : "");
  const size =
    item.size ??
    (keyParts.length >= 3 ? (keyParts[keyParts.length - 1] as ProductSize) : undefined);

  const color = product.colors.find((entry) => entry.name === colorName);
  if (!color) {
    throw new OrderInputError(`Invalid color for product ${product.id}.`);
  }

  const sizeOption = product.sizes.find((entry) => entry.size === size);
  if (!sizeOption?.available || !size) {
    throw new OrderInputError(`Invalid size for product ${product.id}.`);
  }

  return { color, size };
}

async function resolveOrderItems(items: NewCartItem[]): Promise<ResolvedOrderItem[]> {
  return Promise.all(
    items.map(async (item) => {
      const product = await getStoreProductById(String(item.productId));
      if (!product) {
        throw new OrderInputError(`Product ${item.productId} does not exist.`);
      }

      const { color, size } = extractVariant(item, product);
      const qty = Math.max(1, Math.min(10, Math.round(item.qty)));

      return {
        key: item.key,
        productId: product.id,
        qty,
        href: getProductHref(product.id),
        name: product.name,
        sub: getProductVariantLabel(color.name, size),
        price: product.price,
        bgClass: color.bgClass,
      };
    }),
  );
}

async function claimVoucherUsage(voucher: Voucher) {
  const currentCount = voucher.usedCount ?? 0;
  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    throw new Error("Supabase admin client is not available.");
  }

  const { data, error } = await supabase
    .from("vouchers")
    .update({ used_count: currentCount + 1 })
    .eq("code", voucher.code)
    .eq("used_count", currentCount)
    .select("code")
    .maybeSingle();

  if (error || !data) {
    throw new OrderInputError("Voucher has reached its usage limit.");
  }
}

async function releaseVoucherUsage(voucher: Voucher) {
  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return;
  }

  const nextCount = Math.max(0, (voucher.usedCount ?? 0));
  await supabase
    .from("vouchers")
    .update({ used_count: nextCount })
    .eq("code", voucher.code);
}

export async function createOrder(rawInput: unknown): Promise<CreateOrderResult> {
  const input = guestOrderSchema.parse(rawInput) as GuestOrderPayload;
  const customer = validateCustomer(input.customer);
  const items = await resolveOrderItems(input.items as NewCartItem[]);

  if (input.paymentMethod !== "cod" && input.paymentMethod !== "qr") {
    throw new OrderInputError("Unsupported payment method.");
  }

  const voucher = input.voucherCode ? await getStoreVoucherByCode(input.voucherCode) : null;

  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const discountPct = voucher?.pct ?? 0;
  const discountLabel = voucher?.label ?? null;
  const discountAmount = Math.round(subtotal * (discountPct / 100));
  const shippingFee = getShippingFee(subtotal, discountAmount);
  const total = subtotal - discountAmount + shippingFee;
  const orderNumber = buildOrderNumber();

  if (!hasSupabaseAdminEnv()) {
    throw new Error("Order persistence is not configured.");
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    throw new Error("Supabase admin client is not available.");
  }

  if (voucher) {
    await claimVoucherUsage(voucher);
  }

  const { data: orderRow, error: orderError } = await supabase
    .from("orders")
    .insert({
      order_number: orderNumber,
      customer_name: customer.name,
      customer_phone: customer.phone,
      customer_email: toNullable(customer.email),
      province: customer.province,
      district: toNullable(customer.district),
      ward: toNullable(customer.ward),
      address: customer.address,
      note: toNullable(customer.note),
      payment_method: input.paymentMethod,
      voucher_code: voucher?.code ?? null,
      discount_pct: discountPct,
      discount_label: discountLabel,
      subtotal,
      discount_amount: discountAmount,
      shipping_fee: shippingFee,
      total,
      status: "pending",
    })
    .select("id, order_number")
    .single();

  if (orderError || !orderRow) {
    if (voucher) {
      await releaseVoucherUsage(voucher);
    }

    throw new Error(orderError?.message ?? "Failed to create order.");
  }

  const { error: itemError } = await supabase.from("order_items").insert(
    items.map((item) => ({
      order_id: orderRow.id,
      product_id: item.productId,
      product_name: item.name,
      product_href: item.href,
      variant_label: item.sub,
      qty: item.qty,
      unit_price: item.price,
      line_total: item.price * item.qty,
      bg_class: item.bgClass,
    })),
  );

  if (itemError) {
    await supabase.from("orders").delete().eq("id", orderRow.id);
    if (voucher) {
      await releaseVoucherUsage(voucher);
    }

    throw new Error(itemError.message);
  }

  return {
    orderNumber: orderRow.order_number,
    persisted: true,
  };
}
