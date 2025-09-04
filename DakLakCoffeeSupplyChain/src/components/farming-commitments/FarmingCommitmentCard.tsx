"use client";

import { FarmingCommitment } from "@/lib/api/farmingCommitments";
import { FarmingCommitmentStatusValue } from "@/lib/constants/FarmingCommitmentStatus";
import Link from "next/link";
import StatusBadge from "../crop-seasons/StatusBadge";
import BasicDropdown from "../ui/dropdownMenu";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { FiEdit, FiInfo, FiCheck } from "react-icons/fi";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Tooltip } from "@/components/ui/tooltip";
import { useState } from "react";
import { updateFarmingCommitmentStatusByBusiness } from "@/lib/api/farmingCommitments";
import { AppToast } from "@/components/ui/AppToast";
import { Button } from "../ui/button";
import { getErrorMessage } from "@/lib/utils";

type StatusInfo = {
  label: string;
  color: 'green' | 'yellow' | 'blue' | 'red' | 'gray';
  icon: string;
};

export default function FarmingCommitmentCard({
  commitment,
  statusMap,
}: {
  commitment: FarmingCommitment;
  statusMap: Record<FarmingCommitmentStatusValue, StatusInfo>
}) {
  const router = useRouter();
  const { t } = useTranslation();
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  const handleCompleteCommitment = async () => {
    setIsCompleting(true);
    try {
      await updateFarmingCommitmentStatusByBusiness(
        { status: "Completed" },
        commitment.commitmentId
      );
      AppToast.success(t("farmingCommitment.components.farmingCommitmentCard.completeSuccess"));
      setShowCompleteDialog(false);
      // Refresh the page to update the status
      window.location.reload();
    } catch (error) {
      AppToast.error(getErrorMessage(error));
      console.error("Error completing commitment:", error);
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <>
      <tr key={commitment.commitmentId} className='border-t hover:bg-gray-50'>
        <td className='px-4 py-3'>
          <Link
            href={`/dashboard/manager/farming-commitments/${commitment.commitmentId}`}
          >
            <Tooltip content={commitment.commitmentName} side='top' align='start'>
              <div className='font-medium truncate' title={commitment.commitmentName}>
                {commitment.commitmentName}
              </div>
            </Tooltip>
            <div className='text-sm text-muted-foreground flex items-center gap-1'>
              {commitment.commitmentCode}
            </div>
          </Link>
        </td>

        <td className='px-4 py-3'>{commitment.farmerName}</td>
        <td className='px-4 py-3'>
          {commitment.totalPrice.toLocaleString()} VNĐ
        </td>

        <td className='px-4 py-3'>
          <StatusBadge
            status={commitment.status}
            map={statusMap}
          />
        </td>

        <td className='px-4 py-3'>
          {new Date(commitment.commitmentDate).toLocaleDateString("vi-VN")}
        </td>

        <td className='px-4 py-3 text-center align-middle'>
          <BasicDropdown>
              <DropdownMenu.Item
              className='px-3 py-2 hover:bg-gray-100 rounded cursor-pointer flex items-center'
              disabled={commitment.status == "Active"}
              style={{
                cursor: commitment.status == "Active" ? "not-allowed" : "pointer",
              }}
              onClick={() => {
                if (commitment.status === "Pending") {
                router.push(`/dashboard/manager/farming-commitments/${commitment.commitmentId}/edit?registrationId=${commitment.registrationId}`);
                }
              }}
              >
              <FiEdit className='mr-1' /> {t("farmingCommitment.components.farmingCommitmentCard.actions.edit")}
              </DropdownMenu.Item>
            <DropdownMenu.Item
              className='px-3 py-2 hover:bg-gray-100 rounded cursor-pointer flex items-center'
              onClick={() => {
                router.push(`/dashboard/manager/farming-commitments/${commitment.commitmentId}`);
              }}
            >
              <FiInfo className='mr-1' /> {t("farmingCommitment.components.farmingCommitmentCard.actions.view")}
            </DropdownMenu.Item>
            <DropdownMenu.Item
              className='px-3 py-2 hover:bg-gray-100 rounded cursor-pointer flex items-center'
              disabled={commitment.status === "Completed" || commitment.status === "Rejected"}
              style={{
                cursor: commitment.status === "Completed" || commitment.status === "Rejected" ? "not-allowed" : "pointer",
              }}
              onClick={() => {
                if (commitment.status === "Active") {
                  setShowCompleteDialog(true);
                }
              }}
            >
              <FiCheck className='mr-1' /> {t("farmingCommitment.components.farmingCommitmentCard.actions.complete")}
            </DropdownMenu.Item>
          </BasicDropdown>
        </td>
      </tr>
      {showCompleteDialog && (
        <div className="fixed inset-0 bg-black/20 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">{t("farmingCommitment.components.farmingCommitmentCard.completeDialog.title")}</h3>
            <p className="text-gray-600 mb-6">
              {t("farmingCommitment.components.farmingCommitmentCard.completeDialog.message")}
            </p>
            <div className="flex justify-end space-x-3">
              <Button
                variant={"outline"}
                onClick={() => setShowCompleteDialog(false)}
                disabled={isCompleting}
              >
                {t("farmingCommitment.components.farmingCommitmentCard.completeDialog.cancel")}
              </Button>
              <Button
                onClick={handleCompleteCommitment}
                variant={"destructive"}
                disabled={isCompleting}
              >
                {isCompleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {t("farmingCommitment.components.farmingCommitmentCard.completeDialog.processing")}
                  </>
                ) : (
                  t("farmingCommitment.components.farmingCommitmentCard.completeDialog.confirm")
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
