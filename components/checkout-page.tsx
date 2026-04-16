"use client";

import Link from "next/link";
import {
  ArrowRight,
  Check,
  LoaderCircle,
  QrCode,
  ShieldCheck,
  Sparkles,
  WalletCards,
} from "lucide-react";
import { useState } from "react";
import { CheckoutAddressSection } from "@/components/checkout-address-section";
import { useCart, type CartItem } from "@/components/cart-context";
import { ProductMedia } from "@/components/product-media";
import { formatVnd, getShippingFee, type Voucher } from "@/lib/store";

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

function Spinner() {
  return <LoaderCircle className="h-4 w-4 animate-spin" />;
}

function CheckoutNav() {
  return (
    <nav className="sticky top-0 z-40 border-b border-[var(--border)] bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1240px] items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="no-underline">
          <p className="font-heading size-kicker-xs font-semibold uppercase tracking-[0.28em] text-store-muted">
            Nghe
          </p>
          <p className="font-display text-[1.7rem] tracking-[0.08em] text-[#111111]">
            HUSTLE
          </p>
        </Link>
        <div className="rounded-full bg-store-blue-soft px-4 py-2 font-heading size-kicker-xs font-semibold uppercase tracking-[0.18em] text-store-blue">
          Thanh toán
        </div>
      </div>
    </nav>
  );
}

