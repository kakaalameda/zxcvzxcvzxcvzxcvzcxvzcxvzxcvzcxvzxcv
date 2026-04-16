"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Check,
  ShoppingBag,
  Trash2,
  X,
} from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import { ProductMedia } from "@/components/product-media";
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

    const items = parsed
      .map((item) => {
        if (
          typeof item?.key !== "string" ||
          typeof item?.productId !== "number" ||
          typeof item?.href !== "string" ||
          typeof item?.name !== "string" ||
          typeof item?.sub !== "string" ||
          typeof item?.price !== "number" ||
          typeof item?.qty !== "number" ||
          typeof item?.bgClass !== "string"
        ) {
          return null;
        }
        return {
          ...item,
          iconPath: typeof item?.iconPath === "string" ? item.iconPath : "",
        } as CartItem;
      })
      .filter((item): item is CartItem => item !== null);

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

  const mediaImage = {
    id: 0,
    alt: item.name,
    bgClass: item.bgClass,
    iconPath: item.iconPath,
    imageUrl: item.imageUrl,
  };

  return (
    <div
      className={[
        "flex gap-4 rounded-[22px] border border-[var(--border)] bg-white p-3 transition-all duration-300",
        removing ? "translate-x-3 opacity-0" : "translate-x-0 opacity-100",
      ].join(" ")}
    >
      <Link
        href={item.href}
        className="relative h-[92px] w-[78px] flex-shrink-0 overflow-hidden rounded-[16px] no-underline"
      >
        <ProductMedia
          image={mediaImage}
          bgClass={item.bgClass}
          className="h-full w-full"
          imageClassName="h-full w-full object-cover"
          svgClassName="h-10 w-10 opacity-25"
          stroke="rgba(0,0,0,0.12)"
          strokeWidth={0.8}
        />
        {item.tag ? (
          <span className="absolute left-1.5 top-1.5 rounded-full bg-[#111111] px-2 py-0.5 font-heading size-micro font-semibold uppercase tracking-[0.14em] text-white">
            {item.tag}
          </span>
        ) : null}
      </Link>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <Link
            href={item.href}
            className="block min-w-0 font-heading type-vn-compact size-action font-semibold uppercase text-[#111111] no-underline hover:text-store-blue"
          >
            <span className="block truncate">{item.name}</span>
          </Link>
          <button
            type="button"
            onClick={() => setRemoving(true)}
            aria-label="Xóa sản phẩm"
            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-transparent text-store-muted transition-colors hover:border-[var(--border)] hover:text-red-500"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
        <p className="mt-0.5 size-label text-store-muted">{item.sub}</p>

        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--surface)]">
            <button
              type="button"
              onClick={() => changeQty(item.key, -1)}
              className="flex h-7 w-7 items-center justify-center rounded-full text-store-muted transition-colors hover:text-store-blue disabled:opacity-40"
              disabled={item.qty <= 1}
            >
              −
            </button>
            <span className="w-6 select-none text-center font-heading size-label font-semibold text-[#111111]">
              {item.qty}
            </span>
            <button
              type="button"
              onClick={() => changeQty(item.key, 1)}
              className="flex h-7 w-7 items-center justify-center rounded-full text-store-muted transition-colors hover:text-store-blue"
            >
              +
            </button>
          </div>
          <span className="font-heading size-copy font-semibold text-[#111111]">
            {formatVnd(item.price * item.qty)}
          </span>
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
          "fixed inset-0 z-[200] bg-[#111111]/40 backdrop-blur-[2px] transition-all duration-300",
          drawerOpen ? "visible opacity-100" : "invisible opacity-0",
        ].join(" ")}
      />

      <div
        className={[
          "fixed right-0 top-0 bottom-0 z-[201] flex flex-col",
          "w-[min(440px,100vw)] border-l border-[var(--border)] bg-[var(--background)]",
          "transition-transform duration-[380ms] ease-[cubic-bezier(0.32,0.72,0,1)]",
          drawerOpen ? "translate-x-0" : "translate-x-full",
        ].join(" ")}
      >
        <div className="flex items-center justify-between border-b border-[var(--border)] bg-white px-5 py-4">
          <div>
            <p className="font-heading size-kicker-xs font-semibold uppercase tracking-[0.22em] text-store-blue">
              Giỏ hàng
            </p>
            <p className="mt-1 font-heading type-vn-compact size-title-base font-semibold uppercase text-[#111111]">
              {totalItems > 0 ? `${totalItems} sản phẩm` : "Chưa có sản phẩm"}
            </p>
          </div>
          <button
            type="button"
            onClick={closeDrawer}
            aria-label="Đóng giỏ hàng"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-white text-store-muted transition-colors hover:border-store-blue hover:text-store-blue"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-store-blue-soft text-store-blue">
                <ShoppingBag className="h-6 w-6" />
              </div>
              <p className="mt-5 font-heading size-kicker-xs font-semibold uppercase tracking-[0.22em] text-store-blue">
                Giỏ hàng trống
              </p>
              <p className="mt-2 max-w-[260px] text-sm leading-6 text-store-muted">
                Khám phá bộ sưu tập và thêm vài món bạn thích để bắt đầu.
              </p>
              <button
                type="button"
                onClick={closeDrawer}
                className="mt-6 rounded-full bg-[#111111] px-5 py-3 font-heading size-label font-semibold uppercase tracking-[0.18em] text-white transition-colors hover:bg-store-blue"
              >
                Xem bộ sưu tập
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <CartItemRow key={item.key} item={item} />
              ))}
            </div>
          )}
        </div>

        {items.length > 0 ? (
          <div className="border-t border-[var(--border)] bg-white px-5 py-4">
            <div>
              <p className="font-heading size-kicker-xs font-semibold uppercase tracking-[0.18em] text-store-muted">
                Mã giảm giá
              </p>
              <div className="mt-2 flex gap-2">
                <input
                  value={voucherCode}
                  onChange={(event) => setVoucherCode(event.target.value.toUpperCase())}
                  onKeyDown={(event) => event.key === "Enter" && applyVoucher()}
                  placeholder="Nhập mã..."
                  maxLength={20}
                  className="flex-1 rounded-full border border-[var(--border)] bg-white px-4 py-2.5 size-action text-[#111111] outline-none placeholder:text-store-muted/70 focus:border-store-blue"
                />
                <button
                  type="button"
                  onClick={applyVoucher}
                  className="whitespace-nowrap rounded-full border border-store-blue px-4 py-2.5 font-heading size-kicker font-semibold uppercase tracking-[0.16em] text-store-blue transition-colors hover:bg-store-blue hover:text-white"
                >
                  Áp dụng
                </button>
              </div>
              {voucherMsg ? (
                <p
                  className={[
                    "mt-2 inline-flex items-center gap-1.5 text-sm",
                    discountPct > 0 ? "text-green-600" : "text-red-500",
                  ].join(" ")}
                >
                  {discountPct > 0 ? <Check className="h-3.5 w-3.5" /> : null}
                  {voucherMsg}
                </p>
              ) : null}
            </div>

            <div className="mt-4 space-y-2 rounded-[20px] bg-[var(--surface)] p-4">
              <div className="flex justify-between text-sm text-store-muted">
                <span>Tạm tính</span>
                <span className="font-semibold text-[#111111]">{formatVnd(subtotal)}</span>
              </div>
              {discountPct > 0 ? (
                <div className="flex justify-between text-sm text-green-600">
                  <span>{discountLabel}</span>
                  <span>-{formatVnd(discountAmount)}</span>
                </div>
              ) : null}
              <div className="flex justify-between text-sm text-store-muted">
                <span>Phí ship</span>
                <span className="font-semibold text-[#111111]">
                  {shippingFee === 0 ? "Miễn phí" : formatVnd(shippingFee)}
                </span>
              </div>
            </div>

            <div className="mt-4 flex items-baseline justify-between">
              <span className="font-heading size-kicker-xs font-semibold uppercase tracking-[0.2em] text-store-muted">
                Tổng cộng
              </span>
              <span className="font-heading size-title-md font-semibold text-[#111111]">
                {formatVnd(total)}
              </span>
            </div>

            <button
              type="button"
              onClick={goToCheckout}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-[#111111] py-3.5 font-heading size-action font-semibold uppercase tracking-[0.18em] text-white transition-colors hover:bg-store-blue"
            >
              <ArrowRight className="h-4 w-4" />
              Thanh toán ngay
            </button>
            <button
              type="button"
              onClick={closeDrawer}
              className="mt-2 block w-full rounded-full py-2 font-heading size-kicker font-semibold uppercase tracking-[0.18em] text-store-muted transition-colors hover:text-store-blue"
            >
              Tiếp tục mua sắm
            </button>
          </div>
        ) : null}
      </div>
    </>
  );
}
