import {
  ContractStatusMap,
  ContractStatusValue,
} from "@/lib/constants/contractStatus";
import FilterBadge from "../crop-seasons/FilterBadge";
import { useTranslation } from "react-i18next";

interface FilterContractStatusPanelProps {
  selectedStatus: string | null;
  setSelectedStatus: (value: string | null) => void;
  statusCounts: Record<string, number>;
}

export default function FilterContractStatusPanel({
  selectedStatus,
  setSelectedStatus,
  statusCounts,
}: FilterContractStatusPanelProps) {
  const { t } = useTranslation();

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 space-y-3">
      <h2 className="text-sm font-medium text-gray-700">
        {t("contracts.page.list.filters.title")}
      </h2>

      <FilterBadge
        icon="📄"
        label={t("contracts.page.list.filters.allStatuses")}
        count={Object.values(statusCounts).reduce((sum, val) => sum + val, 0)}
        color="orange"
        active={selectedStatus === null}
        onClick={() => setSelectedStatus(null)}
      />

      {/* Chỉ hiển thị các trạng thái cần thiết */}
      {[
        { key: "NotStarted", ...ContractStatusMap.NotStarted },
        { key: "InProgress", ...ContractStatusMap.InProgress },
        { key: "Completed", ...ContractStatusMap.Completed },
        { key: "Cancelled", ...ContractStatusMap.Cancelled },
        { key: "Expired", ...ContractStatusMap.Expired },
      ].map(({ key, color, icon }) => {
        // Map key to correct translation key
        const statusKeyMap: Record<string, string> = {
          NotStarted: "notStarted",
          InProgress: "inProgress",
          Completed: "completed",
          Cancelled: "cancelled",
          Expired: "expired",
        };

        return (
          <FilterBadge
            key={key}
            icon={icon}
            label={t(`contracts.status.${statusKeyMap[key]}`)}
            color={color}
            count={statusCounts[key as ContractStatusValue] || 0}
            active={selectedStatus === key}
            onClick={() =>
              setSelectedStatus(key === selectedStatus ? null : key)
            }
          />
        );
      })}
    </div>
  );
}
