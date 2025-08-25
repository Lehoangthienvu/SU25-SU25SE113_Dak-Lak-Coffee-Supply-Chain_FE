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
import { CropSeasonDetail, getCropSeasonDetailById } from "@/lib/api/cropSeasonDetail";
import { CropStage, getCropStages } from "@/lib/api/cropStage";
import { ArrowLeft, CalendarDays, FileText, Play } from "lucide-react";

export default function CropProgressPage() {
    const router = useRouter();
    const params = useParams();
    const cropSeasonDetailId = params?.id as string;

    const [progressList, setProgressList] = useState<CropProgressViewAllDto[]>([]);
    const [seasonDetail, setSeasonDetail] = useState<CropSeasonDetail | null>(null);
    const [allStages, setAllStages] = useState<CropStage[]>([]);
    const [loading, setLoading] = useState(true);

    const [currentHarvestYield, setCurrentHarvestYield] = useState<number>(0);

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

    const handleSeasonDetailUpdate = useCallback((newYield: number) => {
        setCurrentHarvestYield(newYield);
    }, []);





    useEffect(() => {
        reloadData();
        loadSeasonDetail();

        const loadStages = async () => {
            try {
                const stages = await getCropStages();
                setAllStages(stages);
            } catch {
                AppToast.error("Không thể tải danh sách giai đoạn.");
            }
        };
        loadStages();
    }, [reloadData, loadSeasonDetail]);

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
                    <p className="text-gray-600">Đang tải...</p>
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
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Không tìm thấy vùng trồng</h3>
                    <p className="text-gray-600 mb-4">Vùng trồng không tồn tại hoặc đã bị xóa</p>
                    <Button onClick={() => router.push('/dashboard/farmer/crop-seasons')}>
                        Quay lại danh sách
                    </Button>
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
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => router.push('/dashboard/farmer/crop-seasons')}
                            >
                                <ArrowLeft className="w-4 h-4" />
                            </Button>
                            <div className="flex items-center gap-3">
                                <div className="w-1 h-8 bg-gradient-to-b from-orange-500 to-amber-500 rounded-full"></div>
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-800 line-clamp-2">
                                        Tiến độ mùa vụ - {seasonDetail.typeName}
                                    </h1>
                                    <p className="text-gray-600 text-sm">
                                        Theo dõi và ghi nhận tiến độ phát triển
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="text-right">
                                <p className="text-sm text-gray-500">Sản lượng thu hoạch</p>
                                <p className="text-lg font-bold text-green-600">{currentHarvestYield} kg</p>
                            </div>
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
                            Bảng tiến độ
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gradient-to-r from-orange-50 to-amber-50 text-gray-700 font-semibold">
                                    <tr>
                                        <th className="px-3 py-3 text-left">Giai đoạn</th>
                                        <th className="px-3 py-3 text-center">Trạng thái</th>
                                        <th className="px-3 py-3 text-center">Ngày ghi nhận</th>
                                        <th className="px-3 py-3 text-left">Ghi chú</th>
                                        <th className="px-3 py-3 text-center">Tài liệu</th>
                                        <th className="px-3 py-3 text-center">Hành động</th>
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
                                                            Hoàn thành
                                                        </Badge>
                                                    ) : ready ? (
                                                        <Badge variant="outline" className="text-xs">
                                                            Sẵn sàng
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="secondary" className="text-xs">
                                                            Chưa mở
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
                                                                            title="Xem ảnh"
                                                                        >
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
                                                                        <button
                                                                            className="h-14 w-20 border border-neutral-200 rounded-md overflow-hidden hover:border-neutral-300 relative"
                                                                            title="Xem video"
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
                                                        </div>
                                                    ) : ready ? (
                                                        <CreateProgressDialog
                                                            detailId={cropSeasonDetailId}
                                                            existingProgress={progressList.map((p) => ({ stageCode: p.stageCode }))}
                                                            onSuccess={handleCreateSuccess}
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
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
