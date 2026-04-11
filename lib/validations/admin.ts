import { z } from "zod";
import {
  PREDEFINED_PRODUCT_COLOR_NAMES,
  PRODUCT_SIZES,
  PRODUCT_TYPES,
  TAG_VARIANTS,
} from "@/lib/product-config";

const ORDER_STATUSES = ["pending", "confirmed", "shipped", "cancelled"] as const;
const SHIPPING_TRANSPORTS = ["road", "fly"] as const;

function emptyStringToNull(value: unknown) {
  if (value === "" || value === undefined || value === null) {
    return null;
  }

  return value;
}

function emptyStringToUndefined(value: unknown) {
  if (value === "" || value === undefined || value === null) {
    return undefined;
  }

  return value;
}

function splitLines(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function parseSpecsText(value: string) {
  return splitLines(value).map((line) => {
    const [label, specValue] = line.split("|").map((part) => part?.trim() ?? "");
    if (!label || !specValue) {
      throw new Error("Moi dong thong so phai co dang Label|Value");
    }

    return { label, value: specValue };
  });
}

export function parseFeaturesText(value: string) {
  return splitLines(value);
}

const adminProductImageSchema = z.object({
  url: z.string().url("Anh phai la URL hop le"),
  assignedColorName: z.preprocess(
    emptyStringToNull,
    z.enum(PREDEFINED_PRODUCT_COLOR_NAMES).nullable().optional(),
  ),
});

const adminProductColorVariantSchema = z.object({
  colorName: z.enum(PREDEFINED_PRODUCT_COLOR_NAMES),
  stockCount: z.coerce.number().int().min(0),
  sizes: z.array(z.enum(PRODUCT_SIZES)).min(1, "Can chon it nhat mot size"),
  images: z.array(adminProductImageSchema).default([]),
});

export const adminProductSchema = z
  .object({
    name: z.string().trim().min(1, "Ten san pham la bat buoc"),
    subtitle: z.string().trim().min(1, "Subtitle la bat buoc"),
    category: z.enum(PRODUCT_TYPES),
    description: z.string().trim().min(1, "Mo ta la bat buoc"),
    price: z.coerce.number().int().min(0),
    oldPrice: z.preprocess(
      emptyStringToNull,
      z.coerce.number().int().min(0).nullable().optional(),
    ),
    tag: z.string().trim().max(32).optional().or(z.literal("")),
    tagVariant: z.preprocess(
      emptyStringToNull,
      z.enum(TAG_VARIANTS).nullable().optional(),
    ),
    rating: z.coerce.number().min(0).max(5),
    reviewCount: z.coerce.number().int().min(0),
    featured: z.coerce.boolean(),
    isActive: z.coerce.boolean().default(true),
    slug: z.preprocess(
      emptyStringToNull,
      z.string().trim().regex(/^[a-z0-9-]*$/, "Slug chỉ gồm chữ thường, số và dấu gạch ngang").nullable().optional(),
    ),
    sortOrder: z.coerce.number().int().min(0),
    specsText: z
      .string()
      .trim()
      .min(1, "Can it nhat mot thong so")
      .superRefine((value, ctx) => {
        try {
          if (!parseSpecsText(value).length) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Can it nhat mot thong so",
            });
          }
        } catch (error) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message:
              error instanceof Error ? error.message : "Thong so khong hop le",
          });
        }
      }),
    featuresText: z.string().trim().optional().default(""),
    generalImages: z.array(adminProductImageSchema).default([]),
    colorVariants: z
      .array(adminProductColorVariantSchema)
      .min(1, "Can it nhat mot bien the mau"),
  })
  .superRefine((value, ctx) => {
    const seenColors = new Set<string>();
    const totalImages =
      value.generalImages.length +
      value.colorVariants.reduce((sum, variant) => sum + variant.images.length, 0);

    value.colorVariants.forEach((variant, index) => {
      if (seenColors.has(variant.colorName)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["colorVariants", index, "colorName"],
          message: "Moi mau chi duoc dung mot lan",
        });
      }

      seenColors.add(variant.colorName);
    });

    if (!totalImages) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["generalImages"],
        message: "Can it nhat mot anh cho san pham",
      });
    }
  });

export const adminVoucherSchema = z.object({
  code: z
    .string()
    .trim()
    .min(3)
    .max(32)
    .transform((value) => value.toUpperCase()),
  pct: z.coerce.number().int().min(1).max(100),
  label: z.string().trim().min(1),
  desc: z.string().trim().min(1),
  active: z.coerce.boolean(),
  maxUses: z.preprocess(
    emptyStringToNull,
    z.coerce.number().int().positive().nullable().optional(),
  ),
  usedCount: z.coerce.number().int().min(0).default(0),
  expiresAt: z.preprocess(
    emptyStringToUndefined,
    z
      .string()
      .trim()
      .refine(
        (value) => !value || !Number.isNaN(Date.parse(value)),
        "Ngay het han khong hop le",
      )
      .optional(),
  ),
});

export const adminOrderApprovalSchema = z.object({
  trackingCode: z.string().trim().max(120).optional().or(z.literal("")),
});

export const adminOrderStatusSchema = z.enum(ORDER_STATUSES);

export const adminShippingConfigSchema = z.object({
  baseUrl: z.string().trim().url("Base URL is invalid"),
  apiToken: z.string().trim().min(10, "API token is required"),
  clientSource: z.string().trim().min(1, "X-Client-Source is required"),
  pickName: z.string().trim().min(1, "Pick name is required"),
  pickAddressId: z.preprocess(
    emptyStringToNull,
    z.string().trim().min(1).nullable().optional(),
  ),
  pickAddress: z.string().trim().min(1, "Pick address is required"),
  pickProvince: z.string().trim().min(1, "Pick province is required"),
  pickDistrict: z.string().trim().min(1, "Pick district is required"),
  pickWard: z.preprocess(
    emptyStringToNull,
    z.string().trim().min(1).nullable().optional(),
  ),
  pickTel: z
    .string()
    .trim()
    .regex(/^\d{9,15}$/, "Pick phone must contain 9-15 digits"),
  transport: z.enum(SHIPPING_TRANSPORTS),
  defaultProductWeight: z.coerce
    .number()
    .positive("Default product weight must be greater than 0")
    .max(50, "Default product weight is too large"),
});

export type AdminProductPayload = z.infer<typeof adminProductSchema>;
export type AdminProductFormValues = z.input<typeof adminProductSchema>;
export type AdminProductImagePayload = z.infer<typeof adminProductImageSchema>;
export type AdminProductColorVariantPayload = z.infer<
  typeof adminProductColorVariantSchema
>;
export type AdminVoucherPayload = z.infer<typeof adminVoucherSchema>;
export type AdminOrderApprovalPayload = z.infer<typeof adminOrderApprovalSchema>;
export type AdminOrderStatus = z.infer<typeof adminOrderStatusSchema>;
export type AdminShippingConfigFormValues = z.input<
  typeof adminShippingConfigSchema
>;
export type AdminShippingConfigPayload = z.infer<typeof adminShippingConfigSchema>;
