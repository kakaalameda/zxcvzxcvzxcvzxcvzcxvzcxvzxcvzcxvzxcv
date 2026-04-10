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
import type { Database } from "@/lib/supabase/types";
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
  colorName: string;
  size: ProductSize;
}

type OrderSupabaseClient = NonNullable<ReturnType<typeof createSupabaseAdminClient>>;
type ProductColorRow = Database["public"]["Tables"]["product_colors"]["Row"];
type OrderInsert = Database["public"]["Tables"]["orders"]["Insert"];
type OrderItemInsert = Database["public"]["Tables"]["order_items"]["Insert"];

interface ReservedStockClaim {
  productId: number;
  colorId: number;
  qty: number;
  disabledSizes: boolean;
}

const MAX_STOCK_RESERVE_ATTEMPTS = 5;

let createGuestOrderWithStockRpcUnavailable = false;

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
  // Dùng crypto.randomUUID() thay Math.random() để đảm bảo tính ngẫu nhiên mật mã học
  const suffix = crypto.randomUUID().replace(/-/g, "").slice(0, 6).toUpperCase();
  return `NH${yymmdd}${suffix}`;
}

function isOrderInputMessage(message: string): boolean {
  return [
    "does not exist",
    "Invalid color",
    "Invalid size",
    "out of stock",
    "Order items are required.",
    "Invalid product",
  ].some((pattern) => message.includes(pattern));
}

function shouldFallbackRpc(errorMessage: string, functionName: string) {
  return (
    errorMessage.includes(`Could not find the function public.${functionName}`) ||
    (errorMessage.includes("in the schema cache") &&
      errorMessage.includes(functionName))
  );
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
        colorName: color.name,
        size,
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

  // Trừ 1 để hoàn tác lượt sử dụng voucher khi đơn hàng thất bại
  const nextCount = Math.max(0, (voucher.usedCount ?? 0) - 1);
  await supabase
    .from("vouchers")
    .update({ used_count: nextCount })
    .eq("code", voucher.code);
}

function mapOrderPersistenceError(error: unknown): Error {
  if (error instanceof OrderInputError) {
    return error;
  }

  const message =
    error instanceof Error ? error.message : "Failed to persist order.";

  if (isOrderInputMessage(message)) {
    return new OrderInputError(message);
  }

  return new Error(message);
}

async function getProductColorRow(
  supabase: OrderSupabaseClient,
  productId: number,
  colorName: string,
) {
  const { data, error } = await supabase
    .from("product_colors")
    .select("id, product_id, name, stock_count")
    .eq("product_id", productId)
    .eq("name", colorName)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as Pick<
    ProductColorRow,
    "id" | "product_id" | "name" | "stock_count"
  > | null);
}

async function assertSizeStillAvailable(
  supabase: OrderSupabaseClient,
  item: ResolvedOrderItem,
  colorId: number,
) {
  const { data, error } = await supabase
    .from("product_sizes")
    .select("id")
    .eq("product_id", item.productId)
    .eq("size", item.size)
    .eq("available", true)
    .or(`color_id.eq.${colorId},color_id.is.null`)
    .limit(1);

  if (error) {
    throw new Error(error.message);
  }

  if (!data?.length) {
    throw new OrderInputError(`Invalid size for product ${item.productId}.`);
  }
}

async function syncProductStockCounts(
  supabase: OrderSupabaseClient,
  productIds: number[],
) {
  for (const productId of [...new Set(productIds)]) {
    const { data, error } = await supabase
      .from("product_colors")
      .select("stock_count")
      .eq("product_id", productId);

    if (error) {
      throw new Error(error.message);
    }

    const nextStockCount = (data ?? []).reduce(
      (sum, color) => sum + color.stock_count,
      0,
    );

    const { error: updateError } = await supabase
      .from("products")
      .update({ stock_count: nextStockCount })
      .eq("id", productId);

    if (updateError) {
      throw new Error(updateError.message);
    }
  }
}

