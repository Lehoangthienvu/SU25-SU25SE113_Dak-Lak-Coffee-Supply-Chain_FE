"use client";

import { useEffect, useState } from "react";
import { roleRawToDisplayName } from "@/lib/constants/role";
import { User, Mail, Phone, Shield, Edit3, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authService } from "@/lib/auth/authService";

export default function UserInfoPage() {
    const [userInfo, setUserInfo] = useState({
        name: "",
        email: "",
        phone: "",
        role: "",
        avatar: "",
    });

    useEffect(() => {
        const user = authService.getUser();
        if (user) {
            const rawAvatar = user.avatar?.trim();
            const name = user.name || "Ẩn danh";

            setUserInfo({
                name,
                email: user.email || "",
                phone: localStorage.getItem("phone") || "Chưa cập nhật",
                role: roleRawToDisplayName[user.roleRaw] || "Không xác định",
                avatar:
                    rawAvatar && rawAvatar !== ""
                        ? rawAvatar
                        : `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=FD7622&color=fff`,
            });
        }
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 p-4">
            <div className="max-w-4xl mx-auto py-8">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-sm border border-orange-100 p-6 mb-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-1 h-8 bg-gradient-to-b from-orange-500 to-amber-500 rounded-full"></div>
                        <h1 className="text-2xl font-bold text-gray-800">
                            Thông tin cá nhân
                        </h1>
                    </div>
                    <p className="text-gray-600 text-sm">
                        Quản lý thông tin hồ sơ và tài khoản của bạn
                    </p>
                </div>

                {/* Main Profile Card */}
                <div className="bg-white rounded-lg shadow-sm border border-orange-100 overflow-hidden">
                    {/* Cover Photo */}
                    <div className="h-32 bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-400 relative">
                        <div className="absolute inset-0 bg-black/10"></div>
                    </div>

                    {/* Profile Content */}
                    <div className="px-6 pb-6">
                        {/* Avatar Section */}
                        <div className="flex flex-col sm:flex-row sm:items-end gap-6 -mt-16 relative z-10">
                            <div className="relative group">
                                <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg overflow-hidden bg-white">
                                    {userInfo.avatar && (
                                        <img
                                            src={userInfo.avatar}
                                            alt="avatar"
                                            className="w-full h-full object-cover"
                                        />
                                    )}
                                </div>
                                <button className="absolute bottom-2 right-2 w-8 h-8 bg-orange-500 hover:bg-orange-600 text-white rounded-full flex items-center justify-center shadow-md transition-colors duration-200 opacity-0 group-hover:opacity-100">
                                    <Camera className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="flex-1 pb-4">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-800 mb-1">
                                            {userInfo.name}
                                        </h2>
                                        <p className="text-orange-600 font-medium text-sm">
                                            {userInfo.role}
                                        </p>
                                    </div>
                                    <Button className="w-fit">
                                        <Edit3 className="w-4 h-4 mr-2" />
                                        Chỉnh sửa hồ sơ
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Information Grid */}
                        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Personal Information */}
                            <div className="space-y-6">
                                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                    <User className="w-5 h-5 text-orange-500" />
                                    Thông tin cá nhân
                                </h3>

                                <div className="space-y-4">
                                    <div className="p-4 bg-gray-50 rounded-lg">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                                                <User className="w-4 h-4 text-orange-600" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 uppercase font-medium">Họ tên</p>
                                                <p className="text-sm font-medium text-gray-800">{userInfo.name}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-gray-50 rounded-lg">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                                <Mail className="w-4 h-4 text-blue-600" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 uppercase font-medium">Email</p>
                                                <p className="text-sm font-medium text-gray-800">{userInfo.email || "Chưa cập nhật"}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-gray-50 rounded-lg">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                                                <Phone className="w-4 h-4 text-green-600" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 uppercase font-medium">Số điện thoại</p>
                                                <p className="text-sm font-medium text-gray-800">{userInfo.phone}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Account Information */}
                            <div className="space-y-6">
                                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                    <Shield className="w-5 h-5 text-orange-500" />
                                    Thông tin tài khoản
                                </h3>

                                <div className="space-y-4">
                                    <div className="p-4 bg-gray-50 rounded-lg">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                                                <Shield className="w-4 h-4 text-purple-600" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 uppercase font-medium">Vai trò</p>
                                                <p className="text-sm font-medium text-gray-800">{userInfo.role}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                            <div>
                                                <p className="text-xs text-green-600 uppercase font-medium">Trạng thái</p>
                                                <p className="text-sm font-medium text-green-700">Tài khoản hoạt động</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                                        <p className="text-xs text-orange-600 font-medium mb-1">Lưu ý bảo mật</p>
                                        <p className="text-sm text-orange-700">
                                            Để đảm bảo an toàn, hãy thường xuyên cập nhật mật khẩu và không chia sẻ thông tin đăng nhập.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="mt-8 pt-6 border-t border-gray-200">
                            <div className="flex flex-col sm:flex-row gap-3">
                                <Button variant="outline" className="flex-1">
                                    Đổi mật khẩu
                                </Button>
                                <Button variant="outline" className="flex-1">
                                    Cài đặt bảo mật
                                </Button>
                                <Button className="flex-1">
                                    Lưu thay đổi
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
