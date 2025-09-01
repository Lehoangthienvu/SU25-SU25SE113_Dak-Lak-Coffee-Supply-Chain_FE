"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogTrigger, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { AppToast } from "@/components/ui/AppToast";
import {
    CropProgressViewAllDto,
    getCropProgressesByDetailId,
} from "@/lib/api/cropProgress";
import { CreateProgressDialog } from "../components/CreateProgressDialog";
import { EditProgressDialog } from "../components/EditProgressDialog";
import { CropSeasonDetail, getCropSeasonDetailById, getCommitmentDetailInfo } from "@/lib/api/cropSeasonDetail";
import { CropStage, getCropStages } from "@/lib/api/cropStage";
import { CalendarDays, FileText, Play, MessageSquare } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function CropProgressPage() {
    const { t } = useTranslation();
    const router = useRouter();
    const params = useParams();
    const cropSeasonDetailId = params?.id as string;

    const [progressList, setProgressList] = useState<CropProgressViewAllDto[]>([]);
    const [seasonDetail, setSeasonDetail] = useState<CropSeasonDetail | null>(null);
    const [coffeeTypeName, setCoffeeTypeName] = useState<string | null>(null);

    const [allStages, setAllStages] = useState<CropStage[]>([]);
    const [loading, setLoading] = useState(true);



    const reloadData = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getCropProgressesByDetailId(cropSeasonDetailId);
            setProgressList(data);
        } catch (error: unknown) {
            if (typeof error === "object" && error !== null && "response" in error) {
                const response = (error as { response?: { status?: number } }).response;
                if (response?.status !== 404) {
                    AppToast.error(t('cropProgress.errors.loadDataError'));
                }
            } else {
                // Hiển thị lỗi generic nếu không phải lỗi 404
                AppToast.error(t('cropProgress.errors.loadDataError'));
            }
            setProgressList([]);
        } finally {
            setLoading(false);
        }
    }, [cropSeasonDetailId, t]);

    const loadSeasonDetail = useCallback(async () => {
        try {
            const detail = await getCropSeasonDetailById(cropSeasonDetailId);
            setSeasonDetail(detail);

            // Lấy thông tin coffeeTypeName từ commitment detail
            if (detail?.commitmentDetailId) {
                try {
                    const coffeeInfo = await getCommitmentDetailInfo(detail.commitmentDetailId);
                    if (coffeeInfo?.coffeeTypeName) {
                        setCoffeeTypeName(coffeeInfo.coffeeTypeName);
                    }
                } catch (coffeeError) {
                    console.error('Error loading coffee type info:', coffeeError);
                    // Không hiển thị toast cho lỗi này vì không ảnh hưởng đến chức năng chính
                }
            }
        } catch (error) {
            console.error('Error loading season detail:', error);
            AppToast.error(t('cropProgress.errors.loadSeasonDetailError'));
        }
    }, [cropSeasonDetailId, t]);

    const handleEditSuccess = useCallback(() => {
        reloadData();
        loadSeasonDetail();
    }, [reloadData, loadSeasonDetail]);

    const handleCreateSuccess = useCallback(() => {
        reloadData();
        loadSeasonDetail();
    }, [reloadData, loadSeasonDetail]);

    const handleSeasonDetailUpdate = useCallback(() => {
        // Reload season detail to get updated data
        loadSeasonDetail();
    }, [loadSeasonDetail]);





    useEffect(() => {
        reloadData();
        loadSeasonDetail();

        const loadStages = async () => {
            try {
                const stages = await getCropStages();
                setAllStages(stages);
            } catch (error) {
                console.error('Error loading crop stages:', error);
                AppToast.error(t('cropProgress.errors.loadStagesError'));
            }
        };
        loadStages();
    }, [reloadData, loadSeasonDetail, t]);

    const formatDate = (date?: string) => {
        if (!date) return "—";
        return new Date(date).toLocaleDateString("vi-VN");
    };

    const sortedStages = allStages.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex justify-center items-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">{t('cropProgress.page.loading')}</p>
                </div>
            </div>
        );
    }

    if (!seasonDetail) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex justify-center items-center">
                <div className="text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <div className="w-8 h-8 text-red-500">⚠️</div>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">{t('cropProgress.page.notFound')}</h3>
                    <p className="text-gray-600 mb-4">{t('cropProgress.page.notFoundDesc')}</p>
                    <div className="flex gap-3 justify-center">
                        <Button onClick={() => router.push('/dashboard/farmer/crop-seasons')}>
                            {t('cropProgress.page.backToList')}
                        </Button>
                        <Button variant="outline" onClick={() => window.location.reload()}>
                            Thử lại
                        </Button>
                    </div>
                </div>
            </div>
        );
    }



    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 p-4">
            <div className="max-w-7xl mx-auto py-8">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-sm border border-orange-100 p-6 mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center gap-4">

                            <div className="flex items-center gap-3">
                                <div className="w-1 h-8 bg-gradient-to-b from-orange-500 to-amber-500 rounded-full"></div>
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-800 line-clamp-2">
                                        {t('cropProgress.page.title', {
                                            coffeeType: coffeeTypeName ||
                                                seasonDetail?.typeName ||
                                                seasonDetail?.commitmentDetailCode ||
                                                t('cropProgress.page.unknownType')
                                        })}
                                    </h1>
                                    <p className="text-gray-600 text-sm">
                                        {t('cropProgress.page.subtitle')}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="text-right">
                                <p className="text-sm text-gray-500">{t('cropProgress.header.harvestYield')}</p>
                                {seasonDetail?.actualYield && seasonDetail.actualYield > 0 ? (
                                    <p className="text-lg font-bold text-green-600">{seasonDetail.actualYield} kg</p>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 bg-yellow-100 rounded-full flex items-center justify-center">
                                            <span className="text-yellow-600 text-xs">⚠️</span>
                                        </div>
                                        <p className="text-sm text-yellow-600 font-medium">{t('cropProgress.header.notUpdated')}</p>
                                    </div>
                                )}
                            </div>
                            <Button
                                onClick={() => router.push(`/dashboard/farmer/request-feedback/create?detailId=${cropSeasonDetailId}`)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2"
                            >
                                <MessageSquare className="w-4 h-4 mr-2" />
                                {t('cropProgress.header.requestConsultation')}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Progress Table */}
                <Card className="border-orange-100 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg flex items-center justify-center">
                                <div className="w-3 h-3 text-white">📊</div>
                            </div>
                            {t('cropProgress.progressTable.title')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {/* Error display nếu không load được stages */}
                        {allStages.length === 0 && (
                            <div className="text-center py-8">
                                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <div className="w-6 h-6 text-red-500">⚠️</div>
                                </div>
                                <p className="text-red-600 text-sm font-medium mb-2">
                                    {t('cropProgress.errors.loadStagesError')}
                                </p>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => window.location.reload()}
                                >
                                    Thử lại
                                </Button>
                            </div>
                        )}

                        {/* Progress table chỉ hiển thị khi có stages */}
                        {allStages.length > 0 && (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-gradient-to-r from-orange-50 to-amber-50 text-gray-700 font-semibold">
                                        <tr>
                                            <th className="px-3 py-3 text-left">{t('cropProgress.progressTable.headers.stage')}</th>
                                            <th className="px-3 py-3 text-center">{t('cropProgress.progressTable.headers.status')}</th>
                                            <th className="px-3 py-3 text-center">{t('cropProgress.progressTable.headers.recordedDate')}</th>
                                            <th className="px-3 py-3 text-left">{t('cropProgress.progressTable.headers.notes')}</th>
                                            <th className="px-3 py-3 text-center">{t('cropProgress.progressTable.headers.documents')}</th>
                                            <th className="px-3 py-3 text-center">{t('cropProgress.progressTable.headers.actions')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-orange-100">
                                        {sortedStages.map((stage, idx) => {
                                            const progress = progressList.find(p => p.stageCode === stage.stageCode);
                                            const isCompleted = !!progress;
                                            // Kiểm tra xem tất cả các giai đoạn trước đó đã hoàn thành chưa
                                            const ready = idx === 0 || sortedStages.slice(0, idx).every(prevStage =>
                                                progressList.some(p => p.stageCode === prevStage.stageCode)
                                            );

                                            return (
                                                <tr key={stage.stageId} className="hover:bg-orange-50 transition-colors">
                                                    <td className="px-3 py-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                                                                {idx + 1}
                                                            </div>
                                                            <div>
                                                                <div className="font-medium text-gray-900">{stage.stageName}</div>
                                                                <div className="text-xs text-gray-500">{stage.description}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-2 align-top text-center">
                                                        {isCompleted ? (
                                                            <Badge variant="success" className="text-xs">
                                                                {t('cropProgress.progressTable.status.completed')}
                                                            </Badge>
                                                        ) : ready ? (
                                                            <Badge variant="outline" className="text-xs">
                                                                {t('cropProgress.progressTable.status.inProgress')}
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="secondary" className="text-xs">
                                                                {t('cropProgress.progressTable.status.notOpen')}
                                                            </Badge>
                                                        )}
                                                    </td>
                                                    <td className="px-3 py-2 align-top text-neutral-800">
                                                        {isCompleted ? (
                                                            <div className="flex items-center gap-1"><CalendarDays className="w-4 h-4 text-neutral-400" />{formatDate(progress?.progressDate)}</div>
                                                        ) : (
                                                            "-"
                                                        )}
                                                    </td>
                                                    <td className="px-3 py-2 align-top text-neutral-800 max-w-[280px]">
                                                        {isCompleted && progress?.note ? (
                                                            <div className="flex items-start gap-2 text-neutral-700">
                                                                <FileText className="w-4 h-4 shrink-0 text-neutral-400 mt-0.5" />
                                                                <span className="line-clamp-2">{progress.note}</span>
                                                            </div>
                                                        ) : (
                                                            "-"
                                                        )}
                                                    </td>
                                                    <td className="px-3 py-2 align-top">
                                                        {(isCompleted && (progress?.photoUrl || progress?.videoUrl)) ? (
                                                            <div className="flex gap-2">
                                                                {progress?.photoUrl && (
                                                                    <Dialog>
                                                                        <DialogTrigger asChild>
                                                                            <button
                                                                                className="h-14 w-20 border border-neutral-200 rounded-md overflow-hidden hover:border-neutral-300"
                                                                                title={t('cropProgress.media.viewImage')}
                                                                            >
                                                                                <img src={progress.photoUrl} alt={t('cropProgress.media.imageAlt')} className="h-full w-full object-cover" />
                                                                            </button>
                                                                        </DialogTrigger>
                                                                        <DialogContent className="max-w-4xl">
                                                                            <DialogTitle className="sr-only">{t('cropProgress.media.viewImage')}</DialogTitle>
                                                                            <img src={progress.photoUrl} alt={t('cropProgress.media.largeImageAlt')} className="max-h-[75vh] w-auto object-contain mx-auto" />
                                                                        </DialogContent>
                                                                    </Dialog>
                                                                )}
                                                                {progress?.videoUrl && (
                                                                    <Dialog>
                                                                        <DialogTrigger asChild>
                                                                            <button
                                                                                className="h-14 w-20 border border-neutral-200 rounded-md overflow-hidden hover:border-neutral-300 relative"
                                                                                title={t('cropProgress.media.viewVideo')}
                                                                            >
                                                                                <video muted playsInline className="h-full w-full object-cover">
                                                                                    <source src={progress.videoUrl} />
                                                                                </video>
                                                                                <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                                                                                    <Play className="w-5 h-5 text-white" />
                                                                                </div>
                                                                            </button>
                                                                        </DialogTrigger>
                                                                        <DialogContent className="max-w-5xl">
                                                                            <DialogTitle className="sr-only">{t('cropProgress.media.viewVideo')}</DialogTitle>
                                                                            <video controls autoPlay className="max-h-[75vh] w-auto mx-auto rounded-md">
                                                                                <source src={progress.videoUrl} />
                                                                            </video>
                                                                        </DialogContent>
                                                                    </Dialog>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            "-"
                                                        )}
                                                    </td>
                                                    <td className="px-3 py-2 align-top text-center">
                                                        {isCompleted ? (
                                                            <div className="flex items-center justify-center gap-2">
                                                                <EditProgressDialog
                                                                    progress={progress!}
                                                                    onSuccess={handleEditSuccess}
                                                                    onSeasonDetailUpdate={handleSeasonDetailUpdate}
                                                                    existingProgress={progressList.map((p) => ({ progressId: p.progressId, progressDate: p.progressDate }))}
                                                                    triggerButton={
                                                                        <Button variant="outline" size="sm" className="border-neutral-300">{t('cropProgress.progressTable.actions.edit')}</Button>
                                                                    }
                                                                />
                                                            </div>
                                                        ) : ready ? (
                                                            <CreateProgressDialog
                                                                detailId={cropSeasonDetailId}
                                                                existingProgress={progressList.map((p) => ({ stageCode: p.stageCode }))}
                                                                onSuccess={handleCreateSuccess}
                                                                onSeasonDetailUpdate={handleSeasonDetailUpdate}
                                                                triggerButton={
                                                                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">{t('cropProgress.progressTable.actions.record')}</Button>
                                                                }
                                                            />
                                                        ) : (
                                                            <span className="text-xs text-neutral-500">{t('cropProgress.progressTable.actions.noAction')}</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
