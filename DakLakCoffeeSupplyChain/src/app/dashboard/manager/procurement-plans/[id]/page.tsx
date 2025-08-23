"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  getProcurementPlanById,
  ProcurementPlan,
} from "@/lib/api/procurementPlans";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FiEdit } from "react-icons/fi";
import { Separator } from "@/components/ui/separator";
import { Package } from "lucide-react";
import StatusBadge from "@/components/crop-seasons/StatusBadge";
import { ProcurementPlanStatusMap } from "@/lib/constants/procurementPlanStatus";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import {
  CultivationRegistration,
  getCultivationRegistrationsByPlanId,
} from "@/lib/api/cultivationRegistrations";
import { ParamValue } from "next/dist/server/request/params";
import RegistrationCard from "@/components/cultivation-registrations/RegistrationCard";

export default function ProcurementPlanDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [plan, setPlan] = useState<ProcurementPlan | null>(null);
  const [registrations, setRegistrations] = useState<CultivationRegistration[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;

    getProcurementPlanById(id as string)
      .then(setPlan)
      .catch((err) => setError(err.message || "Không thể tải dữ liệu kế hoạch"))
      .finally(() => setLoading(false));

    fetchRegistration(id);
  }, [id]);
  //#region APIs call
  const fetchRegistration = async (planId: ParamValue) => {
    if (!planId || typeof planId !== 'string') {
      console.error('Invalid planId:', planId);
      return;
    }

    setLoading(true);
    const data = await getCultivationRegistrationsByPlanId(planId).catch(() => {
      //AppToast.error(getErrorMessage(error));
      return [];
    });
    //console.log("Fetched Procurement Plans:", data);
    setRegistrations(data);
    //console.log("Fetched Registrations:", data);
    setLoading(false);
  };

  //#endregion

  const handleUpdateRegistration = () => {
    if (id) {
      fetchRegistration(id);
    }
  };

  const formatDate = (date?: string) => {
    if (!date) return "Chưa cập nhật";
    const d = new Date(date);
    return isNaN(d.getTime()) ? "Chưa cập nhật" : d.toLocaleDateString("vi-VN");
  };

  if (loading)
    return <div className='text-center py-8'>Đang tải dữ liệu kế hoạch...</div>;
  if (error || !plan)
    return (
      <div className='text-red-500 p-8'>
        {error || "Không tìm thấy kế hoạch"}
      </div>
    );

  return (
    <div className='w-full p-6 lg:px-20 flex justify-center items-start'>
      <div className='w-full max-w-6xl space-y-6'>
        <div className='flex items-center gap-3 text-2xl font-semibold text-gray-800'>
          <Package className='w-7 h-7 text-orange-600' />
          Kế hoạch: {plan.title}
        </div>

        <Separator />

        {/* Card thông tin chính */}
        <Card>
          <CardHeader>
            <div className='flex justify-between items-center'>
              <CardTitle>Thông tin kế hoạch thu mua</CardTitle>
              {plan.status === "Draft" && (
                <div className='flex gap-2'>
                  <Button
                    size='sm'
                    variant='secondaryGradient'
                    //className='bg-blue-100 text-blue-800 hover:bg-blue-200 cursor-pointer'
                    onClick={() =>
                      router.push(
                        `/dashboard/manager/procurement-plans/${plan.planId}/edit`
                      )
                    }
                  >
                    <FiEdit className='mr-1' /> Chỉnh sửa
                  </Button>
                  {/* <Button
                    size='sm'
                    variant='destructiveGradient'
                    //className='bg-red-100 text-red-800 hover:bg-red-200 cursor-pointer'
                    onClick={() => alert("Xoá chưa được hỗ trợ")}
                  >
                    <FiTrash2 className='mr-1' /> Xoá
                  </Button> */}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className='grid grid-cols-2 gap-4 text-sm'>
            <div>
              <strong>Mã kế hoạch:</strong> {plan.planCode}
            </div>
            <div>
              <strong>Tổng sản lượng:</strong>{" "}
              {plan.totalQuantity.toLocaleString()} kg
            </div>
            <div>
              <strong>Tỷ lệ sản lượng đã được đăng ký và có cam kết:</strong> {plan.progressPercentage}%
            </div>
            <div>
              <strong>Trạng thái:</strong>{" "}
              <StatusBadge
                status={plan.status}
                map={ProcurementPlanStatusMap}
              />
            </div>
            <div>
              <strong>Thời gian mở đơn:</strong> {formatDate(plan.startDate)} –{" "}
              {formatDate(plan.endDate)}
            </div>
            {plan.description && (
              <div className='col-span-2'>
                <strong>Mô tả:</strong> {plan.description}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Card chi tiết kế hoạch */}
        <Card>
          <CardHeader className='flex justify-between items-center'>
            <CardTitle>Chi tiết kế hoạch</CardTitle>
            {plan.status === "Draft" && (
              <Button
                size='sm'
                variant='secondaryGradient'
                onClick={() =>
                  router.push(
                    `/dashboard/manager/procurement-plans/${plan.planId}/edit`
                  )
                }
              >
                + Thêm chi tiết kế hoạch
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {Array.isArray(plan.procurementPlansDetails) &&
              plan.procurementPlansDetails.length > 0 ? (
              <Accordion type='multiple' className='w-full'>
                {plan.procurementPlansDetails.map((detail) => (
                  <AccordionItem
                    key={detail.planDetailsId}
                    value={detail.planDetailsId ?? ""}
                  >
                    <AccordionTrigger className='text-left font-medium text-base'>
                      {detail.coffeeType?.typeName}
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className='grid grid-cols-2 gap-4 text-sm text-gray-700 py-2'>
                        <div>
                          <strong>Mã chi tiết:</strong> {detail.planDetailCode}
                        </div>
                        <div>
                          <strong>Loại cà phê:</strong>{" "}
                          {detail.coffeeType?.typeName}
                        </div>
                        <div>
                          <strong>Phân loại:</strong>{" "}
                          {detail.coffeeType?.specialtyLevel}
                        </div>
                        <div>
                          <strong>Vùng đặc trưng:</strong>{" "}
                          {detail.coffeeType?.typicalRegion}
                        </div>
                        {detail.processingMethodName && (
                          <div>
                            <strong>Phương pháp sơ chế:</strong>{" "}
                            {detail.processingMethodName}
                          </div>
                        )}
                        <div>
                          <strong>Sản lượng mục tiêu:</strong>{" "}
                          {detail.targetQuantity?.toLocaleString()} kg
                        </div>
                        <div>
                          <strong>Đăng ký tối thiểu:</strong>{" "}
                          {detail.minimumRegistrationQuantity?.toLocaleString()}{" "}
                          kg
                        </div>
                        <div>
                          <strong>Giá cả thương lượng:</strong>{" "}
                          {detail.minPriceRange?.toLocaleString()} –{" "}
                          {detail.maxPriceRange?.toLocaleString()} VNĐ/kg
                        </div>
                        <div>
                          <strong>Trạng thái:</strong> {detail.status}
                        </div>
                        <div className='col-span-2'>
                          <strong>Mô tả:</strong>{" "}
                          {detail.coffeeType?.description}
                        </div>
                        {detail.note && (
                          <div className='col-span-2'>
                            <strong>Ghi chú:</strong> {detail.note}
                          </div>
                        )}
                        {/* <div className='col-span-2 flex justify-end gap-2 pt-2'>
                          <Button
                            size='sm'
                            variant='outline'
                            className='bg-blue-100 text-blue-800 hover:bg-blue-200 cursor-pointer'
                            onClick={() =>
                              router.push(
                                `/dashboard/manager/procurement-plans/${plan.planId}/details/${detail.planDetailsId}/edit`
                              )
                            }
                          >
                            Chỉnh sửa
                          </Button>
                          <Button
                            size='sm'
                            variant='destructive'
                            className='bg-red-100 text-red-800 hover:bg-red-200 cursor-pointer'
                            onClick={() => {
                              const confirmDelete = window.confirm(
                                "Bạn có chắc muốn xoá chi tiết này không?"
                              );
                              if (confirmDelete)
                                alert(`Đã xoá ${detail.coffeeType?.typeName}`);
                            }}
                          >
                            Xoá
                          </Button>
                        </div> */}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            ) : (
              <p className='text-muted-foreground text-sm'>
                Không có chi tiết kế hoạch nào.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Card danh sách đăng ký của kế hoạch này */}
        <Card className='space-y-4 max-h-[600px] overflow-y-auto'>
          <CardHeader className='flex justify-between items-center'>
            <CardTitle>Danh sách đăng ký</CardTitle>
            <CardTitle>
              Đang có {registrations.length} đơn đăng ký ở kế hoạch này
            </CardTitle>
          </CardHeader>
          {registrations.length === 0 && (
            <p className='text-gray-500 text-center py-4'>
              Chưa có đơn đăng ký nào.
            </p>
          )}

          {registrations.map((reg) => (
            <RegistrationCard
              key={reg.registrationId}
              registrationId={reg.registrationId}
              registrationCode={reg.registrationCode}
              farmerName={reg.farmerName}
              farmerAvatarURL={reg.farmerAvatarURL}
              farmerLocation={reg.farmerLocation}
              registeredArea={reg.registeredArea}
              registeredAt={reg.registeredAt}
              note={reg.note}
              status={reg.status}
              planStatus={plan.status}
              commitmentId={reg.commitmentId}
              commitmentStatus={reg.commitmentStatus}
              cultivationRegistrationDetails={
                reg.cultivationRegistrationDetails
              }
              onUpdate={handleUpdateRegistration}
            />
          ))}
        </Card>
      </div>
    </div>
  );
}
