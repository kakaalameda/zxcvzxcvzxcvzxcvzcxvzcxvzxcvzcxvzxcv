"use client";

import Link from "next/link";
import Image from "next/image";
import { Menu, Search, ShoppingBag, Truck, User, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useCart } from "@/components/cart-context";
import { SITE_NAV_LINKS } from "@/lib/store";

const UTILITY_PILLS = [
  "Miễn phí giao từ 500K",
  "Đổi trả trong 30 ngày",
  "Theo dõi đơn dễ dàng",
];

const UTILITY_CONTACTS = [
  { href: "https://www.facebook.com/", label: "Facebook", external: true },
  { href: "https://zalo.me/0901234567", label: "Zalo", external: true },
  { href: "tel:0901234567", label: "0901 234 567", external: false },
];

function BrandLockup({ compact = false }: { compact?: boolean }) {
  const wrapperClass = compact ? "flex items-center gap-2.5" : "flex items-center gap-3";
  const markClass = compact ? "h-[34px] w-auto" : "h-[38px] w-auto sm:h-[42px] lg:h-[46px]";
  const wordmarkClass = compact
    ? "mt-0.5 h-[16px] w-auto"
    : "mt-0.5 h-[18px] w-auto sm:h-[20px] lg:h-[22px]";

  return (
    <span className={wrapperClass}>
      <Image
        src="/logo-mark-dark.png"
        alt=""
        width={1189}
        height={1093}
        unoptimized
        aria-hidden="true"
        className={markClass}
      />
      <Image
        src="/logo-wordmark-dark.png"
        alt="Nghe Hustle"
        width={1133}
        height={166}
        unoptimized
        className={wordmarkClass}
      />
    </span>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const lastScrollRef = useRef(0);
  const { toggleDrawer, totalItems } = useCart();

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 12);
      // Ẩn khi scroll xuống (>80px), hiện lại khi scroll lên
      if (y > lastScrollRef.current && y > 80) {
        setHidden(true);
      } else if (y < lastScrollRef.current) {
        setHidden(false);
      }
      lastScrollRef.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const links = useMemo(() => SITE_NAV_LINKS, []);

  const isActive = (href: string) => {
    if (pathname === href) {
      return true;
    }

    if (
      href === "/collection" &&
      (pathname.startsWith("/product/") || pathname.startsWith("/san-pham/"))
    ) {
      return true;
    }

    return pathname.startsWith(`${href}/`);
  };

  const linkClass = (href: string) =>
    [
      "relative font-heading size-action font-semibold uppercase tracking-[0.14em] transition-colors",
      isActive(href)
        ? "text-store-blue"
        : "text-[#171717] hover:text-store-blue",
    ].join(" ");

  return (
    <>
    <header className={["fixed inset-x-0 top-0 z-50 transition-transform duration-300", hidden && !menuOpen ? "-translate-y-full" : "translate-y-0"].join(" ")}>
      <div className="hidden border-b border-white/10 bg-[#4a4a47] md:block">
        <div className="mx-auto flex h-10 max-w-[1240px] items-center justify-between px-6 lg:px-8">
          <div className="flex items-center gap-5 size-kicker text-white/80">
            {UTILITY_PILLS.map((item) => (
              <span key={item} className="flex items-center gap-2 font-heading tracking-[0.12em] uppercase">
                <Truck className="h-3.5 w-3.5" />
                {item}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-5 size-label text-white/75">
            <span className="font-heading uppercase tracking-[0.12em] text-white/45">
              Liên hệ
            </span>
            {UTILITY_CONTACTS.map((contact) => (
              <a
                key={contact.href}
                href={contact.href}
                target={contact.external ? "_blank" : undefined}
                rel={contact.external ? "noreferrer" : undefined}
                className="font-heading uppercase tracking-[0.12em] no-underline transition-colors hover:text-white"
              >
                {contact.label}
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className={["border-b border-[var(--border)] bg-white/95 backdrop-blur-md transition-shadow duration-200", scrolled ? "shadow-[0_4px_24px_rgba(0,0,0,0.06)]" : ""].join(" ")}>
        <div className="mx-auto flex h-16 max-w-[1240px] items-center gap-3 px-4 sm:px-6 lg:h-[72px] lg:px-8">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--border)] text-[#171717] transition-colors hover:border-store-blue hover:text-store-blue md:hidden"
            aria-label="Mở menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <Link
            href="/"
            className="flex min-w-0 items-center no-underline"
            onClick={() => setMenuOpen(false)}
            aria-label="Nghe Hustle - Trang chủ"
          >
            <BrandLockup />
          </Link>

          <nav className="hidden flex-1 items-center justify-center gap-7 md:flex lg:gap-9">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={linkClass(link.href)}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <Link
              href="/collection"
              className="hidden items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 size-action text-store-muted no-underline transition-colors hover:border-store-blue hover:text-store-blue lg:flex xl:min-w-[280px]"
            >
              <Search className="h-4 w-4" />
              <span className="truncate">Tìm áo thun, hoodie, quần...</span>
            </Link>

            <Link
              href="/track-order"
              className="hidden h-11 w-11 items-center justify-center rounded-full border border-[var(--border)] text-[#171717] transition-colors hover:border-store-blue hover:text-store-blue md:flex"
              aria-label="Tra cứu đơn hàng"
            >
              <User className="h-4 w-4" />
            </Link>

            <button
              type="button"
              aria-label="Giỏ hàng"
              onClick={toggleDrawer}
              className="relative flex h-11 w-11 items-center justify-center rounded-full border border-[var(--border)] text-[#171717] transition-colors hover:border-store-blue hover:text-store-blue"
            >
              <ShoppingBag className="h-4 w-4" />
              {totalItems > 0 ? (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-store-blue px-1 size-kicker-xs font-bold text-white">
                  {totalItems}
                </span>
              ) : null}
            </button>
          </div>
        </div>
      </div>

    </header>

      {/* Overlay và drawer nằm ngoài <header> để tránh lỗi fixed-in-transform */}
      <div
        className={[
          "fixed inset-0 z-[60] bg-black/45 transition-opacity duration-300 md:hidden",
          menuOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
        ].join(" ")}
        onClick={() => setMenuOpen(false)}
      />

      <div
        className={[
          "fixed left-0 top-0 z-[61] h-full w-[88vw] max-w-[360px] border-r border-[var(--border)] bg-white px-5 pb-6 pt-5 shadow-[24px_0_60px_rgba(0,0,0,0.18)] transition-transform duration-300 md:hidden",
          menuOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
          <Link
            href="/"
            onClick={() => setMenuOpen(false)}
            aria-label="Nghe Hustle - Trang chủ"
            className="no-underline"
          >
            <BrandLockup compact />
          </Link>
          <button
            type="button"
            onClick={() => setMenuOpen(false)}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--border)] text-[#171717]"
            aria-label="Đóng menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <Link
          href="/collection"
          className="mt-5 flex items-center gap-3 rounded-[22px] bg-[var(--surface)] px-4 py-3 size-copy text-store-muted no-underline"
          onClick={() => setMenuOpen(false)}
        >
          <Search className="h-4 w-4" />
          Tìm kiếm sản phẩm
        </Link>

        <div className="mt-6 space-y-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={[
                "block rounded-2xl px-4 py-3 font-heading type-vn-compact size-title-xs font-semibold uppercase no-underline transition-colors",
                isActive(link.href)
                  ? "bg-store-blue-soft text-store-blue"
                  : "text-[#171717] hover:bg-[var(--surface)]",
              ].join(" ")}
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="mt-8 rounded-[28px] bg-[#111111] p-5 text-white">
          <p className="font-heading size-kicker-xs font-semibold uppercase tracking-[0.2em] text-white/50">
            Quyền lợi
          </p>
          <div className="mt-4 space-y-3">
            {UTILITY_PILLS.map((item) => (
              <div key={item} className="flex items-start gap-3">
                <div className="mt-1 h-2 w-2 rounded-full bg-store-blue" />
                <p className="text-sm leading-6 text-white/80">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
