import type { Metadata } from "next";
import { Sora } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/lib/session";

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap"
});

export const metadata: Metadata = {
  title: "Revision Dashboard",
  description: "Revision planner for placements and any subject."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={sora.variable}>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}

