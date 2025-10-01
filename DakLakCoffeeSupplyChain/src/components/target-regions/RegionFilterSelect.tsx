import React from "react";

type Props = {
  selectedRegions: string[];
  setSelectedRegions: (regions: string[]) => void;
  t: (key: string) => string;
  options: { value: string; label: string }[];
};

const RegionFilterSelect: React.FC<Props> = ({
  selectedRegions,
  setSelectedRegions,
  t,
  options,
}) => {
  const handleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value.trim();

    if (selected && !selectedRegions.includes(selected)) {
      const updated = [...selectedRegions.filter((r) => r !== ""), selected];
      setSelectedRegions(updated);
      e.target.value = "";
    }
  };

  const removeTag = (tag: string) => {
    const updated = selectedRegions.filter((r) => r !== tag);
    setSelectedRegions(updated);
  };

  return (
    <div>
      <select
        onChange={handleSelect}
        className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:border-orange-500 focus:ring-orange-500 cursor-pointer"
        defaultValue=""
      >
        <option value="" disabled>
          {t("marketplace.components.filterSection.region.allRegions")}
        </option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Badge hiển thị */}
      <div className="flex flex-wrap gap-2 mt-2">
        {selectedRegions
          .filter((r) => r && r.trim() !== "")
          .map((region, i) => (
            <span
              key={i}
              className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-xs flex items-center gap-1"
            >
              {region}
              <button
                type="button"
                onClick={() => removeTag(region)}
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

export default RegionFilterSelect;
