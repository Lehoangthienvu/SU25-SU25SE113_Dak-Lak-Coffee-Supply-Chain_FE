"use client";

import React, { useEffect, useState } from "react";
import { useParams, usePathname } from "next/navigation";
import { differenceInCalendarDays, format } from "date-fns";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import {
  ProcurementPlan,
  getProcurementPlanDetailById,
} from "@/lib/api/procurementPlans";
import {
  CultivationRegistration,
  getCultivationRegistrationsByPlanId,
} from "@/lib/api/cultivationRegistrations";
import { FiMapPin, FiCalendar, FiUser } from "react-icons/fi";
import { Badge } from "@/components/ui/badge";
import CultivationRegistrationForm from "@/components/cultivation-registrations/CultivationRegistrationForm";
import RegistrationGuideCard from "@/components/cultivation-registrations/RegistrationGuideCard";
import { useTranslation } from "react-i18next";

export default function MarketplaceDetailPage() {
  const { t } = useTranslation();
  const params = useParams();
  const pathname = usePathname();
  const { id } = params;

  const [plan, setPlan] = useState<ProcurementPlan | null>(null);
  const [registrations, setRegistrations] = useState<CultivationRegistration[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [isFarmer, setIsFarmer] = useState<boolean | null>(null);
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

  const handleRegistrationSuccess = () => {
    fetchRegistration(id as string);
  };

  if (loading) {
    return <p className='text-center py-20'>{t('marketplace.detailPage.loading')}</p>;
  }

  if (!plan) {
    return (
      <p className='text-center py-20 text-red-600'>
        {t('marketplace.detailPage.notFound')}
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
            <h1 className='text-2xl font-bold text-white'>{t('marketplace.detailPage.banner.title')}</h1>
          </div>
        </div>
      );
    } else {
      // Banner từ marketplace chính - giữ nguyên như cũ
      return (
        <>
          <div className='h-40 bg-gradient-to-r from-orange-400 to-orange-600 relative'>
            <h1 className='absolute bottom-4 left-8 text-white text-3xl font-bold drop-shadow-lg'>
              {t('marketplace.detailPage.banner.title')}
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

    const asideClasses = isFromSidebar
    ? "sticky top-6"
    : "sticky top-30";

    return (
      <div className={containerClasses}>
        <div className={contentClasses}>
          <div className='flex flex-col gap-10 flex-1 max-w-4xl min-h-full'>
            {/* Card chi tiết kế hoạch */}
            <Card className='flex-1 p-6 shadow-lg relative gap-8 z-10 rounded-xl'>
              <h2 className='text-3xl font-bold text-orange-700 mb-4'>
                {plan.title}
              </h2>
              <p className='text-gray-700 mb-6'>{plan.description}</p>

              <div className='grid grid-cols-3 gap-6 mb-6 text-gray-700 font-medium'>
                <div>
                  <p className='text-sm text-gray-500 uppercase'>
                    {t('marketplace.detailPage.planCard.totalQuantity')}
                  </p>
                  <p className='text-xl'>
                    {plan.totalQuantity.toLocaleString()} kg
                  </p>
                </div>
                <div>
                  <p className='text-sm text-gray-500 uppercase'>
                    {t('marketplace.detailPage.planCard.timeRemaining')}
                  </p>
                  <p className='text-xl'>{daysRemaining} {t('marketplace.detailPage.planCard.days')}</p>
                </div>
                <div>
                  <p className='text-sm text-gray-500 uppercase'>
                    {t('marketplace.detailPage.planCard.registrationProgress')}
                  </p>
                  <p className='text-xl'>
                    {plan.progressPercentage.toFixed(2)}%
                  </p>
                </div>
              </div>

              <div>
                <div className='flex items-center justify-between mb-3'>
                  <h3 className='text-xl font-semibold'>{t('marketplace.detailPage.planCard.planDetails')}</h3>
                  {plan.procurementPlansDetails.length > 4 && (
                    <Button
                      type='button'
                      variant='secondaryGradient'
                      className='h-8 px-3'
                      onClick={() => setShowAllDetails((prev) => !prev)}
                    >
                      {showAllDetails
                        ? t('marketplace.detailPage.planCard.collapse')
                        : t('marketplace.detailPage.planCard.viewMore', { count: plan.procurementPlansDetails.length - 4 })}
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
                      <Card
                        key={detail.planDetailsId}
                        className='p-4 shadow-md bg-orange-50 border border-orange-200'
                      >
                        <div className='flex items-start justify-between mb-2'>
                          <div>
                            <p className='text-sm text-gray-500'>{t('marketplace.detailPage.planDetailCard.detailCode')}</p>
                            <p className='font-semibold'>
                              {detail.planDetailCode}
                            </p>
                          </div>
                          <div className='text-right'>
                            <p className='text-sm text-gray-500'>{t('marketplace.detailPage.planDetailCard.coffeeType')}</p>
                            <p className='font-semibold'>
                              {detail.coffeeType?.typeName}
                            </p>
                          </div>
                        </div>

                        <div className='grid grid-cols-2 gap-3 text-sm'>
                          <div>
                            <p className='text-gray-500'>{t('marketplace.detailPage.planDetailCard.processingMethod')}</p>
                            <p className='font-medium'>
                              {detail.processingMethodName ?? t('marketplace.components.planTable.noProcessingMethod')}
                            </p>
                          </div>
                          <div>
                            <p className='text-gray-500'>{t('marketplace.detailPage.planDetailCard.purchaseRegion')}</p>
                            <p className='font-medium'>{detail.targetRegion}</p>
                          </div>
                          <div>
                            <p className='text-gray-500'>
                              {t('marketplace.detailPage.planDetailCard.targetQuantity')}
                            </p>
                            <p className='font-medium'>
                              {detail.targetQuantity?.toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className='text-gray-500'>
                              {t('marketplace.detailPage.planDetailCard.minimumRegistration')}
                            </p>
                            <p className='font-medium'>
                              {detail.minimumRegistrationQuantity?.toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className='text-gray-500'>
                              {t('marketplace.detailPage.planDetailCard.desiredPrice')}
                            </p>
                            <p className='font-medium'>
                              {detail.minPriceRange?.toLocaleString()} -{" "}
                              {detail.maxPriceRange?.toLocaleString()}
                            </p>
                          </div>
                          <div>
                            {/* <p className='text-gray-500'>Năng suất dự kiến (kg/ha)</p>
                            <p className='font-medium'>
                              {detail.expectedYieldPerHectare?.toLocaleString?.() ?? detail.expectedYieldPerHectare}
                            </p> */}
                          </div>
                          <div>
                            <p className='text-gray-500'>{t('marketplace.detailPage.planDetailCard.registeredQuantity')}</p>
                            <p className='font-medium'>
                              {detail.registeredQuantity?.toLocaleString?.() ??
                                detail.registeredQuantity}
                            </p>
                          </div>
                          <div>
                            <p className='text-gray-500'>{t('marketplace.detailPage.planDetailCard.progress')}</p>
                            <div className='mt-1'>
                              <div className='h-2 w-full bg-orange-100 rounded-full overflow-hidden'>
                                <div
                                  className='h-2 bg-orange-500'
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                              <p className='text-xs text-gray-600 mt-1'>
                                {progress.toFixed(0)}%
                              </p>
                            </div>
                          </div>
                        </div>

                        {detail.note && (
                          <div className='mt-3 text-sm'>
                            <p className='text-gray-500'>{t('marketplace.detailPage.planDetailCard.note')}</p>
                            <p className='font-medium'>{detail.note}</p>
                          </div>
                        )}
                      </Card>
                    );
                  })}
                </div>
                <p className='mt-4 text-sm text-gray-600'>
                  {t('marketplace.detailPage.planCard.planCode', { code: plan.planCode })}
                </p>
              </div>
            </Card>

            {/* Card danh sách đơn đăng ký */}
            <Card className='p-6 rounded-xl shadow-lg'>
              <h3 className='text-2xl font-semibold mb-6 text-orange-700'>
                {t('marketplace.detailPage.registrationsList.title')}
              </h3>
              {registrations.length === 0 && (
                <p className='text-gray-600'>{t('marketplace.detailPage.registrationsList.noRegistrations')}</p>
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
                          <p className='font-semibold text-orange-800'>
                            {reg.farmerName}
                          </p>
                          <div className='flex items-center gap-2 text-sm text-gray-600'>
                            <FiMapPin className='text-orange-600' />
                            <span>{reg.farmerLocation}</span>
                          </div>
                        </div>
                      </div>
                      <Badge
                        variant='secondary'
                        className='bg-white text-orange-700 border border-orange-200'
                      >
                        {reg.cultivationRegistrationDetails.length} {t('marketplace.detailPage.registrationsList.details')}
                      </Badge>
                    </div>

                    <div className='mt-3 grid grid-cols-2 gap-3 text-sm'>
                      <div>
                        <p className='text-gray-500'>{t('marketplace.detailPage.registrationsList.registeredArea', { area: reg.registeredArea.toLocaleString() })}</p>
                      </div>
                      <div className='text-right'>
                        <div className='inline-flex items-center gap-2 text-gray-600'>
                          <FiCalendar className='text-orange-600' />
                          <span className='text-sm'>
                            {format(
                              new Date(reg.registeredAt),
                              "dd/MM/yyyy HH:mm"
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Form đăng ký nông hộ */}
            <CultivationRegistrationForm
              plan={plan}
              onRegistrationSuccess={handleRegistrationSuccess}
              isFarmer={isFarmer}
              isLoggedIn={isLoggedIn()}
            />
          </div>

          <aside className={`w-90 flex flex-col gap-6 z-10 ${asideClasses}`}>
            <Card className='w-full p-6 rounded-xl shadow-lg gap-2'>
              <h3 className='text-xl font-semibold text-orange-700'>
                {t('marketplace.detailPage.businessInfo.title')}
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
                {t('marketplace.detailPage.businessInfo.website')}
              </a>
              <p className='text-gray-700'>
                {t('marketplace.detailPage.businessInfo.email', { email: plan.createdBy.contactEmail })}
              </p>
            </Card>

            {/* Card hướng dẫn đăng ký */}
            <RegistrationGuideCard />
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
