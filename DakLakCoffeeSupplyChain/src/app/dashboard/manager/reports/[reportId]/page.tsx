"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthGuard } from "@/lib/auth/useAuthGuard";
import { getFarmerReportById, GeneralFarmerReportViewDetailsDto } from "@/lib/api/generalFarmerReports";
import { getAllExpertAdvicesForManager, ExpertAdviceViewForManagerDto } from "@/lib/api/expertAdvice";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FiArrowLeft, FiFileText, FiUser, FiMessageSquare, FiImage, FiVideo, FiClock, FiCheckCircle, FiXCircle } from "react-icons/fi";

export default function ReportDetailPage() {
    useAuthGuard(["manager"]);
    const params = useParams();
    const router = useRouter();
    const reportId = params.reportId as string;

    const [report, setReport] = useState<GeneralFarmerReportViewDetailsDto | null>(null);
    const [expertAdvices, setExpertAdvices] = useState<ExpertAdviceViewForManagerDto[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (reportId) {
            fetchReportDetails();
        }
    }, [reportId]);

    const fetchReportDetails = async () => {
        try {
            setLoading(true);
            const [reportData, advicesData] = await Promise.all([
                getFarmerReportById(reportId),
                getAllExpertAdvicesForManager()
            ]);

            if (reportData) {
                setReport(reportData);
                // Lọc expert advice cho báo cáo này
                const filteredAdvices = advicesData.filter(advice => advice.reportId === reportId);
                setExpertAdvices(filteredAdvices);
            }
        } catch (error) {
            console.error("Lỗi fetch report details:", error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (isResolved: boolean | null) => {
        if (isResolved === true) return "bg-green-100 text-green-800";
        if (isResolved === false) return "bg-yellow-100 text-yellow-800";
        return "bg-gray-100 text-gray-800";
    };

    const getStatusIcon = (isResolved: boolean | null) => {
        if (isResolved === true) return <FiCheckCircle className="w-4 h-4" />;
        if (isResolved === false) return <FiClock className="w-4 h-4" />;
        return <FiXCircle className="w-4 h-4" />;
    };

    const getStatusText = (isResolved: boolean | null) => {
        if (isResolved === true) return "Đã xử lý";
        if (isResolved === false) return "Đang xử lý";
        return "Chưa xử lý";
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

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-600"></div>
            </div>
        );
    }

    if (!report) {
        return (
            <div className="container mx-auto p-6">
                <div className="text-center py-8">
                    <FiFileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Không tìm thấy báo cáo</h2>
                    <p className="text-gray-600 mb-4">Báo cáo bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.</p>
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
                        <h1 className="text-3xl font-bold text-gray-900">Chi tiết Báo cáo</h1>
                        <p className="text-gray-600 mt-2">
                            Xem thông tin chi tiết và tư vấn chuyên gia
                        </p>
                    </div>
                </div>
            </div>

            {/* Report Information */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FiFileText className="w-5 h-5 text-blue-600" />
                        Thông tin Báo cáo
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                            {/* <div>
                                <label className="text-sm font-medium text-gray-500">Mã báo cáo</label>
                                <p className="font-mono text-lg text-gray-900">{report.reportId}</p>
                            </div> */}
                            <div>
                                <label className="text-sm font-medium text-gray-500">Tiêu đề</label>
                                <p className="text-lg text-gray-900">{report.title}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Mô tả</label>
                                <p className="text-gray-700">{report.description}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Mức độ nghiêm trọng</label>
                                <Badge className="bg-red-100 text-red-800 mt-1">
                                    {report.severityLevel === 1 ? "Thấp" :
                                        report.severityLevel === 2 ? "Trung bình" :
                                            report.severityLevel === 3 ? "Cao" : "Không xác định"}
                                </Badge>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Nông dân báo cáo</label>
                                <p className="text-gray-900">{report.reportedByName}</p>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <label className="text-sm font-medium text-gray-500">Trạng thái</label>
                                <div className="mt-1">
                                    <Badge className={getStatusColor(report.isResolved)}>
                                        <div className="flex items-center gap-1">
                                            {getStatusIcon(report.isResolved)}
                                            {getStatusText(report.isResolved)}
                                        </div>
                                    </Badge>
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Ngày báo cáo</label>
                                <p className="text-gray-900">{formatDate(report.reportedAt)}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Cập nhật lần cuối</label>
                                <p className="text-gray-900">{formatDate(report.updatedAt)}</p>
                            </div>
                            {report.resolvedAt && (
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Ngày xử lý</label>
                                    <p className="text-gray-900">{formatDate(report.resolvedAt)}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Media Files */}
                    {(report.imageUrl || report.videoUrl) && (
                        <div className="border-t pt-4">
                            <h4 className="font-medium text-gray-900 mb-3">Tệp đính kèm</h4>
                            <div className="flex gap-4">
                                {report.imageUrl && (
                                    <div className="flex items-center gap-2">
                                        <FiImage className="w-5 h-5 text-blue-600" />
                                        <a
                                            href={report.imageUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:text-blue-800"
                                        >
                                            Xem hình ảnh
                                        </a>
                                    </div>
                                )}
                                {report.videoUrl && (
                                    <div className="flex items-center gap-2">
                                        <FiVideo className="w-5 h-5 text-red-600" />
                                        <a
                                            href={report.videoUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-red-600 hover:text-red-800"
                                        >
                                            Xem video
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Expert Advice Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FiMessageSquare className="w-5 h-5 text-purple-600" />
                        Tư vấn Chuyên gia ({expertAdvices.length})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {expertAdvices.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <FiMessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                            <p>Chưa có tư vấn nào từ chuyên gia</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {expertAdvices.map((advice) => (
                                <div
                                    key={advice.adviceId}
                                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                                                <FiUser className="w-5 h-5 text-white" />
                                            </div>
                                            <div>
                                                <h4 className="font-medium text-gray-900">{advice.expertName}</h4>
                                                <p className="text-sm text-gray-500">{advice.expertEmail}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <Badge className="bg-blue-100 text-blue-800 text-xs">
                                                {getResponseTypeText(advice.responseType)}
                                            </Badge>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {formatDate(advice.createdAt)}
                                            </p>
                                        </div>
                                    </div>

                                    {advice.adviceText && (
                                        <div className="mb-3">
                                            <p className="text-gray-700">{advice.adviceText}</p>
                                        </div>
                                    )}

                                    {advice.attachedFileUrl && (
                                        <div className="flex items-center gap-2">
                                            <FiFileText className="w-4 h-4 text-gray-500" />
                                            <a
                                                href={advice.attachedFileUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 hover:text-blue-800 text-sm"
                                            >
                                                Xem tệp đính kèm
                                            </a>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
