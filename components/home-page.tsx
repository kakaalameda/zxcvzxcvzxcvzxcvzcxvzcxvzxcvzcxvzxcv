"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Flag, Package, RefreshCw, Truck } from "lucide-react";
import { ProductMedia } from "@/components/product-media";
import { BRAND_PERKS, formatVnd, type Product } from "@/lib/store";

const PERK_ICONS = [Truck, RefreshCw, Package, Flag];

function extractFirstNumber(value: string | undefined, fallback: string) {
  const match = value?.match(/\d+/);
  return match?.[0] ?? fallback;
}

function getSpecValue(product: Product, labels: string[], fallback: string) {
  return product.specs.find((spec) => labels.includes(spec.label))?.value ?? fallback;
}

function HeroSection({ heroProduct }: { heroProduct: Product }) {
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const selectedColor = heroProduct.colors[selectedColorIndex] ?? heroProduct.colors[0];
  const weightSpec = getSpecValue(heroProduct, ["Định lượng"], "");
  const eyebrow = weightSpec ? `Sản phẩm nổi bật — ${weightSpec}` : "Sản phẩm nổi bật";
  const description = heroProduct.description.trim();
  const specPills = heroProduct.specs.slice(0, 4);

  const galleryImages = useMemo(() => {
    if (!selectedColor.id) {
      return heroProduct.images;
    }

    const matches = heroProduct.images.filter(
      (image) => image.colorId == null || image.colorId === selectedColor.id,
    );

    return matches.length ? matches : heroProduct.images;
  }, [heroProduct.images, selectedColor.id]);

  const activeImage = galleryImages[activeImageIndex] ?? galleryImages[0];

  return (
    <section className="border-b border-[var(--border)] bg-white">
      <div className="mx-auto grid max-w-[1280px] gap-10 px-4 pb-0 pt-10 sm:px-6 lg:grid-cols-[minmax(0,0.9fr)_500px] lg:px-8 lg:pt-16">
        <div className="pb-10 lg:pb-14">
          <p className="size-kicker-xs uppercase tracking-[0.24em] text-store-blue">
            {eyebrow}
          </p>

          <h1 className="mt-6 max-w-[21ch] font-editorial text-[clamp(2.0rem,3.8vw,3.2rem)] leading-[0.93] tracking-[-0.05em] text-[#171513]">
            <span>{heroProduct.name}</span>
            <span className="mt-2 block italic text-[#7b746c]">{heroProduct.subtitle}</span>
          </h1>

          <p className="mt-6 max-w-[500px] size-copy-md whitespace-pre-line text-store-muted">
            {description}
          </p>

          <div className="mt-8 flex flex-wrap gap-2">
            {specPills.map((spec) => (
              <span
                key={`${spec.label}-${spec.value}`}
                className="rounded-full border border-[var(--border)] bg-white px-3.5 py-2 text-[0.73rem] tracking-[0.02em] text-[#3b3732]"
              >
                <strong className="font-semibold text-[#171513]">{spec.label}</strong>
                {` — ${spec.value}`}
              </span>
            ))}
          </div>

          <div className="hidden">
            <div className="flex items-center gap-3 text-[0.72rem] uppercase tracking-[0.14em] text-[#3b3732]">
              <span>Màu sắc</span>
              <span className="normal-case tracking-normal text-[#5f5850]">— {selectedColor.name}</span>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              {heroProduct.colors.map((color, index) => (
                <button
                  key={color.name}
                  type="button"
                  title={color.name}
                  onClick={() => {
                    setSelectedColorIndex(index);
                    setActiveImageIndex(0);
                  }}
                  className={[
                    "h-9 w-9 rounded-full border-2 transition duration-150",
                    index === selectedColorIndex
                      ? "scale-[1.08] border-store-blue shadow-[0_0_0_2px_white,0_0_0_4px_#2447f9]"
                      : "border-black/10 hover:scale-[1.08] hover:border-black/30",
                  ].join(" ")}
                  style={{ backgroundColor: color.hex }}
                />
              ))}
            </div>
          </div>

          <div className="hidden">
            <Link
              href={`/product/${heroProduct.id}`}
              className="inline-flex min-w-[220px] items-center justify-center rounded-full bg-[#111111] px-6 py-3.5 font-heading size-action font-semibold uppercase tracking-[0.18em] text-white no-underline shadow-[0_14px_30px_rgba(17,17,17,0.12)] transition-colors hover:bg-store-blue"
            >
              Mua ngay — {formatVnd(heroProduct.price)}
            </Link>
            <Link
              href={`/product/${heroProduct.id}`}
              className="inline-flex min-w-[140px] items-center justify-center rounded-full border border-[var(--border)] bg-white px-6 py-3.5 font-heading size-action font-semibold uppercase tracking-[0.18em] text-[#111111] no-underline transition-colors hover:border-store-blue hover:text-store-blue"
            >
              Chọn size
            </Link>
          </div>
        </div>

        <div className="flex flex-col items-center lg:pt-2">
          <div className="w-full max-w-[500px] rounded-[40px] bg-[#eff2f8] p-5 sm:p-6">
            <div className="overflow-hidden rounded-[28px] bg-white">
              <div className="aspect-[4/4.55]">
                <ProductMedia
                  image={activeImage}
                  bgClass={activeImage.bgClass}
                  className="flex h-full w-full items-center justify-center"
                  imageClassName="h-full w-full object-cover"
                  svgClassName="h-[220px] w-[220px] opacity-20"
                  stroke="rgba(0,0,0,0.08)"
                />
              </div>
            </div>

            {galleryImages.length > 1 ? (
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                {galleryImages.map((image, index) => (
                  <button
                    key={`${image.id}-${index}`}
                    type="button"
                    onClick={() => setActiveImageIndex(index)}
                    className={[
                      "shrink-0 overflow-hidden rounded-[16px] border bg-white shadow-sm transition-all",
                      index === activeImageIndex
                        ? "border-store-blue shadow-[0_10px_30px_rgba(36,71,249,0.16)]"
                        : "border-[var(--border)] hover:border-store-blue",
                    ].join(" ")}
                    aria-label={`Xem ảnh ${index + 1} của ${heroProduct.name}`}
                  >
                    <div className="h-[68px] w-[68px]">
                      <ProductMedia
                        image={image}
                        bgClass={image.bgClass}
                        className="h-full w-full"
                        imageClassName="h-full w-full object-cover"
                        svgClassName="h-9 w-9 opacity-15"
                        stroke="rgba(0,0,0,0.08)"
                      />
                    </div>
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="mt-4 inline-flex rounded-full bg-white px-4 py-2 font-heading size-action font-semibold text-[#111111] shadow-sm">
            {formatVnd(heroProduct.price)}
          </div>

          <div className="mt-4 w-full max-w-[500px] border-t border-[var(--border)] pb-10 pt-4 text-sm text-[#5d5650] lg:pb-12">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-heading size-label font-semibold uppercase tracking-[0.16em] text-[#111111]">
                  {heroProduct.name}
                </p>
                <p className="mt-1 leading-6">{heroProduct.subtitle}</p>
              </div>
              <Link
                href={`/product/${heroProduct.id}`}
                className="inline-flex min-w-[170px] items-center justify-center gap-2 rounded-full bg-[#111111] px-6 py-3.5 font-heading size-action font-semibold uppercase tracking-[0.18em] text-white no-underline shadow-[0_14px_30px_rgba(17,17,17,0.12)] transition-colors hover:bg-store-blue"
              >
                Xem chi tiết
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="mt-6">
              <div className="flex items-center gap-3 text-[0.72rem] uppercase tracking-[0.14em] text-[#3b3732]">
                <span>Màu sắc</span>
                <span className="normal-case tracking-normal text-[#5f5850]">— {selectedColor.name}</span>
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                {heroProduct.colors.map((color, index) => (
                  <button
                    key={color.name}
                    type="button"
                    title={color.name}
                    aria-pressed={index === selectedColorIndex}
                    onClick={() => {
                      setSelectedColorIndex(index);
                      setActiveImageIndex(0);
                    }}
                    className={[
                      "h-9 w-9 rounded-full border-2 transition duration-150",
                      index === selectedColorIndex
                        ? "scale-[1.08] border-store-blue shadow-[0_0_0_2px_white,0_0_0_4px_#2447f9]"
                        : "border-black/10 hover:scale-[1.08] hover:border-black/30",
                    ].join(" ")}
                    style={{ backgroundColor: color.hex }}
                  />
                ))}
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                href={`/product/${heroProduct.id}`}
                className="inline-flex min-w-[220px] items-center justify-center rounded-full bg-[#111111] px-6 py-3.5 font-heading size-action font-semibold uppercase tracking-[0.18em] text-white no-underline shadow-[0_14px_30px_rgba(17,17,17,0.12)] transition-colors hover:bg-store-blue"
              >
                Mua ngay — {formatVnd(heroProduct.price)}
              </Link>
              <Link
                href={`/product/${heroProduct.id}`}
                className="inline-flex min-w-[140px] items-center justify-center rounded-full border border-[var(--border)] bg-white px-6 py-3.5 font-heading size-action font-semibold uppercase tracking-[0.18em] text-[#111111] no-underline transition-colors hover:border-store-blue hover:text-store-blue"
              >
                Chọn size
              </Link>
            </div>
          </div>

          <div className="hidden">
            <div>
              <p className="font-heading size-label font-semibold uppercase tracking-[0.16em] text-[#111111]">
                {heroProduct.name}
              </p>
              <p className="mt-1 leading-6">{heroProduct.subtitle}</p>
            </div>
            <Link
              href={`/product/${heroProduct.id}`}
              className="inline-flex items-center gap-2 whitespace-nowrap text-[0.73rem] font-semibold uppercase tracking-[0.16em] text-[#171513] no-underline transition-colors hover:text-store-blue"
            >
              Xem chi tiết
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function Ticker({ heroProduct }: { heroProduct: Product }) {
  const weightSpec =
    heroProduct.specs.find((spec) => spec.label === "Định lượng")?.value ?? "240 GSM";
  const tickerItems = [
    weightSpec,
    "New Drop 2026",
    "Made in Vietnam",
    `${heroProduct.colors.length} màu dễ phối`,
    "Free Ship từ 500K",
    "Đổi trả 30 ngày",
  ];

  return (
    <section className="overflow-hidden bg-[#111111] py-2.5">
      <div className="flex animate-marquee whitespace-nowrap">
        {[...tickerItems, ...tickerItems].map((item, index) => (
          <span key={`${item}-${index}`} className="inline-flex items-center px-5">
            <span className="font-heading text-[0.7rem] uppercase tracking-[0.18em] text-white">
              {item}
            </span>
            <span className="ml-5 text-[0.75rem] text-[#b75443]">—</span>
          </span>
        ))}
      </div>
    </section>
  );
}

function DetailStrip({ heroProduct }: { heroProduct: Product }) {
  const materialSpec =
    heroProduct.specs.find((spec) => spec.label === "Chất liệu")?.value ?? "100% Cotton";
  const weightSpec =
    heroProduct.specs.find((spec) => spec.label === "Định lượng")?.value ?? "240 GSM";
  const weightNumber = extractFirstNumber(weightSpec, "240");
  const materialNumber = extractFirstNumber(materialSpec, "100");

  const detailItems = [
    {
      number: weightNumber,
      title: "Gram per square meter",
      text: `${weightSpec} — đủ chắc để lên phom gọn, đủ thoáng để mặc liên tục trong nhịp sống hằng ngày.`,
    },
    {
      number: String(heroProduct.colors.length),
      title: "Màu sắc dễ phối",
      text: `Bảng màu gọn với ${heroProduct.colors.length} lựa chọn nền tảng, ưu tiên những tông dễ mặc lại lâu dài.`,
    },
    {
      number: materialNumber,
      title: "% chất liệu nền",
      text: `${materialSpec}. ${heroProduct.features[0] ?? "Hoàn thiện đáng tin để mặc được lâu hơn."}`,
    },
  ];

  return (
    <section className="bg-[#ebe7e0] px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
      <div className="mx-auto grid max-w-[980px] gap-8 lg:grid-cols-3 lg:gap-0">
        {detailItems.map((item, index) => (
          <div
            key={item.title}
            className={[
              "lg:px-10",
              index !== detailItems.length - 1 ? "lg:border-r lg:border-black/10" : "",
              index === 0 ? "lg:pl-0" : "",
            ].join(" ")}
          >
            <p className="font-editorial text-[3rem] italic leading-none tracking-[-0.04em] text-black/15">
              {item.number}
            </p>
            <h2 className="mt-3 text-[0.98rem] font-semibold text-[#171513]">{item.title}</h2>
            <p className="mt-2 max-w-[28ch] text-sm leading-7 text-[#5a544e]">{item.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function FeaturedGallery({ products }: { products: Product[] }) {
  const gridColumnsClass =
    products.length >= 4 ? "xl:grid-cols-4" : products.length === 3 ? "xl:grid-cols-3" : "xl:grid-cols-2";

  return (
    <section className="bg-white px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
      <div className="mx-auto max-w-[1240px]">
        <div className="flex items-end justify-between gap-4 border-b border-[#ece6de] pb-4">
          <div>
            <p className="text-[0.72rem] uppercase tracking-[0.2em] text-[#8b847b]">
              Sản phẩm nổi bật
            </p>
            <h2 className="mt-2 font-editorial text-[clamp(2rem,3vw,2.35rem)] leading-none tracking-[-0.03em] text-[#171513]">
              Mặc đẹp, chọn nhanh.
            </h2>
          </div>
          <Link
            href="/collection"
            className="hidden border-b border-[#bdb5ab] pb-1 text-[0.76rem] font-semibold uppercase tracking-[0.14em] text-[#3b3732] no-underline transition-colors hover:border-[#171513] sm:inline-flex"
          >
            Xem tất cả
          </Link>
        </div>

        <div className={`mt-6 grid gap-px bg-[#ece6de] sm:grid-cols-2 ${gridColumnsClass}`}>
          {products.map((product) => (
            <Link
              key={product.id}
              href={`/product/${product.id}`}
              className="group bg-white no-underline transition-colors hover:bg-[#faf7f2]"
            >
              <div className="relative aspect-[3/4] overflow-hidden bg-[#f5f1eb]">
                <ProductMedia
                  image={product.images[0]}
                  bgClass="from-[#f5f1eb] to-[#f0ebe3]"
                  className="flex h-full w-full items-center justify-center p-6 transition-transform duration-500 group-hover:scale-[1.02]"
                  imageClassName="h-full w-full object-contain"
                  svgClassName="h-28 w-28 opacity-15"
                  stroke="rgba(0,0,0,0.08)"
                />

                {product.tag ? (
                  <span
                    className={[
                      "absolute left-3 top-3 px-2 py-1 text-[0.58rem] font-semibold uppercase tracking-[0.14em]",
                      product.tagVariant === "red"
                        ? "bg-[#b93c2a] text-white"
                        : "bg-[#111111] text-white",
                    ].join(" ")}
                  >
                    {product.tag}
                  </span>
                ) : null}
              </div>

              <div className="px-4 pb-5 pt-4">
                <h3 className="text-[0.92rem] font-semibold leading-6 text-[#171513]">
                  {product.name}
                </h3>
                <p className="mt-1 text-sm leading-6 text-[#6b645d]">{product.subtitle}</p>
                <p className="mt-3 text-[0.92rem] font-semibold text-[#171513]">
                  {formatVnd(product.price)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function ServiceStrip() {
  return (
    <section className="border-y border-[#ece6de] bg-white">
      <div className="mx-auto grid max-w-[1240px] sm:grid-cols-2 lg:grid-cols-4">
        {BRAND_PERKS.map((perk, index) => {
          const Icon = PERK_ICONS[index];
          return (
            <div
              key={perk.title}
              className="border-b border-[#ece6de] px-6 py-8 last:border-b-0 lg:border-b-0 lg:border-r lg:last:border-r-0"
            >
              <Icon className="h-4 w-4 text-[#171513]" />
              <h3 className="mt-4 text-[0.92rem] font-semibold text-[#171513]">{perk.title}</h3>
              <p className="mt-1 text-sm leading-6 text-[#6b645d]">{perk.text}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function HomePage({
  featuredProducts,
  products,
}: {
  featuredProducts: Product[];
  products: Product[];
}) {
  const catalog = Array.from(new Map([...featuredProducts, ...products].map((product) => [product.id, product])).values());
  const heroProduct = featuredProducts[0] ?? catalog[0] ?? null;
  const galleryProducts = catalog.slice(0, 4);

  if (!heroProduct) {
    return null;
  }

  return (
    <div className="overflow-x-hidden bg-white text-[#111111]">
      <HeroSection heroProduct={heroProduct} />
      <Ticker heroProduct={heroProduct} />
      <DetailStrip heroProduct={heroProduct} />
      <FeaturedGallery products={galleryProducts} />
      <ServiceStrip />
    </div>
  );
}
