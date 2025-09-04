"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AppToast } from "@/components/ui/AppToast";
import { Loader2, Save, X } from "lucide-react";
import { CropStage, createCropStage, updateCropStage } from "@/lib/api/cropStage";

interface CropStageFormProps {
    readonly stage?: CropStage | null;
    readonly onSuccess: () => void;
    readonly onCancel: () => void;
}

interface FormData {
    stageCode: string;
    stageName: string;
    description: string;
    orderIndex: number;
}

interface FormErrors {
    stageCode?: string;
    stageName?: string;
    orderIndex?: string;
}

export function CropStageForm({ stage, onSuccess, onCancel }: CropStageFormProps) {
    const [formData, setFormData] = useState<FormData>({
        stageCode: "",
        stageName: "",
        description: "",
        orderIndex: 1,
    });

    const [errors, setErrors] = useState<FormErrors>({});
    const [loading, setLoading] = useState(false);

    // Khởi tạo form data khi có stage (chỉnh sửa)
    useEffect(() => {
        if (stage) {
            setFormData({
                stageCode: stage.stageCode,
                stageName: stage.stageName,
                description: stage.description || "",
                orderIndex: stage.orderIndex,
            });
        }
    }, [stage]);

    // Validate form
    const validateForm = (): boolean => {
        const newErrors: FormErrors = {};

        // Validate stageCode
        if (!formData.stageCode.trim()) {
            newErrors.stageCode = "Mã giai đoạn là bắt buộc";
        } else if (formData.stageCode.trim().length < 2) {
            newErrors.stageCode = "Mã giai đoạn phải có ít nhất 2 ký tự";
        } else if (!/^[a-zA-Z0-9_-]+$/.test(formData.stageCode.trim())) {
            newErrors.stageCode = "Mã giai đoạn chỉ được chứa chữ cái, số, gạch ngang và gạch dưới";
        }

        // Validate stageName
        if (!formData.stageName.trim()) {
            newErrors.stageName = "Tên giai đoạn là bắt buộc";
        } else if (formData.stageName.trim().length < 2) {
            newErrors.stageName = "Tên giai đoạn phải có ít nhất 2 ký tự";
        }

        // Validate orderIndex
        if (!formData.orderIndex || formData.orderIndex < 1) {
            newErrors.orderIndex = "Thứ tự phải là số nguyên dương";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle input change
    const handleInputChange = (field: keyof FormData, value: string | number) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));

        // Clear error when user starts typing
        if (errors[field as keyof FormErrors]) {
            setErrors(prev => ({
                ...prev,
                [field]: undefined
            }));
        }
    };

    // Handle stageCode change (auto-format)
    const handleStageCodeChange = (value: string) => {
        // Convert to lowercase and replace spaces with underscores
        const formatted = value.toLowerCase().replace(/\s+/g, '_');
        handleInputChange('stageCode', formatted);
    };

    // Handle submit
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            AppToast.error("Vui lòng kiểm tra lại thông tin");
            return;
        }

        try {
            setLoading(true);

            const payload = {
                stageCode: formData.stageCode.trim(),
                stageName: formData.stageName.trim(),
                description: formData.description.trim() || undefined,
                orderIndex: formData.orderIndex,
            };

            if (stage) {
                // Update existing stage
                await updateCropStage(stage.stageId, {
                    ...payload,
                    stageId: stage.stageId,
                });
                AppToast.success("Cập nhật giai đoạn thành công!");
            } else {
                // Create new stage
                await createCropStage(payload);
                AppToast.success("Tạo giai đoạn mới thành công!");
            }

            onSuccess();
        } catch (error) {
            console.error("Lỗi khi lưu giai đoạn:", error);
            AppToast.error("Không thể lưu giai đoạn. Vui lòng thử lại.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-h-[70vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            <form onSubmit={handleSubmit} className="space-y-6 pb-4">
                {/* Stage Code */}
                <div className="space-y-2">
                    <Label htmlFor="stageCode" className="text-sm font-medium">
                        Mã giai đoạn <span className="text-red-500">*</span>
                    </Label>
                    <Input
                        id="stageCode"
                        value={formData.stageCode}
                        onChange={(e) => handleStageCodeChange(e.target.value)}
                        placeholder="VD: planting, flowering, harvesting"
                        className={errors.stageCode ? "border-red-500" : ""}
                        disabled={loading}
                    />
                    {errors.stageCode && (
                        <p className="text-sm text-red-500">{errors.stageCode}</p>
                    )}
                    <p className="text-xs text-gray-500">
                        Mã giai đoạn sẽ được chuyển thành chữ thường và thay thế khoảng trắng bằng gạch dưới
                    </p>
                </div>

                {/* Stage Name */}
                <div className="space-y-2">
                    <Label htmlFor="stageName" className="text-sm font-medium">
                        Tên giai đoạn <span className="text-red-500">*</span>
                    </Label>
                    <Input
                        id="stageName"
                        value={formData.stageName}
                        onChange={(e) => handleInputChange('stageName', e.target.value)}
                        placeholder="VD: Gieo trồng, Ra hoa, Thu hoạch"
                        className={errors.stageName ? "border-red-500" : ""}
                        disabled={loading}
                    />
                    {errors.stageName && (
                        <p className="text-sm text-red-500">{errors.stageName}</p>
                    )}
                </div>

                {/* Order Index */}
                <div className="space-y-2">
                    <Label htmlFor="orderIndex" className="text-sm font-medium">
                        Thứ tự <span className="text-red-500">*</span>
                    </Label>
                    <Input
                        id="orderIndex"
                        type="number"
                        min="1"
                        value={formData.orderIndex}
                        onChange={(e) => handleInputChange('orderIndex', parseInt(e.target.value) || 1)}
                        className={errors.orderIndex ? "border-red-500" : ""}
                        disabled={loading}
                    />
                    {errors.orderIndex && (
                        <p className="text-sm text-red-500">{errors.orderIndex}</p>
                    )}
                    <p className="text-xs text-gray-500">
                        Thứ tự hiển thị của giai đoạn trong chu trình (1, 2, 3...)
                    </p>
                </div>

                {/* Description */}
                <div className="space-y-2">
                    <Label htmlFor="description" className="text-sm font-medium">
                        Mô tả
                    </Label>
                    <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        placeholder="Mô tả chi tiết về giai đoạn này..."
                        rows={4}
                        disabled={loading}
                    />
                    <p className="text-xs text-gray-500">
                        Mô tả chi tiết về giai đoạn (không bắt buộc)
                    </p>
                </div>

                {/* Preview */}
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <h4 className="text-sm font-medium text-gray-700">Xem trước:</h4>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Mã:</span>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm font-mono">
                            {formData.stageCode || "stage_code"}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Tên:</span>
                        <span className="font-medium">{formData.stageName || "Tên giai đoạn"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Thứ tự:</span>
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">
                            {formData.orderIndex}
                        </span>
                    </div>
                    {formData.description && (
                        <div className="flex items-start gap-2">
                            <span className="text-sm text-gray-600">Mô tả:</span>
                            <span className="text-sm text-gray-700">{formData.description}</span>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t bg-white sticky bottom-0">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onCancel}
                        disabled={loading}
                    >
                        <X className="w-4 h-4 mr-2" />
                        Hủy
                    </Button>
                    <Button
                        type="submit"
                        disabled={loading}
                        className="bg-green-600 hover:bg-green-700"
                    >
                        {loading ? (
                            <div className="flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Đang lưu...
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Save className="w-4 h-4" />
                                {stage ? "Cập nhật" : "Tạo mới"}
                            </div>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}
