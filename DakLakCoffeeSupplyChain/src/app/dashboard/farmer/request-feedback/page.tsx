'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileWarning, Plus, MessageSquare, Calendar, User, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
    GeneralFarmerReportViewAllDto,
    getAllFarmerReports
} from '@/lib/api/generalFarmerReports';
import { SeverityLevelLabel, SeverityLevelEnum } from '@/lib/constants/SeverityLevelEnum';

interface ReportWithSeverity extends GeneralFarmerReportViewAllDto {
    severityLevel?: number;
}

export default function FarmerReportsListPage() {
    const [reports, setReports] = useState<ReportWithSeverity[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        getAllFarmerReports()
            .then((data) =>
                setReports(
                    data.sort(
                        (a, b) =>
                            new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime()
                    )
                )
            )
            .catch((err) => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    const handleCardClick = (reportId: string) => {
        router.push(`/dashboard/farmer/request-feedback/${reportId}`);
    };

    const getSeverityColor = (level: number) => {
        switch (level) {
            case SeverityLevelEnum.High: return 'bg-red-100 text-red-700 border-red-200';
            case SeverityLevelEnum.Medium: return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case SeverityLevelEnum.Low: return 'bg-blue-100 text-blue-700 border-blue-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 p-4">
            <div className="max-w-6xl mx-auto py-8">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-sm border border-orange-100 p-6 mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-1 h-8 bg-gradient-to-b from-orange-500 to-amber-500 rounded-full"></div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-800">
                                    Tư vấn kỹ thuật
                                </h1>
                                <p className="text-gray-600 text-sm">
                                    Quản lý các báo cáo và yêu cầu hỗ trợ kỹ thuật
                                </p>
                            </div>
                        </div>
                        <Button
                            onClick={() => router.push('/dashboard/farmer/request-feedback/create')}
                            className="w-fit"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Tạo tư vấn
                        </Button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white rounded-lg shadow-sm border border-orange-100 p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                                <MessageSquare className="w-5 h-5 text-orange-600" />
                            </div>
                            <div>
                                <p className="text-xl font-bold text-gray-800">{reports.length}</p>
                                <p className="text-xs text-gray-600">Tổng tư vấn đã gửi</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm border border-orange-100 p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                <MessageSquare className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-xl font-bold text-gray-800">{reports.filter(r => r.isResolved).length}</p>
                                <p className="text-xs text-gray-600">Đã xử lý</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm border border-orange-100 p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                                <AlertTriangle className="w-5 h-5 text-red-600" />
                            </div>
                            <div>
                                <p className="text-xl font-bold text-gray-800">{reports.filter(r => !r.isResolved).length}</p>
                                <p className="text-xs text-gray-600">Chờ xử lý</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <Card key={i} className="animate-pulse border-orange-100">
                                <CardContent className="p-4 space-y-3">
                                    <div className="h-4 bg-orange-100 rounded w-3/4" />
                                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                                    <div className="h-3 bg-gray-200 rounded w-2/3" />
                                    <div className="flex justify-between items-center">
                                        <div className="h-6 bg-gray-200 rounded-full w-20" />
                                        <div className="h-6 bg-orange-100 rounded-full w-16" />
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Empty State */}
                {!loading && reports.length === 0 && (
                    <div className="bg-white rounded-lg shadow-sm border border-orange-100 p-12 text-center">
                        <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FileWarning className="w-8 h-8 text-orange-500" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">
                            Chưa có báo cáo nào
                        </h3>
                        <p className="text-gray-600 mb-4">
                            Bắt đầu tạo báo cáo đầu tiên để nhận hỗ trợ kỹ thuật
                        </p>
                        <Button onClick={() => router.push('/dashboard/farmer/request-feedback/create')}>
                            <Plus className="w-4 h-4 mr-2" />
                            Tạo tư vấn mới
                        </Button>
                    </div>
                )}

                {/* Reports Grid */}
                {!loading && reports.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {reports.map((r) => (
                            <Card
                                key={r.reportId}
                                className="cursor-pointer hover:shadow-md transition-all duration-200 border-orange-100 hover:border-orange-200 bg-white"
                                onClick={() => handleCardClick(r.reportId)}
                            >
                                <CardContent className="p-4 space-y-3">
                                    {/* Header */}
                                    <div className="flex justify-between items-start gap-2">
                                        <h3 className="font-semibold text-gray-800 line-clamp-2 text-sm">
                                            {r.title}
                                        </h3>
                                        <Badge
                                            variant={r.isResolved ? "success" : "destructive"}
                                            className="text-xs shrink-0"
                                        >
                                            {r.isResolved ? '✅ Đã xử lý' : '⏳ Chờ xử lý'}
                                        </Badge>
                                    </div>

                                    {/* Meta Info */}
                                    <div className="space-y-2 text-xs text-gray-600">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-3 h-3" />
                                            <span>
                                                {format(new Date(r.reportedAt), 'dd/MM/yyyy HH:mm', { locale: vi })}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <User className="w-3 h-3" />
                                            <span>{r.reportedByName}</span>
                                        </div>
                                    </div>

                                    {/* Severity Level */}
                                    {typeof r.severityLevel === 'number' && (
                                        <div className="flex items-center gap-2">
                                            <AlertTriangle className="w-3 h-3 text-orange-500" />
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getSeverityColor(r.severityLevel)}`}>
                                                {SeverityLevelLabel[r.severityLevel as SeverityLevelEnum]}
                                            </span>
                                        </div>
                                    )}

                                    {/* Action Indicator */}
                                    <div className="pt-2 border-t border-gray-100">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-gray-500">Nhấn để xem chi tiết</span>
                                            <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
