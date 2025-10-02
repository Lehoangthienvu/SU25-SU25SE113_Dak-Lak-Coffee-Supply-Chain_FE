import { LucideIcon, Clock4, Loader2, CheckCircle, ClipboardList, XCircle } from "lucide-react";

export enum ProcessingStatus {
  NotStarted = "NotStarted",
  InProgress = "InProgress",
  Completed = "Completed",
  AwaitingEvaluation = "AwaitingEvaluation",
  Cancelled = "Cancelled",
}

export interface ProcessingStatusInfo {
  label: string;
  icon: LucideIcon;
  bgClass: string;
  textClass: string;
}

export const ProcessingStatusMap: Record<ProcessingStatus, ProcessingStatusInfo> = {
  [ProcessingStatus.NotStarted]: {
    label: "Chưa bắt đầu",
    icon: Clock4,
    bgClass: "bg-amber-100",
    textClass: "text-amber-800",
  },
  [ProcessingStatus.InProgress]: {
    label: "Đang xử lý",
    icon: Loader2,
    bgClass: "bg-blue-100",
    textClass: "text-blue-800",
  },
  [ProcessingStatus.Completed]: {
    label: "Hoàn thành",
    icon: CheckCircle,
    bgClass: "bg-emerald-100",
    textClass: "text-emerald-800",
  },
  [ProcessingStatus.AwaitingEvaluation]: {
    label: "Chờ đánh giá",
    icon: ClipboardList,
    bgClass: "bg-orange-100",
    textClass: "text-orange-800",
  },
  [ProcessingStatus.Cancelled]: {
    label: "Đã hủy",
    icon: XCircle,
    bgClass: "bg-red-100",
    textClass: "text-red-800",
  },
};
