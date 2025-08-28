import "@/styles/globals.css";
import Script from "next/script";
import { Toaster } from "sonner";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { I18nProvider } from "@/components/providers/I18nProvider";
import ClientLayout from "@/components/layout/ClientLayout";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
