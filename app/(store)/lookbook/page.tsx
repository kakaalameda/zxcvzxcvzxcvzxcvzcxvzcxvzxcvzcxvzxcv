import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProductMedia } from "@/components/product-media";
import { getStoreProductById } from "@/lib/repositories/storefront";
import { getLookbookSections } from "@/lib/repositories/storefront-lookbook";
import { formatVnd } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function Page() {
  const sections = await getLookbookSections();

  const sectionsWithProducts = (
    await Promise.all(
      sections.map(async (section) => {
        const product = section.productId
          ? await getStoreProductById(String(section.productId))
          : undefined;
        return { ...section, product };
      }),
    )
  ).filter((section) => section.product != null);

  return (
    <div className="bg-[var(--background)] text-[#111111]">
      <section className="border-b border-[var(--border)] bg-white">
        <div className="mx-auto max-w-[1240px] px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
          <p className="font-heading size-label font-semibold uppercase tracking-[0.28em] text-store-blue">
            Lookbook
          </p>
          <h1 className="mt-4 max-w-[16ch] font-heading type-vn-display size-display-sm font-semibold uppercase text-[#111111] sm:max-w-[15ch] sm:size-display-md">
            Xem cách sản phẩm lên outfit trước khi chốt đơn.
          </h1>
          <p className="mt-5 max-w-[640px] size-copy-md text-store-muted">
            Lookbook là nơi để bạn thấy rõ tinh thần phối đồ, phom dáng và cảm giác
            khi mặc thật trước khi quay lại trang mua hàng.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[1240px] space-y-6 px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        {sectionsWithProducts.length === 0 ? (
          <div className="rounded-[32px] border border-dashed border-[var(--border)] bg-white px-6 py-20 text-center">
            <p className="mx-auto max-w-[14ch] font-heading type-vn-title size-title-sm font-semibold uppercase text-[#111111]">
              Lookbook đang được cập nhật
            </p>
          </div>
        ) : null}

        {sectionsWithProducts.map((section, index) => {
          const product = section.product;
          if (!product) {
            return null;
          }

          return (
            <article
              key={section.id}
              className="grid gap-4 lg:grid-cols-[1.02fr_0.98fr]"
            >
              <div
                className={[
                  "overflow-hidden rounded-[36px] border border-[var(--border)] bg-white",
                  index % 2 === 1 ? "lg:order-2" : "",
                ].join(" ")}
              >
                <div className="aspect-[4/4.3] bg-[var(--surface)]">
                  <ProductMedia
                    image={product.images[0]}
                    bgClass={product.colors[0].bgClass}
                    className="h-full w-full"
                    imageClassName="h-full w-full object-cover"
                    svgClassName="h-28 w-28 opacity-15"
                    stroke="rgba(0,0,0,0.08)"
                  />
                </div>
              </div>

              <div
                className={[
                  "rounded-[36px] border border-[var(--border)] bg-white p-6 sm:p-7",
                  index % 2 === 1 ? "lg:order-1" : "",
                ].join(" ")}
              >
                <p className="font-heading size-kicker font-semibold uppercase tracking-[0.24em] text-store-blue">
                  {section.eyebrow}
                </p>
                <h2 className="mt-3 max-w-[13ch] font-heading type-vn-display size-display-sm font-semibold uppercase text-[#111111] sm:size-display-md">
                  {section.title}
                </h2>
                <p className="mt-4 size-copy-md text-store-muted">{section.text}</p>

                <div className="mt-6 rounded-[28px] bg-[var(--surface)] p-5">
                  <p className="font-heading size-kicker font-semibold uppercase tracking-[0.22em] text-store-muted">
                    Sản phẩm trong layout
                  </p>
                  <h3 className="mt-3 max-w-[14ch] font-heading type-vn-title size-title-sm font-semibold uppercase text-[#111111]">
                    {product.name}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-store-muted">{product.subtitle}</p>
                  <p className="mt-4 font-heading size-title-sm font-semibold text-[#111111]">
                    {formatVnd(product.price)}
                  </p>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    href={`/product/${product.id}`}
                    className="inline-flex items-center gap-2 rounded-full bg-[#111111] px-5 py-3 font-heading size-label font-semibold uppercase tracking-[0.18em] text-white no-underline transition-colors hover:bg-store-blue"
                  >
                    Mở trang sản phẩm
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/collection"
                    className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-5 py-3 font-heading size-label font-semibold uppercase tracking-[0.18em] text-[#111111] no-underline transition-colors hover:border-store-blue hover:text-store-blue"
                  >
                    Xem thêm sản phẩm
                  </Link>
                </div>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
