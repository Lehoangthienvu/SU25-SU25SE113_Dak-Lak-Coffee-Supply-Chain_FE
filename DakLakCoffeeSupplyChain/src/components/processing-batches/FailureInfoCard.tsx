"use client";

import { AlertTriangle, RefreshCw, Info, CheckCircle } from "lucide-react";
import { StageFailureInfo } from "@/lib/helpers/evaluationHelpers";

interface FailureInfoCardProps {
  failureInfo: StageFailureInfo;
  currentStageId?: number; // ✅ Nhất quán với backend C# sử dụng int
  currentStageName?: string;
  isRetryMode?: boolean;
}

export default function FailureInfoCard({
  failureInfo,
  currentStageId,
  currentStageName,
  isRetryMode = false
}: FailureInfoCardProps) {
  const isCurrentStageFailed = currentStageId === failureInfo.failedStageId;

  return (
    <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-lg p-4 mb-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
          <AlertTriangle className="w-5 h-5 text-red-600" />
        </div>
        <div>
          <h3 className="font-semibold text-red-900">
            {isRetryMode ? "Cần thực hiện lại" : "Đánh giá không đạt"}
          </h3>
          <p className="text-sm text-red-700">
            Công đoạn: {failureInfo.failedStageName}
          </p>
        </div>
      </div>

      {/* Status indicator */}
      <div className="mb-3">
        {isRetryMode && isCurrentStageFailed ? (
          <div className="flex items-center gap-2 text-orange-700 bg-orange-100 px-3 py-2 rounded-lg">
            <RefreshCw className="w-4 h-4" />
            <span className="text-sm font-medium">
              Đang thực hiện lại công đoạn này
            </span>
          </div>
        ) : isRetryMode ? (
          <div className="flex items-center gap-2 text-green-700 bg-green-100 px-3 py-2 rounded-lg">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm font-medium">
              Có thể tiếp tục bước tiếp theo
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-red-700 bg-red-100 px-3 py-2 rounded-lg">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm font-medium">
              Cần thực hiện lại công đoạn này
            </span>
          </div>
        )}
      </div>

      {/* Details */}
      <div className="space-y-2 mb-3">
        {failureInfo.failureDetails && (
          <div className="bg-white/50 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-red-900 mb-1">
                  Chi tiết vấn đề:
                </h4>
                <p className="text-sm text-red-800">
                  {failureInfo.failureDetails}
                </p>
              </div>
            </div>
          </div>
        )}

        {failureInfo.recommendations && (
          <div className="bg-white/50 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-green-900 mb-1">
                  Khuyến nghị cải thiện:
                </h4>
                <p className="text-sm text-green-800">
                  {failureInfo.recommendations}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action guidance */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-medium text-blue-900 mb-1">
              Hướng dẫn tiếp theo:
            </h4>
            <p className="text-sm text-blue-800">
              {isRetryMode && isCurrentStageFailed
                ? "Hãy cập nhật tiến trình cho công đoạn này với những cải thiện theo khuyến nghị."
                : isRetryMode
                ? "Bạn có thể tiếp tục với bước tiếp theo trong quy trình."
                : "Hãy cập nhật tiến trình cho công đoạn bị lỗi với những cải thiện cần thiết."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
