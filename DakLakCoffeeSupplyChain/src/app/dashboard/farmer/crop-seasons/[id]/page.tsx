'use client';

import { useParams, useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    getCropSeasonById,
    CropSeason,
} from '@/lib/api/cropSeasons';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Leaf, Calendar, MapPin, User, FileText, Plus, TrendingUp } from 'lucide-react';
import StatusBadge from '@/components/crop-seasons/StatusBadge';
import { CropSeasonStatusMap } from '@/lib/constants/cropSeasonStatus';
import { useAuth } from '@/lib/hooks/useAuth';
import CropSeasonDetailTable from '@/components/crop-seasons/CropSeasonDetailTable';

export default function CropSeasonDetail() {
    const { t } = useTranslation();
    const params = useParams();
    const router = useRouter();
    const cropSeasonId = params.id as string;

    const [season, setSeason] = useState<CropSeason | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { user } = useAuth();

    const loadSeason = async () => {
        try {
            const data = await getCropSeasonById(cropSeasonId);
            setSeason(data);
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : t('cropSeasons.details.error');
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?.id) {
            setLoading(true);
            loadSeason();
        }
    }, [user?.id, cropSeasonId, t]);

    const formatDate = (date?: string) => {
        if (!date) return t('cropSeasons.details.notUpdated');
        const d = new Date(date);
        return isNaN(d.getTime()) ? t('cropSeasons.details.notUpdated') : d.toLocaleDateString('vi-VN');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-orange-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Leaf className="w-6 h-6 text-orange-600 animate-pulse" />
                    </div>
                    <p className="text-gray-600 font-medium text-sm">{t('cropSeasons.details.loading')}</p>
                </div>
            </div>
        );
    }

    if (error || !season) {
        return (
            <div className="min-h-screen bg-orange-50 p-4">
                <div className="max-w-2xl mx-auto">
                    <Card className="border-orange-200 shadow-sm">
                        <CardHeader className="bg-gradient-to-r from-red-50 to-pink-50 border-b border-red-200">
                            <CardTitle className="text-red-700 flex items-center gap-2 text-lg">
                                <Leaf className="w-5 h-5" />
                                {t('cropSeasons.details.error')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4">
                            <p className="text-red-600 mb-3 font-medium">{error || t('cropSeasons.details.notFound')}</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    // Tính toán thống kê
    const details = season.details || [];
    const totalDetails = details.length;
    const completedDetails = details.filter(d => d.status === 'Completed').length;
    const inProgressDetails = details.filter(d => d.status === 'InProgress').length;
    const totalArea = details.reduce((sum, d) => sum + (d.areaAllocated || 0), 0);

    return (
        <div className="min-h-screen bg-orange-50 p-4">
            <div className="max-w-6xl mx-auto space-y-4">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-sm p-4 border border-orange-100">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg flex items-center justify-center">
                                    <Leaf className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-800">
                                        {season.seasonName}
                                    </h1>
                                    <p className="text-gray-600 text-sm">{t('cropSeasons.details.title')}</p>
                                </div>
                            </div>
                        </div>
                        <StatusBadge status={season.status} map={CropSeasonStatusMap} />
                    </div>

                    {/* Statistics Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg p-3 text-white">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-orange-100 text-xs">{t('cropSeasons.details.statistics.totalAreas')}</p>
                                    <p className="text-xl font-bold">{totalDetails}</p>
                                </div>
                                <MapPin className="w-5 h-5 text-orange-200" />
                            </div>
                        </div>
                        <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg p-3 text-white">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-green-100 text-xs">{t('cropSeasons.details.statistics.completed')}</p>
                                    <p className="text-xl font-bold">{completedDetails}</p>
                                </div>
                                <TrendingUp className="w-5 h-5 text-green-200" />
                            </div>
                        </div>
                        <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg p-3 text-white">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-blue-100 text-xs">{t('cropSeasons.details.statistics.inProgress')}</p>
                                    <p className="text-xl font-bold">{inProgressDetails}</p>
                                </div>
                                <Calendar className="w-5 h-5 text-blue-200" />
                            </div>
                        </div>
                        <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg p-3 text-white">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-purple-100 text-xs">{t('cropSeasons.details.statistics.totalArea')}</p>
                                    <p className="text-xl font-bold">{totalArea.toFixed(1)} ha</p>
                                </div>
                                <MapPin className="w-5 h-5 text-purple-200" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Thông tin mùa vụ - 1 hàng ngang */}
                <Card className="border-orange-200 shadow-sm">
                    <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 border-b border-orange-200">
                        <CardTitle className="text-gray-800 flex items-center gap-2 text-sm">
                            <FileText className="w-4 h-4 text-orange-600" />
                            {t('cropSeasons.details.seasonInfo')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">

                            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-md">
                                <FileText className="w-4 h-4 text-purple-600" />
                                <div>
                                    <p className="text-xs text-gray-600">{t('cropSeasons.details.season')}</p>
                                    <p className="font-medium text-gray-800">
                                        {season.seasonName || <span className="italic text-gray-500">{t('cropSeasons.details.notAvailable')}</span>}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-md">
                                <User className="w-4 h-4 text-green-600" />
                                <div>
                                    <p className="text-xs text-gray-600">{t('cropSeasons.details.farmer')}</p>
                                    <p className="font-medium text-gray-800">{season.farmerName || t('cropSeasons.details.unknown')}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-md">
                                <Calendar className="w-4 h-4 text-blue-600" />
                                <div>
                                    <p className="text-xs text-gray-600">{t('cropSeasons.details.time')}</p>
                                    <p className="font-medium text-gray-800">
                                        {formatDate(season.startDate)} – {formatDate(season.endDate)}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-md">
                                <MapPin className="w-4 h-4 text-orange-600" />
                                <div>
                                    <p className="text-xs text-gray-600">{t('cropSeasons.details.area')}</p>
                                    <p className="font-medium text-gray-800">{season.area} ha</p>
                                </div>
                            </div>


                            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-md">
                                <FileText className="w-4 h-4 text-indigo-600" />
                                <div>
                                    <p className="text-xs text-gray-600">{t('cropSeasons.details.registrationCode')}</p>
                                    <p className="font-medium text-gray-800">
                                        {season.registrationCode || <span className="italic text-gray-500">{t('cropSeasons.details.notAvailable')}</span>}
                                    </p>
                                </div>
                            </div>

                            {season.note && (
                                <div className="col-span-2 md:col-span-3 lg:col-span-5 flex items-start gap-2 p-3 bg-gray-50 rounded-md">
                                    <FileText className="w-4 h-4 text-amber-600 mt-1" />
                                    <div>
                                        <p className="text-xs text-gray-600">{t('cropSeasons.details.note')}</p>
                                        <p className="font-medium text-gray-800 text-sm">{season.note}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Chi tiết vùng trồng - Full width */}
                <Card className="border-orange-200 shadow-sm">
                    <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-200">
                        <div className="flex justify-between items-center">
                            <CardTitle className="text-gray-800 flex items-center gap-2 text-sm">
                                <MapPin className="w-4 h-4 text-green-600" />
                                {t('cropSeasons.details.plantingAreas')}
                            </CardTitle>
                            {user?.role === 'farmer' && (
                                <Button
                                    size="sm"
                                    onClick={() =>
                                        router.push(`/dashboard/farmer/crop-seasons/${season.cropSeasonId}/details/create?commitmentId=${season.commitmentId}`)
                                    }
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                    <Plus className="w-4 h-4 mr-1" />
                                    {t('cropSeasons.details.addPlantingArea')}
                                </Button>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="p-4">
                        <CropSeasonDetailTable
                            details={details}
                            onReload={loadSeason}
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
