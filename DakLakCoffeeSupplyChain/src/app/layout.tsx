'use client';
import "@/styles/globals.css";
import Script from "next/script";
import { Toaster } from "sonner";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { I18nProvider } from "@/components/providers/I18nProvider";
import ClientLayout from "@/components/layout/ClientLayout";
import { useEffect } from "react";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // ✅ FIX: Force remove pointer-events: none từ body
  useEffect(() => {
    const observer = new MutationObserver(() => {
      if (document.body.style.pointerEvents === 'none') {
        console.warn('[Layout] Detected pointer-events: none on body, forcing auto');
        document.body.style.pointerEvents = 'auto';
      }
    });

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['style']
    });

    // Initial check
    if (document.body.style.pointerEvents === 'none') {
      document.body.style.pointerEvents = 'auto';
    }

    return () => observer.disconnect();
  }, []);

  return (
    <html lang="vi" className="scroll-smooth">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="description" content="DakLak Coffee Supply Chain Platform" />
        <link rel="icon" href="/logo.jpg" type="image/jpeg" />
        <Script src="https://cdn.lordicon.com/lordicon.js" strategy="afterInteractive" />
      </head>
      <body className="bg-white text-black">
        <I18nProvider>
          <AuthProvider>
            <ClientLayout>
              {children}
              <Toaster richColors />
            </ClientLayout>
          </AuthProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
