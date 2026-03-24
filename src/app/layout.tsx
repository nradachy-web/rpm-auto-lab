import type { Metadata } from "next";
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} antialiased`}>
      <body className="min-h-screen bg-rpm-black text-rpm-light">
        {children}
      </body>
    </html>
  );
}
