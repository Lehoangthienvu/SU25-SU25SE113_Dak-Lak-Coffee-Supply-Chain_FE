"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Coffee, Loader2 } from "lucide-react";
import { authService } from "@/lib/auth/authService";

export default function DashboardRootPage() {
  const [redirecting, setRedirecting] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const user = authService.getUser();
    if (user) {
      router.push(`/dashboard/${user.role}`);
    } else {
      router.push("/");
    }

    setRedirecting(false);
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex items-center justify-center">
      <div className="max-w-md w-full mx-auto px-6">
        <div className="bg-white rounded-lg shadow-lg border border-orange-100 p-8 text-center">
          {/* Logo */}
          <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-amber-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-md">
            <Coffee className="w-8 h-8 text-white" />
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent mb-2">
            DakLak SupplyChain
          </h1>

          {/* Status */}
          {redirecting ? (
            <div className="flex items-center justify-center gap-3 text-gray-600">
              <Loader2 className="w-5 h-5 animate-spin text-orange-500" />
              <span className="text-sm">Đang chuyển hướng đến dashboard...</span>
            </div>
          ) : (
            <p className="text-sm text-gray-500">Hoàn tất chuyển hướng</p>
          )}

          {/* Loading bar */}
          <div className="mt-6 w-full bg-orange-100 rounded-full h-2 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
