import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { LocaleProvider } from "@/lib/i18n";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "질문씨앗 · Question Seeds",
  description:
    "질문을 Bloom 분류 Level 1–5로 평가하고 한 단계 깊은 질문으로 코칭하는 한국어 질문 코치. Inspired by Stanford SMILE.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#f7f6f2] text-[#1d2024]">
        <LocaleProvider>{children}</LocaleProvider>
      </body>
    </html>
  );
}
