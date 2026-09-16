import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OUTOUF — Find your next piece",
  description: "A fashion and lifestyle marketplace with USDC payments and affiliate rewards.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
