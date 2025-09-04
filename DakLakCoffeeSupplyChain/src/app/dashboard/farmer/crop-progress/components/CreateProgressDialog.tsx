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
import { cn } from "@/lib/utils";

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

    // Thêm state cho field errors
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

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
            const errorMessage = error instanceof Error ? error.message : t('cropProgress.createDialog.validation.loadStagesError');
            setError(errorMessage);
            AppToast.error(errorMessage);
        }
    }, [onStagesLoaded, existingProgress, t]);

    const loadCropSeasonDetail = useCallback(async () => {
        try {
            setError(null);
            const detail = await getCropSeasonDetailById(detailId);
            console.log('Loaded crop season detail:', detail);
            console.log('Expected harvest dates:', {
                start: detail.expectedHarvestStart,
                end: detail.expectedHarvestEnd,
                startType: typeof detail.expectedHarvestStart,
                endType: typeof detail.expectedHarvestEnd
            });
            setCropSeasonDetail(detail);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : t('cropProgress.createDialog.validation.loadSeasonDetailError');
            setError(errorMessage);
            AppToast.error(errorMessage);
        }
    }, [detailId, t]);

    useEffect(() => {
        console.log('Dialog useEffect triggered:', { open, existingProgressLength: existingProgress?.length || 0 });
        if (open) {
            // Cập nhật local state khi dialog mở
            setLocalExistingProgress(existingProgress || []);
            loadStageOptions();
            loadCropSeasonDetail();
            setProgressDate(new Date().toISOString().split("T")[0]);
        }
    }, [open, loadStageOptions, loadCropSeasonDetail, existingProgress, t]);

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

    // Validate fields when they change
    useEffect(() => {
        if (progressDate) {
            const error = validateField('progressDate', progressDate);
            if (error && !fieldErrors.progressDate) {
                setFieldErrors(prev => ({ ...prev, progressDate: error }));
            }
        }
    }, [progressDate]);

    useEffect(() => {
        if (actualYield !== undefined) {
            const error = validateField('actualYield', actualYield);
            if (error && !fieldErrors.actualYield) {
                setFieldErrors(prev => ({ ...prev, actualYield: error }));
            }
        }
    }, [actualYield]);

    useEffect(() => {
        if (note) {
            const error = validateField('notes', note);
            if (error && !fieldErrors.notes) {
                setFieldErrors(prev => ({ ...prev, notes: error }));
            }
        }
    }, [note]);

    useEffect(() => {
        if (mediaFiles.length > 0) {
            const error = validateField('mediaFiles', mediaFiles);
            if (error && !fieldErrors.mediaFiles) {
                setFieldErrors(prev => ({ ...prev, mediaFiles: error }));
            }
        }
    }, [mediaFiles]);

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
                recommendation: t('cropProgress.createDialog.yieldValidation.noData')
            };
        }

        const estimatedYield = cropSeasonDetail.estimatedYield;
        const percentage = (yieldValue / estimatedYield) * 100;

        // Trường hợp vượt quá giới hạn trên - KHÔNG CHO PHÉP
        if (percentage > MAX_YIELD_OVERFLOW_PERCENT) {
            return {
                error: t('cropProgress.createDialog.yieldValidation.overflowError', {
                    actual: yieldValue,
                    max: MAX_YIELD_OVERFLOW_PERCENT,
                    estimated: estimatedYield
                }),
                severity: 'error',
                canComplete: false,
                commitmentStatus: 'failed',
                recommendation: t('cropProgress.createDialog.yieldValidation.overflowRecommendation')
            };
        }

        // Trường hợp dưới mức tối thiểu - KHÔNG CHO PHÉP
        if (percentage < MIN_YIELD_PERCENT) {
            return {
                error: t('cropProgress.createDialog.yieldValidation.underflowError', {
                    actual: yieldValue,
                    percent: percentage.toFixed(1),
                    estimated: estimatedYield
                }),
                severity: 'error',
                canComplete: false,
                commitmentStatus: 'failed',
                recommendation: t('cropProgress.createDialog.yieldValidation.underflowRecommendation')
            };
        }

        // Trường hợp dưới ngưỡng cam kết - CẢNH BÁO MẠNH
        if (percentage < COMMITMENT_THRESHOLD) {
            return {
                error: t('cropProgress.createDialog.yieldValidation.commitmentFailed', {
                    actual: yieldValue,
                    percent: percentage.toFixed(1),
                    estimated: estimatedYield
                }),
                severity: 'warning',
                canComplete: true, // Vẫn cho phép hoàn thành nhưng cảnh báo
                commitmentStatus: 'failed',
                recommendation: t('cropProgress.createDialog.yieldValidation.commitmentFailedRecommendation')
            };
        }

        // Trường hợp dưới mức cảnh báo - CẢNH BÁO NHẸ
        if (percentage < WARNING_YIELD_PERCENT) {
            return {
                error: t('cropProgress.createDialog.yieldValidation.warningLow', {
                    actual: yieldValue,
                    percent: percentage.toFixed(1),
                    estimated: estimatedYield
                }),
                severity: 'warning',
                canComplete: true,
                commitmentStatus: 'partial',
                recommendation: t('cropProgress.createDialog.yieldValidation.warningLowRecommendation')
            };
        }

        // Trường hợp trong phạm vi chấp nhận được
        return {
            error: "",
            severity: 'info',
            canComplete: true,
            commitmentStatus: 'achieved',
            recommendation: t('cropProgress.createDialog.yieldValidation.success')
        };
    };

    // Handle actual yield change with validation
    const handleActualYieldChange = (value: string) => {
        const numericValue = value ? parseFloat(value) : undefined;
        setActualYield(numericValue);

        // Clear field error when user changes input
        if (fieldErrors.actualYield) {
            setFieldErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors.actualYield;
                return newErrors;
            });
        }

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

        // Form submission started

        // Clear previous field errors
        setFieldErrors({});

        // Validate tất cả fields
        const newFieldErrors: Record<string, string> = {};
        const fieldsToValidate = ['stageId', 'progressDate', 'actualYield', 'notes', 'mediaFiles'];

        fieldsToValidate.forEach(fieldName => {
            const value = fieldName === 'stageId' ? stageId :
                fieldName === 'progressDate' ? progressDate :
                    fieldName === 'actualYield' ? actualYield :
                        fieldName === 'notes' ? note :
                            fieldName === 'mediaFiles' ? mediaFiles :
                                null;
            const error = validateField(fieldName, value);
            // Validation completed for field
            if (error) {
                newFieldErrors[fieldName] = error;
            }
        });

        // Additional validation for date range
        if (progressDate) {
            const selectedDate = new Date(progressDate);
            const today = new Date();
            today.setHours(23, 59, 59, 999);

            if (selectedDate > today) {
                newFieldErrors.progressDate = t('cropProgress.createDialog.validation.dateNotFuture');
            }

            // Không cho phép ngày quá xa trong quá khứ (1 năm)
            const oneYearAgo = new Date();
            oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
            if (selectedDate < oneYearAgo) {
                newFieldErrors.progressDate = t('cropProgress.createDialog.validation.dateTooPast');
            }

            // Note: Validation ngày theo mùa vụ sẽ được handle bởi backend
            // Backend sẽ kiểm tra ngày progress không được trước startDate của mùa vụ
            // Frontend chỉ validate ngày tương lai và quá khứ để UX tốt hơn
        }

        // Set field errors
        // Setting field errors
        setFieldErrors(newFieldErrors);

        // Nếu có lỗi validation, không submit
        if (Object.keys(newFieldErrors).length > 0) {
            // Validation errors found, stopping submit
            // Chỉ hiển thị inline errors, không cần toast
            return;
        }

        // Validate actual yield if it's harvesting stage
        if (stageId && stageOptions.find(s => s.stageId === stageId)?.stageCode?.toLowerCase() === HARVESTING_STAGE_CODE) {
            if (!actualYield || actualYield <= 0) {
                setFieldErrors(prev => ({ ...prev, actualYield: t('cropProgress.createDialog.validation.yieldRequired') }));
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
                let commitmentMessage = '';
                if (validation.commitmentStatus === 'failed') {
                    commitmentMessage = `🚨 QUAN TRỌNG: ${t('cropProgress.createDialog.yieldValidation.commitmentNotAchieved')}\n📋 Bạn cần ghi chú lý do cụ thể và liên hệ quản lý.\n\n`;
                } else {
                    commitmentMessage = `⚠️ Cảnh báo: Sản lượng thấp hơn dự kiến.\n`;
                }

                const confirmMessage = t('cropProgress.createDialog.yieldValidation.confirmLowYield', {
                    actual: actualYield,
                    commitmentMessage,
                    reason: validation.error,
                    recommendation: validation.recommendation,
                    confirmMessage: t('cropProgress.createDialog.confirmMessage')
                });

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
                stageId: stageId!, // stageId đã được validate trước đó
                progressDate: progressDate,
                notes: note,
                // Chỉ gửi sản lượng khi là giai đoạn thu hoạch
                actualYield: stageOptions.find(s => s.stageId === stageId)?.stageCode?.toLowerCase() === HARVESTING_STAGE_CODE ? actualYield : undefined,
                mediaFiles: mediaFiles,
            };

            await createCropProgress(createData);
            AppToast.success(t('cropProgress.createDialog.validation.createProgressSuccess'));
            setOpen(false);
            resetForm();
            onSuccess();

            // Cập nhật sản lượng nếu là giai đoạn thu hoạch và có sản lượng
            if (onSeasonDetailUpdate) {
                onSeasonDetailUpdate(actualYield || null);
            }
        } catch (error: unknown) {
            let errorMessage = t('cropProgress.createDialog.validation.createProgressError');
            const backendFieldErrors: Record<string, string> = {};

            console.log('🔍 Caught error:', error);
            console.log('🔍 Error type:', typeof error);
            console.log('🔍 Error message:', error instanceof Error ? error.message : 'No message');

            // Ưu tiên lấy message từ Error object (được throw từ API)
            if (error instanceof Error) {
                errorMessage = error.message;
                console.log('🔍 Got error message from Error object:', errorMessage);
            }

            // Fallback: Tìm message trong string representation của error
            if (errorMessage === t('cropProgress.createDialog.validation.createProgressError') && typeof error === 'string') {
                errorMessage = error;
                console.log('🔍 Got error message from string error:', errorMessage);
            }
            // Handle axios error response (fallback)
            else if (typeof error === 'object' && error !== null && 'response' in error) {
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
                    if (errorMessage === t('cropProgress.createDialog.validation.createProgressError')) {
                        if (response.data.message) {
                            errorMessage = response.data.message;
                            console.log('🔍 Got error message from response.data.message:', errorMessage);
                        } else if (response.data.title) {
                            errorMessage = response.data.title;
                            console.log('🔍 Got error message from response.data.title:', errorMessage);
                        }
                    }
                }
            }

            // Debug: Log error response để kiểm tra
            console.log('🔍 Backend error response:', error);
            console.log('🔍 Error instanceof Error:', error instanceof Error);
            console.log('🔍 Error message property:', error instanceof Error ? error.message : 'N/A');
            console.log('🔍 Parsed backend field errors:', backendFieldErrors);
            console.log('🔍 Final error message:', errorMessage);

            // Nếu có backend field errors, hiển thị inline
            if (Object.keys(backendFieldErrors).length > 0) {
                setFieldErrors(backendFieldErrors);
                // Cũng hiển thị toast để user biết có lỗi
                AppToast.error(errorMessage);
            } else {
                // Nếu không có field errors cụ thể, cố gắng map general message thành field error
                if (errorMessage.includes('Ngày ghi nhận phải sau ngày của giai đoạn trước') ||
                    errorMessage.includes('Ngày ghi nhận không được trước ngày bắt đầu mùa vụ') ||
                    errorMessage.includes('Ngày ghi nhận không được sau ngày kết thúc mùa vụ') ||
                    errorMessage.includes('Ngày ghi nhận không được lớn hơn hôm nay') ||
                    errorMessage.includes('Ngày ghi nhận không được quá xa trong quá khứ') ||
                    errorMessage.includes('ProgressDate') ||
                    errorMessage.includes('progressDate')) {
                    setFieldErrors({ progressDate: errorMessage });
                } else if (errorMessage.includes('ActualYield') ||
                    errorMessage.includes('actualYield') ||
                    errorMessage.includes('Sản lượng')) {
                    setFieldErrors({ actualYield: errorMessage });
                } else if (errorMessage.includes('StageId') ||
                    errorMessage.includes('stageId') ||
                    errorMessage.includes('Giai đoạn')) {
                    setFieldErrors({ stageId: errorMessage });
                } else {
                    setError(errorMessage);
                    AppToast.error(errorMessage);
                }
            }
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
        setFieldErrors({}); // Reset field errors
    };

    // Thêm function validate từng field
    const validateField = (fieldName: string, value: string | number | null | undefined): string | null => {
        // Validating field
        switch (fieldName) {
            case 'stageId':
                const stageError = !value ? t('cropProgress.createDialog.validation.selectStage') : null;
                // Stage validation completed
                return stageError;
            case 'progressDate':
                if (!value) {
                    return t('cropProgress.createDialog.validation.selectDate');
                }

                const selectedDate = new Date(value);
                const today = new Date();
                today.setHours(23, 59, 59, 999);

                // Không cho phép ngày trong tương lai
                if (selectedDate > today) {
                    return t('cropProgress.createDialog.validation.dateNotFuture');
                }

                // Không cho phép ngày quá xa trong quá khứ (1 năm)
                const oneYearAgo = new Date();
                oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
                if (selectedDate < oneYearAgo) {
                    return t('cropProgress.createDialog.validation.dateTooPast');
                }

                // Note: Validation ngày theo mùa vụ sẽ được handle bởi backend
                // Backend sẽ kiểm tra ngày progress không được trước startDate của mùa vụ
                // Frontend chỉ validate ngày tương lai và quá khứ để UX tốt hơn

                return null;
            case 'actualYield':
                if (stageId && stageOptions.find(s => s.stageId === stageId)?.stageCode?.toLowerCase() === HARVESTING_STAGE_CODE) {
                    if (!value || (typeof value === 'number' && value <= 0)) return t('cropProgress.createDialog.validation.yieldRequired');
                }
                return null;
            case 'notes':
                // Notes là optional, chỉ validate nếu có giá trị
                if (value && typeof value === 'string' && value.length > 1000) {
                    return t('cropProgress.createDialog.validation.notesTooLong');
                }
                return null;
            case 'mediaFiles':
                // Validate media files count and size
                if (Array.isArray(value) && value.length > 0) {
                    if (value.length > 10) {
                        return t('cropProgress.createDialog.validation.tooManyFiles');
                    }
                    // Check total file size (max 50MB)
                    const totalSize = value.reduce((sum, file) => sum + file.size, 0);
                    if (totalSize > 50 * 1024 * 1024) {
                        return t('cropProgress.createDialog.validation.filesTooLarge');
                    }
                }
                return null;
            default:
                return null;
        }
    };

    const validateFile = (file: File): string | null => {
        // Check file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            return t('cropProgress.createDialog.validation.fileTooLarge');
        }

        // Check file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/avi', 'video/mov'];
        if (!allowedTypes.includes(file.type)) {
            return t('cropProgress.createDialog.validation.fileTypeNotSupported');
        }

        return null;
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);

        // Clear previous media errors
        setFieldErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors.mediaFiles;
            return newErrors;
        });

        // Validate each file
        for (const file of files) {
            const error = validateFile(file);
            if (error) {
                setFieldErrors(prev => ({ ...prev, mediaFiles: error }));
                return;
            }
        }

        // Validate total files count and size
        const newFiles = [...mediaFiles, ...files];
        const mediaError = validateField('mediaFiles', newFiles);
        if (mediaError) {
            setFieldErrors(prev => ({ ...prev, mediaFiles: mediaError }));
            return;
        }

        setMediaFiles(newFiles);
    };

    const removeFile = (index: number) => {
        setMediaFiles(prev => {
            const newFiles = prev.filter((_, i) => i !== index);

            // Clear media errors if no files left
            if (newFiles.length === 0) {
                setFieldErrors(prevErrors => {
                    const newErrors = { ...prevErrors };
                    delete newErrors.mediaFiles;
                    return newErrors;
                });
            }

            return newFiles;
        });
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
                                    : t('cropProgress.createDialog.completedTitle')
                                }
                            </DialogTitle>
                            <p className="text-gray-300 text-xs">
                                {stageOptions.length > 0
                                    ? t('cropProgress.createDialog.description')
                                    : t('cropProgress.createDialog.completedDescription')
                                }
                            </p>
                        </div>
                    </div>

                    {/* Content - 3 columns horizontal layout */}
                    <div className="p-6">
                        {/* Error Display - Removed red banner as requested */}

                        {/* Field Errors Summary Box - Removed as requested */}

                        {/* Debug panel removed - validation working correctly */}

                        {/* Main form - 2 columns horizontal layout */}
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">

                            {/* Column 1 - Basic Info */}
                            <div className="space-y-3">
                                <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                    <div className="w-4 h-4 bg-gray-100 rounded flex items-center justify-center">
                                        <Leaf className="w-3 h-3 text-gray-600" />
                                    </div>
                                    {t('cropProgress.createDialog.basicInfo')}
                                </h3>

                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                            {t('cropProgress.createDialog.nextStage')}
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
                                                        {t('cropProgress.createDialog.nextStageDesc')}
                                                    </p>
                                                    {/* Hiển thị tiến trình giai đoạn */}
                                                    <div className="mt-3 pt-3 border-t border-green-200">
                                                        <div className="flex items-center justify-between text-xs">
                                                            <span className="text-green-700">{t('cropProgress.createDialog.progress')}:</span>
                                                            <span className="text-green-800 font-medium">
                                                                {localExistingProgress.length + 1}/{stageOrder.length} {t('cropProgress.createDialog.stages')}
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
                                                        {t('cropProgress.createDialog.allCompleted')}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-blue-600 mt-1">
                                                    {t('cropProgress.createDialog.allCompletedDesc')}
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
                                                        <span className="text-blue-700">{t('cropProgress.createDialog.progress')}:</span>
                                                        <span className="text-blue-800 font-medium">
                                                            {stageOrder.length}/{stageOrder.length} {t('cropProgress.createDialog.stages')}
                                                        </span>
                                                    </div>
                                                    <div className="mt-2 w-full bg-blue-200 rounded-full h-2">
                                                        <div
                                                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                                            style={{ width: '100%' }}
                                                        ></div>
                                                    </div>
                                                    <p className="text-xs text-blue-600 mt-2">
                                                        🎉 {t('cropProgress.createDialog.progressComplete')}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {stageOptions.length > 0 && (
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                                {t('cropProgress.createDialog.executionDate')} <span className="text-red-500">*</span>
                                            </label>
                                            <Input
                                                type="date"
                                                value={progressDate}
                                                onChange={(e) => {
                                                    setProgressDate(e.target.value);
                                                    // Clear field error when user starts typing
                                                    if (fieldErrors.progressDate) {
                                                        setFieldErrors(prev => {
                                                            const newErrors = { ...prev };
                                                            delete newErrors.progressDate;
                                                            return newErrors;
                                                        });
                                                    }
                                                }}
                                                onBlur={() => {
                                                    // Validate on blur
                                                    if (progressDate) {
                                                        const error = validateField('progressDate', progressDate);
                                                        if (error) {
                                                            setFieldErrors(prev => ({ ...prev, progressDate: error }));
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
                                            {/* Debug info removed - validation working correctly */}
                                            <p className="text-xs text-gray-500 mt-1">
                                                {t('cropProgress.createDialog.executionDateDesc')}
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
                                                        <span className="text-sm font-medium">{t('cropProgress.createDialog.estimatedYield')}: {cropSeasonDetail.estimatedYield} kg</span>
                                                    </div>
                                                    <div className="mt-2 space-y-1 text-xs text-blue-600">
                                                        <p>📊 <strong>{t('cropProgress.createDialog.yieldRange')}:</strong></p>
                                                        <div className="ml-4 space-y-1">
                                                            <p>• <span className="text-green-600">✅ {t('cropProgress.createDialog.yieldGood')}:</span> 80% - 150% dự kiến (Đạt cam kết)</p>
                                                            <p>• <span className="text-yellow-600">⚠️ {t('cropProgress.createDialog.yieldWarning')}:</span> 70% - 80% dự kiến (Đạt cam kết một phần)</p>
                                                            <p>• <span className="text-orange-600">🚨 {t('cropProgress.createDialog.yieldStrongWarning')}:</span> 30% - 80% dự kiến (KHÔNG đạt cam kết)</p>
                                                            <p>• <span className="text-red-600">❌ {t('cropProgress.createDialog.yieldNotAllowed')}:</span> Dưới 30% hoặc trên 150% dự kiến</p>
                                                        </div>
                                                        <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                                                            <p className="text-yellow-800 text-xs">
                                                                <strong>⚠️ {t('cropProgress.createDialog.yieldNote')}:</strong> {t('cropProgress.createDialog.yieldNoteDesc')}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                                    {t('cropProgress.createDialog.actualYield')} <span className="text-red-500">*</span>
                                                </label>
                                                <Input
                                                    type="number"
                                                    value={actualYield || ""}
                                                    onChange={(e) => handleActualYieldChange(e.target.value)}
                                                    min={0}
                                                    step="any"
                                                    className={cn(
                                                        "w-full h-10 text-sm",
                                                        fieldErrors.actualYield && "border-red-300 focus:border-red-500 focus:ring-red-200",
                                                        yieldValidationError && !fieldErrors.actualYield && (
                                                            yieldValidationSeverity === 'error' ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : 'border-yellow-300 focus:border-yellow-500 focus:ring-yellow-200'
                                                        )
                                                    )}
                                                    placeholder={t('cropProgress.createDialog.actualYieldPlaceholder')}
                                                />
                                                {fieldErrors.actualYield && (
                                                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                                                        <AlertTriangle className="w-4 h-4" />
                                                        {fieldErrors.actualYield}
                                                    </p>
                                                )}
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
                                                                                        🚨 {t('cropProgress.createDialog.yieldValidation.commitmentNotAchieved')}
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
                                                                                        ⚠️ {t('cropProgress.createDialog.yieldValidation.commitmentPartial')}
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
                                                                        ⚠️ {t('cropProgress.createDialog.yieldValidation.canContinue')}
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
                                                                ✅ {t('cropProgress.createDialog.achievedPercent', { percent: ((actualYield / cropSeasonDetail.estimatedYield) * 100).toFixed(1) })}
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
                                                {t('cropProgress.createDialog.notes')}
                                            </label>
                                            <Textarea
                                                value={note}
                                                onChange={(e) => {
                                                    setNote(e.target.value);
                                                    // Clear error when user changes input
                                                    if (fieldErrors.notes) {
                                                        setFieldErrors(prev => {
                                                            const newErrors = { ...prev };
                                                            delete newErrors.notes;
                                                            return newErrors;
                                                        });
                                                    }
                                                }}
                                                placeholder={t('cropProgress.createDialog.notesPlaceholder')}
                                                className={cn(
                                                    "w-full min-h-[80px] text-sm resize-none",
                                                    fieldErrors.notes && "border-red-300 focus:border-red-500 focus:ring-red-200"
                                                )}
                                                rows={3}
                                            />
                                            {fieldErrors.notes && (
                                                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                                                    <AlertTriangle className="w-4 h-4" />
                                                    {fieldErrors.notes}
                                                </p>
                                            )}
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
                                        {t('cropProgress.createDialog.mediaUpload')}
                                    </h3>

                                    <div className="space-y-3">
                                        {/* Photo upload */}
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                                {t('cropProgress.createDialog.photoUpload')}
                                            </label>
                                            <div className={cn(
                                                "border-2 border-dashed rounded-lg p-3 text-center hover:border-gray-500 transition-colors bg-gray-50",
                                                fieldErrors.mediaFiles ? "border-red-300" : "border-gray-300"
                                            )}>
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
                                                    {t('cropProgress.createDialog.selectPhoto')}
                                                </label>
                                            </div>
                                            {fieldErrors.mediaFiles && (
                                                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                                                    <AlertTriangle className="w-4 h-4" />
                                                    {fieldErrors.mediaFiles}
                                                </p>
                                            )}
                                        </div>

                                        {/* Video upload */}
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                                {t('cropProgress.createDialog.videoUpload')}
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
                                                    {t('cropProgress.createDialog.selectVideo')}
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
                                <h4 className="text-sm font-medium text-gray-700 mb-3">{t('cropProgress.createDialog.mediaPreview')}:</h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                                    {mediaFiles.map((file, index) => (
                                        <div key={index} className="relative group">
                                            {getFilePreview(file)}
                                            <button
                                                type="button"
                                                onClick={() => removeFile(index)}
                                                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                                aria-label={t('cropProgress.createDialog.removeFile')}
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
                                        <span>{t('cropProgress.createDialog.maxFiles')}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span>{t('cropProgress.createDialog.autoCompress')}</span>
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
                                    {stageOptions.length > 0 ? t('cropProgress.createDialog.cancel') : t('cropProgress.createDialog.close')}
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
                                                {t('cropProgress.createDialog.saving')}
                                            </div>
                                        ) : (
                                            t('cropProgress.createDialog.recordStage', { stageName: stageOptions[0]?.stageName })
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