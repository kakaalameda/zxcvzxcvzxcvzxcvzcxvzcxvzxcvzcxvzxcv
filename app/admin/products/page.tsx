import { ProductsPage } from "@/components/admin/products-page";
import { requireAdminPageAccess } from "@/lib/auth/admin";
import { getAdminProducts } from "@/lib/repositories/admin-products";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const { supabase } = await requireAdminPageAccess();
  const products = await getAdminProducts(supabase);

  return <ProductsPage initialProducts={products} />;
}
