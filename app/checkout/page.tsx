import { CheckoutPage } from "@/components/checkout-page";
import { getStoreVouchers } from "@/lib/repositories/storefront";

export default async function Page() {
  return <CheckoutPage vouchers={await getStoreVouchers()} />;
}
