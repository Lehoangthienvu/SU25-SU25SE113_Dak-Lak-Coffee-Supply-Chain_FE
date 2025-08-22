import "@/styles/globals.css";
import Script from "next/script";
import { Toaster } from "sonner";
import { AuthProvider } from "@/components/providers/AuthProvider";
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
        <Script src="https://cdn.lordicon.com/lordicon.js" strategy="afterInteractive" />
      </head>
      <body className="bg-white text-black">
        <AuthProvider>
          <ClientLayout>
            {children}
            <Toaster richColors />
          </ClientLayout>
        </AuthProvider>
      </body>
    </html>
  );
}
