import { requireAdminPageAccess } from "@/lib/auth/admin";
import { getAdminLookbookSections } from "@/lib/repositories/admin-lookbook";
import { getAdminProducts } from "@/lib/repositories/admin-products";
import { LookbookPage } from "@/components/admin/lookbook-page";

export const dynamic = "force-dynamic";

export default async function AdminLookbookRoute() {
  const { supabase } = await requireAdminPageAccess();

  const [sections, allProducts] = await Promise.all([
    getAdminLookbookSections(supabase).catch(() => []),
    getAdminProducts(supabase).catch(() => []),
  ]);

  const products = allProducts.map((p) => ({
    id: p.id,
    name: p.name,
    subtitle: p.subtitle,
  }));

  return <LookbookPage initialSections={sections} products={products} />;
}
