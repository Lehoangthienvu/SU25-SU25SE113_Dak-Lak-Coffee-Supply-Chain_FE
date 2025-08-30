"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
    Sprout,
    Flower2,
    Apple,
    TrendingUp,
    ShoppingBasket,
    Clock,
    Camera,
    Video,
    Play,
    X,
    CheckCircle,
    Calendar,
    FileText,
    User,
    Edit,
    Plus,
    Trash2,
    AlertTriangle
} from "lucide-react";
import { CropProgressViewAllDto, deleteCropProgress } from "@/lib/api/cropProgress";
import { CropStage } from "@/lib/api/cropStage";
import { CreateProgressDialog } from "@/app/dashboard/farmer/crop-progress/components/CreateProgressDialog";
import { EditProgressDialog } from "@/app/dashboard/farmer/crop-progress/components/EditProgressDialog";
import { AppToast } from "@/components/ui/AppToast";

interface Props {
    progressList: CropProgressViewAllDto[];
    cropSeasonDetailId: string;
    onReload: () => void;
    onSeasonDetailUpdate?: (newYield: number) => void;
    totalStages?: number;
    allStages?: CropStage[];
}

const STAGE_ICONS = {
    PLANTING: <Sprout className="w-6 h-6 text-green-600" />,
    FLOWERING: <Flower2 className="w-6 h-6 text-pink-500" />,
    FRUITING: <Apple className="w-6 h-6 text-red-500" />,
    RIPENING: <TrendingUp className="w-6 h-6 text-orange-500" />,
    HARVESTING: <ShoppingBasket className="w-6 h-6 text-amber-600" />
};

const STAGE_NAMES_VI = {
    PLANTING: "Gieo trồng",
    FLOWERING: "Ra hoa",
    FRUITING: "Đậu quả",
    RIPENING: "Chín",
    HARVESTING: "Thu hoạch"
};

const STAGE_COLORS = {
    PLANTING: "from-green-500 to-emerald-600",
    FLOWERING: "from-pink-500 to-rose-600",
    FRUITING: "from-red-500 to-pink-600",
    RIPENING: "from-orange-500 to-red-600",
    HARVESTING: "from-amber-500 to-orange-600"
};

