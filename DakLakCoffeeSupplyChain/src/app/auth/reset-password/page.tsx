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
        <Suspense fallback={
            <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-100 flex items-center justify-center p-4">
                <div className="w-full max-w-md bg-white shadow-xl border-0 rounded-lg p-8">
                    <div className="text-center">
                        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-600">Đang tải...</p>
                    </div>
                </div>
            </div>
        }>
            <ResetPasswordForm />
        </Suspense>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ResetPasswordContent />
        </Suspense>
    );
}
