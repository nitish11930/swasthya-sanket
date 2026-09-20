import type { Metadata, Viewport } from "next";
import "../styles/globals.css";

export const metadata: Metadata = {
  title: {
    default: "SWASTHYA-SANKET | PHC Resilience Engine",
    template: "%s | SWASTHYA-SANKET",
  },
  description:
    "PHC Resilience & Accountability Engine — predict medicine shortages, coordinate safe transfers, and maintain an immutable audit trail across India's Primary Health Centres.",
  applicationName: "Swasthya-Sanket",
  keywords: ["PHC", "medicine", "health", "stock", "India", "shortage", "forecast"],
  authors: [{ name: "Swasthya-Sanket Team" }],
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Swasthya-Sanket",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0D9488",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  );
}
