"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FiCheck, FiExternalLink, FiX } from "react-icons/fi";
import { Separator } from "@/components/ui/separator";
import { Package, FileText, User, TrendingUp, ChevronDown, ChevronUp } from "lucide-react";

import { AppToast } from "@/components/ui/AppToast";
import { formatQuantity, getErrorMessage } from "@/lib/utils";
import {
  FarmingCommitment,
  getCommitmentById,
  updateFarmingCommitmentStatusByFarmer,
} from "@/lib/api/farmingCommitments";
import { getFarmingCommitmentStatusMap } from "@/lib/constants/FarmingCommitmentStatus";
import { getProcurementPlanStatusMap } from "@/lib/constants/procurementPlanStatus";
import { getCultivationRegistrationStatusMap } from "@/lib/constants/cultivationRegistrationStatus";
import StatusBadge from "@/components/crop-seasons/StatusBadge";
import { ProcurementPlan, getProcurementPlanDetailById } from "@/lib/api/procurementPlans";
import { CultivationRegistration, getCultivationRegistrationsByPlanId } from "@/lib/api/cultivationRegistrations";
import { RejectionDialog } from "@/components/ui/rejectionDialog";
import { ConfirmDialog } from "@/components/ui/confirmDialog";
import Link from "next/link";

export default function FarmingCommitmentDetailPageForFarmer() {
  const { t } = useTranslation();
  const { id } = useParams();
  const [commitment, setCommitment] = useState<FarmingCommitment | null>(null);
  const [plan, setPlan] = useState<ProcurementPlan | null>(null);
  const [registration, setRegistration] = useState<CultivationRegistration | null>(null);
  const [loading, setLoading] = useState(true);
  const [openRejectionDialog, setOpenRejectionDialog] = useState(false);
  const openRejectDialog = () => setOpenRejectionDialog(true);
  const [error, setError] = useState("");
  const isPending =
    commitment?.status === "Pending" || commitment?.status === null;
  const [dialogType, setDialogType] = useState<string | null>(null);
  const [loadingConfirm, setLoadingConfirm] = useState(false);
  const closeDialog = () => setDialogType(null);
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(true);

  useEffect(() => {
    if (id) {
      fetchCommitment(id as string);
    }
  }, [id]);

  //#region API calls

  const fetchCommitment = async (commitmentId: string) => {
    setLoading(true);
    try {
      const data = await getCommitmentById(commitmentId);
      setCommitment(data);
      
      // Fetch thông tin kế hoạch thu mua
      if (data?.planId) {
        const planData = await getProcurementPlanDetailById(data.planId);
        setPlan(planData);
        
        // Fetch thông tin đơn đăng ký
        if (data.registrationId) {
          const registrations = await getCultivationRegistrationsByPlanId(data.planId);
          const currentRegistration = registrations.find(r => r.registrationId === data.registrationId);
          setRegistration(currentRegistration || null);
        }
      }
    } catch (error) {
      AppToast.error(getErrorMessage(error));
      setError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const updateFarmingCommitmentStatus = async (
    status: number,
    rejectionReason: string | undefined
  ) => {
    if (!commitment) return;

    const updatedCommitment = await updateFarmingCommitmentStatusByFarmer(
      { status: status, rejectReason: rejectionReason || "" },
      commitment.commitmentId
    ).catch((error) => {
      AppToast.error(getErrorMessage(error));
      return null;
    });

    if (updatedCommitment) {
      setCommitment(updatedCommitment);
      if (status === 5) {
      AppToast.success(t('farmingCommitment.pages.farmer.detail.actions.rejectToast'));
      } else {
      AppToast.success(t('farmingCommitment.pages.farmer.detail.actions.acceptToast'));
      }
    }
  };

  //#endregion

  //#region Handle functions

  const handleAccept = async () => {
    if (!commitment) return;
    setLoadingConfirm(true);
    await updateFarmingCommitmentStatus(1, undefined);
    closeDialog();
    setLoadingConfirm(false);
  };

  const handleReject = async (rejectReason: string) => {
    await updateFarmingCommitmentStatus(5, rejectReason);
  };
  //#endregion

  const formatDate = (date?: string) => {
    if (!date) return t('farmingCommitment.pages.farmer.detail.common.notUpdated');
    const d = new Date(date);
    return isNaN(d.getTime()) ? t('farmingCommitment.pages.farmer.detail.common.notUpdated') : d.toLocaleDateString("vi-VN");
  };

  if (loading)
    return <div className='text-center py-8'>{t('farmingCommitment.pages.farmer.detail.loadingText')}</div>;
  if (error || !commitment)
    return (
      <div className='text-red-500 p-8'>
        {error || t('farmingCommitment.pages.farmer.detail.notFoundText')}
      </div>
    );

  return (
    <div className='w-full p-6 lg:px-20 flex justify-center items-start'>
      <div className='w-full max-w-6xl space-y-6'>
        <div className='flex items-center gap-3 text-2xl font-semibold text-gray-800'>
          <Package className='w-7 h-7 text-orange-600' />
          {t('farmingCommitment.pages.farmer.detail.title', { commitmentName: commitment.commitmentName })}
        </div>

        <Separator />

        {/* Card thông tin chính */}
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardHeader className="pb-4">
            <div className='flex justify-between items-center'>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                  <Package className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-xl text-green-800">{t('farmingCommitment.pages.farmer.detail.basicInfo.title')}</CardTitle>
                  <p className="text-sm text-green-600 mt-1">{t('farmingCommitment.pages.farmer.detail.basicInfo.code', { code: commitment.commitmentCode })}</p>
                </div>
              </div>
              {isPending && (
                <div className='flex gap-2'>
                  <Button
                    size='sm'
                    variant='outline'
                    className='bg-green-200 hover:bg-emerald-400 hover:text-white text-green-800 transition'
                    onClick={() => setDialogType("accept")}
                  >
                    <FiCheck className='mr-1' /> {t('farmingCommitment.pages.farmer.detail.actions.accept')}
                  </Button>
                  <Button
                    size='sm'
                    variant='destructive'
                    className='bg-red-100 text-red-800 hover:bg-red-200 cursor-pointer'
                    onClick={openRejectDialog}
                  >
                    <FiX className='mr-1' /> {t('farmingCommitment.pages.farmer.detail.actions.reject')}
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Thông tin cơ bản */}
              <div className="space-y-3">
                <h4 className="font-semibold text-green-700 text-sm uppercase tracking-wide">{t('farmingCommitment.pages.farmer.detail.sections.basicInfo.title')}</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('farmingCommitment.pages.farmer.detail.sections.basicInfo.status_label')}:</span>
                    <StatusBadge
                      status={commitment.status}
                      map={getFarmingCommitmentStatusMap(t)}
                    />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('farmingCommitment.pages.farmer.detail.sections.basicInfo.progress_label')}:</span>
                    <span className="font-medium text-gray-800">{commitment.progressPercentage || 0}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('farmingCommitment.pages.farmer.detail.sections.basicInfo.createdDate_label')}:</span>
                    <span className="font-medium text-gray-800">{formatDate(commitment.commitmentDate)}</span>
                  </div>
                  {commitment.approvedAt && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('farmingCommitment.pages.farmer.detail.sections.basicInfo.approvedDate_label')}:</span>
                      <span className="font-medium text-gray-800">{formatDate(commitment.approvedAt)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Thông tin tài chính */}
              <div className="space-y-3">
                <h4 className="font-semibold text-green-700 text-sm uppercase tracking-wide">{t('farmingCommitment.pages.farmer.detail.sections.finance.title')}</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('farmingCommitment.pages.farmer.detail.sections.finance.totalCost_label')}:</span>
                    <span className="font-medium text-gray-800">{commitment.totalPrice.toLocaleString()} VNĐ</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('farmingCommitment.pages.farmer.detail.sections.finance.advancePayment_label')}:</span>
                    <span className="font-medium text-gray-800">{commitment.totalAdvancePayment.toLocaleString()} VNĐ</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('farmingCommitment.pages.farmer.detail.sections.finance.remaining_label')}:</span>
                    <span className="font-medium text-gray-800">{(commitment.totalPrice - commitment.totalAdvancePayment).toLocaleString()} VNĐ</span>
                  </div>
                </div>
              </div>

              {/* Thông tin đối tác */}
              <div className="space-y-3">
                <h4 className="font-semibold text-green-700 text-sm uppercase tracking-wide">{t('farmingCommitment.pages.farmer.detail.sections.partners.title')}</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('farmingCommitment.pages.farmer.detail.sections.partners.farmer_label')}:</span>
                    <span className="font-medium text-gray-800">{commitment.farmerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('farmingCommitment.pages.farmer.detail.sections.partners.business_label')}:</span>
                    <span className="font-medium text-gray-800">{commitment.companyName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('farmingCommitment.pages.farmer.detail.sections.partners.plan_label')}:</span>
                    <Link href={`/dashboard/farmer/market-place/${commitment.planId}`} className="text-blue-600 hover:text-blue-800 font-medium">
                      Link <FiExternalLink className="inline ml-1" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Ghi chú và lý do từ chối */}
            {(commitment.note || commitment.rejectReason) && (
              <div className="mt-6 pt-4 border-t border-green-200">
                {commitment.note && (
                  <div className="mb-3">
                    <h4 className="font-semibold text-green-700 text-sm uppercase tracking-wide mb-2">{t('farmingCommitment.pages.farmer.detail.sections.notes.generalTerms')}</h4>
                    <p className="text-gray-700 leading-relaxed">{commitment.note}</p>
                  </div>
                )}
                {commitment.rejectReason && (
                  <div>
                    <h4 className="font-semibold text-red-700 text-sm uppercase tracking-wide mb-2">{t('farmingCommitment.pages.farmer.detail.sections.notes.rejectionReason')}</h4>
                    <p className="text-red-700 leading-relaxed">{commitment.rejectReason}</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Card thông tin kế hoạch thu mua */}
        {plan && (
          <Card className="">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <CardTitle className="text-xl text-orange-800">{t('farmingCommitment.pages.farmer.detail.procurementPlan.title')}</CardTitle>
                  <p className="text-sm text-orange-600 mt-1">{t('farmingCommitment.pages.farmer.detail.procurementPlan.code', { code: plan.planCode })}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Thông tin cơ bản */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-orange-700 text-sm uppercase tracking-wide">{t('farmingCommitment.pages.farmer.detail.procurementPlan.sections.basicInfo.title')}</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('farmingCommitment.pages.farmer.detail.procurementPlan.sections.basicInfo.title_label')}:</span>
                      <span className="font-medium text-gray-800">{plan.title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('farmingCommitment.pages.farmer.detail.procurementPlan.sections.basicInfo.status_label')}:</span>
                      <StatusBadge
                        status={plan.status}
                        map={getProcurementPlanStatusMap(t)}
                      />
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('farmingCommitment.pages.farmer.detail.procurementPlan.sections.basicInfo.registrationPeriod_label')}:</span>
                      <span className="font-medium text-gray-800">
                        {formatDate(plan.startDate)} – {formatDate(plan.endDate)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Thông tin sản lượng */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-orange-700 text-sm uppercase tracking-wide">{t('farmingCommitment.pages.farmer.detail.procurementPlan.sections.output.title')}</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('farmingCommitment.pages.farmer.detail.procurementPlan.sections.output.totalOutput_label')}:</span>
                      <span className="font-medium text-gray-800">
                        {plan.totalQuantity.toLocaleString()} kg
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('farmingCommitment.pages.farmer.detail.procurementPlan.sections.output.registrationProgress_label')}:</span>
                      <span className="font-medium text-gray-800">
                        {plan.progressPercentage || 0}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('farmingCommitment.pages.farmer.detail.procurementPlan.sections.output.planDetailsCount_label')}:</span>
                      <span className="font-medium text-gray-800">
                        {plan.procurementPlansDetails?.length || 0}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Thông tin doanh nghiệp */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-orange-700 text-sm uppercase tracking-wide">{t('farmingCommitment.pages.farmer.detail.procurementPlan.sections.business.title')}</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('farmingCommitment.pages.farmer.detail.procurementPlan.sections.business.name_label')}:</span>
                      <span className="font-medium text-gray-800">{plan.createdBy?.companyName || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('farmingCommitment.pages.farmer.detail.procurementPlan.sections.business.address_label')}:</span>
                      <span className="font-medium text-gray-800 text-right max-w-[150px]">
                        {plan.createdBy?.companyAddress || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('farmingCommitment.pages.farmer.detail.procurementPlan.sections.business.email_label')}:</span>
                      <span className="font-medium text-gray-800">{plan.createdBy?.contactEmail || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mô tả */}
              {plan.description && (
                <div className="mt-6 pt-4 border-t border-orange-200">
                  <h4 className="font-semibold text-orange-700 text-sm uppercase tracking-wide mb-2">{t('farmingCommitment.pages.farmer.detail.procurementPlan.sections.description.title')}</h4>
                  <p className="text-gray-700 leading-relaxed">{plan.description}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Card thông tin đơn đăng ký */}
        {registration && (
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-xl text-blue-800">{t('farmingCommitment.pages.farmer.detail.registration.title')}</CardTitle>
                  <p className="text-sm text-blue-600 mt-1">{t('farmingCommitment.pages.farmer.detail.registration.code', { code: registration.registrationCode })}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Thông tin nông dân */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-blue-700 text-sm uppercase tracking-wide">{t('farmingCommitment.pages.farmer.detail.registration.sections.farmer.title')}</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('farmingCommitment.pages.farmer.detail.registration.sections.farmer.name_label')}:</span>
                      <span className="font-medium text-gray-800">{registration.farmerName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('farmingCommitment.pages.farmer.detail.registration.sections.farmer.location_label')}:</span>
                      <span className="font-medium text-gray-800">{registration.farmerLocation || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('farmingCommitment.pages.farmer.detail.registration.sections.farmer.registrationDate_label')}:</span>
                      <span className="font-medium text-gray-800">{formatDate(registration.registeredAt)}</span>
                    </div>
                  </div>
                </div>

                {/* Thông tin canh tác */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-blue-700 text-sm uppercase tracking-wide">{t('farmingCommitment.pages.farmer.detail.registration.sections.cultivation.title')}</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('farmingCommitment.pages.farmer.detail.registration.sections.cultivation.area_label')}:</span>
                      <span className="font-medium text-gray-800">{registration.registeredArea} ha</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('farmingCommitment.pages.farmer.detail.registration.sections.cultivation.status_label')}:</span>
                      <StatusBadge
                        status={registration.status}
                        map={getCultivationRegistrationStatusMap(t)}
                      />
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('farmingCommitment.pages.farmer.detail.registration.sections.cultivation.detailsCount_label')}:</span>
                      <span className="font-medium text-gray-800">
                        {registration.cultivationRegistrationDetails?.length || 0}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Thông tin chi tiết đăng ký */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-blue-700 text-sm uppercase tracking-wide">{t('farmingCommitment.pages.farmer.detail.registration.sections.details.title')}</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('farmingCommitment.pages.farmer.detail.registration.sections.details.coffeeTypesCount_label')}:</span>
                      <span className="font-medium text-gray-800">
                        {registration.cultivationRegistrationDetails?.length || 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('farmingCommitment.pages.farmer.detail.registration.sections.details.totalOutput_label')}:</span>
                      <span className="font-medium text-gray-800">
                        {registration.cultivationRegistrationDetails?.reduce((total, detail) => 
                          total + (detail.estimatedYield || 0), 0
                        ).toLocaleString()} kg
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('farmingCommitment.pages.farmer.detail.registration.sections.details.averagePrice_label')}:</span>
                      <span className="font-medium text-gray-800">
                        {(() => {
                          const details = registration.cultivationRegistrationDetails || [];
                          if (details.length === 0) return 'N/A';
                          const totalValue = details.reduce((sum, detail) => 
                            sum + ((detail.estimatedYield || 0) * (detail.wantedPrice || 0)), 0
                          );
                          const totalQuantity = details.reduce((sum, detail) => 
                            sum + (detail.estimatedYield || 0), 0
                          );
                          return totalQuantity > 0 ? `${Math.round(totalValue / totalQuantity).toLocaleString()}` : 'N/A';
                        })()} VNĐ/kg
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Ghi chú */}
              {registration.note && (
                <div className="mt-6 pt-4 border-t border-blue-200">
                  <h4 className="font-semibold text-blue-700 text-sm uppercase tracking-wide mb-2">{t('farmingCommitment.pages.farmer.detail.registration.sections.notes.title')}</h4>
                  <p className="text-gray-700 leading-relaxed">{registration.note}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Card chi tiết cam kết */}
        <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
          <CardHeader className='flex justify-between items-center pb-4'>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-xl text-purple-800">{t('farmingCommitment.pages.farmer.detail.commitmentDetails.title')}</CardTitle>
                <p className="text-sm text-purple-600 mt-1">
                  {t('farmingCommitment.pages.farmer.detail.commitmentDetails.subtitle', { count: commitment.farmingCommitmentDetails?.length || 0 })}
                </p>
              </div>
            </div>
            <Button
              size='sm'
              variant='outline'
              onClick={() => setIsDetailsExpanded(!isDetailsExpanded)}
              className="text-purple-600 border-purple-200 hover:bg-purple-50"
            >
              {isDetailsExpanded ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-1" />
                  {t('farmingCommitment.pages.farmer.detail.commitmentDetails.collapse')}
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-1" />
                  {t('farmingCommitment.pages.farmer.detail.commitmentDetails.expand')}
                </>
              )}
            </Button>
          </CardHeader>
          <CardContent>
            {Array.isArray(commitment.farmingCommitmentDetails) &&
            commitment.farmingCommitmentDetails.length > 0 ? (
              <>
                {/* Chế độ thu gọn - chỉ hiển thị danh sách tóm tắt */}
                {!isDetailsExpanded && (
                  <div className="space-y-3">
                    {commitment.farmingCommitmentDetails.map((detail, index) => (
                      <div
                        key={detail.commitmentDetailId}
                        className="bg-white rounded-lg border border-purple-200 p-3 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-semibold text-sm">
                              {index + 1}
                            </div>
                            <div>
                              <h4 className="font-semibold text-purple-800">
                                {detail.commitmentDetailCode}
                              </h4>
                              <p className="text-sm text-purple-600">
                                {detail.coffeeTypeName} - {formatQuantity(detail.committedQuantity ?? 0)}
                              </p>
                            </div>
                          </div>
                          <div className="text-right text-sm">
                            <div className="text-gray-500">Tiến độ</div>
                            <div className="font-medium text-purple-600">{detail.progressPercentage || 0}%</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Chế độ mở rộng - hiển thị đầy đủ thông tin */}
                {isDetailsExpanded && (
                  <div className="space-y-4">
                    {commitment.farmingCommitmentDetails.map((detail, index) => (
                      <div
                        key={detail.commitmentDetailId}
                        className="bg-white rounded-lg border border-purple-200 p-4 shadow-sm hover:shadow-md transition-shadow"
                      >
                        {/* Header của chi tiết */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-semibold text-sm">
                              {index + 1}
                            </div>
                            <div>
                              <h4 className="font-semibold text-purple-800 text-lg">
                                {detail.commitmentDetailCode}
                              </h4>
                              <p className="text-sm text-purple-600">
                                {detail.coffeeTypeName}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-500">{t('farmingCommitment.pages.farmer.detail.commitmentDetails.progress')}</div>
                            <div className="font-medium text-purple-800">{detail.progressPercentage || 0}%</div>
                          </div>
                        </div>

                        {/* Thông tin chi tiết */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {/* Thông tin sản lượng */}
                          <div className="space-y-2">
                            <h5 className="font-medium text-gray-700 text-sm uppercase tracking-wide">{t('farmingCommitment.pages.farmer.detail.commitmentDetails.sections.output.title')}</h5>
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-600">{t('farmingCommitment.pages.farmer.detail.commitmentDetails.sections.output.purchase_label')}:</span>
                                <span className="font-medium">{formatQuantity(detail.committedQuantity ?? 0)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">{t('farmingCommitment.pages.farmer.detail.commitmentDetails.sections.output.delivered_label')}:</span>
                                <span className="font-medium">{formatQuantity(detail.deliveriedQuantity ?? 0)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">{t('farmingCommitment.pages.farmer.detail.commitmentDetails.sections.output.remaining_label')}:</span>
                                <span className="font-medium">{formatQuantity((detail.committedQuantity ?? 0) - (detail.deliveriedQuantity ?? 0))}</span>
                              </div>
                            </div>
                          </div>

                          {/* Thông tin giá cả */}
                          <div className="space-y-2">
                            <h5 className="font-medium text-gray-700 text-sm uppercase tracking-wide">{t('farmingCommitment.pages.farmer.detail.commitmentDetails.sections.pricing.title')}</h5>
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-600">{t('farmingCommitment.pages.farmer.detail.commitmentDetails.sections.pricing.confirmedPrice_label')}:</span>
                                <span className="font-medium">{detail.confirmedPrice?.toLocaleString()} VNĐ/kg</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">{t('farmingCommitment.pages.farmer.detail.commitmentDetails.sections.pricing.advancePayment_label')}:</span>
                                <span className="font-medium">{detail.advancePayment?.toLocaleString()} VNĐ</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">{t('farmingCommitment.pages.farmer.detail.commitmentDetails.sections.pricing.totalValue_label')}:</span>
                                <span className="font-medium">{((detail.confirmedPrice ?? 0) * (detail.committedQuantity ?? 0)).toLocaleString()} VNĐ</span>
                              </div>
                            </div>
                          </div>

                          {/* Thông tin thời gian */}
                          <div className="space-y-2">
                            <h5 className="font-medium text-gray-700 text-sm uppercase tracking-wide">{t('farmingCommitment.pages.farmer.detail.commitmentDetails.sections.timing.title')}</h5>
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-600">{t('farmingCommitment.pages.farmer.detail.commitmentDetails.sections.timing.deliveryStart_label')}:</span>
                                <span className="font-medium">{formatDate(detail.estimatedDeliveryStart)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">{t('farmingCommitment.pages.farmer.detail.commitmentDetails.sections.timing.deliveryEnd_label')}:</span>
                                <span className="font-medium">{formatDate(detail.estimatedDeliveryEnd)}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Ghi chú */}
                        {detail.note && (
                          <div className="mt-4 pt-3 border-t border-purple-200">
                            <h5 className="font-medium text-gray-700 text-sm uppercase tracking-wide mb-2">{t('farmingCommitment.pages.farmer.detail.commitmentDetails.sections.terms.title')}</h5>
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
                <div className="h-16 w-16 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-3">
                  <div className="h-8 w-8 text-purple-600">📋</div>
                </div>
                <p className='text-muted-foreground text-sm'>
                  {t('farmingCommitment.pages.farmer.detail.commitmentDetails.noDetails.title')}
                </p>
                <p className='text-muted-foreground text-xs mt-1'>
                  {t('farmingCommitment.pages.farmer.detail.commitmentDetails.noDetails.subtitle')}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <ConfirmDialog
          open={dialogType !== null}
          onOpenChange={(open) => {
            if (!open) closeDialog();
          }}
          title={t('farmingCommitment.pages.farmer.detail.actions.acceptConfirm.title')}
          description={t('farmingCommitment.pages.farmer.detail.actions.acceptConfirm.description')}
          confirmText={t('farmingCommitment.pages.farmer.detail.actions.acceptConfirm.confirmText')}
          cancelText={t('farmingCommitment.pages.farmer.detail.actions.acceptConfirm.cancelText')}
          loading={loadingConfirm}
          onConfirm={handleAccept}
        />

        <RejectionDialog
          open={openRejectionDialog}
          onOpenChange={setOpenRejectionDialog}
          title={t('farmingCommitment.pages.farmer.detail.actions.rejectConfirm.title')}
          description={t('farmingCommitment.pages.farmer.detail.actions.rejectConfirm.description')}
          confirmText={t('farmingCommitment.pages.farmer.detail.actions.rejectConfirm.confirmText')}
          cancelText={t('farmingCommitment.pages.farmer.detail.actions.rejectConfirm.cancelText')}
          loading={loading}
          onConfirm={(reason) => {
            handleReject(reason);
            setOpenRejectionDialog(false); // đóng dialog sau khi confirm
          }}
        />
      </div>
    </div>
  );
}
