'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, ArrowLeft, FileText, User, Calendar, XCircle, Maximize2, MessageSquare } from 'lucide-react';
import { GeneralFarmerReportViewDetailsDto, getFarmerReportById } from '@/lib/api/generalFarmerReports';
import { ExpertAdvice, getAllExpertAdvices } from '@/lib/api/expertAdvice';
import { formatDateTimeVN } from '@/lib/utils';

export default function AnomalyDetailPage() {
    const { id } = useParams();
    const router = useRouter();

    const [report, setReport] = useState<GeneralFarmerReportViewDetailsDto | null>(null);
    const [advices, setAdvices] = useState<ExpertAdvice[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Media viewer states
    const [showMediaViewer, setShowMediaViewer] = useState(false);
    const [selectedMedia, setSelectedMedia] = useState<{ type: 'image' | 'video', url: string } | null>(null);

    useEffect(() => {
        if (id) {
            fetchReportDetails(id as string);
            fetchAdvices(id as string);
        }
    }, [id]);

    const fetchReportDetails = async (reportId: string) => {
        try {
            setLoading(true);
            const reportDetail = await getFarmerReportById(reportId);
            if (reportDetail) {
                setReport(reportDetail);
            } else {
                setError('Không tìm thấy báo cáo');
            }
        } catch {
            setError('Không thể tải chi tiết báo cáo');
            toast.error('Không thể tải chi tiết báo cáo');
        } finally {
            setLoading(false);
        }
    };

    const fetchAdvices = async (reportId: string) => {
        try {
            const allAdvices = await getAllExpertAdvices();
            const filteredAdvices = allAdvices.filter(advice => advice.reportId === reportId);
            setAdvices(filteredAdvices);
        } catch (err) {
            console.error('Không thể tải phản hồi:', err);
        }
    };

    const handleViewMedia = (type: 'image' | 'video', url: string) => {
        setSelectedMedia({ type, url });
        setShowMediaViewer(true);
    };

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

    if (loading) {
        return (
            <div className="p-6">
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Đang tải...</p>
                </div>
            </div>
        );
    }

    if (error || !report) {
        return (
            <div className="p-6">
                <div className="text-center py-12">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <XCircle className="w-8 h-8 text-red-600" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-700 mb-2">Không thể tải báo cáo</h2>
                    <p className="text-gray-500 mb-4">{error || 'Báo cáo không tồn tại'}</p>
                    <Button onClick={() => router.back()} variant="outline">
                        Quay lại
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.back()}
                    className="p-2"
                >
                    <ArrowLeft className="w-4 h-4" />
                </Button>
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Chi tiết báo cáo bất thường</h1>
                    <p className="text-gray-600">Xem thông tin chi tiết và phản hồi từ chuyên gia</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Report Details */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="w-5 h-5 text-orange-600" />
                                Thông tin báo cáo
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex items-center gap-2">
                                    <User className="w-4 h-4 text-gray-500" />
                                    <span className="font-medium">Nông dân:</span>
                                    <span>{report.reportedByName || 'N/A'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-gray-500" />
                                    <span className="font-medium">Ngày báo cáo:</span>
                                    <span>{formatDateTimeVN(report.reportedAt)}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="font-medium">Trạng thái:</span>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${report.isResolved
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-orange-100 text-orange-800'
                                        }`}>
                                        {report.isResolved ? 'Đã xử lý' : 'Chưa xử lý'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="font-medium">Giai đoạn:</span>
                                    <span>{report.cropStageName || 'N/A'}</span>
                                </div>
                            </div>

                            <div>
                                <span className="font-medium block mb-2">Mô tả:</span>
                                <p className="text-gray-700 bg-gray-50 p-3 rounded-lg whitespace-pre-line">
                                    {report.description}
                                </p>
                            </div>

                            {/* Media Files */}
                            {(report.imageUrl || report.videoUrl) ? (
                                <div>
                                    <span className="font-medium block mb-3">Tệp đính kèm:</span>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                        {report.imageUrl && (
                                            <div className="relative group">
                                                <img
                                                    src={report.imageUrl}
                                                    alt="Hình ảnh báo cáo"
                                                    className="w-full h-24 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                                                    onClick={() => handleViewMedia('image', report.imageUrl!)}
                                                />
                                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-lg flex items-center justify-center">
                                                    <Maximize2 className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </div>
                                            </div>
                                        )}
                                        {report.videoUrl && (
                                            <div className="relative group">
                                                <video
                                                    src={report.videoUrl}
                                                    className="w-full h-24 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                                                    onClick={() => handleViewMedia('video', report.videoUrl!)}
                                                />
                                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-lg flex items-center justify-center">
                                                    <Maximize2 className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : null}
                        </CardContent>
                    </Card>

                    {/* Expert Advices */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MessageSquare className="w-5 h-5 text-blue-600" />
                                Phản hồi từ chuyên gia ({advices.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {advices.length > 0 ? (
                                <div className="space-y-4">
                                    {advices.map((advice) => (
                                        <div key={advice.adviceId} className="border-l-4 border-blue-500 pl-4 py-3 bg-blue-50 rounded-r-lg">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <User className="w-4 h-4 text-gray-500" />
                                                    <span className="font-medium">{advice.expertName}</span>
                                                </div>
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${advice.responseType === 'preventive' ? 'bg-green-100 text-green-800' :
                                                    advice.responseType === 'corrective' ? 'bg-red-100 text-red-800' :
                                                        'bg-blue-100 text-blue-800'
                                                    }`}>
                                                    {translateResponseType(advice.responseType)}
                                                </span>
                                            </div>
                                            <p className="text-gray-700 mb-2 whitespace-pre-line">{advice.adviceText}</p>
                                            <div className="flex items-center justify-between text-sm text-gray-500">
                                                <span>{formatDateTimeVN(advice.createdAt)}</span>
                                                {advice.attachedFileUrl && (
                                                    <a
                                                        href={advice.attachedFileUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-blue-600 hover:underline flex items-center gap-1"
                                                    >
                                                        <FileText className="w-3 h-3" />
                                                        Xem tài liệu
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                    <p>Chưa có phản hồi nào từ chuyên gia</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Thống kê</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="text-center p-4 bg-orange-50 rounded-lg">
                                <div className="text-2xl font-bold text-orange-600">
                                    {advices.length}
                                </div>
                                <div className="text-sm text-orange-600">Phản hồi từ chuyên gia</div>
                            </div>

                            <div className="text-center p-4 bg-blue-50 rounded-lg">
                                <div className="text-2xl font-bold text-blue-600">
                                    {report.isResolved ? 'Đã xử lý' : 'Chưa xử lý'}
                                </div>
                                <div className="text-sm text-blue-600">Trạng thái báo cáo</div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Media Viewer Modal */}
            {showMediaViewer && selectedMedia && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
                    <div className="relative max-w-4xl max-h-[90vh] p-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowMediaViewer(false)}
                            className="absolute top-2 right-2 z-10 bg-white/20 hover:bg-white/30 text-white"
                        >
                            <XCircle className="w-5 h-5" />
                        </Button>

                        {selectedMedia.type === 'image' ? (
                            <img
                                src={selectedMedia.url}
                                alt="Media preview"
                                className="max-w-full max-h-full object-contain"
                            />
                        ) : (
                            <video
                                src={selectedMedia.url}
                                controls
                                className="max-w-full max-h-full"
                                autoPlay
                            />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
