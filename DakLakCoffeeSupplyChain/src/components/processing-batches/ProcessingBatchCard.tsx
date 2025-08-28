import React from "react";
import { useTranslation } from "react-i18next";
import { ProcessingBatch } from "@/lib/api/processingBatches";
import StatusBadge from "./StatusBadge";

export default function ProcessingBatchCard({
  batch,
  onViewDetail,
}: {
  batch: ProcessingBatch;
  onViewDetail?: (id: string) => void;
}) {
  const { t } = useTranslation();
  
  return (
    <tr className="border-t hover:bg-gray-50 transition">
      <td className="px-4 py-3 font-medium text-gray-900">{batch.batchCode}</td>
      <td className="px-4 py-3">{batch.cropSeasonName}</td>
      <td className="px-4 py-3">{batch.methodName}</td>
      <td className="px-4 py-3">
        <StatusBadge status={batch.status} />
      </td>
      <td className="px-4 py-3">
        {new Date(batch.createdAt).toLocaleDateString("vi-VN")}
      </td>
      <td className="px-4 py-3 text-center">
        <button
          onClick={() => onViewDetail?.(batch.batchId)}
          className="text-[#FD7622] hover:underline text-sm"
        >
          {t('processing.actions.view')}
        </button>
      </td>
    </tr>
  );
}
