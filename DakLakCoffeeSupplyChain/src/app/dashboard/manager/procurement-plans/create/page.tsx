"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useAuthGuard } from "@/lib/auth/useAuthGuard";
import { AppToast } from "@/components/ui/AppToast";
import { getErrorMessage } from "@/lib/utils";
import { CoffeeType, getCoffeeTypes } from "@/lib/api/coffeeType";
import {
  getAllProcessingMethods,
  ProcessingMethod,
} from "@/lib/api/processingMethods";
import { createProcurementPlan } from "@/lib/api/procurementPlans";
import { createVnPayUrl, getPlanPostingFee } from "@/lib/api/payments";
import ProcurementPlanForm, {
  ProcurementPlanFormData,
} from "@/components/procurement-plan/ProcurementPlanForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ProcurementPlanFormGuide from "@/components/procurement-plan/ProcurementPlanFormGuide";
import { getTargetRegionOptions, REGIONS } from "@/lib/api/regions";

export default function CreateProcurementPlanPage() {
  useAuthGuard(["manager"]);
  const { t } = useTranslation();

  const formatDate = (d: string) => new Date(d).toISOString().split("T")[0];
  const router = useRouter();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    procurementPlansDetails: [
      {
        coffeeTypeId: "",
        processMethodId: 0,
        targetQuantity: 0,
        //targetRegion: "",
        targetRegions: [""],
        minimumRegistrationQuantity: 0,
        minPriceRange: 0,
        maxPriceRange: 0,
        expectedYieldPerHectare: 0,
        note: "",
        //contractItemId: '',
      },
    ],
  });

  const validateForm = (): { isValid: boolean; errorMessages: string[] } => {
    const newErrors: Record<string, string> = {};
    if (!form.title)
      newErrors.title = t(
        "procurementPlan.components.procurementPlanForm.validation.title"
      );
    if (!form.startDate)
      newErrors.startDate = t(
        "procurementPlan.components.procurementPlanForm.validation.startDate"
      );
    if (!form.endDate)
      newErrors.endDate = t(
        "procurementPlan.components.procurementPlanForm.validation.endDate"
      );
    if (
      form.startDate &&
      new Date(form.startDate) <
      new Date(new Date().toISOString().split("T")[0])
    ) {
      newErrors.startDate = t(
        "procurementPlan.components.procurementPlanForm.validation.startDatePast"
      );
    }
    if (new Date(form.startDate) >= new Date(form.endDate))
      newErrors.endDate = t(
        "procurementPlan.components.procurementPlanForm.validation.endDateAfterStart"
      );
    if (!form.description)
      newErrors.description = t(
        "procurementPlan.components.procurementPlanForm.validation.description"
      );
    if (form.procurementPlansDetails.length === 0) {
      newErrors.procurementPlansDetails = t(
        "procurementPlan.components.procurementPlanForm.validation.detailsRequired"
      );
    } else {
      form.procurementPlansDetails.forEach((detail, index) => {
        if (!detail.coffeeTypeId) {
          newErrors[`coffeeTypeId-${index}`] = t(
            "procurementPlan.components.procurementPlanForm.validation.coffeeType"
          );
        }
        if (detail.processMethodId === 0) {
          newErrors[`processMethodId-${index}`] = t(
            "procurementPlan.components.procurementPlanForm.validation.processingMethod"
          );
        }
        if (detail.targetQuantity < 100) {
          newErrors[`targetQuantity-${index}`] = t(
            "procurementPlan.components.procurementPlanForm.validation.targetQuantity"
          );
        }
        if (detail.minimumRegistrationQuantity < 100) {
          newErrors[`minimumRegistrationQuantity-${index}`] = t(
            "procurementPlan.components.procurementPlanForm.validation.minRegistrationQuantity"
          );
        }
        if (detail.minimumRegistrationQuantity > detail.targetQuantity) {
          newErrors[`minimumRegistrationQuantity-${index}`] = t(
            "procurementPlan.components.procurementPlanForm.validation.minRegistrationQuantityMax"
          );
        }
        if (detail.minPriceRange < 1000) {
          newErrors[`minPriceRange-${index}`] = t(
            "procurementPlan.components.procurementPlanForm.validation.minPrice"
          );
        }
        if (detail.maxPriceRange < detail.minPriceRange) {
          newErrors[`maxPriceRange-${index}`] = t(
            "procurementPlan.components.procurementPlanForm.validation.maxPrice"
          );
        }
        if (detail.targetRegions.length === 0 || detail.targetRegions.some(r => r === "")) {
          newErrors[`targetRegions-${index}`] = t(
            "procurementPlan.components.procurementPlanForm.validation.targetRegions"
          );
        }
        // if (detail.expectedYieldPerHectare <= 0) {
        //   newErrors[`expectedYieldPerHectare-${index}`] =
        //     "Sản lượng dự kiến trên 1 ha phải lớn hơn 0.";
        // }
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

  const [availableCoffeeTypes, setAvailableCoffeeTypes] = useState<
    CoffeeType[]
  >([]);
  const [availableProcessingMethods, setAvailableProcessingMethods] = useState<
    ProcessingMethod[]
  >([]);
  const [targetRegions, setTargetRegions] = useState<REGIONS[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCoffeeTypes();
    fetchProcessingMethods();
    fetchTargetRegions();
  }, []);

  //#region API Calls
  const fetchCoffeeTypes = async () => {
    setLoading(true);
    const data = await getCoffeeTypes().catch((error) => {
      AppToast.error(getErrorMessage(error));
      return [];
    });
    const filtered = data.filter((ct) => ct.status === "Active");
    setAvailableCoffeeTypes(filtered);
    setLoading(false);
  };
  const fetchProcessingMethods = async () => {
    setLoading(true);
    const data = await getAllProcessingMethods().catch((error) => {
      AppToast.error(getErrorMessage(error));
      return [];
    });
    //console.log("processData: ", data);
    setAvailableProcessingMethods(data);
    setLoading(false);
  };
  const fetchTargetRegions = async () => {
    setLoading(true);
    const data = await getTargetRegionOptions().catch((error) => {
      AppToast.error(getErrorMessage(error));
      return [];
    });
    setTargetRegions(data);
    setLoading(false);
  };
  //#endregion

  //#region Form Handlers

  const handleFormChange = (formData: ProcurementPlanFormData) => {
    setForm(formData);
  };

  const handleAddDetail = () => {
    setForm((prev) => ({
      ...prev,
      procurementPlansDetails: [
        ...prev.procurementPlansDetails,
        {
          coffeeTypeId: "",
          processMethodId: 0,
          targetQuantity: 0,
          //targetRegion: "",
          targetRegions:[],
          minimumRegistrationQuantity: 0,
          minPriceRange: 0,
          maxPriceRange: 0,
          expectedYieldPerHectare: 0,
          note: "",
          //contractItemId: "",
        },
      ],
    }));
  };

  // Xóa card detail (ngoại trừ card mặc định thứ 0)
  const handleRemoveDetail = (index: number) => {
    if (!form) return;

    // Chỉ cho phép xóa khi số lượng chi tiết >= 2
    if (form.procurementPlansDetails.length <= 1) return;

    setForm({
      ...form,
      procurementPlansDetails: form.procurementPlansDetails.filter(
        (_, i) => i !== index
      ),
    });
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    const { isValid, errorMessages } = validateForm();
    if (!isValid) {
      setIsSubmitting(false);
      AppToast.error(errorMessages.join("\n")); // show errors from validateForm directly
      return;
    }

    try {
      const formDataToSend = {
        ...form,
        startDate: formatDate(form.startDate),
        endDate: formatDate(form.endDate),
        procurementPlansDetails: form.procurementPlansDetails.map((detail) => {
          const copy = { ...detail } as Partial<typeof detail>;
          // Nếu processMethodId = 0 (hoặc giá trị đại diện cho không chọn), xóa thuộc tính này
          if (!copy.processMethodId || copy.processMethodId === 0) {
            delete copy.processMethodId;
          }
          return copy;
        }),
      };
      const created = await createProcurementPlan(formDataToSend);

      if (created?.planId) {
        // Lấy phí thanh toán từ API thay vì hard-code
        try {
          const feeInfo = await getPlanPostingFee(created.planId); // ✅ truyền planId
          const params = new URLSearchParams({
            planId: created.planId,
            amount: feeInfo.amount.toString(),
            planTitle: encodeURIComponent(form.title),
          });

          router.push(
            `/dashboard/manager/procurement-plans/payment-notification?${params.toString()}`
          );
          return;
        } catch (error) {
          console.error("Không thể lấy thông tin phí thanh toán:", error);
          AppToast.error("Không thể lấy thông tin phí thanh toán");
          return;
        }
      }

      AppToast.success(t("procurementPlan.pages.create.success"));
      router.push("/dashboard/manager/procurement-plans");
    } catch (err) {
      const message = getErrorMessage(err);
      AppToast.error(message);

      if (message.includes("Ngày bắt đầu phải trước ngày kết thúc")) {
        setForm((prev) => ({ ...prev, startDate: "", endDate: "" }));
      }
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
            {t("procurementPlan.pages.create.title")}
          </h1>
          <p className='mt-2 text-gray-600'>
            {t("procurementPlan.pages.create.subtitle")}
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
                  {t("procurementPlan.pages.create.form.title")}
                </CardTitle>
                <p className='text-white text-md mt-1 pb-4'>
                  {t("procurementPlan.pages.create.form.subtitle")}
                </p>
              </CardHeader>
              <CardContent className='p-6'>
                <ProcurementPlanForm
                  initialData={form}
                  availableCoffeeTypes={availableCoffeeTypes}
                  availableProcessingMethods={availableProcessingMethods}
                  targetRegions={targetRegions}
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