export default function TimelineProgress({
    progressList,
    cropSeasonDetailId,
    onReload,
    onSeasonDetailUpdate,
    totalStages = 5,
    allStages = []
}: Props) {
    const [mediaDialog, setMediaDialog] = useState<{
        isOpen: boolean;
        type: 'image' | 'video';
        url: string | null;
        title: string;
    }>({
        isOpen: false,
        type: 'image',
        url: null,
        title: ''
    });

    const [deleteDialog, setDeleteDialog] = useState<{
        isOpen: boolean;
        progressId: string | null;
        progressName: string;
    }>({
        isOpen: false,
        progressId: null,
        progressName: ''
    });

    const [deleting, setDeleting] = useState(false);

    const getStageIcon = (stageCode: string) => {
        const normalizedCode = stageCode.toUpperCase();
        if (allStages.length > 0) {
            const stage = allStages.find(s => s.stageCode.toUpperCase() === normalizedCode);
            if (stage) {
                return STAGE_ICONS[normalizedCode as keyof typeof STAGE_ICONS] || <Clock className="w-6 h-6 text-gray-600" />;
            }
        }
        return STAGE_ICONS[normalizedCode as keyof typeof STAGE_ICONS] || <Clock className="w-6 h-6 text-gray-600" />;
    };

    const getStageColor = (stageCode: string) => {
        const normalizedCode = stageCode.toUpperCase();
        if (allStages.length > 0) {
            const stage = allStages.find(s => s.stageCode.toUpperCase() === normalizedCode);
            if (stage) {
                return STAGE_COLORS[normalizedCode as keyof typeof STAGE_COLORS] || "from-gray-400 to-slate-500";
            }
        }
        return STAGE_COLORS[normalizedCode as keyof typeof STAGE_COLORS] || "from-gray-400 to-slate-500";
    };

    const formatDate = (date?: string) => {
        if (!date) return "Chưa cập nhật";
        return new Date(date).toLocaleDateString("vi-VN");
    };

    const getNextStage = () => {
        const completedStages = progressList.map(p => p.stageCode.toUpperCase());

        if (allStages.length > 0) {
            const sortedStages = [...allStages].sort((a, b) => a.orderIndex - b.orderIndex);
            return sortedStages.find(stage => !completedStages.includes(stage.stageCode.toUpperCase()))?.stageCode;
        }

        return null; // Return null if no stages available
    };

    const openMediaDialog = (type: 'image' | 'video', url: string, title: string) => {
        if (!url || url.trim() === '') {
            return;
        }
        setMediaDialog({
            isOpen: true,
            type,
            url: url.trim(),
            title
        });
    };

    const closeMediaDialog = () => {
        setMediaDialog({
            isOpen: false,
            type: 'image',
            url: null,
            title: ''
        });
    };

    const openDeleteDialog = (progressId: string, progressName: string) => {
        setDeleteDialog({
            isOpen: true,
            progressId,
            progressName
        });
    };

    const closeDeleteDialog = () => {
        setDeleteDialog({
            isOpen: false,
            progressId: null,
            progressName: ''
        });
    };

    const handleDelete = async () => {
        if (!deleteDialog.progressId) return;

        try {
            setDeleting(true);
            await deleteCropProgress(deleteDialog.progressId);
            AppToast.success("Đã xóa tiến độ thành công!");
            closeDeleteDialog();
            onReload();
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Lỗi khi xóa tiến độ!";
            AppToast.error(errorMessage);
        } finally {
            setDeleting(false);
        }
    };

    const nextStage = getNextStage();
    const completionPercentage = totalStages > 0 ? Math.round((progressList.length / totalStages) * 100) : 0;

    return (
        <div className="space-y-8">
            {/* Progress Overview */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-3xl p-6 border border-blue-200">
                <div className="text-center space-y-4">
                    <h3 className="text-2xl font-bold text-blue-900">Tổng quan tiến độ</h3>
                    <div className="flex items-center justify-center gap-8">
                        <div className="text-center">
                            <div className="text-3xl font-bold text-blue-600">{progressList.length}</div>
                            <div className="text-sm text-blue-600">Đã hoàn thành</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-green-600">{totalStages}</div>
                            <div className="text-sm text-green-600">Tổng giai đoạn</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-orange-600">{completionPercentage}%</div>
                            <div className="text-sm text-orange-600">Hoàn thành</div>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-green-500 to-emerald-600 rounded-full transition-all duration-1000 ease-out"
                            style={{ width: `${completionPercentage}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Next Stage Action */}
            {nextStage && (
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-3xl p-6 border border-emerald-200">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
                                {getStageIcon(nextStage)}
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-emerald-900">Giai đoạn tiếp theo</h3>
                                <p className="text-lg text-emerald-700">
                                    {(() => {
                                        if (allStages.length > 0 && nextStage) {
                                            const stage = allStages.find(s => s.stageCode.toUpperCase() === nextStage.toUpperCase());
                                            return stage ? stage.stageName : nextStage;
                                        }
                                        return STAGE_NAMES_VI[nextStage as keyof typeof STAGE_NAMES_VI] || nextStage;
                                    })()}
                                </p>
                            </div>
                        </div>
                        <CreateProgressDialog
                            detailId={cropSeasonDetailId}
                            existingProgress={progressList}
                            onSuccess={onReload}
                            onSeasonDetailUpdate={onSeasonDetailUpdate}
                            triggerButton={
                                <Button
                                    size="lg"
                                    className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg"
                                >
                                    <Plus className="w-5 h-5 mr-2" />
                                    Ghi nhận tiến độ
                                </Button>
                            }
                        />
                    </div>
                </div>
            )}

            {/* Timeline */}
            <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-8 top-0 bottom-0 w-1 bg-gradient-to-b from-green-400 via-blue-400 to-purple-400 rounded-full" />

                <div className="space-y-8">
                    {progressList.map((progress, index) => (
                        <div key={progress.progressId} className="relative">
                            {/* Timeline dot */}
                            <div className="absolute left-8 top-8 w-6 h-6 bg-white border-4 border-green-500 rounded-full -translate-x-3 z-10 shadow-lg" />

                            {/* Content card */}
                            <div className="ml-16 bg-white rounded-2xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300">
                                <div className="flex items-start justify-between mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center bg-gradient-to-br ${getStageColor(progress.stageCode)} shadow-lg`}>
                                            {getStageIcon(progress.stageCode)}
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-800 mb-1">
                                                {progress.stageName}
                                            </h3>
                                            <div className="flex items-center gap-4 text-sm text-gray-600">
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-4 h-4" />
                                                    {formatDate(progress.progressDate)}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                                    Giai đoạn {index + 1}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <EditProgressDialog
                                            progress={progress}
                                            onSuccess={onReload}
                                            onSeasonDetailUpdate={onSeasonDetailUpdate}
                                            triggerButton={
                                                <Button size="sm" variant="ghost" className="text-gray-600 hover:text-gray-800 hover:bg-gray-100">
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                            }
                                        />
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="text-red-600 hover:text-red-800 hover:bg-red-100"
                                            onClick={() => openDeleteDialog(progress.progressId, progress.stageName)}
                                            aria-label={`Xóa tiến độ ${progress.stageName}`}
                                            onKeyDown={(e) => e.key === 'Enter' && openDeleteDialog(progress.progressId, progress.stageName)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>

                                {/* Progress details */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                            <Calendar className="w-5 h-5 text-emerald-600" />
                                            <div>
                                                <p className="text-sm text-emerald-600">Ngày cập nhật</p>
                                                <p className="font-medium text-emerald-900">{formatDate(progress.progressDate)}</p>
                                            </div>
                                        </div>
                                        {progress.actualYield && (
                                            <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-xl">
                                                <TrendingUp className="w-5 h-5 text-orange-600" />
                                                <div>
                                                    <p className="text-sm text-orange-600">Sản lượng</p>
                                                    <p className="font-medium text-orange-900">{progress.actualYield} kg</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-3">
                                        {progress.photoUrl && progress.photoUrl.trim() !== '' && (
                                            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
                                                <Camera className="w-5 h-5 text-blue-600" />
                                                <span className="text-blue-700">Có ảnh</span>
                                            </div>
                                        )}
                                        {progress.videoUrl && progress.videoUrl.trim() !== '' && (
                                            <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-xl">
                                                <Video className="w-5 h-5 text-purple-600" />
                                                <span className="text-purple-700">Có video</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Notes */}
                                {progress.note && (
                                    <div className="bg-gray-50 rounded-xl p-4 mb-6">
                                        <div className="flex items-center gap-2 mb-2">
                                            <FileText className="w-4 h-4 text-gray-600" />
                                            <span className="text-sm font-medium text-gray-600">Ghi chú</span>
                                        </div>
                                        <p className="text-gray-800 whitespace-pre-line">{progress.note}</p>
                                    </div>
                                )}

                                {/* Media previews */}
                                {(progress.photoUrl || progress.videoUrl) && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                                        {progress.photoUrl && progress.photoUrl.trim() !== '' && (
                                            <div
                                                className="relative cursor-pointer group"
                                                onClick={() => openMediaDialog('image', progress.photoUrl, `${progress.stageName} - Ảnh`)}
                                                onKeyDown={(e) => e.key === 'Enter' && openMediaDialog('image', progress.photoUrl, `${progress.stageName} - Ảnh`)}
                                                role="button"
                                                tabIndex={0}
                                                aria-label={`Xem ảnh ${progress.stageName}`}
                                            >
                                                <div className="relative overflow-hidden rounded-xl border-2 border-gray-200 hover:border-green-400 transition-all">
                                                    <img
                                                        src={progress.photoUrl}
                                                        alt={`Ảnh ${progress.stageName}`}
                                                        className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-300"
                                                        onError={(e) => {
                                                            const target = e.target as HTMLImageElement;
                                                            target.style.display = 'none';
                                                            target.parentElement!.innerHTML = '<div class="w-full h-32 flex items-center justify-center bg-gray-100 rounded-xl"><Camera class="w-8 h-8 text-gray-400" /></div>';
                                                        }}
                                                    />
                                                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                                        <Camera className="w-8 h-8 text-white opacity-80 group-hover:opacity-100" />
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        {progress.videoUrl && progress.videoUrl.trim() !== '' && (
                                            <div
                                                className="relative cursor-pointer group"
                                                onClick={() => openMediaDialog('video', progress.videoUrl, `${progress.stageName} - Video`)}
                                                onKeyDown={(e) => e.key === 'Enter' && openMediaDialog('video', progress.videoUrl, `${progress.stageName} - Video`)}
                                                role="button"
                                                tabIndex={0}
                                                aria-label={`Xem video ${progress.stageName}`}
                                            >
                                                <div className="relative overflow-hidden rounded-xl border-2 border-gray-200 hover:border-green-400 transition-all">
                                                    <video
                                                        src={progress.videoUrl}
                                                        className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-300"
                                                        onError={(e) => {
                                                            const target = e.target as HTMLVideoElement;
                                                            target.style.display = 'none';
                                                            target.parentElement!.innerHTML = '<div class="w-full h-32 flex items-center justify-center bg-gray-100 rounded-xl"><Video class="w-8 h-8 text-gray-400" /></div>';
                                                        }}
                                                    />
                                                    <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                                        <Play className="w-8 h-8 text-white opacity-80 group-hover:opacity-100" />
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Updated by info */}
                                {progress.updatedByName && (
                                    <div className="text-sm text-gray-500 flex items-center gap-2 pt-2 border-t border-gray-100">
                                        <User className="w-4 h-4" />
                                        Cập nhật bởi: <span className="font-medium">{progress.updatedByName}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Media Dialog */}
            <Dialog open={mediaDialog.isOpen} onOpenChange={closeMediaDialog}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
                    <DialogTitle className="flex items-center justify-between">
                        <span>{mediaDialog.title}</span>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={closeMediaDialog}
                            className="h-8 w-8 p-0"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </DialogTitle>
                    <div className="flex items-center justify-center p-4">
                        {mediaDialog.url && mediaDialog.url.trim() !== '' ? (
                            mediaDialog.type === 'image' ? (
                                <img
                                    src={mediaDialog.url}
                                    alt={mediaDialog.title}
                                    className="max-w-full max-h-full object-contain rounded-lg"
                                />
                            ) : (
                                <video
                                    src={mediaDialog.url}
                                    controls
                                    className="max-w-full max-h-full rounded-lg"
                                    autoPlay
                                >
                                    Trình duyệt của bạn không hỗ trợ video.
                                </video>
                            )
                        ) : (
                            <div className="text-center text-gray-500">
                                <p>Không thể hiển thị media</p>
                                <p className="text-sm">URL không hợp lệ hoặc bị thiếu</p>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialog.isOpen} onOpenChange={closeDeleteDialog}>
                <DialogContent className="max-w-md">
                    <DialogTitle className="flex items-center gap-2 text-red-600">
                        <AlertTriangle className="w-5 h-5" />
                        Xác nhận xóa tiến độ
                    </DialogTitle>
                    <div className="space-y-4">
                        <p className="text-gray-700">
                            Bạn có chắc chắn muốn xóa tiến độ <strong>"{deleteDialog.progressName}"</strong>?
                        </p>
                        <p className="text-sm text-gray-500">
                            Hành động này không thể hoàn tác. Tất cả dữ liệu liên quan sẽ bị xóa vĩnh viễn.
                        </p>
                        <div className="flex justify-end gap-3 pt-4">
                            <Button
                                variant="outline"
                                onClick={closeDeleteDialog}
                                disabled={deleting}
                            >
                                Hủy
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={handleDelete}
                                disabled={deleting}
                            >
                                {deleting ? (
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Đang xóa...
                                    </div>
                                ) : (
                                    "Xóa tiến độ"
                                )}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
