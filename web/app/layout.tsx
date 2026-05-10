import type { Metadata } from "next";
import { Instrument_Serif, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const serif = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "POSBridge — print Brother QL labels from a web app on macOS",
  description:
    "Tiny native macOS menubar helper that prints Brother QL labels with firmware-level template field-fill — and ESC/POS receipts on the side — straight from a hosted web app. No SDK, no Tauri, no Brother b-PAC.",
  metadataBase: new URL("https://posbridge.dev"),
  openGraph: {
    title: "POSBridge",
    description:
      "Print Brother QL labels from a web app on macOS — without b-PAC, Tauri, or a print server.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${serif.variable} ${mono.variable}`}>
      <body className="antialiased font-mono">{children}</body>
    </html>
  );
}
