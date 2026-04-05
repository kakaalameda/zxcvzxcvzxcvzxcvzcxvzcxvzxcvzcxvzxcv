"use client";
/* eslint-disable @next/next/no-img-element */

import { zodResolver } from "@hookform/resolvers/zod";
import type { ColumnDef } from "@tanstack/react-table";
import { Pencil, Plus, Trash2, Upload } from "lucide-react";
import { useMemo, useRef, useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { DataTable } from "@/components/admin/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { adminProductSchema } from "@/lib/validations/admin";
import type { AdminProductRecord } from "@/lib/repositories/admin-products";
import { cn } from "@/lib/utils";

const PRODUCT_TYPES = ["Tee", "Hoodie", "Pants"] as const;
const TAG_VARIANTS = ["gold", "white", "red", "outline"] as const;
const PRODUCT_SIZES = ["S", "M", "L", "XL", "XXL"] as const;

function formatPrice(value: number) {
  return `${Math.round(value).toLocaleString("vi-VN")}d`;
}

function buildDefaultValues(product?: AdminProductRecord) {
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
    stockCount: product?.stockCount ?? 0,
    featured: product?.featured ?? false,
    sortOrder: product?.sortOrder ?? 0,
    colorsText:
      product?.colors.map((color) => `${color.name}|${color.hex}|${color.bgClass}`).join("\n") ??
      "Black|#111111|from-[#111111] to-[#1e1e1e]",
    sizes:
      product?.sizes.filter((size) => size.available).map((size) => size.size) ?? ["M", "L"],
    specsText:
      product?.specs.map((spec) => `${spec.label}|${spec.value}`).join("\n") ??
      "Material|100% Cotton\nWeight|240 GSM",
    featuresText: product?.features.join("\n") ?? "Boxy fit\nDaily wear",
    imageUrls: product?.imageUrls ?? [],
  };
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
  const uploadRef = useRef<HTMLInputElement | null>(null);
  const form = useForm({
    resolver: zodResolver(adminProductSchema),
    defaultValues: buildDefaultValues(),
  });

  const selectedSizes = useWatch({ control: form.control, name: "sizes" }) ?? [];
  const imageUrls = useWatch({ control: form.control, name: "imageUrls" }) ?? [];

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
          <span className="text-sm text-muted-foreground">{row.original.stockCount}</span>
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

  const handleSizeToggle = (size: (typeof PRODUCT_SIZES)[number], checked: boolean) => {
    const nextSizes = checked
      ? [...selectedSizes, size]
      : selectedSizes.filter((entry) => entry !== size);
    form.setValue("sizes", nextSizes, { shouldDirty: true, shouldValidate: true });
  };

  const handleUpload = async (files: FileList | null) => {
    if (!files?.length) {
      return;
    }

    setError(null);
    setMessage(null);

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
      setError(result?.error ?? "Failed to upload images.");
      return;
    }

    form.setValue("imageUrls", [...imageUrls, ...result.imageUrls], {
      shouldDirty: true,
      shouldValidate: true,
    });
    setMessage("Images uploaded.");
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
                  Manage catalog, stock and image uploads from one place.
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

          <form className="space-y-5" onSubmit={onSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="product-name">Name</Label>
                <Input id="product-name" {...form.register("name")} />
                <p className="text-xs text-red-400">{form.formState.errors.name?.message}</p>
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
                  className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
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
                  className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
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
                <Label htmlFor="product-stock-count">Stock</Label>
                <Input
                  id="product-stock-count"
                  type="number"
                  min={0}
                  {...form.register("stockCount")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="product-sort-order">Sort order</Label>
                <Input
                  id="product-sort-order"
                  type="number"
                  min={0}
                  {...form.register("sortOrder")}
                />
              </div>
              <label className="mt-6 flex items-center gap-3 text-sm text-white/70">
                <input type="checkbox" {...form.register("featured")} />
                Featured product
              </label>
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

            <div className="space-y-2">
              <Label htmlFor="product-colors">Colors</Label>
              <Textarea
                id="product-colors"
                rows={4}
                placeholder="Black|#111111|from-[#111111] to-[#1e1e1e]"
                {...form.register("colorsText")}
              />
              <p className="text-xs text-white/45">One line per color: Name|#HEX|bgClass</p>
              <p className="text-xs text-red-400">
                {form.formState.errors.colorsText?.message}
              </p>
            </div>

            <div className="space-y-3">
              <Label>Sizes</Label>
              <div className="flex flex-wrap gap-3">
                {PRODUCT_SIZES.map((size) => (
                  <label
                    key={size}
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
                      onChange={(event) => handleSizeToggle(size, event.target.checked)}
                    />
                    {size}
                  </label>
                ))}
              </div>
              <p className="text-xs text-red-400">{form.formState.errors.sizes?.message}</p>
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

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Product images</Label>
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
              <div className="space-y-2">
                {imageUrls.length ? (
                  imageUrls.map((url, index) => (
                    <div
                      key={`${url}-${index}`}
                      className="flex items-center gap-3 rounded-2xl border border-white/10 px-3 py-2"
                    >
                      <div className="relative h-12 w-12 overflow-hidden rounded-xl border border-white/10 bg-black">
                        <img
                          src={url}
                          alt={`Product image ${index + 1}`}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-white/70">{url}</p>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          form.setValue(
                            "imageUrls",
                            imageUrls.filter((_, currentIndex) => currentIndex !== index),
                            { shouldDirty: true, shouldValidate: true },
                          )
                        }
                      >
                        Remove
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-sm text-white/45">
                    No uploaded images yet.
                  </div>
                )}
              </div>
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
