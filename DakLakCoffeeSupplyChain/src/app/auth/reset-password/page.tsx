"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, Eye, EyeOff, ArrowLeft, Loader2, CheckCircle, AlertCircle } from "lucide-react";

function ResetPasswordContent() {
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [validating, setValidating] = useState(true);
    const [tokenValid, setTokenValid] = useState(false);
    const [resetSuccess, setResetSuccess] = useState(false);
    
    const router = useRouter();
    const searchParams = useSearchParams();
    const userId = searchParams.get("userId");
    const token = searchParams.get("token");

    // Validate token khi component mount
    useEffect(() => {
        const validateToken = async () => {
            if (!userId || !token) {
                setTokenValid(false);
                setValidating(false);
                return;
            }

            try {
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/Auth/reset-password/userId=${userId}&token=${token}`,
                    { method: "GET" }
                );

                if (response.ok) {
                    setTokenValid(true);
                } else {
                    setTokenValid(false);
                }
            } catch (error) {
                setTokenValid(false);
            } finally {
                setValidating(false);
            }
        };

        validateToken();
    }, [userId, token]);

    const validatePassword = (password: string) => {
        const minLength = 8;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

        return {
            isValid: password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar,
            errors: {
                length: password.length < minLength,
                upperCase: !hasUpperCase,
                lowerCase: !hasLowerCase,
                numbers: !hasNumbers,
                specialChar: !hasSpecialChar
            }
        };
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (newPassword !== confirmPassword) {
            toast.error("❌ Mật khẩu xác nhận không khớp!");
            return;
        }

        const passwordValidation = validatePassword(newPassword);
        if (!passwordValidation.isValid) {
            toast.error("❌ Mật khẩu không đủ mạnh!");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/Auth/reset-password?userId=${userId}&token=${token}`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ newPassword }),
                }
            );

            const result = await response.json();
            console.log("Reset password response:", { status: response.status, result });

            if (response.ok && result.success) {
                setResetSuccess(true);
                toast.success("✅ Đặt lại mật khẩu thành công!");
            } else {
                const errorMessage = result.message || result.title || "Đặt lại mật khẩu thất bại";
                toast.error(`❌ ${errorMessage}`);
            }
        } catch (error) {
            toast.error("❌ Lỗi kết nối. Vui lòng thử lại.");
        } finally {
            setLoading(false);
        }
    };

    if (validating) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-100 flex items-center justify-center p-4">
                <Card className="w-full max-w-md bg-white shadow-xl border-0">
                    <CardContent className="flex items-center justify-center py-12">
                        <div className="text-center">
                            <Loader2 className="w-8 h-8 animate-spin text-orange-500 mx-auto mb-4" />
                            <p className="text-gray-600">Đang xác thực link...</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!tokenValid) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-100 flex items-center justify-center p-4">
                <Card className="w-full max-w-md bg-white shadow-xl border-0">
                    <CardHeader className="text-center pb-4">
                        <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                            <AlertCircle className="w-8 h-8 text-red-600" />
                        </div>
                        <CardTitle className="text-2xl font-bold text-gray-800">
                            Link không hợp lệ
                        </CardTitle>
                        <p className="text-gray-600 mt-2">
                            Link đặt lại mật khẩu đã hết hạn hoặc không hợp lệ
                        </p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <h4 className="font-semibold text-red-800 mb-2">🔒 Lý do có thể:</h4>
                            <ul className="text-sm text-red-700 space-y-1">
                                <li>• Link đã hết hạn (30 phút)</li>
                                <li>• Link đã được sử dụng</li>
                                <li>• Link không đúng định dạng</li>
                            </ul>
                        </div>
                        
                        <Button
                            onClick={() => router.push("/auth/forgot-password")}
                            className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
                        >
                            Yêu cầu link mới
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (resetSuccess) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-100 flex items-center justify-center p-4">
                <Card className="w-full max-w-md bg-white shadow-xl border-0">
                    <CardHeader className="text-center pb-4">
                        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                        <CardTitle className="text-2xl font-bold text-gray-800">
                            Đặt lại mật khẩu thành công!
                        </CardTitle>
                        <p className="text-gray-600 mt-2">
                            Mật khẩu của bạn đã được thay đổi thành công
                        </p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <h4 className="font-semibold text-green-800 mb-2">✅ Hoàn tất:</h4>
                            <ul className="text-sm text-green-700 space-y-1">
                                <li>• Mật khẩu đã được cập nhật</li>
                                <li>• Bạn có thể đăng nhập ngay bây giờ</li>
                                <li>• Link reset đã được vô hiệu hóa</li>
                            </ul>
                        </div>
                        
                        <Button
                            onClick={() => router.push("/auth/login")}
                            className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
                        >
                            Đăng nhập ngay
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const passwordValidation = validatePassword(newPassword);

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-100 flex items-center justify-center p-4">
            <Card className="w-full max-w-md bg-white shadow-xl border-0">
                <CardHeader className="text-center pb-4">
                    <div className="flex items-center justify-center mb-4">
                        <Image
                            src="/images/Coffee.png"
                            alt="DakLak Coffee"
                            width={60}
                            height={60}
                            className="rounded-lg"
                        />
                    </div>
                    <CardTitle className="text-2xl font-bold text-gray-800">
                        Đặt lại mật khẩu
                    </CardTitle>
                    <p className="text-gray-600 mt-2">
                        Nhập mật khẩu mới cho tài khoản của bạn
                    </p>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="newPassword" className="text-sm font-semibold text-gray-700">
                                Mật khẩu mới
                            </Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <Input
                                    id="newPassword"
                                    type={showPassword ? "text" : "password"}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Nhập mật khẩu mới"
                                    className="pl-10 pr-10 h-11 border-2 border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword" className="text-sm font-semibold text-gray-700">
                                Xác nhận mật khẩu
                            </Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <Input
                                    id="confirmPassword"
                                    type={showConfirmPassword ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Nhập lại mật khẩu mới"
                                    className="pl-10 pr-10 h-11 border-2 border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {/* Password validation */}
                        {newPassword && (
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                                <h4 className="text-sm font-semibold text-gray-700 mb-2">Yêu cầu mật khẩu:</h4>
                                <ul className="text-xs space-y-1">
                                    <li className={`flex items-center ${passwordValidation.errors.length ? 'text-red-600' : 'text-green-600'}`}>
                                        {passwordValidation.errors.length ? '❌' : '✅'} Ít nhất 8 ký tự
                                    </li>
                                    <li className={`flex items-center ${passwordValidation.errors.upperCase ? 'text-red-600' : 'text-green-600'}`}>
                                        {passwordValidation.errors.upperCase ? '❌' : '✅'} Có chữ hoa
                                    </li>
                                    <li className={`flex items-center ${passwordValidation.errors.lowerCase ? 'text-red-600' : 'text-green-600'}`}>
                                        {passwordValidation.errors.lowerCase ? '❌' : '✅'} Có chữ thường
                                    </li>
                                    <li className={`flex items-center ${passwordValidation.errors.numbers ? 'text-red-600' : 'text-green-600'}`}>
                                        {passwordValidation.errors.numbers ? '❌' : '✅'} Có số
                                    </li>
                                    <li className={`flex items-center ${passwordValidation.errors.specialChar ? 'text-red-600' : 'text-green-600'}`}>
                                        {passwordValidation.errors.specialChar ? '❌' : '✅'} Có ký tự đặc biệt
                                    </li>
                                </ul>
                            </div>
                        )}

                        {/* Password match validation */}
                        {confirmPassword && newPassword !== confirmPassword && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                <p className="text-sm text-red-600">❌ Mật khẩu xác nhận không khớp</p>
                            </div>
                        )}

                        <Button
                            type="submit"
                            disabled={loading || !newPassword || !confirmPassword || newPassword !== confirmPassword || !passwordValidation.isValid}
                            className="w-full h-11 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Đang xử lý...
                                </>
                            ) : (
                                'Đặt lại mật khẩu'
                            )}
                        </Button>
                    </form>

                    <div className="mt-6 text-center">
                        <Link
                            href="/auth/login"
                            className="inline-flex items-center text-sm text-orange-600 hover:text-orange-700 font-medium hover:underline transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4 mr-1" />
                            Quay lại đăng nhập
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ResetPasswordContent />
        </Suspense>
    );
}
