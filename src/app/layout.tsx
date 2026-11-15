import type { Metadata, Viewport } from "next";
import { Lexend } from "next/font/google";
import "./globals.css";

const lexend = Lexend({
  variable: "--font-lexend",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Agriloss.Connect — Petani Berdaya, UMKM Berkembang",
    template: "%s | Agriloss.Connect",
  },
  description:
    "Platform kolaborasi yang menghubungkan petani dan UMKM untuk memanfaatkan hasil panen buah lokal dan mengurangi food loss.",
};

export const viewport: Viewport = {
  themeColor: "#1f6f2a",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className={`${lexend.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  );
}
