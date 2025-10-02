import { ProcessingStatus, ProcessingStatusMap } from "@/lib/constants/batchStatus";
import { AlertTriangle } from "lucide-react";

export const processingStatusList: ProcessingStatus[] = [
  ProcessingStatus.NotStarted,
  ProcessingStatus.InProgress,
  ProcessingStatus.Completed,
  ProcessingStatus.AwaitingEvaluation,
  ProcessingStatus.Cancelled,
];

export function normalizeProcessingStatus(value: unknown): ProcessingStatus | null {
  if (value === null || value === undefined) return null;

  if (typeof value === "number") {
    switch (value) {
      case 0:
        return ProcessingStatus.NotStarted;
      case 1:
        return ProcessingStatus.InProgress;
      case 2:
        return ProcessingStatus.Completed;
      case 3:
        return ProcessingStatus.AwaitingEvaluation;
      case 4:
        return ProcessingStatus.Cancelled;
      default:
        return null;
    }
  }

  const text = String(value)
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (["notstarted", "chua bat dau", "0", "pending"].includes(text)) {
    return ProcessingStatus.NotStarted;
  }

  if (["inprogress", "dang xu ly", "processing", "1"].includes(text)) {
    return ProcessingStatus.InProgress;
  }

  if (["completed", "hoan thanh", "2"].includes(text)) {
    return ProcessingStatus.Completed;
  }

  if (["awaitingevaluation", "cho danh gia", "3"].includes(text)) {
    return ProcessingStatus.AwaitingEvaluation;
  }

  if (["cancelled", "da huy", "4"].includes(text)) {
    return ProcessingStatus.Cancelled;
  }

  return null;
}

export function getProcessingStatusDisplay(value: unknown) {
  const normalized = normalizeProcessingStatus(value);

  if (!normalized) {
    return {
      label: "Không xác định",
      classes: "bg-slate-100 text-slate-700 border border-slate-200",
      icon: AlertTriangle,
    };
  }

  const info = ProcessingStatusMap[normalized];
  return {
    label: info.label,
    classes: `${info.bgClass} ${info.textClass} border`,
    icon: info.icon,
  };
}
