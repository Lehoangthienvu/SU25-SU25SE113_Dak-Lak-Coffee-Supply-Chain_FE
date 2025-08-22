import { ContractDeliveryBatchStatus } from "@/lib/constants/contractDeliveryBatchStatus";
import { deliveryBatchDisplayMap } from "@/lib/constants/contractDeliveryBatchStatus";
import FilterBadge from "../crop-seasons/FilterBadge";

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
  return (
    <div className="bg-white rounded-xl shadow-sm p-4 space-y-3">
      <h2 className="text-sm font-medium text-gray-700">Lọc theo trạng thái</h2>

      {/* Tất cả */}
      <FilterBadge
        icon={(displayMap || deliveryBatchDisplayMap)["ALL"].icon}
        label={(displayMap || deliveryBatchDisplayMap)["ALL"].label}
        color="orange"
        count={
          (displayMap || deliveryBatchDisplayMap)["ALL"].count ||
          Object.values(statusCounts).reduce((sum, val) => sum + val, 0)
        }
        active={selectedStatus === "ALL"}
        onClick={() => setSelectedStatus("ALL")}
      />

      {/* Các trạng thái cụ thể */}
      {Object.entries(displayMap || deliveryBatchDisplayMap).map(
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
