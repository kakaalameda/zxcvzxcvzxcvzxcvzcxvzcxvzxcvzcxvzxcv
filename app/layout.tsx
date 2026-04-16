import type { Metadata } from "next";
import { Barlow, Barlow_Condensed, Bebas_Neue, Noto_Serif } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const bebasNeue = Bebas_Neue({
  weight: "400",
  variable: "--font-bebas",
  subsets: ["latin", "latin-ext"],
});

const barlowCondensed = Barlow_Condensed({
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-barlow-condensed",
  subsets: ["latin", "latin-ext", "vietnamese"],
});

const barlow = Barlow({
  weight: ["300", "400", "500"],
  variable: "--font-barlow",
  subsets: ["latin", "latin-ext", "vietnamese"],
});

const notoSerif = Noto_Serif({
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-noto-serif",
  subsets: ["latin", "latin-ext", "vietnamese"],
});

export const metadata: Metadata = {
  title: "Nghe Hustle",
  description: "Streetwear dành cho nhịp sống đô thị, thiết kế và hoàn thiện tại Việt Nam.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className="dark">
      <body
        className={`${bebasNeue.variable} ${barlowCondensed.variable} ${barlow.variable} ${notoSerif.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
