import type { SupabaseClient } from "@supabase/supabase-js";
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

  return ((data as OrderQueryRow[] | null) ?? []).map(mapOrder);
}

export async function pushOrderToGHN(orderId: string) {
  void orderId;
  return;
}

export async function confirmAdminOrder(
  supabase: AdminSupabaseClient,
  orderId: string,
  trackingCode?: string,
) {
  const normalizedTrackingCode = trackingCode?.trim() || null;

  const { data: currentOrder, error: currentOrderError } = await supabase
    .from("orders")
    .select("id, status")
    .eq("id", orderId)
    .single();

  if (currentOrderError || !currentOrder) {
    throw new Error(currentOrderError?.message ?? "Order not found.");
  }

  if (currentOrder.status !== "pending") {
    throw new Error("Only pending orders can be confirmed.");
  }

  const { error } = await supabase
    .from("orders")
    .update({
      status: "confirmed",
      tracking_code: normalizedTrackingCode,
    })
    .eq("id", orderId);

  if (error) {
    throw new Error(error.message);
  }

  await pushOrderToGHN(orderId);
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

  return ((data as OrderQueryRow[] | null) ?? []).map(mapOrder);
}
