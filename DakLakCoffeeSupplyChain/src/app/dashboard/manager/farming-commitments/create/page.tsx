"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthGuard } from "@/lib/auth/useAuthGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppToast } from "@/components/ui/AppToast";
import { getErrorMessage } from "@/lib/utils";
import { createFarmingCommitment } from "@/lib/api/farmingCommitments";
import {
  CultivationRegistration,
  getCultivationRegistrationById,
} from "@/lib/api/cultivationRegistrations";
import FarmingCommitmentFormGuide from "@/components/farming-commitments/FarmingCommitmentFormGuide";
import FarmingCommitmentForm, {
  FarmingCommitmentFormData,
} from "@/components/farming-commitments/FarmingCommitmentForm";
import { calculateEstimatedDeliveryDates } from "@/lib/helpers/dateHelpers";
import { useTranslation } from "react-i18next";

function CreateFarmingCommitmentContent() {
  useAuthGuard(["manager"]);
  const { t } = useTranslation();

  const searchParams = useSearchParams();
  const paramRegistrationId = searchParams.get("registrationId") || "";
  const router = useRouter();

  const [form, setForm] = useState<FarmingCommitmentFormData>({
    commitmentName: "",
    note: "",
    farmingCommitmentDetails: [],
  });

  const [loading, setLoading] = useState(true);
  const [registration, setRegistration] =
    useState<CultivationRegistration | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (paramRegistrationId) {
      fetchRegistration(paramRegistrationId);
    }
  }, [paramRegistrationId]);

  // Tự động điền form khi có dữ liệu registration
  useEffect(() => {
    if (
      registration &&
      registration.cultivationRegistrationDetails.length > 0
    ) {
      const approvedDetails =
        registration.cultivationRegistrationDetails.filter(
          (detail) => detail.status === "Approved"
        );

      if (approvedDetails.length > 0) {
        setForm((prev) => ({
          ...prev,
          farmingCommitmentDetails: approvedDetails.map((detail) => {
            // Tính toán ngày giao hàng dự kiến
            const { estimatedDeliveryStart, estimatedDeliveryEnd } =
              calculateEstimatedDeliveryDates(detail.expectedHarvestEnd || "");

            return {
              registrationDetailId:
                detail.cultivationRegistrationDetailId || "",
              confirmedPrice: detail.wantedPrice || 0,
              advancePayment: 0,
              committedQuantity: detail.estimatedYield || 0,
              estimatedDeliveryStart,
              estimatedDeliveryEnd,
              note: "",
            };
          }),
        }));
      }
    }
  }, [registration]);

  //#region API Calls

  const fetchRegistration = async (registrationId: string) => {
    setLoading(true);
    const data = await getCultivationRegistrationById(registrationId).catch(
      (error) => {
        AppToast.error(getErrorMessage(error));
        return null;
      }
    );
    setRegistration(data);
    console.log("Fetched Registration:", data);
    setLoading(false);
  };
  //#endregion

  const validateForm = (): { isValid: boolean; errorMessages: string[] } => {
    const newErrors: Record<string, string> = {};
    if (!form.commitmentName) {
      newErrors.commitmentName = t(
        "farmingCommitment.components.farmingCommitmentForm.validation.commitmentName"
      );
    }
    if (form.farmingCommitmentDetails.length === 0) {
      newErrors.farmingCommitmentDetails = t(
        "farmingCommitment.components.farmingCommitmentForm.validation.detailsRequired"
      );
    } else {
      form.farmingCommitmentDetails.forEach((detail, index) => {
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
    const errorMessages = Object.values(newErrors);
    return {
      isValid: errorMessages.length === 0,
      errorMessages,
    };
  };

  //#region Form Handlers
  const handleFormChange = (formData: FarmingCommitmentFormData) => {
    setForm(formData);
  };

  const handleAddDetail = () => {
    setForm((prev) => ({
      ...prev,
      farmingCommitmentDetails: [
        ...prev.farmingCommitmentDetails,
        {
          registrationDetailId: "",
          confirmedPrice: 0,
          advancePayment: 0,
          committedQuantity: 0,
          estimatedDeliveryStart: "",
          estimatedDeliveryEnd: "",
          note: "",
        },
      ],
    }));
  };

  const handleRemoveDetail = (index: number) => {
    setForm((prev) => {
      const details = [...prev.farmingCommitmentDetails];
      details.splice(index, 1);
      return { ...prev, farmingCommitmentDetails: details };
    });
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    const { isValid, errorMessages } = validateForm();
    if (!isValid) {
      setIsSubmitting(false);
      AppToast.error(errorMessages.join("\n"));
      return;
    }

    try {
      // Convert form data to API format
      const apiData = {
        commitmentName: form.commitmentName,
        registrationId: paramRegistrationId,
        note: form.note,
        farmingCommitmentsDetailsCreateDtos: form.farmingCommitmentDetails.map(
          (detail) => ({
            registrationDetailId: detail.registrationDetailId,
            confirmedPrice: detail.confirmedPrice,
            advancePayment: detail.advancePayment,
            committedQuantity: detail.committedQuantity,
            estimatedDeliveryStart: detail.estimatedDeliveryStart,
            estimatedDeliveryEnd: detail.estimatedDeliveryEnd,
            note: detail.note,
          })
        ),
      };

      await createFarmingCommitment(apiData);
      AppToast.success(t("farmingCommitment.pages.create.success"));
      router.push("/dashboard/manager/farming-commitments");

      setErrors({});
      setForm({
        commitmentName: "",
        note: "",
        farmingCommitmentDetails: [],
      });
    } catch (error) {
      AppToast.error(
        getErrorMessage(error) || t("farmingCommitment.pages.create.error")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  //#endregion

  return (
    <div className='min-h-screen py-8'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Header */}
        <div className='mb-8'>
          <h1 className='text-3xl font-bold text-gray-900'>
            {t("farmingCommitment.pages.create.title")}
          </h1>
          <p className='text-gray-600 mt-2'>
            {t("farmingCommitment.pages.create.subtitle")}
          </p>
        </div>

        {/* Main Content */}
        <div className='flex flex-col lg:flex-row gap-8'>
          {/* Sidebar with Guide */}
          <aside className='lg:w-96 flex-shrink-0'>
            <div className='sticky top-8'>
              <FarmingCommitmentFormGuide />
            </div>
          </aside>

          {/* Form Content */}
          <div className='flex-1'>
            <Card className='shadow-lg border-0 p-0'>
              <CardHeader className='bg-gradient-to-r from-orange-600 to-orange-700 text-white px-6 py-6 m-0 rounded-t-xl'>
                <CardTitle className='text-white text-2xl font-bold'>
                  {t("farmingCommitment.pages.create.form.title")}
                </CardTitle>
                <p className='text-green-100 text-sm mt-1'>
                  {t("farmingCommitment.pages.create.form.subtitle")}
                </p>
              </CardHeader>
              <CardContent className='p-6'>
                <FarmingCommitmentForm
                  initialData={form}
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
        </div>
      </div>
    </div>
  );
}

export default function CreateFarmingCommitmentPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CreateFarmingCommitmentContent />
    </Suspense>
  );
}
