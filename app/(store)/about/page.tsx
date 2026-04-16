import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ABOUT_VALUES, BRAND_PERKS, BRAND_STATS } from "@/lib/store";

export default function Page() {
  return (
    <div className="bg-[var(--background)] text-[#111111]">
      <section className="border-b border-[var(--border)] bg-white">
        <div className="mx-auto grid max-w-[1240px] gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[1.08fr_0.92fr] lg:px-8 lg:py-14">
          <div>
            <p className="font-heading size-label font-semibold uppercase tracking-[0.28em] text-store-blue">
              Về thương hiệu
            </p>
            <h1 className="mt-4 max-w-[14ch] font-heading type-vn-display size-display-sm font-semibold uppercase text-[#111111] sm:max-w-[15ch] sm:size-display-md lg:max-w-[14ch]">
              Nghe Hustle theo đuổi streetwear gọn, bền và dễ mặc lâu dài.
            </h1>
            <p className="mt-5 max-w-[620px] size-copy-md text-store-muted">
              Trang này giữ phần giới thiệu ở đúng vị trí: đủ để bạn hiểu tinh thần
              thương hiệu, cảm chất liệu và tiếp tục đi vào các dòng sản phẩm phù hợp.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/collection"
                className="inline-flex items-center gap-2 rounded-full bg-[#111111] px-6 py-3.5 font-heading size-action font-semibold uppercase tracking-[0.18em] text-white no-underline transition-colors hover:bg-store-blue"
              >
                Khám phá sản phẩm
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/lookbook"
                className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white px-6 py-3.5 font-heading size-action font-semibold uppercase tracking-[0.18em] text-[#111111] no-underline transition-colors hover:border-store-blue hover:text-store-blue"
              >
                Xem lookbook
              </Link>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            {BRAND_STATS.map((stat) => (
              <div
                key={stat.label}
                className="rounded-[28px] border border-[var(--border)] bg-[linear-gradient(180deg,#ffffff_0%,#f5f7fb_100%)] p-6"
              >
                <p className="font-heading size-display-sm font-semibold uppercase leading-none text-[#111111]">
                  {stat.num}
                </p>
                <p className="mt-2 text-sm leading-6 text-store-muted">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1240px] px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="grid gap-4 lg:grid-cols-3">
          {ABOUT_VALUES.map((value) => (
            <article
              key={value.title}
              className="rounded-[32px] border border-[var(--border)] bg-white p-6 sm:p-7"
            >
              <p className="font-heading size-kicker font-semibold uppercase tracking-[0.22em] text-store-blue">
                {value.title}
              </p>
              <p className="mt-4 size-copy-md text-store-muted">{value.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-[var(--border)] bg-white">
        <div className="mx-auto max-w-[1240px] px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="font-heading size-kicker font-semibold uppercase tracking-[0.28em] text-store-blue">
                Cam kết thương hiệu
              </p>
              <h2 className="mt-3 max-w-[16ch] font-heading type-vn-title size-title-lg font-semibold uppercase text-[#111111] sm:size-display-sm">
                Những điều chúng tôi giữ nhất quán từ sản phẩm đến trải nghiệm mua hàng.
              </h2>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {BRAND_PERKS.map((perk) => (
              <div
                key={perk.title}
                className="rounded-[28px] bg-[var(--surface)] px-5 py-6"
              >
                <p className="font-heading type-vn-compact size-title-xs font-semibold uppercase text-[#111111]">
                  {perk.title}
                </p>
                <p className="mt-3 text-sm leading-6 text-store-muted">{perk.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
