import Image from "next/image";
import Link from "next/link";

const FOOTER_LINKS = {
  products: [
    { href: "/collection", label: "Áo thun" },
    { href: "/collection", label: "Hoodie" },
    { href: "/collection", label: "Quần" },
    { href: "/lookbook", label: "Lookbook" },
  ],
  support: [
    { href: "/about", label: "Câu chuyện thương hiệu" },
    { href: "/checkout", label: "Thanh toán" },
    { href: "/collection", label: "Bộ sưu tập hiện tại" },
  ],
};

const SOCIAL_LINKS = [
  { href: "https://www.instagram.com/", label: "Instagram", path: "M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37zM17.5 6.5h.01M2 2h20v20H2z" },
  { href: "https://www.tiktok.com/", label: "TikTok", path: "M9 12a4 4 0 104 4V4a5 5 0 005 5" },
  { href: "https://www.facebook.com/", label: "Facebook", path: "M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" },
];

export function Footer() {
  return (
    <footer className="bg-brand-gray-dark border-t border-white/[0.06] pt-16 pb-8 px-5 md:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 mb-12">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <Image src="/Logo.png" alt="Nghe Hustle" width={40} height={40} className="object-contain" />
              <span className="font-display text-xl leading-none">
                <span className="text-gold-500">NGHE </span>
                <span className="text-white">HUSTLE</span>
              </span>
            </div>
            <p className="text-white/50 text-sm leading-relaxed max-w-xs font-light">
              Local brand streetwear Việt Nam. Hustle never stops, từ đường phố đến tủ đồ của bạn.
            </p>
            <div className="flex gap-2.5 mt-5">
              {SOCIAL_LINKS.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  target="_blank"
                  rel="noreferrer"
                  className="w-9 h-9 border border-white/15 flex items-center justify-center text-white/60 hover:border-gold-500 hover:text-gold-500 transition-all duration-200"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-4 h-4">
                    <path d={social.path} />
                  </svg>
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-heading text-xs tracking-widest uppercase font-bold text-white mb-5">Sản phẩm</h4>
            <ul className="space-y-2.5 list-none p-0 m-0">
              {FOOTER_LINKS.products.map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="text-white/50 hover:text-gold-500 text-sm font-light no-underline transition-colors duration-200">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-heading text-xs tracking-widest uppercase font-bold text-white mb-5">Hỗ trợ</h4>
            <ul className="space-y-2.5 list-none p-0 m-0">
              {FOOTER_LINKS.support.map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="text-white/50 hover:text-gold-500 text-sm font-light no-underline transition-colors duration-200">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-heading text-xs tracking-widest uppercase font-bold text-white mb-5">Liên hệ</h4>
            <ul className="space-y-2.5 list-none p-0 m-0">
              <li>
                <a href="mailto:nghehustle@gmail.com" className="text-white/50 hover:text-gold-500 text-sm font-light no-underline transition-colors duration-200">
                  nghehustle@gmail.com
                </a>
              </li>
              <li>
                <a href="tel:+84901234567" className="text-white/50 hover:text-gold-500 text-sm font-light no-underline transition-colors duration-200">
                  +84 901 234 567
                </a>
              </li>
              <li>
                <span className="text-white/50 text-sm font-light">Hà Nội, Việt Nam</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-8 border-t border-white/[0.06] gap-4">
          <p className="text-white/30 text-xs">
            © 2026 <span className="text-gold-500">Nghe Hustle</span>. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link href="/about" className="text-white/30 hover:text-white/60 text-xs no-underline transition-colors duration-200">
              Chính sách thương hiệu
            </Link>
            <Link href="/checkout" className="text-white/30 hover:text-white/60 text-xs no-underline transition-colors duration-200">
              Điều khoản mua hàng
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
