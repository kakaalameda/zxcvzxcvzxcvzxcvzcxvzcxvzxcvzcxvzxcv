"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "@/components/cart-context";
import { SITE_NAV_LINKS } from "@/lib/store";

export function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { toggleDrawer, totalItems } = useCart();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isActive = (href: string) => {
    if (pathname === href) {
      return true;
    }

    if (href === "/collection" && pathname.startsWith("/product")) {
      return true;
    }

    return false;
  };

  const linkClass = (href: string) =>
    [
      "font-heading text-sm tracking-widest uppercase font-semibold transition-colors duration-200 no-underline",
      isActive(href) ? "text-gold-500" : "text-white/70 hover:text-gold-500",
    ].join(" ");

  return (
    <nav
      className={[
        "fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-5 md:px-8 py-3.5 transition-all duration-300",
        scrolled ? "bg-black/90 backdrop-blur-md border-b border-white/[0.08]" : "bg-transparent",
      ].join(" ")}
    >
      <Link href="/" className="flex items-center gap-2.5 no-underline" onClick={() => setMenuOpen(false)}>
        <Image src="/Logo.png" alt="Nghe Hustle" width={40} height={40} className="object-contain" priority />
        <span className="font-display text-2xl leading-none tracking-wide">
          <span className="text-gold-500">NGHE </span>
          <span className="text-white">HUSTLE</span>
        </span>
      </Link>

      <ul className="hidden md:flex gap-8 list-none m-0 p-0">
        {SITE_NAV_LINKS.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className={linkClass(link.href)} onClick={() => setMenuOpen(false)}>
              {link.label}
            </Link>
          </li>
        ))}
      </ul>

      <div className="flex items-center gap-3">
        <Link
          href="/collection"
          className="hidden md:inline-flex items-center gap-2 border border-white/15 text-white/60 font-heading text-[0.72rem] tracking-[0.14em] uppercase px-4 py-2 no-underline hover:border-gold-500/40 hover:text-gold-500 transition-all"
        >
          Mua Sắm
        </Link>
        <button
          aria-label="Giỏ hàng"
          onClick={toggleDrawer}
          className="relative text-white/70 hover:text-gold-500 transition-colors duration-200 p-1 cursor-pointer bg-transparent border-none"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 01-8 0" />
          </svg>
          {totalItems > 0 ? (
            <span className="absolute -top-1.5 -right-1.5 bg-gold-500 text-brand-black text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center font-body">
              {totalItems}
            </span>
          ) : null}
        </button>
        <button
          className="md:hidden flex flex-col gap-1.5 bg-transparent border-none cursor-pointer p-1"
          onClick={() => setMenuOpen((value) => !value)}
          aria-label="Mở menu"
        >
          <span className={`block w-5.5 h-0.5 bg-white transition-all duration-300 ${menuOpen ? "rotate-45 translate-y-2" : ""}`} />
          <span className={`block w-5.5 h-0.5 bg-white transition-all duration-300 ${menuOpen ? "opacity-0" : ""}`} />
          <span className={`block w-5.5 h-0.5 bg-white transition-all duration-300 ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`} />
        </button>
      </div>

      {menuOpen ? (
        <div className="absolute top-full left-0 right-0 bg-black/95 backdrop-blur-md border-b border-white/[0.08] py-4 flex flex-col md:hidden">
          {SITE_NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className={`px-6 py-3 ${linkClass(link.href)}`} onClick={() => setMenuOpen(false)}>
              {link.label}
            </Link>
          ))}
        </div>
      ) : null}
    </nav>
  );
}
