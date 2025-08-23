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

  const QUALITY_OPTIONS = [
    { label: "Cà phê đặc sản (SCA 80+)", value: "SCA 80+" },
    { label: "Robusta chất lượng cao (Fine Robusta)", value: "Fine Robusta" },
    { label: "Loại A", value: "Grade A" },
    { label: "Hữu cơ (Organic)", value: "Organic" },
    { label: "Tiêu chuẩn cơ bản", value: "Standard" },
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
            <Select
              value={form.plannedQuality}
              onValueChange={(value) =>
                setForm((prev) => ({ ...prev, plannedQuality: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="-- Chọn chất lượng --" />
              </SelectTrigger>
              <SelectContent>
                {QUALITY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
