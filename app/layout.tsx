import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter, Noto_Serif_SC } from "next/font/google";
import "./globals.css";

const display = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const serifSC = Noto_Serif_SC({
  variable: "--font-display-sc",
  weight: ["400", "600", "700"],
  preload: false,
});

const sans = Inter({
  variable: "--font-ui",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "团队之诗",
  description: "四个人，一首诗。Claude 了解你们的团队，为你们和这次活动写一首中文诗。",
};

export const viewport: Viewport = {
  themeColor: "#0b0d17",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="zh-CN" className={`${display.variable} ${serifSC.variable} ${sans.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
