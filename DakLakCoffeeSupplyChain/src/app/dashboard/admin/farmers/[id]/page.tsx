"use client";

import {
    useParams,
    useRouter
} from "next/navigation";
import {
    getFarmerById,
    FarmerDetails
} from "@/lib/api/farmers";
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import React from "react";

export default function FarmerDetail() {
    const params = useParams();
    const router = useRouter();
    const farmerId = params.id as string;
    const [farmer, setFarmer] = React.useState<FarmerDetails | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState("");

    React.useEffect(() => {
        setLoading(true);
        getFarmerById(farmerId)
            .then(setFarmer)
            .catch((err) => setError(err.message || "Không lấy được thông tin nông dân"))
            .finally(() => setLoading(false));
    }, [farmerId]);

    if (loading) {
        return <div className="text-center py-8">Đang tải...</div>;
    }

    if (error || !farmer) {
        return (
            <div className="p-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Không tìm thấy nông dân</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-red-500 mb-2">{error || "Không tìm thấy nông dân"}</div>
                        <Button onClick={() => router.back()}>Quay lại</Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Format date for display
    const formatDate = (date: string | Date | null | undefined) => {
        if (!date) return "Chưa cập nhật";
        const d = typeof date === "string" ? new Date(date) : date;
        if (isNaN(d.getTime())) return "Chưa cập nhật";
        return new Intl.DateTimeFormat('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        }).format(d);
    };

    return (
        <div className="w-full flex justify-center items-start">
            <Card className="w-full max-w-2xl">
                <CardHeader>
                    <CardTitle>Chi tiết nông dân</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col gap-6">
                        {/* Basic Info */}
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-32 h-32 rounded-full bg-orange-100 border-4 border-orange-200 flex items-center justify-center">
                                <span className="text-4xl font-bold text-orange-600">
                                    {farmer.farmerName ? farmer.farmerName.charAt(0).toUpperCase() : 'N'}
                                </span>
                            </div>
                            <div className="text-center">
                                <h2 className="font-semibold text-xl">{farmer.farmerName}</h2>
                                <p className="text-gray-600">Nông dân</p>
                                <p className="text-sm text-gray-500">Mã: {farmer.farmerCode}</p>
                            </div>
                        </div>

                        {/* Farm Information */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Thông tin nông trại</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="font-medium">Địa điểm:</span>
                                        <span>{farmer.farmLocation}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-medium">Diện tích:</span>
                                        <span>{farmer.farmSize ? `${farmer.farmSize} ha` : "Chưa cập nhật"}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-medium">Chứng nhận:</span>
                                        <span>{farmer.certificationStatus || "Chưa cập nhật"}</span>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Account Information */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Thông tin tài khoản</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="font-medium">Mã nông dân:</span>
                                        <span>{farmer.farmerCode}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-medium">Trạng thái:</span>
                                        <span className={`px-2 py-1 rounded text-xs font-semibold ${farmer.isVerified ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                                            }`}>
                                            {farmer.isVerified ? "Đã xác thực" : "Chưa xác thực"}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-medium">Ngày tạo:</span>
                                        <span>{formatDate(farmer.createdAt)}</span>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Certification Details */}
                        {farmer.certificationUrl && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Chứng nhận</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        <div className="flex justify-between">
                                            <span className="font-medium">Trạng thái:</span>
                                            <span>{farmer.certificationStatus}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="font-medium">Tài liệu:</span>
                                            <a
                                                href={farmer.certificationUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 hover:underline"
                                            >
                                                Xem tài liệu
                                            </a>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Action Buttons */}
                        <div className="flex justify-end gap-3">
                            <Button
                                variant="outline"
                                onClick={() => router.push(`/dashboard/admin/farmers/${farmerId}/edit`)}
                            >
                                Chỉnh sửa
                            </Button>
                            <Button onClick={() => router.back()}>
                                Quay lại
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
