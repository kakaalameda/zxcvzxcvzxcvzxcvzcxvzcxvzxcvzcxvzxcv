import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getPredefinedProductColor,
  PREDEFINED_PRODUCT_COLORS,
  PRODUCT_SIZES,
  type PredefinedProductColorName,
} from "@/lib/product-config";
import type { Database } from "@/lib/supabase/types";
import type {
  ProductSize,
  ProductSpec,
  ProductTagVariant,
  ProductType,
} from "@/lib/store";
import {
  parseFeaturesText,
  parseSpecsText,
  type AdminProductColorVariantPayload,
  type AdminProductImagePayload,
  type AdminProductPayload,
} from "@/lib/validations/admin";

type AdminSupabaseClient = SupabaseClient<Database>;

type ProductRow = Database["public"]["Tables"]["products"]["Row"];
type ProductColorRow = Database["public"]["Tables"]["product_colors"]["Row"];
type ProductSizeRow = Database["public"]["Tables"]["product_sizes"]["Row"];
type ProductSpecRow = Database["public"]["Tables"]["product_specs"]["Row"];
type ProductFeatureRow = Database["public"]["Tables"]["product_features"]["Row"];
type ProductImageRow = Database["public"]["Tables"]["product_images"]["Row"];
type ProductColorInsert = Database["public"]["Tables"]["product_colors"]["Insert"];
type ProductSizeInsert = Database["public"]["Tables"]["product_sizes"]["Insert"];
type ProductSpecInsert = Database["public"]["Tables"]["product_specs"]["Insert"];
type ProductFeatureInsert =
  Database["public"]["Tables"]["product_features"]["Insert"];
type ProductImageInsert = Database["public"]["Tables"]["product_images"]["Insert"];

type ProductQueryRow = ProductRow & {
  colors: ProductColorRow[] | null;
  sizes: ProductSizeRow[] | null;
  specs: ProductSpecRow[] | null;
  features: ProductFeatureRow[] | null;
  images: ProductImageRow[] | null;
};

export interface AdminProductImageRecord {
  url: string;
  assignedColorName: PredefinedProductColorName | null;
}

export interface AdminProductColorVariantRecord {
  colorName: PredefinedProductColorName;
  stockCount: number;
  sizes: ProductSize[];
  images: AdminProductImageRecord[];
}

export interface AdminProductRecord {
  id: number;
  name: string;
  subtitle: string;
  category: ProductType;
  description: string;
  price: number;
  oldPrice: number | null;
  tag: string;
  tagVariant: ProductTagVariant | null;
  rating: number;
  reviewCount: number;
  stockCount: number;
  featured: boolean;
  sortOrder: number;
  slug: string | null;
  isActive: boolean;
  specs: ProductSpec[];
  features: string[];
  generalImages: AdminProductImageRecord[];
  colorVariants: AdminProductColorVariantRecord[];
}

const DEFAULT_ICON_PATHS: Record<ProductType, string> = {
  Tee: "M20.38 3.46L16 2a4 4 0 01-8 0L3.62 3.46a2 2 0 00-1.34 2.23l.58 3.57a1 1 0 00.99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 002-2V10h2.15a1 1 0 00.99-.84l.58-3.57a2 2 0 00-1.34-2.23z",
  Hoodie: "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2zM9 22V12h6v10",
  Pants: "M5 2h14l-2 20h-4l-1-10-1 10H7L5 2z",
};

const PRODUCT_RELATIONS = `
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

/** Select without new columns — fallback if migration hasn't run yet */
const PRODUCT_SELECT_BASE = `
  id, name, subtitle, category, description, price, old_price, tag, tag_variant,
  rating, review_count, stock_count, featured, sort_order, created_at,
  ${PRODUCT_RELATIONS}
`;

/** Select including new columns added by the categories migration */
const PRODUCT_SELECT = `
  id, name, subtitle, category, description, price, old_price, tag, tag_variant,
  rating, review_count, stock_count, featured, sort_order, slug, is_active, created_at,
  ${PRODUCT_RELATIONS}
