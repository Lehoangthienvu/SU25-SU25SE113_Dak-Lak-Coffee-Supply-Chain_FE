"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

interface ClientLayoutProps {
    children: ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
    const pathname = usePathname();

    const showHeaderFooter =
        pathname === "/" ||
        pathname.startsWith("/marketplace") ||
        pathname.startsWith("/markplace");

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
            {showHeaderFooter && <Header />}
            <main className="min-h-screen">
                {children}
            </main>
            {showHeaderFooter && <Footer />}
        </div>
    );
}
