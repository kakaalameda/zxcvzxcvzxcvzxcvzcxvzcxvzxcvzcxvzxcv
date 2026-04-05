import Link from "next/link";
import {
  LOOKBOOK_SECTIONS,
  formatCompactPrice,
  getProductById,
} from "@/lib/store";

export default function Page() {
  const sections = LOOKBOOK_SECTIONS.reduce<Array<(typeof LOOKBOOK_SECTIONS)[number] & { product: NonNullable<ReturnType<typeof getProductById>> }>>(
    (accumulator, section) => {
      const product = getProductById(String(section.productId));
      if (!product) {
        return accumulator;
      }

      accumulator.push({ ...section, product });
      return accumulator;
    },
    [],
  );

  return (
    <div className="bg-brand-black text-white">
      <section className="px-5 md:px-8 py-16 md:py-24 border-b border-white/[0.06]">
        <p className="font-heading text-[0.72rem] tracking-[0.22em] uppercase text-gold-500 font-bold mb-3">
          Nghe Hustle
        </p>
        <h1 className="font-display leading-[0.9] tracking-wide mb-5" style={{ fontSize: "clamp(3rem,9vw,7rem)" }}>
          LOOKBOOK
          <br />
          <span className="text-gold-500">SS26</span>
        </h1>
        <p className="max-w-2xl text-white/60 leading-relaxed text-lg">
          Bộ lookbook này không cố làm hình ảnh quá bóng bẩy. Nó được dựng như một extension của đường phố:
          nhanh, gọn, tối, và để quần áo mang trọng tâm chính.
        </p>
      </section>

      <section className="px-5 md:px-8 py-10 md:py-16 space-y-10">
        {sections.map((section, index) => (
          <div
            key={section.title}
            className={`grid grid-cols-1 lg:grid-cols-2 gap-px bg-brand-gray-mid ${index % 2 === 1 ? "lg:[&>*:first-child]:order-2" : ""}`}
          >
            <div className={`min-h-[420px] bg-gradient-to-br ${section.product.colors[0].bgClass} flex items-center justify-center relative overflow-hidden`}>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.08),transparent_35%)]" />
              <svg viewBox="0 0 24 24" fill="none" stroke="rgba(245,168,0,0.15)" strokeWidth={0.5} className="w-40 h-40">
                <path d={section.product.images[0].iconPath} />
              </svg>
            </div>
            <div className="p-8 md:p-12 flex flex-col justify-center">
              <p className="font-heading text-[0.72rem] tracking-[0.2em] uppercase text-gold-500 font-bold mb-3">
                {section.eyebrow}
              </p>
              <h2 className="font-display leading-[0.92] tracking-wide mb-5" style={{ fontSize: "clamp(2rem,5vw,3.4rem)" }}>
                {section.title}
              </h2>
              <p className="text-white/60 leading-relaxed mb-8">{section.text}</p>

              <div className="border border-white/[0.08] bg-black/20 p-5 mb-8">
                <p className="font-heading text-sm tracking-[0.12em] uppercase text-white mb-1">
                  {section.product.name}
                </p>
                <p className="text-white/40 text-sm mb-3">{section.product.subtitle}</p>
                <p className="font-display text-2xl text-gold-500">{formatCompactPrice(section.product.price)}</p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href={`/product/${section.product.id}`}
                  className="inline-flex items-center gap-2 bg-gold-500 text-brand-black font-heading font-bold text-[0.8rem] tracking-[0.15em] uppercase px-6 py-3 no-underline hover:bg-white transition-colors duration-200"
                >
                  Xem sản phẩm
                </Link>
                <Link
                  href="/collection"
                  className="inline-flex items-center gap-2 border border-white/15 text-white/70 font-heading font-bold text-[0.8rem] tracking-[0.15em] uppercase px-6 py-3 no-underline hover:border-gold-500/40 hover:text-gold-500 transition-all duration-200"
                >
                  Xem bộ sưu tập
                </Link>
              </div>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
