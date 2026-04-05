import type { Metadata } from "next";
import { Barlow, Barlow_Condensed, Bebas_Neue } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";
import Navbar from "@/components/navbar";

const bebasNeue = Bebas_Neue({
  weight: "400",
  variable: "--font-bebas",
  subsets: ["latin"],
});

const barlowCondensed = Barlow_Condensed({
  weight: ["400", "600", "700"],
  variable: "--font-barlow-condensed",
  subsets: ["latin"],
});

const barlow = Barlow({
  weight: ["300", "400", "500"],
  variable: "--font-barlow",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Nghe Hustle",
  description: "Brand web cho Nghe Hustle, local streetwear brand từ Việt Nam.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className="dark">
      <body
        className={`${bebasNeue.variable} ${barlowCondensed.variable} ${barlow.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
