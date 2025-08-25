"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { AppToast } from "@/components/ui/AppToast";
import { getErrorMessage } from "@/lib/utils";
import { createCropSeasonDetail } from "@/lib/api/cropSeasonDetail";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { getAvailableCommitments } from "@/lib/api/farmingCommitments";
import { FarmingCommitmentDetail } from "@/lib/api/farmingCommitments";

function CreateCropSeasonDetailContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const cropSeasonId = params.id as string;
  const commitmentId = searchParams.get("commitmentId") || "";

  const [form, setForm] = useState({
    commitmentDetailId: "",
    areaAllocated: "",
    plannedQuality: "",
    expectedHarvestStart: "",
    expectedHarvestEnd: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showQualitySuggestions, setShowQualitySuggestions] = useState(false);
  const [commitmentDetailOptions, setCommitmentDetailOptions] = useState<
    {
      commitmentDetailId: string;
      commitmentDetailCode: string;
      note: string;
      committedQuantity: number;
      estimatedDeliveryStart: string;
      estimatedDeliveryEnd: string;
      expectedHarvestStart: string;
      expectedHarvestEnd: string;
      coffeeTypeName: string;
      confirmedPrice: number;
    }[]
  >([]);

  const [selectedCommitmentDetail, setSelectedCommitmentDetail] = useState<{
    commitmentDetailId: string;
    commitmentDetailCode: string;
    note: string;
    committedQuantity: number;
    estimatedDeliveryStart: string;
    estimatedDeliveryEnd: string;
    expectedHarvestStart: string;
    expectedHarvestEnd: string;
    coffeeTypeName: string;
    confirmedPrice: number;
  } | null>(null);

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

  useEffect(() => {
    const fetchCommitmentDetails = async () => {
      if (!commitmentId) {
        AppToast.error("Thiếu thông tin commitmentId.");
        return;
      }

      try {
        const allCommitments = await getAvailableCommitments();
        const matched = allCommitments.find(c => c.commitmentId === commitmentId);

        if (!matched || !matched.farmingCommitmentDetails) {
          AppToast.error("Không tìm thấy dòng cam kết.");
          return;
        }

        const details = matched.farmingCommitmentDetails.map((detail: Partial<FarmingCommitmentDetail>) => ({
          commitmentDetailId: detail.commitmentDetailId || "",
          commitmentDetailCode: detail.commitmentDetailCode || "",
          note: detail.note || "",
          committedQuantity: detail.committedQuantity || 0,
          estimatedDeliveryStart: detail.estimatedDeliveryStart || "",
          estimatedDeliveryEnd: detail.estimatedDeliveryEnd || "",
          expectedHarvestStart: detail.expectedHarvestStart || "",
          expectedHarvestEnd: detail.expectedHarvestEnd || "",
          coffeeTypeName: detail.coffeeTypeName || "",
          confirmedPrice: detail.confirmedPrice || 0,
        }));

        setCommitmentDetailOptions(details);

        // Log thông tin commitment details để kiểm tra
        console.log("Commitment Details loaded:", details);
        console.log("Selected Commitment ID:", commitmentId);
        console.log("Matched Commitment:", matched);
      } catch (error) {
        console.error("Error fetching commitment details:", error);
        AppToast.error("Không thể tải dòng cam kết.");
      }
    };

    fetchCommitmentDetails();
  }, [commitmentId]);

  const handleCommitmentDetailChange = (value: string) => {
    const selected = commitmentDetailOptions.find(option => option.commitmentDetailId === value);
    setSelectedCommitmentDetail(selected || null);
    setForm(prev => ({ ...prev, commitmentDetailId: value }));

    // Log thông tin commitment detail được chọn
    if (selected) {
      console.log("Selected Commitment Detail:", selected);
      console.log("Estimated Delivery Start:", selected.estimatedDeliveryStart);
      console.log("Estimated Delivery End:", selected.estimatedDeliveryEnd);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = (): string | null => {
    const requiredFields = [
      "commitmentDetailId",
      "areaAllocated",
      "plannedQuality",
      "expectedHarvestStart",
      "expectedHarvestEnd",
    ];

    const missing = requiredFields.filter((f) => !form[f as keyof typeof form]);
    if (missing.length > 0) {
      return "Vui lòng điền đầy đủ các trường bắt buộc.";
    }

    // Validation cho ngày thu hoạch
    if (selectedCommitmentDetail) {
      const harvestStart = new Date(form.expectedHarvestStart);
      const harvestEnd = new Date(form.expectedHarvestEnd);
      const harvestStartExpected = selectedCommitmentDetail.expectedHarvestStart ? new Date(selectedCommitmentDetail.expectedHarvestStart) : null;
      const harvestEndExpected = selectedCommitmentDetail.expectedHarvestEnd ? new Date(selectedCommitmentDetail.expectedHarvestEnd) : null;

      if (harvestStart >= harvestEnd) {
        return "Ngày bắt đầu thu hoạch phải trước ngày kết thúc thu hoạch.";
      }

      if (harvestStartExpected && harvestStart < harvestStartExpected) {
        return "Ngày bắt đầu thu hoạch không được trước ngày thu hoạch dự kiến bắt đầu.";
      }

      if (harvestEndExpected && harvestEnd > harvestEndExpected) {
        return "Ngày kết thúc thu hoạch không được sau ngày thu hoạch dự kiến kết thúc.";
      }
    }

    return null;
  };

  const handleSubmit = async () => {
    const validationError = validateForm();
    if (validationError) {
      AppToast.error(validationError);
      return;
    }

    setIsSubmitting(true);
    try {
      // Log thông tin trước khi gửi
      console.log("Submitting crop season detail:", {
        cropSeasonId,
        commitmentDetailId: form.commitmentDetailId,
        areaAllocated: parseFloat(form.areaAllocated),
        plannedQuality: form.plannedQuality,
        expectedHarvestStart: form.expectedHarvestStart,
        expectedHarvestEnd: form.expectedHarvestEnd,
        selectedCommitmentDetail
      });

      await createCropSeasonDetail({
        cropSeasonId,
        commitmentDetailId: form.commitmentDetailId,
        areaAllocated: parseFloat(form.areaAllocated),
        plannedQuality: form.plannedQuality,
        expectedHarvestStart: form.expectedHarvestStart,
        expectedHarvestEnd: form.expectedHarvestEnd,
      });

      AppToast.success("Tạo vùng trồng thành công!");
      router.push(`/dashboard/farmer/crop-seasons/${cropSeasonId}`);
    } catch (err) {
      console.error("Error creating crop season detail:", err);
      AppToast.error(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <Card>
        <CardHeader>
          <CardTitle>Thêm vùng trồng cho mùa vụ</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Chọn dòng cam kết</Label>
            <Select
              disabled={commitmentDetailOptions.length === 0}
              value={form.commitmentDetailId}
              onValueChange={handleCommitmentDetailChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn dòng cam kết" />
              </SelectTrigger>
              <SelectContent>
                {commitmentDetailOptions.map((item) => (
                  <SelectItem key={item.commitmentDetailId} value={item.commitmentDetailId}>
                    {`${item.commitmentDetailCode} – ${item.coffeeTypeName} (${item.committedQuantity} kg)`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Hiển thị thông tin commitment detail được chọn */}
          {selectedCommitmentDetail && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-4">
                <h4 className="font-semibold text-blue-800 mb-2">Thông tin dòng cam kết</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="font-medium">Mã:</span> {selectedCommitmentDetail.commitmentDetailCode}
                  </div>
                  <div>
                    <span className="font-medium">Loại cà phê:</span> {selectedCommitmentDetail.coffeeTypeName}
                  </div>
                  <div>
                    <span className="font-medium">Khối lượng cam kết:</span> {selectedCommitmentDetail.committedQuantity} kg
                  </div>
                  <div>
                    <span className="font-medium">Giá xác nhận:</span> {selectedCommitmentDetail.confirmedPrice?.toLocaleString()} VNĐ/kg
                  </div>
                  <div>
                    <span className="font-medium">Thu hoạch dự kiến từ:</span> {selectedCommitmentDetail.expectedHarvestStart ? new Date(selectedCommitmentDetail.expectedHarvestStart).toLocaleDateString('vi-VN') : 'Chưa xác định'}
                  </div>
                  <div>
                    <span className="font-medium">Thu hoạch dự kiến đến:</span> {selectedCommitmentDetail.expectedHarvestEnd ? new Date(selectedCommitmentDetail.expectedHarvestEnd).toLocaleDateString('vi-VN') : 'Chưa xác định'}
                  </div>
                </div>
                {selectedCommitmentDetail.note && (
                  <div className="mt-2">
                    <span className="font-medium">Ghi chú:</span> {selectedCommitmentDetail.note}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <div>
            <Label>Diện tích (ha)</Label>
            <Input
              type="number"
              name="areaAllocated"
              value={form.areaAllocated}
              onChange={handleChange}
              required
              min="0.1"
              step="0.1"
            />
          </div>

          <div>
            <Label>Chất lượng dự kiến</Label>
            <div className="relative">
              <Input
                value={form.plannedQuality}
                onChange={(e) => {
                  setForm((prev) => ({ ...prev, plannedQuality: e.target.value }));
                }}
                onFocus={() => setShowQualitySuggestions(true)}
                onBlur={() => setTimeout(() => setShowQualitySuggestions(false), 200)}
                placeholder="Nhập hoặc chọn chất lượng..."
                className="w-full"
              />

              {/* Dropdown gợi ý chất lượng */}
              {showQualitySuggestions && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {/* Gợi ý theo loại cà phê */}
                  {selectedCommitmentDetail && (
                    <>
                      <div className="px-3 py-2 text-xs font-medium text-gray-500 bg-gray-50 border-b">
                        Gợi ý cho {selectedCommitmentDetail.coffeeTypeName}
                      </div>
                      {getQualitySuggestions(selectedCommitmentDetail.coffeeTypeName).map((option) => (
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
                    </>
                  )}

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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Bắt đầu thu hoạch</Label>
              <Input
                type="date"
                name="expectedHarvestStart"
                value={form.expectedHarvestStart}
                onChange={handleChange}
                required
                min={selectedCommitmentDetail?.expectedHarvestStart ? selectedCommitmentDetail.expectedHarvestStart.split('T')[0] : undefined}
                max={selectedCommitmentDetail?.expectedHarvestEnd ? selectedCommitmentDetail.expectedHarvestEnd.split('T')[0] : undefined}
              />
            </div>
            <div>
              <Label>Kết thúc thu hoạch</Label>
              <Input
                type="date"
                name="expectedHarvestEnd"
                value={form.expectedHarvestEnd}
                onChange={handleChange}
                required
                min={form.expectedHarvestStart || undefined}
                max={selectedCommitmentDetail?.expectedHarvestEnd ? selectedCommitmentDetail.expectedHarvestEnd.split('T')[0] : undefined}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Đang tạo..." : "Tạo vùng trồng"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function CreateCropSeasonDetailPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CreateCropSeasonDetailContent />
    </Suspense>
  );
}
