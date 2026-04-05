import Link from "next/link";
import { ABOUT_VALUES, BRAND_PERKS, BRAND_STATS } from "@/lib/store";

export default function Page() {
  return (
    <div className="bg-brand-black text-white">
      <section className="px-5 md:px-8 py-16 md:py-24 border-b border-white/[0.06]">
        <p className="font-heading text-[0.72rem] tracking-[0.22em] uppercase text-gold-500 font-bold mb-3">
          Về Nghe Hustle
        </p>
        <h1 className="font-display leading-[0.9] tracking-wide mb-5" style={{ fontSize: "clamp(3rem,9vw,7rem)" }}>
          BUILD
          <br />
          <span className="text-gold-500">LOCAL</span>
        </h1>
        <p className="max-w-2xl text-white/60 leading-relaxed text-lg">
          Nghe Hustle là một local streetwear brand tập trung vào fit, vật liệu và cảm giác mặc thật.
          Brand này được dựng để đi đường dài, không để chạy theo vòng đời hype ngắn.
        </p>
      </section>

      <section className="px-5 md:px-8 py-12 grid grid-cols-1 md:grid-cols-3 gap-px bg-brand-gray-mid">
        {BRAND_STATS.map((stat) => (
          <div key={stat.label} className="bg-brand-black p-8">
            <p className="font-display text-5xl text-gold-500 leading-none mb-2">{stat.num}</p>
            <p className="font-heading text-[0.8rem] tracking-[0.16em] uppercase text-white/50">{stat.label}</p>
          </div>
        ))}
      </section>

      <section className="px-5 md:px-8 py-12 md:py-16 grid grid-cols-1 md:grid-cols-3 gap-px bg-brand-gray-mid">
        {ABOUT_VALUES.map((value) => (
          <article key={value.title} className="bg-brand-black p-8">
            <p className="font-heading text-[0.72rem] tracking-[0.18em] uppercase text-gold-500 font-bold mb-3">
              {value.title}
            </p>
            <p className="text-white/60 leading-relaxed">{value.text}</p>
          </article>
        ))}
      </section>

      <section className="px-5 md:px-8 py-16 border-t border-white/[0.06]">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
            <div>
              <p className="font-heading text-[0.72rem] tracking-[0.22em] uppercase text-gold-500 font-bold mb-2">
                Điều tụi này giữ lại
              </p>
              <h2 className="font-display leading-[0.92] tracking-wide" style={{ fontSize: "clamp(2rem,5vw,3.6rem)" }}>
                NGUYÊN TẮC
              </h2>
            </div>
            <Link
              href="/collection"
              className="inline-flex items-center gap-2 bg-gold-500 text-brand-black font-heading font-bold text-[0.8rem] tracking-[0.15em] uppercase px-6 py-3 no-underline hover:bg-white transition-colors duration-200"
            >
              Xem sản phẩm
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-brand-gray-mid">
            {BRAND_PERKS.map((perk) => (
              <div key={perk.title} className="bg-brand-black p-6 md:p-8">
                <div className="w-10 h-10 border border-gold-500/30 flex items-center justify-center font-display text-lg text-gold-500 mb-4">
                  NH
                </div>
                <p className="font-heading text-[0.82rem] tracking-[0.16em] uppercase text-white font-bold mb-2">
                  {perk.title}
                </p>
                <p className="text-white/50 text-sm leading-relaxed">{perk.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
