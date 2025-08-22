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

const QUALITY_OPTIONS = [
    { label: "Cà phê đặc sản (SCA 80+)", value: "SCA 80+" },
    { label: "Robusta chất lượng cao (Fine Robusta)", value: "Fine Robusta" },
    { label: "Loại A", value: "Grade A" },
    { label: "Hữu cơ (Organic)", value: "Organic" },
    { label: "Tiêu chuẩn cơ bản", value: "Standard" },
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
        } catch (error) {
            console.error('Lỗi khi tải dữ liệu:', error);
            toast.error("Không thể tải dữ liệu vùng trồng");
            onClose();
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
                    <select
                        id="plannedQuality"
                        name="plannedQuality"
                        value={form.plannedQuality}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        required
                        aria-label="Chọn chất lượng cà phê"
                    >
                        <option value="">Chọn chất lượng</option>
                        {QUALITY_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
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
