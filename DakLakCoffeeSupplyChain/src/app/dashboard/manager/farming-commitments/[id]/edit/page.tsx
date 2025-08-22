"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { AppToast } from "@/components/ui/AppToast";
import { getErrorMessage } from "@/lib/utils";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { useAuthGuard } from "@/lib/auth/useAuthGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CultivationRegistration,
  getCultivationRegistrationById,
} from "@/lib/api/cultivationRegistrations";
import FarmingCommitmentForm, { FarmingCommitmentFormData } from "@/components/farming-commitments/FarmingCommitmentForm";
import { getCommitmentById, updateFarmingCommitment } from "@/lib/api/farmingCommitments";

function EditFarmmingCommitmentContent() {
  useAuthGuard(["manager"]);

  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const commitmentId = params.id as string;
  const registrationId = searchParams.get("registrationId") as string;
  console.log("registrationId: ", registrationId);
  console.log("commitmentId: ", commitmentId);

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [registration, setRegistration] =
    useState<CultivationRegistration | null>(null);
  const [initialData, setInitialData] =
    useState<FarmingCommitmentFormData | null>(null);

  useEffect(() => {
    fetchData(commitmentId, registrationId);
  }, [commitmentId, registrationId]);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const fetchData = async (commitmentId: string, registrationId: string) => {
    setLoading(true);
    try {
      const [registrationData, commitmentData] = await Promise.all([
        getCultivationRegistrationById(registrationId),
        getCommitmentById(commitmentId),
      ]);
      setRegistration(registrationData);

      if (commitmentData) {
        const formattedData: FarmingCommitmentFormData = {
          commitmentName: commitmentData.commitmentName,
          note: commitmentData.note,
          farmingCommitmentDetails: commitmentData.farmingCommitmentDetails.map(
            (detail) => ({
              commitmentDetailId: detail.commitmentDetailId ?? "",
              registrationDetailId: detail.registrationDetailId ?? "",
              confirmedPrice: detail.confirmedPrice ?? 0,
              advancePayment: detail.advancePayment ?? 0,
              committedQuantity: detail.committedQuantity ?? 0,
              estimatedDeliveryStart: detail.estimatedDeliveryStart
                ? detail.estimatedDeliveryStart.split("T")[0]
                : "",
              estimatedDeliveryEnd: detail.estimatedDeliveryEnd
                ? detail.estimatedDeliveryEnd.split("T")[0]
                : "",
              note: detail.note ?? "",
              contractDeliveryItemId: detail.contractDeliveryItemId ?? "",
            })
          ),
        };
        setInitialData(formattedData);
      }
    } catch (error) {
      AppToast.error(
        "Không tải được dữ liệu cam kết: " + getErrorMessage(error)
      );
    } finally {
      setLoading(false);
    }
  };

  // State để lưu form tạm thời (do form trong component con kiểm soát, cần sync lại ở trang cha)
  const [formData, setFormData] = useState<FarmingCommitmentFormData | null>(
    null
  );

  // Cập nhật dữ liệu form khi component con báo về thay đổi
  const handleFormChange = (data: FarmingCommitmentFormData) => {
    setFormData(data);
  };

  // Thêm chi tiết
  const handleAddDetail = () => {
    if (!formData) return;
    setFormData({
      ...formData,
      farmingCommitmentDetails: [
        ...formData.farmingCommitmentDetails,
        {
          commitmentDetailId: "",
          registrationDetailId: "",
          confirmedPrice: 0,
          advancePayment: 0,
          committedQuantity: 0,
          estimatedDeliveryStart: "",
          estimatedDeliveryEnd: "",
          note: "",
          //contractDeliveryItemId: "",
        },
      ],
    });
  };

  // Xóa chi tiết
  const handleRemoveDetail = (index: number) => {
    if (!formData) return;

    // Chỉ cho phép xóa khi số lượng chi tiết >= 2
    if (formData.farmingCommitmentDetails.length <= 1) return;

    setFormData({
      ...formData,
      farmingCommitmentDetails: formData.farmingCommitmentDetails.filter(
        (_, i) => i !== index
      ),
    });
  };
  // Validate form (có thể tái sử dụng validateForm từ page create nếu muốn)

  const validateForm = (data: FarmingCommitmentFormData) => {
    const newErrors: Record<string, string> = {};
    if (!data.commitmentName) newErrors.title = "Vui lòng nhập tên cam kết.";
    if (data.farmingCommitmentDetails.length === 0) {
      newErrors.farmingCommitmentDetails =
        "Vui lòng thêm ít nhất một chi tiết cam kết.";
    } else {
      data.farmingCommitmentDetails.forEach((detail, index) => {
        if (!detail.registrationDetailId) {
          newErrors[`registrationDetailId-${index}`] =
            "ID chi tiết đăng ký là bắt buộc.";
        }
        if (detail.confirmedPrice <= 0) {
          newErrors[`confirmedPrice-${index}`] = "Giá xác nhận phải lớn hơn 0.";
        }
        if (detail.committedQuantity <= 0) {
          newErrors[`committedQuantity-${index}`] =
            "Số lượng cam kết phải lớn hơn 0.";
        }
        if (!detail.estimatedDeliveryStart) {
          newErrors[`estimatedDeliveryStart-${index}`] =
            "Ngày giao hàng dự kiến bắt đầu là bắt buộc.";
        }
        if (!detail.estimatedDeliveryEnd) {
          newErrors[`estimatedDeliveryEnd-${index}`] =
            "Ngày giao hàng dự kiến kết thúc là bắt buộc.";
        }
        if (
          new Date(detail.estimatedDeliveryStart) >
          new Date(detail.estimatedDeliveryEnd)
        ) {
          newErrors[`deliveryDate-${index}`] =
            "Ngày giao hàng bắt đầu phải trước ngày kết thúc.";
        }
        if (!detail.note) {
          newErrors[`note-${index}`] =
            "Các chính sách cụ thể không được để trống.";
        }
      });
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit cập nhật kế hoạch
  const handleSubmit = async () => {
    if (!formData) {
      AppToast.error(getErrorMessage(errors));
      return;
    }
    setIsSubmitting(true);
    if (!validateForm(formData)) {
      setIsSubmitting(false);
      AppToast.error(getErrorMessage(errors));
      return;
    }

    const detailsUpdateDto = formData.farmingCommitmentDetails
      .filter((item) => item.commitmentDetailId && item.commitmentDetailId.trim() !== "")
      .map((item) => ({
        commitmentDetailId: item.commitmentDetailId,
        registrationDetailId: item.registrationDetailId,
        confirmedPrice: item.confirmedPrice,
        advancePayment: item.advancePayment,
        committedQuantity: item.committedQuantity,
        estimatedDeliveryStart: item.estimatedDeliveryStart,
        estimatedDeliveryEnd: item.estimatedDeliveryEnd,
        note: item.note,
      }));

    try {
      await updateFarmingCommitment(commitmentId, {
        commitmentName: formData.commitmentName,
        note: formData.note,
        farmingCommitmentsDetailsUpdateDtos: detailsUpdateDto,
      });

      AppToast.success("Cập nhật cam kết thành công!");
      router.push("/dashboard/manager/farming-commitments");
    } catch (error) {
      AppToast.error(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || !initialData) {
    return (
      <div className='flex justify-center items-center h-60'>
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className='max-w-2xl mx-auto py-10 px-4'>
      <Card>
        <CardHeader>
          <CardTitle>Chỉnh sửa cam kết</CardTitle>
        </CardHeader>
        <CardContent>
          <FarmingCommitmentForm
            initialData={formData || initialData}
            registration={registration || undefined}
            loading={loading}
            errors={errors}
            isSubmitting={isSubmitting}
            onChange={handleFormChange}
            onSubmit={handleSubmit}
            onAddDetail={handleAddDetail}
            onRemoveDetail={handleRemoveDetail}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default function EditFarmmingCommitmentPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EditFarmmingCommitmentContent />
    </Suspense>
  );
}
