"use client";

import React from "react";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";
import { CultivationRegistration } from "@/lib/api/cultivationRegistrations";
import { getCultivationRegistrationStatusMap } from "@/lib/constants/cultivationRegistrationStatus";
import StatusBadge from "@/components/crop-seasons/StatusBadge";

interface CultivationRegistrationCardForFarmerProps {
  registration: CultivationRegistration;
  onViewDetails?: (registrationId: string) => void;
}

export default function CultivationRegistrationCardForFarmer({
  registration,
  onViewDetails,
}: CultivationRegistrationCardForFarmerProps) {
  const { t } = useTranslation();
  const statusMap = getCultivationRegistrationStatusMap(t);

  const handleViewDetails = () => {
    if (onViewDetails) {
      onViewDetails(registration.registrationId);
    }
  };

  return (
    <tr className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
      <td className="px-4 py-3">
        <div>
          <div className="font-medium text-gray-900">
            {registration.registrationCode}
          </div>
          <div className="text-sm text-gray-500">
            {format(new Date(registration.registeredAt), "dd/MM/yyyy HH:mm")}
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="text-sm text-gray-900">
          {registration.registeredArea.toLocaleString()} {t("cultivationRegistration.components.registrationCard.units.hectare")}
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="text-sm text-gray-900">
          {registration.cultivationRegistrationDetails.length} {t("cultivationRegistration.pages.list.table.headers.details")}
        </div>
      </td>
      <td className="px-4 py-3">
        <StatusBadge
          status={registration.status}
          map={statusMap}
        />
      </td>
      <td className="px-4 py-3">
        <div className="text-sm text-gray-900">
          {registration.totalWantedPrice.toLocaleString()} VND
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            onClick={handleViewDetails}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            {t("cultivationRegistration.pages.list.table.headers.viewDetails")}
          </button>
        </div>
      </td>
    </tr>
  );
}
