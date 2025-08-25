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
    deleteCropProgress,
    getCropProgressesByDetailId,
} from "@/lib/api/cropProgress";
import { CreateProgressDialog } from "../components/CreateProgressDialog";
import { EditProgressDialog } from "../components/EditProgressDialog";
import { CropSeasonDetail, getCropSeasonDetailById } from "@/lib/api/cropSeasonDetail";
import { CropStage, getCropStages } from "@/lib/api/cropStage";
import { ArrowLeft, CalendarDays, FileText, Play } from "lucide-react";

const HARVESTING_STAGE_CODE = "harvesting";

export default function CropProgressPage() {
    const router = useRouter();
    const params = useParams();
    const cropSeasonDetailId = params?.id as string;

    const [progressList, setProgressList] = useState<CropProgressViewAllDto[]>([]);
    const [seasonDetail, setSeasonDetail] = useState<CropSeasonDetail | null>(null);
    const [allStages, setAllStages] = useState<CropStage[]>([]);
    const [loading, setLoading] = useState(true);

    const [currentHarvestYield, setCurrentHarvestYield] = useState<number>(0);
    const [availableStagesCount, setAvailableStagesCount] = useState<number>(0);

    const reloadData = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getCropProgressesByDetailId(cropSeasonDetailId);
            setProgressList(data);
        } catch (error: unknown) {
            if (typeof error === "object" && error !== null && "response" in error) {
                const response = (error as { response?: { status?: number } }).response;
                if (response?.status !== 404) {
                    AppToast.error("Đã xảy ra lỗi khi tải dữ liệu tiến độ.");
                }
            }
            setProgressList([]);
        } finally {
            setLoading(false);
        }
    }, [cropSeasonDetailId]);

    const loadSeasonDetail = useCallback(async () => {
        try {
            const detail = await getCropSeasonDetailById(cropSeasonDetailId);
            setSeasonDetail(detail);
            if (detail?.actualYield) setCurrentHarvestYield(detail.actualYield);
        } catch {
            AppToast.error("Không thể lấy thông tin vùng trồng.");
        }
    }, [cropSeasonDetailId]);

    const handleEditSuccess = useCallback(() => {
        reloadData();
        loadSeasonDetail();
    }, [reloadData, loadSeasonDetail]);

    const handleCreateSuccess = useCallback(() => {
        reloadData();
        loadSeasonDetail();
    }, [reloadData, loadSeasonDetail]);

    const handleSeasonDetailUpdate = useCallback(
        (newYield: number) => {
            setCurrentHarvestYield(newYield);
            if (seasonDetail) setSeasonDetail({ ...seasonDetail, actualYield: newYield });
        },
        [seasonDetail]
    );

    const handleStagesLoaded = useCallback((count: number) => {
        setAvailableStagesCount(count);
    }, []);

    useEffect(() => {
        if (!cropSeasonDetailId) return;
        reloadData();
        loadSeasonDetail();
        getCropStages()
            .then((stages) => {
                setAllStages(stages);
                setAvailableStagesCount(stages.length);
            })
            .catch(() => AppToast.error("Không thể tải danh sách giai đoạn."));
    }, [cropSeasonDetailId, reloadData, loadSeasonDetail]);

    useEffect(() => {
        if (allStages.length > 0) setAvailableStagesCount(allStages.length);
    }, [allStages]);

    const formatDate = (date: string | undefined) => {
        if (!date) return "-";
        const d = new Date(date);
        return isNaN(d.getTime()) ? "-" : d.toLocaleDateString("vi-VN");
    };

    const getProgressForStage = (stageCode: string) =>
        progressList.find((p) => p.stageCode?.toLowerCase() === stageCode.toLowerCase());

    const canCreateStage = (stageCode: string) => {
        const order = ["planting", "flowering", "fruiting", "ripening", "harvesting"];
        const normalized = stageCode.toLowerCase();
        const idx = order.indexOf(normalized);
        if (idx === -1) return false;

        const requiredPrevious = order.slice(0, idx);
        const hasAllPrevious = requiredPrevious.every((code) =>
            progressList.some((p) => p.stageCode?.toLowerCase() === code)
        );
        const already = progressList.some((p) => p.stageCode?.toLowerCase() === normalized);
        return hasAllPrevious && !already;
    };

    const sortedStages = [...allStages].sort((a, b) => {
        const order = ["planting", "flowering", "fruiting", "ripening", "harvesting"];
        const aIndex = order.indexOf(a.stageCode.toLowerCase());
        const bIndex = order.indexOf(b.stageCode.toLowerCase());
        if (aIndex === -1 && bIndex === -1) return 0;
        if (aIndex === -1) return 1;
        if (bIndex === -1) return -1;
        return aIndex - bIndex;
    });

    const completionPercentage = availableStagesCount > 0
        ? Math.round((progressList.length / availableStagesCount) * 100)
        : 0;

    return (
        <div className="min-h-screen bg-orange-50">
            <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <Button variant="ghost" onClick={() => router.back()} className="text-neutral-700">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Quay lại
                    </Button>
                    <Button
                        onClick={() => router.push(`/dashboard/farmer/request-feedback/create?detailId=${cropSeasonDetailId}`)}
                        className="bg-orange-600 hover:bg-orange-700 text-white"
                    >
                        📝 Gửi báo cáo tiến độ
                    </Button>
                </div>

                <Card className="border-orange-200">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-semibold text-neutral-900">
                            Tiến độ canh tác
                        </CardTitle>
                        <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-neutral-600">
                            <div>Tổng giai đoạn: <span className="font-medium text-neutral-800">{availableStagesCount}</span></div>
                            <div>Đã ghi nhận: <span className="font-medium text-neutral-800">{progressList.length}</span></div>
                            <div>Sản lượng (thu hoạch): <span className="font-medium text-neutral-800">{currentHarvestYield > 0 ? `${currentHarvestYield} kg` : "-"}</span></div>
                        </div>
                    </CardHeader>

                    <CardContent>
                        {loading ? (
                            <div className="py-10 text-center text-sm text-neutral-600">Đang tải dữ liệu…</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-orange-100 text-neutral-700">
                                        <tr>
                                            <th className="px-3 py-2 text-left font-medium">#</th>
                                            <th className="px-3 py-2 text-left font-medium">Giai đoạn</th>
                                            <th className="px-3 py-2 text-left font-medium">Trạng thái</th>
                                            <th className="px-3 py-2 text-left font-medium">Ngày</th>
                                            <th className="px-3 py-2 text-left font-medium">Ghi chú</th>
                                            <th className="px-3 py-2 text-left font-medium">Ảnh/Vidieo</th>
                                            <th className="px-3 py-2 text-center font-medium">Hành động</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-200">
                                        {sortedStages.map((stage, idx) => {
                                            const progress = getProgressForStage(stage.stageCode);
                                            const isCompleted = !!progress;
                                            const ready = canCreateStage(stage.stageCode);

                                            return (
                                                <tr key={stage.stageId} className="bg-white">
                                                    <td className="px-3 py-2 align-top text-neutral-700">{idx + 1}</td>
                                                    <td className="px-3 py-2 align-top">
                                                        <div className="font-medium text-neutral-900">{stage.stageName}</div>
                                                        {stage.description && (
                                                            <div className="text-xs text-neutral-500">{stage.description}</div>
                                                        )}
                                                    </td>
                                                    <td className="px-3 py-2 align-top">
                                                        {isCompleted ? (
                                                            <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">Đã ghi nhận</Badge>
                                                        ) : ready ? (
                                                            <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200">Sẵn sàng</Badge>
                                                        ) : (
                                                            <Badge variant="secondary" className="bg-neutral-100 text-neutral-600 border-neutral-200">Chờ</Badge>
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
                                                                            <button className="h-14 w-20 border border-neutral-200 rounded-md overflow-hidden hover:border-neutral-300">
                                                                                <img src={progress.photoUrl} alt="Ảnh" className="h-full w-full object-cover" />
                                                                            </button>
                                                                        </DialogTrigger>
                                                                        <DialogContent className="max-w-4xl">
                                                                            <DialogTitle className="sr-only">Xem ảnh</DialogTitle>
                                                                            <img src={progress.photoUrl} alt="Ảnh lớn" className="max-h-[75vh] w-auto object-contain mx-auto" />
                                                                        </DialogContent>
                                                                    </Dialog>
                                                                )}
                                                                {progress?.videoUrl && (
                                                                    <Dialog>
                                                                        <DialogTrigger asChild>
                                                                            <button className="h-14 w-20 border border-neutral-200 rounded-md overflow-hidden hover:border-neutral-300 relative">
                                                                                <video muted playsInline className="h-full w-full object-cover">
                                                                                    <source src={progress.videoUrl} />
                                                                                </video>
                                                                                <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                                                                                    <Play className="w-5 h-5 text-white" />
                                                                                </div>
                                                                            </button>
                                                                        </DialogTrigger>
                                                                        <DialogContent className="max-w-5xl">
                                                                            <DialogTitle className="sr-only">Xem video</DialogTitle>
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
                                                                    triggerButton={
                                                                        <Button variant="outline" size="sm" className="border-neutral-300">Sửa</Button>
                                                                    }
                                                                />
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="border-red-300 text-red-600"
                                                                    onClick={async () => {
                                                                        const confirmDelete = confirm("Bạn chắc chắn muốn xoá tiến độ này?");
                                                                        if (!confirmDelete) return;
                                                                        try {
                                                                            await deleteCropProgress(progress!.progressId);
                                                                            AppToast.success("Xoá tiến độ thành công!");
                                                                            reloadData();
                                                                        } catch (error: unknown) {
                                                                            let errorMessage = "Xoá thất bại.";
                                                                            if (typeof error === "object" && error !== null && "response" in error) {
                                                                                const response = (error as { response?: { data?: { message?: string } } }).response;
                                                                                if (response?.data?.message) errorMessage = response.data.message;
                                                                            }
                                                                            AppToast.error(errorMessage);
                                                                        }
                                                                    }}
                                                                >
                                                                    Xoá
                                                                </Button>
                                                            </div>
                                                        ) : ready ? (
                                                            <CreateProgressDialog
                                                                detailId={cropSeasonDetailId}
                                                                existingProgress={progressList.map((p) => ({ stageCode: p.stageCode }))}
                                                                onSuccess={handleCreateSuccess}
                                                                onStagesLoaded={handleStagesLoaded}
                                                                onSeasonDetailUpdate={handleSeasonDetailUpdate}
                                                                triggerButton={
                                                                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">Ghi nhận</Button>
                                                                }
                                                            />
                                                        ) : (
                                                            <span className="text-xs text-neutral-500">—</span>
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
