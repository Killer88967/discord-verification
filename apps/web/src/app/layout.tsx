import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "REPLACE",
  description: "REPLACE",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`font-mono h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
