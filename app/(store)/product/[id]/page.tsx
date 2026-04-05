import { notFound } from "next/navigation";
import { ProductDetailView } from "@/components/product-detail-view";
import {
  getStoreProductById,
  getStoreRelatedProducts,
} from "@/lib/repositories/storefront";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getStoreProductById(id);

  if (!product) {
    notFound();
  }

  const relatedProducts = await getStoreRelatedProducts(product.id);

  return <ProductDetailView product={product} relatedProducts={relatedProducts} />;
}
