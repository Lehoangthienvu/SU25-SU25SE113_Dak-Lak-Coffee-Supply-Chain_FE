"use client";

import "@/styles/globals.css";
import { usePathname } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Script from "next/script";
import { Toaster } from "sonner";
import { AuthProvider } from "@/components/providers/AuthProvider";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const showHeaderFooter =
    pathname === "/" ||
    pathname.startsWith("/marketplace") ||
    pathname.startsWith("/markplace");

  return (
    <html lang="vi" className="scroll-smooth">
      <meta charSet="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="description" content="DakLak Coffee Supply Chain Platform" />
      <head>
        <Script src="https://cdn.lordicon.com/lordicon.js" strategy="afterInteractive" />
      </head>
      <body className="bg-white text-black">
        <AuthProvider>
          {showHeaderFooter && <Header />}
          <main className="min-h-screen">
            {children}
            <Toaster richColors />
          </main>
          {showHeaderFooter && <Footer />}
        </AuthProvider>
      </body>
    </html>
  );
}
