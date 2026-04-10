import "server-only";

import { createServerClient } from "@supabase/ssr";
import { unstable_cache } from "next/cache";
import { cache } from "react";
import {
  FEATURED_PRODUCT_IDS,
  PRODUCTS,
  getRelatedProducts as getRelatedProductsFromMock,
  type Product,
  type ProductColor,
  type ProductImage,
  type ProductSizeOption,
  type ProductSpec,
} from "@/lib/store";
import { getSupabasePublicEnv } from "@/lib/supabase/env";
import type { Database } from "@/lib/supabase/types";

type ProductRow = Database["public"]["Tables"]["products"]["Row"];
type ProductColorRow = Database["public"]["Tables"]["product_colors"]["Row"];
type ProductSizeRow = Database["public"]["Tables"]["product_sizes"]["Row"];
type ProductSpecRow = Database["public"]["Tables"]["product_specs"]["Row"];
type ProductFeatureRow = Database["public"]["Tables"]["product_features"]["Row"];
type ProductImageRow = Database["public"]["Tables"]["product_images"]["Row"];

type ProductQueryRow = ProductRow & {
  colors: ProductColorRow[] | null;
  sizes: ProductSizeRow[] | null;
  specs: ProductSpecRow[] | null;
  features: ProductFeatureRow[] | null;
  images: ProductImageRow[] | null;
};

type ProductCatalogRecord = {
  product: Product;
  featured: boolean;
  sortOrder: number;
};

const PRODUCT_SELECT = `
  id,
  name,
  subtitle,
  category,
  description,
  price,
  old_price,
  tag,
  tag_variant,
  rating,
  review_count,
  stock_count,
  featured,
  sort_order,
  created_at,
  colors:product_colors (
    id,
    product_id,
    name,
    hex,
    bg_class,
    stock_count,
    position
  ),
  sizes:product_sizes (
    id,
    product_id,
    color_id,
    size,
    available,
    position
  ),
  specs:product_specs (
    id,
    product_id,
    label,
    value,
    position
  ),
  features:product_features (
    id,
    product_id,
    value,
    position
  ),
  images:product_images (
    id,
    product_id,
    color_id,
    alt,
    bg_class,
    icon_path,
    image_url,
    position
  )
`;

function sortByPosition<T extends { position: number }>(
  items: T[] | null | undefined,
): T[] {
  return [...(items ?? [])].sort((left, right) => left.position - right.position);
}

function mapProductColors(colors: ProductColorRow[] | null | undefined): ProductColor[] {
  return sortByPosition(colors).map((color) => ({
    id: color.id,
    name: color.name,
    hex: color.hex,
    bgClass: color.bg_class,
    stockCount: color.stock_count,
  }));
}

function mapProductSizes(
  sizes: ProductSizeRow[] | null | undefined,
): ProductSizeOption[] {
  const sortedSizes = sortByPosition(sizes);

  return [...new Set(sortedSizes.map((size) => size.size))].map((size) => ({
    size,
    available: sortedSizes.some((entry) => entry.size === size && entry.available),
  }));
}

function mapProductSpecs(specs: ProductSpecRow[] | null | undefined): ProductSpec[] {
  return sortByPosition(specs).map((spec) => ({
    label: spec.label,
    value: spec.value,
  }));
}

function mapProductImages(images: ProductImageRow[] | null | undefined): ProductImage[] {
  return sortByPosition(images).map((image) => ({
    id: image.id,
    alt: image.alt,
    bgClass: image.bg_class,
    iconPath: image.icon_path,
    imageUrl: image.image_url ?? undefined,
    colorId: image.color_id ?? undefined,
  }));
}

function mapProductRecord(row: ProductQueryRow): ProductCatalogRecord {
  return {
    featured: row.featured,
    sortOrder: row.sort_order,
    product: {
      id: row.id,
      name: row.name,
      subtitle: row.subtitle,
      category: row.category,
      description: row.description,
      price: row.price,
      oldPrice: row.old_price ?? undefined,
      tag: row.tag ?? undefined,
      tagVariant: row.tag_variant ?? undefined,
      rating: row.rating,
      reviewCount: row.review_count,
      stockCount: row.stock_count,
      colors: mapProductColors(row.colors),
      sizes: mapProductSizes(row.sizes),
      specs: mapProductSpecs(row.specs),
      features: sortByPosition(row.features).map((feature) => feature.value),
      images: mapProductImages(row.images),
    },
  };
}

function getFallbackCatalog(): ProductCatalogRecord[] {
  return PRODUCTS.map((product, index) => ({
    product,
    featured: FEATURED_PRODUCT_IDS.includes(product.id),
    sortOrder: index,
  }));
}

function buildCachedFetch(tags: string[]): typeof fetch {
  return (input, init) => {
    const currentInit = init as RequestInit & {
      next?: {
        revalidate?: number;
        tags?: string[];
      };
    };

    return fetch(input, {
      ...currentInit,
      next: {
        ...currentInit?.next,
        revalidate: 3600,
        tags: Array.from(new Set([...(currentInit?.next?.tags ?? []), ...tags])),
      },
    });
  };
}

async function fetchProductsFromSupabase(): Promise<ProductCatalogRecord[]> {
  const env = getSupabasePublicEnv();
  if (!env) {
    console.error(
      "[Products Server]: Thieu bien moi truong Supabase public, su dung du lieu fallback.",
    );
    return getFallbackCatalog();
  }

  const supabase = createServerClient<Database>(env.url, env.publishableKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      fetch: buildCachedFetch(["store:products"]),
    },
    cookies: {
      getAll() {
        return [];
      },
      setAll() {},
    },
  });

  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true });

  if (error) {
    console.error("[Products Server]: Khong the tai san pham tu Supabase.", error);
    return getFallbackCatalog();
  }

  const rows = (data as unknown as ProductQueryRow[] | null) ?? [];
  return rows.length ? rows.map(mapProductRecord) : getFallbackCatalog();
}

const getCachedProductCatalog = unstable_cache(
  fetchProductsFromSupabase,
  ["store:products:catalog"],
  {
    revalidate: 3600,
    tags: ["store:products"],
  },
);

export const getProducts = cache(async (): Promise<Product[]> => {
  const catalog = await getCachedProductCatalog();
  return catalog.map((entry) => entry.product);
});

export const getFeaturedProducts = cache(async (limit = 4): Promise<Product[]> => {
  const catalog = await getCachedProductCatalog();
  const featured = catalog
    .filter((entry) => entry.featured)
    .map((entry) => entry.product);

  return (featured.length ? featured : catalog.map((entry) => entry.product)).slice(0, limit);
});

export const getProductById = cache(async (id: string): Promise<Product | undefined> => {
  const products = await getProducts();
  return products.find((product) => String(product.id) === id);
});

export async function getRelatedProducts(
  productId: number,
  limit = 4,
): Promise<Product[]> {
  const products = await getProducts();
  const current = products.find((product) => product.id === productId);

  if (!current) {
    return getRelatedProductsFromMock(productId, limit);
  }

  const sameCategory = products.filter(
    (product) => product.category === current.category && product.id !== current.id,
  );
  const fallback = products.filter(
    (product) => product.category !== current.category && product.id !== current.id,
  );

  return [...sameCategory, ...fallback].slice(0, limit);
}
