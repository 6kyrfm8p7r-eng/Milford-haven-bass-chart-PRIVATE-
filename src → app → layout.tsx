import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Milford Haven Bass Chart",
    template: "%s | Milford Haven Bass Chart",
  },
  description:
    "Private bass fishing intelligence and prediction chart for the Pembrokeshire coast.",
  applicationName: "Milford Haven Bass Chart",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#07131c",
};

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en-GB">
      <body>{children}</body>
    </html>
  );
}
