import {
  type Product,
  type Voucher,
} from "@/lib/store";
import {
  getFeaturedProducts,
  getProductById,
  getProducts,
  getRelatedProducts,
} from "@/lib/data/products.server";
import {
  getVoucherByCode,
  getVouchers,
} from "@/lib/data/vouchers.server";

export async function getStoreProducts(): Promise<Product[]> {
  return getProducts();
}

export async function getStoreFeaturedProducts(limit = 4): Promise<Product[]> {
  return getFeaturedProducts(limit);
}

export async function getStoreProductById(id: string): Promise<Product | undefined> {
  return getProductById(id);
}

export async function getStoreRelatedProducts(
  productId: number,
  limit = 4,
): Promise<Product[]> {
  return getRelatedProducts(productId, limit);
}

export async function getStoreVouchers(): Promise<Voucher[]> {
  return getVouchers();
}

export async function getStoreVoucherByCode(code: string): Promise<Voucher | null> {
  return getVoucherByCode(code);
}
