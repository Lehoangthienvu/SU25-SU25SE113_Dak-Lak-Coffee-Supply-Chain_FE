"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, ArrowLeft, Loader2, CheckCircle } from "lucide-react";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Auth/forgot-password`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email }),
            });

            const result = await response.json();
            console.log("Forgot password response:", { status: response.status, result });

            if (response.ok && result.success) {
                setEmailSent(true);
                toast.success("✅ Email đặt lại mật khẩu đã được gửi!");
            } else {
                const errorMessage = result.message || result.title || "Gửi email thất bại";
                toast.error(`❌ ${errorMessage}`);
            }
        } catch (error) {
            console.error("Forgot password error:", error);
            toast.error("❌ Lỗi kết nối. Vui lòng thử lại.");
        } finally {
            setLoading(false);
        }
    };

    if (emailSent) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-100 flex items-center justify-center p-4">
                <Card className="w-full max-w-md bg-white shadow-xl border-0">
                    <CardHeader className="text-center pb-4">
                        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                        <CardTitle className="text-2xl font-bold text-gray-800">
                            Email đã được gửi!
                        </CardTitle>
                        <p className="text-gray-600 mt-2">
                            Chúng tôi đã gửi link đặt lại mật khẩu đến <strong>{email}</strong>
                        </p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <h4 className="font-semibold text-blue-800 mb-2">📧 Hướng dẫn:</h4>
                            <ul className="text-sm text-blue-700 space-y-1">
                                <li>• Kiểm tra hộp thư email của bạn</li>
                                <li>• Click vào link trong email</li>
                                <li>• Nhập mật khẩu mới</li>
                                <li>• Đăng nhập lại với mật khẩu mới</li>
                            </ul>
                        </div>
                        
                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                onClick={() => setEmailSent(false)}
                                className="flex-1"
                            >
                                Gửi lại email
                            </Button>
                            <Button
                                onClick={() => router.push("/auth/login")}
                                className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
                            >
                                Về trang đăng nhập
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

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
                        Quên mật khẩu?
                    </CardTitle>
                    <p className="text-gray-600 mt-2">
                        Nhập email của bạn để nhận link đặt lại mật khẩu
                    </p>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
                                Email
                            </Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <Input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Nhập email của bạn"
                                    className="pl-10 h-11 border-2 border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                                    required
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={loading || !email}
                            className="w-full h-11 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Đang gửi...
                                </>
                            ) : (
                                'Gửi link đặt lại mật khẩu'
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
