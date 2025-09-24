import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { LoadingButton } from "@/components/ui/loadingProgress";
import { useTranslation } from "react-i18next";
import { CoffeeType } from "@/lib/api/coffeeType";
import LoadingSpinner from "../ui/LoadingSpinner";

export interface CoffeeTypeFormData {
  typeName: string;
  typeCode: string;
  botanicalName: string;
  description: string;
  typicalRegion: string;
  specialtyLevel: string;
  coffeeTypeCategory: string;
  coffeeTypeParentId?: string;
  parentCoffeeTypes?: CoffeeType[];
}

interface Props {
  initialData?: CoffeeTypeFormData;
  availableCoffeeTypes: CoffeeType[];
  loading: boolean;
  errors: Record<string, string>;
  isSubmitting: boolean;
  onChange: (formData: CoffeeTypeFormData) => void;
  onSubmit: () => void;
}

export default function CoffeeTypeForm({
  initialData,
  availableCoffeeTypes,
  loading,
  errors,
  isSubmitting,
  onChange,
  onSubmit,
}: Props) {
  const { t } = useTranslation();
  const [form, setForm] = useState<CoffeeTypeFormData>(
    initialData || {
      typeName: "",
      typeCode: "",
      botanicalName: "",
      description: "",
      typicalRegion: "",
      specialtyLevel: "",
      coffeeTypeCategory: "",
      coffeeTypeParentId: "",
      parentCoffeeTypes: [],
    }
  );

  // useEffect(() => {
  //   if (initialData) {
  //     setForm(initialData);
  //   }
  // }, [initialData]);

  // Khi giá trị form thay đổi sẽ đẩy lên parent
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    const newForm = { ...form, [name]: value };
    setForm(newForm);
    onChange(newForm);
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <div className='space-y-6'>
        {/* Basic Information Section */}
        <div className='bg-white rounded-lg border border-gray-200 p-6'>
          <h3 className='text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2'>
            {t("coffeeType.title")}
          </h3>

          <div className='flex gap-4 mb-6'>
            {/* Combobox phân loại */}
            <div className='flex-1'>
              <Label
                htmlFor='coffeeTypeCategory'
                className='text-sm font-medium text-gray-700'
              >
                {t("coffeeType.create.fields.coffeeTypeCategory")}
                <span className='text-red-500 ml-1'>*</span>
              </Label>
              <select
                id='coffeeTypeCategory'
                name='coffeeTypeCategory'
                required
                value={form.coffeeTypeCategory || ""}
                onChange={(e) => {
                  // const value = e.target.value;
                  // onChange({
                  //   ...form,
                  //   coffeeTypeCategory: value,
                  //   coffeeTypeParentId:
                  //     value === "general" ? "" : form.coffeeTypeParentId,
                  // });
                  handleChange(e);
                }}
                className='mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2'
              >
                <option value='' disabled>
                  {t("coffeeType.create.fields.placeholder.coffeeTypeCategory")}
                </option>
                <option value='general'>
                  {t("coffeeType.create.options.general")}
                </option>
                <option value='specific'>
                  {t("coffeeType.create.options.specific")}
                </option>
              </select>
              {errors["coffeeTypeCategory"] && (
                <p className='text-red-500 text-xs mt-1'>
                  {errors["coffeeTypeCategory"]}
                </p>
              )}
            </div>

            {/* Combobox parentID chỉ hiện khi chọn cụ thể */}
            <div
              className='flex-1'
              style={{
                visibility:
                  form.coffeeTypeCategory === "specific" ? "visible" : "hidden",
                pointerEvents:
                  form.coffeeTypeCategory === "specific" ? "auto" : "none",
              }}
            >
              <Label
                htmlFor='coffeeTypeParentID'
                className='text-sm font-medium text-gray-700'
              >
                {t("coffeeType.create.fields.coffeeTypeParentID")}
                <span className='text-red-500 ml-1'>*</span>
              </Label>
              {loading ? (
                <LoadingSpinner />
              ) : availableCoffeeTypes.length === 0 ? (
                <p className='text-red-500 text-sm italic mt-1'>
                  {t(
                    "procurementPlan.components.procurementPlanForm.fields.coffeeType.noOptions"
                  )}
                </p>
              ) : (
                <>
                  <select
                    id='coffeeTypeParentId'
                    name='coffeeTypeParentId'
                    required={form.coffeeTypeCategory === "specific"}
                    value={form.coffeeTypeParentId || ""}
                    onChange={(e) =>
                      // onChange({ ...form, coffeeTypeParentId: e.target.value })
                      handleChange(e)
                    }
                    className='mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2'
                  >
                    <option value='' disabled>
                      {t(
                        "coffeeType.create.fields.placeholder.coffeeTypeParentID"
                      )}
                    </option>
                    {availableCoffeeTypes.map((coffee) => (
                      <option
                        key={coffee.coffeeTypeId}
                        value={coffee.coffeeTypeId}
                      >
                        {coffee.typeName}
                      </option>
                    ))}
                  </select>
                  {errors["coffeeTypeParentID"] && (
                    <p className='text-red-500 text-xs mt-1'>
                      {errors["coffeeTypeParentID"]}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>

          <div className='space-y-4'>
            <div>
              <Label
                htmlFor='typeName'
                className='text-sm font-medium text-gray-700'
              >
                {t("coffeeType.create.fields.typeName")}
                <span className='text-red-500 ml-1'>*</span>
              </Label>
              <Input
                name='typeName'
                value={form.typeName}
                onChange={handleChange}
                required
                className='mt-1'
                placeholder={t("coffeeType.create.fields.placeholder.typeName")}
              />
              {errors["typeName"] && (
                <p className='text-red-500 text-xs mt-1'>
                  {errors["typeName"]}
                </p>
              )}
            </div>
          </div>

          <div className='space-y-4'>
            <div>
              <Label
                htmlFor='botanicalName'
                className='text-sm font-medium text-gray-700'
              >
                {t("coffeeType.create.fields.botanicalName")}
                <span className='text-red-500 ml-1'>*</span>
              </Label>
              <Input
                name='botanicalName'
                value={form.botanicalName}
                onChange={handleChange}
                required
                className='mt-1'
                placeholder={t(
                  "coffeeType.create.fields.placeholder.botanicalName"
                )}
              />
              {errors["botanicalName"] && (
                <p className='text-red-500 text-xs mt-1'>
                  {errors["botanicalName"]}
                </p>
              )}
            </div>
          </div>

          <div className='space-y-4'>
            <div>
              <Label
                htmlFor='typicalRegion'
                className='text-sm font-medium text-gray-700'
              >
                {t("coffeeType.create.fields.typicalRegion")}
              </Label>
              <Input
                name='typicalRegion'
                value={form.typicalRegion}
                onChange={handleChange}
                className='mt-1'
                placeholder={t(
                  "coffeeType.create.fields.placeholder.typicalRegion"
                )}
              />
              {errors["typicalRegion"] && (
                <p className='text-red-500 text-xs mt-1'>
                  {errors["typicalRegion"]}
                </p>
              )}
            </div>
          </div>

          <div className='space-y-4'>
            <div>
              <Label
                htmlFor='specialtyLevel'
                className='text-sm font-medium text-gray-700'
              >
                {t("coffeeType.create.fields.specialtyLevel")}
              </Label>
              <Input
                name='specialtyLevel'
                value={form.specialtyLevel}
                onChange={handleChange}
                className='mt-1'
                placeholder={t(
                  "coffeeType.create.fields.placeholder.specialtyLevel"
                )}
              />
              {errors["specialtyLevel"] && (
                <p className='text-red-500 text-xs mt-1'>
                  {errors["specialtyLevel"]}
                </p>
              )}
            </div>
          </div>

          <div className='space-y-4'>
            <div>
              <Label
                htmlFor='description'
                className='text-sm font-medium text-gray-700'
              >
                {t("coffeeType.create.fields.description")}
              </Label>
              <Textarea
                name='description'
                value={form.description}
                onChange={handleChange}
                className='mt-1'
                placeholder={t(
                  "coffeeType.create.fields.placeholder.description"
                )}
                rows={4}
              />
              {errors["description"] && (
                <p className='text-red-500 text-xs mt-1'>
                  {errors["description"]}
                </p>
              )}
            </div>
          </div>

          {/* Submit Section */}
          <div className='rounded-lg p-6 mt-6'>
            <div className='flex flex-col sm:flex-row justify-between items-center gap-4'>
              <div></div>
              <LoadingButton
                loading={isSubmitting}
                type='submit'
                variant='default'
                disabled={isSubmitting}
                //className='bg-blue-600 hover:bg-blue-700 px-8 py-3'
              >
                {isSubmitting
                  ? t("coffeeType.create.buttons.submitting")
                  : t("coffeeType.saveCoffee")}
              </LoadingButton>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
