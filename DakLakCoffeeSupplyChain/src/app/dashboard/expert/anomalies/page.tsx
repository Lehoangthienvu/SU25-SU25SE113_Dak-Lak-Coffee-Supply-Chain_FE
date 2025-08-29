'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { GeneralFarmerReportViewAllDto, getAllFarmerReports, getFarmerReportById, GeneralFarmerReportViewDetailsDto } from '@/lib/api/generalFarmerReports';
import { ExpertAdvice, getAllExpertAdvices } from '@/lib/api/expertAdvice';
import AdviceHistoryDialog from './AdviceHistoryDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, FileText, User, Calendar, CheckCircle, XCircle, History, MessageSquare, Filter, Image, Video, X, Maximize2 } from 'lucide-react';

type FilterType = 'all' | 'resolved' | 'unresolved';

export default function ReportResponsePage() {
    const [reports, setReports] = useState<GeneralFarmerReportViewAllDto[]>([]);
    const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
    const [allAdvices, setAllAdvices] = useState<ExpertAdvice[]>([]);
    const [filteredAdvices, setFilteredAdvices] = useState<ExpertAdvice[]>([]);
    const [showHistoryDialog, setShowHistoryDialog] = useState(false);
    const [activeFilter, setActiveFilter] = useState<FilterType>('all');

    // State cho media viewer
    const [selectedReportDetail, setSelectedReportDetail] = useState<GeneralFarmerReportViewDetailsDto | null>(null);
    const [showMediaViewer, setShowMediaViewer] = useState(false);
    const [selectedMedia, setSelectedMedia] = useState<{ type: 'image' | 'video', url: string } | null>(null);

    useEffect(() => {
        getAllFarmerReports()
            .then(setReports)
            .catch(() => toast.error('Không thể tải danh sách báo cáo'));

        getAllExpertAdvices()
            .then(setAllAdvices)
            .catch(() => toast.error('Không thể tải phản hồi'));
    }, []);

    useEffect(() => {
        if (selectedReportId) {
            const filtered = allAdvices.filter((a) => a.reportId === selectedReportId);
            setFilteredAdvices(filtered);
        }
    }, [selectedReportId, allAdvices]);

    // Function để xem chi tiết báo cáo
    const handleViewReportDetail = async (reportId: string) => {
        try {
            const reportDetail = await getFarmerReportById(reportId);
            if (reportDetail) {
                setSelectedReportDetail(reportDetail);
                setShowMediaViewer(true);
            }
        } catch {
            toast.error('Không thể tải chi tiết báo cáo');
        }
    };

    // Function để xem media
    const handleViewMedia = (type: 'image' | 'video', url: string) => {
        setSelectedMedia({ type, url });
    };

    // Lọc báo cáo theo filter
    const filteredReports = reports.filter(report => {
        switch (activeFilter) {
            case 'resolved':
                return report.isResolved;
            case 'unresolved':
                return !report.isResolved;
            default:
                return true;
        }
    });

    // Tính số lượng báo cáo theo từng trạng thái
    const resolvedCount = reports.filter(r => r.isResolved).length;
    const unresolvedCount = reports.filter(r => !r.isResolved).length;
    const totalCount = reports.length;

    if (reports.length === 0) {
        return (
            <div className="p-6">
                <div className="text-center py-12">
                    <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileText className="w-8 h-8 text-orange-600" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-700 mb-2">Chưa có báo cáo nào</h2>
                    <p className="text-gray-500">Tất cả báo cáo đã được xử lý hoặc chưa có báo cáo mới</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Báo cáo cần phản hồi</h1>
                    <p className="text-gray-600 text-sm">Quản lý và phản hồi các báo cáo từ nông dân</p>
                </div>
            </div>

            {/* Filter Panel */}
            <Card className="bg-orange-50 border-orange-200">
                <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Filter className="w-5 h-5 text-orange-600" />
                            <span className="text-sm font-medium text-gray-700">Lọc theo trạng thái:</span>
                        </div>

                        <div className="flex gap-2">
                            <Button
                                variant={activeFilter === 'all' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setActiveFilter('all')}
                                className={activeFilter === 'all'
                                    ? 'bg-orange-600 hover:bg-orange-700 text-white'
                                    : 'border-orange-200 text-gray-700 hover:bg-orange-50'
                                }
                            >
                                Tất cả
                                <span className="ml-2 bg-white/20 text-white px-2 py-0.5 rounded-full text-xs">
                                    {totalCount}
                                </span>
                            </Button>

                            <Button
                                variant={activeFilter === 'resolved' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setActiveFilter('resolved')}
                                className={activeFilter === 'resolved'
                                    ? 'bg-green-600 hover:bg-green-700 text-white'
                                    : 'border-green-200 text-gray-700 hover:bg-green-50'
                                }
                            >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Đã phản hồi
                                <span className="ml-2 bg-white/20 text-white px-2 py-0.5 rounded-full text-xs">
                                    {resolvedCount}
                                </span>
                            </Button>

                            <Button
                                variant={activeFilter === 'unresolved' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setActiveFilter('unresolved')}
                                className={activeFilter === 'unresolved'
                                    ? 'bg-red-600 hover:bg-red-700 text-white'
                                    : 'border-red-200 text-gray-700 hover:bg-red-50'
                                }
                            >
                                <XCircle className="w-4 h-4 mr-2" />
                                Chưa phản hồi
                                <span className="ml-2 bg-white/20 text-white px-2 py-0.5 rounded-full text-xs">
                                    {unresolvedCount}
                                </span>
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Reports List */}
            <div className="grid gap-4">
                {filteredReports.length === 0 ? (
                    <Card className="bg-gray-50 border-gray-200">
                        <CardContent className="p-8 text-center">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Filter className="w-8 h-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-700 mb-2">Không có báo cáo nào</h3>
                            <p className="text-gray-500">
                                {activeFilter === 'resolved'
                                    ? 'Không có báo cáo nào đã được phản hồi'
                                    : activeFilter === 'unresolved'
                                        ? 'Không có báo cáo nào chưa được phản hồi'
                                        : 'Không có báo cáo nào'
                                }
                            </p>
                            <Button
                                variant="outline"
                                onClick={() => setActiveFilter('all')}
                                className="mt-4"
                            >
                                Xem tất cả báo cáo
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    filteredReports.map((report) => (
                        <Card key={report.reportId} className="hover:shadow-md transition-shadow duration-200">
                            <CardHeader className="pb-3">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <CardTitle className="text-lg text-gray-800 mb-2">{report.title}</CardTitle>
                                        <div className="flex items-center gap-4 text-sm text-gray-600">
                                            <div className="flex items-center gap-1">
                                                <Calendar className="w-4 h-4" />
                                                <span>{new Date(report.reportedAt).toLocaleDateString('vi-VN')}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <User className="w-4 h-4" />
                                                <span>{report.reportedByName}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                {report.isResolved ? (
                                                    <>
                                                        <CheckCircle className="w-4 h-4 text-green-600" />
                                                        <span className="text-green-600 font-medium">Đã phản hồi</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <XCircle className="w-4 h-4 text-red-600" />
                                                        <span className="text-red-600 font-medium">Chưa phản hồi</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex justify-between items-center">
                                    <div className="flex-1 flex gap-2">
                                        {/* Button xem chi tiết báo cáo */}
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleViewReportDetail(report.reportId)}
                                            className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                                        >
                                            <FileText className="w-4 h-4 mr-2" />
                                            Xem chi tiết
                                        </Button>

                                        {/* Button xem lịch sử phản hồi */}
                                        {(() => {
                                            const adviceCount = allAdvices.filter((a) => a.reportId === report.reportId).length;
                                            return adviceCount > 0 ? (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        setSelectedReportId(report.reportId);
                                                        setShowHistoryDialog(true);
                                                    }}
                                                    className="text-orange-600 hover:text-orange-800 hover:bg-orange-50"
                                                >
                                                    <History className="w-4 h-4 mr-2" />
                                                    Lịch sử phản hồi ({adviceCount})
                                                </Button>
                                            ) : null;
                                        })()}
                                    </div>
                                    <Button
                                        onClick={() => {
                                            // Chuyển thẳng đến trang create với reportId
                                            window.location.href = `/dashboard/expert/anomalies/create?reportId=${report.reportId}`;
                                        }}
                                        className="bg-orange-600 hover:bg-orange-700 text-white"
                                    >
                                        <MessageSquare className="w-4 h-4 mr-2" />
                                        Phản hồi
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>



            {showHistoryDialog && selectedReportId && (
                <AdviceHistoryDialog
                    advices={filteredAdvices}
                    onClose={() => {
                        setShowHistoryDialog(false);
                        setSelectedReportId(null);
                        setFilteredAdvices([]);
                    }}
                />
            )}

            {/* Media Viewer Dialog */}
            {showMediaViewer && selectedReportDetail && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                        {/* Header */}
                        <div className="flex justify-between items-center p-6 border-b">
                            <h2 className="text-xl font-semibold text-gray-800">
                                Chi tiết báo cáo: {selectedReportDetail.title}
                            </h2>
                            <button
                                onClick={() => {
                                    setShowMediaViewer(false);
                                    setSelectedReportDetail(null);
                                }}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                                aria-label="Đóng"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-6">
                            {/* Thông tin cơ bản */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <h3 className="font-medium text-gray-700 mb-2">Mô tả</h3>
                                    <p className="text-gray-600">{selectedReportDetail.description}</p>
                                </div>
                                <div>
                                    <h3 className="font-medium text-gray-700 mb-2">Thông tin khác</h3>
                                    <div className="space-y-2 text-sm text-gray-600">
                                        <p>Người báo cáo: {selectedReportDetail.reportedByName}</p>
                                        <p>Ngày báo cáo: {new Date(selectedReportDetail.reportedAt).toLocaleDateString('vi-VN')}</p>
                                        <p>Trạng thái: {selectedReportDetail.isResolved ? 'Đã xử lý' : 'Chưa xử lý'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Media Section */}
                            {(selectedReportDetail.imageUrl || selectedReportDetail.videoUrl) && (
                                <div>
                                    <h3 className="font-medium text-gray-700 mb-4">Tài liệu đính kèm</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Image */}
                                        {selectedReportDetail.imageUrl && (
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <Image className="w-5 h-5 text-blue-500" />
                                                    <span className="text-sm font-medium text-gray-700">Hình ảnh</span>
                                                </div>
                                                <div className="relative group cursor-pointer" onClick={() => handleViewMedia('image', selectedReportDetail.imageUrl!)}>
                                                    <img
                                                        src={selectedReportDetail.imageUrl}
                                                        alt="Hình ảnh báo cáo"
                                                        className="w-full h-48 object-cover rounded-lg border hover:shadow-lg transition-shadow"
                                                    />
                                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-lg flex items-center justify-center">
                                                        <Maximize2 className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Video */}
                                        {selectedReportDetail.videoUrl && (
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <Video className="w-5 h-5 text-purple-500" />
                                                    <span className="text-sm font-medium text-gray-700">Video</span>
                                                </div>
                                                <div className="relative group cursor-pointer" onClick={() => handleViewMedia('video', selectedReportDetail.videoUrl!)}>
                                                    <video
                                                        src={selectedReportDetail.videoUrl}
                                                        className="w-full h-48 object-cover rounded-lg border hover:shadow-lg transition-shadow"
                                                        controls
                                                    />
                                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-lg flex items-center justify-center">
                                                        <Maximize2 className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Action buttons */}
                            <div className="flex justify-end pt-4 border-t">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setShowMediaViewer(false);
                                        setSelectedReportDetail(null);
                                    }}
                                >
                                    Đóng
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Fullscreen Media Viewer */}
            {selectedMedia && (
                <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
                    <div className="relative max-w-[90vw] max-h-[90vh]">
                        <button
                            onClick={() => setSelectedMedia(null)}
                            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10"
                            aria-label="Đóng"
                        >
                            <X className="w-8 h-8" />
                        </button>

                        {selectedMedia.type === 'image' ? (
                            <img
                                src={selectedMedia.url}
                                alt="Hình ảnh phóng to"
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