`;

function sortByPosition<T extends { position: number }>(
  items: T[] | null | undefined,
) {
  return [...(items ?? [])].sort((left, right) => left.position - right.position);
}

function resolvePredefinedColor(name: string) {
  const color = getPredefinedProductColor(name);
  if (color) {
    return color;
  }

  console.error(
    `[Admin Products]: Mau '${name}' khong nam trong PREDEFINED_PRODUCT_COLORS. Tam thoi dung mau dau tien.`,
  );
  return PREDEFINED_PRODUCT_COLORS[0];
}

function shouldFallbackRpc(errorMessage: string, functionName: string) {
  return (
    errorMessage.includes(`Could not find the function public.${functionName}`) ||
    (errorMessage.includes("in the schema cache") &&
      errorMessage.includes(functionName))
  );
}

let adminUpsertProductRpcUnavailable = false;

function mapImageRecord(
  image: ProductImageRow,
  colorsById: Map<number, ProductColorRow>,
): AdminProductImageRecord | null {
  if (!image.image_url) {
    return null;
  }

  const assignedColorName = image.color_id
    ? resolvePredefinedColor(colorsById.get(image.color_id)?.name ?? "").name
    : null;

  return {
    url: image.image_url,
    assignedColorName,
  };
}

function mapAdminProduct(row: ProductQueryRow): AdminProductRecord {
  const colors = sortByPosition(row.colors);
  const sizes = sortByPosition(row.sizes).filter((size) => size.available);
  const images = sortByPosition(row.images);
  const colorsById = new Map(colors.map((color) => [color.id, color]));

  const generalImages = images
    .filter((image) => image.color_id == null)
    .map((image) => mapImageRecord(image, colorsById))
    .filter((image): image is AdminProductImageRecord => Boolean(image));

  const generalSizes = sizes
    .filter((size) => size.color_id == null)
    .map((size) => size.size);

  return {
    id: row.id,
    name: row.name,
    subtitle: row.subtitle,
    category: row.category,
    description: row.description,
    price: row.price,
    oldPrice: row.old_price,
    tag: row.tag ?? "",
    tagVariant: row.tag_variant,
    rating: row.rating,
    reviewCount: row.review_count,
    stockCount: row.stock_count,
    featured: row.featured,
    sortOrder: row.sort_order,
    slug: (row as unknown as { slug: string | null }).slug ?? null,
    isActive: (row as unknown as { is_active: boolean }).is_active ?? true,
    specs: sortByPosition(row.specs).map((spec) => ({
      label: spec.label,
      value: spec.value,
    })),
    features: sortByPosition(row.features).map((feature) => feature.value),
    generalImages,
    colorVariants: colors.map((color) => {
      const predefinedColor = resolvePredefinedColor(color.name);
      const variantImages = images
        .filter((image) => image.color_id === color.id)
        .map((image) => mapImageRecord(image, colorsById))
        .filter((image): image is AdminProductImageRecord => Boolean(image));
      const variantSizes = sizes
        .filter((size) => size.color_id === color.id)
        .map((size) => size.size);

      return {
        colorName: predefinedColor.name,
        stockCount: color.stock_count,
        sizes: (variantSizes.length ? variantSizes : generalSizes) as ProductSize[],
        images: variantImages,
      };
    }),
  };
}

type NormalizedVariant = {
  colorName: PredefinedProductColorName;
  hex: string;
  bgClass: string;
  stockCount: number;
  sizes: ProductSize[];
  images: AdminProductImagePayload[];
  position: number;
};

function normalizeVariants(
  variants: AdminProductColorVariantPayload[],
): NormalizedVariant[] {
  return variants.map((variant, index) => {
    const color = resolvePredefinedColor(variant.colorName);

    return {
      colorName: color.name,
      hex: color.hex,
      bgClass: color.bgClass,
      stockCount: variant.stockCount,
      sizes: [...variant.sizes] as ProductSize[],
      images: variant.images,
      position: index,
    };
  });
}

async function assertMutation(
  label: string,
  action: PromiseLike<{ error: { message: string } | null }>,
) {
  const { error } = await action;
  if (error) {
    throw new Error(`${label}: ${error.message}`);
  }
}

function buildImageRows(args: {
  payload: AdminProductPayload;
  normalizedVariants: NormalizedVariant[];
  productId: number;
  insertedColors: ProductColorRow[];
}): ProductImageInsert[] {
  const iconPath = DEFAULT_ICON_PATHS[args.payload.category];
  const firstBgClass =
    args.normalizedVariants[0]?.bgClass ?? "from-[#111111] to-[#222222]";
  const colorIdByName = new Map(
    args.insertedColors.map((color) => [color.name, color.id]),
  );
  const bgClassByColorName = new Map(
    args.normalizedVariants.map((variant) => [variant.colorName, variant.bgClass]),
  );
  const imageRows: ProductImageInsert[] = [];

  const pushImage = (
    image: AdminProductImagePayload,
    index: number,
    fallbackColorName: PredefinedProductColorName | null,
  ) => {
    const assignedColorName =
      image.assignedColorName ?? fallbackColorName ?? null;
    const colorId = assignedColorName
      ? colorIdByName.get(assignedColorName) ?? null
      : null;
    const bgClass = assignedColorName
      ? bgClassByColorName.get(assignedColorName) ?? firstBgClass
      : firstBgClass;

    imageRows.push({
      product_id: args.productId,
      color_id: colorId,
      alt: assignedColorName
        ? `${assignedColorName} image ${index + 1}`
        : `Product image ${index + 1}`,
      bg_class: bgClass,
      icon_path: iconPath,
      image_url: image.url,
      position: imageRows.length,
    });
  };

  args.payload.generalImages.forEach((image, index) => {
    pushImage(image, index, null);
  });

  args.normalizedVariants.forEach((variant) => {
    variant.images.forEach((image, index) => {
      pushImage(image, index, variant.colorName);
    });
  });

  return imageRows;
}

function buildPayloadFromRecord(record: AdminProductRecord): AdminProductPayload {
  return {
    name: record.name,
    subtitle: record.subtitle,
    category: record.category,
    description: record.description,
    price: record.price,
    oldPrice: record.oldPrice,
    tag: record.tag,
    tagVariant: record.tagVariant,
    rating: record.rating,
    reviewCount: record.reviewCount,
    featured: record.featured,
    isActive: record.isActive,
    slug: record.slug ?? null,
    sortOrder: record.sortOrder,
    specsText: record.specs.map((spec) => `${spec.label}|${spec.value}`).join("\n"),
    featuresText: record.features.join("\n"),
    generalImages: record.generalImages.map((image) => ({
      url: image.url,
      assignedColorName: image.assignedColorName,
    })),
    colorVariants: record.colorVariants.map((variant) => ({
      colorName: variant.colorName,
      stockCount: variant.stockCount,
      sizes: variant.sizes,
      images: variant.images.map((image) => ({
        url: image.url,
        assignedColorName: image.assignedColorName,
      })),
    })),
  };
}

async function getAdminProductById(
  supabase: AdminSupabaseClient,
  productId: number,
) {
  const result = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("id", productId)
    .maybeSingle();

  let rawData: unknown = result.data;
  let queryError = result.error;

  if (queryError && isMissingColumnError(queryError.message)) {
    const fallback = await supabase
      .from("products")
      .select(PRODUCT_SELECT_BASE)
      .eq("id", productId)
      .maybeSingle();
    rawData = fallback.data;
    queryError = fallback.error;
  }

  if (queryError) {
    throw new Error(queryError.message);
  }

  return rawData ? mapAdminProduct(rawData as ProductQueryRow) : null;
}

async function writeProductGraph(
  supabase: AdminSupabaseClient,
  payload: AdminProductPayload,
  productId?: number,
  options?: {
    onProductIdResolved?: (resolvedProductId: number) => void;
  },
) {
  const normalizedVariants = normalizeVariants(payload.colorVariants);
  const specs = parseSpecsText(payload.specsText);
  const features = parseFeaturesText(payload.featuresText);
  const totalStockCount = normalizedVariants.reduce(
    (sum, variant) => sum + variant.stockCount,
    0,
  );

  const productMutation: Database["public"]["Tables"]["products"]["Insert"] = {
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
    stock_count: totalStockCount,
    featured: payload.featured,
    sort_order: payload.sortOrder,
    is_active: payload.isActive ?? true,
    slug: payload.slug ?? null,
  };

  let baseProductId = productId;

  if (baseProductId) {
    const { error } = await supabase
      .from("products")
      .update(productMutation)
      .eq("id", baseProductId);

    if (error) {
      throw new Error(error.message);
    }
  } else {
    const { data, error } = await supabase
      .from("products")
      .insert(productMutation)
      .select("id")
      .single();

    if (error || !data?.id) {
      throw new Error(error?.message ?? "Failed to create product.");
    }

    baseProductId = data.id;
  }

  options?.onProductIdResolved?.(baseProductId);

  await assertMutation(
    "Failed to clear product images",
    supabase.from("product_images").delete().eq("product_id", baseProductId),
  );
  await assertMutation(
    "Failed to clear product sizes",
    supabase.from("product_sizes").delete().eq("product_id", baseProductId),
  );
  await assertMutation(
    "Failed to clear product colors",
    supabase.from("product_colors").delete().eq("product_id", baseProductId),
  );
  await assertMutation(
    "Failed to clear product specs",
    supabase.from("product_specs").delete().eq("product_id", baseProductId),
  );
  await assertMutation(
    "Failed to clear product features",
    supabase.from("product_features").delete().eq("product_id", baseProductId),
  );

  const colorRows: ProductColorInsert[] = normalizedVariants.map((variant) => ({
    product_id: baseProductId,
    name: variant.colorName,
    hex: variant.hex,
    bg_class: variant.bgClass,
    stock_count: variant.stockCount,
    position: variant.position,
  }));

  const { data: insertedColors, error: colorInsertError } = await supabase
    .from("product_colors")
    .insert(colorRows)
    .select("id, product_id, name, hex, bg_class, stock_count, position");

  if (colorInsertError) {
    throw new Error(colorInsertError.message);
  }

  const insertedColorRows = (insertedColors as ProductColorRow[] | null) ?? [];
  const colorIdByName = new Map(
    insertedColorRows.map((color) => [color.name, color.id]),
  );

  const sizeRows: ProductSizeInsert[] = normalizedVariants.flatMap((variant) =>
    variant.sizes.map((size, index) => ({
      product_id: baseProductId,
      color_id: colorIdByName.get(variant.colorName) ?? null,
      size,
      available: true,
      position: index,
    })),
  );

  const specRows: ProductSpecInsert[] = specs.map((spec, index) => ({
    product_id: baseProductId,
    label: spec.label,
    value: spec.value,
    position: index,
  }));

  const featureRows: ProductFeatureInsert[] = features.map((feature, index) => ({
    product_id: baseProductId,
    value: feature,
    position: index,
  }));

  const imageRows = buildImageRows({
    payload,
    normalizedVariants,
    productId: baseProductId,
    insertedColors: insertedColorRows,
  });

  if (sizeRows.length) {
    await assertMutation(
      "Failed to insert product sizes",
      supabase.from("product_sizes").insert(sizeRows),
    );
  }

  await assertMutation(
    "Failed to insert product specs",
    supabase.from("product_specs").insert(specRows),
  );

  if (featureRows.length) {
    await assertMutation(
      "Failed to insert product features",
      supabase.from("product_features").insert(featureRows),
    );
  }

  if (imageRows.length) {
    await assertMutation(
      "Failed to insert product images",
      supabase.from("product_images").insert(imageRows),
    );
  }

  return baseProductId;
}

async function upsertAdminProductWithFallback(
  supabase: AdminSupabaseClient,
  payload: AdminProductPayload,
  productId?: number,
) {
  const snapshot = productId
    ? await getAdminProductById(supabase, productId)
    : null;
  let touchedProductId = productId;

  try {
    return await writeProductGraph(supabase, payload, productId, {
      onProductIdResolved: (resolvedProductId) => {
        touchedProductId = resolvedProductId;
      },
    });
  } catch (error) {
    if (snapshot) {
      try {
        await writeProductGraph(supabase, buildPayloadFromRecord(snapshot), snapshot.id);
      } catch (restoreError) {
        const baseMessage =
          error instanceof Error ? error.message : "Failed to save product.";
        const restoreMessage =
          restoreError instanceof Error
            ? restoreError.message
            : "Failed to restore previous product state.";
          throw new Error(`${baseMessage} Restore failed: ${restoreMessage}`);
      }
    } else if (touchedProductId) {
      const { error: cleanupError } = await supabase
        .from("products")
        .delete()
        .eq("id", touchedProductId);

      if (cleanupError) {
        const baseMessage =
          error instanceof Error ? error.message : "Failed to save product.";
        throw new Error(
          `${baseMessage} Cleanup failed: ${cleanupError.message}`,
        );
      }
    }

    throw error;
  }
}

function isMissingColumnError(message: string) {
  return message.includes("does not exist") && (
    message.includes("products.slug") ||
    message.includes("products.is_active") ||
    message.includes("column \"slug\"") ||
    message.includes("column \"is_active\"")
  );
}

export async function getAdminProducts(supabase: AdminSupabaseClient) {
  const result = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true });

  let rawData: unknown = result.data;
  let queryError = result.error;

  if (queryError && isMissingColumnError(queryError.message)) {
    // Migration hasn't been run yet — fall back to base select
    console.warn("[Admin Products]: slug/is_active columns missing, using base select. Run migration 202604100001.");
    const fallback = await supabase
      .from("products")
      .select(PRODUCT_SELECT_BASE)
      .order("sort_order", { ascending: true })
      .order("id", { ascending: true });
    rawData = fallback.data;
    queryError = fallback.error;
  }

  if (queryError) {
    throw new Error(queryError.message);
  }

  return ((rawData as ProductQueryRow[] | null) ?? []).map(mapAdminProduct);
}

export async function upsertAdminProduct(
  supabase: AdminSupabaseClient,
  payload: AdminProductPayload,
  productId?: number,
) {
  if (adminUpsertProductRpcUnavailable) {
    return upsertAdminProductWithFallback(supabase, payload, productId);
  }

  const normalizedVariants = normalizeVariants(payload.colorVariants);
  const specs = parseSpecsText(payload.specsText);
  const features = parseFeaturesText(payload.featuresText);
  const { data, error } = await supabase.rpc("admin_upsert_product", {
    p_product_id: productId ?? null,
    p_name: payload.name,
    p_subtitle: payload.subtitle,
    p_category: payload.category,
    p_description: payload.description,
    p_price: payload.price,
    p_old_price: payload.oldPrice ?? null,
    p_tag: payload.tag || null,
    p_tag_variant: payload.tagVariant ?? null,
    p_rating: payload.rating,
    p_review_count: payload.reviewCount,
    p_featured: payload.featured,
    p_sort_order: payload.sortOrder,
    p_specs: specs,
    p_features: features,
    p_color_variants: normalizedVariants.map((variant) => ({
      colorName: variant.colorName,
      hex: variant.hex,
      bgClass: variant.bgClass,
      stockCount: variant.stockCount,
      sizes: variant.sizes,
      images: variant.images.map((image) => ({
        url: image.url,
        assignedColorName: image.assignedColorName ?? null,
      })),
      position: variant.position,
    })),
    p_general_images: payload.generalImages.map((image) => ({
      url: image.url,
      assignedColorName: image.assignedColorName ?? null,
    })),
  });

  if (error) {
    if (shouldFallbackRpc(error.message, "admin_upsert_product")) {
      adminUpsertProductRpcUnavailable = true;
      return upsertAdminProductWithFallback(supabase, payload, productId);
    }

    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Failed to upsert product.");
  }

  // Patch slug and is_active separately (RPC doesn't have these params yet)
  const slugPatch: Record<string, unknown> = { is_active: payload.isActive ?? true };
  if (payload.slug) {
    slugPatch.slug = payload.slug;
  }
  await supabase.from("products").update(slugPatch).eq("id", data);

  return data;
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

export const PRODUCT_SIZE_OPTIONS = [...PRODUCT_SIZES] as ProductSize[];
