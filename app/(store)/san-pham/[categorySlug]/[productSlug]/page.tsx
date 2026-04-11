import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ProductDetailView } from "@/components/product-detail-view";
import {
  getStoreProductBySlug,
  getStoreRelatedProducts,
} from "@/lib/repositories/storefront";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{
    categorySlug: string;
    productSlug: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { productSlug } = await params;
  const product = await getStoreProductBySlug(productSlug);

  if (!product) {
    return { title: "Sản phẩm không tìm thấy | Nghe Hustle" };
  }

  return {
    title: `${product.name} | Nghe Hustle`,
    description: product.subtitle,
    openGraph: {
      title: `${product.name} | Nghe Hustle`,
      description: product.subtitle,
      images: product.images[0]?.imageUrl
        ? [{ url: product.images[0].imageUrl }]
        : [],
    },
  };
}

export default async function SanPhamPage({ params }: PageProps) {
  const { productSlug } = await params;
  const product = await getStoreProductBySlug(productSlug);

  if (!product) {
    notFound();
  }

  const relatedProducts = await getStoreRelatedProducts(product.id);

  return <ProductDetailView product={product} relatedProducts={relatedProducts} />;
}
