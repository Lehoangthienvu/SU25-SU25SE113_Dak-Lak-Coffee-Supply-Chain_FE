import Home from "@/pages/Home/Home";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Home />
        {children}
      </body>
    </html>
  );
}