async function reserveOrderItemStock(
  supabase: OrderSupabaseClient,
  item: ResolvedOrderItem,
): Promise<ReservedStockClaim> {
  for (let attempt = 0; attempt < MAX_STOCK_RESERVE_ATTEMPTS; attempt += 1) {
    const color = await getProductColorRow(supabase, item.productId, item.colorName);

    if (!color) {
      throw new OrderInputError(`Invalid color for product ${item.productId}.`);
    }

    await assertSizeStillAvailable(supabase, item, color.id);

    if (color.stock_count < item.qty) {
      throw new OrderInputError(
        `Selected color is out of stock for product ${item.productId}.`,
      );
    }

    const nextStockCount = color.stock_count - item.qty;
    const { data, error } = await supabase
      .from("product_colors")
      .update({ stock_count: nextStockCount })
      .eq("id", color.id)
      .eq("stock_count", color.stock_count)
      .select("id")
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      continue;
    }

    const disabledSizes = nextStockCount <= 0;
    if (disabledSizes) {
      const { error: sizeError } = await supabase
        .from("product_sizes")
        .update({ available: false })
        .eq("product_id", item.productId)
        .eq("color_id", color.id);

      if (sizeError) {
        await releaseReservedStock(supabase, {
          productId: item.productId,
          colorId: color.id,
          qty: item.qty,
          disabledSizes: false,
        });
        throw new Error(sizeError.message);
      }
    }

    return {
      productId: item.productId,
      colorId: color.id,
      qty: item.qty,
      disabledSizes,
    };
  }

  throw new Error(
    `Failed to reserve stock for product ${item.productId} because inventory changed concurrently.`,
  );
}

async function releaseReservedStock(
  supabase: OrderSupabaseClient,
  claim: ReservedStockClaim,
) {
  for (let attempt = 0; attempt < MAX_STOCK_RESERVE_ATTEMPTS; attempt += 1) {
    const { data, error } = await supabase
      .from("product_colors")
      .select("stock_count")
      .eq("id", claim.colorId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      return;
    }

    const { data: updatedColor, error: updateError } = await supabase
      .from("product_colors")
      .update({ stock_count: data.stock_count + claim.qty })
      .eq("id", claim.colorId)
      .eq("stock_count", data.stock_count)
      .select("id")
      .maybeSingle();

    if (updateError) {
      throw new Error(updateError.message);
    }

    if (!updatedColor) {
      continue;
    }

    if (claim.disabledSizes) {
      const { error: sizeError } = await supabase
        .from("product_sizes")
        .update({ available: true })
        .eq("product_id", claim.productId)
        .eq("color_id", claim.colorId);

      if (sizeError) {
        throw new Error(sizeError.message);
      }
    }

    return;
  }

  throw new Error(`Failed to release stock for product ${claim.productId}.`);
}

async function rollbackStockReservations(
  supabase: OrderSupabaseClient,
  claims: ReservedStockClaim[],
) {
  const issues: string[] = [];

  for (const claim of [...claims].reverse()) {
    try {
      await releaseReservedStock(supabase, claim);
    } catch (error) {
      issues.push(error instanceof Error ? error.message : "Stock rollback failed.");
    }
  }

  try {
    await syncProductStockCounts(
      supabase,
      claims.map((claim) => claim.productId),
    );
  } catch (error) {
    issues.push(
      error instanceof Error ? error.message : "Product stock sync failed.",
    );
  }

  return issues.length ? issues.join(" ") : null;
}

async function cleanupFailedOrder(
  supabase: OrderSupabaseClient,
  orderId: string,
) {
  const issues: string[] = [];

  const { error: itemDeleteError } = await supabase
    .from("order_items")
    .delete()
    .eq("order_id", orderId);
  if (itemDeleteError) {
    issues.push(itemDeleteError.message);
  }

  const { error: orderDeleteError } = await supabase
    .from("orders")
    .delete()
    .eq("id", orderId);
  if (orderDeleteError) {
    issues.push(orderDeleteError.message);
  }

  return issues.length ? issues.join(" ") : null;
}

