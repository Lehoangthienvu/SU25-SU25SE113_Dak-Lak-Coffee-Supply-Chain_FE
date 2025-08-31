"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    ArrowLeft,
    Calendar,
    MapPin,
    Users,
    TrendingUp,
    Coffee,
    Clock,
    CheckCircle,
    AlertTriangle
} from "lucide-react";
import { useAuthGuard } from "@/lib/auth/useAuthGuard";
import { getCropSeasonById, CropSeason } from "@/lib/api/cropSeasons";
import { getCropProgressesByDetailId, CropProgressViewAllDto } from "@/lib/api/cropProgress";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { toast } from "sonner";

import { CropSeasonStatusMap, CropSeasonStatusValue } from "@/lib/constants/cropSeasonStatus";
import { getCropSeasonDetailStatusMap, CropSeasonDetailStatusValue } from "@/lib/constants/cropSeasonDetailStatus";

export default function ManagerCropSeasonDetailPage() {
    const { t } = useTranslation();
    useAuthGuard(["manager"]);
    const router = useRouter();
    const params = useParams();
    const cropSeasonId = params?.id as string;

    const [cropSeason, setCropSeason] = useState<CropSeason | null>(null);
    const [cropProgresses, setCropProgresses] = useState<Record<string, CropProgressViewAllDto[]>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("overview");

    useEffect(() => {
        const fetchData = async () => {
            if (!cropSeasonId) return;

            setIsLoading(true);
            try {
                // Fetch crop season details
                const seasonData = await getCropSeasonById(cropSeasonId);
                setCropSeason(seasonData);

                // Fetch progress for each detail
                const progressData: Record<string, CropProgressViewAllDto[]> = {};
                if (seasonData?.details && Array.isArray(seasonData.details)) {
                    for (const detail of seasonData.details) {
                        try {
                            const progress = await getCropProgressesByDetailId(detail.detailId);
                            progressData[detail.detailId] = progress;
                        } catch (error) {
                            console.error(`Error fetching progress for detail ${detail.detailId}:`, error);
                            progressData[detail.detailId] = [];
                        }
                    }
                }
                setCropProgresses(progressData);
            } catch (error) {
                console.error("Error fetching crop season data:", error);
                toast.error(t('manager.cropSeasonDetail.error.loadFailed'));
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [cropSeasonId, t]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-orange-50 flex items-center justify-center">
                <LoadingSpinner />
            </div>
        );
    }

    if (!cropSeason) {
        return (
            <div className="min-h-screen bg-orange-50 flex items-center justify-center">
                <div className="text-center">
                    <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">{t('manager.cropSeasonDetail.error.notFound')}</h2>
                    <p className="text-gray-600 mb-4">{t('manager.cropSeasonDetail.error.notFoundDescription')}</p>
                    <Button onClick={() => router.back()}>{t('common.back')}</Button>
                </div>
            </div>
        );
    }

    const getStatusColor = (status: CropSeasonStatusValue) => {
        const statusInfo = CropSeasonStatusMap[status];
        if (!statusInfo) return 'bg-gray-100 text-gray-800';

        switch (statusInfo.color) {
            case 'green': return 'bg-green-100 text-green-800';
            case 'yellow': return 'bg-yellow-100 text-yellow-800';
            case 'blue': return 'bg-blue-100 text-blue-800';
            case 'red': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getDetailStatusColor = (status: CropSeasonDetailStatusValue) => {
        const statusInfo = getCropSeasonDetailStatusMap(t)[status];
        if (!statusInfo) return 'bg-gray-100 text-gray-800';

        switch (statusInfo.color) {
            case 'gray': return 'bg-blue-100 text-blue-800';
            case 'yellow': return 'bg-orange-100 text-orange-800';
            case 'green': return 'bg-green-100 text-green-800';
            case 'red': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getProgressIcon = (stageCode: string) => {
        const code = stageCode?.toLowerCase() || '';
        if (code.includes('plant')) return <TrendingUp className="w-4 h-4 text-green-600" />;
        if (code.includes('flower')) return <Coffee className="w-4 h-4 text-pink-600" />;
        if (code.includes('fruit')) return <CheckCircle className="w-4 h-4 text-red-600" />;
        if (code.includes('harvest')) return <Calendar className="w-4 h-4 text-amber-600" />;
        return <Clock className="w-4 h-4 text-gray-600" />;
    };

    return (
        <div className="min-h-screen bg-orange-50 p-4">
            <div className="max-w-7xl mx-auto space-y-4">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-sm p-4 border border-orange-100">
                    <div className="flex items-center gap-4 mb-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800 mb-1">
                                {cropSeason.seasonName}
                            </h1>
                            <p className="text-gray-600 text-sm">
                                {t('manager.cropSeasonDetail.subtitle')}
                            </p>
                        </div>
                    </div>

                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="flex items-center gap-2">
                            <Users className="w-5 h-5 text-blue-600" />
                            <div>
                                <p className="text-sm text-gray-600">{t('manager.cropSeasonDetail.farmer')}</p>
                                <p className="font-medium">{cropSeason.farmerName}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-orange-600" />
                            <div>
                                <p className="text-sm text-gray-600">{t('manager.cropSeasonDetail.area')}</p>
                                <p className="font-medium">{cropSeason.area} ha</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-green-600" />
                            <div>
                                <p className="text-sm text-gray-600">{t('manager.cropSeasonDetail.time')}</p>
                                <p className="font-medium">
                                    {new Date(cropSeason.startDate).toLocaleDateString('vi-VN')} - {new Date(cropSeason.endDate).toLocaleDateString('vi-VN')}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-purple-600" />
                            <div>
                                <p className="text-sm text-gray-600">{t('manager.cropSeasonDetail.status')}</p>
                                <Badge className={getStatusColor(cropSeason.status as CropSeasonStatusValue)}>
                                    {CropSeasonStatusMap[cropSeason.status as CropSeasonStatusValue]?.label ? t(CropSeasonStatusMap[cropSeason.status as CropSeasonStatusValue]?.label) : cropSeason.status}
                                </Badge>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="overview">{t('manager.cropSeasonDetail.overview')}</TabsTrigger>
                        <TabsTrigger value="details">{t('manager.cropSeasonDetail.plantingDetails')}</TabsTrigger>
                        <TabsTrigger value="progress">{t('manager.cropSeasonDetail.cultivationProgress')}</TabsTrigger>
                    </TabsList>

                    {/* Overview Tab */}
                    <TabsContent value="overview" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Coffee className="w-5 h-5 text-orange-600" />
                                    {t('manager.cropSeasonDetail.generalInfo')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <h4 className="font-medium text-gray-800 mb-2">{t('manager.cropSeasonDetail.seasonInfo')}</h4>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">{t('manager.cropSeasonDetail.seasonName')}:</span>
                                                <span className="font-medium">{cropSeason.seasonName}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">{t('manager.cropSeasonDetail.startDate')}:</span>
                                                <span>{new Date(cropSeason.startDate).toLocaleDateString('vi-VN')}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">{t('manager.cropSeasonDetail.endDate')}:</span>
                                                <span>{new Date(cropSeason.endDate).toLocaleDateString('vi-VN')}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">{t('manager.cropSeasonDetail.area')}:</span>
                                                <span>{cropSeason.area} ha</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">{t('manager.cropSeasonDetail.status')}:</span>
                                                <Badge className={getStatusColor(cropSeason.status as CropSeasonStatusValue)}>
                                                    {CropSeasonStatusMap[cropSeason.status as CropSeasonStatusValue]?.label ? t(CropSeasonStatusMap[cropSeason.status as CropSeasonStatusValue]?.label) : cropSeason.status}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-gray-800 mb-2">{t('manager.cropSeasonDetail.farmerInfo')}</h4>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">{t('manager.cropSeasonDetail.farmerName')}:</span>
                                                <span className="font-medium">{cropSeason.farmerName}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">{t('manager.cropSeasonDetail.commitmentCode')}:</span>
                                                <span>{cropSeason.commitmentName}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">{t('manager.cropSeasonDetail.registrationCode')}:</span>
                                                <span>{cropSeason.registrationCode}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {cropSeason.note && (
                                    <div>
                                        <h4 className="font-medium text-gray-800 mb-2">{t('manager.cropSeasonDetail.notes')}</h4>
                                        <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                                            {cropSeason.note}
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Details Tab */}
                    <TabsContent value="details" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <MapPin className="w-5 h-5 text-blue-600" />
                                    {t('manager.cropSeasonDetail.plantingAreaDetails')} ({cropSeason.details?.length || 0})
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {!cropSeason.details || cropSeason.details.length === 0 ? (
                                        <div className="text-center py-8 text-gray-500">
                                            <MapPin className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                                            <p>{t('manager.cropSeasonDetail.noPlantingDetails')}</p>
                                        </div>
                                    ) : (
                                        cropSeason.details.map((detail) => (
                                            <div key={detail.detailId} className="border border-gray-200 rounded-lg p-4">
                                                <div className="flex items-center justify-between mb-3">
                                                    <h4 className="font-medium text-gray-800">{detail.typeName}</h4>
                                                    <Badge className={getDetailStatusColor(detail.status as CropSeasonDetailStatusValue)}>
                                                        {getCropSeasonDetailStatusMap(t)[detail.status as CropSeasonDetailStatusValue]?.label || detail.status}
                                                    </Badge>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                                    <div>
                                                        <span className="text-gray-600">{t('manager.cropSeasonDetail.allocatedArea')}:</span>
                                                        <span className="ml-2 font-medium">{detail.areaAllocated || 0} ha</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-600">{t('manager.cropSeasonDetail.estimatedYield')}:</span>
                                                        <span className="ml-2 font-medium">{detail.estimatedYield || 0} kg</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-600">{t('manager.cropSeasonDetail.actualYield')}:</span>
                                                        <span className="ml-2 font-medium">{detail.actualYield || 0} kg</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-600">{t('manager.cropSeasonDetail.expectedHarvestStart')}:</span>
                                                        <span className="ml-2">
                                                            {detail.expectedHarvestStart ? new Date(detail.expectedHarvestStart).toLocaleDateString('vi-VN') : 'N/A'}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-600">{t('manager.cropSeasonDetail.expectedHarvestEnd')}:</span>
                                                        <span className="ml-2">
                                                            {detail.expectedHarvestEnd ? new Date(detail.expectedHarvestEnd).toLocaleDateString('vi-VN') : 'N/A'}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-600">{t('manager.cropSeasonDetail.plannedQuality')}:</span>
                                                        <span className="ml-2">{detail.plannedQuality || 'N/A'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Progress Tab */}
                    <TabsContent value="progress" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <TrendingUp className="w-5 h-5 text-green-600" />
                                    {t('manager.cropSeasonDetail.cultivationProgressTitle')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-6">
                                    {!cropSeason.details || cropSeason.details.length === 0 ? (
                                        <div className="text-center py-8 text-gray-500">
                                            <TrendingUp className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                                            <p>{t('manager.cropSeasonDetail.noProgressToShow')}</p>
                                        </div>
                                    ) : (
                                        cropSeason.details.map((detail) => {
                                            const progress = cropProgresses[detail.detailId] || [];
                                            return (
                                                <div key={detail.detailId} className="border border-gray-200 rounded-lg p-4">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <h4 className="font-medium text-gray-800">{detail.typeName}</h4>
                                                        <Badge className={getDetailStatusColor(detail.status as CropSeasonDetailStatusValue)}>
                                                            {getCropSeasonDetailStatusMap(t)[detail.status as CropSeasonDetailStatusValue]?.label || detail.status}
                                                        </Badge>
                                                    </div>

                                                    {progress.length === 0 ? (
                                                        <div className="text-center py-6 text-gray-500">
                                                            <Clock className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                                                            <p>{t('manager.cropSeasonDetail.noProgressRecorded')}</p>
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-3">
                                                            {progress.map((prog) => (
                                                                <div key={prog.progressId} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                                                    <div className="flex-shrink-0">
                                                                        {getProgressIcon(prog.stageCode)}
                                                                    </div>
                                                                    <div className="flex-1">
                                                                        <div className="flex items-center justify-between">
                                                                            <h5 className="font-medium text-gray-800">{prog.stageName}</h5>
                                                                            <span className="text-xs text-gray-500">
                                                                                {prog.progressDate ? new Date(prog.progressDate).toLocaleDateString('vi-VN') : 'N/A'}
                                                                            </span>
                                                                        </div>

                                                                        {prog.note && (
                                                                            <p className="text-xs text-gray-500 mt-1 italic">&quot;{prog.note}&quot;</p>
                                                                        )}
                                                                    </div>
                                                                    <div className="flex-shrink-0">
                                                                        <Badge variant="outline" className="text-xs">
                                                                            {prog.stepIndex || 0}
                                                                        </Badge>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
