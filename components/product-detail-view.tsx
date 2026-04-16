"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  Minus,
  Plus,
  Ruler,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Truck,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useCart } from "@/components/cart-context";
import { ProductMedia } from "@/components/product-media";
import { StoreProductCard } from "@/components/store-product-card";
import {
  buildCartItem,
  formatVnd,
  getDefaultSize,
  type Product,
  type ProductColor,
  type ProductSize,
} from "@/lib/store";

type AddState = "idle" | "loading" | "success";

const SIZE_GUIDE_COLUMNS = ["S", "M", "L", "XL", "XXL"];
const SIZE_GUIDE_ROWS = [
  { label: "Chiều cao (cm)", values: ["155-162", "162-168", "168-174", "174-180", "180-186"] },
  { label: "Cân nặng (kg)", values: ["48-56", "56-63", "63-71", "71-80", "80-88"] },
  { label: "Ngang ngực", values: ["49", "51", "53", "55", "57"] },
  { label: "Dài áo", values: ["68", "70", "72", "74", "76"] },
];

const TRUST_ITEMS = [
  {
    icon: Truck,
    title: "Giao nhanh toàn quốc",
    text: "Đơn hàng được xử lý rõ trạng thái và theo dõi thuận tiện hơn.",
  },
  {
    icon: ShieldCheck,
    title: "Đổi trả trong 30 ngày",
    text: "Dễ xử lý nếu cần đổi size hoặc điều chỉnh đơn.",
  },
  {
    icon: Sparkles,
    title: "Chất liệu đáng tin",
    text: "Cotton, fleece và canvas được chọn lọc kỹ, kiểm định từng lô trước khi ra sản phẩm.",
  },
];

const CATEGORY_LABELS: Record<Product["category"], string> = {
  Tee: "Áo thun",
  Hoodie: "Hoodie",
  Pants: "Quần",
};

function RatingStars({ rating, compact = false }: { rating: number; compact?: boolean }) {
  const sizeClass = compact ? "h-4 w-4" : "h-5 w-5";

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, index) => {
        const active = index < Math.round(rating);
        return (
          <Star
            key={index}
            className={[
              sizeClass,
              active ? "fill-[#111111] text-[#111111]" : "fill-[#d7dce5] text-[#d7dce5]",
            ].join(" ")}
          />
        );
      })}
    </div>
  );
}

