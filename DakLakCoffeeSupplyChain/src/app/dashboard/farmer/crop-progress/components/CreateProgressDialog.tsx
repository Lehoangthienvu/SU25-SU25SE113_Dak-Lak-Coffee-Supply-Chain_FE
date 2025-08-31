"use client";

import { useEffect, useState, useCallback } from "react";
import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { AppToast } from "@/components/ui/AppToast";
import { Upload, X, Leaf, Camera, Play, AlertTriangle, Target } from "lucide-react";
import { useTranslation } from "react-i18next";

import { createCropProgress, CropProgressCreateRequest } from "@/lib/api/cropProgress";
import { getCropStages, CropStage } from "@/lib/api/cropStage";
import { getCropSeasonDetailById, CropSeasonDetail } from "@/lib/api/cropSeasonDetail";

// Constants
const HARVESTING_STAGE_CODE = "harvesting";

type Props = {
    detailId: string;
    existingProgress: { stageCode: string }[];
    onSuccess: () => void;
    disabled?: boolean;
    onStagesLoaded?: (availableStagesCount: number) => void;
    onSeasonDetailUpdate?: (newYield: number | null) => void;
    triggerButton?: React.ReactNode
};

export function CreateProgressDialog({
    detailId,
    onSuccess,
    existingProgress,
    disabled,
    onStagesLoaded,
    onSeasonDetailUpdate,
    triggerButton
}: Props) {
    const { t } = useTranslation();
    const [note, setNote] = useState("");
    const [stageOptions, setStageOptions] = useState<CropStage[]>([]);
    const [stageId, setStageId] = useState<number | null>(null);
    const [progressDate, setProgressDate] = useState<string>("");
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [actualYield, setActualYield] = useState<number | undefined>(undefined);
    const [mediaFiles, setMediaFiles] = useState<File[]>([]);
    const [cropSeasonDetail, setCropSeasonDetail] = useState<CropSeasonDetail | null>(null);
    const [yieldValidationError, setYieldValidationError] = useState<string>("");
    const [yieldValidationSeverity, setYieldValidationSeverity] = useState<'error' | 'warning' | 'info'>('info');
    const [error, setError] = useState<string | null>(null);

    const [stageOrder, setStageOrder] = useState<string[]>([]);
    const [localExistingProgress, setLocalExistingProgress] = useState(existingProgress || []);

    // Validation constants
    const MAX_YIELD_OVERFLOW_PERCENT = 150; // Sản lượng thu hoạch không được vượt quá 150% dự kiến
    const MIN_YIELD_PERCENT = 30; // Sản lượng thu hoạch không được dưới 30% dự kiến
    const WARNING_YIELD_PERCENT = 70; // Sản lượng dưới 70% cần cảnh báo
    const COMMITMENT_THRESHOLD = 80; // Ngưỡng tối thiểu để đạt cam kết

    const getNextStage = (stages: string[] = stageOrder) => {
        // Tìm giai đoạn tiếp theo cần tạo
        const createdStageCodes = (localExistingProgress ?? []).map(p => p.stageCode);

        // Debug logging
        console.log('Debug getNextStage:', {
            existingProgress,
            localExistingProgress,
            createdStageCodes,
            stageOrder,
            stages,
            existingProgressLength: existingProgress?.length || 0,
            localExistingProgressLength: localExistingProgress?.length || 0
        });

        // Tìm giai đoạn đầu tiên chưa được tạo
        const nextStage = stages.find(stageCode =>
            !createdStageCodes.includes(stageCode)
        );

        console.log('  nextStage:', nextStage);
        return nextStage;
    };

    const loadStageOptions = useCallback(async () => {
        try {
            setError(null);
            const stages = await getCropStages();

            // Set stage order from API
            const orderedStages = stages
                .sort((a, b) => a.orderIndex - b.orderIndex)
                .map(s => s.stageCode);
            setStageOrder(orderedStages);

            // Tìm giai đoạn tiếp theo cần tạo (sử dụng orderedStages thay vì stageOrder)
            const nextStageCode = getNextStage(orderedStages);

            console.log('loadStageOptions - nextStageCode:', nextStageCode);

            if (nextStageCode) {
                // Chỉ hiển thị giai đoạn tiếp theo
                const nextStage = stages.find(stage => stage.stageCode === nextStageCode);
                console.log('loadStageOptions - nextStage found:', nextStage);
                if (nextStage) {
                    setStageOptions([nextStage]);
                    // Tự động chọn giai đoạn tiếp theo
                    setStageId(nextStage.stageId);
                }
            } else {
                // Nếu đã hoàn thành tất cả giai đoạn
                console.log('loadStageOptions - All stages completed');
                setStageOptions([]);
                setStageId(null);
            }

            if (onStagesLoaded) {
                onStagesLoaded(stages.length);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Không thể tải danh sách giai đoạn.';
            setError(errorMessage);
            AppToast.error(errorMessage);
        }
    }, [onStagesLoaded, existingProgress]);

    const loadCropSeasonDetail = useCallback(async () => {
        try {
            setError(null);
            const detail = await getCropSeasonDetailById(detailId);
            setCropSeasonDetail(detail);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Không thể tải chi tiết mùa vụ.';
            setError(errorMessage);
            AppToast.error(errorMessage);
        }
    }, [detailId]);

    useEffect(() => {
        console.log('Dialog useEffect triggered:', { open, existingProgressLength: existingProgress?.length || 0 });
        if (open) {
            // Cập nhật local state khi dialog mở
            setLocalExistingProgress(existingProgress || []);
            loadStageOptions();
            loadCropSeasonDetail();
            setProgressDate(new Date().toISOString().split("T")[0]);
        }
    }, [open, loadStageOptions, loadCropSeasonDetail, existingProgress]);

    // Cập nhật lại khi stageOrder thay đổi
    useEffect(() => {
        if (open && stageOrder.length > 0) {
            console.log('StageOrder changed, recalculating next stage');
            const nextStageCode = getNextStage();
            console.log('Recalculated nextStageCode:', nextStageCode);

            // Load lại stages để có đầy đủ thông tin
            getCropStages().then(stages => {
                if (nextStageCode) {
                    const nextStage = stages.find(stage => stage.stageCode === nextStageCode);
                    if (nextStage) {
                        setStageOptions([nextStage]);
                        setStageId(nextStage.stageId);
                    }
                } else {
                    setStageOptions([]);
                    setStageId(null);
                }
            });
        }
    }, [stageOrder, open]);

    // Validation function for actual yield with different severity levels and commitment impact
    const validateActualYield = (yieldValue: number): {
        error: string;
        severity: 'error' | 'warning' | 'info';
        canComplete: boolean;
        commitmentStatus: 'achieved' | 'partial' | 'failed';
        recommendation: string;
    } => {
        if (!cropSeasonDetail?.estimatedYield || cropSeasonDetail.estimatedYield <= 0) {
            return {
                error: "",
                severity: 'info',
                canComplete: true,
                commitmentStatus: 'achieved',
                recommendation: "Không có dữ liệu dự kiến để so sánh"
            };
        }

        const estimatedYield = cropSeasonDetail.estimatedYield;
        const percentage = (yieldValue / estimatedYield) * 100;

        // Trường hợp vượt quá giới hạn trên - KHÔNG CHO PHÉP
        if (percentage > MAX_YIELD_OVERFLOW_PERCENT) {
            return {
                error: `Sản lượng thu hoạch (${yieldValue} kg) vượt quá ${MAX_YIELD_OVERFLOW_PERCENT}% so với dự kiến (${estimatedYield} kg). Vui lòng kiểm tra lại hoặc liên hệ quản lý để điều chỉnh chỉ tiêu.`,
                severity: 'error',
                canComplete: false,
                commitmentStatus: 'failed',
                recommendation: "Liên hệ quản lý để điều chỉnh chỉ tiêu hoặc kiểm tra lại dữ liệu"
            };
        }

        // Trường hợp dưới mức tối thiểu - KHÔNG CHO PHÉP
        if (percentage < MIN_YIELD_PERCENT) {
            return {
                error: `Sản lượng thu hoạch (${yieldValue} kg) chỉ đạt ${percentage.toFixed(1)}% so với dự kiến (${estimatedYield} kg). Sản lượng quá thấp có thể ảnh hưởng đến hiệu quả sản xuất và cam kết. Vui lòng kiểm tra lại hoặc ghi chú lý do.`,
                severity: 'error',
                canComplete: false,
                commitmentStatus: 'failed',
                recommendation: "Không thể hoàn thành mùa vụ với sản lượng này. Cần kiểm tra lại hoặc liên hệ quản lý"
            };
        }

        // Trường hợp dưới ngưỡng cam kết - CẢNH BÁO MẠNH
        if (percentage < COMMITMENT_THRESHOLD) {
            return {
                error: `Sản lượng thu hoạch (${yieldValue} kg) chỉ đạt ${percentage.toFixed(1)}% so với dự kiến (${estimatedYield} kg). KHÔNG ĐẠT CAM KẾT với doanh nghiệp. Vui lòng ghi chú lý do cụ thể và liên hệ quản lý.`,
                severity: 'warning',
                canComplete: true, // Vẫn cho phép hoàn thành nhưng cảnh báo
                commitmentStatus: 'failed',
                recommendation: "Cần liên hệ quản lý để điều chỉnh cam kết hoặc tìm giải pháp thay thế"
            };
        }

        // Trường hợp dưới mức cảnh báo - CẢNH BÁO NHẸ
        if (percentage < WARNING_YIELD_PERCENT) {
            return {
                error: `Sản lượng thu hoạch (${yieldValue} kg) đạt ${percentage.toFixed(1)}% so với dự kiến (${estimatedYield} kg). Sản lượng thấp hơn dự kiến nhưng vẫn đạt cam kết. Vui lòng ghi chú lý do nếu cần.`,
                severity: 'warning',
                canComplete: true,
                commitmentStatus: 'partial',
                recommendation: "Có thể hoàn thành mùa vụ nhưng cần ghi chú lý do sản lượng thấp"
            };
        }

        // Trường hợp trong phạm vi chấp nhận được
        return {
            error: "",
            severity: 'info',
            canComplete: true,
            commitmentStatus: 'achieved',
            recommendation: "Sản lượng đạt yêu cầu, có thể hoàn thành mùa vụ"
        };
    };

    // Handle actual yield change with validation
    const handleActualYieldChange = (value: string) => {
        const numericValue = value ? parseFloat(value) : undefined;
        setActualYield(numericValue);

        if (numericValue && numericValue > 0) {
            const validation = validateActualYield(numericValue);
            setYieldValidationError(validation.error);
            setYieldValidationSeverity(validation.severity);
        } else {
            setYieldValidationError("");
            setYieldValidationSeverity('info');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!stageId) {
            AppToast.error("Vui lòng chọn giai đoạn.");
            return;
        }

        // Validate progress date
        if (!progressDate) {
            AppToast.error("Vui lòng chọn ngày ghi nhận.");
            return;
        }

        const selectedDate = new Date(progressDate);
        const today = new Date();
        today.setHours(23, 59, 59, 999); // Set to end of today

        // Check if date is in the future
        if (selectedDate > today) {
            AppToast.error("Ngày ghi nhận không được lớn hơn hôm nay.");
            return;
        }

        // Check if date is too far in the past (1 year)
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        if (selectedDate < oneYearAgo) {
            AppToast.error("Ngày ghi nhận không được quá xa trong quá khứ (tối đa 1 năm trước).");
            return;
        }

        // Note: Date order validation will be handled by backend
        // Frontend can't validate this properly since we only have stageCode in existingProgress

        // Validate actual yield if it's harvesting stage
        if (stageId && stageOptions.find(s => s.stageId === stageId)?.stageCode?.toLowerCase() === HARVESTING_STAGE_CODE) {
            if (!actualYield || actualYield <= 0) {
                AppToast.error("Vui lòng nhập sản lượng thu hoạch hợp lệ (> 0).");
                return;
            }

            const validation = validateActualYield(actualYield);

            // Chặn submit nếu có lỗi nghiêm trọng
            if (validation.severity === 'error') {
                AppToast.error(t('cropProgress.createDialog.error'));
                return;
            }

            // Cảnh báo về commitment nếu có warning
            if (validation.severity === 'warning') {
                let confirmMessage = `Sản lượng thu hoạch (${actualYield} kg) thấp hơn dự kiến.\n\n`;

                if (validation.commitmentStatus === 'failed') {
                    confirmMessage += `🚨 QUAN TRỌNG: KHÔNG ĐẠT CAM KẾT với doanh nghiệp!\n`;
                    confirmMessage += `📋 Bạn cần ghi chú lý do cụ thể và liên hệ quản lý.\n\n`;
                } else {
                    confirmMessage += `⚠️ Cảnh báo: Sản lượng thấp hơn dự kiến.\n`;
                }

                confirmMessage += `Lý do: ${validation.error}\n\n`;
                confirmMessage += `Khuyến nghị: ${validation.recommendation}\n\n`;
                confirmMessage += t('cropProgress.createDialog.confirmMessage');

                const confirmed = window.confirm(confirmMessage);
                if (!confirmed) {
                    return;
                }
            }
        }

        try {
            setLoading(true);
            setError(null);

            const createData: CropProgressCreateRequest = {
                cropSeasonDetailId: detailId,
                stageId: stageId,
                progressDate: progressDate,
                notes: note,
                // Chỉ gửi sản lượng khi là giai đoạn thu hoạch
                actualYield: stageOptions.find(s => s.stageId === stageId)?.stageCode?.toLowerCase() === HARVESTING_STAGE_CODE ? actualYield : undefined,
                mediaFiles: mediaFiles,
            };

            await createCropProgress(createData);
            AppToast.success("Tạo tiến độ thành công!");
            setOpen(false);
            resetForm();
            onSuccess();

            // Cập nhật sản lượng nếu là giai đoạn thu hoạch và có sản lượng
            if (onSeasonDetailUpdate) {
                onSeasonDetailUpdate(actualYield || null);
            }
        } catch (error: unknown) {
            let errorMessage = "Tạo tiến độ thất bại.";
            if (typeof error === 'object' && error !== null && 'response' in error) {
                const response = (error as { response?: { data?: { message?: string } } }).response;
                if (response?.data?.message) {
                    errorMessage = response.data.message;
                }
            }
            setError(errorMessage);
            AppToast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setNote("");
        setStageId(null);
        setProgressDate("");
        setActualYield(undefined);
        setMediaFiles([]);
        setYieldValidationError("");
        setYieldValidationSeverity('info');
    };

    const validateFile = (file: File): string | null => {
        // Check file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            return "File quá lớn. Tối đa 10MB.";
        }

        // Check file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/avi', 'video/mov'];
        if (!allowedTypes.includes(file.type)) {
            return "Chỉ hỗ trợ file ảnh (JPEG, PNG, WebP) và video (MP4, AVI, MOV).";
        }

        return null;
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);

        // Validate each file
        for (const file of files) {
            const error = validateFile(file);
            if (error) {
                AppToast.error(error);
                return;
            }
        }

        setMediaFiles(prev => [...prev, ...files]);
    };

    const removeFile = (index: number) => {
        setMediaFiles(prev => prev.filter((_, i) => i !== index));
    };

    const getFileIcon = (file: File) => {
        if (file.type.startsWith("image/")) {
            return <Camera className="w-4 h-4 text-gray-600" />;
        } else if (file.type.startsWith("video/")) {
            return <Play className="w-4 h-4 text-gray-600" />;
        }
        return <Leaf className="w-4 h-4 text-gray-600" />;
    };

    const getFilePreview = (file: File) => {
        if (file.type.startsWith("image/")) {
            return (
                <img
                    src={URL.createObjectURL(file)}
                    alt="Preview"
                    className="w-full h-20 object-cover rounded-lg border border-gray-200"
                />
            );
        } else if (file.type.startsWith("video/")) {
            return (
                <video
                    src={URL.createObjectURL(file)}
                    className="w-full h-20 object-cover rounded-lg border border-gray-200"
                    controls
                />
            );
        }
        return (
            <div className="w-full h-20 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
                <Leaf className="w-8 h-8 text-gray-400" />
            </div>
        );
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {triggerButton || (
                    <Button disabled={disabled} className="bg-gray-700 hover:bg-gray-800">
                        {t('cropProgress.createDialog.newProgress')}
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto p-0">
                <form onSubmit={handleSubmit} className="w-full">
                    {/* Header - Simple gray */}
                    <div className="bg-gray-700 p-4 flex items-center gap-4">
                        <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                            <Leaf className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <DialogTitle className="text-white font-bold text-lg">
                                {stageOptions.length > 0
                                    ? t('cropProgress.createDialog.title')
                                    : t('cropProgress.createDialog.completedTitle', { defaultValue: "Hoàn thành mùa vụ" })
                                }
                            </DialogTitle>
                            <p className="text-gray-300 text-xs">
                                {stageOptions.length > 0
                                    ? t('cropProgress.createDialog.description')
                                    : t('cropProgress.createDialog.completedDescription', { defaultValue: "Chúc mừng! Bạn đã hoàn thành tất cả các giai đoạn" })
                                }
                            </p>
                        </div>
                    </div>

                    {/* Content - 3 columns horizontal layout */}
                    <div className="p-6">
                        {/* Error Display */}
                        {error && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                                <div className="flex items-center gap-2 text-red-800">
                                    <AlertTriangle className="w-4 h-4" />
                                    <span className="text-sm font-medium">Lỗi</span>
                                </div>
                                <p className="text-sm text-red-700 mt-1">{error}</p>
                            </div>
                        )}

                        {/* Main form - 2 columns horizontal layout */}
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">

                            {/* Column 1 - Basic Info */}
                            <div className="space-y-3">
                                <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                    <div className="w-4 h-4 bg-gray-100 rounded flex items-center justify-center">
                                        <Leaf className="w-3 h-3 text-gray-600" />
                                    </div>
                                    Thông tin cơ bản
                                </h3>

                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                            Giai đoạn tiếp theo
                                        </label>
                                        {stageOptions.length > 0 ? (
                                            <div className="space-y-2">
                                                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                                    <div className="flex items-center gap-2 text-green-800">
                                                        <Leaf className="w-4 h-4" />
                                                        <span className="text-sm font-medium">
                                                            {stageOptions[0]?.stageName}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-green-600 mt-1">
                                                        Giai đoạn tiếp theo cần thực hiện
                                                    </p>
                                                    {/* Hiển thị tiến trình giai đoạn */}
                                                    <div className="mt-3 pt-3 border-t border-green-200">
                                                        <div className="flex items-center justify-between text-xs">
                                                            <span className="text-green-700">Tiến trình:</span>
                                                            <span className="text-green-800 font-medium">
                                                                {localExistingProgress.length + 1}/{stageOrder.length} giai đoạn
                                                            </span>
                                                        </div>
                                                        <div className="mt-2 w-full bg-green-200 rounded-full h-2">
                                                            <div
                                                                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                                                                style={{ width: `${((localExistingProgress.length + 1) / stageOrder.length) * 100}%` }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                </div>
                                                {/* Hidden select để giữ logic */}
                                                <Select
                                                    value={stageId?.toString() || ""}
                                                    onValueChange={(value) => setStageId(parseInt(value))}
                                                    disabled
                                                >
                                                    <SelectTrigger className="w-full h-10 text-sm hidden">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {stageOptions.map((stage) => (
                                                            <SelectItem key={stage.stageId} value={stage.stageId.toString()}>
                                                                {stage.stageName}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        ) : (
                                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                                <div className="flex items-center gap-2 text-blue-800">
                                                    <Target className="w-4 h-4" />
                                                    <span className="text-sm font-medium">
                                                        Đã hoàn thành tất cả giai đoạn
                                                    </span>
                                                </div>
                                                <p className="text-xs text-blue-600 mt-1">
                                                    Chúc mừng! Bạn đã hoàn thành tất cả các giai đoạn của mùa vụ này.
                                                </p>
                                                {/* Hiển thị tiến trình hoàn thành */}
                                                <div className="mt-3 pt-3 border-t border-blue-200">
                                                    {(() => {
                                                        console.log('Debug progress display:');
                                                        console.log('  existingProgress.length:', existingProgress.length);
                                                        console.log('  stageOrder.length:', stageOrder.length);
                                                        console.log('  progress percentage:', (existingProgress.length / stageOrder.length) * 100);
                                                        return null;
                                                    })()}
                                                    <div className="flex items-center justify-between text-xs">
                                                        <span className="text-blue-700">Tiến trình:</span>
                                                        <span className="text-blue-800 font-medium">
                                                            {stageOrder.length}/{stageOrder.length} giai đoạn
                                                        </span>
                                                    </div>
                                                    <div className="mt-2 w-full bg-blue-200 rounded-full h-2">
                                                        <div
                                                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                                            style={{ width: '100%' }}
                                                        ></div>
                                                    </div>
                                                    <p className="text-xs text-blue-600 mt-2">
                                                        🎉 100% hoàn thành!
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {stageOptions.length > 0 && (
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                                Ngày thực hiện <span className="text-red-500">*</span>
                                            </label>
                                            <Input
                                                type="date"
                                                value={progressDate}
                                                onChange={(e) => setProgressDate(e.target.value)}
                                                required
                                                max={new Date().toISOString().split('T')[0]} // Không cho phép chọn ngày trong tương lai
                                                className="w-full h-10 text-sm"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">
                                                Chọn ngày thực hiện giai đoạn này (không được lớn hơn hôm nay)
                                            </p>
                                        </div>
                                    )}

                                    {/* Chỉ hiển thị sản lượng khi chọn giai đoạn thu hoạch */}
                                    {stageId && stageOptions.find(s => s.stageId === stageId)?.stageCode?.toLowerCase() === HARVESTING_STAGE_CODE && (
                                        <div className="space-y-2">
                                            {/* Hiển thị thông tin sản lượng dự kiến */}
                                            {cropSeasonDetail?.estimatedYield && cropSeasonDetail.estimatedYield > 0 && (
                                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                                    <div className="flex items-center gap-2 text-blue-800">
                                                        <Target className="w-4 h-4" />
                                                        <span className="text-sm font-medium">Sản lượng dự kiến: {cropSeasonDetail.estimatedYield} kg</span>
                                                    </div>
                                                    <div className="mt-2 space-y-1 text-xs text-blue-600">
                                                        <p>📊 <strong>Phạm vi chấp nhận:</strong></p>
                                                        <div className="ml-4 space-y-1">
                                                            <p>• <span className="text-green-600">✅ Tốt:</span> 80% - 150% dự kiến (Đạt cam kết)</p>
                                                            <p>• <span className="text-yellow-600">⚠️ Cảnh báo:</span> 70% - 80% dự kiến (Đạt cam kết một phần)</p>
                                                            <p>• <span className="text-orange-600">🚨 Cảnh báo mạnh:</span> 30% - 80% dự kiến (KHÔNG đạt cam kết)</p>
                                                            <p>• <span className="text-red-600">❌ Không cho phép:</span> Dưới 30% hoặc trên 150% dự kiến</p>
                                                        </div>
                                                        <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                                                            <p className="text-yellow-800 text-xs">
                                                                <strong>⚠️ Lưu ý:</strong> Sản lượng dưới 80% sẽ KHÔNG đạt cam kết với doanh nghiệp
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                                    Sản lượng thu hoạch (kg) <span className="text-red-500">*</span>
                                                </label>
                                                <Input
                                                    type="number"
                                                    value={actualYield || ""}
                                                    onChange={(e) => handleActualYieldChange(e.target.value)}
                                                    min={0}
                                                    step="any"
                                                    className={`w-full h-10 text-sm ${yieldValidationError ?
                                                        (yieldValidationSeverity === 'error' ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : 'border-yellow-300 focus:border-yellow-500 focus:ring-yellow-200')
                                                        : ''
                                                        }`}
                                                    placeholder="Nhập sản lượng thu hoạch..."
                                                />
                                                {yieldValidationError && (
                                                    <div className={`flex items-start gap-2 mt-2 p-2 rounded-md ${yieldValidationSeverity === 'error'
                                                        ? 'bg-red-50 border border-red-200'
                                                        : 'bg-yellow-50 border border-yellow-200'
                                                        }`}>
                                                        <AlertTriangle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${yieldValidationSeverity === 'error' ? 'text-red-500' : 'text-yellow-500'
                                                            }`} />
                                                        <div className="flex-1">
                                                            <p className={`text-xs leading-relaxed ${yieldValidationSeverity === 'error' ? 'text-red-700' : 'text-yellow-700'
                                                                }`}>
                                                                {yieldValidationError}
                                                            </p>
                                                            {yieldValidationSeverity === 'warning' && actualYield && cropSeasonDetail?.estimatedYield && (
                                                                <div className="mt-2 space-y-1">
                                                                    {(() => {
                                                                        const validation = validateActualYield(actualYield);
                                                                        if (validation.commitmentStatus === 'failed') {
                                                                            return (
                                                                                <div className="p-2 bg-red-50 border border-red-200 rounded">
                                                                                    <p className="text-xs text-red-700 font-medium">
                                                                                        🚨 KHÔNG ĐẠT CAM KẾT với doanh nghiệp!
                                                                                    </p>
                                                                                    <p className="text-xs text-red-600 mt-1">
                                                                                        Khuyến nghị: {validation.recommendation}
                                                                                    </p>
                                                                                </div>
                                                                            );
                                                                        } else if (validation.commitmentStatus === 'partial') {
                                                                            return (
                                                                                <div className="p-2 bg-yellow-50 border border-yellow-200 rounded">
                                                                                    <p className="text-xs text-yellow-700 font-medium">
                                                                                        ⚠️ Đạt cam kết một phần
                                                                                    </p>
                                                                                    <p className="text-xs text-yellow-600 mt-1">
                                                                                        Khuyến nghị: {validation.recommendation}
                                                                                    </p>
                                                                                </div>
                                                                            );
                                                                        }
                                                                        return null;
                                                                    })()}
                                                                    <p className="text-xs text-yellow-600 mt-1 font-medium">
                                                                        ⚠️ Bạn vẫn có thể tiếp tục, nhưng vui lòng ghi chú lý do cụ thể.
                                                                    </p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                                {!yieldValidationError && actualYield && actualYield > 0 && cropSeasonDetail?.estimatedYield && (
                                                    <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md">
                                                        <div className="flex items-center gap-2 text-green-700">
                                                            <span className="text-xs font-medium">
                                                                ✅ Đạt {((actualYield / cropSeasonDetail.estimatedYield) * 100).toFixed(1)}% so với dự kiến
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {stageOptions.length > 0 && (
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                                Ghi chú
                                            </label>
                                            <Textarea
                                                value={note}
                                                onChange={(e) => setNote(e.target.value)}
                                                placeholder="Mô tả chi tiết về giai đoạn, điều kiện môi trường, phương pháp chăm sóc..."
                                                className="w-full min-h-[80px] text-sm resize-none"
                                                rows={3}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Column 2 - Media Upload */}
                            {stageOptions.length > 0 && (
                                <div className="space-y-3">
                                    <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                        <div className="w-4 h-4 bg-gray-100 rounded flex items-center justify-center">
                                            <Camera className="w-3 h-3 text-gray-600" />
                                        </div>
                                        Tài liệu minh họa
                                    </h3>

                                    <div className="space-y-3">
                                        {/* Photo upload */}
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                                Ảnh minh hoạ
                                            </label>
                                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 text-center hover:border-gray-500 transition-colors bg-gray-50">
                                                <input
                                                    type="file"
                                                    multiple
                                                    accept="image/*"
                                                    onChange={handleFileChange}
                                                    className="hidden"
                                                    id="photo-upload"
                                                />
                                                <label
                                                    htmlFor="photo-upload"
                                                    className="text-xs text-gray-600 cursor-pointer hover:text-gray-800 flex flex-col items-center gap-1"
                                                >
                                                    <Upload className="w-5 h-5 text-gray-400" />
                                                    Chọn ảnh
                                                </label>
                                            </div>
                                        </div>

                                        {/* Video upload */}
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                                Video minh hoạ
                                            </label>
                                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 text-center hover:border-gray-500 transition-colors bg-gray-50">
                                                <input
                                                    type="file"
                                                    multiple
                                                    accept="video/*"
                                                    onChange={handleFileChange}
                                                    className="hidden"
                                                    id="video-upload"
                                                />
                                                <label
                                                    htmlFor="video-upload"
                                                    className="text-xs text-gray-600 cursor-pointer hover:text-gray-800 flex flex-col items-center gap-1"
                                                >
                                                    <Upload className="w-5 h-5 text-gray-400" />
                                                    Chọn video
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                        </div>

                        {/* Media previews - Horizontal layout */}
                        {stageOptions.length > 0 && mediaFiles.length > 0 && (
                            <div className="mb-6">
                                <h4 className="text-sm font-medium text-gray-700 mb-3">Xem trước tài liệu:</h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                                    {mediaFiles.map((file, index) => (
                                        <div key={index} className="relative group">
                                            {getFilePreview(file)}
                                            <button
                                                type="button"
                                                onClick={() => removeFile(index)}
                                                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                                aria-label="Xóa file"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                            <div className="absolute bottom-1 left-1">
                                                {getFileIcon(file)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Submit button and info */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                            {stageOptions.length > 0 && (
                                <div className="flex items-center gap-4 text-xs text-gray-600">
                                    <div className="flex items-center gap-1">
                                        <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span>Tối đa 10 files, 50MB</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span>Ảnh tự động nén</span>
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setOpen(false)}
                                    className="px-6 py-3"
                                >
                                    {stageOptions.length > 0 ? "Hủy" : "Đóng"}
                                </Button>
                                {stageOptions.length > 0 && (
                                    <Button
                                        type="submit"
                                        disabled={loading}
                                        className="px-8 py-3 bg-gray-700 hover:bg-gray-800 text-white font-medium rounded-lg transition-colors"
                                    >
                                        {loading ? (
                                            <div className="flex items-center gap-2">
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                Đang lưu...
                                            </div>
                                        ) : (
                                            `Ghi nhận ${stageOptions[0]?.stageName}`
                                        )}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}