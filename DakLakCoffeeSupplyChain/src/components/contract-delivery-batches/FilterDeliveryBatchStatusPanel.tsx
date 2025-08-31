import { ContractDeliveryBatchStatus, getDeliveryBatchDisplayMap } from "@/lib/constants/contractDeliveryBatchStatus";
import FilterBadge from "../crop-seasons/FilterBadge";
import { useTranslation } from "react-i18next";

interface Props {
  selectedStatus: ContractDeliveryBatchStatus | "ALL";
  setSelectedStatus: (value: ContractDeliveryBatchStatus | "ALL") => void;
  statusCounts: Record<string, number>;
  displayMap?: Record<string, any>;
}

export default function FilterDeliveryBatchStatusPanel({
  selectedStatus,
  setSelectedStatus,
  statusCounts,
  displayMap,
}: Props) {
  const { t } = useTranslation();
  
  // Sử dụng function mới để lấy display map theo ngôn ngữ
  const i18nDisplayMap = getDeliveryBatchDisplayMap(t);
  const currentDisplayMap = displayMap || i18nDisplayMap;
  
  return (
    <div className="bg-white rounded-xl shadow-sm p-4 space-y-3">
      <h2 className="text-sm font-medium text-gray-700">{t("contractDeliveryBatches.filterPanel.title")}</h2>

      {/* Tất cả */}
      <FilterBadge
        icon={currentDisplayMap["ALL"].icon}
        label={currentDisplayMap["ALL"].label}
        color="orange"
        count={
          currentDisplayMap["ALL"].count ||
          Object.values(statusCounts).reduce((sum, val) => sum + val, 0)
        }
        active={selectedStatus === "ALL"}
        onClick={() => setSelectedStatus("ALL")}
      />

      {/* Các trạng thái cụ thể */}
      {Object.entries(currentDisplayMap).map(
        ([key, { label, color, icon }]) => {
          if (key === "ALL") return null;
          const count = statusCounts[key] || 0;

          return (
            <FilterBadge
              key={key}
              icon={icon}
              label={label}
              color={color}
              count={count}
              active={selectedStatus === key}
              onClick={() =>
                setSelectedStatus(key as ContractDeliveryBatchStatus)
              }
            />
          );
        }
      )}
    </div>
  );
}
