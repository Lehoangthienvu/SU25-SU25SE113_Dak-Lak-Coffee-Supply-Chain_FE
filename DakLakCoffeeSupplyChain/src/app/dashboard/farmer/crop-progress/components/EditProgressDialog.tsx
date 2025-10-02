"use client";

import { useEffect, useState } from "react";
import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Pencil, Leaf, Camera, Play, AlertTriangle } from "lucide-react";
import { AppToast } from "@/components/ui/AppToast";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { CropProgressViewAllDto, updateCropProgress, CropProgressUpdateRequest } from "@/lib/api/cropProgress";
import { getCropSeasonDetailById, CropSeasonDetail } from "@/lib/api/cropSeasonDetail";

// Constants
const HARVESTING_STAGE_CODE = "harvesting";

// Validation constants
const MAX_YIELD_OVERFLOW_PERCENT = 150; // Sản lượng thu hoạch không được vượt quá 150% dự kiến
const MIN_YIELD_PERCENT = 30; // Sản lượng thu hoạch không được dưới 30% dự kiến
const WARNING_YIELD_PERCENT = 70; // Sản lượng dưới 70% cần cảnh báo
const COMMITMENT_THRESHOLD = 80; // Ngưỡng tối thiểu để đạt cam kết

type Props = {
    progress: CropProgressViewAllDto;
    onSuccess: () => void;
    onSeasonDetailUpdate?: (newYield: number | null) => void;
    triggerButton?: React.ReactNode;
    existingProgress?: { progressId: string; progressDate: string }[]; // Thêm để validate ngày trùng
};

