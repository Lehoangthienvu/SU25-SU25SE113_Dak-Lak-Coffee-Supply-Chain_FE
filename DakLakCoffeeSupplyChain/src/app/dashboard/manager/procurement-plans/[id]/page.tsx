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
import { FileText, Package, ChevronDown, ChevronUp } from "lucide-react";
import StatusBadge from "@/components/crop-seasons/StatusBadge";
import { ProcurementPlanStatusMap } from "@/lib/constants/procurementPlanStatus";

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
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(true);

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
          <CardHeader className="pb-4">
            <div className='flex justify-between items-center'>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                  <Package className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <CardTitle className="text-xl text-orange-800">Thông tin kế hoạch thu mua</CardTitle>
                  <p className="text-sm text-orange-600 mt-1">Mã: {plan.planCode}</p>
                </div>
              </div>
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
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Thông tin cơ bản */}
              <div className="space-y-3">
                <h4 className="font-semibold text-orange-700 text-sm uppercase tracking-wide">Thông tin cơ bản</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tiêu đề:</span>
                    <span className="font-medium text-gray-800">{plan.title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Trạng thái:</span>
                    <StatusBadge
                      status={plan.status}
                      map={ProcurementPlanStatusMap}
                    />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Thời gian mở đơn:</span>
                    <span className="font-medium text-gray-800">
                      {formatDate(plan.startDate)} – {formatDate(plan.endDate)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Thông tin sản lượng */}
              <div className="space-y-3">
                <h4 className="font-semibold text-orange-700 text-sm uppercase tracking-wide">Sản lượng</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tổng sản lượng:</span>
                    <span className="font-medium text-gray-800">
                      {plan.totalQuantity.toLocaleString()} kg
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tổng tiến độ đăng ký:</span>
                    <span className="font-medium text-gray-800">
                      {plan.progressPercentage}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Số chi tiết kế hoạch:</span>
                    <span className="font-medium text-gray-800">
                      {plan.procurementPlansDetails?.length || 0} chi tiết
                    </span>
                  </div>
                </div>
              </div>

              {/* Thông tin doanh nghiệp */}
              <div className="space-y-3">
                <h4 className="font-semibold text-orange-700 text-sm uppercase tracking-wide">Doanh nghiệp</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tên:</span>
                    <span className="font-medium text-gray-800">{plan.createdBy?.companyName || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Địa chỉ:</span>
                    <span className="font-medium text-gray-800 text-right max-w-[150px]">
                      {plan.createdBy?.companyAddress || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email:</span>
                    <span className="font-medium text-gray-800">{plan.createdBy?.contactEmail || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Mô tả */}
            {plan.description && (
              <div className="mt-6 pt-4 border-t border-orange-200">
                <h4 className="font-semibold text-orange-700 text-sm uppercase tracking-wide mb-2">Mô tả</h4>
                <p className="text-gray-700 leading-relaxed">{plan.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

                 {/* Card chi tiết kế hoạch */}
         <Card>
           <CardHeader className='flex justify-between items-center pb-4'>
             <div className="flex items-center gap-3">
               <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                 <FileText className="h-5 w-5 text-blue-600" />
               </div>
               <div>
                 <CardTitle className="text-xl text-blue-800">Chi tiết kế hoạch</CardTitle>
                 <p className="text-sm text-blue-600 mt-1">
                   {plan.procurementPlansDetails?.length || 0} chi tiết kế hoạch
                 </p>
               </div>
             </div>
             <div className="flex items-center gap-2">
               <Button
                 size='sm'
                 variant='outline'
                 onClick={() => setIsDetailsExpanded(!isDetailsExpanded)}
                 className="text-blue-600 border-blue-200 hover:bg-blue-50"
               >
                 {isDetailsExpanded ? (
                   <>
                     <ChevronUp className="h-4 w-4 mr-1" />
                     Thu gọn
                   </>
                 ) : (
                   <>
                     <ChevronDown className="h-4 w-4 mr-1" />
                     Mở rộng
                   </>
                 )}
               </Button>
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
             </div>
           </CardHeader>
                     <CardContent>
             {Array.isArray(plan.procurementPlansDetails) &&
               plan.procurementPlansDetails.length > 0 ? (
               <>
                 {/* Chế độ thu gọn - chỉ hiển thị danh sách tóm tắt */}
                 {!isDetailsExpanded && (
                   <div className="space-y-3">
                     {plan.procurementPlansDetails.map((detail, index) => (
                       <div
                         key={detail.planDetailsId}
                         className="bg-white rounded-lg border border-blue-200 p-3 shadow-sm hover:shadow-md transition-shadow"
                       >
                         <div className="flex items-center justify-between">
                           <div className="flex items-center gap-3">
                             <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm">
                               {index + 1}
                             </div>
                             <div>
                               <h4 className="font-semibold text-blue-800">
                                 {detail.planDetailCode}
                               </h4>
                               <p className="text-sm text-blue-600">
                                 {detail.coffeeType?.typeName} - {detail.processingMethodName || 'Không có'}
                               </p>
                             </div>
                           </div>
                           <div className="text-right text-sm">
                             <div className="text-gray-500">Tiến độ</div>
                             <div className="font-medium text-blue-600">{detail.progressPercentage || 0}%</div>
                           </div>
                         </div>
                       </div>
                     ))}
                   </div>
                 )}

                 {/* Chế độ mở rộng - hiển thị đầy đủ thông tin */}
                 {isDetailsExpanded && (
                   <div className="space-y-4">
                     {plan.procurementPlansDetails.map((detail, index) => (
                       <div
                         key={detail.planDetailsId}
                         className="bg-white rounded-lg border border-blue-200 p-4 shadow-sm hover:shadow-md transition-shadow"
                       >
                         {/* Header của chi tiết */}
                         <div className="flex items-center justify-between mb-4">
                           <div className="flex items-center gap-3">
                             <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm">
                               {index + 1}
                             </div>
                             <div>
                               <h4 className="font-semibold text-blue-800 text-lg">
                                 {detail.planDetailCode}
                               </h4>
                               <p className="text-sm text-blue-600">
                                 {detail.coffeeType?.typeName} - {detail.processingMethodName || 'Không có'}
                               </p>
                             </div>
                           </div>
                           <div className="text-right">
                             <div className="text-sm text-gray-500">Khu vực thu mua</div>
                             <div className="font-medium text-gray-800">{detail.targetRegion || 'N/A'}</div>
                           </div>
                         </div>

                         {/* Thông tin chi tiết */}
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                           {/* Thông tin sản lượng */}
                           <div className="space-y-2">
                             <h5 className="font-medium text-gray-700 text-sm uppercase tracking-wide">Sản lượng</h5>
                             <div className="space-y-1 text-sm">
                               <div className="flex justify-between">
                                 <span className="text-gray-600">Mục tiêu:</span>
                                 <span className="font-medium">{detail.targetQuantity?.toLocaleString()} kg</span>
                               </div>
                               <div className="flex justify-between">
                                 <span className="text-gray-600">Tối thiểu đăng ký:</span>
                                 <span className="font-medium">{detail.minimumRegistrationQuantity?.toLocaleString()} kg</span>
                               </div>
                               <div className="flex justify-between">
                                 <span className="text-gray-600">Đã đăng ký:</span>
                                 <span className="font-medium">{detail.registeredQuantity?.toLocaleString() || 0} kg</span>
                               </div>
                             </div>
                           </div>

                           {/* Thông tin giá cả */}
                           <div className="space-y-2">
                             <h5 className="font-medium text-gray-700 text-sm uppercase tracking-wide">Giá cả</h5>
                             <div className="space-y-1 text-sm">
                               <div className="flex justify-between">
                                 <span className="text-gray-600">Giá tối thiểu:</span>
                                 <span className="font-medium">{detail.minPriceRange?.toLocaleString()} VNĐ/kg</span>
                               </div>
                               <div className="flex justify-between">
                                 <span className="text-gray-600">Giá tối đa:</span>
                                 <span className="font-medium">{detail.maxPriceRange?.toLocaleString()} VNĐ/kg</span>
                               </div>
                               {/* <div className="flex justify-between">
                                 <span className="text-gray-600">Năng suất dự kiến:</span>
                                 <span className="font-medium">{detail.expectedYieldPerHectare?.toLocaleString() || 'N/A'} kg/ha</span>
                               </div> */}
                             </div>
                           </div>

                           {/* Thông tin tiến độ */}
                           <div className="space-y-2">
                             <h5 className="font-medium text-gray-700 text-sm uppercase tracking-wide">Tiến độ</h5>
                             <div className="space-y-1 text-sm">
                               <div className="flex justify-between">
                                 <span className="text-gray-600">Trạng thái:</span>
                                 <span className="font-medium">{detail.status || 'N/A'}</span>
                               </div>
                               <div className="flex justify-between">
                                 <span className="text-gray-600">Tiến độ:</span>
                                 <span className="font-medium">{detail.progressPercentage || 0}%</span>
                               </div>
                               <div className="w-full bg-gray-200 rounded-full h-2">
                                 <div 
                                   className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                                   style={{ width: `${Math.min(Math.max(detail.progressPercentage || 0, 0), 100)}%` }}
                                 ></div>
                               </div>
                             </div>
                           </div>
                         </div>

                         {/* Ghi chú */}
                         {detail.note && (
                           <div className="mt-4 pt-3 border-t border-blue-200">
                             <h5 className="font-medium text-gray-700 text-sm uppercase tracking-wide mb-2">Ghi chú</h5>
                             <p className="text-gray-700 text-sm">{detail.note}</p>
                           </div>
                         )}
                       </div>
                     ))}
                   </div>
                 )}
               </>
             ) : (
               <div className="text-center py-8">
                 <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-3">
                   <div className="h-8 w-8 text-blue-600">📋</div>
                 </div>
                 <p className='text-muted-foreground text-sm'>
                   Không có chi tiết kế hoạch nào.
                 </p>
                 <p className='text-muted-foreground text-xs mt-1'>
                   Hãy thêm chi tiết kế hoạch để bắt đầu thu mua cà phê.
                 </p>
               </div>
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
