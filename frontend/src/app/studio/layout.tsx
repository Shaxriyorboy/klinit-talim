import { Inter } from "next/font/google";
import "../globals.css";

// Video render studiyasi: header/footersiz, 1920x1080 sahna (faqat lokal render uchun).
const inter = Inter({ subsets: ["latin", "latin-ext", "cyrillic"], variable: "--font-inter", display: "block" });

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz" className={inter.variable}>
      <body style={{ margin: 0, background: "#000" }}>
        {/* dev overlay va insight belgilari kadrga tushmasin */}
        <style>{"nextjs-portal{display:none!important}"}</style>
        {children}
      </body>
    </html>
  );
}
