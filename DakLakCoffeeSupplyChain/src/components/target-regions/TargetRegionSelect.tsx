import React from "react";
import { ProcurementPlanDetailFormData } from "../procurement-plan/ProcurementPlanForm";
import { ProcurementPlansDetails } from "@/lib/api/procurementPlans";

type Props = {
  index: number;
  detail: ProcurementPlanDetailFormData | ProcurementPlansDetails;
  handleDetailChange: (
    index: number,
    field: string,
    value: string[]
  ) => void;
  t: (key: string) => string;
  options: { value: string; label: string }[];
};

const TargetRegionSelect: React.FC<Props> = ({
  index,
  detail,
  handleDetailChange,
  t,
  options,
}) => {
  const handleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
  const selected = e.target.value.trim();

  if (selected === "__ALL__") {
    // chọn toàn bộ → clear hết badge và giữ select ở ALL
    handleDetailChange(index, "targetRegions", ["all"]);
    // không reset lại select
  } else if (selected && !detail.targetRegions.includes(selected)) {
    // Nếu trước đó là All thì bỏ nó ra
    const updated = detail.targetRegions.includes("all")
      ? [selected]
      : [...detail.targetRegions.filter((t: string) => t !== ""), selected];

    handleDetailChange(index, "targetRegions", updated);

    // chỉ reset khi không phải ALL
    e.target.value = "";
  }
};


  const removeTag = (tag: string) => {
    const updated = detail.targetRegions.filter((t: string) => t !== tag);
    handleDetailChange(index, "targetRegions", updated);
  };

  return (
    <div>
      <select
        id={`targetRegion-${index}`}
        onChange={handleSelect}
        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 cursor-pointer focus:border-orange-500 focus:ring-orange-500"
        defaultValue=""
      >
        <option value="" disabled>
          {t(
            "procurementPlan.components.procurementPlanForm.fields.targetRegion.placeholder"
          )}
        </option>
        <option value="__ALL__">
          {t(
            "procurementPlan.components.procurementPlanForm.fields.targetRegion.all"
          )}
        </option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Badge hiển thị (bỏ rỗng, bỏ __ALL__) */}
      <div className="flex flex-wrap gap-2 mt-2">
        {detail.targetRegions
          .filter((tag: string) => tag && tag.trim() !== "" && tag !== "__ALL__")
          .map((tag: string, i: number) => (
            <span
              key={i}
              className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-sm flex items-center gap-1"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="ml-1 text-red-500 hover:text-red-700 cursor-pointer"
              >
                ×
              </button>
            </span>
          ))}
      </div>
    </div>
  );
};

export default TargetRegionSelect;
