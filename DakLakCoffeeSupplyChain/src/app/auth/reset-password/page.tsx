"use client";

import React, { Suspense } from "react";
import { ResetPasswordForm } from "./ResetPasswordForm";

export default function ResetPasswordPage() {
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
