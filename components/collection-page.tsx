"use client";

import { SlidersHorizontal, Sparkles, X } from "lucide-react";
import { useMemo, useState } from "react";
import { StoreProductCard } from "@/components/store-product-card";
import {
  formatVnd,
  type Product,
  type ProductSize,
  type Voucher,
} from "@/lib/store";

type SortMode = "default" | "price-asc" | "price-desc" | "newest";

interface Filters {
  sizes: ProductSize[];
  minPrice: number;
  maxPrice: number;
}

interface FilterControlsProps {
  filters: Filters;
  onToggleSize: (size: ProductSize) => void;
  onMinPrice: (value: number) => void;
  onMaxPrice: (value: number) => void;
  onReset: () => void;
}

const PRICE_MIN = 0;
const PRICE_MAX = 1000;
const SIZES: ProductSize[] = ["S", "M", "L", "XL", "XXL"];
const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: "default", label: "Mặc định" },
  { value: "price-asc", label: "Giá tăng dần" },
  { value: "price-desc", label: "Giá giảm dần" },
  { value: "newest", label: "Mới nhất" },
];

function filterProducts(products: Product[], filters: Filters, sortMode: SortMode): Product[] {
  let next = products.filter((product) => {
    const availableSizes = product.sizes.filter((size) => size.available).map((size) => size.size);
    if (filters.sizes.length && !filters.sizes.some((size) => availableSizes.includes(size))) {
      return false;
    }

    const compactPrice = product.price / 1000;
    if (compactPrice < filters.minPrice || compactPrice > filters.maxPrice) {
      return false;
    }

    return true;
  });

  if (sortMode === "price-asc") {
    next = [...next].sort((left, right) => left.price - right.price);
  }

  if (sortMode === "price-desc") {
    next = [...next].sort((left, right) => right.price - left.price);
  }

  if (sortMode === "newest") {
    next = [...next].sort(
      (left, right) => Number(Boolean(right.tag === "NEW")) - Number(Boolean(left.tag === "NEW")),
    );
  }

  return next;
}

