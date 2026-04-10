"use client";

import { useState } from "react";
import {
  SearchableDropdown,
  type SearchableDropdownOption,
} from "@/components/searchable-dropdown";

type AddressSyncStatus = "idle" | "loading" | "success" | "warning" | "error";

interface CheckoutAddressValue {
  province: string;
  district: string;
  ward: string;
  address: string;
  note: string;
}

interface CheckoutAddressErrors {
  province?: string;
  address?: string;
}

interface CheckoutAddressSectionProps {
  value: CheckoutAddressValue;
  errors: CheckoutAddressErrors;
  addressSyncStatus: AddressSyncStatus;
  addressSyncMessage: string;
  onFieldChange: (field: keyof CheckoutAddressValue, value: string) => void;
  onRetryNormalize: () => void;
}

async function fetchAddressOptions(args: {
  kind: "province" | "district" | "ward";
  query: string;
  provinceCode?: number | null;
  districtCode?: number | null;
}) {
  const params = new URLSearchParams({
    kind: args.kind,
  });

  if (args.query.trim()) {
    params.set("q", args.query.trim());
  }

  if (args.provinceCode) {
    params.set("provinceCode", String(args.provinceCode));
  }

  if (args.districtCode) {
    params.set("districtCode", String(args.districtCode));
  }

  const response = await fetch(`/api/address-options?${params.toString()}`);
  const payload = (await response.json()) as {
    options?: SearchableDropdownOption[];
    error?: string;
  };

  if (!response.ok) {
    throw new Error(payload.error ?? "Could not load address options.");
  }

  return payload.options ?? [];
}

function TextField(props: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  error?: string;
  className?: string;
}) {
  return (
    <div className={props.className}>
      <label className="block font-heading text-[0.72rem] tracking-[0.18em] uppercase text-white/40 font-bold mb-1.5">
        {props.label}
      </label>
      <input
        value={props.value}
        onChange={(event) => props.onChange(event.target.value)}
        placeholder={props.placeholder}
        className={[
          "w-full bg-brand-gray-mid border text-white font-heading text-[0.9rem] tracking-wide px-3.5 py-3 outline-none transition-colors duration-200 placeholder:text-white/30",
          props.error
            ? "border-red-400/70 focus:border-red-400"
            : "border-white/15 focus:border-gold-500/40",
        ].join(" ")}
      />
      {props.error ? (
        <p className="mt-1 font-heading text-[0.68rem] text-red-400 tracking-wide">
          {props.error}
        </p>
      ) : null}
    </div>
  );
}

export function CheckoutAddressSection({
  value,
  errors,
  addressSyncStatus,
  addressSyncMessage,
  onFieldChange,
  onRetryNormalize,
}: CheckoutAddressSectionProps) {
  const [provinceCode, setProvinceCode] = useState<number | null>(null);
  const [districtCode, setDistrictCode] = useState<number | null>(null);

  return (
    <div className="space-y-3">
      <SearchableDropdown
        label="Tỉnh / Thành phố *"
        value={value.province}
        placeholder="Tìm tỉnh, thành..."
        error={errors.province}
        loadOptions={(query) =>
          fetchAddressOptions({
            kind: "province",
            query,
          })
        }
        onValueChange={(nextValue) => {
          setProvinceCode(null);
          setDistrictCode(null);
          onFieldChange("province", nextValue);
          onFieldChange("district", "");
          onFieldChange("ward", "");
        }}
        onSelect={(option) => {
          setProvinceCode(option.code);
          setDistrictCode(null);
          onFieldChange("province", option.name);
          onFieldChange("district", "");
          onFieldChange("ward", "");
        }}
        helperText="Tìm theo tên tỉnh/thành trong dữ liệu hành chính Việt Nam."
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <SearchableDropdown
          label="Quận / Huyện"
          value={value.district}
          placeholder="Tìm quận, huyện..."
          disabled={!value.province.trim()}
          loadOptions={(query) =>
            fetchAddressOptions({
              kind: "district",
              query,
              provinceCode,
            })
          }
          onValueChange={(nextValue) => {
            setDistrictCode(null);
            onFieldChange("district", nextValue);
            onFieldChange("ward", "");
          }}
          onSelect={(option) => {
            setDistrictCode(option.code);
            onFieldChange("district", option.name);
            onFieldChange("ward", "");
          }}
          helperText={
            value.province.trim()
              ? "Có thể gõ để tìm hoặc chọn nhanh từ danh sách."
              : "Nhập hoặc chọn tỉnh/thành trước."
          }
        />

        <SearchableDropdown
          label="Phường / Xã"
          value={value.ward}
          placeholder="Tìm phường, xã..."
          disabled={!value.district.trim()}
          loadOptions={(query) =>
            fetchAddressOptions({
              kind: "ward",
              query,
              provinceCode,
              districtCode,
            })
          }
          onValueChange={(nextValue) => {
            onFieldChange("ward", nextValue);
          }}
          onSelect={(option) => {
            onFieldChange("ward", option.name);
          }}
          helperText={
            value.district.trim()
              ? "Danh sách sẽ hẹp lại theo quận/huyện đã chọn."
              : "Nhập hoặc chọn quận/huyện trước."
          }
        />
      </div>

      <TextField
        label="Địa chỉ cụ thể *"
        value={value.address}
        placeholder="Số nhà, tên đường..."
        error={errors.address}
        onChange={(nextValue) => onFieldChange("address", nextValue)}
      />

      <TextField
        label="Ghi chú đơn hàng"
        value={value.note}
        placeholder="Ghi chú cho người giao hàng..."
        onChange={(nextValue) => onFieldChange("note", nextValue)}
      />

      <div className="flex items-start justify-between gap-3 border border-white/[0.08] bg-brand-gray-dark px-4 py-3">
        <div>
          <p className="font-heading text-[0.72rem] tracking-[0.18em] uppercase text-gold-500 font-bold">
            Địa chỉ giao hàng
          </p>
          <p
            className={[
              "mt-1 font-heading text-[0.72rem] tracking-wide",
              addressSyncStatus === "error"
                ? "text-red-400"
                : addressSyncStatus === "warning"
                  ? "text-amber-300"
                : addressSyncStatus === "success"
                  ? "text-green-400"
                  : "text-white/45",
            ].join(" ")}
          >
            {addressSyncMessage ||
              "Địa chỉ sẽ được đối chiếu tự động với GHTK khi bạn nhập và trước khi đặt hàng."}
          </p>
        </div>
        {addressSyncStatus === "error" ? (
          <button
            type="button"
            onClick={onRetryNormalize}
            className="border border-gold-500/35 px-3 py-2 font-heading text-[0.68rem] tracking-[0.18em] uppercase text-gold-500 transition-colors hover:bg-gold-500/10"
          >
            Thử lại
          </button>
        ) : null}
      </div>
    </div>
  );
}
