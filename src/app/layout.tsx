import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { StaffProvider } from "./context/StaffContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ラーメン大吉・オムランカ シフト管理",
  description: "ラーメン大吉・オムランカのシフト管理システム",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <StaffProvider>
          {children}
        </StaffProvider>
      </body>
    </html>
  );
}