function VoucherBanner({ vouchers }: { vouchers: Voucher[] }) {
  if (!vouchers.length) {
    return null;
  }

  return (
    <section className="border-b border-[var(--border)] bg-white">
      <div className="mx-auto flex max-w-[1240px] gap-3 overflow-x-auto px-4 py-4 sm:px-6 lg:px-8">
        {vouchers.map((voucher) => (
          <div
            key={voucher.code}
            className="min-w-[220px] rounded-[24px] border border-[#d9e1ff] bg-store-blue-soft px-4 py-4"
          >
            <p className="font-heading size-kicker-xs font-semibold uppercase tracking-[0.22em] text-store-blue">
              {voucher.code}
            </p>
            <p className="mt-2 font-heading type-vn-compact size-title-xs font-semibold uppercase text-[#111111]">
              {voucher.label}
            </p>
            <p className="mt-2 text-sm leading-6 text-store-muted">{voucher.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function FilterControls({
  filters,
  onToggleSize,
  onMinPrice,
  onMaxPrice,
  onReset,
}: FilterControlsProps) {
  return (
    <div className="space-y-8">
      <div>
        <p className="font-heading size-kicker font-semibold uppercase tracking-[0.22em] text-store-muted">
          Kích thước
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {SIZES.map((size) => {
            const active = filters.sizes.includes(size);
            return (
              <button
                key={size}
                type="button"
                onClick={() => onToggleSize(size)}
                className={[
                  "min-w-11 rounded-full border px-3 py-2 font-heading size-label font-semibold uppercase tracking-[0.16em] transition-colors",
                  active
                    ? "border-[#111111] bg-[#111111] text-white"
                    : "border-[var(--border)] bg-[var(--surface)] text-store-muted hover:border-store-blue hover:text-store-blue",
                ].join(" ")}
              >
                {size}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between gap-3">
          <p className="font-heading size-kicker font-semibold uppercase tracking-[0.22em] text-store-muted">
            Khoảng giá
          </p>
          <p className="text-sm text-store-muted">
            {formatVnd(filters.minPrice * 1000)} - {formatVnd(filters.maxPrice * 1000)}
          </p>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <input
            type="number"
            min={PRICE_MIN}
            max={filters.maxPrice - 50}
            step={50}
            value={filters.minPrice}
            onChange={(event) => onMinPrice(Math.min(Number(event.target.value), filters.maxPrice - 50))}
            className="rounded-full border border-[var(--border)] bg-white px-4 py-3 text-sm text-[#111111] outline-none focus:border-store-blue"
          />
          <input
            type="number"
            min={filters.minPrice + 50}
            max={PRICE_MAX}
            step={50}
            value={filters.maxPrice}
            onChange={(event) => onMaxPrice(Math.max(Number(event.target.value), filters.minPrice + 50))}
            className="rounded-full border border-[var(--border)] bg-white px-4 py-3 text-sm text-[#111111] outline-none focus:border-store-blue"
          />
        </div>

        <div className="mt-5 rounded-full bg-[var(--surface)] px-3 py-5">
          <input
            type="range"
            min={PRICE_MIN}
            max={PRICE_MAX}
            step={50}
            value={filters.minPrice}
            onChange={(event) => onMinPrice(Math.min(Number(event.target.value), filters.maxPrice - 50))}
            className="w-full accent-[var(--accent)]"
          />
          <input
            type="range"
            min={PRICE_MIN}
            max={PRICE_MAX}
            step={50}
            value={filters.maxPrice}
            onChange={(event) => onMaxPrice(Math.max(Number(event.target.value), filters.minPrice + 50))}
            className="mt-3 w-full accent-[var(--accent)]"
          />
        </div>
      </div>

      <button
        type="button"
        onClick={onReset}
        className="w-full rounded-full border border-[var(--border)] bg-white px-4 py-3 font-heading size-label font-semibold uppercase tracking-[0.18em] text-store-muted transition-colors hover:border-store-blue hover:text-store-blue"
      >
        Xóa bộ lọc
      </button>
    </div>
  );
}

function ActiveFilters({
  filters,
  onRemoveSize,
  onResetPrice,
}: {
  filters: Filters;
  onRemoveSize: (size: ProductSize) => void;
  onResetPrice: () => void;
}) {
  const hasPriceFilter = filters.minPrice > PRICE_MIN || filters.maxPrice < PRICE_MAX;

  if (!filters.sizes.length && !hasPriceFilter) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {filters.sizes.map((size) => (
        <button
          key={size}
          type="button"
          onClick={() => onRemoveSize(size)}
          className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white px-4 py-2 text-sm text-[#111111] transition-colors hover:border-store-blue hover:text-store-blue"
        >
          Size {size}
          <X className="h-3.5 w-3.5" />
        </button>
      ))}

      {hasPriceFilter ? (
        <button
          type="button"
          onClick={onResetPrice}
          className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white px-4 py-2 text-sm text-[#111111] transition-colors hover:border-store-blue hover:text-store-blue"
        >
          {filters.minPrice}K - {filters.maxPrice}K
          <X className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </div>
  );
}

function MobileFilterSheet({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <>
      <div
        className={[
          "fixed inset-0 z-40 bg-black/35 transition-opacity duration-300 lg:hidden",
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
        ].join(" ")}
        onClick={onClose}
      />
      <div
        className={[
          "fixed inset-x-0 bottom-0 z-50 max-h-[82vh] rounded-t-[28px] border border-[var(--border)] bg-white p-5 shadow-[0_-20px_60px_rgba(17,17,17,0.18)] transition-transform duration-300 lg:hidden",
          open ? "translate-y-0" : "translate-y-full",
        ].join(" ")}
      >
        <div className="mx-auto mb-5 h-1.5 w-14 rounded-full bg-[var(--border)]" />
        <div className="mb-5 flex items-center justify-between">
          <p className="font-heading size-title-base font-semibold uppercase tracking-[0.08em] text-[#111111]">
            Lọc sản phẩm
          </p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[var(--border)] p-2 text-store-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="overflow-y-auto pr-1">{children}</div>
      </div>
    </>
  );
}

export function CollectionPage({
  products,
  vouchers,
}: {
  products: Product[];
  vouchers: Voucher[];
}) {
  const [filters, setFilters] = useState<Filters>({
    sizes: [],
    minPrice: PRICE_MIN,
    maxPrice: PRICE_MAX,
  });
  const [sortMode, setSortMode] = useState<SortMode>("default");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const filteredProducts = useMemo(
    () => filterProducts(products, filters, sortMode),
    [products, filters, sortMode],
  );

  const filterControls = (
    <FilterControls
      filters={filters}
      onToggleSize={(size) =>
        setFilters((current) => ({
          ...current,
          sizes: current.sizes.includes(size)
            ? current.sizes.filter((entry) => entry !== size)
            : [...current.sizes, size],
        }))
      }
      onMinPrice={(value) => setFilters((current) => ({ ...current, minPrice: value }))}
      onMaxPrice={(value) => setFilters((current) => ({ ...current, maxPrice: value }))}
      onReset={() =>
        setFilters({
          sizes: [],
          minPrice: PRICE_MIN,
          maxPrice: PRICE_MAX,
        })
      }
    />
  );

  return (
    <div className="min-h-screen bg-[var(--background)] text-[#111111]">
      <VoucherBanner vouchers={vouchers} />

      <section className="border-b border-[var(--border)] bg-white">
        <div className="mx-auto grid max-w-[1240px] gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1.08fr_0.92fr] lg:px-8 lg:py-10">
          <div>
            <p className="font-heading size-label font-semibold uppercase tracking-[0.28em] text-store-blue">
              Danh mục sản phẩm
            </p>
            <h1 className="mt-3 max-w-[14ch] font-heading type-vn-display size-display-sm font-semibold uppercase text-[#111111] sm:max-w-[15ch] sm:size-display-md">
              Tìm nhanh món phù hợp với nhu cầu hôm nay.
            </h1>
          <p className="mt-4 max-w-[580px] size-copy-md text-store-muted">
              Duyệt toàn bộ sản phẩm hoặc lọc nhanh theo size và khoảng giá để tìm
              đúng món bạn cần hôm nay.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-[28px] bg-store-blue p-6 text-white">
              <p className="font-heading size-kicker font-semibold uppercase tracking-[0.22em] text-white/65">
                Nghe Hustle
              </p>
              <p className="mt-3 max-w-[14ch] font-heading type-vn-title size-title-sm font-semibold uppercase">
                Streetwear tối giản — dễ mặc, dễ phối từng ngày.
              </p>
            </div>
            <div className="rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-6">
              <p className="font-heading size-kicker font-semibold uppercase tracking-[0.22em] text-store-muted">
                Đang hiển thị
              </p>
              <p className="mt-3 font-heading size-title-lg font-semibold uppercase leading-none text-[#111111]">
                {filteredProducts.length}
              </p>
              <p className="mt-2 text-sm leading-6 text-store-muted">
                sản phẩm phù hợp với bộ lọc hiện tại.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1240px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <ActiveFilters
            filters={filters}
            onRemoveSize={(size) =>
              setFilters((current) => ({
                ...current,
                sizes: current.sizes.filter((entry) => entry !== size),
              }))
            }
            onResetPrice={() =>
              setFilters((current) => ({
                ...current,
                minPrice: PRICE_MIN,
                maxPrice: PRICE_MAX,
              }))
            }
          />

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(true)}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white px-4 py-3 font-heading size-label font-semibold uppercase tracking-[0.18em] text-[#111111] lg:hidden"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Bộ lọc
            </button>

            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white px-4 py-3 text-sm text-store-muted">
              <Sparkles className="h-4 w-4 text-store-blue" />
              {filteredProducts.length} sản phẩm hiển thị
            </div>

            <select
              value={sortMode}
              onChange={(event) => setSortMode(event.target.value as SortMode)}
              className="rounded-full border border-[var(--border)] bg-white px-4 py-3 text-sm text-[#111111] outline-none focus:border-store-blue"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[270px_minmax(0,1fr)]">
          <aside className="hidden lg:block">
            <div className="sticky top-[132px] rounded-[32px] border border-[var(--border)] bg-white p-6">
              <p className="font-heading type-vn-compact size-title-xs font-semibold uppercase text-[#111111]">
                Bộ lọc
              </p>
              <div className="mt-6">{filterControls}</div>
            </div>
          </aside>

          <div>
            {filteredProducts.length === 0 ? (
              <div className="rounded-[32px] border border-dashed border-[var(--border)] bg-white px-6 py-20 text-center">
                <p className="mx-auto max-w-[14ch] font-heading type-vn-title size-title-sm font-semibold uppercase text-[#111111]">
                  Chưa có sản phẩm phù hợp
                </p>
                <p className="mt-3 text-sm leading-6 text-store-muted">
                  Hãy thử nới khoảng giá hoặc bỏ bớt bộ lọc kích thước.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {filteredProducts.map((product) => (
                  <StoreProductCard key={product.id} product={product} showSizes />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <MobileFilterSheet open={mobileFiltersOpen} onClose={() => setMobileFiltersOpen(false)}>
        {filterControls}
      </MobileFilterSheet>
    </div>
  );
}
