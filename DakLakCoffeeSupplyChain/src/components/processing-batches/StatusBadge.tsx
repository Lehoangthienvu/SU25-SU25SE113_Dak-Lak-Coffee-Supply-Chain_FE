"use client";
import React from "react";
import { useTranslation } from "react-i18next";
import {
  ProcessingStatusMap,
  ProcessingStatus,
} from "@/lib/constants/batchStatus";

interface StatusBadgeProps {
  status: number | string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const { t } = useTranslation();
  
  // Xử lý status có thể là string hoặc number
  let statusString: string;
  if (typeof status === 'number') {
    // Nếu là number, chuyển đổi theo mapping
    switch (status) {
      case 0: statusString = ProcessingStatus.NotStarted; break;
      case 1: statusString = ProcessingStatus.InProgress; break;
      case 2: statusString = ProcessingStatus.Completed; break;
      case 3: statusString = ProcessingStatus.AwaitingEvaluation; break;
      case 4: statusString = ProcessingStatus.Cancelled; break;
      default: statusString = status.toString();
    }
  } else {
    statusString = status;
  }
  
  
  
  // Kiểm tra xem status có trong enum không
  const isValidStatus = Object.values(ProcessingStatus).includes(statusString as ProcessingStatus);
  

  
  if (!isValidStatus) {
    return (
      <span className="px-2 py-1 rounded text-xs font-semibold bg-gray-100 text-gray-700">
        {t('componentsprocessing.statusBadge.inProgress')} ({statusString})
      </span>
    );
  }

  const info = ProcessingStatusMap[statusString as ProcessingStatus];



  const Icon = info.icon;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold ${info.bgClass} ${info.textClass}`}
    >
      <Icon className="w-4 h-4" />
      {info.label}
    </span>
  );
};

export default StatusBadge;
