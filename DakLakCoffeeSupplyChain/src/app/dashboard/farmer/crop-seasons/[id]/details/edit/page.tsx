"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Edit, MapPin, Coffee } from "lucide-react";
import {
  getCropSeasonDetailById,
  updateCropSeasonDetail,
} from "@/lib/api/cropSeasonDetail";

export default function EditCropSeasonDetailPage() {
  const router = useRouter();
  const params = useParams();
  const detailId = params.detailId as string;
  const cropSeasonId = params.id as string;

  const [form, setForm] = useState({
    commitmentDetailId: "",
    areaAllocated: "",
    plannedQuality: "",
    expectedHarvestStart: "",
    expectedHarvestEnd: "",
  });

  const [commitmentDetailCode, setCommitmentDetailCode] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showQualitySuggestions, setShowQualitySuggestions] = useState(false);

  // Hệ thống chất lượng linh hoạt theo loại cà phê
  const getQualitySuggestions = (coffeeType: string) => {
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
      // Các loại cà phê khác
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
        commitmentDetailId: detail.commitmentDetailId,
        areaAllocated: detail.areaAllocated?.toString() || "",
        plannedQuality: detail.plannedQuality || "",
        expectedHarvestStart: toDateInput(detail.expectedHarvestStart),
        expectedHarvestEnd: toDateInput(detail.expectedHarvestEnd),
      });
      setCommitmentDetailCode(detail.commitmentDetailCode || "");
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu:', error);
      toast.error("Không thể tải dữ liệu vùng trồng");
      router.push(`/dashboard/farmer/crop-seasons/${cropSeasonId}/details`);
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

  const validate = () => {
    const errs: string[] = [];
    const area = form.areaAllocated ? parseFloat(form.areaAllocated) : NaN;
    if (form.areaAllocated && (Number.isNaN(area) || area < 0)) {
      errs.push("Diện tích phải là số ≥ 0.");
    }
    if (form.expectedHarvestStart && form.expectedHarvestEnd) {
      const s = new Date(form.expectedHarvestStart).getTime();
      const e = new Date(form.expectedHarvestEnd).getTime();
      if (e < s) errs.push("Ngày kết thúc phải sau hoặc bằng ngày bắt đầu.");
    }
    if (errs.length) {
      toast.error(errs.join(" "));
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    const payload = {
      detailId,
      commitmentDetailId: form.commitmentDetailId || undefined,
      expectedHarvestStart: form.expectedHarvestStart || undefined,
      expectedHarvestEnd: form.expectedHarvestEnd || undefined,
      areaAllocated: form.areaAllocated ? parseFloat(form.areaAllocated) : undefined,
      plannedQuality: form.plannedQuality || undefined,
    };

    setIsSubmitting(true);
    try {
      await updateCropSeasonDetail(detailId, payload);
      toast.success("Cập nhật vùng trồng thành công!");
      router.push(`/dashboard/farmer/crop-seasons/${cropSeasonId}/details`);
    } catch (err: unknown) {
      console.error('Lỗi khi cập nhật:', err);
      const errorMessage = err instanceof Error ? err.message : "Cập nhật thất bại";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  if (!detailId) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Không tìm thấy vùng trồng</h2>
          <p className="text-gray-500 mb-4">Vui lòng quay lại trang danh sách để chọn vùng trồng cần chỉnh sửa</p>
          <Button onClick={() => router.push('/dashboard/farmer/crop-seasons')} variant="outline">
            Quay lại danh sách
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="p-2"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
          <Edit className="w-5 h-5 text-orange-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Chỉnh sửa vùng trồng</h1>
          <p className="text-gray-600">Cập nhật thông tin chi tiết vùng trồng cà phê</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coffee className="w-5 h-5 text-orange-600" />
              Thông tin vùng trồng
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Thông tin cam kết vùng trồng */}
            <div className="rounded-md border p-4 bg-orange-50">
              <p className="text-sm font-medium mb-3 text-orange-800">Thông tin cam kết vùng trồng</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-orange-700">Mã dòng cam kết</Label>
                  <Input
                    value={commitmentDetailCode || form.commitmentDetailId}
                    disabled
                    readOnly
                    className="bg-orange-100 border-orange-200"
                  />
                </div>
              </div>
            </div>

            {/* Trường chỉnh sửa */}
            <div className="space-y-4">
              <div>
                <Label>Diện tích (ha) *</Label>
                <Input
                  type="number"
                  name="areaAllocated"
                  value={form.areaAllocated}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  placeholder="Nhập diện tích vùng trồng"
                  className="w-full"
                />
              </div>

              <div>
                <Label>Chất lượng dự kiến</Label>
                <div className="relative">
                  <Input
                    name="plannedQuality"
                    value={form.plannedQuality}
                    onChange={handleChange}
                    onFocus={() => setShowQualitySuggestions(true)}
                    onBlur={() => setTimeout(() => setShowQualitySuggestions(false), 200)}
                    placeholder="Nhập hoặc chọn chất lượng..."
                    className="w-full"
                  />

                  {/* Dropdown gợi ý chất lượng */}
                  {showQualitySuggestions && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {/* Gợi ý theo loại cà phê - cần lấy từ commitment detail */}
                      <div className="px-3 py-2 text-xs font-medium text-gray-500 bg-gray-50 border-b">
                        Gợi ý chất lượng
                      </div>
                      {getQualitySuggestions("arabica").map((option) => (
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Bắt đầu thu hoạch</Label>
                  <Input
                    type="date"
                    name="expectedHarvestStart"
                    value={form.expectedHarvestStart}
                    onChange={handleChange}
                    className="w-full"
                  />
                </div>
                <div>
                  <Label>Kết thúc thu hoạch</Label>
                  <Input
                    type="date"
                    name="expectedHarvestEnd"
                    value={form.expectedHarvestEnd}
                    onChange={handleChange}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => router.back()}
                disabled={isSubmitting}
                className="flex-1"
              >
                Hủy
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 bg-orange-600 hover:bg-orange-700"
              >
                {isSubmitting ? "Đang cập nhật..." : "Cập nhật"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
