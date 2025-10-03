"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/ui/loadingProgress";
import { Tooltip } from "@/components/ui/tooltip";
import { FiTrash2 } from "react-icons/fi";
import { AppToast } from "@/components/ui/AppToast";
import { getErrorMessage } from "@/lib/utils";
import { createCultivationRegistration } from "@/lib/api/cultivationRegistrations";
import { ProcurementPlan } from "@/lib/api/procurementPlans";
import { getSytemConfigurationByName } from "@/lib/api/systemConfiguration";
import { useTranslation } from "react-i18next";
import { CropViewAllDto, getCrops } from "@/lib/api/crops";
import LoadingSpinner from "../ui/LoadingSpinner";

interface CultivationRegistrationFormProps {
  plan: ProcurementPlan;
  onRegistrationSuccess: () => void;
  isFarmer: boolean | null;
  isLoggedIn: boolean;
}

export default function CultivationRegistrationForm({
  plan,
  onRegistrationSuccess,
  isFarmer,
  isLoggedIn,
}: CultivationRegistrationFormProps) {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [maxRegistrationCount, setMaxRegistrationCount] = useState<
    number | null
  >(null);
  const [existingCrops, setExistingCrops] = useState<CropViewAllDto[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchMaxRegistrationCount();
    fetchCrops();
  }, []);

  //#region API Calls
  const fetchMaxRegistrationCount = async () => {
    try {
      const config = await getSytemConfigurationByName(
        "CULTIVATION_REGISTRATION_CREATION_LIMIT"
      );
      if (config) {
        setMaxRegistrationCount(config.minValue);
      }
    } catch (error) {
      console.error("Error fetching system configuration:", error);
    }
  };

  const fetchCrops = async () => {
    setLoading(true);
    const crops = await getCrops().catch((error) => {
      console.error("Error fetching crops:", error);
      setLoading(false);
      return [];
    });
    setExistingCrops(crops);
    setLoading(false);
  };

  //#endregion

  const [formData, setFormData] = useState({
    planId: plan.planId,
    registeredArea: 0,
    note: "",
    cultivationRegistrationDetailsCreateViewDto: [
      {
        planDetailId: "",
        estimatedYield: 0,
        wantedPrice: 0,
        expectedHarvestStart: "",
        expectedHarvestEnd: "",
        note: "",
        cropId: "",
        registeredArea: 0,
      },
    ],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): { isValid: boolean; errorMessages: string[] } => {
    const newErrors: Record<string, string> = {};

    if (!formData.planId) {
      newErrors.planId = t(
        "cultivationRegistration.components.registrationForm.validation.planId"
      );
    }
    // if (formData.registeredArea <= 0) {
    //   newErrors.registeredArea = t(
    //     "cultivationRegistration.components.registrationForm.validation.registeredArea"
    //   );
    // }
    formData.cultivationRegistrationDetailsCreateViewDto.forEach(
      (detail, idx) => {
        if (!detail.planDetailId)
          newErrors[`planDetailId_${idx}`] = t(
            "cultivationRegistration.components.registrationForm.validation.planDetailId"
          );
        if (!detail.cropId)
          newErrors[`cropId_${idx}`] = t(
            "cultivationRegistration.components.registrationForm.validation.cropId"
          );
        if (!detail.registeredArea)
          newErrors[`registeredArea_${idx}`] = t(
            "cultivationRegistration.components.registrationForm.validation.registeredArea"
          );
        if (detail.estimatedYield <= 0)
          newErrors[`estimatedYield_${idx}`] = t(
            "cultivationRegistration.components.registrationForm.validation.estimatedYield"
          );
        if (detail.wantedPrice <= 0)
          newErrors[`wantedPrice_${idx}`] = t(
            "cultivationRegistration.components.registrationForm.validation.wantedPrice"
          );

        // Validate wanted price is within the plan's price range
        if (detail.planDetailId) {
          const selectedPlanDetail = plan.procurementPlansDetails.find(
            (d) => d.planDetailsId === detail.planDetailId
          );
          if (selectedPlanDetail) {
            if (detail.wantedPrice < (selectedPlanDetail.minPriceRange || 0)) {
              newErrors[`wantedPrice_${idx}`] = t(
                "cultivationRegistration.components.registrationForm.validation.wantedPriceTooLow",
                {
                  minPrice: selectedPlanDetail.minPriceRange,
                }
              );
            } else if (
              detail.wantedPrice > (selectedPlanDetail.maxPriceRange || 0)
            ) {
              newErrors[`wantedPrice_${idx}`] = t(
                "cultivationRegistration.components.registrationForm.validation.wantedPriceTooHigh",
                {
                  maxPrice: selectedPlanDetail.maxPriceRange,
                }
              );
            }
          }
        }

        if (!detail.expectedHarvestStart)
          newErrors[`expectedHarvestStart_${idx}`] = t(
            "cultivationRegistration.components.registrationForm.validation.expectedHarvestStart"
          );
        if (!detail.expectedHarvestEnd)
          newErrors[`expectedHarvestEnd_${idx}`] = t(
            "cultivationRegistration.components.registrationForm.validation.expectedHarvestEnd"
          );
        if (
          new Date(detail.expectedHarvestStart) <
          new Date(new Date().toISOString().split("T")[0])
        ) {
          newErrors[`expectedHarvestStart_${idx}`] = t(
            "cultivationRegistration.components.registrationForm.validation.harvestStartInThePast"
          );
        }
        if (detail.expectedHarvestStart > detail.expectedHarvestEnd) {
          newErrors[`expectedHarvestEnd_${idx}`] = t(
            "cultivationRegistration.components.registrationForm.validation.harvestEndAfterStart"
          );
        }
      }
    );

    setErrors(newErrors);
    const errorMessages = Object.values(newErrors);
    return {
      isValid: errorMessages.length === 0,
      errorMessages,
    };
  };

  const handleAddDetail = () => {
    setFormData((prev) => ({
      ...prev,
      cultivationRegistrationDetailsCreateViewDto: [
        ...prev.cultivationRegistrationDetailsCreateViewDto,
        {
          planDetailId: "",
          estimatedYield: 0,
          wantedPrice: 0,
          expectedHarvestStart: "",
          expectedHarvestEnd: "",
          note: "",
          cropId: "",
          registeredArea: 0,
        },
      ],
    }));
  };

  const handleRemoveDetail = (index: number) => {
    setFormData((prev) => {
      const details = [...prev.cultivationRegistrationDetailsCreateViewDto];
      details.splice(index, 1);
      return { ...prev, cultivationRegistrationDetailsCreateViewDto: details };
    });
  };

  const handleDetailChange = (
    index: number,
    key: string,
    value: string | number
  ) => {
    setFormData((prev) => {
      const details = [...prev.cultivationRegistrationDetailsCreateViewDto];
      details[index] = { ...details[index], [key]: value };
      return { ...prev, cultivationRegistrationDetailsCreateViewDto: details };
    });

    // Clear validation errors when plan detail changes
    if (key === "planDetailId") {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[`wantedPrice_${index}`];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const { isValid, errorMessages } = validateForm();
    if (!isValid) {
      setIsSubmitting(false);
      AppToast.error(errorMessages.join("\n"));
      return;
    }

    try {
      await createCultivationRegistration(formData);
      AppToast.success(
        t(
          "cultivationRegistration.components.registrationForm.messages.success"
        )
      );
      onRegistrationSuccess();

      // Reset form after successful submission
      setFormData({
        planId: plan.planId,
        registeredArea: 0,
        note: "",
        cultivationRegistrationDetailsCreateViewDto: [
          {
            planDetailId: "",
            estimatedYield: 0,
            wantedPrice: 0,
            expectedHarvestStart: "",
            expectedHarvestEnd: "",
            note: "",
            cropId: "",
            registeredArea: 0,
          },
        ],
      });
      setErrors({});
    } catch (error) {
      AppToast.error(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className='p-6 rounded-xl shadow-lg'>
      <h3 className='text-2xl font-semibold mb-6 text-orange-700'>
        {t("cultivationRegistration.components.registrationForm.title")}
      </h3>

      {/* Thông báo số lần đăng ký tối đa */}
      {maxRegistrationCount !== null && (
        <p className='text-red-700 text-sm font-medium'>
          {t(
            "cultivationRegistration.components.registrationForm.messages.maxRegistrationsReached",
            { count: maxRegistrationCount }
          )}
        </p>
      )}

      <form className='space-y-6' onSubmit={handleSubmit}>
        {!isLoggedIn && (
          <div className='mb-2 text-red-600 text-sm'>
            *{" "}
            {t(
              "cultivationRegistration.components.registrationForm.messages.loginRequired"
            )}
          </div>
        )}

        {/* <Label className='text-sm'>
          {t(
            "cultivationRegistration.components.registrationForm.labels.registeredArea"
          )}{" "}
          <span className='text-red-500'>*</span>
        </Label>
        <Input
          type='number'
          min={0}
          value={formData.registeredArea}
          onChange={(e) =>
            setFormData({
              ...formData,
              registeredArea: Number(e.target.value),
            })
          }
        /> */}

        <div>
          <Label htmlFor='note' className='text-sm'>
            {t(
              "cultivationRegistration.components.registrationForm.labels.note"
            )}
          </Label>
          <Textarea
            id='note'
            name='note'
            value={formData.note}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                note: e.target.value,
              }))
            }
          />
        </div>

        {/* Chi tiết đăng ký */}
        {formData.cultivationRegistrationDetailsCreateViewDto.map(
          (detail, idx) => {
            // Để loại chi tiết kế hoạch đã chọn ở dòng trước khỏi options dòng này
            const alreadySelected =
              formData.cultivationRegistrationDetailsCreateViewDto
                .map((d, i) => (i === idx ? null : d.planDetailId))
                .filter(Boolean);

            const options = plan.procurementPlansDetails.filter(
              (d) =>
                Number(d.progressPercentage ?? 0) < 100 &&
                !alreadySelected.includes(d.planDetailsId ?? null)
            );

            return (
              <div
                key={idx}
                className='border rounded-md p-4 bg-orange-50 mb-2 flex flex-col gap-3 relative'
              >
                {/* Chi tiết kế hoạch */}
                <>
                  <Label className='text-sm'>
                    {t(
                      "cultivationRegistration.components.registrationForm.labels.planDetail"
                    )}{" "}
                    <span className='text-red-500'>*</span>
                  </Label>
                  <select
                    value={detail.planDetailId}
                    className='w-full border rounded p-2 bg-white'
                    onChange={(e) =>
                      handleDetailChange(idx, "planDetailId", e.target.value)
                    }
                  >
                    <option value=''>
                      --{" "}
                      {t(
                        "cultivationRegistration.components.registrationForm.placeholders.planDetail"
                      )}{" "}
                      --
                    </option>
                    {options.map((d) => (
                      <option key={d.planDetailsId} value={d.planDetailsId}>
                        {d.coffeeType?.typeName}{" "}
                        {d.processingMethodName && (
                          <>
                            {" "}
                            {" - "} {d.processingMethodName}
                          </>
                        )}
                      </option>
                    ))}
                  </select>
                  {errors[`planDetailId_${idx}`] && (
                    <p className='text-red-500 text-xs'>
                      {errors[`planDetailId_${idx}`]}
                    </p>
                  )}
                </>
                {/* Vùng trồng */}
                <>
                  <Label className='text-sm'>
                    {t(
                      "cultivationRegistration.components.registrationForm.labels.crop"
                    )}{" "}
                    <span className='text-red-500'>*</span>
                  </Label>
                  {loading ? (
                    <LoadingSpinner />
                  ) : existingCrops.length === 0 ? (
                    <p className='text-gray-500 text-sm'>
                      {t(
                        "cultivationRegistration.components.registrationForm.messages.noCropsAvailable"
                      )}
                    </p>
                  ) : (
                    <>
                      <select
                        value={detail.cropId}
                        className='w-full border rounded p-2 bg-white'
                        onChange={(e) =>
                          handleDetailChange(idx, "cropId", e.target.value)
                        }
                      >
                        <option value=''>
                          --{" "}
                          {t(
                            "cultivationRegistration.components.registrationForm.placeholders.crop"
                          )}{" "}
                          --
                        </option>
                        {existingCrops.map((d) => (
                          <option key={d.cropId} value={d.cropId}>
                            {d.farmName}{" "}
                            {d.cropArea && (
                              <>
                                {" "}
                                {" - "} {d.cropArea}ha
                              </>
                            )}
                          </option>
                        ))}
                      </select>
                      {errors[`cropId_${idx}`] && (
                        <p className='text-red-500 text-xs'>
                          {errors[`cropId_${idx}`]}
                        </p>
                      )}
                    </>
                  )}
                </>

                {/* Dện tích đăng ký */}
                <>
                  <Label className='text-sm'>
                    {t(
                      "cultivationRegistration.components.registrationForm.labels.registeredArea"
                    )}{" "}
                    <span className='text-red-500'>*</span>
                  </Label>
                  <Input
                    className='bg-white'
                    type='number'
                    min={0}
                    value={detail.registeredArea}
                    onChange={(e) =>
                      handleDetailChange(
                        idx,
                        "registeredArea",
                        Number(e.target.value)
                      )
                    }
                  />
                  {errors[`registeredArea_${idx}`] && (
                    <p className='text-red-500 text-xs'>
                      {errors[`registeredArea_${idx}`]}
                    </p>
                  )}
                </>

                {/* Sản lượng đăng ký */}
                <>
                  <Label className='text-sm'>
                    {t(
                      "cultivationRegistration.components.registrationForm.labels.estimatedYield"
                    )}{" "}
                    <span className='text-red-500'>*</span>
                  </Label>
                  <Input
                    className='bg-white'
                    type='number'
                    min={0}
                    value={detail.estimatedYield}
                    onChange={(e) =>
                      handleDetailChange(
                        idx,
                        "estimatedYield",
                        Number(e.target.value)
                      )
                    }
                  />
                  {errors[`estimatedYield_${idx}`] && (
                    <p className='text-red-500 text-xs'>
                      {errors[`estimatedYield_${idx}`]}
                    </p>
                  )}
                </>

                {/* Giá cả mong muốn */}
                <>
                  <Label className='text-sm'>
                    {t(
                      "cultivationRegistration.components.registrationForm.labels.wantedPrice"
                    )}{" "}
                    <span className='text-red-500'>*</span>
                  </Label>
                  <Input
                    className='bg-white'
                    type='number'
                    min={0}
                    value={detail.wantedPrice}
                    onChange={(e) =>
                      handleDetailChange(
                        idx,
                        "wantedPrice",
                        Number(e.target.value)
                      )
                    }
                  />
                  {/* Show price range for selected plan detail */}
                  {detail.planDetailId &&
                    (() => {
                      const selectedPlanDetail =
                        plan.procurementPlansDetails.find(
                          (d) => d.planDetailsId === detail.planDetailId
                        );
                      return selectedPlanDetail ? (
                        <div className='text-xs text-gray-600 mt-1 space-y-1'>
                          <p>
                            {t(
                              "cultivationRegistration.components.registrationForm.messages.priceRange",
                              {
                                minPrice:
                                  selectedPlanDetail.minPriceRange?.toLocaleString(
                                    "vi-VN"
                                  ),
                                maxPrice:
                                  selectedPlanDetail.maxPriceRange?.toLocaleString(
                                    "vi-VN"
                                  ),
                              }
                            )}
                          </p>
                          <p className='text-blue-600'>
                            {t(
                              "cultivationRegistration.components.registrationForm.messages.priceRangeHint"
                            )}
                          </p>
                        </div>
                      ) : null;
                    })()}
                  {errors[`wantedPrice_${idx}`] && (
                    <p className='text-red-500 text-xs'>
                      {errors[`wantedPrice_${idx}`]}
                    </p>
                  )}
                </>

                <div className='flex gap-3'>
                  <div className='flex-1'>
                    <Label className='text-sm'>
                      {t(
                        "cultivationRegistration.components.registrationForm.labels.expectedHarvestStart"
                      )}{" "}
                      <span className='text-red-500'>*</span>
                    </Label>
                    <Input
                      className='bg-white'
                      type='date'
                      value={detail.expectedHarvestStart}
                      onChange={(e) =>
                        handleDetailChange(
                          idx,
                          "expectedHarvestStart",
                          e.target.value
                        )
                      }
                    />
                    {errors[`expectedHarvestStart_${idx}`] && (
                      <p className='text-red-500 text-xs'>
                        {errors[`expectedHarvestStart_${idx}`]}
                      </p>
                    )}
                  </div>
                  <div className='flex-1'>
                    <Label className='text-sm'>
                      {t(
                        "cultivationRegistration.components.registrationForm.labels.expectedHarvestEnd"
                      )}{" "}
                      <span className='text-red-500'>*</span>
                    </Label>
                    <Input
                      className='bg-white'
                      type='date'
                      value={detail.expectedHarvestEnd}
                      onChange={(e) =>
                        handleDetailChange(
                          idx,
                          "expectedHarvestEnd",
                          e.target.value
                        )
                      }
                    />
                    {errors[`expectedHarvestEnd_${idx}`] && (
                      <p className='text-red-500 text-xs'>
                        {errors[`expectedHarvestEnd_${idx}`]}
                      </p>
                    )}
                  </div>
                </div>

                <Label className='text-sm'>
                  {t(
                    "cultivationRegistration.components.registrationForm.labels.detailNote"
                  )}
                </Label>
                <Textarea
                  className='bg-white'
                  value={detail.note}
                  onChange={(e) =>
                    handleDetailChange(idx, "note", e.target.value)
                  }
                />

                {/* Nút xoá - chỉ hiện nếu có hơn 1 dòng */}
                {formData.cultivationRegistrationDetailsCreateViewDto.length >
                  1 && (
                  <Button
                    type='button'
                    onClick={() => handleRemoveDetail(idx)}
                    className='text-red-500 py-1 px-2 text-xs absolute right-2 top-2 hover:bg-red-500 hover:text-white trasition bg-red-100'
                  >
                    <FiTrash2 className='mr-1' />
                    {t(
                      "cultivationRegistration.components.registrationForm.buttons.removeDetail"
                    )}
                  </Button>
                )}
              </div>
            );
          }
        )}

        {/* Nút thêm chi tiết - disable nếu đã chọn toàn bộ chi tiết kế hoạch */}
        <Tooltip
          content={(() => {
            const availableCount = plan.procurementPlansDetails.filter(
              (d) => Number(d.progressPercentage ?? 0) < 100
            ).length;
            return formData.cultivationRegistrationDetailsCreateViewDto
              .length >= availableCount
              ? t(
                  "cultivationRegistration.components.registrationForm.messages.maxRegistrationsReached",
                  { count: availableCount }
                )
              : t(
                  "cultivationRegistration.components.registrationForm.buttons.addDetail"
                );
          })()}
          side='bottom'
          align='center'
        >
          <Button
            type='button'
            variant='default'
            disabled={(() => {
              const availableCount = plan.procurementPlansDetails.filter(
                (d) => Number(d.progressPercentage ?? 0) < 100
              ).length;
              return (
                formData.cultivationRegistrationDetailsCreateViewDto.length >=
                availableCount
              );
            })()}
            onClick={handleAddDetail}
          >
            +{" "}
            {t(
              "cultivationRegistration.components.registrationForm.buttons.addDetail"
            )}
          </Button>
        </Tooltip>

        <div className='flex justify-end'>
          <LoadingButton
            loading={isSubmitting}
            type='submit'
            variant='default'
            disabled={isSubmitting || !isLoggedIn || !isFarmer}
          >
            {t(
              "cultivationRegistration.components.registrationForm.buttons.submit"
            )}
          </LoadingButton>
        </div>
      </form>
    </Card>
  );
}
