"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useCart } from "@/components/cart-context";
import { ProductMedia } from "@/components/product-media";
import {
  BRAND_PERKS,
  buildCartItem,
  formatCompactPrice,
  getDefaultSize,
  type Product,
  type ProductColor,
  type ProductSize,
} from "@/lib/store";

type AddState = "idle" | "loading" | "success";

// ─── Dữ liệu bảng hướng dẫn chọn size ───────────────────────────────────────
const SIZE_GUIDE_COLS = ["S", "M", "L", "XL", "2XL", "3XL"];
const SIZE_GUIDE_ROWS = [
  { label: "Chiều cao (cm)", values: ["155–160", "160–165", "165–172", "172–177", "177–183", "183–189"] },
  { label: "Cân nặng (kg)",  values: ["48–55",   "55–62",   "62–69",   "69–76",   "76–85",   "85–90"]  },
  { label: "Dài thân trước", values: ["65",   "67",   "69",   "71",   "73",   "75"]   },
  { label: "1/2 ngang ngực", values: ["47",   "49",   "51",   "53",   "55",   "57"]   },
  { label: "1/2 ngang gấu",  values: ["47",   "40",   "51",   "53",   "55",   "57"]   },
  { label: "Dài tay",        values: ["34.5", "36",   "37",   "39",   "40.5", "42"]   },
  { label: "Rộng bắp tay",   values: ["19.6", "20.4", "21.2", "22",   "22.8", "23.6"] },
  { label: "Rộng cửa tay",   values: ["16",   "16.5", "16",   "17",   "18",   "18.5"] },
  { label: "Ngang cổ",       values: ["16",   "15.5", "15",   "16.5", "17",   "17.5"] },
];

// ─── Icon components ──────────────────────────────────────────────────────────
const IconCart = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={className ?? "w-5 h-5"}>
    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <path d="M16 10a4 4 0 01-8 0" />
  </svg>
);

const IconHeart = ({ filled }: { filled: boolean }) => (
  <svg viewBox="0 0 24 24" fill={filled ? "#F5A800" : "none"} stroke={filled ? "#F5A800" : "currentColor"} strokeWidth={1.5} className="w-4 h-4">
    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
  </svg>
);

const IconCheck = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const IconPlus = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3.5 h-3.5">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const IconChevL = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
    <path d="M15 18l-6-6 6-6" />
  </svg>
);

const IconChevR = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
    <path d="M9 18l6-6-6-6" />
  </svg>
);

const IconX = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const IconRuler = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={className ?? "w-3.5 h-3.5"}>
    <path d="M21 5L3 5a1 1 0 00-1 1v4a1 1 0 001 1h18a1 1 0 001-1V6a1 1 0 00-1-1z" />
    <line x1="7"  y1="5"  x2="7"  y2="8"  />
    <line x1="11" y1="5"  x2="11" y2="9"  />
    <line x1="15" y1="5"  x2="15" y2="8"  />
    <line x1="19" y1="5"  x2="19" y2="8"  />
  </svg>
);

// ─── Stars ────────────────────────────────────────────────────────────────────
function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= Math.floor(rating);
        const half = !filled && star === Math.ceil(rating) && !Number.isInteger(rating);
        return (
          <svg key={star} viewBox="0 0 24 24" className="w-3.5 h-3.5" fill={filled ? "#F5A800" : half ? "url(#half-star)" : "rgba(255,255,255,0.15)"}>
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        );
      })}
      <svg width="0" height="0" className="absolute">
        <defs>
          <linearGradient id="half-star" x1="0" x2="1" y1="0" y2="0">
            <stop offset="50%" stopColor="#F5A800" />
            <stop offset="50%" stopColor="rgba(255,255,255,0.2)" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

// ─── Spinner ──────────────────────────────────────────────────────────────────
function Spinner() {
  return <div className="w-5 h-5 border-2 border-white/20 border-t-gold-500 rounded-full animate-spin flex-shrink-0" />;
}

