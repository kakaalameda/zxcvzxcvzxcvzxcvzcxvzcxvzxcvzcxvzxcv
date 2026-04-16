"use client";

import Link from "next/link";
import { Check, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useCart } from "@/components/cart-context";
import { ProductMedia } from "@/components/product-media";
import {
  buildCartItem,
  formatVnd,
  getDefaultColor,
  getDefaultSize,
  type Product,
  type ProductSize,
} from "@/lib/store";

const BADGE_STYLES: Record<string, string> = {
  gold: "bg-[#111111] text-white",
  white: "border border-[var(--border)] bg-white text-[#111111]",
  red: "bg-[#ea4335] text-white",
  outline: "border border-[#cfd4dc] bg-white text-[#111111]",
};

interface StoreProductCardProps {
  product: Product;
  showSubtitle?: boolean;
  showSizes?: boolean;
}

export function StoreProductCard({
  product,
  showSubtitle = true,
  showSizes = false,
}: StoreProductCardProps) {
  const { addItem } = useCart();
  const timeoutRef = useRef<number | null>(null);
  const [selectedSize, setSelectedSize] = useState<ProductSize | null>(
    getDefaultSize(product),
  );
  const [added, setAdded] = useState(false);

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleAdd = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    const size = selectedSize ?? getDefaultSize(product);
    if (!size) {
      return;
    }

    addItem(buildCartItem(product, getDefaultColor(product), size));
    setAdded(true);

    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = window.setTimeout(() => {
      setAdded(false);
      timeoutRef.current = null;
    }, 1800);
  };

  const availableSizes = product.sizes.filter((size) => size.available).map((size) => size.size);

  return (
    <article className="group relative overflow-hidden rounded-[30px] border border-[var(--border)] bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_80px_rgba(17,17,17,0.08)]">
      <Link
        href={`/product/${product.id}`}
        aria-label={`Xem ${product.name}`}
        className="absolute inset-0 z-10"
      />

      <div className="relative overflow-hidden bg-[var(--surface)]">
        <div className="aspect-[4/5]">
          <ProductMedia
            image={product.images[0]}
            bgClass={product.colors[0].bgClass}
            className="h-full w-full transition-transform duration-700 group-hover:scale-[1.04]"
            imageClassName="h-full w-full object-cover"
            svgClassName="h-[72px] w-[72px] opacity-20"
            stroke="rgba(0,0,0,0.1)"
          />
        </div>

        {product.tag ? (
          <div
            className={[
              "absolute left-4 top-4 rounded-full px-3 py-1 font-heading size-kicker-xs font-semibold uppercase tracking-[0.16em]",
              BADGE_STYLES[product.tagVariant ?? "gold"] ?? BADGE_STYLES.gold,
            ].join(" ")}
          >
            {product.tag}
          </div>
        ) : null}

        <button
          type="button"
          onClick={handleAdd}
          className={[
            "absolute bottom-4 right-4 z-20 flex h-11 w-11 items-center justify-center rounded-full border border-white/85 shadow-[0_16px_34px_rgba(0,0,0,0.12)] transition-all duration-300",
            added
              ? "bg-[#1f9d61] text-white"
              : "bg-white text-[#111111] hover:bg-store-blue hover:text-white",
          ].join(" ")}
        >
          {added ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
        </button>
      </div>

      <div className="space-y-4 p-5">
        <div>
          <h3 className="max-w-[14ch] font-heading type-vn-compact size-title-xs font-semibold uppercase text-[#111111]">
            {product.name}
          </h3>
          {showSubtitle ? (
            <p className="mt-1.5 text-sm leading-6 text-store-muted">{product.subtitle}</p>
          ) : null}
        </div>

        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="font-heading size-title-base font-semibold text-[#111111]">
              {formatVnd(product.price)}
            </p>
            {product.oldPrice ? (
              <p className="mt-1 text-sm text-store-muted line-through">
                {formatVnd(product.oldPrice)}
              </p>
            ) : null}
          </div>

          <div className="flex items-center gap-1.5">
            {product.colors.slice(0, 4).map((color) => (
              <span
                key={color.name}
                className="block h-4 w-4 rounded-full border border-black/10"
                style={{ backgroundColor: color.hex }}
              />
            ))}
          </div>
        </div>

        {showSizes ? (
          <div className="flex flex-wrap gap-2">
            {product.sizes.map((size) => {
              const active = selectedSize === size.size;
              return (
                <button
                  key={size.size}
                  type="button"
                  disabled={!availableSizes.includes(size.size)}
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    if (availableSizes.includes(size.size)) {
                      setSelectedSize(size.size);
                    }
                  }}
                  className={[
                    "min-w-10 rounded-full border px-3 py-1.5 font-heading size-kicker font-semibold uppercase tracking-[0.16em] transition-colors",
                    !availableSizes.includes(size.size)
                      ? "cursor-not-allowed border-[var(--border)] text-[#c0c6cf] line-through"
                      : active
                        ? "border-[#111111] bg-[#111111] text-white"
                        : "border-[var(--border)] bg-[var(--surface)] text-store-muted hover:border-store-blue hover:text-store-blue",
                  ].join(" ")}
                >
                  {size.size}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
    </article>
  );
}
