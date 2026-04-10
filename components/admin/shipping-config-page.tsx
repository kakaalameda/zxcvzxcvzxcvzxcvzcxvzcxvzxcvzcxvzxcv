"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AdminShippingConfigRecord } from "@/lib/repositories/admin-shipping-config";
import {
  adminShippingConfigSchema,
  type AdminShippingConfigFormValues,
  type AdminShippingConfigPayload,
} from "@/lib/validations/admin";

function buildDefaultValues(config: AdminShippingConfigRecord | null) {
  return {
    baseUrl: config?.baseUrl ?? "https://services.giaohangtietkiem.vn",
    apiToken: config?.apiToken ?? "",
    clientSource: config?.clientSource ?? "",
    pickName: config?.pickName ?? "",
    pickAddressId: config?.pickAddressId ?? "",
    pickAddress: config?.pickAddress ?? "",
    pickProvince: config?.pickProvince ?? "",
    pickDistrict: config?.pickDistrict ?? "",
    pickWard: config?.pickWard ?? "",
    pickTel: config?.pickTel ?? "",
    transport: config?.transport ?? "road",
    defaultProductWeight: config?.defaultProductWeight ?? 0.2,
  };
}

export function ShippingConfigPage({
  initialConfig,
}: {
  initialConfig: AdminShippingConfigRecord | null;
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const form = useForm<
    AdminShippingConfigFormValues,
    unknown,
    AdminShippingConfigPayload
  >({
    resolver: zodResolver(adminShippingConfigSchema),
    defaultValues: buildDefaultValues(initialConfig),
  });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      setMessage(null);
      setError(null);

      const response = await fetch("/api/admin/shipping-config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      const result = (await response.json().catch(() => null)) as
        | { error?: string; message?: string }
        | null;

      if (!response.ok) {
        setError(result?.error ?? "Failed to save GHTK config.");
        return;
      }

      setMessage(result?.message ?? "GHTK config saved.");
    });
  });

  return (
    <div className="min-h-screen bg-[#050505] px-4 py-6 text-white md:px-8">
      <div className="mx-auto grid max-w-7xl gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-3xl border border-white/10 bg-black/40 p-6">
          <p className="text-xs uppercase tracking-[0.35em] text-gold-500">
            Admin
          </p>
          <h1 className="mt-3 font-display text-4xl tracking-wide">GHTK API Config</h1>
          <p className="mt-3 max-w-2xl text-sm text-white/60">
            Save the credentials and pickup address used when approving orders from
            /admin/orders.
          </p>
          <p className="mt-3 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            Province, district, ward, and street names must match GHTK naming
            exactly. If approval fails, check the address strings first.
          </p>

          <form className="mt-8 space-y-5" onSubmit={onSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                form={form}
                name="baseUrl"
                label="Base URL"
                placeholder="https://services.giaohangtietkiem.vn"
              />
              <FormField
                form={form}
                name="clientSource"
                label="X-Client-Source"
                placeholder="S308157"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ghtk-api-token">API token</Label>
              <Input
                id="ghtk-api-token"
                type="password"
                autoComplete="off"
                {...form.register("apiToken")}
              />
              <p className="text-xs text-red-400">
                {form.formState.errors.apiToken?.message}
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                form={form}
                name="pickName"
                label="Pick contact"
                placeholder="Warehouse contact"
              />
              <FormField
                form={form}
                name="pickTel"
                label="Pick phone"
                placeholder="0911222333"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                form={form}
                name="pickAddressId"
                label="Pick address ID"
                placeholder="Optional"
              />
              <FormField
                form={form}
                name="pickAddress"
                label="Pick address"
                placeholder="590 Cach Mang Thang 8, Phuong 11"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <FormField
                form={form}
                name="pickProvince"
                label="Pick province"
                placeholder="TP. Ho Chi Minh"
              />
              <FormField
                form={form}
                name="pickDistrict"
                label="Pick district"
                placeholder="Quan 3"
              />
              <FormField
                form={form}
                name="pickWard"
                label="Pick ward"
                placeholder="Phuong 11"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="ghtk-transport">Transport</Label>
                <select
                  id="ghtk-transport"
                  className="flex h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
                  {...form.register("transport")}
                >
                  <option value="road" className="bg-black text-white">
                    road
                  </option>
                  <option value="fly" className="bg-black text-white">
                    fly
                  </option>
                </select>
                <p className="text-xs text-red-400">
                  {form.formState.errors.transport?.message}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ghtk-default-weight">Default item weight (kg)</Label>
                <Input
                  id="ghtk-default-weight"
                  type="number"
                  min={0.001}
                  step="0.001"
                  {...form.register("defaultProductWeight")}
                />
                <p className="text-xs text-red-400">
                  {form.formState.errors.defaultProductWeight?.message}
                </p>
              </div>
            </div>

            {error ? (
              <p className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </p>
            ) : null}

            {message ? (
              <p className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
                {message}
              </p>
            ) : null}

            <div className="flex gap-3">
              <Button
                type="submit"
                className="bg-gold-500 text-black hover:bg-gold-400"
                disabled={isPending}
              >
                {isPending ? "Saving..." : "Save config"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  form.reset(buildDefaultValues(initialConfig));
                  setError(null);
                  setMessage(null);
                }}
              >
                Reset
              </Button>
            </div>
          </form>
        </section>

        <section className="rounded-3xl border border-white/10 bg-black/50 p-6">
          <p className="text-xs uppercase tracking-[0.35em] text-gold-500">
            Required by GHTK
          </p>
          <div className="mt-4 space-y-4 text-sm text-white/70">
            <InfoBlock
              title="Approve flow"
              text="Approve now creates a shipment on GHTK first. The returned GHTK label is stored as the order tracking code."
            />
            <InfoBlock
              title="Cancel flow"
              text="Cancel will call GHTK for confirmed orders, then mark the local order as cancelled."
            />
            <InfoBlock
              title="Address format"
              text="Use the exact province, district, and ward strings recognized by GHTK. If GHTK rejects an address, correct the order or pickup naming and retry."
            />
            <InfoBlock
              title="Weight"
              text="Because products do not store shipment weight yet, approval uses one default item weight from this page for all line items."
            />
          </div>
        </section>
      </div>
    </div>
  );
}

function FormField({
  form,
  name,
  label,
  placeholder,
}: {
  form: ReturnType<
    typeof useForm<AdminShippingConfigFormValues, unknown, AdminShippingConfigPayload>
  >;
  name: keyof AdminShippingConfigFormValues;
  label: string;
  placeholder?: string;
}) {
  const fieldName = `ghtk-${String(name)}`;
  const error = form.formState.errors[name];

  return (
    <div className="space-y-2">
      <Label htmlFor={fieldName}>{label}</Label>
      <Input id={fieldName} placeholder={placeholder} {...form.register(name)} />
      <p className="text-xs text-red-400">{error?.message as string | undefined}</p>
    </div>
  );
}

function InfoBlock({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-white/45">{title}</p>
      <p className="mt-2">{text}</p>
    </div>
  );
}
