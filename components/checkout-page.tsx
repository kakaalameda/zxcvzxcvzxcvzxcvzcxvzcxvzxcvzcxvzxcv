"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart, type CartItem } from "@/components/cart-context";
import {
  PROVINCES,
  formatVnd,
  getShippingFee,
  type Voucher,
} from "@/lib/store";

type PayMethod = "cod" | "qr";
type OrderStatus = "idle" | "loading" | "success";

interface FormData {
  name: string;
  phone: string;
  email: string;
  province: string;
  district: string;
  ward: string;
  address: string;
  note: string;
}

type FormErrors = Partial<Record<keyof FormData, string>>;

const EMPTY_FORM: FormData = {
  name: "",
  phone: "",
  email: "",
  province: "",
  district: "",
  ward: "",
  address: "",
  note: "",
};

const IcoArrow = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-[17px] h-[17px] flex-shrink-0">
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);

const IcoShield = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="#F5A800" strokeWidth={1.5} className="w-3 h-3 flex-shrink-0">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const IcoBox = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="#F5A800" strokeWidth={1.5} className="w-3 h-3 flex-shrink-0">
    <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
  </svg>
);

const IcoTruck = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="#F5A800" strokeWidth={1.5} className="w-3 h-3 flex-shrink-0">
    <rect x="1" y="3" width="15" height="13" />
    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
    <circle cx="5.5" cy="18.5" r="2.5" />
    <circle cx="18.5" cy="18.5" r="2.5" />
  </svg>
);

const IcoCheck = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-8 h-8">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const IcoChevDown = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-3.5 h-3.5">
    <path d="M6 9l6 6 6-6" />
  </svg>
);

function Spinner() {
  return <div className="w-[17px] h-[17px] border-2 border-white/20 border-t-gold-500 rounded-full animate-spin flex-shrink-0" />;
}

function CheckoutNav() {
  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between px-5 md:px-8 py-3.5 bg-black/92 backdrop-blur-md border-b border-white/[0.08]">
      <Link href="/" className="font-display text-[1.4rem] tracking-wide no-underline leading-none">
        <span className="text-gold-500">NGHE </span>
        <span className="text-white">HUSTLE</span>
      </Link>
      <div className="flex items-center gap-2 font-heading text-[0.72rem] tracking-[0.18em] uppercase text-white/40">
        <span className="text-white/25">Giỏ hàng</span>
        <span className="text-white/20">›</span>
        <span className="text-gold-500 font-bold">Thanh toán</span>
        <span className="text-white/20">›</span>
        <span className="text-white/25">Xác nhận</span>
      </div>
    </nav>
  );
}

function FormInput({
  label,
  error,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }) {
  return (
    <div className={className}>
      <label className="block font-heading text-[0.72rem] tracking-[0.18em] uppercase text-white/40 font-bold mb-1.5">
        {label}
      </label>
      <input
        {...props}
        className={[
          "w-full bg-brand-gray-mid border text-white font-heading text-[0.9rem] tracking-wide px-3.5 py-3 outline-none transition-colors duration-200 placeholder:text-white/30",
          error ? "border-red-400/70 focus:border-red-400" : "border-white/15 focus:border-gold-500/40",
        ].join(" ")}
      />
      {error ? <p className="mt-1 font-heading text-[0.68rem] text-red-400 tracking-wide">{error}</p> : null}
    </div>
  );
}

function FormSelect({
  label,
  error,
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label className="block font-heading text-[0.72rem] tracking-[0.18em] uppercase text-white/40 font-bold mb-1.5">
        {label}
      </label>
      <div className="relative">
        <select
          {...props}
          className={[
            "w-full bg-brand-gray-mid border text-white font-heading text-[0.9rem] tracking-wide px-3.5 py-3 outline-none transition-colors duration-200 appearance-none cursor-pointer",
            error ? "border-red-400/70 focus:border-red-400" : "border-white/15 focus:border-gold-500/40",
          ].join(" ")}
        >
          {children}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/40">
          <IcoChevDown />
        </div>
      </div>
      {error ? <p className="mt-1 font-heading text-[0.68rem] text-red-400 tracking-wide">{error}</p> : null}
    </div>
  );
}

