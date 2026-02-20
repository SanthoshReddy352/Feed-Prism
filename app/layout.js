import { Inter, JetBrains_Mono } from "next/font/google";
import ThemeProvider from "./components/ThemeProvider";
import CapacitorDeepLinkHandler from "./components/CapacitorDeepLinkHandler";
import AndroidBackButtonHandler from "./components/AndroidBackButtonHandler";
import ApkDownloadBanner from "./components/ApkDownloadBanner";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: "Feed Prism — Your Intelligent News Command Center",
  description:
    "Aggregate, filter, and monitor news from 500+ global sources in real time. Outbreak alerts, company intelligence, and smart categorization — all in one dashboard.",
  keywords: [
    "news aggregator",
    "RSS reader",
    "news dashboard",
    "real-time news",
    "company intelligence",
    "outbreak monitoring",
  ],
  openGraph: {
    title: "Feed Prism — Your Intelligent News Command Center",
    description:
      "Aggregate, filter, and monitor news from 500+ global sources in real time.",
    type: "website",
  },
  icons: {
    icon: "/Mobile Logo.svg",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <body className={`${inter.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
        <ThemeProvider>
          <CapacitorDeepLinkHandler />
          <AndroidBackButtonHandler />
          <ApkDownloadBanner />
          <div className="app-safe-area-shell">{children}</div>
        </ThemeProvider>
      </body>
    </html>
  );
}
