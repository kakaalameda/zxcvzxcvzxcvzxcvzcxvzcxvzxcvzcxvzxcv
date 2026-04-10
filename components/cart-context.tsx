"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  formatVnd,
  getShippingFee,
  type NewCartItem,
  type Voucher,
} from "@/lib/store";

const CART_STORAGE_KEY = "nghe-hustle-cart";
const CART_EVENT_NAME = "nghe-hustle-cart-sync";
const MAX_CART_QTY = 10;
const EMPTY_CART: CartItem[] = [];

let cartSnapshot: CartItem[] = EMPTY_CART;
let hasLoadedCartSnapshot = false;

export type CartItem = NewCartItem;

interface CartCtx {
  items: CartItem[];
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
  addItem: (item: NewCartItem) => void;
  removeItem: (key: string) => void;
  changeQty: (key: string, delta: number) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
}

const CartContext = createContext<CartCtx | null>(null);

function parseCartItems(raw: string | null): CartItem[] {
  if (!raw) {
    return EMPTY_CART;
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return EMPTY_CART;
    }

    const items = parsed.filter(
      (item): item is CartItem =>
        typeof item?.key === "string" &&
        typeof item?.productId === "number" &&
        typeof item?.href === "string" &&
        typeof item?.name === "string" &&
        typeof item?.sub === "string" &&
        typeof item?.price === "number" &&
        typeof item?.qty === "number" &&
        typeof item?.bgClass === "string" &&
        (item?.colorName === undefined || typeof item?.colorName === "string") &&
        (item?.size === undefined ||
          ["S", "M", "L", "XL", "XXL"].includes(item.size)),
    );

    return items.length ? items : EMPTY_CART;
  } catch {
    return EMPTY_CART;
  }
}

function syncCartSnapshotFromStorage() {
  if (typeof window === "undefined") {
    return;
  }

  cartSnapshot = parseCartItems(window.localStorage.getItem(CART_STORAGE_KEY));
  hasLoadedCartSnapshot = true;
}

function readCartItems(): CartItem[] {
  if (typeof window === "undefined") {
    return EMPTY_CART;
  }

  if (!hasLoadedCartSnapshot) {
    syncCartSnapshotFromStorage();
  }

  return cartSnapshot;
}

function readServerCartItems(): CartItem[] {
  return EMPTY_CART;
}

function writeCartItems(items: CartItem[]) {
  if (typeof window === "undefined") {
    return;
  }

  cartSnapshot = items.length ? items : EMPTY_CART;
  hasLoadedCartSnapshot = true;
  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(CART_EVENT_NAME));
}

function subscribeCart(callback: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const handleCustomSync = () => callback();
  const handleStorage = () => {
    syncCartSnapshotFromStorage();
    callback();
  };

  window.addEventListener(CART_EVENT_NAME, handleCustomSync);
  window.addEventListener("storage", handleStorage);

  return () => {
    window.removeEventListener(CART_EVENT_NAME, handleCustomSync);
    window.removeEventListener("storage", handleStorage);
  };
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const items = useSyncExternalStore(subscribeCart, readCartItems, readServerCartItems);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);
  const toggleDrawer = useCallback(() => setDrawerOpen((value) => !value), []);

  const addItem = useCallback((item: NewCartItem) => {
    const nextItems = (() => {
      const current = readCartItems();
      const existing = current.find((entry) => entry.key === item.key);

      if (existing) {
        return current.map((entry) =>
          entry.key === item.key
            ? { ...entry, qty: Math.min(MAX_CART_QTY, entry.qty + item.qty) }
            : entry,
        );
      }

      return [...current, { ...item, qty: Math.min(MAX_CART_QTY, item.qty) }];
    })();

    writeCartItems(nextItems);
  }, []);

  const removeItem = useCallback((key: string) => {
    writeCartItems(readCartItems().filter((item) => item.key !== key));
  }, []);

  const changeQty = useCallback((key: string, delta: number) => {
    const nextItems = readCartItems().map((item) =>
      item.key === key
        ? { ...item, qty: Math.max(1, Math.min(MAX_CART_QTY, item.qty + delta)) }
        : item,
    );

    writeCartItems(nextItems);
  }, []);

  const clearCart = useCallback(() => {
    writeCartItems([]);
  }, []);

  const totalItems = useMemo(
    () => items.reduce((sum, item) => sum + item.qty, 0),
    [items],
  );
  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.qty, 0),
    [items],
  );

  return (
    <CartContext.Provider
      value={{
        items,
        drawerOpen,
        openDrawer,
        closeDrawer,
        toggleDrawer,
        addItem,
        removeItem,
        changeQty,
        clearCart,
        totalItems,
        subtotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used inside CartProvider");
  }

  return ctx;
}

const IcoX = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const IcoArrow = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-[17px] h-[17px]">
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);

const IcoTrash = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-3.5 h-3.5">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
    <path d="M10 11v6M14 11v6M9 6V4h6v2" />
  </svg>
);

