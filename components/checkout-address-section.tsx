"use client";

import { useState } from "react";
import {
  SearchableDropdown,
  type SearchableDropdownOption,
} from "@/components/searchable-dropdown";

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
  onFieldChange: (field: keyof CheckoutAddressValue, value: string) => void;
}

async function fetchAddressOptions(args: {
  kind: "province" | "district" | "ward";
  query: string;
  provinceCode?: number | null;
  districtCode?: number | null;
}) {
  const params = new URLSearchParams({ kind: args.kind });

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
      <label className="mb-1.5 block font-heading size-kicker-xs font-semibold uppercase tracking-[0.18em] text-store-muted">
        {props.label}
      </label>
      <input
        value={props.value}
        onChange={(event) => props.onChange(event.target.value)}
        placeholder={props.placeholder}
        className={[
          "w-full rounded-[22px] border bg-white px-4 py-3.5 size-copy text-[#111111] outline-none transition-colors placeholder:text-store-muted/70",
          props.error ? "border-red-400 focus:border-red-400" : "border-[var(--border)] focus:border-store-blue",
        ].join(" ")}
      />
      {props.error ? <p className="mt-1.5 text-sm text-red-500">{props.error}</p> : null}
    </div>
  );
}

export function CheckoutAddressSection({
  value,
  errors,
  onFieldChange,
}: CheckoutAddressSectionProps) {
  const [provinceCode, setProvinceCode] = useState<number | null>(null);
  const [districtCode, setDistrictCode] = useState<number | null>(null);

  return (
    <div className="space-y-4">
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

      <div className="grid gap-4 sm:grid-cols-2">
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
              : "Chọn tỉnh/thành trước."
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
              ? "Danh sách sẽ thu hẹp theo quận/huyện đã chọn."
              : "Chọn quận/huyện trước."
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
    </div>
  );
}
