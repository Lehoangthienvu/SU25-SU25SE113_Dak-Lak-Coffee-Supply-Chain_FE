"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  ArrowLeft,
  FileText,
  Coffee,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AppToast } from "@/components/ui/AppToast";
import { getErrorMessage } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import {
  CultivationRegistration,
  getCultivationRegistrationById,
} from "@/lib/api/cultivationRegistrations";
import {
  ProcurementPlan,
  getProcurementPlanDetailById,
} from "@/lib/api/procurementPlans";
import { getCultivationRegistrationStatusMap } from "@/lib/constants/cultivationRegistrationStatus";
import { getCultivationRegistrationDetailStatusMap } from "@/lib/constants/cultivationRegistrationDetailStatusMap";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import StatusBadge from "@/components/crop-seasons/StatusBadge";
import { FiExternalLink } from "react-icons/fi";
import Link from "next/link";

export default function CultivationRegistrationDetailPage() {
  const { t } = useTranslation();
  const params = useParams();
  const router = useRouter();
  const registrationId = params.id as string;

  const [registration, setRegistration] =
    useState<CultivationRegistration | null>(null);
  const [plan, setPlan] = useState<ProcurementPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (registrationId) {
      fetchData(registrationId);
    }
  }, [registrationId]);

  const fetchData = async (registrationId: string) => {
    setIsLoading(true);
    try {
      // Fetch registration details
      const registrationData = await getCultivationRegistrationById(
        registrationId
      );
      if (registrationData) {
        setRegistration(registrationData);

        // Fetch plan details
        const planData = await getProcurementPlanDetailById(
          registrationData.planId
        );
        setPlan(planData);
      }
    } catch (error) {
      AppToast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const registrationStatusMap = getCultivationRegistrationStatusMap(t);
  const detailStatusMap = getCultivationRegistrationDetailStatusMap(t);

  if (isLoading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <LoadingSpinner />
      </div>
    );
  }

  if (!registration) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-center'>
          <h2 className='text-xl font-semibold text-gray-900 mb-2'>
            {t("cultivationRegistration.pages.detail.notFound")}
          </h2>
          <Button onClick={() => router.back()}>{t("common.back")}</Button>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen p-6'>
      <div className='max-w-6xl mx-auto space-y-6'>
        {/* Header */}
        <div className='flex items-center gap-4 mb-6'>
          <Button
            variant='outline'
            size='icon'
            onClick={() => router.back()}
            className='shrink-0'
          >
            <ArrowLeft className='h-4 w-4' />
          </Button>
          <div className='flex-1'>
            <h1 className='text-2xl font-bold text-gray-900'>
              {t("cultivationRegistration.pages.detail.title")}
            </h1>
            <p className='text-gray-600 mt-1'>
              {registration.registrationCode}
            </p>
          </div>
          <StatusBadge
            status={registration.status}
            map={registrationStatusMap}
          />
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          {/* Main Content */}
          <div className='lg:col-span-2 space-y-6'>
            {/* Registration Information */}
            <Card className='p-6'>
              <div className='flex items-center gap-2 mb-4'>
                <FileText className='h-5 w-5 text-blue-600' />
                <h2 className='text-lg font-semibold text-gray-900'>
                  {t("cultivationRegistration.pages.detail.registrationInfo")}
                </h2>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <label className='text-sm font-medium text-gray-500'>
                    {t(
                      "cultivationRegistration.components.registrationCard.labels.registrationCode"
                    )}
                  </label>
                  <p className='text-gray-900 font-mono'>
                    {registration.registrationCode}
                  </p>
                </div>

                <div>
                  <label className='text-sm font-medium text-gray-500'>
                    {t(
                      "cultivationRegistration.components.registrationCard.labels.registrationDate"
                    )}
                  </label>
                  <p className='text-gray-900'>
                    {format(
                      new Date(registration.registeredAt),
                      "dd/MM/yyyy HH:mm"
                    )}
                  </p>
                </div>

                <div>
                  <label className='text-sm font-medium text-gray-500'>
                    {t(
                      "cultivationRegistration.components.registrationCard.labels.registeredArea"
                    )}
                  </label>
                  <p className='text-gray-900'>
                    {registration.registeredArea.toLocaleString()}{" "}
                    {t(
                      "cultivationRegistration.components.registrationCard.units.hectare"
                    )}
                  </p>
                </div>

                <div>
                  <label className='text-sm font-medium text-gray-500'>
                    {t("cultivationRegistration.pages.detail.totalPrice")}
                  </label>
                  <p className='text-gray-900 font-semibold'>
                    {registration.totalWantedPrice != null
                      ? registration.totalWantedPrice.toLocaleString() + " VND"
                      : ""}
                  </p>
                </div>
              </div>

              {registration.note && (
                <div className='mt-4'>
                  <label className='text-sm font-medium text-gray-500'>
                    {t(
                      "cultivationRegistration.components.registrationCard.labels.note"
                    )}
                  </label>
                  <p className='text-gray-900 mt-1'>{registration.note}</p>
                </div>
              )}
            </Card>

            {/* Registration Details */}
            <Card className='p-6'>
              <div className='flex items-center gap-2 mb-4'>
                <Coffee className='h-5 w-5 text-green-600' />
                <h2 className='text-lg font-semibold text-gray-900'>
                  {t(
                    "cultivationRegistration.pages.detail.registrationDetails"
                  )}
                </h2>
              </div>

              <div className='space-y-4'>
                {registration.cultivationRegistrationDetails.map(
                  (detail, index) => (
                    <div
                      key={detail.cultivationRegistrationDetailId}
                      className='border rounded-lg p-4'
                    >
                      <div className='flex items-center justify-between mb-3'>
                        <h3 className='font-medium text-gray-900'>
                          {t(
                            "cultivationRegistration.pages.detail.detailNumber",
                            { number: index + 1 }
                          )}
                        </h3>
                        <StatusBadge
                          status={detail.status ?? ""}
                          map={detailStatusMap}
                        />
                      </div>

                      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        <div>
                          <label className='text-sm font-medium text-gray-500'>
                            {t(
                              "cultivationRegistration.components.registrationCard.labels.coffeeType"
                            )}
                          </label>
                          <p className='text-gray-900'>{detail.coffeeType}</p>
                        </div>

                        <div>
                          <label className='text-sm font-medium text-gray-500'>
                            {t(
                              "cultivationRegistration.components.registrationCard.labels.estimatedYield"
                            )}
                          </label>
                          <p className='text-gray-900'>
                            {detail.estimatedYield !== undefined
                              ? detail.estimatedYield.toLocaleString()
                              : "--"}{" "}
                            {t(
                              "cultivationRegistration.components.registrationCard.units.kilogram"
                            )}
                          </p>
                        </div>

                        <div>
                          <label className='text-sm font-medium text-gray-500'>
                            {t(
                              "cultivationRegistration.components.registrationCard.labels.wantedPrice"
                            )}
                          </label>
                          <p className='text-gray-900'>
                            {detail.wantedPrice !== undefined
                              ? detail.wantedPrice.toLocaleString()
                              : "--"}{" "}
                            {t(
                              "cultivationRegistration.components.registrationCard.units.vndPerKg"
                            )}
                          </p>
                        </div>

                        {/* <div>
                        <label className="text-sm font-medium text-gray-500">
                          {t("cultivationRegistration.pages.detail.expectedYieldPerHectare")}
                        </label>
                        <p className="text-gray-900">
                          {detail.expectedYield !== undefined
                            ? detail.expectedYield.toLocaleString()
                            : "--"} {t("cultivationRegistration.components.registrationCard.units.kilogram")}/ha
                        </p>
                      </div> */}

                        <div>
                          <label className='text-sm font-medium text-gray-500'>
                            {t(
                              "cultivationRegistration.components.registrationCard.labels.harvestTime"
                            )}
                          </label>
                          <p className='text-gray-900'>
                            {detail.expectedHarvestStart
                              ? format(
                                  new Date(detail.expectedHarvestStart),
                                  "dd/MM/yyyy"
                                )
                              : "--"}
                            {" - "}
                            {detail.expectedHarvestEnd
                              ? format(
                                  new Date(detail.expectedHarvestEnd),
                                  "dd/MM/yyyy"
                                )
                              : "--"}
                          </p>
                        </div>

                        {detail.note && (
                          <div className='mt-3'>
                            <label className='text-sm font-medium text-gray-500'>
                              {t(
                                "cultivationRegistration.components.registrationForm.labels.detailNote"
                              )}
                            </label>
                            <p className='text-gray-900 mt-1'>{detail.note}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                )}
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className='space-y-6'>
            {/* Plan Information */}
            {plan && (
              <Card className='p-6'>
                <div className='flex items-center gap-2 mb-4'>
                  <Package className='h-5 w-5 text-purple-600' />
                  <h2 className='text-lg font-semibold text-gray-900'>
                    {t("cultivationRegistration.pages.detail.planInfo")}
                  </h2>
                </div>

                <div className='space-y-3'>
                  <div>
                    <label className='text-sm font-medium text-gray-500'>
                      {t("cultivationRegistration.pages.detail.planTitle")}
                    </label>
                    <p className='text-gray-900 font-medium'>
                      {plan.title}
                      <Link
                        href={`/dashboard/farmer/market-place/${plan.planId}`}
                        className='text-blue-600 hover:text-blue-800 font-medium'
                      >
                        <FiExternalLink className='inline ml-1' />
                      </Link>
                    </p>
                  </div>

                  <div>
                    <label className='text-sm font-medium text-gray-500'>
                      {t("cultivationRegistration.pages.detail.planCode")}
                    </label>
                    <p className='text-gray-900 font-mono'>{plan.planCode}</p>
                  </div>

                  <div>
                    <label className='text-sm font-medium text-gray-500'>
                      {t("cultivationRegistration.pages.detail.companyName")}
                    </label>
                    <p className='text-gray-900'>
                      {plan.createdBy.companyName}
                    </p>
                  </div>

                  <div>
                    <label className='text-sm font-medium text-gray-500'>
                      {t("cultivationRegistration.pages.detail.planPeriod")}
                    </label>
                    <p className='text-gray-900'>
                      {format(new Date(plan.startDate), "dd/MM/yyyy")} -{" "}
                      {format(new Date(plan.endDate), "dd/MM/yyyy")}
                    </p>
                  </div>

                  <div>
                    <label className='text-sm font-medium text-gray-500'>
                      {t("cultivationRegistration.pages.detail.totalQuantity")}
                    </label>
                    <p className='text-gray-900'>
                      {plan.totalQuantity.toLocaleString()}{" "}
                      {t(
                        "cultivationRegistration.components.registrationCard.units.kilogram"
                      )}
                    </p>
                  </div>

                  <div>
                    <label className='text-sm font-medium text-gray-500'>
                      {t("cultivationRegistration.pages.detail.progress")}
                    </label>
                    <div className='flex items-center gap-2'>
                      <div className='flex-1 bg-gray-200 rounded-full h-2'>
                        <div
                          className='bg-blue-600 h-2 rounded-full'
                          style={{ width: `${plan.progressPercentage}%` }}
                        ></div>
                      </div>
                      <span className='text-sm text-gray-600'>
                        {plan.progressPercentage}%
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Farmer Information */}
            {/* <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <User className="h-5 w-5 text-orange-600" />
                <h2 className="text-lg font-semibold text-gray-900">
                  {t("cultivationRegistration.pages.detail.farmerInfo")}
                </h2>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    {t("cultivationRegistration.pages.detail.farmerName")}
                  </label>
                  <p className="text-gray-900">{registration.farmerName}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    {t("cultivationRegistration.pages.detail.farmerLocation")}
                  </label>
                  <p className="text-gray-900">{registration.farmerLocation}</p>
                </div>
              </div>
            </Card> */}
          </div>
        </div>
      </div>
    </div>
  );
}
