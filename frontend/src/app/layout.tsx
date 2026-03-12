import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AXON",
  description: "Self-evolving AI agent system",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
