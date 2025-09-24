"use client";

import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuthGuard } from "@/lib/auth/useAuthGuard";
import {
  CoffeeType,
  createCoffeeType,
  getCoffeeTypes,
} from "@/lib/api/coffeeType";
import { AppToast } from "@/components/ui/AppToast";
import { useTranslation } from "react-i18next";
import { getErrorMessage } from "@/lib/utils";
import CoffeeTypeForm, {
  CoffeeTypeFormData,
} from "@/components/coffee-types/coffeeTypeForm";

export default function CreateCoffeePage() {
  // Kiểm tra quyền admin
  useAuthGuard(["admin"]);

  const { t } = useTranslation();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [parentCoffeeTypes, setParentCoffeeTypes] = useState<CoffeeType[]>([]);
  const [form, setForm] = useState<CoffeeTypeFormData>({
    typeName: "",
    typeCode: "",
    botanicalName: "",
    description: "",
    typicalRegion: "",
    specialtyLevel: "",
    coffeeTypeCategory: "",
    coffeeTypeParentId: "",
  });

  const fetchCoffeeTypes = async () => {
    setLoading(true);
    const data = await getCoffeeTypes().catch((error) => {
      console.error(
        "Lỗi khi lấy danh sách coffeeTypes:",
        getErrorMessage(error)
      );
      return [];
    });
    const filteredData = data.filter(
      (ct) => ct.coffeeTypeCategory === "general"
    );
    setParentCoffeeTypes(filteredData);
    setLoading(false);
  };

  const validateForm = (): { isValid: boolean; errorMessages: string[] } => {
    const newErrors: Record<string, string> = {};
    if (!form.typeName)
      newErrors.typeName = t("coffeeType.create.validation.typeNameRequired");
    if (!form.botanicalName)
      newErrors.botanicalName = t(
        "coffeeType.create.validation.botanicalNameRequired"
      );
    // if (!form.typicalRegion)
    //   newErrors.typicalRegion = t(
    //     "coffeeType.create.validation.typicalRegionRequired"
    //   );
    // if (!form.specialtyLevel)
    //   newErrors.specialtyLevel = t(
    //     "coffeeType.create.validation.specialtyLevelRequired"
    //   );

    setErrors(newErrors);
    //return Object.keys(newErrors).length === 0;
    const errorMessages = Object.values(newErrors);
    return {
      isValid: errorMessages.length === 0,
      errorMessages,
    };
  };

  const handleFormChange = (formData: CoffeeTypeFormData) => {
    // Loại bỏ trường parentCoffeeTypes khỏi formData nếu có
    const { parentCoffeeTypes, ...formattedData } = formData;
    // Nếu coffeeTypeParentId rỗng thì loại bỏ trường này khỏi formattedData
    if (!formattedData.coffeeTypeParentId) {
      delete formattedData.coffeeTypeParentId;
    }
    setForm(formattedData);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    const { isValid, errorMessages } = validateForm();
    if (!isValid) {
      setIsSubmitting(false);
      AppToast.error(errorMessages.join("\n")); // show errors from validateForm directly
      return;
    }
    //console.log("Submitting form data:", form);

    try {
      await createCoffeeType(form);
      AppToast.success(t("coffeeType.create.messages.createSuccess"));
      router.push("/dashboard/admin/coffee-types");
    } catch (error) {
      console.error("Lỗi khi tạo coffeeType:", getErrorMessage(error));
      AppToast.error(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    fetchCoffeeTypes();
  }, []);

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
            Quay lại
          </Button>
        </div>

        {/* Form */}
        <CoffeeTypeForm
          initialData={form}
          availableCoffeeTypes={parentCoffeeTypes}
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
