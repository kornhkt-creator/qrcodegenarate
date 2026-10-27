import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "QR Code Studio — สร้าง QR Code ฟรี",
  description: "สร้าง QR Code ปรับสี ขนาด ใส่โลโก้ และดาวน์โหลด PNG หรือ SVG ได้ฟรี",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="th"><body>{children}</body></html>;
}