// ─── SizeGuideModal ───────────────────────────────────────────────────────────
function SizeGuideModal({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handler);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handler);
    };
  }, [onClose]);

  return (
    <>
      {/* ── Overlay ── */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-[3px] z-[400]"
        onClick={onClose}
      />

      {/* ── Shell: bottom-sheet on mobile / centered card on desktop ── */}
      <div className="fixed inset-x-0 bottom-0 z-[401] md:inset-0 md:flex md:items-center md:justify-center md:p-6 pointer-events-none">
        <div className="pointer-events-auto w-full md:max-w-2xl flex flex-col max-h-[88vh] md:max-h-[82vh] bg-[#0d0d0d] border border-white/10 rounded-t-2xl md:rounded-none shadow-[0_-8px_40px_rgba(0,0,0,0.7)] md:shadow-[0_24px_60px_rgba(0,0,0,0.8)]">

          {/* Pill handle (mobile only) */}
          <div className="md:hidden flex justify-center pt-3 pb-1 flex-shrink-0">
            <div className="w-9 h-1 rounded-full bg-white/20" />
          </div>

          {/* Gold accent bar */}
          <div className="h-[2px] flex-shrink-0 mx-0 bg-gradient-to-r from-transparent via-gold-500/80 to-transparent" />

          {/* ── Header ── */}
          <div className="flex items-center justify-between px-5 py-4 flex-shrink-0">
            <div className="flex items-center gap-3">
              {/* Measurement icon badge */}
              <div className="w-8 h-8 flex items-center justify-center border border-gold-500/30 bg-gold-500/5 flex-shrink-0">
                <IconRuler className="w-4 h-4 text-gold-500" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-[0.78rem] tracking-[0.15em] uppercase text-white leading-none">
                  Bảng Hướng Dẫn Chọn Size
                </h3>
                <p className="text-[0.62rem] font-body text-zinc-500 mt-1 tracking-[0.1em] uppercase">
                  Đơn vị đo: cm
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/8 border border-transparent hover:border-white/15 transition-all duration-150 cursor-pointer flex-shrink-0"
              aria-label="Đóng"
            >
              <IconX />
            </button>
          </div>

          {/* Divider */}
          <div className="h-px mx-5 bg-white/8 flex-shrink-0" />

          {/* ── Table ── */}
          <div className="overflow-auto flex-1 overscroll-contain">
            <table className="w-full text-sm border-collapse" style={{ minWidth: 500 }}>
              <thead>
                <tr>
                  {/* Empty corner — sticky */}
                  <th className="sticky left-0 z-10 bg-[#0d0d0d] shadow-[4px_0_12px_rgba(0,0,0,0.5)] min-w-[136px] py-3 px-4" />
                  {SIZE_GUIDE_COLS.map((col) => (
                    <th
                      key={col}
                      className="py-3 px-3 min-w-[68px] font-heading font-bold text-center text-[0.85rem] tracking-[0.08em] text-gold-500"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
                {/* Header separator */}
                <tr>
                  <td colSpan={SIZE_GUIDE_COLS.length + 1} className="p-0">
                    <div className="h-px bg-white/10" />
                  </td>
                </tr>
              </thead>

              <tbody>
                {SIZE_GUIDE_ROWS.map((row, i) => (
                  <tr
                    key={row.label}
                    className={`transition-colors hover:bg-gold-500/[0.04] ${i % 2 === 1 ? "bg-white/[0.025]" : ""}`}
                  >
                    {/* Sticky label cell */}
                    <td className="sticky left-0 z-10 bg-[#0d0d0d] shadow-[4px_0_12px_rgba(0,0,0,0.4)] py-3 px-4 font-heading font-semibold text-[0.74rem] tracking-wide text-zinc-300 whitespace-nowrap border-r border-white/[0.06]">
                      {row.label}
                    </td>
                    {row.values.map((val, j) => (
                      <td
                        key={j}
                        className="py-3 px-3 text-center text-[0.82rem] font-body text-zinc-400 tabular-nums"
                      >
                        {val}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Footer ── */}
          <div className="h-px mx-5 bg-white/8 flex-shrink-0" />
          <div className="flex items-start gap-2 px-5 py-3.5 flex-shrink-0">
            <span className="text-gold-500/70 font-bold text-[0.7rem] leading-4 mt-px flex-shrink-0">✱</span>
            <p className="text-[0.69rem] font-body text-zinc-500 leading-relaxed">
              Số đo tính bằng{" "}
              <span className="text-zinc-300 font-semibold">cm</span>.
              {" "}Sản phẩm có thể chênh lệch ±1–2 cm tuỳ lô sản xuất.
            </p>
          </div>

        </div>
      </div>
    </>
  );
}

// ─── ImageGallery ─────────────────────────────────────────────────────────────
function ImageGallery({
  images,
  selectedColor,
  tag,
}: {
  images: Product["images"];
  selectedColor: ProductColor;
  tag?: string;
}) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft")  setActive((i) => (i - 1 + images.length) % images.length);
      if (event.key === "ArrowRight") setActive((i) => (i + 1) % images.length);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [images.length]);

  const current = images[active];

  return (
    // FIX MOBILE: đổi thành flex-col trên mobile, flex-row trên desktop.
    // Trước đây outer là flex-row khiến thumbnail strip w-full đẩy ảnh chính ra khỏi viewport.
    <div className="flex flex-col md:flex-row gap-px bg-brand-gray-mid md:sticky md:top-[57px] md:h-[calc(100vh-57px)]">

      {/* Thumbnail strip — hiển thị trên cùng (mobile) hoặc bên trái (desktop) */}
      <div className="order-2 md:order-1 flex flex-row md:flex-col gap-px w-full md:w-[88px] md:flex-shrink-0 overflow-x-auto md:overflow-y-auto md:overflow-x-hidden h-[72px] md:h-auto scrollbar-none flex-shrink-0">
        {images.map((image, index) => (
          <button
            key={image.id}
            onClick={() => setActive(index)}
            aria-label={image.alt}
            className={[
              "flex-shrink-0 w-[72px] h-[72px] md:w-[88px] md:h-[88px] flex items-center justify-center overflow-hidden bg-brand-gray-dark border-2 transition-colors duration-200 cursor-pointer",
              active === index ? "border-gold-500" : "border-transparent hover:border-gold-500/30",
            ].join(" ")}
          >
            <ProductMedia
              image={image}
              bgClass={image.bgClass}
              className="h-full w-full flex items-center justify-center transition-transform duration-300 hover:scale-105"
              imageClassName="h-full w-full object-cover"
              svgClassName="h-8 w-8"
              stroke="rgba(245,168,0,0.35)"
              strokeWidth={1}
            />
          </button>
        ))}
      </div>

      {/* Main image — full width + aspect-square trên mobile, flex-1 trên desktop */}
      <div className="order-1 md:order-2 relative w-full md:flex-1 bg-brand-gray-mid flex items-center justify-center overflow-hidden aspect-square md:aspect-auto">
        <ProductMedia
          image={current}
          bgClass={current.bgClass}
          className="absolute inset-0 h-full w-full flex items-center justify-center transition-transform duration-700"
          imageClassName="h-full w-full object-cover"
          svgClassName="h-36 w-36 md:h-48 md:w-48"
          stroke="rgba(245,168,0,0.15)"
          strokeWidth={0.4}
        />

        {tag ? (
          <div className="absolute top-4 left-4 bg-gold-500 text-brand-black font-heading text-[0.65rem] font-bold tracking-[0.15em] uppercase px-2.5 py-1 z-10">
            {tag}
          </div>
        ) : null}

        <div className="absolute top-4 right-4 border border-white/15 bg-black/40 px-3 py-1 font-heading text-[0.68rem] tracking-[0.15em] uppercase text-white/60 z-10">
          {selectedColor.name}
        </div>

        <button
          onClick={() => setActive((i) => (i - 1 + images.length) % images.length)}
          aria-label="Ảnh trước"
          className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/60 border border-white/15 text-white/70 flex items-center justify-center cursor-pointer hover:border-gold-500/40 hover:text-gold-500 transition-all duration-200 z-10"
        >
          <IconChevL />
        </button>
        <button
          onClick={() => setActive((i) => (i + 1) % images.length)}
          aria-label="Ảnh tiếp theo"
          className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/60 border border-white/15 text-white/70 flex items-center justify-center cursor-pointer hover:border-gold-500/40 hover:text-gold-500 transition-all duration-200 z-10"
        >
          <IconChevR />
        </button>

        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
          {images.map((image, index) => (
            <button
              key={image.id}
              onClick={() => setActive(index)}
              aria-label={`Ảnh ${index + 1}`}
              className={`h-1.5 rounded-full transition-all duration-200 border-none cursor-pointer ${index === active ? "bg-gold-500 w-4" : "bg-white/30 hover:bg-white/60 w-1.5"}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── SizeSelector ─────────────────────────────────────────────────────────────
function SizeSelector({
  sizes,
  selected,
  onSelect,
  onShowGuide,
}: {
  sizes: Product["sizes"];
  selected: ProductSize | null;
  onSelect: (size: ProductSize) => void;
  onShowGuide: () => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3.5">
        <p className="font-heading text-[0.72rem] tracking-[0.2em] uppercase text-white/40 font-bold">
          Size — <span className="text-white font-bold">{selected ?? "Chưa chọn"}</span>
        </p>
        <button
          onClick={onShowGuide}
          className="flex items-center gap-1 font-heading text-[0.65rem] tracking-widest uppercase text-gold-500/70 hover:text-gold-500 transition-colors bg-transparent border-none cursor-pointer"
        >
          <IconRuler />
          Hướng dẫn chọn size
        </button>
      </div>
      <div className="flex gap-1.5 flex-wrap">
        {sizes.map(({ size, available }) => (
          <button
            key={size}
            disabled={!available}
            onClick={() => available && onSelect(size)}
            className={[
              "min-w-[52px] px-3 py-2 font-heading font-bold text-[0.9rem] tracking-wide border transition-all duration-200 relative",
              !available
                ? "opacity-30 cursor-not-allowed border-white/10 text-white/40 line-through"
                : selected === size
                  ? "bg-gold-500 border-gold-500 text-brand-black"
                  : "bg-transparent border-white/15 text-white/70 hover:border-gold-500/40 hover:text-gold-500 cursor-pointer",
            ].join(" ")}
          >
            {size}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── QtyControl ───────────────────────────────────────────────────────────────
function QtyControl({ qty, onChange, max }: { qty: number; onChange: (value: number) => void; max: number }) {
  const disabled = max <= 0;
  return (
    <div className="flex items-center border border-white/15">
      <button onClick={() => onChange(Math.max(1, qty - 1))} disabled={disabled} className="w-9 h-9 flex items-center justify-center bg-transparent border-none cursor-pointer disabled:cursor-not-allowed text-white/70 hover:text-gold-500 hover:bg-brand-gray-mid font-heading font-bold text-lg transition-all duration-200">-</button>
      <span className="w-10 text-center font-heading font-bold text-[0.95rem] border-x border-white/15 leading-9 select-none">{qty}</span>
      <button onClick={() => onChange(Math.min(max, qty + 1))} disabled={disabled} className="w-9 h-9 flex items-center justify-center bg-transparent border-none cursor-pointer disabled:cursor-not-allowed text-white/70 hover:text-gold-500 hover:bg-brand-gray-mid font-heading font-bold text-lg transition-all duration-200">+</button>
    </div>
  );
}

// ─── AddToCartButton ──────────────────────────────────────────────────────────
function AddToCartButton({ disabled, onAdd }: { disabled: boolean; onAdd: () => void }) {
  const [state, setState] = useState<AddState>("idle");
  const onAddRef = useRef(onAdd);
  useEffect(() => { onAddRef.current = onAdd; });

  useEffect(() => {
    if (state !== "loading") return;
    const id = window.setTimeout(() => { onAddRef.current(); setState("success"); }, 800);
    return () => window.clearTimeout(id);
  }, [state]);

  useEffect(() => {
    if (state !== "success") return;
    const id = window.setTimeout(() => setState("idle"), 2500);
    return () => window.clearTimeout(id);
  }, [state]);

  const handleClick = () => { if (state === "idle" && !disabled) setState("loading"); };

  const styles: Record<AddState, string> = {
    idle:    "bg-gold-500 border-gold-500 text-brand-black hover:bg-white hover:border-white",
    loading: "bg-brand-gray-mid border-white/15 text-white/40 cursor-not-allowed",
    success: "bg-transparent border-green-400 text-green-400 cursor-not-allowed",
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled || state !== "idle"}
      className={[
        "group w-full py-4 flex items-center justify-center gap-2.5 font-heading text-[1rem] font-bold tracking-[0.18em] uppercase border-2 transition-all duration-300 relative overflow-hidden",
        disabled && state === "idle" ? "bg-brand-gray-mid border-white/15 text-white/40 cursor-not-allowed" : styles[state],
      ].join(" ")}
    >
      {state === "idle" && !disabled ? (
        <span className="absolute inset-0 bg-white scale-x-0 origin-right group-hover:scale-x-100 group-hover:origin-left transition-transform duration-350 z-0" />
      ) : null}
      <span className="relative z-10 flex items-center gap-2.5">
        {state === "idle" ? (
          <>{disabled ? "Hết hàng hoặc chưa chọn size" : <><IconCart className="w-[18px] h-[18px]" />Thêm vào giỏ hàng</>}</>
        ) : state === "loading" ? (
          <><Spinner />Đang thêm...</>
        ) : (
          <><IconCheck />Đã thêm vào giỏ</>
        )}
      </span>
    </button>
  );
}

// ─── RelatedProducts ──────────────────────────────────────────────────────────
function RelatedProducts({ products }: { products: Product[] }) {
  const { addItem } = useCart();
  const [addedIds, setAddedIds] = useState<number[]>([]);
  const timeoutsRef = useRef<Map<number, number>>(new Map());

  useEffect(() => {
    const timeouts = timeoutsRef.current;
    return () => timeouts.forEach((id) => window.clearTimeout(id));
  }, []);

  const handleQuickAdd = (event: React.MouseEvent, product: Product) => {
    event.preventDefault();
    event.stopPropagation();
    const defaultSize = getDefaultSize(product);
    if (!defaultSize) return;
    const existingId = timeoutsRef.current.get(product.id);
    if (existingId !== undefined) window.clearTimeout(existingId);
    addItem(buildCartItem(product, product.colors[0], defaultSize));
    setAddedIds((current) => [...current, product.id]);
    const timeoutId = window.setTimeout(() => {
      setAddedIds((current) => current.filter((id) => id !== product.id));
      timeoutsRef.current.delete(product.id);
    }, 1800);
    timeoutsRef.current.set(product.id, timeoutId);
  };

  const perkLabels = BRAND_PERKS.map((perk) => perk.title).join(" · ");

  return (
    <section className="px-5 md:px-8 py-16 bg-brand-gray-dark border-t border-white/[0.06]">
      <div className="flex items-end justify-between mb-8 gap-4">
        <div>
          <h2 className="font-display leading-[0.95] tracking-wide" style={{ fontSize: "clamp(1.8rem,4vw,2.5rem)" }}>
            SẢN PHẨM <span className="text-gold-500">LIÊN QUAN</span>
          </h2>
          <p className="text-white/35 text-sm mt-2">{perkLabels}</p>
        </div>
        <Link href="/collection" className="font-heading text-[0.75rem] tracking-[0.15em] uppercase text-white/40 hover:text-gold-500 no-underline border-b border-white/20 hover:border-gold-500 pb-px transition-all duration-200">
          Xem tất cả →
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-px">
        {products.map((product) => {
          const added = addedIds.includes(product.id);
          return (
            <div key={product.id} className="group relative overflow-hidden bg-brand-gray-mid aspect-[3/4]">
              <Link href={`/product/${product.id}`} aria-label={`Xem ${product.name}`} className="absolute inset-0 z-10" />
              <ProductMedia
                image={product.images[0]}
                bgClass={product.colors[0].bgClass}
                className="h-full w-full flex items-center justify-center transition-transform duration-700 group-hover:scale-105"
                imageClassName="h-full w-full object-cover"
                svgClassName="h-16 w-16"
                stroke="rgba(245,168,0,0.12)"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
              {product.tag ? (
                <div className="absolute top-3 left-3 font-heading text-[0.6rem] font-bold tracking-[0.15em] uppercase px-2 py-0.5 bg-gold-500 text-brand-black z-20">
                  {product.tag}
                </div>
              ) : null}
              <div className="absolute bottom-0 left-0 right-0 p-3.5 transition-transform duration-400 group-hover:-translate-y-1.5 z-20">
                <p className="font-heading text-[0.9rem] font-bold uppercase tracking-wide mb-0.5">{product.name}</p>
                <div className="flex items-center justify-between">
                  <span className="font-display text-[1.15rem] text-gold-500">{formatCompactPrice(product.price)}</span>
                  <button
                    onClick={(event) => handleQuickAdd(event, product)}
                    className={["w-[30px] h-[30px] flex items-center justify-center border-none cursor-pointer transition-all duration-200 relative z-20", "scale-0 group-hover:scale-100", added ? "bg-white text-brand-black" : "bg-gold-500 text-brand-black"].join(" ")}
                  >
                    {added ? <IconCheck /> : <IconPlus />}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ─── ProductDetailView (main export) ─────────────────────────────────────────
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
  const [qty, setQty] = useState(1);
  const [wished, setWished] = useState(false);
  const [showSizeGuide, setShowSizeGuide] = useState(false);

  const selectedColor = useMemo(() => product.colors[selectedColorIndex], [product.colors, selectedColorIndex]);
  const selectedColorStock = selectedColor.stockCount ?? product.stockCount;

  const galleryImages = useMemo(() => {
    const selectedColorId = selectedColor.id;
    if (!selectedColorId) return product.images;
    const next = product.images.filter((img) => img.colorId == null || img.colorId === selectedColorId);
    return next.length ? next : product.images;
  }, [product.images, selectedColor.id]);

  const discountPct = product.oldPrice
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
    : 0;

  return (
    <div className="bg-brand-black text-white font-body min-h-screen">
      {/* Breadcrumb */}
      <div className="px-5 md:px-8 py-2.5 border-b border-white/[0.06] flex items-center gap-2 font-heading text-[0.72rem] tracking-[0.15em] uppercase text-white/40">
        <Link href="/" className="hover:text-gold-500 transition-colors no-underline text-white/40">Trang Chủ</Link>
        <span className="text-white/15">/</span>
        <Link href="/collection" className="hover:text-gold-500 transition-colors no-underline text-white/40">Bộ Sưu Tập</Link>
        <span className="text-white/15">/</span>
        <span className="text-gold-500">{product.name}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2">
        <ImageGallery
          key={selectedColor.name}
          images={galleryImages}
          selectedColor={selectedColor}
          tag={product.tag}
        />

        <div className="px-5 md:px-8 py-8 overflow-y-auto bg-brand-black">
          <p className="flex items-center gap-2.5 font-heading text-[0.72rem] tracking-[0.25em] uppercase text-gold-500 font-bold mb-3">
            <span className="w-6 h-0.5 bg-gold-500 inline-block" />
            {product.category}
          </p>

          <h1 className="font-display leading-[0.92] tracking-wide mb-4" style={{ fontSize: "clamp(2rem,4vw,3.2rem)" }}>
            {product.name}
            <br />
            <span className="text-gold-500">{product.subtitle}</span>
          </h1>

          <div className="flex items-center gap-3 mb-5">
            <Stars rating={product.rating} />
            <span className="font-heading text-[0.78rem] text-white/40 tracking-wide">
              {product.rating} · {product.reviewCount} đánh giá
            </span>
          </div>

          <div className="flex items-baseline gap-3 mb-6 pb-6 border-b border-white/[0.08]">
            <span className="font-display text-[2.8rem] text-gold-500 leading-none">{formatCompactPrice(product.price)}</span>
            {product.oldPrice ? (
              <span className="font-heading text-[1.1rem] text-white/40 line-through">{formatCompactPrice(product.oldPrice)}</span>
            ) : null}
            {discountPct > 0 ? (
              <span className="bg-red-400/15 border border-red-400/30 text-red-400 font-heading text-[0.7rem] font-bold tracking-widest uppercase px-2 py-0.5">
                -{discountPct}%
              </span>
            ) : null}
          </div>

          {/* Specs */}
          <div className="grid grid-cols-2 gap-1 mb-6 pb-6 border-b border-white/[0.08]">
            {product.specs.map((spec) => (
              <div key={spec.label} className="bg-brand-gray-mid px-3.5 py-2.5">
                <p className="font-heading text-[0.65rem] tracking-[0.18em] uppercase text-white/40 font-bold mb-0.5">{spec.label}</p>
                <p className="font-heading text-[0.9rem] font-bold tracking-wide text-white">{spec.value}</p>
              </div>
            ))}
          </div>

          {/* Màu sắc */}
          <div className="mb-6 pb-6 border-b border-white/[0.08]">
            <p className="font-heading text-[0.72rem] tracking-[0.2em] uppercase text-white/40 font-bold mb-3.5">
              Màu Sắc — <span className="text-white font-bold">{selectedColor.name}</span>
            </p>
            <div className="flex gap-2">
              {product.colors.map((color, index) => (
                <button
                  key={color.name}
                  onClick={() => { setSelectedColorIndex(index); setQty(1); }}
                  title={color.name}
                  className={["relative w-8 h-8 border-2 transition-all duration-200 cursor-pointer", selectedColorIndex === index ? "border-gold-500" : "border-transparent hover:opacity-80"].join(" ")}
                  style={{ backgroundColor: color.hex }}
                >
                  {selectedColorIndex === index ? <span className="absolute -inset-1.5 border-2 border-gold-500 pointer-events-none" /> : null}
                </button>
              ))}
            </div>
          </div>

          {/* Size selector */}
          <div className="mb-6 pb-6 border-b border-white/[0.08]">
            <SizeSelector
              sizes={product.sizes}
              selected={selectedSize}
              onSelect={setSelectedSize}
              onShowGuide={() => setShowSizeGuide(true)}
            />
          </div>

          {/* Số lượng */}
          <div className="flex items-center gap-5 mb-5">
            <div>
              <p className="font-heading text-[0.72rem] tracking-[0.2em] uppercase text-white/40 font-bold mb-2">Số Lượng</p>
              <QtyControl qty={qty} onChange={setQty} max={Math.max(0, selectedColorStock)} />
            </div>
            <p className="font-heading text-[0.75rem] tracking-widest text-white/40 pt-5">
              <span className="text-green-400 font-bold">Còn {Math.max(0, selectedColorStock)}</span>{" "}sản phẩm
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2.5 mb-6">
            <AddToCartButton
              disabled={!selectedSize || selectedColorStock <= 0}
              onAdd={() => {
                if (!selectedSize || selectedColorStock <= 0) return;
                addItem(buildCartItem(product, selectedColor, selectedSize, qty));
              }}
            />
            <button
              onClick={() => setWished((v) => !v)}
              className={["w-full py-3.5 flex items-center justify-center gap-2 border font-heading text-[0.85rem] font-bold tracking-[0.12em] uppercase transition-all duration-200 bg-transparent cursor-pointer", wished ? "border-gold-500/35 text-gold-500" : "border-white/15 text-white/70 hover:border-gold-500/35 hover:text-gold-500"].join(" ")}
            >
              <IconHeart filled={wished} />
              {wished ? "Đã yêu thích" : "Yêu thích"}
            </button>
          </div>

          {/* Description */}
          <div className="border-t border-white/[0.08] pt-6 mb-5">
            <p className="text-[0.9rem] text-white/70 leading-relaxed font-light mb-5">{product.description}</p>
            <ul className="space-y-2">
              {product.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2.5 text-[0.85rem] text-white/70">
                  <span className="w-1.5 h-1.5 bg-gold-500 flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <RelatedProducts products={relatedProducts} />

      {/* Size guide modal */}
      {showSizeGuide ? <SizeGuideModal onClose={() => setShowSizeGuide(false)} /> : null}
    </div>
  );
}
