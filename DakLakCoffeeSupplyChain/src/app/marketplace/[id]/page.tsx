"use client";

import React, { useEffect, useState } from "react";
import { useParams, usePathname } from "next/navigation";
import { differenceInCalendarDays, format } from "date-fns";
import { Card } from "@/components/ui/card";
import { Tooltip } from "@/components/ui/tooltip";

import {
  ProcurementPlan,
  getProcurementPlanDetailById,
} from "@/lib/api/procurementPlans";
import {
  createCultivationRegistration,
  CultivationRegistration,
  getCultivationRegistrationsByPlanId,
} from "@/lib/api/cultivationRegistrations";
import { AppToast } from "@/components/ui/AppToast";
import { getErrorMessage } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { FiTrash2, FiMapPin, FiCalendar, FiUser } from "react-icons/fi";
import { Badge } from "@/components/ui/badge";
import { LoadingButton } from "@/components/ui/loadingProgress";

export default function MarketplaceDetailPage() {
  const params = useParams();
  const pathname = usePathname();
  const { id } = params;

  const [plan, setPlan] = useState<ProcurementPlan | null>(null);
  const [registrations, setRegistrations] = useState<CultivationRegistration[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [isFarmer, setIsFarmer] = useState<boolean | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAllDetails, setShowAllDetails] = useState(false);

  // Kiểm tra xem có phải từ sidebar không
  const isFromSidebar = pathname.startsWith("/dashboard/farmer/market-place");

  useEffect(() => {
    if (!id) return;

    fetchPlan(id as string);
    fetchRegistration(id as string);
    checkFarmerAccount();
  }, [id]);

  const fetchPlan = async (planId: string) => {
    setLoading(true);
    const data = await getProcurementPlanDetailById(planId).catch((error) => {
      console.error(error);
      return null;
    });
    setPlan(data);
    setLoading(false);
  };

  const fetchRegistration = async (planId: string) => {
    setLoading(true);
    const data = await getCultivationRegistrationsByPlanId(planId).catch(
      (error) => {
        console.error(error);
        return [];
      }
    );
    setRegistrations(data);
    setLoading(false);
  };

  const checkFarmerAccount = () => {
    const accountRole = localStorage.getItem("user_role");
    if (!accountRole) {
      setIsFarmer(false);
      return;
    }
    try {
      setIsFarmer(accountRole === "farmer");
    } catch (error) {
      setIsFarmer(false);
      console.error(error);
    }
  };

  function isLoggedIn() {
    if (typeof window === "undefined") return false;
    return !!localStorage.getItem("token");
  }

  const [formData, setFormData] = useState({
    planId: id as string,
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
      AppToast.error(errorMessages.join("\n")); // show errors from validateForm directly
      return;
    }

    try {
      await createCultivationRegistration(formData);
      AppToast.success("Đăng ký thành công!");
      fetchRegistration(formData.planId);

      // Reset form after successful submission
      setFormData({
        planId: id as string,
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

  if (loading) {
    return <p className='text-center py-20'>Đang tải dữ liệu...</p>;
  }

  if (!plan) {
    return (
      <p className='text-center py-20 text-red-600'>
        Không tìm thấy kế hoạch này.
      </p>
    );
  }

  const daysRemaining = Math.max(
    differenceInCalendarDays(new Date(plan.endDate), new Date()),
    0
  );

  // Render banner dựa trên đường dẫn
  const renderBanner = () => {
    if (isFromSidebar) {
      // Banner từ sidebar - nhỏ hơn và nằm trên card
      return (
        <div className='max-w-7xl mx-auto px-4 md:px-6'>
          <div className='bg-gradient-to-r from-orange-400 to-orange-600 rounded-xl p-6'>
            <h1 className='text-2xl font-bold text-white'>Chi tiết kế hoạch</h1>
          </div>
        </div>
      );
    } else {
      // Banner từ marketplace chính - giữ nguyên như cũ
      return (
        <>
          <div className='h-40 bg-gradient-to-r from-orange-400 to-orange-600 relative'>
            <h1 className='absolute bottom-4 left-8 text-white text-3xl font-bold drop-shadow-lg'>
              Chi tiết kế hoạch
            </h1>
          </div>
        </>
      );
    }
  };

  // Render nội dung chính
  const renderMainContent = () => {
    const containerClasses = isFromSidebar
      ? "max-w-7xl mx-auto px-4 md:px-6 py-8"
      : "max-w-7xl mx-auto px-4 md:px-6 -mt-20 mb-12";

    const contentClasses = isFromSidebar
      ? "flex gap-10 items-start"
      : "flex gap-10 items-start";

    return (
      <div className={containerClasses}>
        <div className={contentClasses}>
          <div className='flex flex-col gap-10 flex-1 max-w-4xl'>
            {/* Card chi tiết kế hoạch */}
            <Card className='flex-1 p-6 shadow-lg relative gap-8 z-10 rounded-xl'>
              <h2 className='text-3xl font-bold text-orange-700 mb-4'>
                {plan.title}
              </h2>
              <p className='text-gray-700 mb-6'>{plan.description}</p>

              <div className='grid grid-cols-3 gap-6 mb-6 text-gray-700 font-medium'>
                <div>
                  <p className='text-sm text-gray-500 uppercase'>
                    Sản lượng tổng
                  </p>
                  <p className='text-xl'>
                    {plan.totalQuantity.toLocaleString()} kg
                  </p>
                </div>
                <div>
                  <p className='text-sm text-gray-500 uppercase'>
                    Thời gian còn lại
                  </p>
                  <p className='text-xl'>{daysRemaining} ngày</p>
                </div>
                <div>
                  <p className='text-sm text-gray-500 uppercase'>
                    Tỷ lệ sản lượng đã được đăng ký
                  </p>
                  <p className='text-xl'>
                    {plan.progressPercentage.toFixed(2)}%
                  </p>
                </div>
              </div>

              <div>
                <div className='flex items-center justify-between mb-3'>
                  <h3 className='text-xl font-semibold'>Chi tiết kế hoạch</h3>
                  {plan.procurementPlansDetails.length > 4 && (
                    <Button
                      type='button'
                      variant='secondaryGradient'
                      className='h-8 px-3'
                      onClick={() => setShowAllDetails((prev) => !prev)}
                    >
                      {showAllDetails ? 'Thu gọn' : `Xem thêm (${plan.procurementPlansDetails.length - 4})`}
                    </Button>
                  )}
                </div>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  {(showAllDetails
                    ? plan.procurementPlansDetails
                    : plan.procurementPlansDetails.slice(0, 4)
                  ).map((detail) => {
                    const progress = Math.min(
                      Math.max(Number(detail.progressPercentage ?? 0), 0),
                      100
                    );
                    return (
                      <Card key={detail.planDetailsId} className='p-4 shadow-md bg-orange-50 border border-orange-200'>
                        <div className='flex items-start justify-between mb-2'>
                          <div>
                            <p className='text-sm text-gray-500'>Mã chi tiết</p>
                            <p className='font-semibold'>{detail.planDetailCode}</p>
                          </div>
                          <div className='text-right'>
                            <p className='text-sm text-gray-500'>Loại cà phê</p>
                            <p className='font-semibold'>{detail.coffeeType?.typeName}</p>
                          </div>
                        </div>

                        <div className='grid grid-cols-2 gap-3 text-sm'>
                          <div>
                            <p className='text-gray-500'>Phương pháp sơ chế</p>
                            <p className='font-medium'>
                              {detail.processingMethodName ?? "Không có"}
                            </p>
                          </div>
                          <div>
                            <p className='text-gray-500'>Khu vực thu mua</p>
                            <p className='font-medium'>{detail.targetRegion}</p>
                          </div>
                          <div>
                            <p className='text-gray-500'>Sản lượng mục tiêu (kg)</p>
                            <p className='font-medium'>
                              {detail.targetQuantity?.toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className='text-gray-500'>Tối thiểu đăng ký (kg)</p>
                            <p className='font-medium'>
                              {detail.minimumRegistrationQuantity?.toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className='text-gray-500'>Giá mong muốn (VNĐ/kg)</p>
                            <p className='font-medium'>
                              {detail.minPriceRange?.toLocaleString()} - {detail.maxPriceRange?.toLocaleString()}
                            </p>
                          </div>
                          <div>
                            {/* <p className='text-gray-500'>Năng suất dự kiến (kg/ha)</p>
                            <p className='font-medium'>
                              {detail.expectedYieldPerHectare?.toLocaleString?.() ?? detail.expectedYieldPerHectare}
                            </p> */}
                          </div>
                          <div>
                            <p className='text-gray-500'>Đã đăng ký (kg)</p>
                            <p className='font-medium'>
                              {detail.registeredQuantity?.toLocaleString?.() ?? detail.registeredQuantity}
                            </p>
                          </div>
                          <div>
                            <p className='text-gray-500'>Tiến độ</p>
                            <div className='mt-1'>
                              <div className='h-2 w-full bg-orange-100 rounded-full overflow-hidden'>
                                <div
                                  className='h-2 bg-orange-500'
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                              <p className='text-xs text-gray-600 mt-1'>{progress.toFixed(0)}%</p>
                            </div>
                          </div>
                        </div>

                        {detail.note && (
                          <div className='mt-3 text-sm'>
                            <p className='text-gray-500'>Ghi chú</p>
                            <p className='font-medium'>{detail.note}</p>
                          </div>
                        )}
                      </Card>
                    );
                  })}
                </div>
                <p className='mt-4 text-sm text-gray-600'>Mã kế hoạch: {plan.planCode}</p>
              </div>
            </Card>

            {/* Card danh sách đơn đăng ký */}
            <Card className='p-6 rounded-xl shadow-lg'>
              <h3 className='text-2xl font-semibold mb-6 text-orange-700'>
                Danh sách đơn đăng ký
              </h3>
              {registrations.length === 0 && (
                <p className='text-gray-600'>Chưa có đơn đăng ký nào.</p>
              )}

              <div className='space-y-3 max-h-[400px] overflow-y-auto pr-1'>
                {registrations.map((reg) => (
                  <div
                    key={reg.registrationId}
                    className='rounded-lg border border-orange-200 bg-orange-50 p-4 hover:bg-orange-100 transition'
                  >
                    <div className='flex items-start justify-between'>
                      <div className='flex items-center gap-2'>
                        <div className='h-8 w-8 rounded-full bg-orange-200 flex items-center justify-center text-orange-800'>
                          <FiUser />
                        </div>
                        <div>
                          <p className='font-semibold text-orange-800'>{reg.farmerName}</p>
                          <div className='flex items-center gap-2 text-sm text-gray-600'>
                            <FiMapPin className='text-orange-600' />
                            <span>{reg.farmerLocation}</span>
                          </div>
                        </div>
                      </div>
                      <Badge variant='secondary' className='bg-white text-orange-700 border border-orange-200'>
                        {reg.cultivationRegistrationDetails.length} chi tiết
                      </Badge>
                    </div>

                    <div className='mt-3 grid grid-cols-2 gap-3 text-sm'>
                      <div>
                        <p className='text-gray-500'>Diện tích đăng ký</p>
                        <p className='font-medium'>
                          {reg.registeredArea.toLocaleString()} ha
                        </p>
                      </div>
                      <div className='text-right'>
                        <div className='inline-flex items-center gap-2 text-gray-600'>
                          <FiCalendar className='text-orange-600' />
                          <span className='text-sm'>
                            {format(new Date(reg.registeredAt), 'dd/MM/yyyy HH:mm')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Form đăng ký nông hộ */}
            <Card className='p-6 rounded-xl shadow-lg'>
              <h3 className='text-2xl font-semibold mb-6 text-orange-700'>
                Đăng ký tham gia kế hoạch
              </h3>

              <form className='space-y-6' onSubmit={handleSubmit}>
                {!isLoggedIn() && (
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
                  {/* <Button
                    disabled={!isFarmer || !isLoggedIn()}
                    type='submit'
                    className='bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 font-semibold transition'
                  >
                    Gửi đăng ký
                  </Button> */}
                  <LoadingButton
                    loading={isSubmitting}
                    type='submit'
                    variant='default'
                    disabled={isSubmitting || !isLoggedIn() || !isFarmer}
                  >
                    Gửi đăng ký
                  </LoadingButton>
                </div>
              </form>
            </Card>
          </div>

          <aside className='w-90 flex flex-col gap-6 z-10'>
            <Card className='w-full p-6 rounded-xl shadow-lg gap-2'>
              <h3 className='text-xl font-semibold text-orange-700'>
                Thông tin doanh nghiệp
              </h3>
              <p className='font-semibold'>{plan.createdBy.companyName}</p>
              <p className='mb-2 text-gray-600'>
                {plan.createdBy.companyAddress}
              </p>
              <a
                href={plan.createdBy.website}
                target='_blank'
                rel='noreferrer'
                className='text-blue-600 hover:underline mb-1 block'
              >
                Website
              </a>
              <p className='text-gray-700'>
                Email: {plan.createdBy.contactEmail}
              </p>
            </Card>
          </aside>
        </div>
      </div>
    );
  };

  return (
    <div className='min-h-screen bg-[#fff7ed]'>
      {renderBanner()}
      {renderMainContent()}
    </div>
  );
}