function SectionCard({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[32px] border border-[var(--border)] bg-white p-5 sm:p-6">
      <p className="font-heading size-kicker-xs font-semibold uppercase tracking-[0.22em] text-store-blue">
        {eyebrow}
      </p>
      <h2 className="mt-2 max-w-[16ch] font-heading type-vn-title size-title-sm font-semibold uppercase text-[#111111]">
        {title}
      </h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function FormInput({
  label,
  error,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
}) {
  return (
    <div className={className}>
      <label className="mb-1.5 block font-heading size-kicker-xs font-semibold uppercase tracking-[0.18em] text-store-muted">
        {label}
      </label>
      <input
        {...props}
        className={[
          "w-full rounded-[22px] border bg-white px-4 py-3.5 size-copy text-[#111111] outline-none transition-colors placeholder:text-store-muted/70",
          error ? "border-red-400 focus:border-red-400" : "border-[var(--border)] focus:border-store-blue",
        ].join(" ")}
      />
      {error ? <p className="mt-1.5 text-sm text-red-500">{error}</p> : null}
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
  const methods = [
    {
      id: "cod" as const,
      label: "Thanh toán khi nhận hàng",
      description: "Xác nhận đơn trước, thu tiền khi giao.",
      icon: WalletCards,
    },
    {
      id: "qr" as const,
      label: "Chuyển khoản QR",
      description: "Quét mã QR và thanh toán trước khi giao hàng.",
      icon: QrCode,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        {methods.map((method) => {
          const Icon = method.icon;
          const active = selected === method.id;

          return (
            <button
              key={method.id}
              type="button"
              onClick={() => onChange(method.id)}
              className={[
                "rounded-[24px] border p-4 text-left transition-colors",
                active
                  ? "border-store-blue bg-store-blue-soft"
                  : "border-[var(--border)] bg-[var(--surface)] hover:border-store-blue/50",
              ].join(" ")}
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white">
                <Icon className={["h-5 w-5", active ? "text-store-blue" : "text-store-muted"].join(" ")} />
              </div>
              <p className="mt-4 max-w-[12ch] font-heading type-vn-compact size-title-xs font-semibold uppercase text-[#111111]">
                {method.label}
              </p>
              <p className="mt-2 text-sm leading-6 text-store-muted">{method.description}</p>
            </button>
          );
        })}
      </div>

      {selected === "qr" ? (
        <div className="rounded-[28px] border border-[#d9e1ff] bg-store-blue-soft p-5">
          <p className="font-heading size-kicker-xs font-semibold uppercase tracking-[0.18em] text-store-blue">
            Thông tin chuyển khoản
          </p>
          <div className="mt-4 flex flex-col gap-4 sm:flex-row">
            <div className="flex h-[110px] w-[110px] items-center justify-center rounded-[24px] bg-white p-4 shadow-sm">
              <div
                className="h-full w-full rounded-xl"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(0deg,#111 0px,#111 4px,#fff 4px,#fff 8px),repeating-linear-gradient(90deg,#111 0px,#111 4px,#fff 4px,#fff 8px)",
                  backgroundBlendMode: "multiply",
                }}
              />
            </div>
            <div>
              <p className="font-heading size-label font-semibold uppercase tracking-[0.16em] text-[#111111]">
                MB Bank · Nghe Hustle Official
              </p>
              <p className="mt-2 font-heading size-title-base font-semibold uppercase tracking-[0.08em] text-store-blue">
                1234 5678 9012 3456
              </p>
              <p className="mt-2 text-sm leading-6 text-store-muted">
                Nội dung chuyển khoản: NH + số điện thoại đặt hàng.
              </p>
            </div>
          </div>
        </div>
      ) : null}
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
  const [isSuccess, setIsSuccess] = useState(false);

  const applyVoucher = () => {
    const voucher =
      vouchers.find((entry) => entry.code === code.trim().toUpperCase()) ?? null;

    if (voucher) {
      onApply(voucher);
      setIsSuccess(true);
      setMessage(`${voucher.label} đã được áp dụng.`);
      return;
    }

    onApply(null);
    setIsSuccess(false);
    setMessage("Mã giảm giá không hợp lệ.");
  };

  return (
    <div>
      <p className="font-heading size-kicker-xs font-semibold uppercase tracking-[0.18em] text-store-muted">
        Mã giảm giá
      </p>
      <div className="mt-3 flex gap-2">
        <input
          value={code}
          maxLength={20}
          placeholder="Nhập mã..."
          onChange={(event) => setCode(event.target.value.toUpperCase())}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              applyVoucher();
            }
          }}
          className="flex-1 rounded-full border border-[var(--border)] bg-white px-4 py-3 size-action text-[#111111] outline-none placeholder:text-store-muted/70 focus:border-store-blue"
        />
        <button
          type="button"
          onClick={applyVoucher}
          className="whitespace-nowrap rounded-full border border-store-blue px-5 py-3 font-heading size-label font-semibold uppercase tracking-[0.16em] text-store-blue transition-colors hover:bg-store-blue hover:text-white"
        >
          Áp dụng
        </button>
      </div>
      {message ? (
        <p className={["mt-2 text-sm", isSuccess ? "text-green-600" : "text-red-500"].join(" ")}>
          {message}
        </p>
      ) : null}
    </div>
  );
}

function OrderItemRow({ item }: { item: CartItem }) {
  return (
    <div className="flex items-start gap-3 rounded-[24px] border border-[var(--border)] bg-white p-3">
      <div className="relative h-[76px] w-[64px] flex-shrink-0 overflow-hidden rounded-[16px]">
        <ProductMedia
          image={{
            id: 0,
            alt: item.name,
            bgClass: item.bgClass,
            iconPath: item.iconPath,
            imageUrl: item.imageUrl,
          }}
          bgClass={item.bgClass}
          className="h-full w-full"
          imageClassName="h-full w-full object-cover"
          svgClassName="h-8 w-8 opacity-25"
          stroke="rgba(0,0,0,0.12)"
          strokeWidth={0.8}
        />
        <span className="absolute bottom-1 right-1 rounded-full bg-[#111111]/85 px-1.5 py-0.5 font-heading size-micro font-semibold text-white">
          x{item.qty}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-heading size-action font-semibold uppercase tracking-[0.08em] text-[#111111]">
          {item.name}
        </p>
        <p className="mt-1 text-sm text-store-muted">{item.sub}</p>
      </div>
      <p className="font-heading size-title-xs font-semibold text-[#111111]">
        {formatVnd(item.price * item.qty)}
      </p>
    </div>
  );
}

function OrderSummary({
  items,
  vouchers,
  discountPct,
  discountLabel,
  orderStatus,
  orderError,
  onVoucherApply,
  onPlaceOrder,
}: {
  items: CartItem[];
  vouchers: Voucher[];
  discountPct: number;
  discountLabel: string;
  orderStatus: OrderStatus;
  orderError: string;
  onVoucherApply: (voucher: Voucher | null) => void;
  onPlaceOrder: () => void;
}) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const discountAmount = Math.round(subtotal * (discountPct / 100));
  const shippingFee = getShippingFee(subtotal, discountAmount);
  const total = subtotal - discountAmount + shippingFee;

  return (
    <aside className="rounded-[32px] border border-[var(--border)] bg-white p-5 shadow-[0_24px_80px_rgba(17,17,17,0.06)] lg:sticky lg:top-[112px]">
      <p className="font-heading size-kicker-xs font-semibold uppercase tracking-[0.22em] text-store-blue">
        Đơn hàng của bạn
      </p>
      <h2 className="mt-2 max-w-[15ch] font-heading type-vn-title size-title-md font-semibold uppercase text-[#111111]">
        Tóm tắt đơn hàng
      </h2>

      <div className="mt-5 space-y-3">
        {items.map((item) => (
          <OrderItemRow key={item.key} item={item} />
        ))}
      </div>

      <div className="mt-5 rounded-[24px] bg-[var(--surface)] p-4">
        <VoucherInput vouchers={vouchers} onApply={onVoucherApply} />
      </div>

      <div className="mt-5 space-y-3 rounded-[24px] border border-[var(--border)] bg-[#fafbfc] p-4">
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

      <div className="mt-5">
        <p className="font-heading size-kicker-xs font-semibold uppercase tracking-[0.22em] text-store-muted">
          Tổng cộng
        </p>
        <p className="mt-1 font-heading size-title-lg font-semibold text-[#111111]">
          {formatVnd(total)}
        </p>
      </div>

      <button
        type="button"
        onClick={onPlaceOrder}
        disabled={orderStatus !== "idle"}
        className={[
          "mt-5 flex w-full items-center justify-center gap-2 rounded-full py-4 font-heading size-action font-semibold uppercase tracking-[0.18em] transition-colors",
          orderStatus === "idle"
            ? "bg-[#111111] text-white hover:bg-store-blue"
            : orderStatus === "loading"
              ? "bg-store-blue-soft text-store-blue"
              : "bg-[#1f9d61] text-white",
        ].join(" ")}
      >
        {orderStatus === "idle" ? <ArrowRight className="h-4 w-4" /> : null}
        {orderStatus === "loading" ? <Spinner /> : null}
        {orderStatus === "success" ? <Check className="h-4 w-4" /> : null}
        {orderStatus === "idle"
          ? "Đặt hàng"
          : orderStatus === "loading"
            ? "Đang xử lý"
            : "Thành công"}
      </button>

      {orderError ? <p className="mt-3 text-sm text-red-500">{orderError}</p> : null}
    </aside>
  );
}

function SuccessScreen({ orderNumber }: { orderNumber: string }) {
  return (
    <div className="mx-auto max-w-[760px] px-4 py-16 text-center sm:px-6 lg:px-8 lg:py-20">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-store-blue-soft text-store-blue">
        <Check className="h-8 w-8" />
      </div>
      <p className="mt-6 font-heading size-kicker font-semibold uppercase tracking-[0.24em] text-store-blue">
        Đặt hàng thành công
      </p>
      <h1 className="mt-3 mx-auto max-w-[14ch] font-heading type-vn-display size-display-md font-semibold uppercase text-[#111111]">
        Đặt hàng thành công
      </h1>
      <p className="mx-auto mt-4 max-w-[520px] size-copy-md text-store-muted">
        Đơn hàng đã được ghi nhận. Chúng tôi sẽ sớm xác nhận và cập nhật trạng thái
        mới nhất tại trang tra cứu đơn hàng.
      </p>
      <div className="mt-8 rounded-[28px] border border-[var(--border)] bg-white px-6 py-5">
        <p className="font-heading size-kicker-xs font-semibold uppercase tracking-[0.2em] text-store-muted">
          Mã đơn hàng
        </p>
        <p className="mt-2 font-heading size-price font-semibold uppercase tracking-[0.08em] text-[#111111]">
          {orderNumber}
        </p>
      </div>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/collection"
          className="rounded-full bg-[#111111] px-6 py-3.5 font-heading size-action font-semibold uppercase tracking-[0.18em] text-white no-underline transition-colors hover:bg-store-blue"
        >
          Tiếp tục mua sắm
        </Link>
        <Link
          href="/track-order"
          className="rounded-full border border-[var(--border)] px-6 py-3.5 font-heading size-action font-semibold uppercase tracking-[0.18em] text-[#111111] no-underline transition-colors hover:border-store-blue hover:text-store-blue"
        >
          Tra cứu đơn
        </Link>
      </div>
    </div>
  );
}

function EmptyCheckout() {
  return (
    <div className="mx-auto max-w-[760px] px-4 py-16 text-center sm:px-6 lg:px-8 lg:py-20">
      <div className="rounded-[32px] border border-dashed border-[var(--border)] bg-white px-6 py-16">
        <p className="font-heading size-kicker font-semibold uppercase tracking-[0.24em] text-store-blue">
          Giỏ hàng trống
        </p>
        <h1 className="mt-3 mx-auto max-w-[14ch] font-heading type-vn-display size-display-sm font-semibold uppercase text-[#111111] sm:size-display-md">
          Chưa có sản phẩm để thanh toán
        </h1>
        <p className="mx-auto mt-4 max-w-[520px] size-copy-md text-store-muted">
          Thêm vài món vào giỏ trước khi sang bước thanh toán.
        </p>
        <Link
          href="/collection"
          className="mt-8 inline-flex rounded-full bg-[#111111] px-6 py-3.5 font-heading size-action font-semibold uppercase tracking-[0.18em] text-white no-underline transition-colors hover:bg-store-blue"
        >
          Xem bộ sưu tập
        </Link>
      </div>
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
  const [orderNumber, setOrderNumber] = useState("");
  const [orderError, setOrderError] = useState("");

  const setFieldValue = (key: keyof FormData, value: string) => {
    setForm((current) => ({
      ...current,
      [key]: value,
      ...(key === "province" ? { district: "", ward: "" } : {}),
      ...(key === "district" ? { ward: "" } : {}),
    }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const setField =
    (key: keyof FormData) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setFieldValue(key, event.target.value);
    };

  const validate = () => {
    const nextErrors: FormErrors = {};

    if (!form.name.trim()) {
      nextErrors.name = "Vui lòng nhập họ tên";
    }
    if (!form.phone.trim()) {
      nextErrors.phone = "Vui lòng nhập số điện thoại";
    } else if (!/^0\d{9,10}$/.test(form.phone.trim())) {
      nextErrors.phone = "Số điện thoại không hợp lệ";
    }
    if (!form.province.trim()) {
      nextErrors.province = "Vui lòng nhập tỉnh/thành phố";
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
        setOrderError(result.error ?? "Không thể tạo đơn hàng lúc này.");
        return;
      }

      setOrderStatus("success");
      setOrderNumber(result.orderNumber);
      clearCart();
    } catch {
      setOrderStatus("idle");
      setOrderError("Không thể kết nối tới máy chủ đặt hàng.");
    }
  };

  if (orderStatus === "success") {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <CheckoutNav />
        <SuccessScreen orderNumber={orderNumber} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <CheckoutNav />

      {items.length === 0 ? (
        <EmptyCheckout />
      ) : (
        <div className="mx-auto max-w-[1240px] px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-store-muted">
            <span className="inline-flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-store-blue" />
              Đặt hàng an toàn
            </span>
            <span className="inline-flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-store-blue" />
              Form rõ ràng, điền nhanh
            </span>
            <span className="inline-flex items-center gap-2">
              <WalletCards className="h-4 w-4 text-store-blue" />
              COD & chuyển khoản QR
            </span>
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_390px]">
            <div className="space-y-6">
              <SectionCard eyebrow="Khách hàng" title="Thông tin khách hàng">
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormInput
                    label="Họ và tên *"
                    placeholder="Nguyễn Văn A"
                    value={form.name}
                    onChange={setField("name")}
                    error={errors.name}
                  />
                  <FormInput
                    label="Số điện thoại *"
                    placeholder="09xx xxx xxx"
                    value={form.phone}
                    onChange={setField("phone")}
                    inputMode="tel"
                    maxLength={11}
                    error={errors.phone}
                  />
                </div>
                <FormInput
                  label="Email"
                  type="email"
                  placeholder="email@example.com"
                  value={form.email}
                  onChange={setField("email")}
                  className="mt-4"
                />
              </SectionCard>

              <SectionCard eyebrow="Giao hàng" title="Địa chỉ giao hàng">
                <CheckoutAddressSection
                  value={{
                    province: form.province,
                    district: form.district,
                    ward: form.ward,
                    address: form.address,
                    note: form.note,
                  }}
                  errors={{
                    province: errors.province,
                    address: errors.address,
                  }}
                  onFieldChange={(field, value) => setFieldValue(field, value)}
                />
              </SectionCard>

              <SectionCard eyebrow="Thanh toán" title="Phương thức thanh toán">
                <PaymentSelector selected={payMethod} onChange={setPayMethod} />
              </SectionCard>
            </div>

            <OrderSummary
              items={items}
              vouchers={vouchers}
              discountPct={discountPct}
              discountLabel={discountLabel}
              orderStatus={orderStatus}
              orderError={orderError}
              onVoucherApply={(voucher) => {
                setDiscountPct(voucher?.pct ?? 0);
                setDiscountLabel(voucher?.label ?? "");
                setVoucherCode(voucher?.code ?? "");
              }}
              onPlaceOrder={placeOrder}
            />
          </div>
        </div>
      )}
    </div>
  );
}
