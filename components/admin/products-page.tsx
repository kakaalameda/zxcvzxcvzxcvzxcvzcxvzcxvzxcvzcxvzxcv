"use client";
/* eslint-disable @next/next/no-img-element */

import { zodResolver } from "@hookform/resolvers/zod";
import type { ColumnDef } from "@tanstack/react-table";
import { Pencil, Plus, Search, Trash2, Upload } from "lucide-react";
import { useMemo, useRef, useState, useTransition } from "react";
import {
  type FieldErrors,
  type UseFormReturn,
  useFieldArray,
  useForm,
  useWatch,
  useController,
} from "react-hook-form";
import { toSlug } from "@/lib/utils/slug";
import { DataTable } from "@/components/admin/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  PREDEFINED_PRODUCT_COLORS,
  PRODUCT_TYPES,
  TAG_VARIANTS,
  type PredefinedProductColorName,
} from "@/lib/product-config";
import {
  PRODUCT_SIZE_OPTIONS,
  type AdminProductRecord,
} from "@/lib/repositories/admin-products";
import {
  adminProductSchema,
  type AdminProductFormValues,
  type AdminProductPayload,
} from "@/lib/validations/admin";
import { cn } from "@/lib/utils";

type AdminProductForm = UseFormReturn<
  AdminProductFormValues,
  unknown,
  AdminProductPayload
>;

function formatPrice(value: number) {
  return `${Math.round(value).toLocaleString("vi-VN")}d`;
}

function buildDefaultVariant(
  colorName = PREDEFINED_PRODUCT_COLORS[0].name,
): AdminProductFormValues["colorVariants"][number] {
  return {
    colorName,
    stockCount: 0,
    sizes: ["M", "L"],
    images: [],
  };
}

function buildDefaultValues(product?: AdminProductRecord): AdminProductFormValues {
  return {
    name: product?.name ?? "",
    subtitle: product?.subtitle ?? "",
    category: product?.category ?? "Tee",
    description: product?.description ?? "",
    price: product?.price ?? 0,
    oldPrice: product?.oldPrice ?? null,
    tag: product?.tag ?? "",
    tagVariant: product?.tagVariant ?? null,
    rating: product?.rating ?? 4.8,
    reviewCount: product?.reviewCount ?? 0,
    featured: product?.featured ?? false,
    isActive: product?.isActive ?? true,
    slug: product?.slug ?? null,
    sortOrder: product?.sortOrder ?? 0,
    specsText:
      product?.specs.map((spec) => `${spec.label}|${spec.value}`).join("\n") ??
      "Material|100% Cotton\nWeight|240 GSM",
    featuresText: product?.features.join("\n") ?? "Boxy fit\nDaily wear",
    generalImages: product?.generalImages ?? [],
    colorVariants:
      product?.colorVariants.length
        ? product.colorVariants.map((variant) => ({
            colorName: variant.colorName,
            stockCount: variant.stockCount,
            sizes: variant.sizes,
            images: variant.images,
          }))
        : [buildDefaultVariant()],
  };
}

function getNextColorName(
  variants: AdminProductFormValues["colorVariants"],
): PredefinedProductColorName {
  const used = new Set(variants.map((variant) => variant.colorName));

  return (
    PREDEFINED_PRODUCT_COLORS.find((color) => !used.has(color.name))?.name ??
    PREDEFINED_PRODUCT_COLORS[0].name
  );
}

async function uploadProductImages(files: FileList | null) {
  if (!files?.length) {
    return null;
  }

  const formData = new FormData();
  Array.from(files).forEach((file) => {
    formData.append("files", file);
  });

  const response = await fetch("/api/admin/uploads/product-images", {
    method: "POST",
    body: formData,
  });
  const result = (await response.json().catch(() => null)) as
    | { error?: string; imageUrls?: string[] }
    | null;

  if (!response.ok || !result?.imageUrls) {
    throw new Error(result?.error ?? "Khong the upload anh.");
  }

  return result.imageUrls;
}

