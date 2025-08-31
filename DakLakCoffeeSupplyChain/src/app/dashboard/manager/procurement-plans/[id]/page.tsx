"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
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
import { getProcurementPlanStatusMap } from "@/lib/constants/procurementPlanStatus";

import {
  CultivationRegistration,
  getCultivationRegistrationsByPlanId,
} from "@/lib/api/cultivationRegistrations";
import { ParamValue } from "next/dist/server/request/params";
import RegistrationCard from "@/components/cultivation-registrations/RegistrationCard";

export default function ProcurementPlanDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const router = useRouter();
  const [plan, setPlan] = useState<ProcurementPlan | null>(null);
  const [registrations, setRegistrations] = useState<CultivationRegistration[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(true);

  const statusMap = getProcurementPlanStatusMap(t);

  useEffect(() => {
    if (!id) return;

    getProcurementPlanById(id as string)
      .then(setPlan)
      .catch((err) => setError(err.message || t('procurementPlan.pages.detail.error')))
      .finally(() => setLoading(false));

    fetchRegistration(id);
  }, [id, t]);
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
    if (!date) return t('procurementPlan.common.notUpdated');
    const d = new Date(date);
    return isNaN(d.getTime()) ? t('procurementPlan.common.notUpdated') : d.toLocaleDateString("vi-VN");
  };

  if (loading)
    return <div className='text-center py-8'>{t('procurementPlan.pages.detail.loading')}</div>;
  if (error || !plan)
    return (
      <div className='text-red-500 p-8'>
        {error || t('procurementPlan.pages.detail.notFound')}
      </div>
    );

  return (
    <div className='w-full p-6 lg:px-20 flex justify-center items-start'>
      <div className='w-full max-w-6xl space-y-6'>
        <div className='flex items-center gap-3 text-2xl font-semibold text-gray-800'>
          <Package className='w-7 h-7 text-orange-600' />
          {t('procurementPlan.pages.detail.title', { planTitle: plan.title })}
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
                  <CardTitle className="text-xl text-orange-800">{t('procurementPlan.pages.detail.basicInfo.title')}</CardTitle>
                  <p className="text-sm text-orange-600 mt-1">{t('procurementPlan.pages.detail.basicInfo.code', { planCode: plan.planCode })}</p>
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
                    <FiEdit className='mr-1' /> {t('procurementPlan.pages.detail.basicInfo.edit')}
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
                <h4 className="font-semibold text-orange-700 text-sm uppercase tracking-wide">{t('procurementPlan.pages.detail.sections.basicInfo.title')}</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('procurementPlan.pages.detail.sections.basicInfo.title_label')}</span>
                    <span className="font-medium text-gray-800">{plan.title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('procurementPlan.pages.detail.sections.basicInfo.status_label')}</span>
                    <StatusBadge
                      status={plan.status}
                      map={statusMap}
                    />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('procurementPlan.pages.detail.sections.basicInfo.registrationPeriod_label')}</span>
                    <span className="font-medium text-gray-800">
                      {formatDate(plan.startDate)} – {formatDate(plan.endDate)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Thông tin sản lượng */}
              <div className="space-y-3">
                <h4 className="font-semibold text-orange-700 text-sm uppercase tracking-wide">{t('procurementPlan.pages.detail.sections.output.title')}</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('procurementPlan.pages.detail.sections.output.totalOutput_label')}</span>
                    <span className="font-medium text-gray-800">
                      {plan.totalQuantity.toLocaleString()} {t('procurementPlan.components.procurementPlanCard.units.kilogram')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('procurementPlan.pages.detail.sections.output.registrationProgress_label')}</span>
                    <span className="font-medium text-gray-800">
                      {plan.progressPercentage}{t('procurementPlan.components.procurementPlanCard.units.percentage')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('procurementPlan.pages.detail.sections.output.planDetailsCount_label')}</span>
                    <span className="font-medium text-gray-800">
                      {plan.procurementPlansDetails?.length || 0} {t('procurementPlan.pages.detail.sections.output.details')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Thông tin doanh nghiệp */}
              <div className="space-y-3">
                <h4 className="font-semibold text-orange-700 text-sm uppercase tracking-wide">{t('procurementPlan.pages.detail.sections.business.title')}</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('procurementPlan.pages.detail.sections.business.name_label')}</span>
                    <span className="font-medium text-gray-800">{plan.createdBy?.companyName || t('procurementPlan.common.noData')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('procurementPlan.pages.detail.sections.business.address_label')}</span>
                    <span className="font-medium text-gray-800 text-right max-w-[150px]">
                      {plan.createdBy?.companyAddress || t('procurementPlan.common.noData')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('procurementPlan.pages.detail.sections.business.email_label')}</span>
                    <span className="font-medium text-gray-800">{plan.createdBy?.contactEmail || t('procurementPlan.common.noData')}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Mô tả */}
            {plan.description && (
              <div className="mt-6 pt-4 border-t border-orange-200">
                <h4 className="font-semibold text-orange-700 text-sm uppercase tracking-wide mb-2">{t('procurementPlan.pages.detail.sections.description.title')}</h4>
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
                 <CardTitle className="text-xl text-blue-800">{t('procurementPlan.pages.detail.planDetails.title')}</CardTitle>
                 <p className="text-sm text-blue-600 mt-1">
                   {t('procurementPlan.pages.detail.planDetails.subtitle', { count: plan.procurementPlansDetails?.length || 0 })}
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
                     {t('procurementPlan.pages.detail.planDetails.collapse')}
                   </>
                 ) : (
                   <>
                     <ChevronDown className="h-4 w-4 mr-1" />
                     {t('procurementPlan.pages.detail.planDetails.expand')}
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
                   {t('procurementPlan.pages.detail.planDetails.addDetail')}
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
                                 {t('procurementPlan.pages.detail.planDetails.detail.coffeeType', { 
                                   coffeeType: detail.coffeeType?.typeName, 
                                   processingMethod: detail.processingMethodName || t('procurementPlan.common.noProcessingMethod') 
                                 })}
                               </p>
                             </div>
                           </div>
                           <div className="text-right text-sm">
                             <div className="text-gray-500">{t('procurementPlan.pages.detail.planDetails.detail.progress')}</div>
                             <div className="font-medium text-blue-600">{detail.progressPercentage || 0}{t('procurementPlan.components.procurementPlanCard.units.percentage')}</div>
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
                                 {t('procurementPlan.pages.detail.planDetails.detail.coffeeType', { 
                                   coffeeType: detail.coffeeType?.typeName, 
                                   processingMethod: detail.processingMethodName || t('procurementPlan.common.noProcessingMethod') 
                                 })}
                               </p>
                             </div>
                           </div>
                           <div className="text-right">
                             <div className="text-sm text-gray-500">{t('procurementPlan.pages.detail.planDetails.detail.targetRegion')}</div>
                             <div className="font-medium text-gray-800">{detail.targetRegion || t('procurementPlan.common.noData')}</div>
                           </div>
                         </div>

                         {/* Thông tin chi tiết */}
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                           {/* Thông tin sản lượng */}
                           <div className="space-y-2">
                             <h5 className="font-medium text-gray-700 text-sm uppercase tracking-wide">{t('procurementPlan.pages.detail.planDetails.detail.sections.output.title')}</h5>
                             <div className="space-y-1 text-sm">
                               <div className="flex justify-between">
                                 <span className="text-gray-600">{t('procurementPlan.pages.detail.planDetails.detail.sections.output.target_label')}</span>
                                 <span className="font-medium">{detail.targetQuantity?.toLocaleString()} {t('procurementPlan.components.procurementPlanCard.units.kilogram')}</span>
                               </div>
                               <div className="flex justify-between">
                                 <span className="text-gray-600">{t('procurementPlan.pages.detail.planDetails.detail.sections.output.minRegistration_label')}</span>
                                 <span className="font-medium">{detail.minimumRegistrationQuantity?.toLocaleString()} {t('procurementPlan.components.procurementPlanCard.units.kilogram')}</span>
                               </div>
                               <div className="flex justify-between">
                                 <span className="text-gray-600">{t('procurementPlan.pages.detail.planDetails.detail.sections.output.registered_label')}</span>
                                 <span className="font-medium">{detail.registeredQuantity?.toLocaleString() || 0} {t('procurementPlan.components.procurementPlanCard.units.kilogram')}</span>
                               </div>
                             </div>
                           </div>

                           {/* Thông tin giá cả */}
                           <div className="space-y-2">
                             <h5 className="font-medium text-gray-700 text-sm uppercase tracking-wide">{t('procurementPlan.pages.detail.planDetails.detail.sections.pricing.title')}</h5>
                             <div className="space-y-1 text-sm">
                               <div className="flex justify-between">
                                 <span className="text-gray-600">{t('procurementPlan.pages.detail.planDetails.detail.sections.pricing.minPrice_label')}</span>
                                 <span className="font-medium">{detail.minPriceRange?.toLocaleString()} VNĐ/{t('procurementPlan.components.procurementPlanCard.units.kilogram')}</span>
                               </div>
                               <div className="flex justify-between">
                                 <span className="text-gray-600">{t('procurementPlan.pages.detail.planDetails.detail.sections.pricing.maxPrice_label')}</span>
                                 <span className="font-medium">{detail.maxPriceRange?.toLocaleString()} VNĐ/{t('procurementPlan.components.procurementPlanCard.units.kilogram')}</span>
                               </div>
                               {/* <div className="flex justify-between">
                                 <span className="text-gray-600">Năng suất dự kiến:</span>
                                 <span className="font-medium">{detail.expectedYieldPerHectare?.toLocaleString() || 'N/A'} kg/ha</span>
                               </div> */}
                             </div>
                           </div>

                           {/* Thông tin tiến độ */}
                           <div className="space-y-2">
                             <h5 className="font-medium text-gray-700 text-sm uppercase tracking-wide">{t('procurementPlan.pages.detail.planDetails.detail.sections.progress.title')}</h5>
                             <div className="space-y-1 text-sm">
                               <div className="flex justify-between">
                                 <span className="text-gray-600">{t('procurementPlan.pages.detail.planDetails.detail.sections.progress.status_label')}</span>
                                 <span className="font-medium">{detail.status || t('procurementPlan.common.noData')}</span>
                               </div>
                               <div className="flex justify-between">
                                 <span className="text-gray-600">{t('procurementPlan.pages.detail.planDetails.detail.sections.progress.progress_label')}</span>
                                 <span className="font-medium">{detail.progressPercentage || 0}{t('procurementPlan.components.procurementPlanCard.units.percentage')}</span>
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
                             <h5 className="font-medium text-gray-700 text-sm uppercase tracking-wide mb-2">{t('procurementPlan.pages.detail.planDetails.detail.note')}</h5>
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
                   {t('procurementPlan.pages.detail.planDetails.noDetails.title')}
                 </p>
                 <p className='text-muted-foreground text-xs mt-1'>
                   {t('procurementPlan.pages.detail.planDetails.noDetails.subtitle')}
                 </p>
               </div>
             )}
           </CardContent>
        </Card>

        {/* Card danh sách đăng ký của kế hoạch này */}
        <Card className='space-y-4 max-h-[600px] overflow-y-auto'>
          <CardHeader className='flex justify-between items-center'>
            <CardTitle>{t('procurementPlan.pages.detail.registrations.title')}</CardTitle>
            <CardTitle>
              {t('procurementPlan.pages.detail.registrations.subtitle', { count: registrations.length })}
            </CardTitle>
          </CardHeader>
          {registrations.length === 0 && (
            <p className='text-gray-500 text-center py-4'>
              {t('procurementPlan.pages.detail.registrations.noRegistrations')}
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
