"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Package, ShoppingCart, TicketPercent } from "lucide-react";
import { AdminLogoutButton } from "@/components/admin/admin-logout-button";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  {
    href: "/admin/products",
    label: "Products",
    icon: Package,
  },
  {
    href: "/admin/orders",
    label: "Orders",
    icon: ShoppingCart,
  },
  {
    href: "/admin/vouchers",
    label: "Vouchers",
    icon: TicketPercent,
  },
];

export function AdminSidebar({ email }: { email: string }) {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-screen w-72 flex-col border-r border-white/10 bg-[#0b0b0b] p-6 text-white lg:flex">
      <div className="mb-10">
        <p className="font-heading text-xs uppercase tracking-[0.35em] text-gold-500">
          Admin
        </p>
        <h1 className="mt-3 font-display text-4xl leading-none tracking-wide">
          NGHE <span className="text-gold-500">HUSTLE</span>
        </h1>
        <p className="mt-4 text-sm text-white/50">{email}</p>
      </div>

      <nav className="flex flex-1 flex-col gap-2">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm transition-colors",
                active
                  ? "border-gold-500/40 bg-gold-500/10 text-gold-500"
                  : "border-white/10 text-white/70 hover:border-gold-500/30 hover:text-gold-500",
              )}
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-6 border-t border-white/10 pt-6">
        <AdminLogoutButton />
      </div>
    </aside>
  );
}