const IcoCheck = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3 h-3">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

function CartItemRow({ item }: { item: CartItem }) {
  const { removeItem, changeQty } = useCart();
  const [removing, setRemoving] = useState(false);

  // Dùng useEffect để đảm bảo timeout được clearTimeout khi component unmount,
  // tránh gọi removeItem trên component đã bị huỷ (memory leak).
  useEffect(() => {
    if (!removing) return;
    const timeoutId = window.setTimeout(() => removeItem(item.key), 220);
    return () => window.clearTimeout(timeoutId);
  }, [removing, removeItem, item.key]);

  const handleRemove = () => {
    setRemoving(true);
  };

  return (
    <div
      className={[
        "flex gap-3 pb-4 mb-4 border-b border-white/[0.08] last:border-b-0 last:mb-0 last:pb-0",
        "transition-all duration-300",
        removing ? "opacity-0 translate-x-3" : "opacity-100 translate-x-0",
      ].join(" ")}
    >
      <div
        className={`w-[74px] h-[88px] flex-shrink-0 bg-gradient-to-br ${item.bgClass} relative overflow-hidden flex items-center justify-center`}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="rgba(245,168,0,0.2)"
          strokeWidth={0.8}
          className="w-7 h-7"
        >
          <path d="M20.38 3.46L16 2a4 4 0 01-8 0L3.62 3.46a2 2 0 00-1.34 2.23l.58 3.57a1 1 0 00.99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 002-2V10h2.15a1 1 0 00.99-.84l.58-3.57a2 2 0 00-1.34-2.23z" />
        </svg>
        {item.tag ? (
          <div className="absolute top-0 left-0 bg-gold-500 text-brand-black font-heading text-[0.55rem] font-bold tracking-widest uppercase px-1.5 py-0.5">
            {item.tag}
          </div>
        ) : null}
      </div>

      <div className="flex-1 min-w-0">
        <Link
          href={item.href}
          className="font-heading text-[0.95rem] font-bold tracking-wide uppercase leading-tight truncate mb-0.5 no-underline text-white hover:text-gold-500 transition-colors"
        >
          {item.name}
        </Link>
        <p className="text-[0.75rem] text-white/40 mb-2.5">{item.sub}</p>
        <div className="flex items-center justify-between gap-3">
          <span className="font-display text-[1.2rem] text-gold-500 leading-none">
            {formatVnd(item.price * item.qty)}
          </span>
          <div className="flex items-center gap-1.5">
            <div className="flex items-center border border-white/15">
              <button
                onClick={() => changeQty(item.key, -1)}
                className="w-7 h-7 flex items-center justify-center bg-transparent border-none cursor-pointer text-white/70 hover:text-gold-500 hover:bg-brand-gray-mid font-heading font-bold text-base transition-all"
              >
                -
              </button>
              <span className="w-8 text-center font-heading font-bold text-[0.9rem] border-x border-white/15 leading-7 select-none">
                {item.qty}
              </span>
              <button
                onClick={() => changeQty(item.key, 1)}
                className="w-7 h-7 flex items-center justify-center bg-transparent border-none cursor-pointer text-white/70 hover:text-gold-500 hover:bg-brand-gray-mid font-heading font-bold text-base transition-all"
              >
                +
              </button>
            </div>
            <button
              onClick={handleRemove}
              className="text-white/40 hover:text-red-400 transition-colors p-1 bg-transparent border-none cursor-pointer"
            >
              <IcoTrash />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CartDrawer({ vouchers }: { vouchers: Voucher[] }) {
  const router = useRouter();
  const { items, drawerOpen, closeDrawer, subtotal, totalItems } = useCart();
  const [voucherCode, setVoucherCode] = useState("");
  const [discountPct, setDiscountPct] = useState(0);
  const [discountLabel, setDiscountLabel] = useState("");
  const [voucherMsg, setVoucherMsg] = useState("");

  const discountAmount = Math.round(subtotal * (discountPct / 100));
  const shippingFee = getShippingFee(subtotal, discountAmount);
  const total = subtotal - discountAmount + shippingFee;

  const applyVoucher = () => {
    const voucher =
      vouchers.find((entry) => entry.code === voucherCode.trim().toUpperCase()) ?? null;

    if (voucher) {
      setDiscountPct(voucher.pct);
      setDiscountLabel(voucher.label);
      setVoucherMsg(`${voucher.label} đã áp dụng!`);
      return;
    }

    setDiscountPct(0);
    setDiscountLabel("");
    setVoucherMsg("Mã không hợp lệ");
  };

  const goToCheckout = () => {
    closeDrawer();
    router.push("/checkout");
  };

  return (
    <>
      <div
        onClick={closeDrawer}
        className={[
          "fixed inset-0 bg-black/65 backdrop-blur-[2px] z-[200] transition-all duration-350",
          drawerOpen ? "opacity-100 visible" : "opacity-0 invisible",
        ].join(" ")}
      />

      <div
        className={[
          "fixed top-0 right-0 bottom-0 z-[201] flex flex-col",
          "w-[min(420px,100vw)] bg-brand-gray-dark border-l border-white/[0.08]",
          "transition-transform duration-[380ms] ease-[cubic-bezier(0.32,0.72,0,1)]",
          drawerOpen ? "translate-x-0" : "translate-x-full",
        ].join(" ")}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5 font-display text-[1.5rem] tracking-wide">
            GIỎ HÀNG
            <span className="bg-gold-500 text-brand-black font-heading text-[0.75rem] font-bold px-2 py-0.5 tracking-widest">
              {totalItems} SẢN PHẨM
            </span>
          </div>
          <button
            onClick={closeDrawer}
            className="text-white/70 hover:text-gold-500 transition-colors bg-transparent border-none cursor-pointer p-1"
          >
            <IcoX />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {items.length === 0 ? (
            <div className="text-center py-16">
              <p className="font-display text-[3.5rem] text-white/[0.08] tracking-widest mb-3">NH</p>
              <p className="font-heading text-[0.82rem] tracking-[0.15em] uppercase text-white/40 font-bold">
                Giỏ hàng trống
              </p>
            </div>
          ) : (
            items.map((item) => <CartItemRow key={item.key} item={item} />)
          )}
        </div>

        {items.length > 0 ? (
          <div className="px-5 py-4 border-t border-white/[0.08] bg-brand-gray-dark">
            <div className="flex gap-1.5 mb-2.5">
              <input
                value={voucherCode}
                onChange={(event) => setVoucherCode(event.target.value.toUpperCase())}
                onKeyDown={(event) => event.key === "Enter" && applyVoucher()}
                placeholder="Nhập mã giảm giá..."
                maxLength={20}
                className="flex-1 bg-brand-gray-mid border border-white/15 focus:border-gold-500/30 text-white font-heading text-[0.85rem] tracking-wide px-3 py-2 outline-none placeholder:text-white/40 placeholder:normal-case transition-colors"
              />
              <button
                onClick={applyVoucher}
                className="bg-transparent border border-gold-500/30 text-gold-500 font-heading text-[0.78rem] font-bold tracking-widest uppercase px-4 py-2 cursor-pointer hover:bg-gold-500/10 transition-all whitespace-nowrap"
              >
                Áp dụng
              </button>
            </div>

            {voucherMsg ? (
              <div
                className={`flex items-center gap-1.5 font-heading text-[0.72rem] tracking-widest mb-2.5 ${discountPct > 0 ? "text-green-400" : "text-red-400"}`}
              >
                {discountPct > 0 ? <IcoCheck /> : null}
                {voucherMsg}
              </div>
            ) : null}

            <div className="space-y-1.5 mb-3">
              <div className="flex justify-between font-heading text-[0.88rem] text-white/70 tracking-wide">
                <span>Tạm tính</span>
                <span>{formatVnd(subtotal)}</span>
              </div>
              {discountPct > 0 ? (
                <div className="flex justify-between font-heading text-[0.88rem] text-green-400 tracking-wide">
                  <span>{discountLabel}</span>
                  <span>-{formatVnd(discountAmount)}</span>
                </div>
              ) : null}
              <div className="flex justify-between font-heading text-[0.88rem] text-white/70 tracking-wide">
                <span>Phí ship</span>
                <span>{shippingFee === 0 ? "Miễn phí" : formatVnd(shippingFee)}</span>
              </div>
            </div>

            <div className="h-px bg-white/[0.08] mb-3" />

            <div className="flex items-baseline justify-between mb-4">
              <span className="font-heading text-[0.78rem] tracking-[0.15em] uppercase text-white/40 font-bold">
                Tổng cộng
              </span>
              <span className="font-display text-[2rem] text-gold-500 leading-none">
                {formatVnd(total)}
              </span>
            </div>

            <button
              onClick={goToCheckout}
              className="group relative w-full py-4 flex items-center justify-center gap-2.5 bg-gold-500 text-brand-black font-heading font-bold text-[1rem] tracking-[0.2em] uppercase border-2 border-gold-500 overflow-hidden transition-all duration-300 cursor-pointer"
            >
              <span className="absolute inset-0 bg-white scale-x-0 origin-right group-hover:scale-x-100 group-hover:origin-left transition-transform duration-350 z-0" />
              <span className="relative z-10 flex items-center gap-2.5">
                <IcoArrow />
                THANH TOÁN NGAY
              </span>
            </button>
            <button
              onClick={closeDrawer}
              className="block w-full text-center mt-2.5 font-heading text-[0.75rem] tracking-[0.15em] uppercase text-white/40 hover:text-gold-500 transition-colors bg-transparent border-none cursor-pointer py-1"
            >
              ← Tiếp tục mua sắm
            </button>
          </div>
        ) : null}
      </div>
    </>
  );
}
