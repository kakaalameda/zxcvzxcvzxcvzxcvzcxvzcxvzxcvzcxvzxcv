import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import type { Product, ProductImage, ProductType } from "@/lib/store";
import {
  parseColorsText,
  parseFeaturesText,
  parseSpecsText,
  type AdminProductPayload,
} from "@/lib/validations/admin";

type AdminSupabaseClient = SupabaseClient<Database>;

type ProductRow = Database["public"]["Tables"]["products"]["Row"];
type ProductColorRow = Database["public"]["Tables"]["product_colors"]["Row"];
type ProductSizeRow = Database["public"]["Tables"]["product_sizes"]["Row"];
type ProductSpecRow = Database["public"]["Tables"]["product_specs"]["Row"];
type ProductFeatureRow = Database["public"]["Tables"]["product_features"]["Row"];
type ProductImageRow = Database["public"]["Tables"]["product_images"]["Row"];
type ProductImageInsert = Database["public"]["Tables"]["product_images"]["Insert"];

type ProductQueryRow = ProductRow & {
  colors: ProductColorRow[] | null;
  sizes: ProductSizeRow[] | null;
  specs: ProductSpecRow[] | null;
  features: ProductFeatureRow[] | null;
  images: ProductImageRow[] | null;
};

export interface AdminProductRecord extends Product {
  featured: boolean;
  sortOrder: number;
  imageUrls: string[];
}

const ALL_SIZES = ["S", "M", "L", "XL", "XXL"] as const;
const PRODUCT_IMAGE_LABELS = ["Front view", "Back view", "Detail shot", "Lifestyle"];

const DEFAULT_ICON_PATHS: Record<ProductType, string> = {
  Tee: "M20.38 3.46L16 2a4 4 0 01-8 0L3.62 3.46a2 2 0 00-1.34 2.23l.58 3.57a1 1 0 00.99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 002-2V10h2.15a1 1 0 00.99-.84l.58-3.57a2 2 0 00-1.34-2.23z",
  Hoodie: "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2zM9 22V12h6v10",
  Pants: "M5 2h14l-2 20h-4l-1-10-1 10H7L5 2z",
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

function sortByPosition<T extends { position: number }>(items: T[] | null | undefined) {
  return [...(items ?? [])].sort((left, right) => left.position - right.position);
}

function mapImages(images: ProductImageRow[] | null | undefined): ProductImage[] {
  return sortByPosition(images).map((image) => ({
    id: image.id,
    alt: image.alt,
    bgClass: image.bg_class,
    iconPath: image.icon_path,
    imageUrl: image.image_url ?? undefined,
  }));
}

function mapAdminProduct(row: ProductQueryRow): AdminProductRecord {
  const images = mapImages(row.images);

  return {
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
    featured: row.featured,
    sortOrder: row.sort_order,
    colors: sortByPosition(row.colors).map((color) => ({
      name: color.name,
      hex: color.hex,
      bgClass: color.bg_class,
    })),
    sizes: sortByPosition(row.sizes).map((size) => ({
      size: size.size,
      available: size.available,
    })),
    specs: sortByPosition(row.specs).map((spec) => ({
      label: spec.label,
      value: spec.value,
    })),
    features: sortByPosition(row.features).map((feature) => feature.value),
    images,
    imageUrls: images.map((image) => image.imageUrl).filter((value): value is string => Boolean(value)),
  };
}

function buildImageRows(
  payload: AdminProductPayload,
  productId: number,
): ProductImageInsert[] {
  const colors = parseColorsText(payload.colorsText);
  const primaryBgClass = colors[0]?.bgClass ?? "from-[#111111] to-[#222222]";
  const iconPath = DEFAULT_ICON_PATHS[payload.category];

  if (payload.imageUrls.length) {
    return payload.imageUrls.map((imageUrl, index) => ({
      product_id: productId,
      alt: PRODUCT_IMAGE_LABELS[index] ?? `Product image ${index + 1}`,
      bg_class: colors[index % colors.length]?.bgClass ?? primaryBgClass,
      icon_path: iconPath,
      image_url: imageUrl,
      position: index,
    }));
  }

  return PRODUCT_IMAGE_LABELS.map((alt, index) => ({
    product_id: productId,
    alt,
    bg_class: colors[index % colors.length]?.bgClass ?? primaryBgClass,
    icon_path: iconPath,
    image_url: null,
    position: index,
  }));
}

export async function getAdminProducts(supabase: AdminSupabaseClient) {
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return ((data as ProductQueryRow[] | null) ?? []).map(mapAdminProduct);
}

export async function upsertAdminProduct(
  supabase: AdminSupabaseClient,
  payload: AdminProductPayload,
  productId?: number,
) {
  const colors = parseColorsText(payload.colorsText);
  const specs = parseSpecsText(payload.specsText);
  const features = parseFeaturesText(payload.featuresText);

  const productMutation = {
    name: payload.name,
    subtitle: payload.subtitle,
    category: payload.category,
    description: payload.description,
    price: payload.price,
    old_price: payload.oldPrice ?? null,
    tag: payload.tag || null,
    tag_variant: payload.tagVariant ?? null,
    rating: payload.rating,
    review_count: payload.reviewCount,
    stock_count: payload.stockCount,
    featured: payload.featured,
    sort_order: payload.sortOrder,
  };

  const baseProductId = productId
    ? productId
    : (
        await supabase
          .from("products")
          .insert(productMutation)
          .select("id")
          .single()
      ).data?.id;

  if (!baseProductId) {
    throw new Error("Failed to create product.");
  }

  if (productId) {
    const { error } = await supabase.from("products").update(productMutation).eq("id", productId);
    if (error) {
      throw new Error(error.message);
    }
  }

  await Promise.all([
    supabase.from("product_colors").delete().eq("product_id", baseProductId),
    supabase.from("product_sizes").delete().eq("product_id", baseProductId),
    supabase.from("product_specs").delete().eq("product_id", baseProductId),
    supabase.from("product_features").delete().eq("product_id", baseProductId),
    supabase.from("product_images").delete().eq("product_id", baseProductId),
  ]);

  const colorRows = colors.map((color, index) => ({
    product_id: baseProductId,
    name: color.name,
    hex: color.hex,
    bg_class: color.bgClass,
    position: index,
  }));

  const sizeRows = ALL_SIZES.map((size, index) => ({
    product_id: baseProductId,
    size,
    available: payload.sizes.includes(size),
    position: index,
  }));

  const specRows = specs.map((spec, index) => ({
    product_id: baseProductId,
    label: spec.label,
    value: spec.value,
    position: index,
  }));

  const featureRows = features.map((feature, index) => ({
    product_id: baseProductId,
    value: feature,
    position: index,
  }));

  const imageRows = buildImageRows(payload, baseProductId);

  const results = await Promise.all([
    supabase.from("product_colors").insert(colorRows),
    supabase.from("product_sizes").insert(sizeRows),
    supabase.from("product_specs").insert(specRows),
    featureRows.length
      ? supabase.from("product_features").insert(featureRows)
      : Promise.resolve({ error: null }),
    supabase.from("product_images").insert(imageRows),
  ]);

  const failed = results.find((result) => result.error);
  if (failed?.error) {
    throw new Error(failed.error.message);
  }

  return baseProductId;
}

export async function deleteAdminProduct(
  supabase: AdminSupabaseClient,
  productId: number,
) {
  const { error } = await supabase.from("products").delete().eq("id", productId);
  if (error) {
    throw new Error(error.message);
  }
}
