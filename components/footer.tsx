import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Camera,
  Mail,
  MessageCircle,
  Phone,
  Ticket,
  Truck,
} from "lucide-react";

const FOOTER_COLUMNS = [
  {
    title: "Sản phẩm",
    links: [
      { href: "/collection", label: "Tất cả sản phẩm" },
      { href: "/collection", label: "Áo thun" },
      { href: "/collection", label: "Hoodie và áo khoác" },
    ],
  },
  {
    title: "Hỗ trợ",
    links: [
      { href: "/track-order", label: "Tra cứu đơn hàng" },
      { href: "/about", label: "Câu chuyện thương hiệu" },
      { href: "/lookbook", label: "Lookbook" },
    ],
  },
  {
    title: "Chính sách",
    links: [
      { href: "/checkout", label: "Thanh toán và giao hàng" },
      { href: "/about", label: "Cam kết chất lượng" },
      { href: "/collection", label: "Ưu đãi hiện có" },
    ],
  },
];

const CONTACT_ITEMS = [
  { icon: Phone, label: "Hotline", value: "0901 234 567" },
  { icon: Mail, label: "Email", value: "nghehustle@gmail.com" },
];

const SERVICE_CARDS = [
  {
    icon: Truck,
    title: "Miễn phí giao hàng",
    text: "Áp dụng cho đơn từ 500K trên toàn quốc.",
  },
  {
    icon: Ticket,
    title: "Ưu đãi cho khách quen",
    text: "Voucher và quà tặng theo từng drop mới.",
  },
];

export function Footer() {
  return (
    <footer className="bg-[#0d0e12] text-white">
      <div className="border-b border-white/10">
        <div className="mx-auto grid max-w-[1240px] gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:px-8 lg:py-10">
          <div className="rounded-[32px] bg-[#14151b] p-7 sm:p-8">
            <p className="font-heading size-kicker-xs font-semibold uppercase tracking-[0.22em] text-white/45">
              Mua sắm cùng Nghe Hustle
            </p>
            <h2 className="mt-4 max-w-[16ch] font-heading type-vn-display size-display-sm font-semibold uppercase text-white sm:size-display-md">
              Chọn đồ dễ hơn, nhận hàng nhanh hơn và yên tâm hơn sau khi mua.
            </h2>
            <p className="mt-4 max-w-[560px] size-copy-md text-white/65">
              Từ lúc chọn sản phẩm đến lúc nhận hàng, mọi điểm chạm quan trọng đều
              được giữ rõ ràng để bạn mua nhanh nhưng vẫn đủ thông tin.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/collection"
                className="inline-flex items-center gap-2 rounded-full bg-store-blue px-6 py-3 font-heading size-action font-semibold uppercase tracking-[0.18em] text-white no-underline transition-colors hover:bg-[#1637dd]"
              >
                Mua sắm ngay
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/about"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 px-6 py-3 font-heading size-action font-semibold uppercase tracking-[0.18em] text-white/70 no-underline transition-colors hover:border-white/35 hover:text-white"
              >
                Về thương hiệu
              </Link>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {SERVICE_CARDS.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.title}
                  className="rounded-[28px] bg-[linear-gradient(180deg,#f4f6ff_0%,#eef2ff_100%)] p-6 text-[#111111]"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-[0_12px_30px_rgba(36,71,249,0.12)]">
                    <Icon className="h-5 w-5 text-store-blue" />
                  </div>
                  <h3 className="mt-6 max-w-[12ch] font-heading type-vn-compact size-title-sm font-semibold uppercase">
                    {card.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-[#4b5563]">{card.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1240px] px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
        <div className="grid gap-10 lg:grid-cols-[1.15fr_1fr]">
          <div>
            <Link href="/" aria-label="Nghe Hustle - Trang chủ" className="inline-block no-underline">
              <Image
                src="/logo-white.png"
                alt="Nghe Hustle"
                width={256}
                height={256}
                className="h-[120px] w-[120px] object-contain"
              />
            </Link>
            <p className="mt-4 max-w-[480px] size-copy-md text-white/60">
              Streetwear dành cho nhịp sống đô thị, ưu tiên sản phẩm dễ mặc,
              phom gọn và trải nghiệm mua sắm rõ ràng từ đầu đến cuối.
            </p>

            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {CONTACT_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/6">
                        <Icon className="h-4 w-4 text-store-blue" />
                      </div>
                      <div>
                        <p className="font-heading size-kicker-xs font-semibold uppercase tracking-[0.18em] text-white/40">
                          {item.label}
                        </p>
                        <p className="mt-1 text-sm text-white/80">{item.value}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid gap-8 sm:grid-cols-3">
            {FOOTER_COLUMNS.map((column) => (
              <div key={column.title}>
                <h4 className="font-heading size-label font-semibold uppercase tracking-[0.22em] text-white/40">
                  {column.title}
                </h4>
                <div className="mt-4 space-y-3">
                  {column.links.map((link) => (
                    <Link
                      key={link.href + link.label}
                      href={link.href}
                      className="block text-sm leading-6 text-white/72 no-underline transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-white/45">
            © 2026 Nghe Hustle. Mọi quyền được bảo lưu.
          </p>

          <div className="flex items-center gap-3">
            <a
              href="https://www.facebook.com/"
              target="_blank"
              rel="noreferrer"
              aria-label="Facebook"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 text-white/65 transition-colors hover:border-white/30 hover:text-white"
            >
              <MessageCircle className="h-4 w-4" />
            </a>
            <a
              href="https://www.instagram.com/"
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 text-white/65 transition-colors hover:border-white/30 hover:text-white"
            >
              <Camera className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
