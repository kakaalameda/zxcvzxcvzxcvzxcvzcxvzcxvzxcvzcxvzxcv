import { getStoreVouchers } from "@/lib/repositories/storefront";
import { CartDrawer } from "@/components/cart-context";
import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";

export default async function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const vouchers = await getStoreVouchers();

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-16 md:pt-[112px]">{children}</main>
      <Footer />
      <CartDrawer vouchers={vouchers} />
    </>
  );
}