function PaymentSelector({
  selected,
  onChange,
}: {
  selected: PayMethod;
  onChange: (method: PayMethod) => void;
}) {
  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
        {([
          {
            id: "cod" as PayMethod,
            label: "COD",
            sub: "Tiền mặt khi nhận hàng",
            icon: (
              <svg viewBox="0 0 24 24" fill="none" stroke="#F5A800" strokeWidth={1.5} className="w-5 h-5">
                <rect x="1" y="4" width="22" height="16" rx="2" />
                <line x1="1" y1="10" x2="23" y2="10" />
              </svg>
            ),
          },
          {
            id: "qr" as PayMethod,
            label: "Chuyển khoản",
            sub: "QR Code tức thì",
            icon: (
              <svg viewBox="0 0 24 24" fill="none" stroke="#F5A800" strokeWidth={1.5} className="w-5 h-5">
                <rect x="2" y="2" width="9" height="9" />
                <rect x="13" y="2" width="9" height="9" />
                <rect x="2" y="13" width="9" height="9" />
                <path d="M13 18h2v4M17 13h4M21 17h-2v4" />
              </svg>
            ),
          },
        ] as const).map((method) => (
          <button
            key={method.id}
            onClick={() => onChange(method.id)}
            className={[
              "flex items-center gap-3 border px-4 py-3.5 cursor-pointer transition-all duration-200 w-full text-left bg-transparent",
              selected === method.id ? "border-gold-500 bg-gold-500/10" : "border-white/15 hover:border-gold-500/30",
            ].join(" ")}
          >
            <div className={`w-4 h-4 rounded-full border flex-shrink-0 relative transition-all duration-200 ${selected === method.id ? "border-gold-500" : "border-white/40"}`}>
              {selected === method.id ? <div className="absolute top-[3px] left-[3px] w-2 h-2 rounded-full bg-gold-500" /> : null}
            </div>
            <div className="w-7 h-7 flex items-center justify-center flex-shrink-0">{method.icon}</div>
            <div>
              <p className="font-heading font-bold text-[0.88rem] tracking-wide leading-none mb-0.5">{method.label}</p>
              <p className="text-[0.72rem] text-white/40">{method.sub}</p>
            </div>
          </button>
        ))}
      </div>

      {selected === "qr" ? (
        <div className="bg-brand-gray-mid border border-gold-500/30 p-5 text-center">
          <p className="font-heading text-[0.72rem] tracking-[0.18em] uppercase text-gold-500 font-bold mb-4">
            Quét mã để thanh toán
          </p>
          <div className="w-[120px] h-[120px] bg-white mx-auto mb-3 p-2 flex items-center justify-center">
            <div
              className="w-full h-full"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(0deg,#000 0px,#000 4px,#fff 4px,#fff 8px),repeating-linear-gradient(90deg,#000 0px,#000 4px,#fff 4px,#fff 8px)",
                backgroundBlendMode: "multiply",
              }}
            />
          </div>
          <p className="font-heading text-[0.75rem] tracking-wide text-white/70 mb-0.5">MB Bank · Nghe Hustle Official</p>
          <p className="font-heading font-bold text-[0.88rem] tracking-wide text-gold-500">1234 5678 9012 3456</p>
          <p className="text-[0.72rem] text-white/40 mt-1.5">Nội dung: NH + Số điện thoại của bạn</p>
        </div>
      ) : null}
    </div>
  );
}

function OrderItemRow({ item }: { item: CartItem }) {
  return (
    <div className="flex gap-3 mb-4 pb-4 border-b border-white/[0.08] last:border-b-0 last:mb-0 last:pb-0">
      <div className={`w-14 h-[66px] flex-shrink-0 bg-gradient-to-br ${item.bgClass} relative overflow-hidden flex items-center justify-center`}>
        <svg viewBox="0 0 24 24" fill="none" stroke="rgba(245,168,0,0.2)" strokeWidth={0.8} className="w-6 h-6">
          <path d="M20.38 3.46L16 2a4 4 0 01-8 0L3.62 3.46a2 2 0 00-1.34 2.23l.58 3.57a1 1 0 00.99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 002-2V10h2.15a1 1 0 00.99-.84l.58-3.57a2 2 0 00-1.34-2.23z" />
        </svg>
        <div className="absolute top-0 right-0 bg-gold-500 text-brand-black font-heading text-[0.6rem] font-bold w-[18px] h-[18px] flex items-center justify-center">
          {item.qty}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-heading font-bold text-[0.88rem] tracking-wide uppercase leading-tight truncate mb-0.5">{item.name}</p>
        <p className="text-[0.72rem] text-white/40 mb-1">{item.sub}</p>
        <p className="font-display text-[1.1rem] text-gold-500 leading-none">{formatVnd(item.price * item.qty)}</p>
      </div>
    </div>
  );
}

