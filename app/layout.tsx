import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "台灣版 PC 組裝空間模擬器 | PC Fit Checker",
  description: "Build before you build. 先檢查顯卡、塔散、水冷、機殼與走線空間，再決定怎麼裝。",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-Hant">
      <body className="min-h-screen bg-bg font-sans text-white">
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
