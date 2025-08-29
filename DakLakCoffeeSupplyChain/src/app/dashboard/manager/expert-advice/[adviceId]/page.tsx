"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthGuard } from "@/lib/auth/useAuthGuard";
import { getAllExpertAdvicesForManager, ExpertAdviceViewForManagerDto } from "@/lib/api/expertAdvice";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FiArrowLeft, FiMessageSquare, FiUser, FiFileText, FiCalendar, FiExternalLink } from "react-icons/fi";

export default function ExpertAdviceDetailPage() {
    useAuthGuard(["manager"]);
    const params = useParams();
    const router = useRouter();
    const adviceId = params.adviceId as string;

    const [advice, setAdvice] = useState<ExpertAdviceViewForManagerDto | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (adviceId) {
            fetchAdviceDetails();
        }
    }, [adviceId]);

    const fetchAdviceDetails = async () => {
        try {
            setLoading(true);
            const advicesData = await getAllExpertAdvicesForManager();
            const foundAdvice = advicesData.find(a => a.adviceId === adviceId);

            if (foundAdvice) {
                setAdvice(foundAdvice);
            }
        } catch (error) {
            console.error("Lỗi fetch advice details:", error);
        } finally {
            setLoading(false);
        }
    };

    const getResponseTypeColor = (responseType: string) => {
        switch (responseType.toLowerCase()) {
            case "preventive":
                return "bg-blue-100 text-blue-800";
            case "corrective":
                return "bg-orange-100 text-orange-800";
            case "observation":
                return "bg-purple-100 text-purple-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    const getResponseTypeText = (responseType: string) => {
        switch (responseType.toLowerCase()) {
            case "preventive":
                return "Phòng ngừa";
            case "corrective":
                return "Khắc phục";
            case "observation":
                return "Nhận xét";
            default:
                return responseType;
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("vi-VN", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-600"></div>
            </div>
        );
    }

    if (!advice) {
        return (
            <div className="container mx-auto p-6">
                <div className="text-center py-8">
                    <FiMessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Không tìm thấy tư vấn</h2>
                    <p className="text-gray-600 mb-4">Tư vấn bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.</p>
                    <Button onClick={() => router.back()}>
                        <FiArrowLeft className="w-4 h-4 mr-2" />
                        Quay lại
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button
                        variant="outline"
                        onClick={() => router.back()}
                        className="flex items-center gap-2"
                    >
                        <FiArrowLeft className="w-4 h-4" />
                        Quay lại
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Chi tiết Tư vấn Chuyên gia</h1>
                        <p className="text-gray-600 mt-2">
                            Xem thông tin chi tiết về tư vấn từ chuyên gia
                        </p>
                    </div>
                </div>
            </div>

            {/* Expert Information */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FiUser className="w-5 h-5 text-green-600" />
                        Thông tin Chuyên gia
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                            <FiUser className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-900">{advice.expertName}</h3>
                            <p className="text-gray-600">{advice.expertEmail}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Report Information */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FiFileText className="w-5 h-5 text-blue-600" />
                        Thông tin Báo cáo liên quan
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="text-sm font-medium text-gray-500">Mã báo cáo</label>
                            <p className="font-mono text-lg text-gray-900">{advice.reportCode}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-500">Tiêu đề báo cáo</label>
                            <p className="text-lg text-gray-900">{advice.reportTitle}</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="text-sm font-medium text-gray-500">Nông dân báo cáo</label>
                            <p className="text-gray-900">{advice.reportedByName}</p>
                            <p className="text-sm text-gray-500">{advice.reportedByEmail}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-500">Ngày tư vấn</label>
                            <p className="text-gray-900">{formatDate(advice.createdAt)}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Advice Details */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FiMessageSquare className="w-5 h-5 text-purple-600" />
                        Chi tiết Tư vấn
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="text-sm font-medium text-gray-500">Loại tư vấn</label>
                            <div className="mt-1">
                                <Badge className={getResponseTypeColor(advice.responseType)}>
                                    {getResponseTypeText(advice.responseType)}
                                </Badge>
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-500">Nguồn tư vấn</label>
                            <p className="text-gray-900">{advice.adviceSource}</p>
                        </div>
                    </div>

                    {advice.adviceText && (
                        <div>
                            <label className="text-sm font-medium text-gray-500">Nội dung tư vấn</label>
                            <div className="mt-2 p-4 bg-gray-50 rounded-lg">
                                <p className="text-gray-700 leading-relaxed">{advice.adviceText}</p>
                            </div>
                        </div>
                    )}

                    {advice.attachedFileUrl && (
                        <div>
                            <label className="text-sm font-medium text-gray-500">Tệp đính kèm</label>
                            <div className="mt-2">
                                <a
                                    href={advice.attachedFileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 hover:underline"
                                >
                                    <FiExternalLink className="w-4 h-4" />
                                    Xem tệp đính kèm
                                </a>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
