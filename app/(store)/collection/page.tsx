import { CollectionPage } from "@/components/collection-page";
import { getStoreProducts, getStoreVouchers } from "@/lib/repositories/storefront";

export default async function Page() {
  const [products, vouchers] = await Promise.all([
    getStoreProducts(),
    getStoreVouchers(),
  ]);

  return <CollectionPage products={products} vouchers={vouchers} />;
}
