"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { AppToast } from "@/components/ui/AppToast";
import { getErrorMessage } from "@/lib/utils";
import ProcurementPlanForm, {
  ProcurementPlanFormData,
} from "@/components/procurement-plan/ProcurementPlanForm";
import { CoffeeType, getCoffeeTypes } from "@/lib/api/coffeeType";
import {
  getAllProcessingMethods,
  ProcessingMethod,
} from "@/lib/api/processingMethods";
import {
  getProcurementPlanById,
  updateProcurementPlan,
} from "@/lib/api/procurementPlans";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { useAuthGuard } from "@/lib/auth/useAuthGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ProcurementPlanFormGuide from "@/components/procurement-plan/ProcurementPlanFormGuide";

export default function EditProcurementPlanPage() {
  useAuthGuard(["manager"]);
  const { t } = useTranslation();

  const router = useRouter();
  const params = useParams();
  const planId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [availableCoffeeTypes, setAvailableCoffeeTypes] = useState<
    CoffeeType[]
  >([]);
  const [availableProcessingMethods, setAvailableProcessingMethods] = useState<
    ProcessingMethod[]
  >([]);
  const [initialData, setInitialData] =
    useState<ProcurementPlanFormData | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [coffeeTypes, processingMethods, planData] = await Promise.all([
          getCoffeeTypes(),
          getAllProcessingMethods(),
          getProcurementPlanById(planId),
        ]);

        setAvailableCoffeeTypes(coffeeTypes);
        setAvailableProcessingMethods(processingMethods);

        // Chuyển format dữ liệu planData về đúng cấu trúc của form
        if (planData) {
          const formattedData: ProcurementPlanFormData = {
            title: planData.title,
            description: planData.description,
            startDate: planData.startDate.split("T")[0], // nếu API trả về ISO string
            endDate: planData.endDate.split("T")[0],
            procurementPlansDetails: planData.procurementPlansDetails.map(
              (detail: any) => ({
                planDetailsId: detail.planDetailsId,
                coffeeTypeId: detail.coffeeTypeId,
                processMethodId: detail.processMethodId || 0,
                targetQuantity: detail.targetQuantity,
                targetRegion: detail.targetRegion || "",
                minimumRegistrationQuantity: detail.minimumRegistrationQuantity,
                minPriceRange: detail.minPriceRange,
                maxPriceRange: detail.maxPriceRange,
                expectedYieldPerHectare: detail.expectedYieldPerHectare,
                note: detail.note || "",
                contractItemId: detail.contractItemId || null,
              })
            ),
          };
          //console.log("Formatted Data:", formattedData);
          //console.log("planData:", planData);
          setInitialData(formattedData);
        }
      } catch (error) {
        AppToast.error(
          t('procurementPlan.pages.edit.error', { error: getErrorMessage(error) })
        );
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [planId, t]);
  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  // State để lưu form tạm thời (do form trong component con kiểm soát, cần sync lại ở trang cha)
  const [formData, setFormData] = useState<ProcurementPlanFormData | null>(
    null
  );

  // Validate form
  const validateForm = (
    data: ProcurementPlanFormData
  ): { isValid: boolean; errorMessages: string[] } => {
    const newErrors: Record<string, string> = {};
    if (!data.title) newErrors.title = t('procurementPlan.pages.edit.validation.title');
    if (!data.startDate) newErrors.startDate = t('procurementPlan.pages.edit.validation.startDate');
    if (!data.endDate) newErrors.endDate = t('procurementPlan.pages.edit.validation.endDate');
    if (
      data.startDate &&
      new Date(data.startDate) <
        new Date(new Date().toISOString().split("T")[0])
    ) {
      newErrors.startDate = t('procurementPlan.pages.edit.validation.startDatePast');
    }
    if (new Date(data.startDate) >= new Date(data.endDate))
      newErrors.endDate = t('procurementPlan.pages.edit.validation.endDateAfterStart');
    if (!data.description) newErrors.description = t('procurementPlan.pages.edit.validation.description');
    if (data.procurementPlansDetails.length === 0) {
      newErrors.procurementPlansDetails = t('procurementPlan.pages.edit.validation.detailsRequired');
    } else {
      data.procurementPlansDetails.forEach((detail, index) => {
        if (!detail.coffeeTypeId)
          newErrors[`coffeeTypeId-${index}`] = t('procurementPlan.pages.edit.validation.coffeeType');
        if (detail.processMethodId === 0)
          newErrors[`processMethodId-${index}`] = t('procurementPlan.pages.edit.validation.processingMethod');
        if (detail.targetQuantity < 100)
          newErrors[`targetQuantity-${index}`] = t('procurementPlan.pages.edit.validation.targetQuantity');
        if (detail.minimumRegistrationQuantity < 100)
          newErrors[`minimumRegistrationQuantity-${index}`] = t('procurementPlan.pages.edit.validation.minRegistrationQuantity');
        if (detail.minimumRegistrationQuantity > detail.targetQuantity) {
          newErrors[`minimumRegistrationQuantity-${index}`] = t('procurementPlan.pages.edit.validation.minRegistrationQuantityMax');
        }
        if (detail.minPriceRange < 1000)
          newErrors[`minPriceRange-${index}`] = t('procurementPlan.pages.edit.validation.minPrice');
        if (detail.maxPriceRange < detail.minPriceRange)
          newErrors[`maxPriceRange-${index}`] = t('procurementPlan.pages.edit.validation.maxPrice');
        // if (detail.expectedYieldPerHectare <= 0)
        //   newErrors[`expectedYieldPerHectare-${index}`] =
        //     "Sản lượng dự kiến trên 1 ha phải lớn hơn 0.";
      });
    }
    setErrors(newErrors);
    //return Object.keys(newErrors).length === 0;
    const errorMessages = Object.values(newErrors);
    return {
      isValid: errorMessages.length === 0,
      errorMessages,
    };
  };

  //#region Handle functions
  // Submit cập nhật kế hoạch
  const handleSubmit = async () => {
    if (!formData) {
      AppToast.error(getErrorMessage(errors));
      return;
    }
    setIsSubmitting(true);
    const { isValid, errorMessages } = validateForm(formData);
    if (!isValid) {
      setIsSubmitting(false);
      AppToast.error(errorMessages.join("\n")); // show errors from validateForm directly
      return;
    }

    const detailsUpdateDto = formData.procurementPlansDetails
      .filter((item) => item.planDetailsId && item.planDetailsId.trim() !== "")
      .map((item) => {
        const detail: any = {
          planDetailsId: item.planDetailsId,
          coffeeTypeId: item.coffeeTypeId,
          targetQuantity: item.targetQuantity,
          targetRegion: item.targetRegion,
          minimumRegistrationQuantity: item.minimumRegistrationQuantity,
          minPriceRange: item.minPriceRange,
          maxPriceRange: item.maxPriceRange,
          expectedYieldPerHectare: item.expectedYieldPerHectare,
          note: item.note,
          //contractItemId: item.contractItemId ?? null,
        };
        if (item.processMethodId && item.processMethodId !== 0) {
          detail.processMethodId = item.processMethodId;
        }
        return detail;
      });

    const detailsCreateDto = formData.procurementPlansDetails
      .filter((item) => !item.planDetailsId || item.planDetailsId.trim() === "")
      .map((item) => {
        const detail: any = {
          coffeeTypeId: item.coffeeTypeId,
          targetQuantity: item.targetQuantity,
          targetRegion: item.targetRegion,
          minimumRegistrationQuantity: item.minimumRegistrationQuantity,
          minPriceRange: item.minPriceRange,
          maxPriceRange: item.maxPriceRange,
          expectedYieldPerHectare: item.expectedYieldPerHectare,
          note: item.note,
          //contractItemId: item.contractItemId ?? null,
        };
        if (item.processMethodId && item.processMethodId !== 0) {
          detail.processMethodId = item.processMethodId;
        }
        return detail;
      });

    try {
      await updateProcurementPlan(planId, {
        title: formData.title,
        description: formData.description,
        startDate: formData.startDate,
        endDate: formData.endDate,
        procurementPlansDetailsUpdateDto: detailsUpdateDto,
        procurementPlansDetailsCreateDto: detailsCreateDto,
      });

      AppToast.success(t('procurementPlan.pages.edit.success'));
      router.push("/dashboard/manager/procurement-plans");
    } catch (error) {
      AppToast.error(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cập nhật dữ liệu form khi component con báo về thay đổi
  const handleFormChange = (data: ProcurementPlanFormData) => {
    setFormData(data);
  };

  // Thêm chi tiết kế hoạch
  const handleAddDetail = () => {
    if (!formData) return;
    setFormData({
      ...formData,
      procurementPlansDetails: [
        ...formData.procurementPlansDetails,
        {
          coffeeTypeId: "",
          processMethodId: 0,
          targetQuantity: 0,
          targetRegion: "",
          minimumRegistrationQuantity: 0,
          minPriceRange: 0,
          maxPriceRange: 0,
          expectedYieldPerHectare: 0,
          note: "",
        },
      ],
    });
  };

  // Xóa chi tiết
  const handleRemoveDetail = (index: number) => {
    if (!formData) return;

    // Chỉ cho phép xóa khi số lượng chi tiết >= 2
    if (formData.procurementPlansDetails.length <= 1) return;

    setFormData({
      ...formData,
      procurementPlansDetails: formData.procurementPlansDetails.filter(
        (_, i) => i !== index
      ),
    });
  };

  //endregion

  if (loading || !initialData) {
    return (
      <div className='flex justify-center items-center h-60'>
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className='min-h-screen py-8'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Header */}
        <div className='mb-8'>
          <h1 className='text-3xl font-bold text-gray-900'>
            {t('procurementPlan.pages.edit.title')}
          </h1>
          <p className='mt-2 text-gray-600'>
            {t('procurementPlan.pages.edit.subtitle')}
          </p>
        </div>

        {/* Main content */}
        <div className='flex flex-col lg:flex-row gap-8'>
          {/* Left sidebar - Form Guide */}
          <aside className='lg:w-96 flex-shrink-0'>
            <div className='sticky top-8'>
              <ProcurementPlanFormGuide />
            </div>
          </aside>

          {/* Right main content - Form */}
          <main className='flex-1'>
            <Card className='shadow-lg border-0 p-0'>
              <CardHeader className='bg-gradient-to-r from-amber-500 to-orange-400 text-white rounded-t-xl'>
                <CardTitle className='text-white text-3xl font-bold pt-6'>
                  {t('procurementPlan.pages.edit.form.title')}
                </CardTitle>
                <p className='text-white text-md mt-1 pb-4'>
                  {t('procurementPlan.pages.edit.form.subtitle')}
                </p>
              </CardHeader>
              <CardContent className='p-6'>
                <ProcurementPlanForm
                  initialData={formData || initialData}
                  availableCoffeeTypes={availableCoffeeTypes}
                  availableProcessingMethods={availableProcessingMethods}
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
          </main>
        </div>
      </div>
    </div>
  );
}
