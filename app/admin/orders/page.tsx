import { OrdersPage } from "@/components/admin/orders-page";
import { requireAdminPageAccess } from "@/lib/auth/admin";
import { getAdminOrders } from "@/lib/repositories/admin-orders";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const { supabase } = await requireAdminPageAccess();
  const orders = await getAdminOrders(supabase);

  return <OrdersPage initialOrders={orders} />;
}
