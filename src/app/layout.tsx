import type { Metadata, Viewport } from "next";
import "./globals.css";
import Navbar from "@/components/ui/Navbar";

export const metadata: Metadata = {
  title: {
    default: "Зиратстан — Цифровая Память Казахстана",
    template: "%s | Зиратстан",
  },
  description:
    "Платформа для поиска, оцифровки и сохранения памяти о захоронениях в Казахстане. Скан QR-кода на надгробии открывает полную биографию человека.",
  keywords: ["захоронения Казахстан", "поиск могил", "оцифровка", "мемориал", "зиратстан", "кладбище", "QR-код надгробие"],
  authors: [{ name: "Ziratstan" }],
  openGraph: {
    title: "Зиратстан — Цифровая Память Казахстана",
    description: "Наведите камеру на QR-код на надгробии и откройте полную биографию человека.",
    type: "website",
    locale: "ru_RU",
    siteName: "Зиратстан",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Зиратстан",
  },
};

export const viewport: Viewport = {
  themeColor: "#2d3748",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className="antialiased">
        <Navbar />
        <div style={{ paddingTop: "64px" }}>
          {children}
        </div>
      </body>
    </html>
  );
}