async function createOrderWithFallback(args: {
  supabase: OrderSupabaseClient;
  orderNumber: string;
  customer: CheckoutCustomerInput;
  items: ResolvedOrderItem[];
  paymentMethod: PaymentMethod;
  voucherCode: string | null;
  discountPct: number;
  discountLabel: string | null;
  subtotal: number;
  discountAmount: number;
  shippingFee: number;
  total: number;
}) {
  const reservations: ReservedStockClaim[] = [];
  let orderId: string | null = null;

  try {
    for (const item of args.items) {
      reservations.push(await reserveOrderItemStock(args.supabase, item));
    }

    const orderInsert: OrderInsert = {
      order_number: args.orderNumber,
      customer_name: args.customer.name,
      customer_phone: args.customer.phone,
      customer_email: toNullable(args.customer.email),
      province: args.customer.province,
      district: toNullable(args.customer.district),
      ward: toNullable(args.customer.ward),
      address: args.customer.address,
      note: toNullable(args.customer.note),
      payment_method: args.paymentMethod,
      voucher_code: args.voucherCode,
      discount_pct: args.discountPct,
      discount_label: args.discountLabel,
      subtotal: args.subtotal,
      discount_amount: args.discountAmount,
      shipping_fee: args.shippingFee,
      total: args.total,
      status: "pending",
    };

    const { data: orderRecord, error: orderError } = await args.supabase
      .from("orders")
      .insert(orderInsert)
      .select("id")
      .single();

    if (orderError || !orderRecord?.id) {
      throw new Error(orderError?.message ?? "Failed to create order.");
    }

    orderId = orderRecord.id;
    const persistedOrderId = orderRecord.id;

    const orderItems: OrderItemInsert[] = args.items.map((item) => ({
      order_id: persistedOrderId,
      product_id: item.productId,
      product_name: item.name,
      product_href: item.href,
      variant_label: item.sub,
      qty: item.qty,
      unit_price: item.price,
      line_total: item.price * item.qty,
      bg_class: item.bgClass,
    }));

    const { error: orderItemsError } = await args.supabase
      .from("order_items")
      .insert(orderItems);

    if (orderItemsError) {
      throw new Error(orderItemsError.message);
    }

    await syncProductStockCounts(
      args.supabase,
      reservations.map((claim) => claim.productId),
    );
  } catch (error) {
    const cleanupIssues: string[] = [];

    if (orderId) {
      const orderCleanupIssue = await cleanupFailedOrder(args.supabase, orderId);
      if (orderCleanupIssue) {
        cleanupIssues.push(orderCleanupIssue);
      }
    }

    const rollbackIssue = await rollbackStockReservations(
      args.supabase,
      reservations,
    );
    if (rollbackIssue) {
      cleanupIssues.push(rollbackIssue);
    }

    if (cleanupIssues.length) {
      const baseMessage =
        error instanceof Error ? error.message : "Failed to persist order.";
      throw new Error(`${baseMessage} Cleanup failed: ${cleanupIssues.join(" ")}`);
    }

    throw error;
  }
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

  try {
    if (createGuestOrderWithStockRpcUnavailable) {
      await createOrderWithFallback({
        supabase,
        orderNumber,
        customer,
        items,
        paymentMethod: input.paymentMethod,
        voucherCode: voucher?.code ?? null,
        discountPct,
        discountLabel,
        subtotal,
        discountAmount,
        shippingFee,
        total,
      });
    } else {
      const { error: orderError } = await supabase.rpc(
        "create_guest_order_with_stock",
        {
          p_order_number: orderNumber,
          p_customer_name: customer.name,
          p_customer_phone: customer.phone,
          p_customer_email: toNullable(customer.email),
          p_province: customer.province,
          p_district: toNullable(customer.district),
          p_ward: toNullable(customer.ward),
          p_address: customer.address,
          p_note: toNullable(customer.note),
          p_payment_method: input.paymentMethod,
          p_voucher_code: voucher?.code ?? null,
          p_discount_pct: discountPct,
          p_discount_label: discountLabel,
          p_subtotal: subtotal,
          p_discount_amount: discountAmount,
          p_shipping_fee: shippingFee,
          p_total: total,
          p_items: items.map((item) => ({
            productId: item.productId,
            qty: item.qty,
            href: item.href,
            name: item.name,
            sub: item.sub,
            price: item.price,
            bgClass: item.bgClass,
            colorName: item.colorName,
            size: item.size,
          })),
        },
      );

      if (orderError) {
        if (shouldFallbackRpc(orderError.message, "create_guest_order_with_stock")) {
          createGuestOrderWithStockRpcUnavailable = true;
          await createOrderWithFallback({
            supabase,
            orderNumber,
            customer,
            items,
            paymentMethod: input.paymentMethod,
            voucherCode: voucher?.code ?? null,
            discountPct,
            discountLabel,
            subtotal,
            discountAmount,
            shippingFee,
            total,
          });
        } else {
          throw new Error(orderError.message);
        }
      }
    }
  } catch (error) {
    if (voucher) {
      await releaseVoucherUsage(voucher);
    }

    throw mapOrderPersistenceError(error);
  }

  return {
    orderNumber,
    persisted: true,
  };
}
