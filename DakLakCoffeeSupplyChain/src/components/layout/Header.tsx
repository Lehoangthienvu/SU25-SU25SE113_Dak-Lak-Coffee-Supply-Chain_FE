"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { User, Menu, X } from "lucide-react";
import { useRouter } from "next/navigation";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { authService } from "@/lib/auth/authService";

export default function Header() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const user = authService.getUser();
    if (user) {
      setUserRole(user.role);
    }
  }, []);

  const handleGoToDashboard = () => {
    const dashboardPath = userRole ? `/dashboard/${userRole}` : "/dashboard";
    router.push(dashboardPath);
  };

  useEffect(() => {
    const user = authService.getUser();
    if (user) {
      setIsLoggedIn(true);
      setUserName(user.name);
    }
  }, []);

  return (
    <header className="bg-white/95 backdrop-blur-sm shadow-lg sticky top-0 z-50 border-b border-orange-100">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3 hover:scale-105 transition-transform duration-200">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg flex items-center justify-center shadow-md">
                <Image src="/logo_bg.png" alt="Logo" width={28} height={28} className="w-7 h-7" priority />
              </div>
              <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                DakLak SupplyChain
              </h1>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <Link href="/" className="text-gray-700 hover:text-orange-600 transition-colors duration-200 px-3 py-2 rounded-lg hover:bg-orange-50">
              Trang chủ
            </Link>
            <Link
              href="/marketplace"
              className="text-gray-700 hover:text-orange-600 transition-colors duration-200 px-3 py-2 rounded-lg hover:bg-orange-50"
            >
              Sàn thu mua cà phê           </Link>

            {isLoggedIn && userName ? (
              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                  <button className="flex items-center gap-2 text-gray-700 hover:text-orange-600 transition-colors duration-200 px-3 py-2 rounded-lg hover:bg-orange-50">
                    <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-amber-500 rounded-full flex items-center justify-center text-white">
                      <User className="w-4 h-4" />
                    </div>
                    <span className="font-semibold">{userName}</span>
                  </button>
                </DropdownMenu.Trigger>

                <DropdownMenu.Portal>
                  <DropdownMenu.Content
                    className="min-w-[200px] bg-white rounded-lg shadow-lg border border-orange-100 p-2 text-sm z-[100]"
                    sideOffset={8}
                  >
                    <DropdownMenu.Item
                      className="px-3 py-2 hover:bg-orange-50 rounded-lg cursor-pointer transition-colors duration-200"
                      onClick={() => router.push("/dashboard/profile")}
                    >
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-orange-600" />
                        Hồ sơ cá nhân
                      </div>
                    </DropdownMenu.Item>
                    <DropdownMenu.Item
                      className="px-3 py-2 hover:bg-orange-50 rounded-lg cursor-pointer transition-colors duration-200"
                      onClick={handleGoToDashboard}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-orange-600 rounded text-white flex items-center justify-center text-xs">⌘</div>
                        Tổng quan
                      </div>
                    </DropdownMenu.Item>

                    <DropdownMenu.Separator className="h-px bg-orange-100 my-2" />
                    <DropdownMenu.Item
                      className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg cursor-pointer transition-colors duration-200"
                      onClick={() => {
                        authService.logout();
                      }}
                    >
                      Đăng xuất
                    </DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/auth/login"
                  className="text-gray-700 hover:text-orange-600 transition-colors duration-200 px-3 py-2 rounded-lg hover:bg-orange-50"
                >
                  Đăng nhập
                </Link>
                <Link
                  href="/auth/register"
                  className="bg-gradient-to-r from-orange-600 to-amber-600 text-white px-4 py-2 rounded-lg hover:shadow-md transition-all duration-200 font-medium"
                >
                  Đăng ký
                </Link>
              </div>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-gray-700 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors duration-200"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-4 py-4 border-t border-orange-100">
            <nav className="flex flex-col gap-2">
              <Link
                href="/"
                className="text-gray-700 hover:text-orange-600 transition-colors duration-200 px-3 py-2 rounded-lg hover:bg-orange-50"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Trang chủ
              </Link>
              <Link
                href="/marketplace"
                className="text-gray-700 hover:text-orange-600 transition-colors duration-200 px-3 py-2 rounded-lg hover:bg-orange-50"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Sàn giao dịch
              </Link>

              {isLoggedIn && userName ? (
                <>
                  <div className="border-t border-orange-100 my-2"></div>
                  <div className="px-3 py-2 text-sm text-gray-600">
                    Xin chào, <span className="font-semibold text-orange-600">{userName}</span>
                  </div>
                  <Link
                    href="/dashboard/profile"
                    className="text-gray-700 hover:text-orange-600 transition-colors duration-200 px-3 py-2 rounded-lg hover:bg-orange-50"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Hồ sơ cá nhân
                  </Link>
                  <button
                    onClick={() => {
                      handleGoToDashboard();
                      setIsMobileMenuOpen(false);
                    }}
                    className="text-left text-gray-700 hover:text-orange-600 transition-colors duration-200 px-3 py-2 rounded-lg hover:bg-orange-50"
                  >
                    Tổng quan
                  </button>
                  <button
                    onClick={() => {
                      authService.logout();
                    }}
                    className="text-left text-red-600 hover:bg-red-50 transition-colors duration-200 px-3 py-2 rounded-lg"
                  >
                    Đăng xuất
                  </button>
                </>
              ) : (
                <>
                  <div className="border-t border-orange-100 my-2"></div>
                  <Link
                    href="/auth/login"
                    className="text-gray-700 hover:text-orange-600 transition-colors duration-200 px-3 py-2 rounded-lg hover:bg-orange-50"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Đăng nhập
                  </Link>
                  <Link
                    href="/auth/register"
                    className="bg-gradient-to-r from-orange-600 to-amber-600 text-white px-3 py-2 rounded-lg hover:shadow-md transition-all duration-200 font-medium text-center"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Đăng ký
                  </Link>
                </>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
