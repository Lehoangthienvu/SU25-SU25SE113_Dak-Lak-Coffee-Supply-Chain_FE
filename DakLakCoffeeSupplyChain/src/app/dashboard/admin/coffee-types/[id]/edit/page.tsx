"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { AppToast } from "@/components/ui/AppToast";
import { getErrorMessage } from "@/lib/utils";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { useAuthGuard } from "@/lib/auth/useAuthGuard";
import { useTranslation } from "react-i18next";
import CoffeeTypeForm, {
  CoffeeTypeFormData,
} from "@/components/coffee-types/coffeeTypeForm";
import { getCoffeeTypeById, updateCoffeeType } from "@/lib/api/coffeeType";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

function EditCoffeeType() {
  useAuthGuard(["admin"]);
  const { t } = useTranslation();

  const router = useRouter();
  const params = useParams();
  const coffeeTypeId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [initialData, setInitialData] = useState<CoffeeTypeFormData | null>(
    null
  );

  useEffect(() => {
    fetchData(coffeeTypeId);
  }, [coffeeTypeId]);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const fetchData = async (coffeeTypeId: string) => {
    setLoading(true);
    try {
      const [coffeeTypeData] = await Promise.all([
        getCoffeeTypeById(coffeeTypeId),
      ]);

      if (coffeeTypeData) {
        const formattedData: CoffeeTypeFormData = {
          typeName: coffeeTypeData.typeName || "",
          typeCode: coffeeTypeData.typeCode || "",
          botanicalName: coffeeTypeData.botanicalName || "",
          description: coffeeTypeData.description || "",
          typicalRegion: coffeeTypeData.typicalRegion || "",
          specialtyLevel: coffeeTypeData.specialtyLevel || "",
        };
        setInitialData(formattedData);
      }
    } catch (error) {
      console.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const [formData, setFormData] = useState<CoffeeTypeFormData | null>(null);

  // Cập nhật dữ liệu form khi component con báo về thay đổi
  const handleFormChange = (data: CoffeeTypeFormData) => {
    setFormData(data);
  };

  // Validate form

  const validateForm = (data: CoffeeTypeFormData) => {
    const newErrors: Record<string, string> = {};
    if (!data.typeName)
      newErrors.title = t("coffeeType.create.validation.typeNameRequired");
    if (!data.typeCode)
      newErrors.typeCode = t("coffeeType.create.validation.typeCodeRequired");
    if (!data.botanicalName)
      newErrors.botanicalName = t(
        "coffeeType.create.validation.botanicalNameRequired"
      );
    // if (!data.description)
    //   newErrors.description = t(
    //     "coffeeType.create.validation.descriptionRequired"
    //   );
    // if (!data.typicalRegion)
    //   newErrors.typicalRegion = t(
    //     "coffeeType.create.validation.typicalRegionRequired"
    //   );
    // if (!data.specialtyLevel)
    //   newErrors.specialtyLevel = t(
    //     "coffeeType.create.validation.specialtyLevelRequired"
    //   );
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

    try {
      await updateCoffeeType(
        {
          coffeeTypeId: coffeeTypeId,
          typeName: formData.typeName,
          botanicalName: formData.botanicalName,
          description: formData.description,
          typicalRegion: formData.typicalRegion,
          specialtyLevel: formData.specialtyLevel,
        },
        coffeeTypeId
      );

      AppToast.success(t("coffeeType.edit.messages.editSuccess"));
      router.push("/dashboard/admin/coffee-types");
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
    <div className='flex flex-col items-center space-y-6'>
      <main className='w-full max-w-2xl'>
        {/* Header */}
        <div className='mb-4'>
          <Button
            variant='outline'
            onClick={() => router.back()}
            className='flex items-center gap-2'
          >
            <ArrowLeft className='w-4 h-4' />
            {t("common.back")}
          </Button>
        </div>

        {/* Form */}
        <CoffeeTypeForm
          initialData={initialData}
          loading={loading}
          errors={errors}
          isSubmitting={isSubmitting}
          onChange={handleFormChange}
          onSubmit={handleSubmit}
        />
      </main>
    </div>
  );
}

export default function EditCoffeeTypePage() {
  const { t } = useTranslation();
  return (
    <Suspense fallback={<div>{t("common.loading")}</div>}>
      <EditCoffeeType />
    </Suspense>
  );
}
