"use client";
/* eslint-disable @next/next/no-img-element */

import { zodResolver } from "@hookform/resolvers/zod";
import type { ColumnDef } from "@tanstack/react-table";
import { Pencil, Plus, Trash2, Upload } from "lucide-react";
import { useMemo, useRef, useState, useTransition } from "react";
import {
  type FieldErrors,
  type UseFormReturn,
  useFieldArray,
  useForm,
  useWatch,
} from "react-hook-form";
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
                <Label htmlFor={`${namePrefix}-${index}-assigned-color`}>Gan mau</Label>
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
                    General / Khong gan mau
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
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-sm text-white/45">
          Chua co anh nao trong muc nay.
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
            Bien the
          </p>
          <h3 className="mt-2 font-heading text-lg uppercase tracking-[0.1em] text-white">
            Mau {variantIndex + 1}
          </h3>
        </div>
        <Button
          type="button"
          variant="ghost"
          disabled={!canRemove}
          onClick={() => onRemoveVariant(variantIndex)}
        >
          <Trash2 className="size-4" />
          Xoa mau
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`variant-color-${variantIndex}`}>Mau</Label>
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
          <Label htmlFor={`variant-stock-${variantIndex}`}>Ton kho theo mau</Label>
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
        <Label>Size kha dung cho mau nay</Label>
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
        title="Anh rieng cho mau nay"
        description="Moi anh co dropdown de giu general hoac gan sang mot mau khac."
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

