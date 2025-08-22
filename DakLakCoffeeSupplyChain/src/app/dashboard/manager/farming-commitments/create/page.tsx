"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuthGuard } from "@/lib/auth/useAuthGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { AppToast } from "@/components/ui/AppToast";
import { getErrorMessage } from "@/lib/utils";
import { FiTrash2 } from "react-icons/fi";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { createFarmingCommitment } from "@/lib/api/farmingCommitments";
import {
  CultivationRegistration,
  getCultivationRegistrationById,
} from "@/lib/api/cultivationRegistrations";
import { LoadingButton } from "@/components/ui/loadingProgress";

function CreateFarmingCommitmentContent() {
  useAuthGuard(["manager"]);

  // const formatDate = (d: string) => new Date(d).toISOString().split("T")[0];
  const searchParams = useSearchParams();
  const paramRegistrationId = searchParams.get("registrationId") || "";
  const paramRegistrationDetailId =
    searchParams.get("registrationDetailId") || "";
  const paramWantedPrice = searchParams.get("wantedPrice") || "0";
  const paramEstimatedYield = searchParams.get("estimatedYield") || "0";
  const router = useRouter();

  const [form, setForm] = useState({
    commitmentName: "",
    registrationId: "",
    note: "",
    farmingCommitmentsDetailsCreateDtos: [
      {
        registrationDetailId: "",
        confirmedPrice: 0,
        advancePayment: 0,
        committedQuantity: 0,
        estimatedDeliveryStart: "",
        estimatedDeliveryEnd: "",
        note: "",
        //contractDeliveryItemId: "",
      },
    ],
  });

  const [loading, setLoading] = useState(true);
  const [registration, setRegistration] =
    useState<CultivationRegistration | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (paramRegistrationId) {
      setForm((prev) => ({
        ...prev,
        registrationId: paramRegistrationId,
        farmingCommitmentsDetailsCreateDtos: [
          {
            registrationDetailId: paramRegistrationDetailId,
            confirmedPrice: Number(paramWantedPrice),
            advancePayment: 0,
            committedQuantity: Number(paramEstimatedYield),
            estimatedDeliveryStart: "",
            estimatedDeliveryEnd: "",
            note: "",
            //contractDeliveryItemId: "",
          },
        ],
      }));

      if (paramRegistrationId) fetchRegistration(paramRegistrationId);
    }

    //fetchPlan(paramRegistrationId);
  }, [
    paramRegistrationId,
    paramRegistrationDetailId,
    paramWantedPrice,
    paramEstimatedYield,
  ]);

  //#region API Calls

  const fetchRegistration = async (registrationId: string) => {
    setLoading(true);
    const data = await getCultivationRegistrationById(registrationId).catch(
      (error) => {
        AppToast.error(getErrorMessage(error));
        return null;
      }
    );
    if (data) {
      data.cultivationRegistrationDetails =
        data.cultivationRegistrationDetails.filter(
          (detail) => detail.status === "Approved"
        );
    }
    setRegistration(data);
    console.log("Fetched Registration:", data);
    setLoading(false);
  };
  //#endregion

  const validateForm = (): { isValid: boolean; errorMessages: string[] } => {
    const newErrors: Record<string, string> = {};
    if (!form.commitmentName) {
      newErrors.commitmentName = "Tên cam kết là bắt buộc.";
    }
    if (!form.registrationId) {
      newErrors.registrationId = "ID đăng ký là bắt buộc.";
    }
    if (form.farmingCommitmentsDetailsCreateDtos.length === 0) {
      newErrors.farmingCommitmentsDetailsCreateDtos =
        "Cần ít nhất một chi tiết cam kết.";
    } else {
      form.farmingCommitmentsDetailsCreateDtos.forEach((detail, index) => {
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
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddDetail = () => {
    setForm((prev) => ({
      ...prev,
      farmingCommitmentsDetailsCreateDtos: [
        ...prev.farmingCommitmentsDetailsCreateDtos,
        {
          registrationDetailId: "",
          confirmedPrice: 0,
          advancePayment: 0,
          committedQuantity: 0,
          estimatedDeliveryStart: "",
          estimatedDeliveryEnd: "",
          note: "",
          //contractDeliveryItemId: "",
        },
      ],
    }));
  };

  // Xóa card detail (ngoại trừ card mặc định thứ 0)
  const handleRemoveDetail = (index: number) => {
    setForm((prev) => {
      const details = [...prev.farmingCommitmentsDetailsCreateDtos];
      details.splice(index, 1);
      return { ...prev, farmingCommitmentsDetailsCreateDtos: details };
    });
  };

  const handleDetailChange = (
    index: number,
    key: string,
    value: string | number
  ) => {
    setForm((prev) => {
      const details = [...prev.farmingCommitmentsDetailsCreateDtos];
      details[index] = { ...details[index], [key]: value };
      return { ...prev, farmingCommitmentsDetailsCreateDtos: details };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    //console.log("Submitting form:", form);
    setIsSubmitting(true);

    const { isValid, errorMessages } = validateForm();
    if (!isValid) {
      setIsSubmitting(false);
      AppToast.error(errorMessages.join("\n")); // show errors from validateForm directly
      return;
    }

    try {
      await createFarmingCommitment(form);
      AppToast.success("Tạo cam kết thành công!");
      router.push("/dashboard/manager/farming-commitments");

      setErrors({});
      setForm({
        commitmentName: "",
        registrationId: "",
        note: "",
        farmingCommitmentsDetailsCreateDtos: [
          {
            registrationDetailId: "",
            confirmedPrice: 0,
            advancePayment: 0,
            committedQuantity: 0,
            estimatedDeliveryStart: "",
            estimatedDeliveryEnd: "",
            note: "",
            //contractDeliveryItemId: "",
          },
        ],
      });
    } catch (error) {
      AppToast.error(getErrorMessage(error) || "Tạo cam kết thất bại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  //#endregion

  return (
    <div className='max-w-2xl mx-auto py-10 px-4'>
      <Card>
        <CardHeader>
          <CardTitle>Tạo cam kết mới</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div>
            <Label htmlFor='commitmentName'>
              Tên cam kết
              <span className='text-red-500'>*</span>
            </Label>
            <Input
              name='commitmentName'
              value={form.commitmentName}
              onChange={handleChange}
              required
            />
            {errors[`commitmentName`] && (
              <p className='text-red-500 text-xs'>{errors[`commitmentName`]}</p>
            )}
          </div>

          <div>
            <Label htmlFor='note'>Các điều khoản chung</Label>
            <Textarea
              id={"note"}
              name='note'
              value={form.note}
              onChange={handleChange}
            />
          </div>

          {/* Phần card chứa thông tin detail */}
          {form.farmingCommitmentsDetailsCreateDtos.map((detail, index) => {
            const alreadySelected = form.farmingCommitmentsDetailsCreateDtos
              .map((d, i) => (i === index ? null : d.registrationDetailId))
              .filter(Boolean);

            const options = registration?.cultivationRegistrationDetails.filter(
              (d) =>
                !alreadySelected.includes(
                  d.cultivationRegistrationDetailId ?? null
                )
            );
            return (
              <Card key={index} className='mb-4 border'>
                <CardHeader className='flex justify-between items-center'>
                  <CardTitle>Chi tiết cam kết #{index + 1}</CardTitle>
                  {form.farmingCommitmentsDetailsCreateDtos.length > 1 && (
                    <Button
                      variant='destructive'
                      size='sm'
                      className='bg-red-100 text-red-800 hover:bg-red-200 cursor-pointer'
                      onClick={() => handleRemoveDetail(index)}
                    >
                      <FiTrash2 className='mr-1' />
                      Xóa
                    </Button>
                  )}
                </CardHeader>
                <CardContent className='space-y-3'>
                  <div>
                    <Label htmlFor={`registrationDetailId-${index}`}>
                      Chi tiết đơn đăng ký (Chỉ chọn được những chi tiết đã
                      duyệt)
                      <span className='text-red-500'>*</span>
                    </Label>
                    {loading ? (
                      <LoadingSpinner />
                    ) : registration?.cultivationRegistrationDetails.length ===
                      0 ? (
                      <p className='text-red-500 text-sm italic'>
                        Không có chi tiết đơn đăng ký nào đã duyệt để chọn
                      </p>
                    ) : (
                      <select
                        id={`registrationDetailId-${index}`}
                        name='registrationDetailId'
                        value={detail.registrationDetailId}
                        onChange={(e) =>
                          handleDetailChange(
                            index,
                            "registrationDetailId",
                            e.target.value
                          )
                        }
                        required
                        className='block w-full rounded border border-gray-300 px-3 py-2 cursor-pointer'
                        aria-label={`Chọn chi tiết đơn đăng ký cho chi tiết cam kết ${index + 1}`}
                      >
                        <option value=''>-- Chọn chi tiết --</option>
                        {options?.map((registrationDetail) => (
                          <option
                            key={
                              registrationDetail.cultivationRegistrationDetailId
                            }
                            value={
                              registrationDetail.cultivationRegistrationDetailId
                            }
                            className='cursor-pointer'
                          >
                            {registrationDetail?.coffeeType}{" "}
                            {" - Thu hoạch dự kiến: "}
                            {registrationDetail?.estimatedYield} {"kg/ha"}{" "}
                            {" - Giá mong muốn: "}
                            {registrationDetail?.wantedPrice} {"VNĐ/kg"}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div>
                    <Label htmlFor={`confirmedPrice-${index}`}>
                      Giá cả thống nhất (VNĐ/kg)
                      <span className='text-red-500'>*</span>
                    </Label>
                    <Input
                      id={`confirmedPrice-${index}`}
                      type='number'
                      min={0}
                      name='confirmedPrice'
                      value={detail.confirmedPrice}
                      onChange={(e) =>
                        handleDetailChange(
                          index,
                          "confirmedPrice",
                          Number(e.target.value)
                        )
                      }
                      required
                    />
                    {errors[`confirmedPrice${index}`] && (
                      <p className='text-red-500 text-xs'>
                        {errors[`confirmedPrice${index}`]}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor={`advancePayment-${index}`}>
                      Số tiền tạm ứng cho nông dân (VNĐ/kg) (Có thể bỏ trống)
                    </Label>
                    <Input
                      id={`advancePayment-${index}`}
                      type='number'
                      min={0}
                      name='advancePayment'
                      value={detail.advancePayment}
                      onChange={(e) =>
                        handleDetailChange(
                          index,
                          "advancePayment",
                          Number(e.target.value)
                        )
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor={`committedQuantity-${index}`}>
                      Sản lượng mục tiêu thống nhất (kg)
                      <span className='text-red-500'>*</span>
                    </Label>
                    <Input
                      id={`committedQuantity-${index}`}
                      type='number'
                      min={0}
                      name='committedQuantity'
                      value={detail.committedQuantity}
                      onChange={(e) =>
                        handleDetailChange(
                          index,
                          "committedQuantity",
                          Number(e.target.value)
                        )
                      }
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor={`estimatedDeliveryStart-${index}`}>
                      Ngày giao hàng dự kiến bắt đầu{" "}
                      <span className='text-red-500'>*</span>
                    </Label>
                    <Input
                      id={`estimatedDeliveryStart-${index}`}
                      type='date'
                      name='estimatedDeliveryStart'
                      value={detail.estimatedDeliveryStart}
                      onChange={(e) =>
                        handleDetailChange(
                          index,
                          "estimatedDeliveryStart",
                          e.target.value
                        )
                      }
                      required
                    />
                    {errors[`estimatedDeliveryStart-${index}`] && (
                      <p className='text-red-500 text-xs'>
                        {errors[`estimatedDeliveryStart-${index}`]}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor={`estimatedDeliveryEnd-${index}`}>
                      Ngày giao hàng dự kiến kết thúc{" "}
                      <span className='text-red-500'>*</span>
                    </Label>
                    <Input
                      id={`estimatedDeliveryEnd-${index}`}
                      type='date'
                      name='estimatedDeliveryEnd'
                      value={detail.estimatedDeliveryEnd}
                      onChange={(e) =>
                        handleDetailChange(
                          index,
                          "estimatedDeliveryEnd",
                          e.target.value
                        )
                      }
                      required
                    />
                    {errors[`estimatedDeliveryEnd-${index}`] && (
                      <p className='text-red-500 text-xs'>
                        {errors[`estimatedDeliveryEnd-${index}`]}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor={`note-${index}`}>
                      Các điều khoản cụ thể
                      <span className='text-red-500'>*</span>
                    </Label>
                    <Textarea
                      id={`note-${index}`}
                      name='note'
                      value={detail.note}
                      onChange={(e) =>
                        handleDetailChange(index, "note", e.target.value)
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}

          <div className='flex justify-start mb-6'>
            <Button
              type='button'
              onClick={handleAddDetail}
              className='px-4 py-2 border border-orange-500 text-orange-700 font-bold hover:bg-orange-500 bg-orange-50 hover:text-white transition'
            >
              + Thêm chi tiết cam kết
            </Button>
          </div>

          <div className='flex justify-end'>
            <LoadingButton
              loading={isSubmitting}
              type='submit'
              variant='default'
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              Tạo cam kết
            </LoadingButton>
          </div>
        </CardContent>
      </Card>
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
