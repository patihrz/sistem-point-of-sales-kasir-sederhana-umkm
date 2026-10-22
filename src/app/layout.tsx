import type { Metadata } from "next";
import { Lato } from "next/font/google";
import "./globals.css";

const lato = Lato({
  variable: "--font-lato",
  subsets: ["latin"],
  weight: ["300", "400", "700", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "KasirKITA - Point of Sale Modern untuk UMKM",
  description: "Aplikasi kasir berbasis web yang cepat, responsif, dan mudah digunakan untuk UMKM Indonesia.",
  icons: {
    icon: [
      { url: "/KasirKITA.png" },
      { url: "/kaskita.png" },
    ],
    shortcut: "/KasirKITA.png",
    apple: "/KasirKITA.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${lato.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-slate-100 text-slate-900 font-[family-name:var(--font-lato)]">
        {children}
      </body>
    </html>
  );
}
