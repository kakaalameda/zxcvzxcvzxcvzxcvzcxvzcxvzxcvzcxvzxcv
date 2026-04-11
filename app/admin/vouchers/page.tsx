import { VouchersPage } from "@/components/admin/vouchers-page";
import { requireAdminPageAccess } from "@/lib/auth/admin";
import { getAdminVouchers } from "@/lib/repositories/admin-vouchers";

export const dynamic = "force-dynamic";

export default async function AdminVouchersPage() {
  const { supabase } = await requireAdminPageAccess();
  const vouchers = await getAdminVouchers(supabase);

  return <VouchersPage initialVouchers={vouchers} />;
}
