import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "RPM Auto Lab | Revive • Protect • Maintain",
    template: "%s | RPM Auto Lab",
  },
  description:
    "Oakland County's premier auto detailing, ceramic coating, paint protection film, window tint, and vehicle wrap specialists. Serving Lake Orion, Rochester Hills, Auburn Hills and beyond.",
  keywords: [
    "ceramic coating",
    "paint protection film",
    "PPF",
    "window tint",
    "vehicle wraps",
    "paint correction",
    "auto detailing",
    "Lake Orion",
    "Rochester Hills",
    "Oakland County",
    "Michigan",
  ],
  icons: {
    icon: [
      { url: "/rpm-auto-lab/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/rpm-auto-lab/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: "/rpm-auto-lab/apple-touch-icon.png",
  },
  manifest: "/rpm-auto-lab/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "RPM Auto Lab" },
  openGraph: {
    title: "RPM Auto Lab | Revive • Protect • Maintain",
    description:
      "Premium automotive protection and detailing in Orion Township, MI.",
    url: "https://rpmautolab.com",
    siteName: "RPM Auto Lab",
    locale: "en_US",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#dc2626",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} antialiased overflow-x-hidden`}>
      <body className="min-h-screen bg-rpm-black text-rpm-light overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
