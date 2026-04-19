import type { Metadata } from "next";
import { Lexend } from "next/font/google";
import "./globals.css";

const lexend = Lexend({
  subsets: ["latin"],
  variable: "--font-lexend",
  display: "swap",
});

export const metadata: Metadata = {
  title: "GTU Tenis — Kort Rezervasyon",
  description: "GTU Tenis Topluluğu kort rezervasyon sistemi",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className={`${lexend.variable} font-lexend antialiased bg-background text-text-primary`}>
        {children}
      </body>
    </html>
  );
}
