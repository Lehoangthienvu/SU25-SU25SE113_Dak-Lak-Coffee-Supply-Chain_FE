import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { FiTrash2 } from "react-icons/fi";
import { ImCalculator } from "react-icons/im";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { LoadingButton } from "@/components/ui/loadingProgress";
import { CoffeeType } from "@/lib/api/coffeeType";
import { ProcessingMethod } from "@/lib/api/processingMethods";
import { REGIONS } from "@/lib/api/regions";
import { useTranslation } from "react-i18next";

export interface ProcurementPlanDetailFormData {
  planDetailsId?: string; // Optional for new details
  coffeeTypeId: string;
  processMethodId: number;
  targetQuantity: number;
  targetRegion: string;
  minimumRegistrationQuantity: number;
  minPriceRange: number;
  maxPriceRange: number;
  expectedYieldPerHectare: number;
  note: string;
}

export interface ProcurementPlanFormData {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  procurementPlansDetails: ProcurementPlanDetailFormData[];
}

interface Props {
  initialData?: ProcurementPlanFormData;
  availableCoffeeTypes: CoffeeType[];
  availableProcessingMethods: ProcessingMethod[];
  targetRegions: REGIONS[];
  loading: boolean;
  errors: Record<string, string>;
  isSubmitting: boolean;
  onChange: (formData: ProcurementPlanFormData) => void;
  onSubmit: () => void;
  onAddDetail: () => void;
  onRemoveDetail: (index: number) => void;
}

