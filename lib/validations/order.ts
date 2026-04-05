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
    name: z.string().trim().min(1, "Vui lòng nhập họ tên"),
    phone: z
      .string()
      .trim()
      .regex(PHONE_REGEX, "Số điện thoại không hợp lệ"),
    email: z.string().trim().email().or(z.literal("")).optional().default(""),
    province: z.string().trim().min(1, "Vui lòng chọn tỉnh/thành phố"),
    district: z.string().trim().optional().default(""),
    ward: z.string().trim().optional().default(""),
    address: z.string().trim().min(1, "Vui lòng nhập địa chỉ"),
    note: z.string().trim().optional().default(""),
  }),
  items: z.array(guestOrderItemSchema).min(1, "Đơn hàng phải có ít nhất một sản phẩm"),
  paymentMethod: z.enum(["cod", "qr"]),
  voucherCode: z.string().trim().optional().nullable(),
});

export const trackOrderLookupSchema = z.object({
  phone: z
    .string()
    .trim()
    .regex(PHONE_REGEX, "Số điện thoại không hợp lệ"),
});

export type GuestOrderPayload = z.infer<typeof guestOrderSchema>;
export type GuestOrderItemPayload = z.infer<typeof guestOrderItemSchema>;
export type TrackOrderLookupPayload = z.infer<typeof trackOrderLookupSchema>;
