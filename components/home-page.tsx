"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/components/cart-context";
import { ProductMedia } from "@/components/product-media";
import {
  BRAND_PERKS,
  BRAND_STATS,
  MARQUEE_ITEMS,
  buildCartItem,
  formatCompactPrice,
  getDefaultColor,
  getDefaultSize,
  type Product,
} from "@/lib/store";

function ArrowRight({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className ?? "w-5 h-5"}>
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-start overflow-hidden px-5 md:px-8">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_70%_50%,rgba(245,168,0,0.08)_0%,transparent_60%)] bg-gradient-to-br from-brand-black via-[#0a0a0a] to-[#1a1100]" />
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(white 1px,transparent 1px),linear-gradient(90deg,white 1px,transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
      <div className="absolute top-0 left-1/2 w-px h-full bg-gradient-to-b from-transparent via-gold-500/30 to-transparent" />

      <div className="relative z-10 max-w-2xl">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-0.5 bg-gold-500" />
          <span className="font-heading text-xs tracking-[0.25em] uppercase text-gold-500 font-bold">
            SS 2026 Collection
          </span>
        </div>

        <h1 className="font-display leading-[0.9] tracking-wide mb-6" style={{ fontSize: "clamp(4rem,12vw,9rem)" }}>
          <span className="block text-gold-500">HUSTLE</span>
          <span className="block text-white">NEVER</span>
          <span className="block text-transparent" style={{ WebkitTextStroke: "2px rgba(255,255,255,0.3)" }}>
            STOPS
          </span>
        </h1>

        <p
          className="text-white/70 leading-relaxed max-w-md mb-10 font-light tracking-wide"
          style={{ fontSize: "clamp(0.9rem,2vw,1rem)" }}
        >
          Streetwear sinh ra từ đường phố Việt Nam. Mỗi thiết kế là một câu chuyện về tham vọng,
          bản sắc và nhịp làm việc không dừng lại.
        </p>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <Link
            href="#arrivals"
            className="group relative inline-flex items-center gap-2.5 bg-gold-500 text-brand-black font-heading text-base font-bold tracking-widest uppercase px-10 py-4 overflow-hidden border-2 border-gold-500 no-underline transition-all duration-300"
          >
            <span className="absolute inset-0 bg-white scale-x-0 origin-right group-hover:scale-x-100 group-hover:origin-left transition-transform duration-300" />
            <span className="relative z-10">Shop Now</span>
            <ArrowRight className="relative z-10 w-4.5 h-4.5 transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
          <Link
            href="/lookbook"
            className="inline-flex items-center gap-2 border border-white/30 text-white font-heading text-sm font-semibold tracking-widest uppercase px-7 py-4 hover:border-gold-500 hover:text-gold-500 transition-all duration-200 no-underline"
          >
            Xem Lookbook
          </Link>
        </div>

        <div className="flex gap-8 md:gap-10 mt-12 pt-8 border-t border-white/[0.08]">
          {BRAND_STATS.map((stat) => (
            <div key={stat.label}>
              <p className="font-display text-3xl text-gold-500 leading-none">{stat.num}</p>
              <p className="font-heading text-xs tracking-widest uppercase text-white/60 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="hidden lg:flex absolute right-[5%] top-1/2 -translate-y-1/2 w-28 h-28 rounded-full bg-gold-500 flex-col items-center justify-center text-brand-black text-center font-display leading-tight animate-spin-slow">
        <span className="text-3xl leading-none">NEW</span>
        <span className="text-sm tracking-widest">DROP</span>
      </div>
    </section>
  );
}

function MarqueeBanner() {
  return (
    <div className="bg-gold-500 py-2.5 overflow-hidden">
      <div className="flex animate-marquee whitespace-nowrap">
        {MARQUEE_ITEMS.map((item, index) => (
          <span key={`${item}-${index}`} className="font-display text-base tracking-widest text-brand-black px-8">
            {item}
            {index < MARQUEE_ITEMS.length - 1 ? <span className="text-black/30 px-2">✦</span> : null}
          </span>
        ))}
      </div>
    </div>
  );
}

function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const defaultSize = getDefaultSize(product);

  const handleAdd = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    if (!defaultSize) {
      return;
    }

    addItem(buildCartItem(product, getDefaultColor(product), defaultSize));
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1500);
  };

  const tagStyles: Record<NonNullable<Product["tagVariant"]>, string> = {
    gold: "bg-gold-500 text-brand-black",
    white: "bg-white text-brand-black",
    red: "bg-red-600 text-white",
    outline: "border border-white/50 text-white",
  };

  return (
    <div className="group relative overflow-hidden bg-brand-gray-mid aspect-[3/4]">
      <Link href={`/product/${product.id}`} aria-label={`Xem ${product.name}`} className="absolute inset-0 z-10" />

      <ProductMedia
        image={product.images[0]}
        bgClass={product.colors[0].bgClass}
        className="h-full w-full flex items-center justify-center transition-transform duration-700 group-hover:scale-105"
        imageClassName="h-full w-full object-cover"
        svgClassName="h-20 w-20 opacity-10"
        stroke="white"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
      {product.tag && product.tagVariant ? (
        <div className={`absolute top-4 left-4 font-heading text-[0.65rem] font-bold tracking-widest uppercase px-2.5 py-0.5 z-20 ${tagStyles[product.tagVariant]}`}>
          {product.tag}
        </div>
      ) : null}

      <div className="absolute bottom-0 left-0 right-0 p-5 transition-transform duration-400 group-hover:-translate-y-2 z-20">
        <p className="font-heading text-lg font-bold tracking-wide uppercase mb-0.5">{product.name}</p>
        <p className="text-white/60 text-xs font-body mb-3">{product.subtitle}</p>
        <div className="flex items-center justify-between">
          <span className="font-display text-2xl text-gold-500">{formatCompactPrice(product.price)}</span>
          <button
            onClick={handleAdd}
            aria-label={`Thêm ${product.name} vào giỏ`}
            className={[
              "w-9 h-9 flex items-center justify-center border-none cursor-pointer transition-all duration-300 z-20 relative",
              "scale-0 group-hover:scale-100",
              added ? "bg-white text-brand-black" : "bg-gold-500 text-brand-black",
            ].join(" ")}
          >
            {added ? <CheckIcon /> : <PlusIcon />}
          </button>
        </div>
      </div>
    </div>
  );
}