export default function ProcurementPlanForm({
  initialData,
  availableCoffeeTypes,
  availableProcessingMethods,
  targetRegions,
  loading,
  errors,
  isSubmitting,
  onChange,
  onSubmit,
  onAddDetail,
  onRemoveDetail,
}: Props) {
  const { t } = useTranslation();
  const [form, setForm] = useState<ProcurementPlanFormData>(
    initialData || {
      title: "",
      description: "",
      startDate: "",
      endDate: "",
      procurementPlansDetails: [
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
    }
  );

  useEffect(() => {
    if (initialData) {
      setForm(initialData);
    }
  }, [initialData]);

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

  const handleDetailChange = (
    index: number,
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    const numberFields = [
      "processMethodId",
      "targetQuantity",
      "minimumRegistrationQuantity",
      "minPriceRange",
      "maxPriceRange",
      "expectedYieldPerHectare",
    ];

    const newDetails = [...form.procurementPlansDetails];

    if (name === "processMethodId") {
      newDetails[index] = {
        ...newDetails[index],
        [name]: Number(value) === 0 ? 0 : Number(value),
      };
    } else {
      newDetails[index] = {
        ...newDetails[index],
        [name]: numberFields.includes(name) ? Number(value) : value,
      };
    }

    const newForm = { ...form, procurementPlansDetails: newDetails };
    setForm(newForm);
    onChange(newForm);
  };

  const handleAddDetail = () => {
    onAddDetail();
  };

  const handleRemoveDetail = (index: number) => {
    onRemoveDetail(index);
  };

  // Component hiển thị thành tiền ước tính
  const EstimatedCostDisplay = ({
    detail,
  }: {
    detail: ProcurementPlanDetailFormData;
    index: number;
  }) => {
    const minTotal = detail.targetQuantity * detail.minPriceRange;
    const maxTotal = detail.targetQuantity * detail.maxPriceRange;

    return (
      <div className='bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-4'>
        <div className='flex items-center gap-2 mb-3'>
          <ImCalculator className='w-5 h-5 text-blue-600' />
          <h4 className='font-semibold text-blue-800'>
            {t(
              "procurementPlan.components.procurementPlanForm.estimatedCost.title"
            )}
          </h4>
        </div>
        <div className='grid grid-cols-2 gap-4'>
          <div className='text-center'>
            <div className='text-sm text-gray-600 mb-1'>
              {t(
                "procurementPlan.components.procurementPlanForm.estimatedCost.minCost"
              )}
            </div>
            <div className='text-lg font-bold text-green-600'>
              {minTotal.toLocaleString("vi-VN")} VNĐ
            </div>
            <div className='text-xs text-gray-500'>
              {detail.targetQuantity.toLocaleString()} kg ×{" "}
              {detail.minPriceRange.toLocaleString()} VNĐ/kg
            </div>
          </div>
          <div className='text-center'>
            <div className='text-sm text-gray-600 mb-1'>
              {t(
                "procurementPlan.components.procurementPlanForm.estimatedCost.maxCost"
              )}
            </div>
            <div className='text-lg font-bold text-orange-600'>
              {maxTotal.toLocaleString("vi-VN")} VNĐ
            </div>
            <div className='text-xs text-gray-500'>
              {detail.targetQuantity.toLocaleString()} kg ×{" "}
              {detail.maxPriceRange.toLocaleString()} VNĐ/kg
            </div>
          </div>
        </div>
      </div>
    );
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
            {/* <Package className='w-5 h-5 text-blue-600' /> */}
            {t(
              "procurementPlan.components.procurementPlanForm.sections.basicInfo.title"
            )}
          </h3>

          <div className='space-y-4'>
            <div>
              <Label
                htmlFor='title'
                className='text-sm font-medium text-gray-700'
              >
                {t(
                  "procurementPlan.components.procurementPlanForm.fields.title.label"
                )}
                <span className='text-red-500 ml-1'>
                  {t(
                    "procurementPlan.components.procurementPlanForm.fields.title.required"
                  )}
                </span>
              </Label>
              <Input
                name='title'
                value={form.title}
                onChange={handleChange}
                required
                className='mt-1'
                placeholder={t(
                  "procurementPlan.components.procurementPlanForm.fields.title.placeholder"
                )}
              />
              {errors["title"] && (
                <p className='text-red-500 text-xs mt-1'>{errors["title"]}</p>
              )}
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <Label
                  htmlFor='startDate'
                  className='text-sm font-medium text-gray-700'
                >
                  {t(
                    "procurementPlan.components.procurementPlanForm.fields.startDate.label"
                  )}
                  <span className='text-red-500 ml-1'>
                    {t(
                      "procurementPlan.components.procurementPlanForm.fields.startDate.required"
                    )}
                  </span>
                </Label>
                <Input
                  type='date'
                  name='startDate'
                  value={form.startDate}
                  onChange={handleChange}
                  required
                  min={new Date().toISOString().split("T")[0]}
                  className='mt-1'
                />
                {errors["startDate"] && (
                  <p className='text-red-500 text-xs mt-1'>
                    {errors["startDate"]}
                  </p>
                )}
              </div>
              <div>
                <Label
                  htmlFor='endDate'
                  className='text-sm font-medium text-gray-700'
                >
                  {t(
                    "procurementPlan.components.procurementPlanForm.fields.endDate.label"
                  )}
                  <span className='text-red-500 ml-1'>
                    {t(
                      "procurementPlan.components.procurementPlanForm.fields.endDate.required"
                    )}
                  </span>
                </Label>
                <Input
                  type='date'
                  name='endDate'
                  value={form.endDate}
                  onChange={handleChange}
                  required
                  className='mt-1'
                />
                {errors["endDate"] && (
                  <p className='text-red-500 text-xs mt-1'>
                    {errors["endDate"]}
                  </p>
                )}
              </div>
            </div>

            <div>
              <Label
                htmlFor='description'
                className='text-sm font-medium text-gray-700'
              >
                {t(
                  "procurementPlan.components.procurementPlanForm.fields.description.label"
                )}
                <span className='text-red-500 ml-1'>
                  {t(
                    "procurementPlan.components.procurementPlanForm.fields.description.required"
                  )}
                </span>
              </Label>
              <Textarea
                name='description'
                value={form.description}
                onChange={handleChange}
                className='mt-1'
                placeholder={t(
                  "procurementPlan.components.procurementPlanForm.fields.description.placeholder"
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
        </div>

        {/* Procurement Plan Details Section */}
        <div className='bg-white rounded-lg  p-6'>
          <h3 className='text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2'>
            {/* <DollarSign className='w-5 h-5 text-green-600' /> */}
            {t(
              "procurementPlan.components.procurementPlanForm.sections.planDetails.title"
            )}
          </h3>

          {form.procurementPlansDetails.map((detail, index) => (
            <Card
              key={index}
              className='mb-6 border border-gray-200 shadow-sm p-0'
            >
              <CardHeader className='bg-gradient-to-r from-gray-100 to-gray-100 border-b border-gray-200 py-4 m-0 rounded-t-x1'>
                <div className='flex justify-between items-center'>
                  <CardTitle className='text-lg text-gray-800'>
                    {t(
                      "procurementPlan.components.procurementPlanForm.sections.planDetails.detailTitle",
                      { index: index + 1 }
                    )}
                  </CardTitle>
                  {form.procurementPlansDetails.length > 1 && (
                    <Button
                      variant='destructiveGradient'
                      size='sm'
                      onClick={() => handleRemoveDetail(index)}
                      type='button'
                      //className='hover:bg-red-600'
                    >
                      <FiTrash2 className='mr-2' />
                      {t(
                        "procurementPlan.components.procurementPlanForm.buttons.removeDetail"
                      )}
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className='p-6'>
                {/* Estimated Cost Display */}
                {detail.targetQuantity > 0 &&
                  detail.minPriceRange > 0 &&
                  detail.maxPriceRange > 0 && (
                    <EstimatedCostDisplay detail={detail} index={index} />
                  )}

                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  <div>
                    <Label
                      htmlFor={`coffeeTypeId-${index}`}
                      className='text-sm font-medium text-gray-700'
                    >
                      {t(
                        "procurementPlan.components.procurementPlanForm.fields.coffeeType.label"
                      )}
                      <span className='text-red-500 ml-1'>
                        {t(
                          "procurementPlan.components.procurementPlanForm.fields.coffeeType.required"
                        )}
                      </span>
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
                          id={`coffeeTypeId-${index}`}
                          name='coffeeTypeId'
                          value={detail.coffeeTypeId}
                          onChange={(e) => handleDetailChange(index, e)}
                          required
                          className='mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 cursor-pointer focus:border-blue-500 focus:ring-blue-500'
                        >
                          <option value='' className='cursor-pointer'>
                            {t(
                              "procurementPlan.components.procurementPlanForm.fields.coffeeType.placeholder"
                            )}
                          </option>
                          {availableCoffeeTypes.map((type) => (
                            <option
                              key={type.coffeeTypeId}
                              value={type.coffeeTypeId}
                              className='cursor-pointer'
                            >
                              {type.typeName}
                            </option>
                          ))}
                        </select>
                        {errors[`coffeeTypeId-${index}`] && (
                          <p className='text-red-500 text-xs mt-1'>
                            {errors[`coffeeTypeId-${index}`]}
                          </p>
                        )}
                      </>
                    )}
                  </div>

                  <div>
                    <Label
                      htmlFor={`processMethodId-${index}`}
                      className='text-sm font-medium text-gray-700'
                    >
                      {t(
                        "procurementPlan.components.procurementPlanForm.fields.processingMethod.label"
                      )}
                      <span className='text-red-500 ml-1'>
                        {t(
                          "procurementPlan.components.procurementPlanForm.fields.processingMethod.required"
                        )}
                      </span>
                    </Label>
                    {loading ? (
                      <LoadingSpinner />
                    ) : availableProcessingMethods.length === 0 ? (
                      <p className='text-red-500 text-sm italic mt-1'>
                        {t(
                          "procurementPlan.components.procurementPlanForm.fields.processingMethod.noOptions"
                        )}
                      </p>
                    ) : (
                      <>
                        <select
                          id={`processMethodId-${index}`}
                          name='processMethodId'
                          value={detail.processMethodId}
                          onChange={(e) => handleDetailChange(index, e)}
                          required
                          className='mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 cursor-pointer focus:border-blue-500 focus:ring-blue-500'
                        >
                          <option value={0} className='cursor-pointer'>
                            {t(
                              "procurementPlan.components.procurementPlanForm.fields.processingMethod.placeholder"
                            )}
                          </option>
                          {availableProcessingMethods.map((method) => (
                            <option
                              key={method.methodId}
                              value={method.methodId}
                              className='cursor-pointer'
                            >
                              {method.name}
                            </option>
                          ))}
                        </select>
                        {errors[`processMethodId-${index}`] && (
                          <p className='text-red-500 text-xs mt-1'>
                            {errors[`processMethodId-${index}`]}
                          </p>
                        )}
                      </>
                    )}
                  </div>

                  <div>
                    <Label
                      htmlFor={`targetQuantity-${index}`}
                      className='text-sm font-medium text-gray-700'
                    >
                      {t(
                        "procurementPlan.components.procurementPlanForm.fields.targetQuantity.label"
                      )}
                      <span className='text-red-500 ml-1'>
                        {t(
                          "procurementPlan.components.procurementPlanForm.fields.targetQuantity.required"
                        )}
                      </span>
                    </Label>
                    <Input
                      id={`targetQuantity-${index}`}
                      type='number'
                      min='0'
                      name='targetQuantity'
                      value={detail.targetQuantity}
                      onChange={(e) => handleDetailChange(index, e)}
                      required
                      className='mt-1'
                      placeholder={t(
                        "procurementPlan.components.procurementPlanForm.fields.targetQuantity.placeholder"
                      )}
                    />
                    {/* Suggestion badges for target quantity */}
                    <div className='flex flex-wrap gap-2 mt-2'>
                      {[100, 500, 1000, 2000, 5000, 10000, 20000, 50000].map(
                        (suggestion) => (
                          <button
                            key={suggestion}
                            type='button'
                            onClick={() => {
                              const newDetails = [
                                ...form.procurementPlansDetails,
                              ];
                              newDetails[index] = {
                                ...newDetails[index],
                                targetQuantity: suggestion,
                              };
                              const newForm = {
                                ...form,
                                procurementPlansDetails: newDetails,
                              };
                              setForm(newForm);
                              onChange(newForm);
                            }}
                            className='px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors cursor-pointer'
                          >
                            {suggestion.toLocaleString()} kg
                          </button>
                        )
                      )}
                    </div>
                    {errors[`targetQuantity-${index}`] && (
                      <p className='text-red-500 text-xs mt-1'>
                        {errors[`targetQuantity-${index}`]}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label
                      htmlFor={`minimumRegistrationQuantity-${index}`}
                      className='text-sm font-medium text-gray-700'
                    >
                      {t(
                        "procurementPlan.components.procurementPlanForm.fields.minimumRegistrationQuantity.label"
                      )}
                      <span className='text-red-500 ml-1'>
                        {t(
                          "procurementPlan.components.procurementPlanForm.fields.minimumRegistrationQuantity.required"
                        )}
                      </span>
                    </Label>
                    <Input
                      id={`minimumRegistrationQuantity-${index}`}
                      type='number'
                      min='0'
                      name='minimumRegistrationQuantity'
                      value={detail.minimumRegistrationQuantity}
                      onChange={(e) => handleDetailChange(index, e)}
                      className='mt-1'
                      placeholder={t(
                        "procurementPlan.components.procurementPlanForm.fields.minimumRegistrationQuantity.placeholder"
                      )}
                    />
                    {/* Suggestion badges for minimum registration quantity */}
                    <div className='flex flex-wrap gap-2 mt-2'>
                      {[100, 200, 500, 1000, 2000, 5000].map((suggestion) => (
                        <button
                          key={suggestion}
                          type='button'
                          onClick={() => {
                            const newDetails = [
                              ...form.procurementPlansDetails,
                            ];
                            newDetails[index] = {
                              ...newDetails[index],
                              minimumRegistrationQuantity: suggestion,
                            };
                            const newForm = {
                              ...form,
                              procurementPlansDetails: newDetails,
                            };
                            setForm(newForm);
                            onChange(newForm);
                          }}
                          className='px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors cursor-pointer'
                        >
                          {suggestion.toLocaleString()} kg
                        </button>
                      ))}
                    </div>
                    {errors[`minimumRegistrationQuantity-${index}`] && (
                      <p className='text-red-500 text-xs mt-1'>
                        {errors[`minimumRegistrationQuantity-${index}`]}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label
                      htmlFor={`minPriceRange-${index}`}
                      className='text-sm font-medium text-gray-700'
                    >
                      {t(
                        "procurementPlan.components.procurementPlanForm.fields.minPriceRange.label"
                      )}
                      <span className='text-red-500 ml-1'>
                        {t(
                          "procurementPlan.components.procurementPlanForm.fields.minPriceRange.required"
                        )}
                      </span>
                    </Label>
                    <Input
                      id={`minPriceRange-${index}`}
                      type='number'
                      min='0'
                      name='minPriceRange'
                      value={detail.minPriceRange}
                      onChange={(e) => handleDetailChange(index, e)}
                      className='mt-1'
                      placeholder={t(
                        "procurementPlan.components.procurementPlanForm.fields.minPriceRange.placeholder"
                      )}
                    />
                    {/* Suggestion badges for minimum price */}
                    <div className='flex flex-wrap gap-2 mt-2'>
                      {[50000, 100000, 200000, 250000, 300000, 350000].map(
                        (suggestion) => (
                          <button
                            key={suggestion}
                            type='button'
                            onClick={() => {
                              const newDetails = [
                                ...form.procurementPlansDetails,
                              ];
                              newDetails[index] = {
                                ...newDetails[index],
                                minPriceRange: suggestion,
                              };
                              const newForm = {
                                ...form,
                                procurementPlansDetails: newDetails,
                              };
                              setForm(newForm);
                              onChange(newForm);
                            }}
                            className='px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded-full hover:bg-orange-200 transition-colors cursor-pointer'
                          >
                            {suggestion.toLocaleString()} VNĐ
                          </button>
                        )
                      )}
                    </div>
                    {errors[`minPriceRange-${index}`] && (
                      <p className='text-red-500 text-xs mt-1'>
                        {errors[`minPriceRange-${index}`]}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label
                      htmlFor={`maxPriceRange-${index}`}
                      className='text-sm font-medium text-gray-700'
                    >
                      {t(
                        "procurementPlan.components.procurementPlanForm.fields.maxPriceRange.label"
                      )}
                      <span className='text-red-500 ml-1'>
                        {t(
                          "procurementPlan.components.procurementPlanForm.fields.maxPriceRange.required"
                        )}
                      </span>
                    </Label>
                    <Input
                      id={`maxPriceRange-${index}`}
                      type='number'
                      min='0'
                      name='maxPriceRange'
                      value={detail.maxPriceRange}
                      onChange={(e) => handleDetailChange(index, e)}
                      className='mt-1'
                      placeholder={t(
                        "procurementPlan.components.procurementPlanForm.fields.maxPriceRange.placeholder"
                      )}
                    />
                    {/* Suggestion badges for maximum price */}
                    <div className='flex flex-wrap gap-2 mt-2'>
                      {[50000, 100000, 200000, 250000, 300000, 350000].map(
                        (suggestion) => (
                          <button
                            key={suggestion}
                            type='button'
                            onClick={() => {
                              const newDetails = [
                                ...form.procurementPlansDetails,
                              ];
                              newDetails[index] = {
                                ...newDetails[index],
                                maxPriceRange: suggestion,
                              };
                              const newForm = {
                                ...form,
                                procurementPlansDetails: newDetails,
                              };
                              setForm(newForm);
                              onChange(newForm);
                            }}
                            className='px-2 py-1 text-xs bg-red-100 text-red-700 rounded-full hover:bg-red-200 transition-colors cursor-pointer'
                          >
                            {suggestion.toLocaleString()} VNĐ
                          </button>
                        )
                      )}
                    </div>
                    {errors[`maxPriceRange-${index}`] && (
                      <p className='text-red-500 text-xs mt-1'>
                        {errors[`maxPriceRange-${index}`]}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label
                      htmlFor={`targetRegion-${index}`}
                      className='text-sm font-medium text-gray-700'
                    >
                      {t(
                        "procurementPlan.components.procurementPlanForm.fields.targetRegion.label"
                      )}
                    </Label>
                    {loading ? (
                      <LoadingSpinner />
                    ) : targetRegions.length === 0 ? (
                      <p className='text-red-500 text-sm italic mt-1'>
                        {t(
                          "procurementPlan.components.procurementPlanForm.fields.targetRegion.noOptions"
                        )}
                      </p>
                    ) : (
                      <>
                        <select
                          id={`targetRegion-${index}`}
                          name='targetRegion'
                          value={detail.targetRegion}
                          onChange={(e) => handleDetailChange(index, e)}
                          required
                          className='mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 cursor-pointer focus:border-blue-500 focus:ring-blue-500'
                        >
                          <option value={0} className='cursor-pointer'>
                            {t(
                              "procurementPlan.components.procurementPlanForm.fields.targetRegion.placeholder"
                            )}
                          </option>
                          {targetRegions.map((region) => (
                            <option
                              key={region.name}
                              value={region.name}
                              className='cursor-pointer'
                            >
                              {region.name}
                            </option>
                          ))}
                        </select>
                        {errors[`targetRegion-${index}`] && (
                          <p className='text-red-500 text-xs mt-1'>
                            {errors[`targetRegion-${index}`]}
                          </p>
                        )}
                      </>
                    )}
                    {/* <select
                      id={`targetRegion-${index}`}
                      name='targetRegion'
                      value={detail.targetRegion}
                      onChange={(e) => handleDetailChange(index, e)}
                      className='mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 cursor-pointer focus:border-blue-500 focus:ring-blue-500'
                    >
                      <option value='' className='cursor-pointer'>
                        {t(
                          "procurementPlan.components.procurementPlanForm.fields.targetRegion.placeholder"
                        )}
                      </option>
                      {getTargetRegionOptions().map((region) => (
                        <option
                          key={region.value}
                          value={region.value}
                          className='cursor-pointer'
                        >
                          {region.label}
                        </option>
                      ))}
                    </select> */}
                  </div>

                  {/* <div>
                <Label htmlFor={`expectedYieldPerHectare-${index}`}>
                  Sản lượng dự kiến trên 1 ha (kg)
                  <span className='text-red-500'>*</span>
                </Label>
                <Input
                  id={`expectedYieldPerHectare-${index}`}
                  type='number'
                  min='0'
                  name='expectedYieldPerHectare'
                  value={detail.expectedYieldPerHectare}
                  onChange={(e) => handleDetailChange(index, e)}
                />
                {errors[`expectedYieldPerHectare-${index}`] && (
                  <p className='text-red-500 text-xs'>
                    {errors[`expectedYieldPerHectare-${index}`]}
                  </p>
                )}
              </div> */}

                  <div className='col-span-1 md:col-span-2'>
                    <Label
                      htmlFor={`note-${index}`}
                      className='text-sm font-medium text-gray-700'
                    >
                      {t(
                        "procurementPlan.components.procurementPlanForm.fields.note.label"
                      )}
                    </Label>
                    <Textarea
                      id={`note-${index}`}
                      name='note'
                      value={detail.note}
                      onChange={(e) => handleDetailChange(index, e)}
                      className='mt-1'
                      placeholder={t(
                        "procurementPlan.components.procurementPlanForm.fields.note.placeholder"
                      )}
                      rows={3}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          <div className='flex justify-start mb-6'>
            <Button
              onClick={handleAddDetail}
              variant='secondaryGradient'
              size='lg'
              type='button'
              //className='border-blue-300 text-blue-700 hover:bg-blue-50 hover:border-blue-400'
            >
              +{" "}
              {t(
                "procurementPlan.components.procurementPlanForm.buttons.addDetail"
              )}
            </Button>
          </div>

          {/* Submit Section */}
          <div className='bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6'>
            <div className='flex flex-col sm:flex-row justify-between items-center gap-4'>
              <div>
                <h3 className='text-lg font-semibold text-blue-800'>
                  {t(
                    "procurementPlan.components.procurementPlanForm.buttons.submit"
                  )}
                </h3>
                <p className='text-blue-600 text-sm'>
                  {t(
                    "procurementPlan.components.procurementPlanForm.buttons.submit"
                  )}
                </p>
              </div>
              <LoadingButton
                loading={isSubmitting}
                type='submit'
                variant='default'
                disabled={isSubmitting}
                //className='bg-blue-600 hover:bg-blue-700 px-8 py-3'
              >
                {isSubmitting
                  ? t(
                      "procurementPlan.components.procurementPlanForm.buttons.submit"
                    )
                  : t(
                      "procurementPlan.components.procurementPlanForm.buttons.submit"
                    )}
              </LoadingButton>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