export function ProductsPage({
  initialProducts,
}: {
  initialProducts: AdminProductRecord[];
}) {
  const [products, setProducts] = useState(initialProducts);
  const [editingProduct, setEditingProduct] = useState<AdminProductRecord | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

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
        accessorKey: "name",
        header: "Product",
        cell: ({ row }) => {
          const product = row.original;
          return (
            <div>
              <p className="font-medium text-foreground">{product.name}</p>
              <p className="text-xs text-muted-foreground">
                {product.subtitle} · {product.category}
              </p>
            </div>
          );
        },
      },
      {
        accessorKey: "price",
        header: "Price",
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
        header: "Stock",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.stockCount}
          </span>
        ),
      },
      {
        accessorKey: "featured",
        header: "Featured",
        cell: ({ row }) => (
          <span
            className={cn(
              "inline-flex rounded-full px-2 py-1 text-xs font-medium",
              row.original.featured
                ? "bg-amber-500/15 text-amber-300"
                : "bg-white/5 text-white/60",
            )}
          >
            {row.original.featured ? "Yes" : "No"}
          </span>
        ),
      },
      {
        accessorKey: "colorVariants",
        header: "Colors",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.colorVariants.map((variant) => variant.colorName).join(", ")}
          </span>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const product = row.original;

          return (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  setEditingProduct(product);
                  form.reset(buildDefaultValues(product));
                  setError(null);
                  setMessage(null);
                }}
              >
                <Pencil className="size-4" />
                Edit
              </Button>
              <Button
                type="button"
                size="sm"
                variant="destructive"
                onClick={() => {
                  const confirmed = window.confirm(`Delete ${product.name}?`);
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
                      setError(result?.error ?? "Failed to delete product.");
                      return;
                    }

                    setProducts((current) =>
                      current.filter((entry) => entry.id !== product.id),
                    );
                    if (editingProduct?.id === product.id) {
                      setEditingProduct(null);
                      form.reset(buildDefaultValues());
                    }
                    setMessage("Product deleted.");
                  });
                }}
              >
                <Trash2 className="size-4" />
                Delete
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
        setError(result?.error ?? "Failed to save product.");
        return;
      }

      setMessage(editingProduct ? "Product updated." : "Product created.");
      window.location.reload();
    });
  });

  return (
    <div className="min-h-screen bg-[#050505] px-4 py-6 text-white md:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 xl:grid xl:grid-cols-[1.7fr_1fr]">
        <section className="space-y-4">
          <div className="rounded-3xl border border-white/10 bg-black/40 p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-gold-500">
                  Admin
                </p>
                <h1 className="mt-3 font-display text-4xl tracking-wide">
                  Products
                </h1>
                <p className="mt-2 text-sm text-white/55">
                  Quan ly san pham, bien the mau va anh theo mau trong mot form.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditingProduct(null);
                  form.reset(buildDefaultValues());
                  setError(null);
                  setMessage(null);
                }}
              >
                <Plus className="size-4" />
                New product
              </Button>
            </div>
          </div>

          <DataTable
            columns={columns}
            data={products}
            emptyMessage="No products found."
          />
        </section>

        <section className="rounded-3xl border border-white/10 bg-black/50 p-6">
          <div className="mb-6">
            <p className="text-xs uppercase tracking-[0.35em] text-gold-500">
              {editingProduct ? "Edit" : "Create"}
            </p>
            <h2 className="mt-3 font-display text-3xl tracking-wide">
              {editingProduct ? editingProduct.name : "Product form"}
            </h2>
          </div>

          <form className="space-y-6" onSubmit={onSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="product-name">Name</Label>
                <Input id="product-name" {...form.register("name")} />
                <p className="text-xs text-red-400">
                  {form.formState.errors.name?.message}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="product-subtitle">Subtitle</Label>
                <Input id="product-subtitle" {...form.register("subtitle")} />
                <p className="text-xs text-red-400">
                  {form.formState.errors.subtitle?.message}
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="product-category">Category</Label>
                <select
                  id="product-category"
                  className="flex h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
                  {...form.register("category")}
                >
                  {PRODUCT_TYPES.map((type) => (
                    <option key={type} value={type} className="bg-black text-white">
                      {type}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="product-price">Price</Label>
                <Input id="product-price" type="number" min={0} {...form.register("price")} />
                <p className="text-xs text-red-400">{form.formState.errors.price?.message}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="product-old-price">Old price</Label>
                <Input
                  id="product-old-price"
                  type="number"
                  min={0}
                  {...form.register("oldPrice")}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="product-tag">Tag</Label>
                <Input id="product-tag" {...form.register("tag")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="product-tag-variant">Tag variant</Label>
                <select
                  id="product-tag-variant"
                  className="flex h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
                  {...form.register("tagVariant")}
                >
                  <option value="" className="bg-black text-white">
                    None
                  </option>
                  {TAG_VARIANTS.map((variant) => (
                    <option key={variant} value={variant} className="bg-black text-white">
                      {variant}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="product-rating">Rating</Label>
                  <Input
                    id="product-rating"
                    type="number"
                    min={0}
                    max={5}
                    step="0.1"
                    {...form.register("rating")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="product-review-count">Reviews</Label>
                  <Input
                    id="product-review-count"
                    type="number"
                    min={0}
                    {...form.register("reviewCount")}
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="product-sort-order">Sort order</Label>
                <Input
                  id="product-sort-order"
                  type="number"
                  min={0}
                  {...form.register("sortOrder")}
                />
              </div>
              <div className="md:col-span-2">
                <label className="mt-7 flex items-center gap-3 text-sm text-white/70">
                  <input type="checkbox" {...form.register("featured")} />
                  Featured product
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="product-description">Description</Label>
              <Textarea
                id="product-description"
                rows={5}
                {...form.register("description")}
              />
              <p className="text-xs text-red-400">
                {form.formState.errors.description?.message}
              </p>
            </div>

            <UploadedImagesField
              title="Anh chung cua san pham"
              description="Co the de general hoac gan truc tiep tung anh cho mot mau da tao."
              namePrefix="generalImages"
              fields={generalImageFields.fields}
              form={form}
              currentColorNames={currentColorNames}
              defaultAssignedColorName={null}
              onAppendImages={(urls) => {
                generalImageFields.append(
                  urls.map((url) => ({
                    url,
                    assignedColorName: null,
                  })),
                );
              }}
              onRemove={generalImageFields.remove}
            />
            <p className="text-xs text-red-400">
              {form.formState.errors.generalImages?.message as string | undefined}
            </p>

            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <Label className="text-base">Color variants</Label>
                  <p className="mt-1 text-xs text-white/45">
                    Chon mau co san, ton kho theo mau, size theo mau va anh theo mau.
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
                  Add color
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
              <Label htmlFor="product-specs">Specs</Label>
              <Textarea
                id="product-specs"
                rows={4}
                placeholder="Material|100% Cotton"
                {...form.register("specsText")}
              />
              <p className="text-xs text-white/45">One line per spec: Label|Value</p>
              <p className="text-xs text-red-400">{form.formState.errors.specsText?.message}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="product-features">Features</Label>
              <Textarea
                id="product-features"
                rows={4}
                placeholder="Boxy fit"
                {...form.register("featuresText")}
              />
            </div>

            {error ? (
              <p className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </p>
            ) : null}

            {message ? (
              <p className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
                {message}
              </p>
            ) : null}

            <div className="flex gap-3">
              <Button
                type="submit"
                className="bg-gold-500 text-black hover:bg-gold-400"
                disabled={isPending}
              >
                {isPending ? "Saving..." : editingProduct ? "Update product" : "Create product"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditingProduct(null);
                  form.reset(buildDefaultValues());
                  setError(null);
                  setMessage(null);
                }}
              >
                Reset
              </Button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
