"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { login } from "@/lib/api/auth";
import { authService } from "@/lib/auth/authService";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { roleSlugMap } from "@/lib/constants/role";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const decoded = await login(email, password);

            console.log("Login successful:", decoded);
            const roleSlug = roleSlugMap[decoded.role] ?? "dashboard";
            router.push(`/dashboard/${roleSlug}`);

        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Đăng nhập thất bại';
            alert("❌ Đăng nhập thất bại: " + errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex">
            {/* Left Side - Hero Section */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
                {/* Background Gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-orange-600 via-amber-600 to-yellow-600"></div>

                {/* Content */}
                <div className="relative z-10 flex flex-col justify-center items-center text-white p-12 text-center w-full">
                    {/* Logo */}
                    <div className="w-48 h-48 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mb-10 shadow-2xl overflow-hidden">
                        <Image
                            src="/logo.jpg"
                            alt="DakLak SupplyChain Logo"
                            width={120}
                            height={120}
                            className="rounded-full object-cover"
                        />
                    </div>

                    <h1 className="text-5xl font-bold mb-6">
                        DakLak SupplyChain
                    </h1>
                    <p className="text-xl text-orange-100 mb-10 max-w-md leading-relaxed">
                        Nền tảng chuỗi cung ứng cà phê Đắk Lắk hiện đại và thông minh
                    </p>

                    {/* Feature Points */}
                    <div className="space-y-4 text-sm text-orange-100">
                        <div className="flex items-center gap-3">
                            <div className="w-3 h-3 bg-green-400 rounded-full shadow-lg"></div>
                            <span className="font-medium">Kết nối nông dân</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-3 h-3 bg-blue-400 rounded-full shadow-lg"></div>
                            <span className="font-medium">Quản lý hiệu quả</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-3 h-3 bg-purple-400 rounded-full shadow-lg"></div>
                            <span className="font-medium">Minh bạch chuỗi cung ứng</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
                <div className="w-full max-w-md">
                    {/* Login Card */}
                    <Card className="border-orange-100 shadow-xl bg-white/95 backdrop-blur-sm">
                        <CardHeader className="text-center pb-4">
                            <CardTitle className="text-2xl font-bold text-gray-800">
                                Đăng nhập
                            </CardTitle>
                            <p className="text-gray-600 text-sm mt-2">
                                Chào mừng trở lại! Vui lòng đăng nhập vào tài khoản của bạn.
                            </p>
                        </CardHeader>

                        <CardContent>
                            <form className="space-y-6" onSubmit={handleSubmit}>
                                {/* Email Field */}
                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                                        Email
                                    </Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <Input
                                            id="email"
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            className="pl-10 border-gray-200 focus:border-orange-500 focus:ring-orange-500"
                                            placeholder="Nhập email của bạn"
                                        />
                                    </div>
                                </div>

                                {/* Password Field */}
                                <div className="space-y-2">
                                    <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                                        Mật khẩu
                                    </Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <Input
                                            id="password"
                                            type={showPassword ? "text" : "password"}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            className="pl-10 pr-10 border-gray-200 focus:border-orange-500 focus:ring-orange-500"
                                            placeholder="Nhập mật khẩu"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                        >
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                {/* Forgot Password */}
                                <div className="text-right">
                                    <Link
                                        href="/auth/forgot_password"
                                        className="text-sm text-orange-600 hover:text-orange-700 font-medium hover:underline transition-colors"
                                    >
                                        Quên mật khẩu?
                                    </Link>
                                </div>

                                {/* Login Button */}
                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full h-11 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Đang xử lý...
                                        </>
                                    ) : (
                                        'Đăng nhập'
                                    )}
                                </Button>
                            </form>

                            {/* Divider */}
                            <div className="flex items-center justify-center my-6">
                                <div className="border-t border-gray-300 w-full" />
                                <span className="mx-4 text-sm text-gray-400 bg-white px-2">hoặc</span>
                                <div className="border-t border-gray-300 w-full" />
                            </div>

                            {/* Google Login */}
                            <Button
                                variant="outline"
                                className="w-full h-11 border-gray-300 hover:bg-gray-50 hover:border-orange-300 transition-colors"
                                type="button"
                            >
                                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                Đăng nhập với Google
                            </Button>

                            {/* Register Link */}
                            <div className="mt-6 text-center">
                                <span className="text-sm text-gray-600">Chưa có tài khoản? </span>
                                <Link
                                    href="/auth/register"
                                    className="text-sm font-semibold text-orange-600 hover:text-orange-700 hover:underline transition-colors"
                                >
                                    Đăng ký ngay
                                </Link>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Footer */}
                    <div className="mt-8 text-center text-xs text-gray-500">
                        <p>© 2025 DakLak SupplyChain Platform. All rights reserved.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
