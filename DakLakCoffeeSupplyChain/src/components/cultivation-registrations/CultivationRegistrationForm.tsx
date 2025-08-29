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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [maxRegistrationCount, setMaxRegistrationCount] = useState<number | null>(null);
  
  useEffect(() => {
    

    fetchMaxRegistrationCount();
  }, []);

  const fetchMaxRegistrationCount = async () => {
      try {
        const config = await getSytemConfigurationByName("CULTIVATION_REGISTRATION_CREATION_LIMIT");
        if (config) {
          setMaxRegistrationCount(config.minValue);
        }
      } catch (error) {
        console.error("Error fetching system configuration:", error);
      }
    };

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
      },
    ],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): { isValid: boolean; errorMessages: string[] } => {
    const newErrors: Record<string, string> = {};

    if (!formData.planId) {
      newErrors.planId = "Vui lòng chọn kế hoạch.";
    }
    if (formData.registeredArea <= 0) {
      newErrors.registeredArea = "Vui lòng nhập diện tích đăng ký hợp lệ.";
    }
    formData.cultivationRegistrationDetailsCreateViewDto.forEach(
      (detail, idx) => {
        if (!detail.planDetailId)
          newErrors[`planDetailId_${idx}`] = "Cần chọn chi tiết kế hoạch.";
        if (detail.estimatedYield <= 0)
          newErrors[`estimatedYield_${idx}`] = "Nhập sản lượng đăng ký hợp lệ.";
        if (detail.wantedPrice <= 0)
          newErrors[`wantedPrice_${idx}`] = "Nhập giá mong muốn hợp lệ.";
        if (!detail.expectedHarvestStart)
          newErrors[`expectedHarvestStart_${idx}`] = "Chọn ngày bắt đầu.";
        if (!detail.expectedHarvestEnd)
          newErrors[`expectedHarvestEnd_${idx}`] = "Chọn ngày kết thúc.";
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
      AppToast.success("Đăng ký thành công!");
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
        Đăng ký tham gia kế hoạch
      </h3>

      {/* Thông báo số lần đăng ký tối đa */}
      {maxRegistrationCount !== null && (
        // <div className='mb-4 p-3 bg-red-50 border border-red-200 rounded-lg'>
        //   <p className='text-red-700 text-sm font-medium'>
        //     Nông hộ chỉ có thể đăng ký cùng một kế hoạch <span className='font-bold'>{maxRegistrationCount}</span> lần
        //   </p>
        // </div>
        <p className='text-red-700 text-sm font-medium'>
            Lưu ý: Nông hộ chỉ có thể đăng ký cùng một kế hoạch <span className='font-bold'>{maxRegistrationCount}</span> lần
        </p>
      )}

      <form className='space-y-6' onSubmit={handleSubmit}>
        {!isLoggedIn && (
          <div className='mb-2 text-red-600 text-sm'>
            * Vui lòng <b>đăng nhập</b> để có thể đăng ký kế hoạch này!
          </div>
        )}

        <Label className='text-sm'>
          Diện tích đăng ký (ha) <span className='text-red-500'>*</span>
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
        />

        <div>
          <Label htmlFor='note' className='text-sm'>
            Mô tả
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
                (Number(d.progressPercentage ?? 0) < 100) &&
                !alreadySelected.includes(d.planDetailsId ?? null)
            );

            return (
              <div
                key={idx}
                className='border rounded-md p-4 bg-orange-50 mb-2 flex flex-col gap-3 relative'
              >
                <Label className='text-sm'>
                  Chi tiết kế hoạch{" "}
                  <span className='text-red-500'>*</span>
                </Label>
                <select
                  value={detail.planDetailId}
                  className='w-full border rounded p-2 bg-white'
                  onChange={(e) =>
                    handleDetailChange(
                      idx,
                      "planDetailId",
                      e.target.value
                    )
                  }
                >
                  <option value=''>-- Chọn chi tiết --</option>
                  {options.map((d) => (
                    <option
                      key={d.planDetailsId}
                      value={d.planDetailsId}
                    >
                      {d.coffeeType?.typeName}{" "}
                      {d.processingMethodName && (
                        <>
                          {" "}
                          {" - "} {d.processingMethodName}
                        </>
                      )}
                      {d.targetRegion && <> ({d.targetRegion})</>}
                    </option>
                  ))}
                </select>
                {errors[`planDetailId_${idx}`] && (
                  <p className='text-red-500 text-xs'>
                    {errors[`planDetailId_${idx}`]}
                  </p>
                )}

                <Label className='text-sm'>
                  Sản lượng đăng ký (kg){" "}
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

                <Label className='text-sm'>
                  Giá mong muốn (VNĐ/kg){" "}
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
                {errors[`wantedPrice_${idx}`] && (
                  <p className='text-red-500 text-xs'>
                    {errors[`wantedPrice_${idx}`]}
                  </p>
                )}

                <div className='flex gap-3'>
                  <div className='flex-1'>
                    <Label className='text-sm'>
                      Ngày bắt đầu thu hoạch dự kiến{" "}
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
                      Ngày kết thúc thu hoạch dự kiến{" "}
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

                <Label className='text-sm'>Ghi chú</Label>
                <Textarea
                  className='bg-white'
                  value={detail.note}
                  onChange={(e) =>
                    handleDetailChange(idx, "note", e.target.value)
                  }
                />

                {/* Nút xoá - chỉ hiện nếu có hơn 1 dòng */}
                {formData.cultivationRegistrationDetailsCreateViewDto
                  .length > 1 && (
                  <Button
                    type='button'
                    onClick={() => handleRemoveDetail(idx)}
                    className='text-red-500 py-1 px-2 text-xs absolute right-2 top-2 hover:bg-red-500 hover:text-white trasition bg-red-100'
                  >
                    <FiTrash2 className='mr-1' />
                    Xóa
                  </Button>
                )}
              </div>
            );
          }
        )}

        {/* Nút thêm chi tiết - disable nếu đã chọn toàn bộ chi tiết kế hoạch */}
        <Tooltip
          content={
            (() => {
              const availableCount = plan.procurementPlansDetails.filter(
                (d) => Number(d.progressPercentage ?? 0) < 100
              ).length;
              return formData.cultivationRegistrationDetailsCreateViewDto.length >= availableCount
                ? `Hiện chỉ có ${availableCount} chi tiết còn khả dụng`
                : "Thêm chi tiết kế hoạch";
            })()
          }
          side='bottom'
          align='center'
        >
          <Button
            type='button'
            variant='default'
            disabled={
              (() => {
                const availableCount = plan.procurementPlansDetails.filter(
                  (d) => Number(d.progressPercentage ?? 0) < 100
                ).length;
                return (
                  formData.cultivationRegistrationDetailsCreateViewDto.length >=
                  availableCount
                );
              })()
            }
            onClick={handleAddDetail}
          >
            + Thêm chi tiết kế hoạch
          </Button>
        </Tooltip>

        <div className='flex justify-end'>
          <LoadingButton
            loading={isSubmitting}
            type='submit'
            variant='default'
            disabled={isSubmitting || !isLoggedIn || !isFarmer}
          >
            Gửi đăng ký
          </LoadingButton>
        </div>
      </form>
    </Card>
  );
}
