import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "POSBridge — print receipts and Brother QL labels from a web app on macOS",
  description:
    "A tiny native macOS menubar helper that exposes ESC/POS receipt printers and Brother QL label printers to a hosted web app over localhost HTTP. No SDK, no Tauri, no Brother b-PAC.",
  metadataBase: new URL("https://posbridge.dev"),
  openGraph: {
    title: "POSBridge",
    description:
      "Print receipts and Brother QL labels from a web app on macOS — without b-PAC, Tauri, or a print server.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased font-mono">{children}</body>
    </html>
  );
}
