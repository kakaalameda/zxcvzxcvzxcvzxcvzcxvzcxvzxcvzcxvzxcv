"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useCart } from "@/components/cart-context";
import { ProductMedia } from "@/components/product-media";
import {
  buildCartItem,
  formatCompactPrice,
  getDefaultColor,
  getDefaultSize,
  type Product,
  type ProductSize,
  type ProductTagVariant,
  type ProductType,
  type Voucher,
} from "@/lib/store";

type SortMode = "default" | "price-asc" | "price-desc" | "newest";

interface Filters {
  types: ProductType[];
  sizes: ProductSize[];
  minPrice: number;
  maxPrice: number;
}

interface FilterControlsProps {
  products: Product[];
  filters: Filters;
  onToggleType: (type: ProductType) => void;
  onToggleSize: (size: ProductSize) => void;
  onMinPrice: (value: number) => void;
  onMaxPrice: (value: number) => void;
  onReset: () => void;
  idPrefix: string;
}

const PRICE_MIN = 0;
const PRICE_MAX = 1000;
const TYPES: ProductType[] = ["Tee", "Hoodie", "Pants"];
const SIZES: ProductSize[] = ["S", "M", "L", "XL", "XXL"];
const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: "default", label: "Mặc định" },
  { value: "price-asc", label: "Giá: Thấp → Cao" },
  { value: "price-desc", label: "Giá: Cao → Thấp" },
  { value: "newest", label: "Mới nhất" },
];

function filterProducts(products: Product[], filters: Filters, sortMode: SortMode): Product[] {
  let next = products.filter((product) => {
    if (filters.types.length && !filters.types.includes(product.category)) {
      return false;
    }

    const availableSizes = product.sizes.filter((size) => size.available).map((size) => size.size);
    if (filters.sizes.length && !filters.sizes.some((size) => availableSizes.includes(size))) {
      return false;
    }

    const compactPrice = product.price / 1_000;
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
    next = [...next].sort((left, right) => Number(Boolean(right.tag === "NEW")) - Number(Boolean(left.tag === "NEW")));
  }

  return next;
}

const CheckIcon = () => (
  <svg viewBox="0 0 10 10" className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth={3}>
    <polyline points="1,5 4,8 9,2" />
  </svg>
);

const PlusIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5}>
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const DoneIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const FilterIcon = () => (
  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2}>
    <line x1="4" y1="6" x2="20" y2="6" />
    <line x1="8" y1="12" x2="16" y2="12" />
    <line x1="11" y1="18" x2="13" y2="18" />
  </svg>
);

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

