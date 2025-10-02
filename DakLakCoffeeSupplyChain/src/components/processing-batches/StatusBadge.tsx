"use client";
import { getProcessingStatusDisplay } from "@/lib/utils/processingStatus";

interface StatusBadgeProps {
  status: number | string | null | undefined;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const { label, classes, icon: Icon } = getProcessingStatusDisplay(status);

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold ${classes}`}>
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}
