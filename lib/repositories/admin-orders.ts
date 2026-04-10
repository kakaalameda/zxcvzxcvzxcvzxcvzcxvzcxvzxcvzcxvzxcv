import type { SupabaseClient } from "@supabase/supabase-js";
import { cancelGhtkOrder, createGhtkOrder } from "@/lib/integrations/ghtk";
import { getAdminShippingConfig } from "@/lib/repositories/admin-shipping-config";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/types";

type AdminSupabaseClient = SupabaseClient<Database>;

type OrderRow = Database["public"]["Tables"]["orders"]["Row"];
type OrderItemRow = Database["public"]["Tables"]["order_items"]["Row"];

type OrderQueryRow = OrderRow & {
  items: OrderItemRow[] | null;
};

export interface AdminOrderRecord {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  province: string;
  district: string | null;
  ward: string | null;
  address: string;
  note: string | null;
  paymentMethod: "cod" | "qr";
  voucherCode: string | null;
  discountPct: number;
  discountLabel: string | null;
  subtotal: number;
  discountAmount: number;
  shippingFee: number;
  total: number;
  status: "pending" | "confirmed" | "shipped" | "cancelled";
  trackingCode: string | null;
  createdAt: string;
  items: OrderItemRow[];
}

export interface AdminOrderActionResult {
  status: AdminOrderRecord["status"];
  trackingCode: string | null;
  message: string;
}

const ORDER_SELECT = `
  id,
  order_number,
  customer_name,
  customer_phone,
  customer_email,
  province,
  district,
  ward,
  address,
  note,
  payment_method,
  voucher_code,
  discount_pct,
  discount_label,
  subtotal,
  discount_amount,
  shipping_fee,
  total,
  status,
  tracking_code,
  created_at,
  items:order_items (
    id,
    order_id,
    product_id,
    product_name,
    product_href,
    variant_label,
    qty,
    unit_price,
    line_total,
    bg_class,
    created_at
  )
`;

function mapOrder(row: OrderQueryRow): AdminOrderRecord {
  return {
    id: row.id,
    orderNumber: row.order_number,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    customerEmail: row.customer_email,
    province: row.province,
    district: row.district,
    ward: row.ward,
    address: row.address,
    note: row.note,
    paymentMethod: row.payment_method,
    voucherCode: row.voucher_code,
    discountPct: row.discount_pct,
    discountLabel: row.discount_label,
    subtotal: row.subtotal,
    discountAmount: row.discount_amount,
    shippingFee: row.shipping_fee,
    total: row.total,
    status: row.status,
    trackingCode: row.tracking_code,
    createdAt: row.created_at,
    items: row.items ?? [],
  };
}

export async function getAdminOrders(supabase: AdminSupabaseClient) {
  const { data, error } = await supabase
    .from("orders")
    .select(ORDER_SELECT)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return ((data as unknown as OrderQueryRow[] | null) ?? []).map(mapOrder);
}

async function getAdminOrderById(
  supabase: AdminSupabaseClient,
  orderId: string,
): Promise<AdminOrderRecord> {
  const { data, error } = await supabase
    .from("orders")
    .select(ORDER_SELECT)
    .eq("id", orderId)
    .maybeSingle();

  if (error || !data) {
    throw new Error(error?.message ?? "Order not found.");
  }

  return mapOrder(data as unknown as OrderQueryRow);
}

async function updateOrderState(
  supabase: AdminSupabaseClient,
  orderId: string,
  values: Pick<
    Database["public"]["Tables"]["orders"]["Update"],
    "status" | "tracking_code"
  >,
) {
  const { error } = await supabase.from("orders").update(values).eq("id", orderId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function confirmAdminOrder(
  supabase: AdminSupabaseClient,
  orderId: string,
  trackingCode?: string,
) {
  const normalizedTrackingCode = trackingCode?.trim() || null;
  const currentOrder = await getAdminOrderById(supabase, orderId);

  if (currentOrder.status !== "pending") {
    throw new Error("Only pending orders can be confirmed.");
  }

  const shippingConfig = await getAdminShippingConfig(supabase);
  if (!shippingConfig) {
    throw new Error("Please configure GHTK first at /admin/cauhinhapi.");
  }

  const shipment = await createGhtkOrder(shippingConfig, {
    orderNumber: currentOrder.orderNumber,
    customerName: currentOrder.customerName,
    customerPhone: currentOrder.customerPhone,
    province: currentOrder.province,
    district: currentOrder.district,
    ward: currentOrder.ward,
    address: currentOrder.address,
    note: currentOrder.note,
    paymentMethod: currentOrder.paymentMethod,
    subtotal: currentOrder.subtotal,
    total: currentOrder.total,
    shippingFee: currentOrder.shippingFee,
    items: currentOrder.items.map((item) => ({
      productId: item.product_id,
      productName: item.product_name,
      qty: item.qty,
      unitPrice: item.unit_price,
    })),
  });

  const nextTrackingCode = shipment.trackingCode ?? normalizedTrackingCode;

  await updateOrderState(supabase, orderId, {
    status: "confirmed",
    tracking_code: nextTrackingCode,
  });

  return {
    status: "confirmed" as const,
    trackingCode: nextTrackingCode,
    message: shipment.message,
  };
}

export async function cancelAdminOrder(
  supabase: AdminSupabaseClient,
  orderId: string,
): Promise<AdminOrderActionResult> {
  const currentOrder = await getAdminOrderById(supabase, orderId);

  if (currentOrder.status === "cancelled") {
    throw new Error("Order is already cancelled.");
  }

  if (currentOrder.status === "shipped") {
    throw new Error("Shipped orders cannot be cancelled from this screen.");
  }

  if (currentOrder.status === "confirmed") {
    const shippingConfig = await getAdminShippingConfig(supabase);
    if (!shippingConfig) {
      throw new Error("Please configure GHTK first at /admin/cauhinhapi.");
    }

    await cancelGhtkOrder({
      config: shippingConfig,
      trackingCode: currentOrder.trackingCode,
      partnerOrderCode: currentOrder.orderNumber,
    });
  }

  await updateOrderState(supabase, orderId, {
    status: "cancelled",
    tracking_code: currentOrder.trackingCode,
  });

  return {
    status: "cancelled",
    trackingCode: currentOrder.trackingCode,
    message:
      currentOrder.status === "confirmed"
        ? "Order cancelled on GHTK and locally."
        : "Pending order cancelled locally.",
  };
}

export async function findOrdersByPhone(phone: string) {
  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    throw new Error("Supabase admin client is not available.");
  }

  const normalizedPhone = phone.replace(/\s+/g, "");

  const { data, error } = await supabase
    .from("orders")
    .select(ORDER_SELECT)
    .eq("customer_phone", normalizedPhone)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return ((data as unknown as OrderQueryRow[] | null) ?? []).map(mapOrder);
}

export async function findTrackOrder(
  phone: string,
  orderNumber: string,
): Promise<AdminOrderRecord | null> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    throw new Error("Supabase admin client is not available.");
  }

  const normalizedPhone = phone.replace(/\s+/g, "");
  const normalizedOrderNumber = orderNumber.trim().toUpperCase();

  const { data, error } = await supabase
    .from("orders")
    .select(ORDER_SELECT)
    .eq("customer_phone", normalizedPhone)
    .eq("order_number", normalizedOrderNumber)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? mapOrder(data as unknown as OrderQueryRow) : null;
}