function SizeGuideModal({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <>
      <div className="fixed inset-0 z-[120] bg-black/35" onClick={onClose} />
      <div className="fixed inset-x-0 bottom-0 z-[121] rounded-t-[28px] border border-[var(--border)] bg-white p-5 shadow-[0_-24px_80px_rgba(17,17,17,0.18)] md:inset-auto md:left-1/2 md:top-1/2 md:w-full md:max-w-[760px] md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-[32px] md:p-8">
        <div className="mx-auto mb-4 h-1.5 w-14 rounded-full bg-[var(--border)] md:hidden" />
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-heading size-kicker font-semibold uppercase tracking-[0.22em] text-store-blue">
              Chọn size
            </p>
            <h3 className="mt-2 font-heading type-vn-title size-title-md font-semibold uppercase text-[#111111]">
              Bảng tham khảo
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[var(--border)] px-4 py-2 text-sm text-store-muted transition-colors hover:border-store-blue hover:text-store-blue"
          >
            Đóng
          </button>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-0 overflow-hidden rounded-[24px] border border-[var(--border)]">
            <thead>
              <tr className="bg-[var(--surface)]">
                <th className="px-4 py-3 text-left font-heading size-kicker font-semibold uppercase tracking-[0.18em] text-store-muted" />
                {SIZE_GUIDE_COLUMNS.map((column) => (
                  <th
                    key={column}
                    className="px-4 py-3 text-center font-heading size-label font-semibold uppercase tracking-[0.18em] text-[#111111]"
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SIZE_GUIDE_ROWS.map((row) => (
                <tr key={row.label} className="bg-white even:bg-[#fafbfc]">
                  <td className="border-t border-[var(--border)] px-4 py-3 text-sm text-store-muted">
                    {row.label}
                  </td>
                  {row.values.map((value) => (
                    <td
                      key={value}
                      className="border-t border-[var(--border)] px-4 py-3 text-center text-sm text-[#111111]"
                    >
                      {value}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function ImageGallery({
  images,
  selectedColor,
}: {
  images: Product["images"];
  selectedColor: ProductColor;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeImage = images[activeIndex] ?? images[0];

  return (
    <div className="grid gap-3 lg:grid-cols-[92px_minmax(0,1fr)]">
      <div className="order-2 flex gap-3 overflow-x-auto py-2 lg:order-1 lg:flex-col lg:py-0">
        {images.map((image, index) => (
          <button
            key={image.id}
            type="button"
            onClick={() => setActiveIndex(index)}
            className={[
              "shrink-0 overflow-hidden rounded-[22px] border bg-white",
              index === activeIndex
                ? "border-store-blue shadow-[0_10px_30px_rgba(36,71,249,0.16)]"
                : "border-[var(--border)]",
            ].join(" ")}
          >
            <div className="h-[84px] w-[84px]">
              <ProductMedia
                image={image}
                bgClass={image.bgClass}
                className="h-full w-full"
                imageClassName="h-full w-full object-cover"
                svgClassName="h-12 w-12 opacity-15"
                stroke="rgba(0,0,0,0.08)"
              />
            </div>
          </button>
        ))}
      </div>

      <div className="order-1 overflow-hidden rounded-[36px] border border-[var(--border)] bg-white lg:order-2">
        <div className="relative aspect-square bg-[var(--surface)] sm:aspect-[4/4.5]">
          <ProductMedia
            image={activeImage}
            bgClass={activeImage.bgClass}
            className="h-full w-full"
            imageClassName="h-full w-full object-cover"
            svgClassName="h-28 w-28 opacity-15"
            stroke="rgba(0,0,0,0.08)"
          />
          <div className="absolute left-5 top-5 rounded-full bg-white/92 px-4 py-2 font-heading size-kicker-xs font-semibold uppercase tracking-[0.2em] text-[#111111] shadow-sm">
            {selectedColor.name}
          </div>

          {images.length > 1 ? (
            <>
              <button
                type="button"
                onClick={() => setActiveIndex((current) => (current - 1 + images.length) % images.length)}
                className="absolute left-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/70 bg-white/92 text-[#111111] shadow-sm transition-colors hover:text-store-blue"
                aria-label="Ảnh trước"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setActiveIndex((current) => (current + 1) % images.length)}
                className="absolute right-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/70 bg-white/92 text-[#111111] shadow-sm transition-colors hover:text-store-blue"
                aria-label="Ảnh sau"
              >
                <ArrowRight className="h-4 w-4" />
              </button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function QuantitySelector({
  quantity,
  max,
  onChange,
  compact = false,
}: {
  quantity: number;
  max: number;
  onChange: (nextQuantity: number) => void;
  compact?: boolean;
}) {
  return (
    <div
      className={[
        "inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--surface)] p-1",
        compact ? "scale-[0.94]" : "",
      ].join(" ")}
    >
      <button
        type="button"
        onClick={() => onChange(Math.max(1, quantity - 1))}
        className="flex h-10 w-10 items-center justify-center rounded-full text-store-muted transition-colors hover:text-store-blue"
        aria-label="Giảm số lượng"
      >
        <Minus className="h-4 w-4" />
      </button>
      <span className="w-10 text-center font-heading size-title-xs font-semibold text-[#111111]">
        {quantity}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, quantity + 1))}
        className="flex h-10 w-10 items-center justify-center rounded-full text-store-muted transition-colors hover:text-store-blue"
        aria-label="Tăng số lượng"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}

function AddToCartButton({
  disabled,
  onAdd,
}: {
  disabled: boolean;
  onAdd: () => void;
}) {
  const [state, setState] = useState<AddState>("idle");
  const onAddRef = useRef(onAdd);

  useEffect(() => {
    onAddRef.current = onAdd;
  }, [onAdd]);

  useEffect(() => {
    if (state !== "loading") {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      onAddRef.current();
      setState("success");
    }, 450);

    return () => window.clearTimeout(timeoutId);
  }, [state]);

  useEffect(() => {
    if (state !== "success") {
      return;
    }

    const timeoutId = window.setTimeout(() => setState("idle"), 1800);
    return () => window.clearTimeout(timeoutId);
  }, [state]);

  return (
    <button
      type="button"
      disabled={disabled || state !== "idle"}
      onClick={() => {
        if (!disabled && state === "idle") {
          setState("loading");
        }
      }}
      className={[
        "flex w-full items-center justify-center gap-2 rounded-full py-4 font-heading size-action font-semibold uppercase tracking-[0.18em] transition-colors",
        disabled
          ? "bg-[#dfe3ea] text-[#99a2b0]"
          : state === "success"
            ? "bg-[#1f9d61] text-white"
            : state === "loading"
              ? "bg-store-blue-soft text-store-blue"
              : "bg-[#111111] text-white hover:bg-store-blue",
      ].join(" ")}
    >
      {state === "success" ? <Check className="h-4 w-4" /> : <ShoppingBag className="h-4 w-4" />}
      {state === "success"
        ? "Đã thêm vào giỏ"
        : state === "loading"
          ? "Đang thêm..."
          : "Thêm vào giỏ"}
    </button>
  );
}

function ColorSelector({
  product,
  selectedColorIndex,
  selectedColorName,
  onSelect,
  compact = false,
}: {
  product: Product;
  selectedColorIndex: number;
  selectedColorName: string;
  onSelect: (index: number) => void;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {product.colors.map((color, index) => (
          <button
            key={color.name}
            type="button"
            aria-label={`Chọn màu ${color.name}`}
            onClick={() => onSelect(index)}
            className={[
              "flex h-10 w-10 items-center justify-center rounded-full border bg-white transition-colors",
              index === selectedColorIndex
                ? "border-store-blue shadow-[0_0_0_3px_rgba(36,71,249,0.12)]"
                : "border-[var(--border)]",
            ].join(" ")}
          >
            <span
              className="block h-7 w-7 rounded-full border border-black/10"
              style={{ backgroundColor: color.hex }}
            />
          </button>
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <p className="font-heading size-label font-semibold uppercase tracking-[0.22em] text-store-muted">
          Màu sắc
        </p>
        <p className="text-sm text-[#111111]">{selectedColorName}</p>
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        {product.colors.map((color, index) => (
          <button
            key={color.name}
            type="button"
            onClick={() => onSelect(index)}
            className={[
              "flex items-center gap-3 rounded-full border px-3 py-2 pr-4 transition-colors",
              index === selectedColorIndex
                ? "border-store-blue bg-store-blue-soft"
                : "border-[var(--border)] bg-white hover:border-store-blue",
            ].join(" ")}
          >
            <span
              className="block h-8 w-8 rounded-full border border-black/10"
              style={{ backgroundColor: color.hex }}
            />
            <span className="font-heading size-label font-semibold uppercase tracking-[0.16em] text-[#111111]">
              {color.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function SizeSelector({
  sizes,
  selectedSize,
  onSelect,
  onOpenGuide,
  compact = false,
}: {
  sizes: Product["sizes"];
  selectedSize: ProductSize | null;
  onSelect: (size: ProductSize) => void;
  onOpenGuide: () => void;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {sizes.map((size) => (
          <button
            key={size.size}
            type="button"
            disabled={!size.available}
            onClick={() => size.available && onSelect(size.size)}
            className={[
              "min-w-10 rounded-full border px-3 py-2 font-heading size-kicker font-semibold uppercase tracking-[0.16em] transition-colors",
              !size.available
                ? "cursor-not-allowed border-[var(--border)] text-[#c0c6cf] line-through"
                : selectedSize === size.size
                  ? "border-[#111111] bg-[#111111] text-white"
                  : "border-[var(--border)] bg-[var(--surface)] text-store-muted hover:border-store-blue hover:text-store-blue",
            ].join(" ")}
          >
            {size.size}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between gap-3">
        <p className="font-heading size-label font-semibold uppercase tracking-[0.22em] text-store-muted">
          Kích thước
        </p>
        <button
          type="button"
          onClick={onOpenGuide}
          className="inline-flex items-center gap-2 text-sm text-store-blue transition-colors hover:text-[#1737d3]"
        >
          <Ruler className="h-4 w-4" />
          Hướng dẫn chọn size
        </button>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {sizes.map((size) => (
          <button
            key={size.size}
            type="button"
            disabled={!size.available}
            onClick={() => size.available && onSelect(size.size)}
            className={[
              "min-w-12 rounded-full border px-4 py-2.5 font-heading size-label font-semibold uppercase tracking-[0.18em] transition-colors",
              !size.available
                ? "cursor-not-allowed border-[var(--border)] text-[#c0c6cf] line-through"
                : selectedSize === size.size
                  ? "border-[#111111] bg-[#111111] text-white"
                  : "border-[var(--border)] bg-[var(--surface)] text-store-muted hover:border-store-blue hover:text-store-blue",
            ].join(" ")}
          >
            {size.size}
          </button>
        ))}
      </div>
    </div>
  );
}

function PurchasePanel({
  product,
  selectedColorIndex,
  selectedColor,
  selectedSize,
  quantity,
  colorStock,
  onSelectColor,
  onSelectSize,
  onQuantityChange,
  onOpenGuide,
  onAdd,
  className,
  showHeader = true,
  showPrice = false,
  addToCartId,
}: {
  product: Product;
  selectedColorIndex: number;
  selectedColor: ProductColor;
  selectedSize: ProductSize | null;
  quantity: number;
  colorStock: number;
  onSelectColor: (index: number) => void;
  onSelectSize: (size: ProductSize) => void;
  onQuantityChange: (quantity: number) => void;
  onOpenGuide: () => void;
  onAdd: () => void;
  className?: string;
  showHeader?: boolean;
  showPrice?: boolean;
  addToCartId?: string;
}) {
  return (
    <div className={["rounded-[36px] border border-[var(--border)] bg-white p-6 sm:p-7", className].join(" ")}>
      {showHeader ? (
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-heading size-kicker font-semibold uppercase tracking-[0.24em] text-store-blue">
              Chọn phiên bản
            </p>
            <h2 className="mt-2 font-heading type-vn-title size-title-md font-semibold uppercase text-[#111111]">
              Màu, size và số lượng
            </h2>
          </div>

          {showPrice ? (
            <div className="text-right">
              <p className="font-heading size-price font-semibold leading-none text-[#111111]">
                {formatVnd(product.price)}
              </p>
              {product.oldPrice ? (
                <p className="mt-2 text-sm text-store-muted line-through">
                  {formatVnd(product.oldPrice)}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className={showHeader ? "mt-6" : ""}>
        <ColorSelector
          product={product}
          selectedColorIndex={selectedColorIndex}
          selectedColorName={selectedColor.name}
          onSelect={onSelectColor}
        />
        <SizeSelector
          sizes={product.sizes}
          selectedSize={selectedSize}
          onSelect={onSelectSize}
          onOpenGuide={onOpenGuide}
        />
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-heading size-label font-semibold uppercase tracking-[0.22em] text-store-muted">
            Số lượng
          </p>
          <div className="mt-3">
            <QuantitySelector
              quantity={quantity}
              max={Math.max(1, colorStock)}
              onChange={onQuantityChange}
            />
          </div>
        </div>

        <div className="rounded-[24px] bg-[var(--surface)] px-5 py-4">
          <p className="font-heading size-kicker-xs font-semibold uppercase tracking-[0.2em] text-store-muted">
            Tồn kho
          </p>
          <p className="mt-2 text-sm text-[#111111]">
            {colorStock > 0 ? (
              <>
                Còn <span className="font-semibold">{colorStock}</span> sản phẩm
              </>
            ) : (
              "Tạm hết hàng"
            )}
          </p>
        </div>
      </div>

      <div id={addToCartId} className="mt-6">
        <AddToCartButton disabled={!selectedSize || colorStock <= 0} onAdd={onAdd} />
      </div>
    </div>
  );
}

function StickyPurchaseBar({
  visible,
  product,
  selectedColorIndex,
  selectedColor,
  selectedSize,
  colorStock,
  onSelectColor,
  onSelectSize,
  onAdd,
}: {
  visible: boolean;
  product: Product;
  selectedColorIndex: number;
  selectedColor: ProductColor;
  selectedSize: ProductSize | null;
  colorStock: number;
  onSelectColor: (index: number) => void;
  onSelectSize: (size: ProductSize) => void;
  onAdd: () => void;
}) {
  return (
    <div
      className={[
        "fixed inset-x-0 top-0 z-[60] border-b border-[var(--border)] bg-white/97 shadow-[0_4px_20px_rgba(17,17,17,0.08)] backdrop-blur-md transition-all duration-300",
        visible ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-full opacity-0",
      ].join(" ")}
    >
      <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8">

        {/* ── Mobile: 1 row ── */}
        <div className="flex items-center gap-3 py-2 md:hidden">
          <div className="shrink-0 overflow-hidden rounded-[12px] border border-[var(--border)] bg-[var(--surface)]">
            <div className="h-[48px] w-[38px]">
              <ProductMedia
                image={product.images[0]}
                bgClass={selectedColor.bgClass}
                className="h-full w-full"
                imageClassName="h-full w-full object-cover"
                svgClassName="h-8 w-8 opacity-15"
                stroke="rgba(0,0,0,0.08)"
              />
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate font-heading size-action font-semibold uppercase tracking-[0.05em] text-[#111111]">
              {product.name}
            </p>
            <p className="mt-0.5 text-xs text-store-muted">
              {formatVnd(product.price)}
              {selectedColor.name ? ` · ${selectedColor.name}` : ""}
              {selectedSize ? ` · ${selectedSize}` : ""}
            </p>
          </div>

          <button
            type="button"
            onClick={onAdd}
            disabled={!selectedSize || colorStock <= 0}
            className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-[#111111] px-4 py-2.5 font-heading size-kicker font-semibold uppercase tracking-[0.1em] text-white transition-colors hover:bg-store-blue disabled:bg-[#dfe3ea] disabled:text-[#99a2b0]"
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            Thêm vào giỏ
          </button>
        </div>

        {/* ── Desktop: 1 row gọn ── */}
        <div className="hidden items-center gap-4 py-2 md:flex">
          {/* Thumbnail + tên + giá */}
          <div className="flex w-[220px] shrink-0 items-center gap-3">
            <div className="shrink-0 overflow-hidden rounded-[12px] border border-[var(--border)] bg-[var(--surface)]">
              <div className="h-[52px] w-[42px]">
                <ProductMedia
                  image={product.images[0]}
                  bgClass={selectedColor.bgClass}
                  className="h-full w-full"
                  imageClassName="h-full w-full object-cover"
                  svgClassName="h-8 w-8 opacity-15"
                  stroke="rgba(0,0,0,0.08)"
                />
              </div>
            </div>
            <div className="min-w-0">
              <p className="truncate font-heading size-action font-semibold uppercase tracking-[0.05em] text-[#111111]">
                {product.name}
              </p>
              <p className="font-heading size-title-xs font-semibold leading-tight text-[#111111]">
                {formatVnd(product.price)}
              </p>
            </div>
          </div>

          {/* Màu + Size inline, không label */}
          <div className="flex min-w-0 flex-1 items-center gap-3 overflow-x-auto">
            <ColorSelector
              product={product}
              selectedColorIndex={selectedColorIndex}
              selectedColorName={selectedColor.name}
              onSelect={onSelectColor}
              compact
            />
            <div className="h-4 w-px shrink-0 bg-[var(--border)]" />
            <SizeSelector
              sizes={product.sizes}
              selectedSize={selectedSize}
              onSelect={onSelectSize}
              onOpenGuide={() => {}}
              compact
            />
          </div>

          {/* Nút thêm */}
          <div className="w-[200px] shrink-0">
            <AddToCartButton disabled={!selectedSize || colorStock <= 0} onAdd={onAdd} />
          </div>
        </div>
      </div>
    </div>
  );
}

function RelatedProducts({ products }: { products: Product[] }) {
  return (
    <section className="border-t border-[var(--border)] bg-white">
      <div className="mx-auto max-w-[1240px] px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="font-heading size-kicker font-semibold uppercase tracking-[0.28em] text-store-blue">
              Gợi ý thêm
            </p>
            <h2 className="mt-3 max-w-[16ch] font-heading type-vn-title size-title-lg font-semibold uppercase text-[#111111] sm:size-display-sm">
              Phối thêm vài món để hoàn thiện outfit.
            </h2>
          </div>
          <Link
            href="/collection"
            className="hidden rounded-full border border-[var(--border)] px-5 py-3 font-heading size-label font-semibold uppercase tracking-[0.16em] text-[#111111] no-underline transition-colors hover:border-store-blue hover:text-store-blue sm:inline-flex"
          >
            Xem tất cả
          </Link>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {products.map((product) => (
            <StoreProductCard key={product.id} product={product} showSubtitle={false} />
          ))}
        </div>
      </div>
    </section>
  );
}

export function ProductDetailView({
  product,
  relatedProducts,
}: {
  product: Product;
  relatedProducts: Product[];
}) {
  const { addItem } = useCart();
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState<ProductSize | null>(getDefaultSize(product));
  const [quantity, setQuantity] = useState(1);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [descriptionOpen, setDescriptionOpen] = useState(true);
  const [showStickyBar, setShowStickyBar] = useState(false);

  const selectedColor = useMemo(
    () => product.colors[selectedColorIndex] ?? product.colors[0],
    [product.colors, selectedColorIndex],
  );

  const colorStock = selectedColor.stockCount ?? product.stockCount;
  const maxQuantity = Math.max(1, colorStock);
  const safeQuantity = Math.min(quantity, maxQuantity);

  const galleryImages = useMemo(() => {
    if (!selectedColor.id) {
      return product.images;
    }

    const matches = product.images.filter(
      (image) => image.colorId == null || image.colorId === selectedColor.id,
    );

    return matches.length ? matches : product.images;
  }, [product.images, selectedColor.id]);

  const discountPercent = product.oldPrice
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
    : 0;

  useEffect(() => {
    const check = () => {
      const isDesktop = window.innerWidth >= 1280;
      const navbarHeight = window.innerWidth >= 768 ? 112 : 64;
      const id = isDesktop ? "pdp-add-to-cart-desktop" : "pdp-add-to-cart-mobile";
      const el = document.getElementById(id);
      if (!el) return;
      setShowStickyBar(el.getBoundingClientRect().bottom < navbarHeight);
    };

    check();
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check, { passive: true });
    return () => {
      window.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
  }, []);

  const handleAddToCart = () => {
    if (!selectedSize || colorStock <= 0) {
      return;
    }

    addItem(buildCartItem(product, selectedColor, selectedSize, safeQuantity));
  };

  const handleSelectColor = (index: number) => {
    setSelectedColorIndex(index);
    setQuantity(1);
  };

  const handleQuantityChange = (nextQuantity: number) => {
    setQuantity(Math.max(1, Math.min(nextQuantity, maxQuantity)));
  };

  return (
    <div className="bg-[var(--background)] pb-6 text-[#111111] lg:pb-10">
      <section className="border-b border-[var(--border)] bg-white">
        <div className="mx-auto max-w-[1240px] px-4 py-4 text-sm text-store-muted sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/" className="no-underline transition-colors hover:text-store-blue">
              Trang chủ
            </Link>
            <span>/</span>
            <Link href="/collection" className="no-underline transition-colors hover:text-store-blue">
              Bộ sưu tập
            </Link>
            <span>/</span>
            <span className="text-[#111111]">{product.name}</span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1240px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.08fr)_430px]">
          <div className="space-y-5 xl:sticky xl:top-[132px] xl:self-start">
            <ImageGallery
              key={selectedColor.id ?? selectedColor.name}
              images={galleryImages}
              selectedColor={selectedColor}
            />

            <PurchasePanel
              product={product}
              selectedColorIndex={selectedColorIndex}
              selectedColor={selectedColor}
              selectedSize={selectedSize}
              quantity={safeQuantity}
              colorStock={colorStock}
              onSelectColor={handleSelectColor}
              onSelectSize={setSelectedSize}
              onQuantityChange={handleQuantityChange}
              onOpenGuide={() => setShowSizeGuide(true)}
              onAdd={handleAddToCart}
              showPrice
              className="xl:hidden"
              addToCartId="pdp-add-to-cart-mobile"
            />
          </div>

          <div className="space-y-5">
            <div className="rounded-[36px] border border-[var(--border)] bg-white p-6 sm:p-7">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-heading size-kicker font-semibold uppercase tracking-[0.24em] text-store-blue">
                    {CATEGORY_LABELS[product.category]}
                  </p>
                  <h1 className="mt-3 max-w-[13ch] font-heading type-vn-display size-display-sm font-semibold uppercase text-[#111111] sm:max-w-[14ch] sm:size-display-md">
                    {product.name}
                  </h1>
            <p className="mt-3 max-w-[480px] size-copy-md text-store-muted">
                    {product.subtitle}
                  </p>
                </div>

                {product.tag ? (
                  <div className="rounded-full bg-store-blue-soft px-4 py-2 font-heading size-kicker font-semibold uppercase tracking-[0.18em] text-store-blue">
                    {product.tag}
                  </div>
                ) : null}
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <RatingStars rating={product.rating} />
                <div className="text-sm text-store-muted">
                  {product.rating.toFixed(1)} · {product.reviewCount} đánh giá
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-end gap-3">
                <div className="font-heading size-display-sm font-semibold leading-none text-[#111111]">
                  {formatVnd(product.price)}
                </div>
                {product.oldPrice ? (
                  <div className="pb-1 text-base text-store-muted line-through">
                    {formatVnd(product.oldPrice)}
                  </div>
                ) : null}
                {discountPercent > 0 ? (
                  <div className="rounded-full bg-[#111111] px-3 py-1.5 font-heading size-kicker font-semibold uppercase tracking-[0.18em] text-white">
                    -{discountPercent}%
                  </div>
                ) : null}
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {TRUST_ITEMS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.title} className="rounded-[24px] bg-[var(--surface)] p-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white">
                        <Icon className="h-4 w-4 text-store-blue" />
                      </div>
              <h2 className="mt-4 font-heading type-vn-compact size-title-xs font-semibold uppercase text-[#111111]">
                        {item.title}
                      </h2>
                      <p className="mt-2 text-sm leading-6 text-store-muted">{item.text}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <PurchasePanel
              product={product}
              selectedColorIndex={selectedColorIndex}
              selectedColor={selectedColor}
              selectedSize={selectedSize}
              quantity={safeQuantity}
              colorStock={colorStock}
              onSelectColor={handleSelectColor}
              onSelectSize={setSelectedSize}
              onQuantityChange={handleQuantityChange}
              onOpenGuide={() => setShowSizeGuide(true)}
              onAdd={handleAddToCart}
              showHeader={false}
              className="hidden xl:block"
              addToCartId="pdp-add-to-cart-desktop"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1240px] px-4 pb-8 pt-2 sm:px-6 lg:px-8 lg:pb-14">
        <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
          <div className="rounded-[36px] border border-[var(--border)] bg-white p-6 sm:p-7">
            <button
              type="button"
              onClick={() => setDescriptionOpen((current) => !current)}
              className="flex w-full items-center justify-between gap-4 text-left"
            >
              <div>
                <p className="font-heading size-kicker font-semibold uppercase tracking-[0.24em] text-store-blue">
                  Chi tiết sản phẩm
                </p>
                <h2 className="mt-2 font-heading type-vn-title size-title-md font-semibold uppercase text-[#111111]">
                  Mô tả và thông số
                </h2>
              </div>
              <ChevronDown
                className={[
                  "h-5 w-5 text-store-muted transition-transform",
                  descriptionOpen ? "rotate-180" : "rotate-0",
                ].join(" ")}
              />
            </button>

            {descriptionOpen ? (
              <div className="mt-6 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
                <div>
                  <p className="size-copy-md whitespace-pre-line text-store-muted">
                    {product.description}
                  </p>
                  <div className="mt-6 space-y-3">
                    {product.features.map((feature) => (
                      <div
                        key={feature}
                        className="flex items-start gap-3 rounded-[22px] bg-[var(--surface)] px-4 py-4"
                      >
                        <span className="mt-1 block h-2.5 w-2.5 rounded-full bg-store-blue" />
                        <p className="text-sm leading-6 text-[#111111]">{feature}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[28px] bg-[var(--surface)] p-5">
                  <p className="font-heading size-kicker font-semibold uppercase tracking-[0.24em] text-store-muted">
                    Thông số chính
                  </p>
                  <div className="mt-4 space-y-3">
                    {product.specs.map((spec) => (
                      <div
                        key={spec.label}
                        className="flex items-start justify-between gap-4 rounded-[20px] bg-white px-4 py-4"
                      >
                        <span className="text-sm text-store-muted">{spec.label}</span>
                        <span className="text-right text-sm font-semibold text-[#111111]">
                          {spec.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <div className="rounded-[36px] border border-[var(--border)] bg-white p-6 sm:p-7">
            <p className="font-heading size-kicker font-semibold uppercase tracking-[0.24em] text-store-blue">
              Mua nhanh hơn
            </p>
            <h2 className="mt-2 font-heading type-vn-title size-title-md font-semibold uppercase text-[#111111]">
              Những điểm cần biết
            </h2>

            <div className="mt-6 space-y-3">
              {[
                "Freeship toàn quốc cho đơn từ 500K, giao hoả tốc khu vực nội thành trong ngày.",
                "Đổi size trong 30 ngày nếu không vừa — liên hệ hotline hoặc email để được hỗ trợ nhanh.",
                "Thanh toán COD hoặc chuyển khoản, xác nhận đơn qua SMS ngay sau khi đặt.",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-[22px] bg-[var(--surface)] px-4 py-4 text-sm leading-6 text-[#111111]"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <RelatedProducts products={relatedProducts} />

      <StickyPurchaseBar
        visible={showStickyBar}
        product={product}
        selectedColorIndex={selectedColorIndex}
        selectedColor={selectedColor}
        selectedSize={selectedSize}
        colorStock={colorStock}
        onSelectColor={handleSelectColor}
        onSelectSize={setSelectedSize}
        onAdd={handleAddToCart}
      />

      {showSizeGuide ? <SizeGuideModal onClose={() => setShowSizeGuide(false)} /> : null}
    </div>
  );
}
