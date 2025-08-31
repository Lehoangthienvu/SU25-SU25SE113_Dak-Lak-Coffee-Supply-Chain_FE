"use client";

import React, { useEffect, useState } from "react";
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { AppToast } from "../ui/AppToast";
import { useTranslation } from "react-i18next";
import {
  CultivationRegistrationDetail,
  updateCultivationRegistrationDetailStatus,
} from "@/lib/api/cultivationRegistrations";
import { getErrorMessage } from "@/lib/utils";
import { ConfirmDialog } from "../ui/confirmDialog";
import { FiCheck, FiXCircle } from "react-icons/fi";
import { useRouter } from "next/dist/client/components/navigation";
import StatusBadge from "@/components/crop-seasons/StatusBadge";
import { getCultivationRegistrationStatusMap } from "@/lib/constants/cultivationRegistrationStatus";
import { getCultivationRegistrationDetailStatusMap } from "@/lib/constants/cultivationRegistrationDetailStatusMap";

const STORAGE_KEY_PREFIX = "registration-expanded-";

type RegistrationCardProps = {
  registrationId: string;
  registrationCode: string;
  farmerName: string;
  farmerAvatarURL: string | null;
  farmerLocation: string;
  registeredArea: number;
  registeredAt: string;
  note: string;
  planStatus: string | number;
  status: string | number;
  commitmentId?: string | null;
  commitmentStatus: string | number;
  cultivationRegistrationDetails: Partial<CultivationRegistrationDetail>[];
  onUpdate?: () => void;
};

