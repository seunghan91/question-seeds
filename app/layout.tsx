import type { Metadata, Viewport } from "next";
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
  metadataBase: new URL("https://question-seeds.vercel.app"),
  title: "질문씨앗 · Question Seeds",
  description:
    "질문을 Bloom 분류 Level 1–5로 평가하고 한 단계 깊은 질문으로 코칭하는 한국어 질문 코치. Inspired by Stanford SMILE.",
  openGraph: {
    title: "질문씨앗 · Question Seeds",
    description:
      "질문 하나가 생각의 깊이를 바꿉니다 — Bloom Level 1~5 평가 + 한국어 질문 코칭",
    url: "/",
    siteName: "질문씨앗",
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "질문씨앗 · Question Seeds",
    description:
      "질문 하나가 생각의 깊이를 바꿉니다 — Bloom Level 1~5 평가 + 한국어 질문 코칭",
  },
  appleWebApp: {
    capable: true,
    title: "질문씨앗",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#f7f6f2",
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
