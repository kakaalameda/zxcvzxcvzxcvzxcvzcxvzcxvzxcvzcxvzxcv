import { cache } from "react";
import {
  FEATURED_PRODUCT_IDS,
  PRODUCTS,
  VOUCHERS,
  getProductById as getProductByIdFromMock,
  getRelatedProducts as getRelatedProductsFromMock,
  type Product,
  type ProductColor,
  type ProductImage,
  type ProductSizeOption,
  type ProductSpec,
  type Voucher,
} from "@/lib/store";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

type ProductRow = Database["public"]["Tables"]["products"]["Row"];
type ProductColorRow = Database["public"]["Tables"]["product_colors"]["Row"];
type ProductSizeRow = Database["public"]["Tables"]["product_sizes"]["Row"];
type ProductSpecRow = Database["public"]["Tables"]["product_specs"]["Row"];
type ProductFeatureRow = Database["public"]["Tables"]["product_features"]["Row"];
type ProductImageRow = Database["public"]["Tables"]["product_images"]["Row"];
type VoucherRow = Database["public"]["Tables"]["vouchers"]["Row"];

type ProductQueryRow = ProductRow & {
  colors: ProductColorRow[] | null;
  sizes: ProductSizeRow[] | null;
  specs: ProductSpecRow[] | null;
  features: ProductFeatureRow[] | null;
  images: ProductImageRow[] | null;
};

interface CatalogProductRecord {
  product: Product;
  featured: boolean;
}

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
  colors:product_colors (
    id,
    product_id,
    name,
    hex,
    bg_class,
    position
  ),
  sizes:product_sizes (
    id,
    product_id,
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
    name: color.name,
    hex: color.hex,
    bgClass: color.bg_class,
  }));
}

function mapProductSizes(
  sizes: ProductSizeRow[] | null | undefined,
): ProductSizeOption[] {
  return sortByPosition(sizes).map((size) => ({
    size: size.size,
    available: size.available,
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
  }));
}

function mapSupabaseProduct(row: ProductQueryRow): CatalogProductRecord {
  return {
    featured: row.featured,
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

function isVoucherEligible(voucher: Voucher, now = new Date()): boolean {
  if (voucher.active === false) {
    return false;
  }

  if (
    typeof voucher.maxUses === "number" &&
    typeof voucher.usedCount === "number" &&
    voucher.usedCount >= voucher.maxUses
  ) {
    return false;
  }

  if (voucher.expiresAt && new Date(voucher.expiresAt) < now) {
    return false;
  }

  return true;
}

const loadSupabaseCatalog = cache(async (): Promise<CatalogProductRecord[] | null> => {
  const supabase = createSupabaseServerClient();
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true });

  if (error) {
    console.error("Failed to load products from Supabase:", error.message);
    return null;
  }

  const rows = (data as ProductQueryRow[] | null) ?? [];
  if (!rows.length) {
    return null;
  }

  return rows.map(mapSupabaseProduct);
});

const loadSupabaseVouchers = cache(async (): Promise<Voucher[] | null> => {
  const supabase = createSupabaseServerClient();
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("vouchers")
    .select(
      "code, pct, label, description, active, max_uses, used_count, expires_at, created_at",
    )
    .eq("active", true)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Failed to load vouchers from Supabase:", error.message);
    return null;
  }

  const rows = (data as VoucherRow[] | null) ?? [];
  if (!rows.length) {
    return null;
  }

  return rows.map((voucher) => ({
    code: voucher.code,
    pct: voucher.pct,
    label: voucher.label,
    desc: voucher.description,
    active: voucher.active,
    maxUses: voucher.max_uses,
    usedCount: voucher.used_count,
    expiresAt: voucher.expires_at,
  })).filter((voucher) => isVoucherEligible(voucher));
});

export async function getStoreProducts(): Promise<Product[]> {
  const catalog = await loadSupabaseCatalog();
  return catalog?.map((entry) => entry.product) ?? PRODUCTS;
}

export async function getStoreFeaturedProducts(limit = 4): Promise<Product[]> {
  const catalog = await loadSupabaseCatalog();
  if (!catalog) {
    return FEATURED_PRODUCT_IDS
      .map((id) => PRODUCTS.find((product) => product.id === id))
      .filter((product): product is Product => Boolean(product))
      .slice(0, limit);
  }

  const featured = catalog
    .filter((entry) => entry.featured)
    .map((entry) => entry.product);

  return (featured.length ? featured : catalog.map((entry) => entry.product)).slice(0, limit);
}

export async function getStoreProductById(id: string): Promise<Product | undefined> {
  const catalog = await loadSupabaseCatalog();
  if (catalog) {
    return catalog.find((entry) => String(entry.product.id) === id)?.product;
  }

  return getProductByIdFromMock(id);
}

export async function getStoreRelatedProducts(
  productId: number,
  limit = 4,
): Promise<Product[]> {
  const catalog = await loadSupabaseCatalog();
  if (!catalog) {
    return getRelatedProductsFromMock(productId, limit);
  }

  const products = catalog.map((entry) => entry.product);
  const current = products.find((product) => product.id === productId);

  if (!current) {
    return products.slice(0, limit);
  }

  const sameCategory = products.filter(
    (product) => product.category === current.category && product.id !== current.id,
  );
  const fallback = products.filter(
    (product) => product.category !== current.category && product.id !== current.id,
  );

  return [...sameCategory, ...fallback].slice(0, limit);
}

export async function getStoreVouchers(): Promise<Voucher[]> {
  return (await loadSupabaseVouchers()) ?? VOUCHERS;
}

export async function getStoreVoucherByCode(code: string): Promise<Voucher | null> {
  const normalized = code.trim().toUpperCase();
  if (!normalized) {
    return null;
  }

  const vouchers = await getStoreVouchers();
  return (
    vouchers.find((voucher) => voucher.code === normalized && isVoucherEligible(voucher)) ??
    null
  );
}
