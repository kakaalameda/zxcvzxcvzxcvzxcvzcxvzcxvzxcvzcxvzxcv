import { HomePage } from "@/components/home-page";
import { getStoreFeaturedProducts, getStoreProducts } from "@/lib/repositories/storefront";

export default async function Page() {
  const [featuredProducts, products] = await Promise.all([
    getStoreFeaturedProducts(),
    getStoreProducts(),
  ]);

  return <HomePage featuredProducts={featuredProducts} products={products} />;
}
