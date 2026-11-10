import React from "react";
import type { Metadata, Viewport } from "next";
import { Archivo, Manrope } from "next/font/google";
import "./globals.css";
import { DEFAULT_DESCRIPTION, INDEXABLE, SITE_NAME, SITE_URL } from "@/libs/seo";

/** Display face: wide and heavy like the logotype. Body face: Manrope. */
const display = Archivo({ subsets: ["latin"], axes: ["wdth"], variable: "--font-archivo", display: "swap" });
const body = Manrope({ subsets: ["latin"], variable: "--font-manrope", display: "swap" });

/** Site-wide defaults; pages set their own title, description and canonical URL (libs/seo.ts). */
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Obere Transport | Intercity bus travel, car and bus hire in Nigeria", template: `%s | ${SITE_NAME}` },
  description: DEFAULT_DESCRIPTION,
  applicationName: SITE_NAME,
  alternates: { canonical: "/" },
  openGraph: { type: "website", siteName: SITE_NAME, locale: "en_NG", url: "/" },
  twitter: { card: "summary_large_image" },
  formatDetection: { telephone: false },
  // Only the production site is indexed (see INDEXABLE).
  robots: INDEXABLE ? { index: true, follow: true } : { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: "#172A6B" };

/**
 * Root shell only. Each area brings its own chrome:
 *  - app/(site)   public website and customer account (header, footer)
 *  - app/admin    admin dashboard
 */
const RootLayout = ({ children }: Readonly<{ children: React.ReactNode }>) => {
  return (
    <html lang="en-NG" className={`${display.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  );
};

export default RootLayout;
