import type { Metadata } from "next";
import { Lexend } from "next/font/google";
import { ThemeProvider } from "@/lib/theme";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const lexend = Lexend({
  subsets: ["latin"],
  variable: "--font-lexend",
  display: "swap",
});

export const metadata: Metadata = {
  title: "GTU Tenis — Kort Rezervasyon",
  description: "GTU Tenis Topluluğu kort rezervasyon sistemi",
  icons: { icon: "/favicon.png" },
  verification: { google: "WC_Ujp2AemlDWkybGKC_qlPvU3kv8aNEMd-vgrKPd88" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className={`${lexend.variable} font-lexend antialiased bg-background text-text-primary`}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
