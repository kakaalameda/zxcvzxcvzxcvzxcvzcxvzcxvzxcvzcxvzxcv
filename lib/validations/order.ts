import { z } from "zod";

const PHONE_REGEX = /^0\d{9,10}$/;

const productSizeSchema = z.enum(["S", "M", "L", "XL", "XXL"]);

export const guestOrderItemSchema = z.object({
  key: z.string().min(1),
  productId: z.number().int().positive(),
  href: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  sub: z.string().min(1).optional(),
  price: z.number().int().min(0).optional(),
  qty: z.number().int().min(1).max(10),
  tag: z.string().optional(),
  bgClass: z.string().min(1).optional(),
  colorName: z.string().min(1).optional(),
  size: productSizeSchema.optional(),
});

export const guestOrderSchema = z.object({
  customer: z.object({
    name: z.string().trim().min(1, "Vui long nhap ho ten"),
    phone: z
      .string()
      .trim()
      .regex(PHONE_REGEX, "So dien thoai khong hop le"),
    email: z.string().trim().email().or(z.literal("")).optional().default(""),
    province: z.string().trim().min(1, "Vui long chon tinh/thanh pho"),
    district: z.string().trim().optional().default(""),
    ward: z.string().trim().optional().default(""),
    address: z.string().trim().min(1, "Vui long nhap dia chi"),
    note: z.string().trim().optional().default(""),
  }),
  items: z.array(guestOrderItemSchema).min(1, "Don hang phai co it nhat mot san pham"),
  paymentMethod: z.enum(["cod", "qr"]),
  voucherCode: z.string().trim().optional().nullable(),
});

export const checkoutAddressNormalizationSchema = z.object({
  customer: z.object({
    province: z.string().trim().min(1, "Vui long chon tinh/thanh pho"),
    district: z.string().trim().optional().default(""),
    ward: z.string().trim().optional().default(""),
    address: z.string().trim().min(1, "Vui long nhap dia chi"),
  }),
  itemCount: z.coerce.number().int().min(1).max(100).optional().default(1),
  value: z.coerce.number().min(0).optional().default(0),
});

export const trackOrderLookupSchema = z.object({
  orderNumber: z
    .string()
    .trim()
    .min(6, "Vui long nhap ma don hang")
    .max(32, "Ma don hang qua dai")
    .transform((value) => value.toUpperCase()),
  phone: z
    .string()
    .trim()
    .regex(PHONE_REGEX, "So dien thoai khong hop le"),
});

export type GuestOrderPayload = z.infer<typeof guestOrderSchema>;
export type GuestOrderItemPayload = z.infer<typeof guestOrderItemSchema>;
export type CheckoutAddressNormalizationPayload = z.infer<
  typeof checkoutAddressNormalizationSchema
>;
export type TrackOrderLookupPayload = z.infer<typeof trackOrderLookupSchema>;
