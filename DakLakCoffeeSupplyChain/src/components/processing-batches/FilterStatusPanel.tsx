"use client";
import React from "react";
import { useTranslation } from "react-i18next";
import { PackageSearch } from "lucide-react";
import FilterBadge from "./FilterBadge";
import {
  ProcessingStatusMap,
  ProcessingStatus,
} from "@/lib/constants/batchStatus";

interface FilterStatusPanelProps {
  selectedStatus: number | null;
  setSelectedStatus: (value: number | null) => void;
  statusCounts: Record<number, number>;
}

export default function FilterStatusPanel({
  selectedStatus,
  setSelectedStatus,
  statusCounts,
}: FilterStatusPanelProps) {
  const { t } = useTranslation();
  
  return (
    <div className="bg-white rounded-xl shadow-sm p-4 space-y-3">
      <h2 className="text-sm font-medium text-gray-700">{t('processing.pages.batches.filterTitle')}</h2>

      <FilterBadge
        label={t('processing.pages.batches.allStatuses')}
        value={Object.values(statusCounts).reduce((sum, val) => sum + val, 0).toString()}
        onRemove={() => setSelectedStatus(null)}
      />

      {Object.entries(ProcessingStatusMap).map(([keyStr, info]) => {
        const key = parseInt(keyStr, 10);
        return (
          <FilterBadge
            key={key}
            label={info.label}
            value={(statusCounts[key] || 0).toString()}
            onRemove={() => setSelectedStatus(selectedStatus === key ? null : key)}
          />
        );
      })}
    </div>
  );
}
