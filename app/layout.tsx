import React from "react";
import type { Metadata, Viewport } from "next";
import { Archivo, Manrope } from "next/font/google";
import "./globals.css";

/** Display face: wide and heavy like the logotype. Body face: Manrope. */
const display = Archivo({ subsets: ["latin"], axes: ["wdth"], variable: "--font-archivo", display: "swap" });
const body = Manrope({ subsets: ["latin"], variable: "--font-manrope", display: "swap" });

export const metadata: Metadata = {
  title: "Obere Transport | Intercity bus travel, car and bus hire",
  description: "Book a seat on Obere Transport's intercity routes across Nigeria, or hire a car or bus. Pay online and manage your booking anytime.",
};

export const viewport: Viewport = { themeColor: "#172A6B" };

/**
 * Root shell only. Each area brings its own chrome:
 *  - app/(site)   public website and customer account (header, footer)
 *  - app/admin    admin dashboard
 */
const RootLayout = ({ children }: Readonly<{ children: React.ReactNode }>) => {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  );
};

export default RootLayout;