function VoucherBanner({ vouchers }: { vouchers: Voucher[] }) {
  const [copied, setCopied] = useState<string | null>(null);

  if (!vouchers.length) {
    return null;
  }

  const handleCopy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      return;
    }

    setCopied(code);
    window.setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="bg-[#111] border-b border-white/[0.06] py-2.5 px-5 overflow-hidden">
      <div className="flex gap-4 overflow-x-auto items-center" style={{ scrollbarWidth: "none" }}>
        <span className="font-heading text-[0.65rem] tracking-[0.18em] uppercase text-gold-500 font-bold whitespace-nowrap flex-shrink-0">
          Voucher
        </span>
        <div className="w-px h-4 bg-white/[0.08] flex-shrink-0" />
        {vouchers.map((voucher) => {
          const active = copied === voucher.code;
          return (
            <button
              key={voucher.code}
              onClick={() => handleCopy(voucher.code)}
              className={[
                "flex items-center gap-2 px-3 py-1.5 border flex-shrink-0 cursor-pointer transition-all duration-200 bg-transparent",
                active ? "bg-green-500/10 border-green-500/30" : "bg-gold-500/10 border-gold-500/30 hover:bg-gold-500/20",
              ].join(" ")}
            >
              <code className={`font-heading text-xs font-bold tracking-wider ${active ? "text-green-400" : "text-gold-500"}`}>
                {voucher.code}
              </code>
              <span className="text-[0.72rem] text-white/60 font-body hidden sm:inline">{voucher.desc}</span>
              <span className={`text-[0.65rem] font-heading tracking-wider uppercase ${active ? "text-green-400" : "text-white/30"}`}>
                {active ? "Đã copy!" : "Copy"}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function FilterControls({
  products,
  filters,
  onToggleType,
  onToggleSize,
  onMinPrice,
  onMaxPrice,
  onReset,
  idPrefix,
}: FilterControlsProps) {
  const typeCounts = {
    Tee: products.filter((product) => product.category === "Tee").length,
    Hoodie: products.filter((product) => product.category === "Hoodie").length,
    Pants: products.filter((product) => product.category === "Pants").length,
  };

  const fillLeft = `${(filters.minPrice / PRICE_MAX) * 100}%`;
  const fillRight = `${100 - (filters.maxPrice / PRICE_MAX) * 100}%`;
  const sectionTitle =
    "font-heading text-[0.65rem] tracking-[0.2em] uppercase text-white/30 font-bold mb-3 pb-2 border-b border-white/[0.06]";

  return (
    <div className="space-y-7">
      <div>
        <p className={sectionTitle}>Loại sản phẩm</p>
        <div className="space-y-2">
          {TYPES.map((type) => {
            const checked = filters.types.includes(type);
            return (
              <label key={type} className="flex items-center justify-between cursor-pointer group py-0.5" onClick={() => onToggleType(type)}>
                <div className="flex items-center gap-2.5">
                  <div className={`w-4 h-4 border flex items-center justify-center flex-shrink-0 transition-all duration-200 ${checked ? "bg-gold-500 border-gold-500 text-brand-black" : "border-white/30 group-hover:border-gold-500/50"}`}>
                    {checked ? <CheckIcon /> : null}
                  </div>
                  <span className={`font-heading text-sm font-semibold tracking-wider uppercase transition-colors ${checked ? "text-gold-500" : "text-white/70 group-hover:text-gold-500"}`}>
                    {type}
                  </span>
                </div>
                <span className="text-xs text-white/25 font-body">{typeCounts[type]}</span>
              </label>
            );
          })}
        </div>
      </div>

      <div>
        <p className={sectionTitle}>Size</p>
        <div className="space-y-2">
          {SIZES.map((size) => {
            const checked = filters.sizes.includes(size);
            return (
              <label key={size} className="flex items-center gap-2.5 cursor-pointer group py-0.5" onClick={() => onToggleSize(size)}>
                <div className={`w-4 h-4 border flex items-center justify-center flex-shrink-0 transition-all duration-200 ${checked ? "bg-gold-500 border-gold-500 text-brand-black" : "border-white/30 group-hover:border-gold-500/50"}`}>
                  {checked ? <CheckIcon /> : null}
                </div>
                <span className={`font-heading text-sm font-semibold tracking-wider uppercase transition-colors ${checked ? "text-gold-500" : "text-white/70 group-hover:text-gold-500"}`}>
                  {size}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      <div>
        <p className={sectionTitle}>Khoảng giá (K)</p>
        <div className="flex gap-2 mb-3">
          <input
            id={`${idPrefix}-min`}
            type="number"
            min={PRICE_MIN}
            max={filters.maxPrice - 50}
            step={50}
            value={filters.minPrice}
            onChange={(event) => onMinPrice(Math.min(Number(event.target.value), filters.maxPrice - 50))}
            className="flex-1 w-0 bg-[#1E1E1E] border border-white/[0.08] text-white/70 font-heading text-xs px-2 py-1.5 text-center focus:outline-none focus:border-gold-500/40"
          />
          <span className="self-center text-white/30 text-xs font-heading flex-shrink-0">-</span>
          <input
            id={`${idPrefix}-max`}
            type="number"
            min={filters.minPrice + 50}
            max={PRICE_MAX}
            step={50}
            value={filters.maxPrice}
            onChange={(event) => onMaxPrice(Math.max(Number(event.target.value), filters.minPrice + 50))}
            className="flex-1 w-0 bg-[#1E1E1E] border border-white/[0.08] text-white/70 font-heading text-xs px-2 py-1.5 text-center focus:outline-none focus:border-gold-500/40"
          />
        </div>
        <div className="relative h-0.5 bg-[#2A2A2A] mx-2 mb-4">
          <div className="absolute h-full bg-gold-500 top-0" style={{ left: fillLeft, right: fillRight }} />
          <input
            type="range"
            min={PRICE_MIN}
            max={PRICE_MAX}
            step={50}
            value={filters.minPrice}
            onChange={(event) => onMinPrice(Math.min(Number(event.target.value), filters.maxPrice - 50))}
            className="absolute w-[calc(100%+1rem)] -left-2 -top-[7px] appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gold-500 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-brand-black"
          />
          <input
            type="range"
            min={PRICE_MIN}
            max={PRICE_MAX}
            step={50}
            value={filters.maxPrice}
            onChange={(event) => onMaxPrice(Math.max(Number(event.target.value), filters.minPrice + 50))}
            className="absolute w-[calc(100%+1rem)] -left-2 -top-[7px] appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gold-500 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-brand-black"
          />
        </div>
      </div>

      <button
        onClick={onReset}
        className="w-full bg-transparent border border-white/[0.08] text-white/30 font-heading text-[0.72rem] tracking-[0.15em] uppercase font-bold py-2 cursor-pointer hover:border-gold-500/30 hover:text-gold-500 transition-all duration-200"
      >
        Xoá bộ lọc
      </button>
    </div>
  );
}

function CollectionProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const availableSizes = product.sizes.filter((size) => size.available).map((size) => size.size);
  const [selectedSize, setSelectedSize] = useState<ProductSize | null>(getDefaultSize(product));
  const [added, setAdded] = useState(false);

  const quickAdd = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    if (!selectedSize) {
      return;
    }

    addItem(buildCartItem(product, getDefaultColor(product), selectedSize));
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  };

  const tagStyles: Record<Exclude<ProductTagVariant, "outline">, string> = {
    gold: "bg-gold-500 text-brand-black",
    white: "bg-white text-brand-black",
    red: "bg-red-600 text-white",
  };

  return (
    <div className="group relative overflow-hidden bg-[#1E1E1E]" style={{ aspectRatio: "3/4" }}>
      <Link href={`/product/${product.id}`} aria-label={`Xem ${product.name}`} className="absolute inset-0 z-10" />

      <ProductMedia
        image={product.images[0]}
        bgClass={product.colors[0].bgClass}
        className="h-full w-full flex items-center justify-center transition-transform duration-700 group-hover:scale-105"
        imageClassName="h-full w-full object-cover"
        svgClassName="h-[72px] w-[72px]"
        stroke="rgba(245,168,0,0.1)"
      />

      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/15 to-transparent" />

      {product.tag && product.tagVariant && product.tagVariant !== "outline" ? (
        <div className={`absolute top-3.5 left-3.5 font-heading text-[0.6rem] font-bold tracking-[0.15em] uppercase px-2.5 py-0.5 z-20 ${tagStyles[product.tagVariant]}`}>
          {product.tag}
        </div>
      ) : null}

      <div className="absolute bottom-0 left-0 right-0 p-4 transition-transform duration-300 group-hover:-translate-y-1.5 z-20">
        <p className="font-heading text-base font-bold tracking-wide uppercase leading-tight mb-0.5">{product.name}</p>
        <p className="text-white/40 text-[0.7rem] font-body mb-2.5">{product.subtitle}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-1.5">
            <span className="font-display text-2xl text-gold-500">{formatCompactPrice(product.price)}</span>
            {product.oldPrice ? <span className="font-heading text-xs text-white/30 line-through">{formatCompactPrice(product.oldPrice)}</span> : null}
          </div>
          <button
            onClick={quickAdd}
            aria-label={`Thêm ${product.name} vào giỏ`}
            className={`w-9 h-9 flex items-center justify-center border-none cursor-pointer transition-all duration-300 relative z-20 ${added ? "bg-white text-brand-black" : "bg-gold-500 text-brand-black"} scale-100 md:scale-0 md:group-hover:scale-100`}
          >
            {added ? <DoneIcon /> : <PlusIcon />}
          </button>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 flex gap-1 bg-black/95 p-2 z-20 transition-all duration-300 opacity-100 translate-y-0 md:opacity-0 md:translate-y-full md:group-hover:opacity-100 md:group-hover:translate-y-0">
        {SIZES.map((size) => {
          const available = availableSizes.includes(size);
          const active = selectedSize === size;

          return (
            <button
              key={size}
              disabled={!available}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                if (available) {
                  setSelectedSize(size);
                }
              }}
              className={`flex-1 font-heading text-[0.72rem] font-bold tracking-wider uppercase py-1.5 border transition-all duration-150 ${!available ? "border-white/10 text-white/20 line-through cursor-not-allowed bg-transparent" : active ? "border-gold-500 bg-gold-500 text-brand-black cursor-pointer" : "border-white/30 text-white/70 hover:bg-gold-500 hover:border-gold-500 hover:text-brand-black cursor-pointer bg-transparent"}`}
            >
              {size}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MobileDrawer({ open, onClose, ...rest }: FilterControlsProps & { open: boolean; onClose: () => void }) {
  return (
    <>
      <div className={`fixed inset-0 bg-black/70 z-40 transition-opacity duration-300 ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`} onClick={onClose} />
      <div className={`fixed left-0 top-0 h-full w-4/5 max-w-[300px] bg-[#111] z-50 overflow-y-auto transition-transform duration-[350ms] ease-[cubic-bezier(0.25,0.46,0.45,0.94)] ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="p-5">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/[0.06]">
            <span className="font-display text-2xl text-gold-500 tracking-wider">BỘ LỌC</span>
            <button onClick={onClose} className="text-white/30 hover:text-white transition-colors p-1 bg-transparent border-none cursor-pointer">
              <CloseIcon />
            </button>
          </div>
          <FilterControls {...rest} />
          <button onClick={onClose} className="w-full mt-6 bg-gold-500 text-brand-black font-heading font-bold text-sm tracking-[0.15em] uppercase py-3 hover:opacity-90 transition-opacity cursor-pointer border-none">
            Áp dụng bộ lọc
          </button>
        </div>
      </div>
    </>
  );
}

function ActiveFilterTags({
  filters,
  onRemoveType,
  onRemoveSize,
  onRemovePrice,
}: {
  filters: Filters;
  onRemoveType: (type: ProductType) => void;
  onRemoveSize: (size: ProductSize) => void;
  onRemovePrice: () => void;
}) {
  const hasPriceFilter = filters.minPrice > PRICE_MIN || filters.maxPrice < PRICE_MAX;

  if (!filters.types.length && !filters.sizes.length && !hasPriceFilter) {
    return null;
  }

  const chip =
    "inline-flex items-center gap-1.5 bg-gold-500/10 border border-gold-500/30 px-2.5 py-1 font-heading text-[0.68rem] tracking-[0.1em] uppercase text-gold-500 font-bold cursor-pointer hover:bg-gold-500/20 transition-all duration-150";

  return (
    <div className="flex flex-wrap gap-1.5 px-5 py-2.5">
      {filters.types.map((type) => (
        <div key={type} className={chip} onClick={() => onRemoveType(type)}>
          {type} <span className="opacity-60 text-base leading-none">×</span>
        </div>
      ))}
      {filters.sizes.map((size) => (
        <div key={size} className={chip} onClick={() => onRemoveSize(size)}>
          Size {size} <span className="opacity-60 text-base leading-none">×</span>
        </div>
      ))}
      {hasPriceFilter ? (
        <div className={chip} onClick={onRemovePrice}>
          {filters.minPrice}K-{filters.maxPrice}K <span className="opacity-60 text-base leading-none">×</span>
        </div>
      ) : null}
    </div>
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
    types: [],
    sizes: [],
    minPrice: PRICE_MIN,
    maxPrice: PRICE_MAX,
  });
  const [sortMode, setSortMode] = useState<SortMode>("default");
  const [drawerOpen, setDrawerOpen] = useState(false);

  const filtered = useMemo(
    () => filterProducts(products, filters, sortMode),
    [products, filters, sortMode],
  );

  const filterProps: FilterControlsProps = {
    products,
    filters,
    onToggleType: (type) =>
      setFilters((current) => ({
        ...current,
        types: current.types.includes(type)
          ? current.types.filter((entry) => entry !== type)
          : [...current.types, type],
      })),
    onToggleSize: (size) =>
      setFilters((current) => ({
        ...current,
        sizes: current.sizes.includes(size)
          ? current.sizes.filter((entry) => entry !== size)
          : [...current.sizes, size],
      })),
    onMinPrice: (value) => setFilters((current) => ({ ...current, minPrice: value })),
    onMaxPrice: (value) => setFilters((current) => ({ ...current, maxPrice: value })),
    onReset: () =>
      setFilters({
        types: [],
        sizes: [],
        minPrice: PRICE_MIN,
        maxPrice: PRICE_MAX,
      }),
    idPrefix: "desk",
  };

  return (
    <div className="min-h-screen bg-brand-black text-white font-body overflow-x-hidden">
      <VoucherBanner vouchers={vouchers} />

      <div className="px-5 py-7 border-b border-white/[0.06]">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="font-heading text-[0.7rem] tracking-[0.25em] uppercase text-gold-500 font-bold mb-1.5">
              Nghe Hustle
            </p>
            <h1 className="font-display leading-[0.95] tracking-wide" style={{ fontSize: "clamp(2.2rem,6vw,3.5rem)" }}>
              BỘ SƯU TẬP
            </h1>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-heading text-[0.75rem] tracking-wider text-white/30 whitespace-nowrap">
              {filtered.length} sản phẩm
            </span>
            <button
              onClick={() => setDrawerOpen(true)}
              className="md:hidden flex items-center gap-1.5 bg-[#1E1E1E] border border-white/[0.08] text-white/60 font-heading text-[0.78rem] tracking-[0.1em] uppercase font-bold px-3.5 py-2 hover:border-gold-500/30 hover:text-gold-500 transition-all duration-200 cursor-pointer"
            >
              <FilterIcon /> Bộ lọc
            </button>
            <select
              value={sortMode}
              onChange={(event) => setSortMode(event.target.value as SortMode)}
              className="bg-[#1E1E1E] border border-white/[0.08] text-white/60 font-heading text-[0.78rem] tracking-wider py-2 px-3 focus:outline-none focus:border-gold-500/30 cursor-pointer min-w-[148px] appearance-none"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <ActiveFilterTags
        filters={filters}
        onRemoveType={filterProps.onToggleType}
        onRemoveSize={filterProps.onToggleSize}
        onRemovePrice={() => setFilters((current) => ({ ...current, minPrice: PRICE_MIN, maxPrice: PRICE_MAX }))}
      />

      <div className="flex min-h-[calc(100vh-200px)]">
        <aside className="hidden md:block w-56 flex-shrink-0 border-r border-white/[0.06] p-5 bg-[#111] sticky top-[76px] self-start max-h-[calc(100vh-76px)] overflow-y-auto">
          <FilterControls {...filterProps} />
        </aside>

        <section className="flex-1 p-4 md:p-5 min-w-0">
          {filtered.length === 0 ? (
            <div className="text-center py-24">
              <div className="w-14 h-14 mx-auto mb-4 opacity-10">
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={1} className="w-full h-full">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>
              <p className="font-display text-3xl text-white/15 tracking-wide">KHÔNG TÌM THẤY</p>
              <p className="text-white/30 text-sm mt-2">Thử điều chỉnh bộ lọc của bạn</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-px">
              {filtered.map((product) => (
                <CollectionProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>
      </div>

      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} {...filterProps} idPrefix="mob" />
    </div>
  );
}