function UploadedImagesField({
  title,
  description,
  namePrefix,
  fields,
  form,
  currentColorNames,
  defaultAssignedColorName,
  onAppendImages,
  onRemove,
}: {
  title: string;
  description: string;
  namePrefix: `generalImages` | `colorVariants.${number}.images`;
  fields: {
    id: string;
    url: string;
    assignedColorName?: unknown;
  }[];
  form: AdminProductForm;
  currentColorNames: PredefinedProductColorName[];
  defaultAssignedColorName: PredefinedProductColorName | null;
  onAppendImages: (urls: string[]) => void;
  onRemove: (index: number) => void;
}) {
  const uploadRef = useRef<HTMLInputElement | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleUpload = async (files: FileList | null) => {
    try {
      setUploadError(null);
      const urls = await uploadProductImages(files);
      if (!urls?.length) {
        return;
      }

      onAppendImages(urls);
    } catch (error) {
      setUploadError(
        error instanceof Error ? error.message : "Khong the upload anh.",
      );
    }
  };

  return (
    <div className="space-y-3 rounded-2xl border border-white/10 bg-black/30 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-heading text-sm uppercase tracking-[0.14em] text-white/70">
            {title}
          </p>
          <p className="mt-1 text-xs text-white/45">{description}</p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => uploadRef.current?.click()}
        >
          <Upload className="size-4" />
          Upload
        </Button>
      </div>

      <input
        ref={uploadRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(event) => {
          void handleUpload(event.target.files);
          event.target.value = "";
        }}
      />

      {fields.length ? (
        <div className="space-y-3">
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="grid gap-3 rounded-2xl border border-white/10 px-3 py-3 md:grid-cols-[64px_1fr_180px_auto]"
            >
              <div className="relative h-16 w-16 overflow-hidden rounded-xl border border-white/10 bg-black">
                <img
                  src={field.url}
                  alt={`${title} ${index + 1}`}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm text-white/70">{field.url}</p>
                <input
                  type="hidden"
                  {...form.register(`${namePrefix}.${index}.url` as const)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor={`${namePrefix}-${index}-assigned-color`}>Gán màu</Label>
                <select
                  id={`${namePrefix}-${index}-assigned-color`}
                  className="flex h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
                  {...form.register(
                    `${namePrefix}.${index}.assignedColorName` as const,
                  )}
                  defaultValue={
                    typeof field.assignedColorName === "string"
                      ? field.assignedColorName
                      : defaultAssignedColorName ?? ""
                  }
                >
                  <option value="" className="bg-black text-white">
                    Chung / Không gán màu
                  </option>
                  {currentColorNames.map((colorName) => (
                    <option
                      key={colorName}
                      value={colorName}
                      className="bg-black text-white"
                    >
                      {colorName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center justify-end">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => onRemove(index)}
                >
                  Xoá
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-sm text-white/45">
          Chưa có ảnh nào trong mục này.
        </div>
      )}

      {uploadError ? <p className="text-xs text-red-400">{uploadError}</p> : null}
    </div>
  );
}

function ColorVariantCard({
  form,
  variantIndex,
  onRemoveVariant,
  currentColorNames,
  onColorChange,
  canRemove,
}: {
  form: AdminProductForm;
  variantIndex: number;
  onRemoveVariant: (index: number) => void;
  currentColorNames: PredefinedProductColorName[];
  onColorChange: (
    previousColorName: PredefinedProductColorName,
    nextColorName: PredefinedProductColorName,
  ) => void;
  canRemove: boolean;
}) {
  const imageFields = useFieldArray({
    control: form.control,
    name: `colorVariants.${variantIndex}.images` as const,
  });
  const selectedSizes =
    useWatch({
      control: form.control,
      name: `colorVariants.${variantIndex}.sizes` as const,
    }) ?? [];
  const selectedColorName = useWatch({
    control: form.control,
    name: `colorVariants.${variantIndex}.colorName` as const,
  });
  const variantErrors =
    (form.formState.errors.colorVariants?.[variantIndex] as
      | FieldErrors<AdminProductPayload["colorVariants"][number]>
      | undefined) ?? undefined;

  const updateVariantSizes = (size: string, checked: boolean) => {
    const nextSizes = checked
      ? [...selectedSizes, size]
      : selectedSizes.filter((entry) => entry !== size);

    form.setValue(`colorVariants.${variantIndex}.sizes`, nextSizes as never, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };
  const colorField = form.register(`colorVariants.${variantIndex}.colorName` as const);

  return (
    <div className="space-y-4 rounded-3xl border border-white/10 bg-black/30 p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-gold-500">
            Biến thể
          </p>
          <h3 className="mt-2 font-heading text-lg uppercase tracking-[0.1em] text-white">
            Màu {variantIndex + 1}
          </h3>
        </div>
        <Button
          type="button"
          variant="ghost"
          disabled={!canRemove}
          onClick={() => onRemoveVariant(variantIndex)}
        >
          <Trash2 className="size-4" />
          Xoá màu
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`variant-color-${variantIndex}`}>Màu sắc</Label>
          <select
            id={`variant-color-${variantIndex}`}
            className="flex h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
            {...colorField}
            defaultValue={selectedColorName}
            onChange={(event) => {
              const previousColorName = selectedColorName;
              colorField.onChange(event);

              if (
                previousColorName &&
                previousColorName !== event.target.value
              ) {
                onColorChange(
                  previousColorName,
                  event.target.value as PredefinedProductColorName,
                );
              }
            }}
          >
            {PREDEFINED_PRODUCT_COLORS.map((color) => (
              <option key={color.name} value={color.name} className="bg-black text-white">
                {color.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-red-400">
            {variantErrors?.colorName?.message as string | undefined}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`variant-stock-${variantIndex}`}>Tồn kho theo màu</Label>
          <Input
            id={`variant-stock-${variantIndex}`}
            type="number"
            min={0}
            {...form.register(`colorVariants.${variantIndex}.stockCount`)}
          />
          <p className="text-xs text-red-400">
            {variantErrors?.stockCount?.message as string | undefined}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <Label>Size khả dụng cho màu này</Label>
        <div className="flex flex-wrap gap-3">
          {PRODUCT_SIZE_OPTIONS.map((size) => (
            <label
              key={`${variantIndex}-${size}`}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm",
                selectedSizes.includes(size)
                  ? "border-gold-500/40 bg-gold-500/10 text-gold-400"
                  : "border-white/10 text-white/65",
              )}
            >
              <input
                type="checkbox"
                checked={selectedSizes.includes(size)}
                onChange={(event) => updateVariantSizes(size, event.target.checked)}
              />
              {size}
            </label>
          ))}
        </div>
        <p className="text-xs text-red-400">
          {variantErrors?.sizes?.message as string | undefined}
        </p>
      </div>

      <UploadedImagesField
        title="Ảnh riêng cho màu này"
        description="Mỗi ảnh có dropdown để giữ chung hoặc gán sang màu khác."
        namePrefix={`colorVariants.${variantIndex}.images`}
        fields={imageFields.fields}
        form={form}
        currentColorNames={currentColorNames}
        defaultAssignedColorName={selectedColorName ?? null}
        onAppendImages={(urls) => {
          imageFields.append(
            urls.map((url) => ({
              url,
              assignedColorName: selectedColorName ?? null,
            })),
          );
        }}
        onRemove={imageFields.remove}
      />
    </div>
  );
}

/** Slug field that auto-generates from the product name, but lets admin override */
function SlugField({ form }: { form: AdminProductForm }) {
  const { field, fieldState } = useController({ control: form.control, name: "slug" });
  const watchedName = useWatch({ control: form.control, name: "name" });
  // If editing an existing product that already has a slug, mark as touched so we don't overwrite
  const [touched, setTouched] = useState(() => Boolean(form.getValues("slug")));

  // Auto-fill slug from name if user hasn't manually edited the slug yet
  const prevAuto = useRef<string>("");
  useMemo(() => {
    if (touched) return;
    const auto = watchedName ? toSlug(watchedName) : "";
    if (auto !== prevAuto.current) {
      prevAuto.current = auto;
      form.setValue("slug", auto || null, { shouldDirty: false });
    }
  }, [watchedName, touched, form]);

  return (
    <div className="space-y-2">
      <Label htmlFor="product-slug">Slug URL</Label>
      <div className="relative">
        <Input
          id="product-slug"
          placeholder="tu-dong-tao-tu-ten"
          value={(field.value as string | null) ?? ""}
          onChange={(e) => {
            setTouched(true);
            field.onChange(e.target.value || null);
          }}
          onBlur={field.onBlur}
        />
        {!touched && watchedName && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[0.6rem] text-gold-500/60 uppercase tracking-widest pointer-events-none">
            tự động
          </span>
        )}
      </div>
      <p className="text-xs text-white/40">Tự tạo từ tên sản phẩm. Chỉnh nếu cần URL riêng.</p>
      {fieldState.error && (
        <p className="text-xs text-red-400">{fieldState.error.message}</p>
      )}
    </div>
  );
}

type FilterStatus = "all" | "active" | "inactive" | "out_of_stock";

function getStatusBadge(product: AdminProductRecord) {
  if (!product.isActive) {
    return { label: "Tạm ẩn", className: "bg-white/5 text-white/50" };
  }
  if (product.stockCount === 0) {
    return { label: "Hết hàng", className: "bg-red-500/15 text-red-300" };
  }
  return { label: "Đang bán", className: "bg-emerald-500/15 text-emerald-300" };
}

export function ProductsPage({
  initialProducts,
}: {
  initialProducts: AdminProductRecord[];
}) {
  const [products, setProducts] = useState(initialProducts);
  const [editingProduct, setEditingProduct] = useState<AdminProductRecord | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const q = searchQuery.toLowerCase().trim();
      if (q && !product.name.toLowerCase().includes(q) && !product.subtitle.toLowerCase().includes(q)) {
        return false;
      }
      if (filterCategory !== "all" && product.category !== filterCategory) {
        return false;
      }
      if (filterStatus === "active" && (!product.isActive || product.stockCount === 0)) {
        return false;
      }
      if (filterStatus === "inactive" && product.isActive) {
        return false;
      }
      if (filterStatus === "out_of_stock" && product.stockCount > 0) {
        return false;
      }
      return true;
    });
  }, [products, searchQuery, filterCategory, filterStatus]);

  const openForm = (product: AdminProductRecord | null) => {
    setEditingProduct(product);
    form.reset(buildDefaultValues(product ?? undefined));
    setError(null);
    setMessage(null);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
  };

  const form = useForm<AdminProductFormValues, unknown, AdminProductPayload>({
    resolver: zodResolver(adminProductSchema),
    defaultValues: buildDefaultValues(),
  });

  const generalImageFields = useFieldArray({
    control: form.control,
    name: "generalImages",
  });
  const colorVariantFields = useFieldArray({
    control: form.control,
    name: "colorVariants",
  });
  const watchedVariants = useWatch({
    control: form.control,
    name: "colorVariants",
  });

  const currentColorNames = useMemo(
    () =>
      Array.from(
        new Set(
          (watchedVariants ?? [])
            .map((variant) => variant?.colorName)
            .filter((value): value is PredefinedProductColorName => Boolean(value)),
        ),
      ),
    [watchedVariants],
  );

  const columns = useMemo<ColumnDef<AdminProductRecord>[]>(
    () => [
      {
        id: "thumbnail",
        header: "",
        cell: ({ row }) => {
          const product = row.original;
          const firstImg =
            product.generalImages[0]?.url ??
            product.colorVariants[0]?.images[0]?.url;
          return firstImg ? (
            <div className="w-10 h-10 flex-shrink-0 overflow-hidden rounded-lg border border-white/10 bg-black">
              <img src={firstImg} alt={product.name} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-10 h-10 flex-shrink-0 rounded-lg border border-dashed border-white/15 bg-white/[0.03]" />
          );
        },
      },
      {
        accessorKey: "name",
        header: "Sản phẩm",
        cell: ({ row }) => {
          const product = row.original;
          const status = getStatusBadge(product);
          return (
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-medium text-foreground">{product.name}</p>
                <span className={cn("inline-flex rounded-full px-2 py-0.5 text-[0.65rem] font-medium", status.className)}>
                  {status.label}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {product.subtitle} · {product.category}
                {product.slug ? <span className="text-white/30"> · /{product.slug}</span> : null}
              </p>
            </div>
          );
        },
      },
      {
        accessorKey: "price",
        header: "Giá",
        cell: ({ row }) => (
          <div>
            <p>{formatPrice(row.original.price)}</p>
            {row.original.oldPrice ? (
              <p className="text-xs text-muted-foreground line-through">
                {formatPrice(row.original.oldPrice)}
              </p>
            ) : null}
          </div>
        ),
      },
      {
        accessorKey: "stockCount",
        header: "Tồn kho",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.stockCount}
          </span>
        ),
      },
      {
        accessorKey: "featured",
        header: "Nổi bật",
        cell: ({ row }) => (
          <span
            className={cn(
              "inline-flex rounded-full px-2 py-1 text-xs font-medium",
              row.original.featured
                ? "bg-amber-500/15 text-amber-300"
                : "bg-white/5 text-white/60",
            )}
          >
            {row.original.featured ? "Có" : "Không"}
          </span>
        ),
      },
      {
        accessorKey: "colorVariants",
        header: "Màu sắc",
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5 flex-wrap">
            {row.original.colorVariants.map((variant) => {
              const color = PREDEFINED_PRODUCT_COLORS.find((c) => c.name === variant.colorName);
              return (
                <div
                  key={variant.colorName}
                  title={variant.colorName}
                  className="w-4 h-4 rounded-full border border-white/25 flex-shrink-0"
                  style={{ background: color?.hex ?? "#888" }}
                />
              );
            })}
          </div>
        ),
      },
      {
        id: "actions",
        header: "Thao tác",
        cell: ({ row }) => {
          const product = row.original;

          return (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => openForm(product)}
              >
                <Pencil className="size-4" />
                Sửa
              </Button>

              <Button
                type="button"
                size="sm"
                variant="destructive"
                onClick={() => {
                  const confirmed = window.confirm(`Xác nhận xoá sản phẩm "${product.name}"?`);
                  if (!confirmed) {
                    return;
                  }

                  startTransition(async () => {
                    setError(null);
                    setMessage(null);

                    const response = await fetch(`/api/admin/products/${product.id}`, {
                      method: "DELETE",
                    });
                    const result = (await response.json().catch(() => null)) as
                      | { error?: string }
                      | null;

                    if (!response.ok) {
                      setError(result?.error ?? "Không thể xoá sản phẩm.");
                      return;
                    }

                    setProducts((current) =>
                      current.filter((entry) => entry.id !== product.id),
                    );
                    if (editingProduct?.id === product.id) {
                      setEditingProduct(null);
                      form.reset(buildDefaultValues());
                    }
                    setMessage("Đã xoá sản phẩm.");
                  });
                }}
              >
                <Trash2 className="size-4" />
                Xoá
              </Button>
            </div>
          );
        },
      },
    ],
    [editingProduct?.id, form],
  );

  const syncAssignedColorName = (
    previousColorName: PredefinedProductColorName,
    nextColorName: PredefinedProductColorName,
  ) => {
    const nextGeneralImages = (form.getValues("generalImages") ?? []).map((image) => ({
      ...image,
      assignedColorName:
        image.assignedColorName === previousColorName
          ? nextColorName
          : image.assignedColorName ?? null,
    }));

    const nextVariants = (form.getValues("colorVariants") ?? []).map((variant) => ({
      ...variant,
      images: (variant.images ?? []).map((image) => ({
        ...image,
        assignedColorName:
          image.assignedColorName === previousColorName
            ? nextColorName
            : image.assignedColorName ?? null,
      })),
    }));

    form.setValue("generalImages", nextGeneralImages, { shouldDirty: true });
    form.setValue("colorVariants", nextVariants, { shouldDirty: true });
  };

  const removeVariant = (index: number) => {
    const removedColorName = form.getValues(`colorVariants.${index}.colorName`);
    colorVariantFields.remove(index);

    const nextGeneralImages = (form.getValues("generalImages") ?? []).map((image) => ({
      ...image,
      assignedColorName:
        image.assignedColorName === removedColorName
          ? null
          : image.assignedColorName ?? null,
    }));

    const nextVariants = (form.getValues("colorVariants") ?? []).map((variant) => ({
      ...variant,
      images: (variant.images ?? []).map((image) => ({
        ...image,
        assignedColorName:
          image.assignedColorName === removedColorName
            ? variant.colorName
            : image.assignedColorName ?? null,
      })),
    }));

    form.setValue("generalImages", nextGeneralImages, { shouldDirty: true });
    form.setValue("colorVariants", nextVariants, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      setError(null);
      setMessage(null);

      const response = await fetch(
        editingProduct ? `/api/admin/products/${editingProduct.id}` : "/api/admin/products",
        {
          method: editingProduct ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(values),
        },
      );
      const result = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;

      if (!response.ok) {
        setError(result?.error ?? "Không thể lưu sản phẩm.");
        return;
      }

      setMessage(editingProduct ? "Đã cập nhật sản phẩm." : "Đã tạo sản phẩm.");
      window.location.reload();
    });
  });

  return (
    <div className="min-h-screen bg-[#050505] px-4 py-6 text-white md:px-8">
      {/* ── Main content (full width) ── */}
      <div className="mx-auto max-w-7xl space-y-4">
        <div className="rounded-3xl border border-white/10 bg-black/40 p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-gold-500">Admin</p>
              <h1 className="mt-3 font-display text-4xl tracking-wide">Sản Phẩm</h1>
              <p className="mt-2 text-sm text-white/55">
                Quản lý sản phẩm, biến thể màu và ảnh theo màu.
              </p>
            </div>
            <Button type="button" variant="outline" onClick={() => openForm(null)}>
              <Plus className="size-4" />
              Thêm sản phẩm
            </Button>
          </div>
        </div>

        {/* ── Search + filter bar ── */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-white/30 pointer-events-none" />
            <input
              type="text"
              placeholder="Tìm theo tên sản phẩm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 rounded-lg border border-white/10 bg-white/[0.04] pl-9 pr-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-gold-500/50"
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="h-9 rounded-lg border border-white/10 bg-[#0c0c0c] px-3 text-sm text-white/70 focus:outline-none focus:border-gold-500/50"
          >
            <option value="all">Tất cả danh mục</option>
            <option value="Tee">Tee</option>
            <option value="Hoodie">Hoodie</option>
            <option value="Pants">Pants</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
            className="h-9 rounded-lg border border-white/10 bg-[#0c0c0c] px-3 text-sm text-white/70 focus:outline-none focus:border-gold-500/50"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang bán</option>
            <option value="inactive">Tạm ẩn</option>
            <option value="out_of_stock">Hết hàng</option>
          </select>
        </div>

        <DataTable
          columns={columns}
          data={filteredProducts}
          emptyMessage={
            searchQuery || filterCategory !== "all" || filterStatus !== "all"
              ? "Không tìm thấy sản phẩm phù hợp."
              : "Chưa có sản phẩm nào."
          }
        />
      </div>

      {/* ── Overlay ── */}
      {formOpen ? (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={closeForm}
        />
      ) : null}

      {/* ── Slide-over drawer ── */}
      <div
        className={[
          "fixed right-0 top-0 h-full w-full max-w-[560px] bg-[#0c0c0c] border-l border-white/10 z-50 overflow-y-auto",
          "transition-transform duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]",
          formOpen ? "translate-x-0" : "translate-x-full",
        ].join(" ")}
      >
        <div className="p-6 space-y-6">

          {/* Drawer header */}
          <div className="flex items-start justify-between gap-3 pb-4 border-b border-white/10">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-gold-500">
                {editingProduct ? "Chỉnh sửa" : "Thêm mới"}
              </p>
              <h2 className="mt-2 font-display text-2xl tracking-wide leading-tight">
                {editingProduct ? editingProduct.name : "Sản phẩm mới"}
              </h2>
            </div>
            <button
              type="button"
              onClick={closeForm}
              className="mt-1 flex-shrink-0 w-8 h-8 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/8 border border-transparent hover:border-white/15 transition-all cursor-pointer bg-transparent rounded-sm"
              aria-label="Đóng"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Form */}
          <form className="space-y-5" onSubmit={onSubmit}>
            <div className="grid gap-4 grid-cols-2">
              <div className="space-y-2 col-span-2">
                <Label htmlFor="product-name">Tên sản phẩm</Label>
                <Input id="product-name" {...form.register("name")} />
                <p className="text-xs text-red-400">{form.formState.errors.name?.message}</p>
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="product-subtitle">Mô tả ngắn</Label>
                <Input id="product-subtitle" {...form.register("subtitle")} />
                <p className="text-xs text-red-400">{form.formState.errors.subtitle?.message}</p>
              </div>
            </div>

            <div className="grid gap-4 grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="product-category">Danh mục</Label>
                <select
                  id="product-category"
                  className="flex h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
                  {...form.register("category")}
                >
                  {PRODUCT_TYPES.map((type) => (
                    <option key={type} value={type} className="bg-black text-white">{type}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="product-price">Giá (đ)</Label>
                <Input id="product-price" type="number" min={0} {...form.register("price")} />
                <p className="text-xs text-red-400">{form.formState.errors.price?.message}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="product-old-price">Giá gốc (đ)</Label>
                <Input id="product-old-price" type="number" min={0} {...form.register("oldPrice")} />
              </div>
            </div>

            <div className="grid gap-4 grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="product-tag">Nhãn</Label>
                <Input id="product-tag" {...form.register("tag")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="product-tag-variant">Kiểu nhãn</Label>
                <select
                  id="product-tag-variant"
                  className="flex h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
                  {...form.register("tagVariant")}
                >
                  <option value="" className="bg-black text-white">Không có</option>
                  {TAG_VARIANTS.map((variant) => (
                    <option key={variant} value={variant} className="bg-black text-white">{variant}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-4 grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="product-rating">Điểm đánh giá</Label>
                <Input id="product-rating" type="number" min={0} max={5} step="0.1" {...form.register("rating")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="product-review-count">Số đánh giá</Label>
                <Input id="product-review-count" type="number" min={0} {...form.register("reviewCount")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="product-sort-order">Thứ tự</Label>
                <Input id="product-sort-order" type="number" min={0} {...form.register("sortOrder")} />
              </div>
            </div>

            <div className="flex flex-wrap gap-5">
              <label className="flex items-center gap-3 text-sm text-white/70 cursor-pointer">
                <input type="checkbox" {...form.register("featured")} />
                Sản phẩm nổi bật
              </label>
              <label className="flex items-center gap-3 text-sm text-white/70 cursor-pointer">
                <input type="checkbox" {...form.register("isActive")} />
                Đang bán (hiển thị trên web)
              </label>
            </div>

            <SlugField key={editingProduct?.id ?? "new"} form={form} />

            <div className="space-y-2">
              <Label htmlFor="product-description">Mô tả chi tiết</Label>
              <Textarea id="product-description" rows={4} {...form.register("description")} />
              <p className="text-xs text-red-400">{form.formState.errors.description?.message}</p>
            </div>

            <UploadedImagesField
              title="Ảnh chung của sản phẩm"
              description="Có thể để chung hoặc gán trực tiếp từng ảnh cho một màu đã tạo."
              namePrefix="generalImages"
              fields={generalImageFields.fields}
              form={form}
              currentColorNames={currentColorNames}
              defaultAssignedColorName={null}
              onAppendImages={(urls) => {
                generalImageFields.append(urls.map((url) => ({ url, assignedColorName: null })));
              }}
              onRemove={generalImageFields.remove}
            />
            <p className="text-xs text-red-400">
              {form.formState.errors.generalImages?.message as string | undefined}
            </p>

            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <Label className="text-base">Biến thể màu</Label>
                  <p className="mt-1 text-xs text-white/45">
                    Chọn màu, tồn kho, size và ảnh theo từng màu.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    colorVariantFields.append(
                      buildDefaultVariant(getNextColorName(form.getValues("colorVariants"))),
                    )
                  }
                >
                  <Plus className="size-4" />
                  Thêm màu
                </Button>
              </div>
              <p className="text-xs text-red-400">
                {form.formState.errors.colorVariants?.message as string | undefined}
              </p>
              <div className="space-y-4">
                {colorVariantFields.fields.map((field, index) => (
                  <ColorVariantCard
                    key={field.id}
                    form={form}
                    variantIndex={index}
                    onRemoveVariant={removeVariant}
                    currentColorNames={currentColorNames}
                    onColorChange={syncAssignedColorName}
                    canRemove={colorVariantFields.fields.length > 1}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="product-specs">Thông số kỹ thuật</Label>
              <Textarea id="product-specs" rows={4} placeholder="Material|100% Cotton" {...form.register("specsText")} />
              <p className="text-xs text-white/45">Mỗi dòng một thông số: Tên|Giá trị</p>
              <p className="text-xs text-red-400">{form.formState.errors.specsText?.message}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="product-features">Đặc điểm nổi bật</Label>
              <Textarea id="product-features" rows={3} placeholder="Boxy fit" {...form.register("featuresText")} />
            </div>

            {error ? (
              <p className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>
            ) : null}

            {message ? (
              <p className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">{message}</p>
            ) : null}

            <div className="flex gap-3 pb-2">
              <Button type="submit" className="bg-gold-500 text-black hover:bg-gold-400" disabled={isPending}>
                {isPending ? "Đang lưu..." : editingProduct ? "Cập nhật" : "Tạo sản phẩm"}
              </Button>
              <Button type="button" variant="outline" onClick={closeForm}>
                Đặt lại
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