function NewArrivals({ featuredProducts }: { featuredProducts: Product[] }) {
  return (
    <section id="arrivals" className="px-5 md:px-8 py-24 bg-brand-black">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4">
        <div>
          <p className="font-heading text-xs tracking-[0.25em] uppercase text-gold-500 font-bold mb-1.5">Mới nhất</p>
          <h2 className="font-display leading-[0.95] tracking-wide" style={{ fontSize: "clamp(2.5rem,6vw,4rem)" }}>
            NEW ARRIVALS
          </h2>
        </div>
        <Link
          href="/collection"
          className="font-heading text-xs tracking-widest uppercase text-white/60 hover:text-gold-500 border-b border-white/30 hover:border-gold-500 pb-0.5 transition-all duration-200 no-underline font-semibold whitespace-nowrap self-start sm:self-auto"
        >
          Xem tất cả →
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-px">
        {featuredProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}

function FeatureBanner() {
  return (
    <section className="relative px-5 md:px-8 py-24 bg-brand-gray-dark overflow-hidden">
      <div
        className="absolute inset-0 flex items-center justify-center font-display text-gold-500/[0.04] select-none pointer-events-none"
        style={{ fontSize: "clamp(6rem,20vw,14rem)", letterSpacing: "0.05em" }}
        aria-hidden
      >
        HUSTLE
      </div>

      <div className="relative z-10 max-w-3xl mx-auto text-center">
        <p className="font-heading text-xs tracking-[0.25em] uppercase text-gold-500 font-bold mb-3">
          Triết lý thương hiệu
        </p>
        <h2 className="font-display leading-[0.95] mb-6" style={{ fontSize: "clamp(2.5rem,7vw,5rem)" }}>
          BORN FROM THE <span className="text-gold-500">STREETS</span>
        </h2>
        <p className="text-white/60 leading-relaxed max-w-lg mx-auto mb-10 font-light">
          Nghe Hustle không chỉ là thời trang. Đây là lời tuyên ngôn về nhịp sống đô thị, về việc
          làm thật, mặc thật và xây bản sắc bằng sản phẩm đủ tốt để mặc lại mỗi ngày.
        </p>
        <Link
          href="/about"
          className="group relative inline-flex items-center gap-2.5 bg-gold-500 text-brand-black font-heading text-base font-bold tracking-widest uppercase px-10 py-4 overflow-hidden border-2 border-gold-500 no-underline transition-all duration-300"
        >
          <span className="absolute inset-0 bg-white scale-x-0 origin-right group-hover:scale-x-100 group-hover:origin-left transition-transform duration-300" />
          <span className="relative z-10">Tìm hiểu thêm</span>
          <ArrowRight className="relative z-10 w-4.5 h-4.5 transition-transform duration-200 group-hover:translate-x-1" />
        </Link>

        <div className="flex flex-wrap justify-center gap-10 mt-16 pt-10 border-t border-white/[0.08]">
          {BRAND_PERKS.map((perk) => (
            <div key={perk.title} className="text-center max-w-[140px]">
              <div className="w-11 h-11 mx-auto mb-3 text-gold-500 border border-gold-500/30 flex items-center justify-center font-display text-lg">
                NH
              </div>
              <p className="font-heading font-bold text-xs tracking-widest uppercase mb-1">{perk.title}</p>
              <p className="text-white/60 text-xs">{perk.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function HomePage({ featuredProducts }: { featuredProducts: Product[] }) {
  return (
    <div className="bg-brand-black text-white font-body overflow-x-hidden">
      <Hero />
      <MarqueeBanner />
      <NewArrivals featuredProducts={featuredProducts} />
      <FeatureBanner />
    </div>
  );
}
