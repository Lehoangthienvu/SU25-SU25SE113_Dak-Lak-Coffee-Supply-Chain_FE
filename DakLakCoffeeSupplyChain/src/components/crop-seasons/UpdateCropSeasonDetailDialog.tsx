'use client';

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { getCropSeasonDetailById, updateCropSeasonDetail } from "@/lib/api/cropSeasonDetail";

interface Props {
    detailId: string;
    onClose: () => void;
    onSuccess: () => void;
}

// Hệ thống chất lượng linh hoạt
const getQualitySuggestions = (coffeeType?: string) => {
    if (!coffeeType) {
        return [
            { label: "Đặc sản (Premium)", value: "Premium" },
            { label: "Chất lượng cao (High)", value: "High" },
            { label: "Chất lượng trung bình (Medium)", value: "Medium" },
            { label: "Tiêu chuẩn cơ bản (Standard)", value: "Standard" },
        ];
    }

    const type = coffeeType.toLowerCase();

    if (type.includes('arabica')) {
        return [
            { label: "Cà phê đặc sản (SCA 90+)", value: "SCA 90+" },
            { label: "Cà phê đặc sản (SCA 85+)", value: "SCA 85+" },
            { label: "Cà phê đặc sản (SCA 80+)", value: "SCA 80+" },
            { label: "Premium Arabica", value: "Premium Arabica" },
            { label: "Standard Arabica", value: "Standard Arabica" },
        ];
    } else if (type.includes('robusta')) {
        return [
            { label: "Fine Robusta Premium", value: "Fine Robusta Premium" },
            { label: "Fine Robusta", value: "Fine Robusta" },
            { label: "Premium Robusta", value: "Premium Robusta" },
            { label: "Standard Robusta", value: "Standard Robusta" },
        ];
    } else if (type.includes('chồn') || type.includes('weasel')) {
        return [
            { label: "Cà phê Chồn Premium", value: "Cà phê Chồn Premium" },
            { label: "Cà phê Chồn Standard", value: "Cà phê Chồn Standard" },
            { label: "Cà phê Chồn Đặc biệt", value: "Cà phê Chồn Đặc biệt" },
        ];
    } else {
        return [
            { label: "Đặc sản (Premium)", value: "Premium" },
            { label: "Chất lượng cao (High)", value: "High" },
            { label: "Chất lượng trung bình (Medium)", value: "Medium" },
            { label: "Tiêu chuẩn cơ bản (Standard)", value: "Standard" },
        ];
    }
};

// Chất lượng chung cho tất cả loại cà phê
const COMMON_QUALITY_OPTIONS = [
    { label: "Hữu cơ (Organic)", value: "Organic" },
    { label: "Fair Trade", value: "Fair Trade" },
    { label: "Rainforest Alliance", value: "Rainforest Alliance" },
    { label: "UTZ Certified", value: "UTZ Certified" },
    { label: "4C Certified", value: "4C Certified" },
];

const toDateInput = (d?: string) => (d ? new Date(d).toISOString().slice(0, 10) : "");