function VoucherInput({
  vouchers,
  onApply,
}: {
  vouchers: Voucher[];
  onApply: (voucher: Voucher | null) => void;
}) {
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  const apply = () => {
    const voucher =
      vouchers.find((entry) => entry.code === code.trim().toUpperCase()) ?? null;
    if (voucher) {
      onApply(voucher);
      setMessage(`${voucher.label} đã áp dụng!`);
      setSuccess(true);
      return;
    }

    onApply(null);
    setMessage("Mã không hợp lệ");
    setSuccess(false);
  };

  return (
    <div>
      <p className="font-heading text-[0.72rem] tracking-[0.18em] uppercase text-white/40 font-bold mb-2">
        Mã giảm giá
      </p>
      <div className="flex gap-1.5">
        <input
          value={code}
          onChange={(event) => setCode(event.target.value.toUpperCase())}
          onKeyDown={(event) => event.key === "Enter" && apply()}
          placeholder="Nhập mã..."
          maxLength={20}
          className="flex-1 bg-brand-gray-mid border border-white/15 focus:border-gold-500/30 text-white font-heading text-[0.85rem] tracking-wide px-3 py-2.5 outline-none placeholder:text-white/30 placeholder:normal-case transition-colors"
        />
        <button
          onClick={apply}
          className="bg-transparent border border-gold-500/30 text-gold-500 font-heading text-[0.78rem] font-bold tracking-widest uppercase px-4 cursor-pointer hover:bg-gold-500/10 transition-all whitespace-nowrap"
        >
          Áp dụng
        </button>
      </div>
      {message ? (
        <div className={`flex items-center gap-1.5 mt-1.5 font-heading text-[0.72rem] tracking-wide ${success ? "text-green-400" : "text-red-400"}`}>
          {success ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3 h-3">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : null}
          {message}
        </div>
      ) : null}
    </div>
  );
}

function OrderSummary({
  items,
  vouchers,
  discountPct,
  discountLabel,
  onVoucherApply,
  orderStatus,
  onPlaceOrder,
  orderError,
}: {
  items: CartItem[];
  vouchers: Voucher[];
  discountPct: number;
  discountLabel: string;
  onVoucherApply: (voucher: Voucher | null) => void;
  orderStatus: OrderStatus;
  onPlaceOrder: () => void;
  orderError: string;
}) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const discountAmount = Math.round(subtotal * (discountPct / 100));
  const shippingFee = getShippingFee(subtotal, discountAmount);
  const total = subtotal - discountAmount + shippingFee;

  return (
    <div>
      <p className="flex items-center gap-2 font-heading text-[0.72rem] tracking-[0.22em] uppercase text-gold-500 font-bold mb-3">
        <span className="w-5 h-0.5 bg-gold-500 inline-block" />
        Đơn hàng
      </p>

      <div className="bg-brand-gray-dark border border-white/[0.08] p-5 mb-4">
        {items.map((item) => (
          <OrderItemRow key={item.key} item={item} />
        ))}
      </div>

      <div className="bg-brand-gray-dark border border-white/[0.08] p-5">
        <VoucherInput vouchers={vouchers} onApply={onVoucherApply} />

        <div className="h-px bg-white/[0.08] my-4" />

        <div className="space-y-2 mb-4">
          <div className="flex justify-between font-heading text-[0.85rem] text-white/70 tracking-wide">
            <span>Tạm tính</span>
            <span>{formatVnd(subtotal)}</span>
          </div>
          {discountPct > 0 ? (
            <div className="flex justify-between font-heading text-[0.85rem] text-green-400 tracking-wide">
              <span>{discountLabel}</span>
              <span>-{formatVnd(discountAmount)}</span>
            </div>
          ) : null}
          <div className="flex justify-between font-heading text-[0.85rem] text-white/70 tracking-wide">
            <span>Phí ship</span>
            <span className={shippingFee === 0 ? "text-green-400" : ""}>
              {shippingFee === 0 ? "Miễn phí" : formatVnd(shippingFee)}
            </span>
          </div>
        </div>

        <div className="h-px bg-white/[0.08] mb-4" />

        <div className="flex items-baseline justify-between mb-5">
          <span className="font-heading text-[0.78rem] tracking-[0.15em] uppercase text-white/40 font-bold">
            Tổng cộng
          </span>
          <span className="font-display text-[1.8rem] text-gold-500 leading-none">{formatVnd(total)}</span>
        </div>

        <button
          onClick={onPlaceOrder}
          disabled={orderStatus !== "idle"}
          className={[
            "group relative w-full py-4 flex items-center justify-center gap-2.5 font-heading font-bold text-[1rem] tracking-[0.2em] uppercase border-2 overflow-hidden transition-all duration-300",
            orderStatus === "idle"
              ? "bg-gold-500 border-gold-500 text-brand-black cursor-pointer"
              : orderStatus === "loading"
                ? "bg-brand-gray-mid border-white/15 text-white/40 cursor-not-allowed"
                : "bg-transparent border-green-400 text-green-400 cursor-default",
          ].join(" ")}
        >
          {orderStatus === "idle" ? (
            <span className="absolute inset-0 bg-white scale-x-0 origin-right group-hover:scale-x-100 group-hover:origin-left transition-transform duration-350 z-0" />
          ) : null}
          <span className="relative z-10 flex items-center gap-2.5">
            {orderStatus === "idle" ? (
              <>
                <IcoArrow />
                ĐẶT HÀNG NGAY
              </>
            ) : null}
            {orderStatus === "loading" ? (
              <>
                <Spinner />
                Đang xử lý...
              </>
            ) : null}
            {orderStatus === "success" ? (
              <>
                <IcoCheck />
                ĐẶT HÀNG THÀNH CÔNG!
              </>
            ) : null}
          </span>
        </button>

        {orderError ? (
          <p className="mt-3 text-center font-heading text-[0.72rem] tracking-wide text-red-400">
            {orderError}
          </p>
        ) : null}

        <div className="flex items-center justify-center gap-5 mt-4 flex-wrap">
          {[
            { icon: <IcoShield />, label: "Bảo mật SSL" },
            { icon: <IcoBox />, label: "Đổi trả 30 ngày" },
            { icon: <IcoTruck />, label: "Giao nhanh 24h" },
          ].map((badge) => (
            <div key={badge.label} className="flex items-center gap-1.5 font-heading text-[0.68rem] tracking-widest uppercase text-white/40">
              {badge.icon}
              {badge.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SuccessScreen({ orderNum }: { orderNum: string }) {
  return (
    <div className="text-center py-24 px-6">
      <div className="w-[72px] h-[72px] bg-green-400/10 border-2 border-green-400/30 rounded-full flex items-center justify-center mx-auto mb-6 text-green-400">
        <IcoCheck />
      </div>
      <h2 className="font-display leading-[0.92] tracking-wide mb-3" style={{ fontSize: "clamp(2rem,6vw,3rem)" }}>
        ĐẶT HÀNG
        <br />
        <span className="text-gold-500">THÀNH CÔNG!</span>
      </h2>
      <p className="text-white/60 font-light leading-relaxed max-w-sm mx-auto mb-8">
        Cảm ơn bạn đã tin tưởng Nghe Hustle. Đơn hàng của bạn đang được xử lý và sẽ được giao trong vòng 24h.
      </p>
      <p className="font-heading text-[0.72rem] tracking-[0.2em] uppercase text-white/40 mb-1">Mã đơn hàng</p>
      <p className="font-display text-[1.8rem] text-gold-500 tracking-widest mb-8">{orderNum}</p>
      <div className="flex gap-3 justify-center flex-wrap">
        <Link href="/collection" className="bg-gold-500 text-brand-black font-heading font-bold text-[0.85rem] tracking-[0.15em] uppercase px-8 py-3.5 no-underline hover:bg-white transition-colors duration-200">
          TIẾP TỤC MUA SẮM
        </Link>
        <Link href="/" className="bg-transparent border border-white/15 text-white/70 font-heading font-bold text-[0.85rem] tracking-[0.15em] uppercase px-8 py-3.5 no-underline hover:border-gold-500/40 hover:text-gold-500 transition-all">
          VỀ TRANG CHỦ
        </Link>
      </div>
    </div>
  );
}

function EmptyCheckout() {
  return (
    <div className="max-w-[760px] mx-auto px-5 md:px-8 py-20 text-center">
      <p className="font-heading text-[0.72rem] tracking-[0.22em] uppercase text-gold-500 font-bold mb-3">
        Chưa có sản phẩm
      </p>
      <h1 className="font-display leading-[0.92] tracking-wide mb-4" style={{ fontSize: "clamp(2rem,5vw,3.6rem)" }}>
        GIỎ HÀNG ĐANG <span className="text-gold-500">TRỐNG</span>
      </h1>
      <p className="text-white/60 max-w-md mx-auto mb-8">
        Thêm sản phẩm từ bộ sưu tập trước khi chuyển sang bước thanh toán.
      </p>
      <Link href="/collection" className="inline-flex items-center gap-2.5 bg-gold-500 text-brand-black font-heading font-bold text-[0.9rem] tracking-[0.18em] uppercase px-8 py-3.5 no-underline hover:bg-white transition-colors duration-200">
        XEM BỘ SƯU TẬP
      </Link>
    </div>
  );
}

export function CheckoutPage({ vouchers }: { vouchers: Voucher[] }) {
  const { items, clearCart } = useCart();
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [payMethod, setPayMethod] = useState<PayMethod>("cod");
  const [discountPct, setDiscountPct] = useState(0);
  const [discountLabel, setDiscountLabel] = useState("");
  const [voucherCode, setVoucherCode] = useState("");
  const [orderStatus, setOrderStatus] = useState<OrderStatus>("idle");
  const [orderNum, setOrderNum] = useState("");
  const [orderError, setOrderError] = useState("");

  const setField =
    (key: keyof FormData) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const value = event.target.value;
      setForm((current) => ({
        ...current,
        [key]: value,
        ...(key === "province" ? { district: "" } : {}),
      }));
      setErrors((current) => ({ ...current, [key]: undefined }));
    };

  const validate = (): boolean => {
    const nextErrors: FormErrors = {};

    if (!form.name.trim()) {
      nextErrors.name = "Vui lòng nhập họ tên";
    }
    if (!form.phone.trim()) {
      nextErrors.phone = "Vui lòng nhập số điện thoại";
    } else if (!/^0\d{9,10}$/.test(form.phone.trim())) {
      nextErrors.phone = "Số điện thoại không hợp lệ";
    }
    if (!form.province) {
      nextErrors.province = "Vui lòng chọn tỉnh/thành phố";
    }
    if (!form.address.trim()) {
      nextErrors.address = "Vui lòng nhập địa chỉ";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const placeOrder = async () => {
    if (!items.length || !validate() || orderStatus !== "idle") {
      return;
    }

    setOrderStatus("loading");
    setOrderError("");

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customer: form,
          items,
          paymentMethod: payMethod,
          voucherCode: voucherCode || null,
        }),
      });

      const result = (await response.json()) as {
        orderNumber?: string;
        error?: string;
      };

      if (!response.ok || !result.orderNumber) {
        setOrderStatus("idle");
        setOrderError(result.error ?? "Khong the tao don hang luc nay.");
        return;
      }

      setOrderStatus("success");
      setOrderNum(result.orderNumber);
      clearCart();
    } catch {
      setOrderStatus("idle");
      setOrderError("Khong the ket noi toi may chu dat hang.");
    }
  };

  if (orderStatus === "success") {
    return (
      <div className="bg-brand-black text-white font-body min-h-screen">
        <CheckoutNav />
        <SuccessScreen orderNum={orderNum} />
      </div>
    );
  }

  return (
    <div className="bg-brand-black text-white font-body min-h-screen">
      <CheckoutNav />

      <div className="px-5 md:px-8 py-2.5 border-b border-white/[0.06] font-heading text-[0.72rem] tracking-[0.15em] uppercase text-white/40 flex items-center gap-2">
        <Link href="/" className="hover:text-gold-500 no-underline text-white/40 transition-colors">
          Trang chủ
        </Link>
        <span className="text-white/15">/</span>
        <Link href="/collection" className="hover:text-gold-500 no-underline text-white/40 transition-colors">
          Bộ sưu tập
        </Link>
        <span className="text-white/15">/</span>
        <span className="text-gold-500">Thanh toán</span>
      </div>

      {items.length === 0 ? (
        <EmptyCheckout />
      ) : (
        <div className="max-w-[1100px] mx-auto px-5 md:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 xl:gap-12">
            <div>
              <p className="flex items-center gap-2 font-heading text-[0.72rem] tracking-[0.22em] uppercase text-gold-500 font-bold mb-2">
                <span className="w-5 h-0.5 bg-gold-500 inline-block" />
                Bước 1
              </p>
              <h2 className="font-display leading-[0.92] tracking-wide mb-6" style={{ fontSize: "clamp(1.8rem,4vw,2.6rem)" }}>
                THÔNG TIN <span className="text-gold-500">GIAO HÀNG</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <FormInput label="Họ và tên *" placeholder="Nguyễn Văn A" value={form.name} onChange={setField("name")} error={errors.name} />
                <FormInput label="Số điện thoại *" placeholder="09xx xxx xxx" value={form.phone} onChange={setField("phone")} inputMode="tel" maxLength={11} error={errors.phone} />
              </div>

              <FormInput
                label="Email"
                type="email"
                placeholder="email@example.com"
                value={form.email}
                onChange={setField("email")}
                className="mb-3"
              />

              <FormSelect
                label="Tỉnh / Thành phố *"
                value={form.province}
                onChange={setField("province")}
                error={errors.province}
                className="mb-3"
              >
                <option value="">-- Chọn Tỉnh/Thành phố --</option>
                {Object.keys(PROVINCES).map((province) => (
                  <option key={province} value={province}>
                    {province}
                  </option>
                ))}
              </FormSelect>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <FormSelect label="Quận / Huyện" value={form.district} onChange={setField("district")}>
                  <option value="">-- Chọn Quận/Huyện --</option>
                  {(PROVINCES[form.province] ?? []).map((district) => (
                    <option key={district} value={district}>
                      {district}
                    </option>
                  ))}
                </FormSelect>
                <FormInput label="Phường / Xã" placeholder="Phường, Xã..." value={form.ward} onChange={setField("ward")} />
              </div>

              <FormInput
                label="Địa chỉ cụ thể *"
                placeholder="Số nhà, tên đường..."
                value={form.address}
                onChange={setField("address")}
                error={errors.address}
                className="mb-3"
              />

              <FormInput
                label="Ghi chú đơn hàng"
                placeholder="Ghi chú cho người giao hàng..."
                value={form.note}
                onChange={setField("note")}
                className="mb-6"
              />

              <div className="h-px bg-white/[0.08] mb-6" />

              <p className="flex items-center gap-2 font-heading text-[0.72rem] tracking-[0.22em] uppercase text-gold-500 font-bold mb-2">
                <span className="w-5 h-0.5 bg-gold-500 inline-block" />
                Bước 2
              </p>
              <h2 className="font-display leading-[0.92] tracking-wide mb-4" style={{ fontSize: "clamp(1.8rem,4vw,2.6rem)" }}>
                PHƯƠNG THỨC <span className="text-gold-500">THANH TOÁN</span>
              </h2>

              <PaymentSelector selected={payMethod} onChange={setPayMethod} />
            </div>

            <div>
              <OrderSummary
                items={items}
                vouchers={vouchers}
                discountPct={discountPct}
                discountLabel={discountLabel}
                onVoucherApply={(voucher) => {
                  setDiscountPct(voucher?.pct ?? 0);
                  setDiscountLabel(voucher?.label ?? "");
                  setVoucherCode(voucher?.code ?? "");
                }}
                orderStatus={orderStatus}
                onPlaceOrder={placeOrder}
                orderError={orderError}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
