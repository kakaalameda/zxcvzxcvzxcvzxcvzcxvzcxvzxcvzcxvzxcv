import { z } from "zod";

const PRODUCT_TYPES = ["Tee", "Hoodie", "Pants"] as const;
const PRODUCT_SIZES = ["S", "M", "L", "XL", "XXL"] as const;
const TAG_VARIANTS = ["gold", "white", "red", "outline"] as const;
const ORDER_STATUSES = ["pending", "confirmed", "shipped", "cancelled"] as const;

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

export function parseColorsText(value: string) {
  return splitLines(value).map((line) => {
    const [name, hex, bgClass] = line.split("|").map((part) => part?.trim() ?? "");
    if (!name || !hex || !bgClass) {
      throw new Error("Mỗi dòng màu phải có dạng Tên|#HEX|bgClass");
    }

    return { name, hex, bgClass };
  });
}

export function parseSpecsText(value: string) {
  return splitLines(value).map((line) => {
    const [label, specValue] = line.split("|").map((part) => part?.trim() ?? "");
    if (!label || !specValue) {
      throw new Error("Mỗi dòng thông số phải có dạng Label|Value");
    }

    return { label, value: specValue };
  });
}

export function parseFeaturesText(value: string) {
  return splitLines(value);
}

export const adminProductSchema = z.object({
  name: z.string().trim().min(1),
  subtitle: z.string().trim().min(1),
  category: z.enum(PRODUCT_TYPES),
  description: z.string().trim().min(1),
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
  stockCount: z.coerce.number().int().min(0),
  featured: z.coerce.boolean(),
  sortOrder: z.coerce.number().int().min(0),
  colorsText: z
    .string()
    .trim()
    .min(1)
    .superRefine((value, ctx) => {
      try {
        const colors = parseColorsText(value);
        if (!colors.length) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Cần ít nhất một màu",
          });
        }
      } catch (error) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: error instanceof Error ? error.message : "Định dạng màu không hợp lệ",
        });
      }
    }),
  sizes: z.array(z.enum(PRODUCT_SIZES)).min(1),
  specsText: z
    .string()
    .trim()
    .min(1)
    .superRefine((value, ctx) => {
      try {
        const specs = parseSpecsText(value);
        if (!specs.length) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Cần ít nhất một thông số",
          });
        }
      } catch (error) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            error instanceof Error ? error.message : "Định dạng thông số không hợp lệ",
        });
      }
    }),
  featuresText: z.string().trim().optional().default(""),
  imageUrls: z.array(z.string().url()).default([]),
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
      .refine((value) => !value || !Number.isNaN(Date.parse(value)), "Invalid expiry date")
      .optional(),
  ),
});

export const adminOrderApprovalSchema = z.object({
  trackingCode: z.string().trim().max(120).optional().or(z.literal("")),
});

export const adminOrderStatusSchema = z.enum(ORDER_STATUSES);

export type AdminProductPayload = z.infer<typeof adminProductSchema>;
export type AdminVoucherPayload = z.infer<typeof adminVoucherSchema>;
export type AdminOrderApprovalPayload = z.infer<typeof adminOrderApprovalSchema>;
export type AdminOrderStatus = z.infer<typeof adminOrderStatusSchema>;
