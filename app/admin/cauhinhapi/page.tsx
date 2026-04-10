import { ShippingConfigPage } from "@/components/admin/shipping-config-page";
import { requireAdminPageAccess } from "@/lib/auth/admin";
import { getAdminShippingConfig } from "@/lib/repositories/admin-shipping-config";

export default async function AdminShippingConfigRoute() {
  const { supabase } = await requireAdminPageAccess();
  const config = await getAdminShippingConfig(supabase);

  return <ShippingConfigPage initialConfig={config} />;
}