export default function RegistrationCard({
  registrationId,
  registrationCode,
  farmerName,
  farmerAvatarURL,
  farmerLocation,
  registeredArea,
  registeredAt,
  cultivationRegistrationDetails,
  note,
  status,
  planStatus,
  commitmentId,
  commitmentStatus,
  onUpdate,
}: RegistrationCardProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [loadingApprovalId, setLoadingApprovalId] = useState<string | null>(
    null
  );
  const [dialogType, setDialogType] = useState<"approve" | "reject" | null>(
    null
  );
  const [currentDetailId, setCurrentDetailId] = useState<string | null>(null);
  // const [confirmOpen, setConfirmOpen] = useState(false);

  // Get i18n-aware status maps
  const registrationStatusMap = getCultivationRegistrationStatusMap(t);
  const detailStatusMap = getCultivationRegistrationDetailStatusMap(t);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY_PREFIX + registrationId);
    if (stored === "true") {
      setExpanded(true);
    }
  }, [registrationId]);

  const toggleExpanded = () => {
    setExpanded((prev) => {
      const newState = !prev;
      localStorage.setItem(
        STORAGE_KEY_PREFIX + registrationId,
        newState ? "true" : "false"
      );
      return newState;
    });
  };

  const openConfirmDialog = (detailId: string) => {
    setCurrentDetailId(detailId);
    //setConfirmOpen(true);
    setDialogType("approve");
  };

  const openRejectDialog = (detailId: string) => {
    setCurrentDetailId(detailId);
    setDialogType("reject");
  };

  function closeDialog() {
    setDialogType(null);
  }

  const currentDetail =
    cultivationRegistrationDetails.find(
      (d) => d.cultivationRegistrationDetailId === currentDetailId
    ) || null;

  const handleApprove = async () => {
    if (!currentDetailId) return;

    setLoadingApprovalId(currentDetailId);
    try {
      await updateCultivationRegistrationDetailStatus(currentDetailId, {
        status: 1,
      });
      AppToast.success(t('cultivationRegistration.components.registrationCard.messages.approveSuccess'));
      setDialogType(null);
      onUpdate?.();
    } catch (error) {
      AppToast.error(getErrorMessage(error) || t('cultivationRegistration.components.registrationCard.messages.approveError'));
    } finally {
      setLoadingApprovalId(null);
    }
  };

  const handleReject = async () => {
    if (!currentDetailId) return;

    setLoadingApprovalId(currentDetailId);
    try {
      await updateCultivationRegistrationDetailStatus(currentDetailId, {
        status: 3,
      });
      AppToast.success(t('cultivationRegistration.components.registrationCard.messages.rejectSuccess'));
      setDialogType(null);
      onUpdate?.();
    } catch (error) {
      AppToast.error(getErrorMessage(error) || t('cultivationRegistration.components.registrationCard.messages.rejectError'));
    } finally {
      setLoadingApprovalId(null);
    }
  };

  return (
    <div className='border border-gray-300 rounded-xl p-4 bg-orange-50 shadow-sm mx-6'>
      {/* Header */}
      <div className='flex items-center gap-4'>
        {farmerAvatarURL ? (
          <Image
            src={farmerAvatarURL}
            alt={`${farmerName} avatar`}
            width={56}
            height={56}
            className='w-14 h-14 rounded-full object-cover border border-gray-300'
          />
        ) : (
          <div className='w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center text-gray-500'>
            <span className='text-xl font-semibold'>
              {farmerName.charAt(0)}
            </span>
          </div>
        )}

        {/* Info chính */}
        <div className='flex-1 min-w-0'>
          <div className='flex items-center gap-1 mb-1'>
            <h4 className='text-lg font-semibold truncate'>{farmerName}</h4>
            <StatusBadge
              status={status}
              map={registrationStatusMap}
            />
          </div>
          <p className='text-sm text-gray-600 truncate'>{farmerLocation}</p>
          <p className='text-sm text-gray-600 mt-1'>
            {t('cultivationRegistration.components.registrationCard.labels.registeredArea')} <span className='font-medium'>
              {registeredArea.toLocaleString()} {t('cultivationRegistration.components.registrationCard.units.hectare')}
            </span>
          </p>
          <p className='text-xs text-gray-400 mt-0.5'>
            {t('cultivationRegistration.components.registrationCard.labels.registrationCode')} <span className='font-mono'>{registrationCode}</span> - {t('cultivationRegistration.components.registrationCard.labels.registrationDate')} {format(new Date(registeredAt), "dd/MM/yyyy HH:mm")}
          </p>
          <p className='text-sm text-gray-600 mt-1'>
            {t('cultivationRegistration.components.registrationCard.labels.description')} <span className='font-medium'>{note}</span>
          </p>
        </div>

        {/* Nút mở rộng */}
        <Button
          variant='secondaryGradient'
          size='sm'
          className='flex items-center gap-1'
          onClick={toggleExpanded}
          aria-expanded={expanded}
          aria-controls={`detail-content-${registrationId}`}
          aria-label={expanded ? t('cultivationRegistration.components.registrationCard.ariaLabels.collapseDetails') : t('cultivationRegistration.components.registrationCard.ariaLabels.expandDetails')}
        >
          {expanded ? t('cultivationRegistration.components.registrationCard.buttons.collapse') : t('cultivationRegistration.components.registrationCard.buttons.expand')}
          {expanded ? (
            <ChevronUpIcon className='w-4 h-4' />
          ) : (
            <ChevronDownIcon className='w-4 h-4' />
          )}
        </Button>
      </div>

      {/* Nội dung chi tiết khi mở rộng */}
      {expanded && (
        <div
          id={`detail-content-${registrationId}`}
          className='mt-4 border-t border-gray-200 pt-4 space-y-3 text-sm text-gray-700'
        >
          {cultivationRegistrationDetails.map((detail) => {
            const isApproved = detail.status === "Approved";
            const isRejected = detail.status === "Rejected";
            const isCommitmentCreated =
              commitmentId &&
              commitmentId !== "00000000-0000-0000-0000-000000000000";
            const isCommitmentActive = commitmentStatus === "Active";
            const isProcurementPlanCancelled = planStatus === "Cancelled" || planStatus === 2;
            return (
              <div
                key={detail.cultivationRegistrationDetailId}
                className='bg-orange-100 p-3 rounded-md border border-orange-100'
              >
                <div className='flex items-center gap-1'>
                  <p>
                    <strong>{t('cultivationRegistration.components.registrationCard.labels.coffeeType')}</strong> {detail.coffeeType}
                  </p>
                  <StatusBadge
                    status={detail.status ?? ""}
                    map={detailStatusMap}
                  />
                </div>
                <p>
                  <strong>{t('cultivationRegistration.components.registrationCard.labels.estimatedYield')}</strong>{" "}
                  {detail.estimatedYield !== undefined
                    ? detail.estimatedYield.toLocaleString()
                    : t('cultivationRegistration.components.registrationCard.status.notUpdated')}{" "}
                  {t('cultivationRegistration.components.registrationCard.units.kilogram')}
                </p>
                <p>
                  <strong>{t('cultivationRegistration.components.registrationCard.labels.wantedPrice')}</strong>{" "}
                  {detail.wantedPrice
                    ? detail.wantedPrice.toLocaleString() + " " + t('cultivationRegistration.components.registrationCard.units.vndPerKg')
                    : t('cultivationRegistration.components.registrationCard.status.notUpdated')}
                </p>
                <p>
                  <strong>{t('cultivationRegistration.components.registrationCard.labels.harvestTime')}</strong>{" "}
                  {detail.expectedHarvestStart} {detail.expectedHarvestEnd}
                </p>
                {detail.note && (
                  <p>
                    <strong>{t('cultivationRegistration.components.registrationCard.labels.note')}</strong> {detail.note}
                  </p>
                )}

                {/* Nút tạo hoặc chỉnh sửa cam kết */}
                <div className='flex justify-end'>
                  {isApproved && isCommitmentCreated && !isCommitmentActive ? (
                    <>
                      <Button
                        size='sm'
                        variant='secondaryGradient'
                        onClick={() => {
                          router.push(
                            `/dashboard/manager/farming-commitments/${commitmentId}/edit?registrationId=${registrationId}&registrationDetailId=${detail.cultivationRegistrationDetailId}&wantedPrice=${detail.wantedPrice}&estimatedYield=${detail.estimatedYield}`
                          );
                        }}
                      >
                        {t('cultivationRegistration.components.registrationCard.buttons.editCommitment')}
                      </Button>
                    </>
                  ) : isApproved && !isCommitmentCreated ? (
                    <div className='flex gap-2'>
                      <Button
                      size='sm'
                      variant='secondaryGradient'
                      onClick={() => {
                        router.push(
                          `/dashboard/manager/farming-commitments/create?registrationId=${registrationId}&registrationDetailId=${detail.cultivationRegistrationDetailId}&wantedPrice=${detail.wantedPrice}&estimatedYield=${detail.estimatedYield}`
                        );
                      }}
                    >
                      {t('cultivationRegistration.components.registrationCard.buttons.createCommitment')}
                    </Button>
                    <Button
                        size='sm'
                        variant='destructiveGradient'
                        disabled={
                          loadingApprovalId ===
                          detail.cultivationRegistrationDetailId
                        }
                        onClick={() =>
                          detail.cultivationRegistrationDetailId &&
                          openRejectDialog(
                            detail.cultivationRegistrationDetailId
                          )
                        }
                        //className='bg-green-200 hover:bg-emerald-400 hover:text-white text-green-800 transition'
                      >
                        <FiXCircle className='mr-1' /> {t('cultivationRegistration.components.registrationCard.buttons.reject')}
                      </Button>
                    </div>
                  ) : isRejected || isProcurementPlanCancelled || isCommitmentActive ? (
                    <></>
                  ) : (
                    <div className='flex gap-2'>
                      <Button
                        size='sm'
                        variant='approveGradient'
                        disabled={
                          loadingApprovalId ===
                          detail.cultivationRegistrationDetailId
                        }
                        onClick={() =>
                          detail.cultivationRegistrationDetailId &&
                          openConfirmDialog(
                            detail.cultivationRegistrationDetailId
                          )
                        }
                        //className='bg-green-200 hover:bg-emerald-400 hover:text-white text-green-800 transition'
                      >
                        <FiCheck className='inline-block' /> {t('cultivationRegistration.components.registrationCard.buttons.approve')}
                      </Button>
                      <Button
                        size='sm'
                        variant='destructiveGradient'
                        disabled={
                          loadingApprovalId ===
                          detail.cultivationRegistrationDetailId
                        }
                        onClick={() =>
                          detail.cultivationRegistrationDetailId &&
                          openRejectDialog(
                            detail.cultivationRegistrationDetailId
                          )
                        }
                        //className='bg-green-200 hover:bg-emerald-400 hover:text-white text-green-800 transition'
                      >
                        <FiXCircle className='mr-1' /> {t('cultivationRegistration.components.registrationCard.buttons.reject')}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Popup confirm duyệt */}
          <ConfirmDialog
            open={dialogType !== null}
            onOpenChange={(open) => !open && closeDialog()}
            title={
              dialogType === "approve"
                ? t('cultivationRegistration.dialogs.confirm.approve.title')
                : dialogType === "reject"
                ? t('cultivationRegistration.dialogs.confirm.reject.title')
                : ""
            }
            description={
              dialogType === "approve" ? (
                <>
                  {t('cultivationRegistration.dialogs.confirm.approve.description', { coffeeType: currentDetail?.coffeeType ?? "" })}
                </>
              ) : dialogType === "reject" ? (
                <>
                  {t('cultivationRegistration.dialogs.confirm.reject.description', { coffeeType: currentDetail?.coffeeType ?? "" })}
                </>
              ) : (
                ""
              )
            }
            confirmText={t('cultivationRegistration.dialogs.confirm.actions.confirm')}
            cancelText={t('cultivationRegistration.dialogs.confirm.actions.cancel')}
            onConfirm={() => {
              if (dialogType === "approve") {
                handleApprove();
              } else if (dialogType === "reject") {
                handleReject();
              }
            }}
            loading={loadingApprovalId !== null}
          />
        </div>
      )}
    </div>
  );
}
