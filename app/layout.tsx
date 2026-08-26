import type { Metadata, Viewport } from "next";

import { ThemeProvider } from "@/lib/theme";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "MotoLog",
    template: "%s | MotoLog",
  },
  description: "A focused fuel and ride log for every vehicle in your garage.",
  applicationName: "MotoLog",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icons/motolog-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/motolog-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/motolog-180.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#FF5502",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <meta name="apple-mobile-web-app-title" content="MotoLog" />
      </head>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