export default function UpdateCropSeasonDetailDialog({ detailId, onClose, onSuccess }: Props) {
    const [form, setForm] = useState({
        areaAllocated: "",
        plannedQuality: "",
        expectedHarvestStart: "",
        expectedHarvestEnd: "",
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [showQualitySuggestions, setShowQualitySuggestions] = useState(false);
    const [coffeeType, setCoffeeType] = useState<string>("");

    useEffect(() => {
        if (detailId) {
            fetchData();
        }
    }, [detailId]);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const detail = await getCropSeasonDetailById(detailId);
            setForm({
                areaAllocated: detail.areaAllocated?.toString() || "",
                plannedQuality: detail.plannedQuality || "",
                expectedHarvestStart: toDateInput(detail.expectedHarvestStart),
                expectedHarvestEnd: toDateInput(detail.expectedHarvestEnd),
            });
            setCoffeeType(detail.typeName || "");
        } catch {
            toast.error('Không thể tải dữ liệu.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!form.areaAllocated || !form.plannedQuality) {
            toast.error("Vui lòng điền đầy đủ thông tin bắt buộc");
            return;
        }

        try {
            setIsSubmitting(true);

            const updateData = {
                detailId,
                areaAllocated: parseFloat(form.areaAllocated),
                plannedQuality: form.plannedQuality,
                expectedHarvestStart: form.expectedHarvestStart || undefined,
                expectedHarvestEnd: form.expectedHarvestEnd || undefined,
            };

            await updateCropSeasonDetail(detailId, updateData);
            toast.success("Cập nhật vùng trồng thành công");
            onSuccess();
            onClose();
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : "Cập nhật vùng trồng thất bại";
            toast.error(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="p-6">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-600">Đang tải dữ liệu...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <Label htmlFor="areaAllocated">Diện tích phân bổ (ha) *</Label>
                    <Input
                        id="areaAllocated"
                        name="areaAllocated"
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={form.areaAllocated}
                        onChange={handleChange}
                        placeholder="Nhập diện tích"
                        required
                    />
                </div>

                <div>
                    <Label htmlFor="plannedQuality">Chất lượng dự kiến *</Label>
                    <div className="relative">
                        <Input
                            id="plannedQuality"
                            name="plannedQuality"
                            value={form.plannedQuality}
                            onChange={handleChange}
                            onFocus={() => setShowQualitySuggestions(true)}
                            onBlur={() => setTimeout(() => setShowQualitySuggestions(false), 200)}
                            placeholder="Nhập hoặc chọn chất lượng..."
                            className="w-full"
                            required
                        />

                        {/* Dropdown gợi ý chất lượng */}
                        {showQualitySuggestions && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                {/* Gợi ý theo loại cà phê */}
                                <div className="px-3 py-2 text-xs font-medium text-gray-500 bg-gray-50 border-b">
                                    Gợi ý cho {coffeeType || "cà phê"}
                                </div>
                                {getQualitySuggestions(coffeeType).map((option) => (
                                    <div
                                        key={option.value}
                                        className="px-3 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100"
                                        onClick={() => {
                                            setForm((prev) => ({ ...prev, plannedQuality: option.label }));
                                            setShowQualitySuggestions(false);
                                        }}
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="text-blue-600">☕</span>
                                            <span className="text-sm">{option.label}</span>
                                        </div>
                                    </div>
                                ))}

                                {/* Chất lượng chung */}
                                <div className="px-3 py-2 text-xs font-medium text-gray-500 bg-gray-50 border-b">
                                    Chứng nhận & Tiêu chuẩn chung
                                </div>
                                {COMMON_QUALITY_OPTIONS.map((option) => (
                                    <div
                                        key={option.value}
                                        className="px-3 py-2 hover:bg-green-50 cursor-pointer border-b border-gray-100"
                                        onClick={() => {
                                            setForm((prev) => ({ ...prev, plannedQuality: option.label }));
                                            setShowQualitySuggestions(false);
                                        }}
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="text-green-600">🏆</span>
                                            <span className="text-sm">{option.label}</span>
                                        </div>
                                    </div>
                                ))}

                                {/* Tùy chọn nhập tự do */}
                                <div className="px-3 py-2 text-xs text-gray-500 bg-yellow-50 border-t-2 border-yellow-200">
                                    💡 Hoặc nhập chất lượng tùy chỉnh ở trên
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Hiển thị chất lượng đã chọn */}
                    {form.plannedQuality && (
                        <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
                            <p className="text-xs text-blue-700">
                                <strong>Chất lượng đã chọn:</strong> {form.plannedQuality}
                            </p>
                        </div>
                    )}
                </div>

                <div>
                    <Label htmlFor="expectedHarvestStart">Ngày bắt đầu thu hoạch dự kiến</Label>
                    <Input
                        id="expectedHarvestStart"
                        name="expectedHarvestStart"
                        type="date"
                        value={form.expectedHarvestStart}
                        onChange={handleChange}
                    />
                </div>

                <div>
                    <Label htmlFor="expectedHarvestEnd">Ngày kết thúc thu hoạch dự kiến</Label>
                    <Input
                        id="expectedHarvestEnd"
                        name="expectedHarvestEnd"
                        type="date"
                        value={form.expectedHarvestEnd}
                        onChange={handleChange}
                    />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        disabled={isSubmitting}
                    >
                        Hủy
                    </Button>
                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-orange-600 hover:bg-orange-700"
                    >
                        {isSubmitting ? "Đang cập nhật..." : "Cập nhật"}
                    </Button>
                </div>
            </form>
        </div>
    );
}
