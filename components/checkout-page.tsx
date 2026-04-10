"use client";

import Link from "next/link";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import { CheckoutAddressSection } from "@/components/checkout-address-section";
import { useCart, type CartItem } from "@/components/cart-context";
import { formatVnd, getShippingFee, type Voucher } from "@/lib/store";

type PayMethod = "cod" | "qr";
type OrderStatus = "idle" | "loading" | "success";
type AddressSyncStatus = "idle" | "loading" | "success" | "warning" | "error";

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

interface NormalizeAddressResult {
  province: string;
  district: string;
  ward: string;
  address: string;
  hamlet: string | null;
  changed: boolean;
  deliverable?: boolean;
  message: string;
}

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

function buildAddressSignature(
  form: Pick<FormData, "province" | "district" | "ward" | "address">,
) {
  return [form.province, form.district, form.ward, form.address]
    .map((value) => value.trim())
    .join("|")
    .toLowerCase();
}

function canNormalizeAddress(form: Pick<FormData, "province" | "address">) {
  return Boolean(form.province.trim() && form.address.trim());
}

function isSettledAddressSyncStatus(status: AddressSyncStatus) {
  return status === "success" || status === "warning";
}

function Spinner() {
  return (
    <div className="h-[17px] w-[17px] rounded-full border-2 border-white/20 border-t-gold-500 animate-spin" />
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      className="h-8 w-8"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      className="h-[17px] w-[17px]"
    >
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

function CheckoutNav() {
  return (
    <nav className="sticky top-0 z-40 border-b border-white/[0.08] bg-black/92 px-5 py-3.5 backdrop-blur-md md:px-8">
      <div className="mx-auto flex max-w-[1120px] items-center justify-between">
        <Link
          href="/"
          className="font-display text-[1.35rem] leading-none tracking-wide no-underline"
        >
          <span className="text-gold-500">NGHE </span>
          <span className="text-white">HUSTLE</span>
        </Link>
        <div className="font-heading text-[0.72rem] uppercase tracking-[0.16em] text-white/35">
          Checkout
        </div>
      </div>
    </nav>
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
      <label className="mb-1.5 block font-heading text-[0.72rem] font-bold uppercase tracking-[0.18em] text-white/40">
        {label}
      </label>
      <input
        {...props}
        className={[
          "w-full border bg-brand-gray-mid px-3.5 py-3 font-heading text-[0.92rem] tracking-wide text-white outline-none transition-colors duration-200 placeholder:text-white/30",
          error
            ? "border-red-400/70 focus:border-red-400"
            : "border-white/15 focus:border-gold-500/40",
        ].join(" ")}
      />
      {error ? (
        <p className="mt-1 font-heading text-[0.68rem] tracking-wide text-red-400">
          {error}
        </p>
      ) : null}
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
      label: "COD",
      description: "Thanh toán khi nhận hàng",
    },
    {
      id: "qr" as const,
      label: "Chuyển khoản",
      description: "Quét QR và chuyển khoản trước",
    },
  ];

  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-2">
        {methods.map((method) => (
          <button
            key={method.id}
            type="button"
            onClick={() => onChange(method.id)}
            className={[
              "border px-4 py-3 text-left transition-colors",
              selected === method.id
                ? "border-gold-500 bg-gold-500/10"
                : "border-white/10 bg-brand-gray-dark hover:border-gold-500/30",
            ].join(" ")}
          >
            <p className="font-heading text-[0.82rem] font-bold uppercase tracking-[0.16em] text-white">
              {method.label}
            </p>
            <p className="mt-1 text-[0.76rem] text-white/45">
              {method.description}
            </p>
          </button>
        ))}
      </div>

      {selected === "qr" ? (
        <div className="border border-gold-500/25 bg-brand-gray-dark p-4">
          <p className="font-heading text-[0.72rem] font-bold uppercase tracking-[0.18em] text-gold-500">
            Thanh toán QR
          </p>
          <div className="mt-4 flex items-center gap-4">
            <div className="flex h-[96px] w-[96px] items-center justify-center bg-white p-2">
              <div
                className="h-full w-full"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(0deg,#000 0px,#000 4px,#fff 4px,#fff 8px),repeating-linear-gradient(90deg,#000 0px,#000 4px,#fff 4px,#fff 8px)",
                  backgroundBlendMode: "multiply",
                }}
              />
            </div>
            <div className="min-w-0">
              <p className="font-heading text-[0.75rem] tracking-wide text-white/65">
                MB Bank · Nghe Hustle Official
              </p>
              <p className="mt-1 font-heading text-[0.88rem] font-bold tracking-[0.14em] text-gold-500">
                1234 5678 9012 3456
              </p>
              <p className="mt-1 text-[0.72rem] text-white/40">
                Nội dung: NH + số điện thoại của bạn
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
      <p className="mb-2 font-heading text-[0.72rem] font-bold uppercase tracking-[0.18em] text-white/40">
        Mã giảm giá
      </p>
      <div className="flex gap-2">
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
          className="flex-1 border border-white/15 bg-brand-gray-mid px-3 py-2.5 font-heading text-[0.85rem] tracking-wide text-white outline-none transition-colors placeholder:text-white/30 focus:border-gold-500/35"
        />
        <button
          type="button"
          onClick={applyVoucher}
          className="border border-gold-500/35 px-4 font-heading text-[0.75rem] font-bold uppercase tracking-[0.18em] text-gold-500 transition-colors hover:bg-gold-500/10"
        >
          Áp dụng
        </button>
      </div>
      {message ? (
        <p
          className={[
            "mt-2 font-heading text-[0.72rem] tracking-wide",
            isSuccess ? "text-green-400" : "text-red-400",
          ].join(" ")}
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}

function OrderItemRow({ item }: { item: CartItem }) {
  return (
    <div className="flex items-start gap-3 border-b border-white/[0.08] py-3 last:border-b-0">
      <div
        className={`flex h-[64px] w-[56px] flex-shrink-0 items-center justify-center bg-gradient-to-br ${item.bgClass}`}
      >
        <span className="font-heading text-[0.72rem] font-bold tracking-[0.12em] text-gold-500">
          x{item.qty}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-heading text-[0.84rem] font-bold uppercase tracking-[0.14em] text-white">
          {item.name}
        </p>
        <p className="mt-1 text-[0.74rem] text-white/45">{item.sub}</p>
      </div>
      <p className="font-display text-[1rem] text-gold-500">
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
    <div className="border border-white/[0.08] bg-brand-gray-dark p-5 lg:sticky lg:top-24">
      <p className="font-heading text-[0.72rem] font-bold uppercase tracking-[0.2em] text-gold-500">
        Đơn hàng
      </p>

      <div className="mt-4">
        {items.map((item) => (
          <OrderItemRow key={item.key} item={item} />
        ))}
      </div>

      <div className="mt-5 border-t border-white/[0.08] pt-5">
        <VoucherInput vouchers={vouchers} onApply={onVoucherApply} />
      </div>

      <div className="mt-5 space-y-2 border-t border-white/[0.08] pt-5 font-heading text-[0.84rem] tracking-wide">
        <div className="flex items-center justify-between text-white/70">
          <span>Tạm tính</span>
          <span>{formatVnd(subtotal)}</span>
        </div>
        {discountPct > 0 ? (
          <div className="flex items-center justify-between text-green-400">
            <span>{discountLabel}</span>
            <span>-{formatVnd(discountAmount)}</span>
          </div>
        ) : null}
        <div className="flex items-center justify-between text-white/70">
          <span>Phí ship</span>
          <span>{shippingFee === 0 ? "Miễn phí" : formatVnd(shippingFee)}</span>
        </div>
      </div>

      <div className="mt-5 flex items-baseline justify-between border-t border-white/[0.08] pt-5">
        <span className="font-heading text-[0.76rem] font-bold uppercase tracking-[0.18em] text-white/40">
          Tổng cộng
        </span>
        <span className="font-display text-[1.8rem] leading-none text-gold-500">
          {formatVnd(total)}
        </span>
      </div>

      <button
        type="button"
        onClick={onPlaceOrder}
        disabled={orderStatus !== "idle"}
        className={[
          "mt-5 flex w-full items-center justify-center gap-2.5 border-2 py-4 font-heading text-[0.94rem] font-bold uppercase tracking-[0.2em] transition-colors",
          orderStatus === "idle"
            ? "border-gold-500 bg-gold-500 text-brand-black hover:bg-white hover:border-white"
            : orderStatus === "loading"
              ? "border-white/10 bg-brand-gray-mid text-white/40"
              : "border-green-400 text-green-400",
        ].join(" ")}
      >
        {orderStatus === "idle" ? (
          <>
            <ArrowIcon />
            Đặt hàng
          </>
        ) : null}
        {orderStatus === "loading" ? (
          <>
            <Spinner />
            Đang xử lý
          </>
        ) : null}
        {orderStatus === "success" ? (
          <>
            <CheckIcon />
            Thành công
          </>
        ) : null}
      </button>

      {orderError ? (
        <p className="mt-3 text-center font-heading text-[0.72rem] tracking-wide text-red-400">
          {orderError}
        </p>
      ) : null}
    </div>
  );
}

function SuccessScreen({ orderNumber }: { orderNumber: string }) {
  return (
    <div className="mx-auto max-w-[760px] px-5 py-24 text-center md:px-8">
      <div className="mx-auto flex h-[72px] w-[72px] items-center justify-center rounded-full border-2 border-green-400/30 bg-green-400/10 text-green-400">
        <CheckIcon />
      </div>
      <h1
        className="mt-6 font-display leading-[0.92] tracking-wide"
        style={{ fontSize: "clamp(2rem,6vw,3rem)" }}
      >
        ĐẶT HÀNG <span className="text-gold-500">THÀNH CÔNG</span>
      </h1>
      <p className="mx-auto mt-4 max-w-md text-white/60">
        Đơn hàng của bạn đang được xử lý. Nghe Hustle sẽ liên hệ và giao hàng
        trong thời gian sớm nhất.
      </p>
      <p className="mt-8 font-heading text-[0.72rem] uppercase tracking-[0.18em] text-white/40">
        Mã đơn hàng
      </p>
      <p className="mt-2 font-display text-[1.8rem] tracking-[0.18em] text-gold-500">
        {orderNumber}
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/collection"
          className="bg-gold-500 px-8 py-3.5 font-heading text-[0.84rem] font-bold uppercase tracking-[0.18em] text-brand-black no-underline transition-colors hover:bg-white"
        >
          Tiếp tục mua sắm
        </Link>
        <Link
          href="/"
          className="border border-white/15 px-8 py-3.5 font-heading text-[0.84rem] font-bold uppercase tracking-[0.18em] text-white/70 no-underline transition-colors hover:border-gold-500/35 hover:text-gold-500"
        >
          Về trang chủ
        </Link>
      </div>
    </div>
  );
}

function EmptyCheckout() {
  return (
    <div className="mx-auto max-w-[760px] px-5 py-24 text-center md:px-8">
      <p className="font-heading text-[0.72rem] font-bold uppercase tracking-[0.18em] text-gold-500">
        Chưa có sản phẩm
      </p>
      <h1
        className="mt-4 font-display leading-[0.92] tracking-wide"
        style={{ fontSize: "clamp(2rem,5vw,3.4rem)" }}
      >
        Giỏ hàng đang <span className="text-gold-500">trống</span>
      </h1>
      <p className="mx-auto mt-4 max-w-md text-white/60">
        Thêm sản phẩm vào giỏ trước khi chuyển sang bước thanh toán.
      </p>
      <Link
        href="/collection"
        className="mt-8 inline-flex items-center gap-2.5 bg-gold-500 px-8 py-3.5 font-heading text-[0.84rem] font-bold uppercase tracking-[0.18em] text-brand-black no-underline transition-colors hover:bg-white"
      >
        Xem bộ sưu tập
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
  const [orderNumber, setOrderNumber] = useState("");
  const [orderError, setOrderError] = useState("");
  const [addressSyncStatus, setAddressSyncStatus] =
    useState<AddressSyncStatus>("idle");
  const [addressSyncMessage, setAddressSyncMessage] = useState("");
  const [lastNormalizedAddress, setLastNormalizedAddress] = useState("");
  const latestFormRef = useRef(form);
  const normalizeRequestRef = useRef(0);

  useEffect(() => {
    latestFormRef.current = form;
  }, [form]);

  const setFieldValue = (key: keyof FormData, value: string) => {
    const isAddressField =
      key === "province" ||
      key === "district" ||
      key === "ward" ||
      key === "address";

    setForm((current) => ({
      ...current,
      [key]: value,
      ...(key === "province" ? { district: "", ward: "" } : {}),
      ...(key === "district" ? { ward: "" } : {}),
    }));
    setErrors((current) => ({ ...current, [key]: undefined }));

    if (isAddressField) {
      setAddressSyncStatus("idle");
      setAddressSyncMessage("");
      setLastNormalizedAddress("");
    }
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

  const syncAddressWithGhtk = async (force = false) => {
    const snapshot = latestFormRef.current;

    if (!canNormalizeAddress(snapshot)) {
      return null;
    }

    const requestId = ++normalizeRequestRef.current;
    const currentSignature = buildAddressSignature(snapshot);

    if (
      !force &&
      isSettledAddressSyncStatus(addressSyncStatus) &&
      currentSignature === lastNormalizedAddress
    ) {
      return snapshot;
    }

    setAddressSyncStatus("loading");
    setAddressSyncMessage("Đang đối chiếu địa chỉ với GHTK...");

    try {
      const response = await fetch("/api/orders/normalize-address", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customer: {
            province: snapshot.province,
            district: snapshot.district,
            ward: snapshot.ward,
            address: snapshot.address,
          },
          itemCount: items.reduce((sum, item) => sum + item.qty, 0),
          value: items.reduce((sum, item) => sum + item.price * item.qty, 0),
        }),
      });

      const result = (await response.json()) as
        | ({ error?: string } & Partial<NormalizeAddressResult>)
        | undefined;

      if (
        !response.ok ||
        !result ||
        typeof result.province !== "string" ||
        typeof result.district !== "string" ||
        typeof result.ward !== "string" ||
        typeof result.address !== "string"
      ) {
        setAddressSyncStatus("error");
        setAddressSyncMessage(
          result?.error ?? "Không thể chuẩn hóa địa chỉ với GHTK.",
        );
        return null;
      }

      if (
        requestId !== normalizeRequestRef.current ||
        buildAddressSignature(latestFormRef.current) !== currentSignature
      ) {
        return null;
      }

      const nextForm: FormData = {
        ...snapshot,
        province: result.province,
        district: result.district,
        ward: result.ward,
        address: result.address,
      };

      setForm(nextForm);
      setErrors((current) => ({
        ...current,
        province: undefined,
        district: undefined,
        ward: undefined,
        address: undefined,
      }));
      setAddressSyncStatus(result.deliverable === false ? "warning" : "success");
      setAddressSyncMessage(
        result.message ?? "Địa chỉ đã được chuẩn hóa theo GHTK.",
      );
      setLastNormalizedAddress(buildAddressSignature(nextForm));
      setOrderError("");

      return nextForm;
    } catch {
      if (requestId !== normalizeRequestRef.current) {
        return null;
      }

      setAddressSyncStatus("error");
      setAddressSyncMessage("Không thể kết nối tới dịch vụ chuẩn hóa địa chỉ.");
      return null;
    }
  };

  const runAutoAddressNormalization = useEffectEvent(() => {
    void syncAddressWithGhtk(false);
  });

  const addressReadyForNormalization = canNormalizeAddress(form);
  const currentAddressSignature = buildAddressSignature(form);

  useEffect(() => {
    if (!addressReadyForNormalization) {
      return;
    }

    if (
      isSettledAddressSyncStatus(addressSyncStatus) &&
      currentAddressSignature === lastNormalizedAddress
    ) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      runAutoAddressNormalization();
    }, 900);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [
    addressReadyForNormalization,
    currentAddressSignature,
    items,
    addressSyncStatus,
    lastNormalizedAddress,
  ]);

  const placeOrder = async () => {
    if (!items.length || !validate() || orderStatus !== "idle") {
      return;
    }

    setOrderStatus("loading");
    setOrderError("");

    try {
      const normalizedForm = await syncAddressWithGhtk(true);
      if (!normalizedForm) {
        setOrderStatus("idle");
        return;
      }

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customer: normalizedForm,
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
      <div className="min-h-screen bg-brand-black font-body text-white">
        <CheckoutNav />
        <SuccessScreen orderNumber={orderNumber} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-black font-body text-white">
      <CheckoutNav />

      {items.length === 0 ? (
        <EmptyCheckout />
      ) : (
        <div className="mx-auto max-w-[1120px] px-5 py-8 md:px-8">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_380px]">
            <div className="space-y-6">
              <section className="border border-white/[0.08] bg-brand-gray-dark p-5">
                <p className="font-heading text-[0.72rem] font-bold uppercase tracking-[0.2em] text-gold-500">
                  Thông tin khách hàng
                </p>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
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
                  className="mt-3"
                />
              </section>

              <section className="border border-white/[0.08] bg-brand-gray-dark p-5">
                <p className="font-heading text-[0.72rem] font-bold uppercase tracking-[0.2em] text-gold-500">
                  Địa chỉ giao hàng
                </p>

                <div className="mt-4">
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
                    addressSyncStatus={addressSyncStatus}
                    addressSyncMessage={addressSyncMessage}
                    onFieldChange={(field, value) => setFieldValue(field, value)}
                    onRetryNormalize={() => {
                      void syncAddressWithGhtk(true);
                    }}
                  />
                </div>
              </section>

              <section className="border border-white/[0.08] bg-brand-gray-dark p-5">
                <p className="font-heading text-[0.72rem] font-bold uppercase tracking-[0.2em] text-gold-500">
                  Thanh toán
                </p>
                <div className="mt-4">
                  <PaymentSelector
                    selected={payMethod}
                    onChange={setPayMethod}
                  />
                </div>
              </section>
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
