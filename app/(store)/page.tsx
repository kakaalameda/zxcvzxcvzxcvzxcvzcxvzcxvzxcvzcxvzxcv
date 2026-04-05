import { HomePage } from "@/components/home-page";
import { getStoreFeaturedProducts } from "@/lib/repositories/storefront";

export default async function Page() {
  return <HomePage featuredProducts={await getStoreFeaturedProducts()} />;
}
