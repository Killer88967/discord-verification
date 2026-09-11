import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Discord Verification",
    template: "%s | Discord Verification",
  },
  description:
    "Self-hosted Discord verification, security, and linked-account detection.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col bg-zinc-950 text-white">
        {children}
      </body>
    </html>
  );
}
