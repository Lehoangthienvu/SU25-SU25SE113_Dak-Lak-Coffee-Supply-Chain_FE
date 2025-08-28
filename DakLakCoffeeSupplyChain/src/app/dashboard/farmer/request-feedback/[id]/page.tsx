'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, Edit3, Calendar, User, AlertTriangle, Eye, ImageIcon, Video, MessageSquare, FileText } from 'lucide-react';
import {
    GeneralFarmerReportViewDetailsDto,
    getFarmerReportById,
} from '@/lib/api/generalFarmerReports';
import { getExpertAdvicesByReportId, ExpertAdvice } from '@/lib/api/expertAdvice';
import { SeverityLevelEnum, SeverityLevelLabel } from '@/lib/constants/SeverityLevelEnum';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { stageIconMap, fallbackIcon } from '@/components/crop-stage/stage-icon-map';
import { getCropStages, CropStage } from '@/lib/api/cropStage';

export default function ReportDetailsPage() {
    const { id } = useParams();
    const router = useRouter();
    const [report, setReport] = useState<GeneralFarmerReportViewDetailsDto | null>(null);
    const [expertAdvices, setExpertAdvices] = useState<ExpertAdvice[]>([]);
    const [loading, setLoading] = useState(true);
    const [advicesLoading, setAdvicesLoading] = useState(true);
    const [cropStages, setCropStages] = useState<CropStage[]>([]);
    const [stagesLoading, setStagesLoading] = useState(true);

    // Fetch crop stages from API
    useEffect(() => {
        const fetchCropStages = async () => {
            try {
                const stages = await getCropStages();
                setCropStages(stages);
            } catch (error) {
                console.error('Error fetching crop stages:', error);
            } finally {
                setStagesLoading(false);
            }
        };

        fetchCropStages();
    }, []);

    // Create dynamic stage mapping from API data
    const stageNameToCodeMap: Record<string, string> = React.useMemo(() => {
        const mapping: Record<string, string> = {};
        cropStages.forEach(stage => {
            mapping[stage.stageName] = stage.stageCode;
        });
        return mapping;
    }, [cropStages]);

    useEffect(() => {
        if (typeof id !== 'string') return;

        const fetchData = async () => {
            try {
                setLoading(true);
                setAdvicesLoading(true);

                // Fetch report details
                const reportData = await getFarmerReportById(id);
                setReport(reportData);

                // Fetch expert advices
                try {
                    const advicesData = await getExpertAdvicesByReportId(id);
                    setExpertAdvices(advicesData);
                } catch (error) {
                    console.error('Error fetching expert advices:', error);
                    // Không throw error vì có thể chưa có expert advice
                }
            } catch (error) {
                console.error('Error fetching report:', error);
                router.push('/dashboard/farmer/request-feedback');
            } finally {
                setLoading(false);
                setAdvicesLoading(false);
            }
        };

        fetchData();
    }, [id, router]);

    if (loading || stagesLoading || advicesLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex justify-center items-center">
                <div className="text-center">
                    <Loader2 className="animate-spin w-8 h-8 text-orange-500 mx-auto mb-4" />
                    <p className="text-gray-600">Đang tải báo cáo...</p>
                </div>
            </div>
        );
    }

    if (!report) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex justify-center items-center">
                <div className="text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertTriangle className="w-8 h-8 text-red-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Không tìm thấy báo cáo</h3>
                    <p className="text-gray-600 mb-4">Báo cáo không tồn tại hoặc đã bị xóa</p>
                    <Button onClick={() => router.push('/dashboard/farmer/request-feedback')}>
                        Quay lại danh sách
                    </Button>
                </div>
            </div>
        );
    }

    const getSeverityColor = (level: SeverityLevelEnum) => {
        switch (level) {
            case SeverityLevelEnum.High:
                return 'bg-red-100 text-red-700 border-red-200';
            case SeverityLevelEnum.Medium:
                return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case SeverityLevelEnum.Low:
                return 'bg-blue-100 text-blue-700 border-blue-200';
            default:
                return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    // Get stage icon based on stage name from API
    const getStageIcon = (stageName: string) => {
        const stageCode = stageNameToCodeMap[stageName];
        if (stageCode && stageIconMap[stageCode.toUpperCase()]) {
            return stageIconMap[stageCode.toUpperCase()];
        }
        return fallbackIcon;
    };

    // Translate response type to Vietnamese
    const translateResponseType = (type: string): string => {
        switch (type?.toLowerCase()) {
            case 'preventive':
                return 'Phòng ngừa';
            case 'corrective':
                return 'Khắc phục';
            case 'observation':
                return 'Nhận xét';
            default:
                return 'Không xác định';
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 p-4">
            <div className="max-w-5xl mx-auto py-8">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-sm border border-orange-100 p-6 mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => router.push('/dashboard/farmer/request-feedback')}
                            >
                                <ArrowLeft className="w-4 h-4" />
                            </Button>
                            <div className="flex items-center gap-3">
                                <div className="w-1 h-8 bg-gradient-to-b from-orange-500 to-amber-500 rounded-full"></div>
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-800 line-clamp-2">
                                        {report.title}
                                    </h1>
                                    <p className="text-gray-600 text-sm">
                                        Chi tiết báo cáo kỹ thuật
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Badge
                                variant={report.isResolved ? "success" : "destructive"}
                                className="text-xs"
                            >
                                {report.isResolved ? '✅ Đã xử lý' : '⏳ Chờ xử lý'}
                            </Badge>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => router.push(`/dashboard/farmer/request-feedback/${report.reportId}/edit`)}
                                title="Chỉnh sửa báo cáo"
                            >
                                <Edit3 className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Report Details */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Basic Info */}
                        <Card className="border-orange-100 shadow-sm">
                            <CardContent className="p-6 space-y-6">
                                <div>
                                    <Label className="text-base font-semibold text-gray-800 mb-3 block">
                                        Mô tả chi tiết
                                    </Label>
                                    <div className="bg-gray-50 rounded-lg p-4 border">
                                        <p className="text-gray-700 whitespace-pre-wrap break-words leading-relaxed">
                                            {report.description}
                                        </p>
                                    </div>
                                </div>

                                {/* Severity Level */}
                                <div>
                                    <Label className="text-base font-semibold text-gray-800 mb-3 block flex items-center gap-2">
                                        <AlertTriangle className="w-4 h-4 text-orange-500" />
                                        Mức độ nghiêm trọng
                                    </Label>
                                    <div className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-medium border ${getSeverityColor(report.severityLevel as SeverityLevelEnum)}`}>
                                        {SeverityLevelLabel[report.severityLevel as SeverityLevelEnum]}
                                    </div>
                                </div>

                                {/* Stage Info */}
                                {report.cropStageName && (
                                    <div>
                                        <Label className="text-base font-semibold text-gray-800 mb-3 block">
                                            Giai đoạn mùa vụ
                                        </Label>
                                        <div className="flex items-center gap-3 bg-gray-50 px-4 py-3 rounded-lg border">
                                            {getStageIcon(report.cropStageName)}
                                            <span className="font-medium text-gray-800">{report.cropStageName}</span>
                                        </div>
                                    </div>
                                )}

                                {/* Processing Batch */}
                                {report.processingBatchCode && (
                                    <div>
                                        <Label className="text-base font-semibold text-gray-800 mb-3 block">
                                            Mã mẻ sơ chế
                                        </Label>
                                        <div className="bg-gray-50 px-4 py-3 rounded-lg border">
                                            <span className="font-mono text-gray-800">{report.processingBatchCode}</span>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Media Section */}
                        {(report.imageUrl || report.videoUrl) && (
                            <Card className="border-orange-100 shadow-sm">
                                <CardContent className="p-6 space-y-6">
                                    <Label className="text-base font-semibold text-gray-800 flex items-center gap-2">
                                        <Eye className="w-4 h-4 text-orange-500" />
                                        Tài liệu đính kèm
                                    </Label>

                                    {report.imageUrl && (
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <ImageIcon className="w-4 h-4" />
                                                <span>Hình ảnh</span>
                                            </div>
                                            <div className="border rounded-lg overflow-hidden bg-gray-50">
                                                <img
                                                    src={report.imageUrl}
                                                    alt="Ảnh báo cáo"
                                                    className="w-full max-h-96 object-contain"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {report.videoUrl && (
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <Video className="w-4 h-4" />
                                                <span>Video</span>
                                            </div>
                                            <div className="border rounded-lg overflow-hidden bg-gray-50">
                                                <video
                                                    controls
                                                    src={report.videoUrl}
                                                    className="w-full max-h-96"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Sidebar Info */}
                    <div className="space-y-6">
                        {/* Report Meta */}
                        <Card className="border-orange-100 shadow-sm">
                            <CardContent className="p-6 space-y-4">
                                <Label className="text-base font-semibold text-gray-800 block">
                                    Thông tin báo cáo
                                </Label>

                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                                            <User className="w-4 h-4 text-orange-600" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase font-medium">Người gửi</p>
                                            <p className="text-sm font-medium text-gray-800">{report.reportedByName}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                            <Calendar className="w-4 h-4 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase font-medium">Thời gian gửi</p>
                                            <p className="text-sm font-medium text-gray-800">
                                                {format(new Date(report.reportedAt), 'dd/MM/yyyy HH:mm', { locale: vi })}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                                            <Calendar className="w-4 h-4 text-green-600" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase font-medium">Cập nhật</p>
                                            <p className="text-sm font-medium text-gray-800">
                                                {format(new Date(report.updatedAt), 'dd/MM/yyyy HH:mm', { locale: vi })}
                                            </p>
                                        </div>
                                    </div>

                                    {report.resolvedAt && (
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                                                <Calendar className="w-4 h-4 text-emerald-600" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 uppercase font-medium">Xử lý lúc</p>
                                                <p className="text-sm font-medium text-gray-800">
                                                    {format(new Date(report.resolvedAt), 'dd/MM/yyyy HH:mm', { locale: vi })}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Action Card */}
                        <Card className="border-orange-100 shadow-sm">
                            <CardContent className="p-6 space-y-4">
                                <Label className="text-base font-semibold text-gray-800 block">
                                    Hành động
                                </Label>

                                <div className="space-y-3">
                                    <Button
                                        onClick={() => router.push(`/dashboard/farmer/request-feedback/${report.reportId}/edit`)}
                                        className="w-full justify-start"
                                        variant="outline"
                                    >
                                        <Edit3 className="w-4 h-4 mr-2" />
                                        Chỉnh sửa báo cáo
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Expert Advice Section */}
                <div className="mt-8">
                    <Card className="border-orange-100 shadow-sm">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                                    <MessageSquare className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-800">Phản hồi từ chuyên gia</h2>
                                    <p className="text-gray-600 text-sm">Tư vấn và hướng dẫn từ các chuyên gia nông nghiệp</p>
                                </div>
                            </div>

                            {advicesLoading ? (
                                <div className="flex justify-center items-center py-8">
                                    <Loader2 className="animate-spin w-6 h-6 text-orange-500" />
                                    <span className="ml-2 text-gray-600">Đang tải phản hồi...</span>
                                </div>
                            ) : expertAdvices.length > 0 ? (
                                <div className="space-y-4">
                                    {expertAdvices.map((advice) => (
                                        <div
                                            key={advice.adviceId}
                                            className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                                        >
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                                                        <User className="w-4 h-4 text-white" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-medium text-gray-900">{advice.expertName || 'Chuyên gia không xác định'}</h4>
                                                        <p className="text-sm text-gray-500">Chuyên gia nông nghiệp</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <Badge className="bg-blue-100 text-blue-800 text-xs">
                                                        {translateResponseType(advice.responseType)}
                                                    </Badge>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        {format(new Date(advice.createdAt), 'dd/MM/yyyy HH:mm', { locale: vi })}
                                                    </p>
                                                </div>
                                            </div>

                                            {advice.adviceText && advice.adviceText.trim() !== '' && (
                                                <div className="mb-3">
                                                    <p className="text-gray-700 leading-relaxed">{advice.adviceText}</p>
                                                </div>
                                            )}

                                            {advice.attachedFileUrl && advice.attachedFileUrl.trim() !== '' && (
                                                <div className="flex items-center gap-2">
                                                    <FileText className="w-4 h-4 text-gray-500" />
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
                            ) : (
                                <div className="text-center py-8">
                                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <MessageSquare className="w-8 h-8 text-gray-400" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Chưa có phản hồi</h3>
                                    <p className="text-gray-600">Chuyên gia sẽ phản hồi báo cáo của bạn trong thời gian sớm nhất</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