export function EditProgressDialog({
    progress,
    onSuccess,
    onSeasonDetailUpdate,
    triggerButton,
    existingProgress = [],
}: Props) {
    const { t } = useTranslation();
    const [note, setNote] = useState("");
    const [progressDate, setProgressDate] = useState<string>("");
    const [actualYield, setActualYield] = useState<number | undefined>(undefined);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    // Thêm state cho yield validation
    const [cropSeasonDetail, setCropSeasonDetail] = useState<CropSeasonDetail | null>(null);
    const [yieldValidationError, setYieldValidationError] = useState<string>("");
    const [yieldValidationSeverity, setYieldValidationSeverity] = useState<'error' | 'warning' | 'info'>('info');

    useEffect(() => {
        if (open) {
            setNote(progress.note || "");
            setProgressDate(progress.progressDate || "");
            setActualYield(progress.actualYield);
            setFieldErrors({}); // Reset field errors when opening

            // Load crop season detail for validation
            const loadCropSeasonDetail = async () => {
                try {
                    const detail = await getCropSeasonDetailById(progress.cropSeasonDetailId);
                    setCropSeasonDetail(detail);
                } catch (error) {
                    console.error('Error loading crop season detail:', error);
                }
            };
            loadCropSeasonDetail();
        }
    }, [open, progress]);

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
                recommendation: t('cropProgress.editDialog.yieldValidation.noData')
            };
        }

        const estimatedYield = cropSeasonDetail.estimatedYield;
        const percentage = (yieldValue / estimatedYield) * 100;

        // Trường hợp vượt quá giới hạn trên - KHÔNG CHO PHÉP
        if (percentage > MAX_YIELD_OVERFLOW_PERCENT) {
            return {
                error: t('cropProgress.editDialog.yieldValidation.overflowError', {
                    actual: yieldValue,
                    max: MAX_YIELD_OVERFLOW_PERCENT,
                    estimated: estimatedYield
                }),
                severity: 'error',
                canComplete: false,
                commitmentStatus: 'failed',
                recommendation: t('cropProgress.editDialog.yieldValidation.overflowRecommendation')
            };
        }

        // Trường hợp dưới mức tối thiểu - KHÔNG CHO PHÉP
        if (percentage < MIN_YIELD_PERCENT) {
            return {
                error: t('cropProgress.editDialog.yieldValidation.underflowError', {
                    actual: yieldValue,
                    percent: percentage.toFixed(1),
                    estimated: estimatedYield
                }),
                severity: 'error',
                canComplete: false,
                commitmentStatus: 'failed',
                recommendation: t('cropProgress.editDialog.yieldValidation.underflowRecommendation')
            };
        }

        // Trường hợp dưới ngưỡng cam kết - CẢNH BÁO MẠNH
        if (percentage < COMMITMENT_THRESHOLD) {
            return {
                error: t('cropProgress.editDialog.yieldValidation.commitmentFailed', {
                    actual: yieldValue,
                    percent: percentage.toFixed(1),
                    estimated: estimatedYield
                }),
                severity: 'warning',
                canComplete: true, // Vẫn cho phép hoàn thành nhưng cảnh báo
                commitmentStatus: 'failed',
                recommendation: t('cropProgress.editDialog.yieldValidation.commitmentFailedRecommendation')
            };
        }

        // Trường hợp dưới mức cảnh báo - CẢNH BÁO NHẸ
        if (percentage < WARNING_YIELD_PERCENT) {
            return {
                error: t('cropProgress.editDialog.yieldValidation.warningLow', {
                    actual: yieldValue,
                    percent: percentage.toFixed(1),
                    estimated: estimatedYield
                }),
                severity: 'warning',
                canComplete: true,
                commitmentStatus: 'partial',
                recommendation: t('cropProgress.editDialog.yieldValidation.warningLowRecommendation')
            };
        }

        // Trường hợp trong phạm vi chấp nhận được
        return {
            error: "",
            severity: 'info',
            canComplete: true,
            commitmentStatus: 'achieved',
            recommendation: t('cropProgress.editDialog.yieldValidation.success')
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

    // Thêm function validate từng field
    const validateField = (fieldName: string, value: string | number | null | undefined): string | null => {
        switch (fieldName) {
            case 'progressDate':
                if (!value) return t('cropProgress.editDialog.validation.selectDate');

                const selectedDate = new Date(value);
                const today = new Date();
                today.setHours(23, 59, 59, 999);

                // Không cho phép ngày trong tương lai
                if (selectedDate > today) {
                    return t('cropProgress.editDialog.validation.dateNotFuture');
                }

                // Không cho phép ngày quá xa trong quá khứ (1 năm)
                const oneYearAgo = new Date();
                oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
                if (selectedDate < oneYearAgo) {
                    return t('cropProgress.editDialog.validation.dateTooPast');
                }

                // Validate ngày không được trùng với các progress khác
                const dateString = selectedDate.toISOString().split('T')[0]; // Format: YYYY-MM-DD
                const duplicateProgress = existingProgress.find(p =>
                    p.progressDate === dateString && p.progressId !== progress.progressId
                );

                if (duplicateProgress) {
                    return t('cropProgress.editDialog.validation.duplicateDate');
                }

                // Note: Validation ngày theo mùa vụ sẽ được handle bởi backend
                // Backend sẽ kiểm tra ngày progress không được trước startDate của mùa vụ
                // Frontend chỉ validate ngày tương lai và quá khứ để UX tốt hơn

                return null;
            case 'actualYield':
                if (progress.stageCode?.toLowerCase() === HARVESTING_STAGE_CODE) {
                    if (!value || (typeof value === 'number' && value <= 0)) return t('cropProgress.editDialog.validation.yieldRequired');
                }
                return null;
            default:
                return null;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Clear previous field errors
        setFieldErrors({});

        // Validate fields
        const newFieldErrors: Record<string, string> = {};

        // Validate progressDate
        const progressDateError = validateField('progressDate', progressDate);
        if (progressDateError) {
            newFieldErrors.progressDate = progressDateError;
        }

        // Validate actualYield
        const actualYieldError = validateField('actualYield', actualYield);
        if (actualYieldError) {
            newFieldErrors.actualYield = actualYieldError;
        }

        // Set field errors
        setFieldErrors(newFieldErrors);

        // Nếu có lỗi validation, không submit
        if (Object.keys(newFieldErrors).length > 0) {
            return;
        }

        // Validate actual yield if it's harvesting stage
        if (progress.stageCode?.toLowerCase() === HARVESTING_STAGE_CODE) {
            if (!actualYield || actualYield <= 0) {
                setFieldErrors(prev => ({ ...prev, actualYield: t('cropProgress.editDialog.validation.yieldRequired') }));
                return;
            }

            const validation = validateActualYield(actualYield);

            // Chặn submit nếu có lỗi nghiêm trọng
            if (validation.severity === 'error') {
                AppToast.error(t('cropProgress.editDialog.error'));
                return;
            }

            // Cảnh báo về commitment nếu có warning
            if (validation.severity === 'warning') {
                let commitmentMessage = '';
                if (validation.commitmentStatus === 'failed') {
                    commitmentMessage = `🚨 QUAN TRỌNG: ${t('cropProgress.editDialog.yieldValidation.commitmentNotAchieved')}\n📋 Bạn cần ghi chú lý do cụ thể và liên hệ quản lý.\n\n`;
                } else {
                    commitmentMessage = `⚠️ Cảnh báo: Sản lượng thấp hơn dự kiến.\n`;
                }

                const confirmMessage = t('cropProgress.editDialog.yieldValidation.confirmLowYield', {
                    actual: actualYield,
                    commitmentMessage,
                    reason: validation.error,
                    recommendation: validation.recommendation,
                    confirmMessage: t('cropProgress.editDialog.confirmMessage')
                });

                const confirmed = window.confirm(confirmMessage);
                if (!confirmed) {
                    return;
                }
            }
        }


        try {
            setLoading(true);

            const updateData: CropProgressUpdateRequest = {
                progressId: progress.progressId,
                cropSeasonDetailId: progress.cropSeasonDetailId,
                stageId: progress.stageId,
                stageDescription: progress.stageDescription,
                progressDate,
                note,
                // Chỉ gửi sản lượng khi là giai đoạn thu hoạch
                actualYield: progress.stageCode?.toLowerCase() === HARVESTING_STAGE_CODE ? actualYield : undefined,
                // Giữ nguyên media files hiện tại
                photoUrl: progress.photoUrl || "",
                videoUrl: progress.videoUrl || "",
            };

            await updateCropProgress(progress.progressId, updateData);

            // Cập nhật sản lượng nếu là giai đoạn thu hoạch và có thay đổi
            if (progress.stageCode?.toLowerCase() === HARVESTING_STAGE_CODE &&
                actualYield !== progress.actualYield) {
                try {
                    await getCropSeasonDetailById(progress.cropSeasonDetailId);
                    if (onSeasonDetailUpdate) {
                        onSeasonDetailUpdate(actualYield || null);
                    }
                } catch (error) {
                    console.error("Error updating season detail:", error);
                }
            }

            AppToast.success(t('cropProgress.editDialog.success'));
            setOpen(false);
            onSuccess();
        } catch (error: unknown) {
            const defaultErrorMessage = t('cropProgress.editDialog.error');
            let errorMessage = defaultErrorMessage;
            const backendFieldErrors: Record<string, string> = {};

            // Ưu tiên lấy message từ Error object (được throw từ API)
            if (error instanceof Error) {
                errorMessage = error.message;
            }

            // Fallback: Tìm message trong string representation của error
            if (errorMessage === defaultErrorMessage && typeof error === 'string') {
                errorMessage = error;
            }

            if (typeof error === 'object' && error !== null && 'response' in error) {
                const response = (error as { response?: { data?: { message?: string; errors?: Record<string, string[]>; title?: string } } }).response;

                if (response?.data) {
                    // Handle validation errors from backend
                    if (response.data.errors && typeof response.data.errors === 'object') {
                        Object.entries(response.data.errors).forEach(([field, messages]) => {
                            if (Array.isArray(messages) && messages.length > 0) {
                                // Map backend field names to frontend field names
                                const frontendField = field === 'ProgressDate' ? 'progressDate' :
                                    field === 'ActualYield' ? 'actualYield' :
                                        field === 'StageId' ? 'stageId' : field;
                                backendFieldErrors[frontendField] = messages[0]; // Take first error message
                            }
                        });
                    }

                    // Handle general error message (chỉ override nếu chưa có message từ Error object)
                    if (errorMessage === defaultErrorMessage) {
                        if (response.data.message) {
                            errorMessage = response.data.message;
                        } else if (response.data.title) {
                            errorMessage = response.data.title;
                        }
                    }
                }
            }


            // Nếu có backend field errors, hiển thị inline
            if (Object.keys(backendFieldErrors).length > 0) {
                setFieldErrors(backendFieldErrors);
                // Cũng hiển thị toast để user biết có lỗi
                AppToast.error(errorMessage);
            } else {
                // Nếu không có field errors cụ thể, cố gắng map general message thành field error
                if (errorMessage.includes('Ngày ghi nhận không được trước ngày bắt đầu mùa vụ') ||
                    errorMessage.includes('Ngày ghi nhận không được sau ngày kết thúc mùa vụ') ||
                    errorMessage.includes('Ngày ghi nhận không được lớn hơn hôm nay') ||
                    errorMessage.includes('Ngày ghi nhận không được quá xa trong quá khứ')) {
                    setFieldErrors({ progressDate: errorMessage });
                } else {
                    AppToast.error(errorMessage);
                }
            }
        } finally {
            setLoading(false);
        }
    };



    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {triggerButton || (
                    <Button variant="outline" size="sm">
                        {t('cropProgress.editDialog.button')}
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto p-0">
                <form onSubmit={handleSubmit} className="w-full">
                    {/* Header - Simple gray */}
                    <div className="bg-gray-700 p-4 flex items-center gap-4">
                        <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                            <Pencil className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <DialogTitle className="text-white font-bold text-lg">
                                {t('cropProgress.editDialog.title')}
                            </DialogTitle>
                            <p className="text-gray-300 text-xs">
                                {t('cropProgress.editDialog.description')}: {progress.stageName}
                            </p>
                        </div>
                    </div>

                    {/* Content - 3 columns horizontal layout */}
                    <div className="p-6">


                        {/* Info row */}
                        <div className="mb-4 p-3 border rounded-lg bg-gray-50 border-gray-200">
                            <div className="flex items-center gap-2 text-xs text-gray-700">
                                <div className="w-2 h-2 rounded-full bg-gray-500"></div>
                                <span className="font-medium">{t('cropProgress.editDialog.currentStageInfo')}</span>
                                <span><strong>{progress.stageName}</strong></span>
                                <span className="ml-4">{t('cropProgress.editDialog.createdDate')}: {progress.progressDate ? new Date(progress.progressDate).toLocaleDateString("vi-VN") : t('cropProgress.editDialog.noDate')}</span>
                            </div>
                        </div>

                        {/* Main form - 2 columns horizontal layout */}
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">

                            {/* Column 1 - Basic Info */}
                            <div className="space-y-3">
                                <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                    <div className="w-4 h-4 bg-gray-100 rounded flex items-center justify-center">
                                        <Leaf className="w-3 h-3 text-gray-600" />
                                    </div>
                                    {t('cropProgress.editDialog.basicInfo')}
                                </h3>

                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                            {t('cropProgress.editDialog.stage')}
                                        </label>
                                        <div className="w-full h-10 bg-gray-50 border border-gray-200 rounded-md px-3 flex items-center text-sm text-gray-700 font-medium">
                                            {progress.stageName}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                            {t('cropProgress.editDialog.executionDate')}
                                        </label>
                                        <Input
                                            type="date"
                                            value={progressDate}
                                            onChange={(e) => {
                                                setProgressDate(e.target.value);
                                                // Clear field error when user starts typing
                                                if (fieldErrors.progressDate) {
                                                    setFieldErrors(prev => ({ ...prev, progressDate: '' }));
                                                }
                                                // Real-time validation
                                                if (e.target.value) {
                                                    const error = validateField('progressDate', e.target.value);
                                                    if (error) {
                                                        setFieldErrors(prev => ({ ...prev, progressDate: error }));
                                                    }
                                                }
                                            }}
                                            onBlur={() => {
                                                // Validate on blur
                                                if (progressDate) {
                                                    const error = validateField('progressDate', progressDate);
                                                    if (error) {
                                                        setFieldErrors(prev => ({ ...prev, progressDate: error }));
                                                    } else {
                                                        setFieldErrors(prev => ({ ...prev, progressDate: '' }));
                                                    }
                                                }
                                            }}
                                            required
                                            max={new Date().toISOString().split('T')[0]} // Không cho phép chọn ngày trong tương lai
                                            // min attribute được bỏ vì validation ngày mùa vụ sẽ được handle bởi backend
                                            className={cn(
                                                "w-full h-10 text-sm",
                                                fieldErrors.progressDate && "border-red-300 focus:border-red-500 focus:ring-red-200"
                                            )}
                                        />
                                        {fieldErrors.progressDate && (
                                            <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                                                <AlertTriangle className="w-4 h-4" />
                                                {fieldErrors.progressDate}
                                            </p>
                                        )}
                                    </div>

                                    {/* Chỉ hiển thị sản lượng khi là giai đoạn thu hoạch */}
                                    {progress.stageCode?.toLowerCase() === HARVESTING_STAGE_CODE && (
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                                {t('cropProgress.editDialog.yield')}
                                            </label>
                                            <Input
                                                type="number"
                                                value={actualYield || ""}
                                                onChange={(e) => handleActualYieldChange(e.target.value)}
                                                min={0}
                                                step="any"
                                                className={cn(
                                                    "w-full h-10 text-sm",
                                                    fieldErrors.actualYield && "border-red-300 focus:border-red-500 focus:ring-red-200"
                                                )}
                                                placeholder={t('cropProgress.editDialog.yieldPlaceholder')}
                                            />
                                            {/* Backend field error has higher priority */}
                                            {fieldErrors.actualYield && (
                                                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                                                    <AlertTriangle className="w-4 h-4" />
                                                    {fieldErrors.actualYield}
                                                </p>
                                            )}
                                            {/* Yield validation error (only if no backend error) */}
                                            {!fieldErrors.actualYield && yieldValidationError && (
                                                <p className={cn(
                                                    "text-sm mt-1 flex items-center gap-1",
                                                    yieldValidationSeverity === 'error' && "text-red-500",
                                                    yieldValidationSeverity === 'warning' && "text-orange-500",
                                                    yieldValidationSeverity === 'info' && "text-blue-500"
                                                )}>
                                                    <AlertTriangle className="w-4 h-4" />
                                                    {yieldValidationError}
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                            {t('cropProgress.editDialog.notes')}
                                        </label>
                                        <Textarea
                                            value={note}
                                            onChange={(e) => setNote(e.target.value)}
                                            placeholder={t('cropProgress.editDialog.notesPlaceholder')}
                                            className="w-full min-h-[80px] text-sm resize-none"
                                            rows={3}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Column 2 - Current Media */}
                            <div className="space-y-3">
                                <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                    <div className="w-4 h-4 bg-gray-100 rounded flex items-center justify-center">
                                        <Camera className="w-3 h-3 text-gray-600" />
                                    </div>
                                    {t('cropProgress.editDialog.currentMedia')}
                                </h3>

                                <div className="space-y-3">
                                    {/* Hiển thị ảnh và video nhỏ như ngoài giao diện */}
                                    {(progress.photoUrl || progress.videoUrl) && (
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                                {t('cropProgress.editDialog.currentDocument')}
                                            </label>
                                            <div className="flex gap-3">
                                                {progress.photoUrl && progress.photoUrl.trim() !== '' && (
                                                    <div className="relative cursor-pointer group w-60 h-60">
                                                        <div className="relative overflow-hidden rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center">
                                                            <img
                                                                src={progress.photoUrl}
                                                                alt={t('cropProgress.editDialog.currentImage')}
                                                                className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-110"
                                                                onError={(e) => {
                                                                    const target = e.target as HTMLImageElement;
                                                                    target.style.display = 'none';
                                                                    target.parentElement!.innerHTML = '<div class="w-full h-full flex items-center justify-center"><Camera class="w-6 h-6 text-gray-400" /></div>';
                                                                }}
                                                            />

                                                        </div>
                                                    </div>
                                                )}
                                                {progress.videoUrl && progress.videoUrl.trim() !== '' && (
                                                    <div className="relative cursor-pointer group w-60 h-60">
                                                        <div className="relative overflow-hidden rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center">
                                                            <video
                                                                src={progress.videoUrl}
                                                                className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-110"
                                                                onError={(e) => {
                                                                    const target = e.target as HTMLVideoElement;
                                                                    target.style.display = 'none';
                                                                    target.parentElement!.innerHTML = '<div class="w-full h-full flex items-center justify-center"><Play class="w-6 h-6 text-gray-400" /></div>';
                                                                }}
                                                            />
                                                            {/* Icon play luôn hiển thị trên video */}
                                                            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                                                                <Play className="w-8 h-8 text-white" />
                                                            </div>

                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {!progress.photoUrl && !progress.videoUrl && (
                                        <div className="text-center py-8 text-gray-500 text-sm">
                                            {t('cropProgress.editDialog.noDocuments')}
                                        </div>
                                    )}

                                    {/* Thông báo về media */}
                                    {(progress.photoUrl || progress.videoUrl) && (
                                        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                                            <div className="flex items-center gap-2 text-xs text-gray-700">
                                                <div className="w-2 h-2 rounded-full bg-gray-500"></div>
                                                <span className="font-medium">ℹ️ {t('cropProgress.editDialog.mediaNote')}</span>
                                                <span>{t('cropProgress.editDialog.mediaNoteDesc')}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                        </div>

                        {/* Submit button and info */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-4 text-xs text-gray-600">
                                <div className="flex items-center gap-1">
                                    <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span>{t('cropProgress.editDialog.editBasicInfo')}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span>{t('cropProgress.editDialog.keepCurrentMedia')}</span>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setOpen(false)}
                                    className="px-6 py-3"
                                >
                                    {t('cropProgress.editDialog.cancel')}
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="px-8 py-3 bg-gray-700 hover:bg-gray-800 text-white font-medium rounded-lg transition-colors"
                                >
                                    {loading ? (
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            {t('cropProgress.editDialog.updating')}
                                        </div>
                                    ) : (
                                        t('cropProgress.editDialog.updateProgress')
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}