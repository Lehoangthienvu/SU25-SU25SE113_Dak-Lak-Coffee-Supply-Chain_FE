"use client";

import React from 'react';
import { AlertTriangle, Info, CheckCircle, RefreshCw } from 'lucide-react';
import { getStageFailureDisplayInfo, debugStageFailure } from '@/lib/helpers/evaluationHelpers';

interface EvaluationFailureInfoProps {
  evaluation: {
    evaluationResult: string;
    comments?: string;
    detailedFeedback?: string;
    recommendations?: string;
    evaluatedAt?: string;
    evaluatedBy?: string;
  };
  className?: string;
  // 🔧 CẢI THIỆN: Thêm thông tin về batch và progresses để kiểm tra trạng thái retry
  batch?: {
    batchCode: string;
    farmerName: string;
    progresses?: Array<{
      progressId: string;
      stageId: number; // ✅ Nhất quán với backend C# sử dụng int
      stageName: string;
      stepIndex: number;
      progressDate?: string;
      stageDescription?: string;
      updatedByName?: string;
    }>;
  };
}

export default function EvaluationFailureInfo({ evaluation, batch, className = '' }: EvaluationFailureInfoProps) {
  const failureInfo = evaluation.comments ? getStageFailureDisplayInfo(evaluation.comments) : null;
  
  // 🔧 CẢI THIỆN: Kiểm tra xem farmer đã cập nhật lại stage bị fail chưa
  const hasFarmerRetried = React.useMemo(() => {
    if (!failureInfo?.hasFailure || !batch?.progresses) return false;
    
         // Tìm các progress của stage bị fail (dựa trên OrderIndex)
     const failedStageProgresses = batch.progresses.filter(progress => {
       // Tìm stage có OrderIndex tương ứng với failedOrderIndex
       const stageOrderIndex = (batch.progresses || []).findIndex(p => p.stageName === progress.stageName) + 1;
       return stageOrderIndex === failureInfo.orderIndex;
     });
    
    // Kiểm tra xem có progress nào được tạo sau khi evaluation được đánh giá không
    if (evaluation.evaluatedAt && failedStageProgresses.length > 0) {
      const evaluationDate = new Date(evaluation.evaluatedAt);
      const hasRetryAfterEvaluation = failedStageProgresses.some(progress => {
        if (!progress.progressDate) return false;
        const progressDate = new Date(progress.progressDate);
        return progressDate > evaluationDate;
      });
      
      return hasRetryAfterEvaluation;
    }
    
    return false;
  }, [failureInfo, batch, evaluation.evaluatedAt]);
  
  // 🔧 CẢI THIỆN: Lấy thông tin về retry mới nhất
  const latestRetryInfo = React.useMemo(() => {
    if (!hasFarmerRetried || !batch?.progresses) return null;
    
         const failedStageProgresses = (batch.progresses || []).filter(progress => {
       const stageOrderIndex = (batch.progresses || []).findIndex(p => p.stageName === progress.stageName) + 1;
       return stageOrderIndex === failureInfo?.orderIndex;
     });
    
    // Tìm progress mới nhất sau evaluation
    if (evaluation.evaluatedAt) {
      const evaluationDate = new Date(evaluation.evaluatedAt);
      const retryProgresses = failedStageProgresses.filter(progress => {
        if (!progress.progressDate) return false;
        const progressDate = new Date(progress.progressDate);
        return progressDate > evaluationDate;
      });
      
      if (retryProgresses.length > 0) {
        const latestRetry = retryProgresses.sort((a, b) => 
          new Date(b.progressDate || '').getTime() - new Date(a.progressDate || '').getTime()
        )[0];
        
        return {
          progressDate: latestRetry.progressDate,
          updatedByName: latestRetry.updatedByName,
          stageDescription: latestRetry.stageDescription
        };
      }
    }
    
    return null;
  }, [hasFarmerRetried, batch, failureInfo, evaluation.evaluatedAt]);
  
  // Debug log
  React.useEffect(() => {
    if (evaluation.comments) {
      console.log("🔍 DEBUG: EvaluationFailureInfo received evaluation:", evaluation);
      debugStageFailure(evaluation.comments, 'EvaluationFailureInfo');
    }
  }, [evaluation]);

  // Nếu không phải FAIL hoặc không có thông tin failure
  if (evaluation.evaluationResult !== 'Fail' || !failureInfo?.hasFailure) {
    return (
      <div className={`bg-blue-50 border border-blue-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center gap-2 mb-3">
          <Info className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-blue-800">Thông tin đánh giá</h3>
        </div>
        
        <div className="space-y-2">
          <p className="text-blue-700">
            <strong>Kết quả:</strong> {evaluation.evaluationResult}
          </p>
          
          {evaluation.comments && (
            <p className="text-blue-700">
              <strong>Nhận xét:</strong> {evaluation.comments}
            </p>
          )}
          
          {evaluation.detailedFeedback && (
            <p className="text-blue-700">
              <strong>Phản hồi chi tiết:</strong> {evaluation.detailedFeedback}
            </p>
          )}
          
          {evaluation.recommendations && (
            <p className="text-blue-700">
              <strong>Khuyến nghị:</strong> {evaluation.recommendations}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Hiển thị thông tin failure
  return (
    <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
          <AlertTriangle className="w-5 h-5 text-red-600" />
        </div>
        <div>
          <h3 className="font-semibold text-red-900">Đánh giá không đạt</h3>
          <p className="text-sm text-red-700">
            Công đoạn: {failureInfo.stageName} (Bước {failureInfo.orderIndex})
          </p>
        </div>
      </div>

             {/* Status indicator */}
       <div className="mb-3">
         {hasFarmerRetried ? (
           <div className="flex items-center gap-2 text-green-700 bg-green-100 px-3 py-2 rounded-lg">
             <CheckCircle className="w-4 h-4" />
             <span className="text-sm font-medium">
               ✅ {batch?.farmerName || 'Nông dân'} đã cập nhật lại công đoạn này
             </span>
           </div>
         ) : (
           <div className="flex items-center gap-2 text-red-700 bg-red-100 px-3 py-2 rounded-lg">
             <RefreshCw className="w-4 h-4" />
             <span className="text-sm font-medium">
               Cần thực hiện lại công đoạn này
             </span>
           </div>
         )}
       </div>

      {/* Details */}
      <div className="space-y-3 mb-3">
        {failureInfo.details && (
          <div className="bg-white/50 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-red-900 mb-1">
                  Chi tiết vấn đề:
                </h4>
                <p className="text-sm text-red-800">
                  {failureInfo.details}
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

        {evaluation.detailedFeedback && (
          <div className="bg-white/50 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-blue-900 mb-1">
                  Phản hồi chi tiết:
                </h4>
                <p className="text-sm text-blue-800">
                  {evaluation.detailedFeedback}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 🔧 CẢI THIỆN: Hiển thị tiêu chí bị fail cụ thể */}
        {failureInfo.failedCriteria && failureInfo.failedCriteria.length > 0 && (
          <div className="bg-white/50 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="text-sm font-medium text-red-900 mb-2">
                  Tiêu chí không đạt:
                </h4>
                <div className="space-y-2">
                  {failureInfo.failedCriteria.map((criteria, idx) => (
                    <div key={idx} className="bg-red-50 border border-red-200 rounded-lg p-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-red-900">
                          {criteria.criteriaName}
                        </span>
                        <span className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded">
                          {criteria.criteriaId}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-red-800">
                        <div>
                          <span className="font-medium">Giá trị thực tế:</span>
                          <span className="ml-1">{criteria.actualValue} {criteria.unit}</span>
                        </div>
                        <div>
                          <span className="font-medium">Giá trị chuẩn:</span>
                          <span className="ml-1">{criteria.expectedValue}</span>
                        </div>
                      </div>
                      {criteria.failureReason && (
                        <div className="mt-1 text-xs text-red-700">
                          <span className="font-medium">Lý do:</span>
                          <span className="ml-1">{criteria.failureReason}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 🔧 CẢI THIỆN: Hiển thị lý do không đạt được chọn */}
        {failureInfo.selectedFailureReasons && failureInfo.selectedFailureReasons.length > 0 && (
          <div className="bg-white/50 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-orange-900 mb-1">
                  Lý do không đạt được chọn:
                </h4>
                <div className="space-y-1">
                  {failureInfo.selectedFailureReasons.map((reason, idx) => (
                    <div key={idx} className="text-sm text-orange-800 bg-orange-50 px-2 py-1 rounded">
                      • {reason}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
       </div>

       {/* 🔧 CẢI THIỆN: Hiển thị thông tin về retry của farmer */}
       {hasFarmerRetried && latestRetryInfo && (
         <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
           <div className="flex items-start gap-2">
             <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
             <div>
               <h4 className="text-sm font-medium text-green-900 mb-1">
                 Thông tin cập nhật lại:
               </h4>
               <div className="space-y-1 text-sm text-green-800">
                 <p><strong>Ngày cập nhật:</strong> {latestRetryInfo.progressDate ? new Date(latestRetryInfo.progressDate).toLocaleDateString('vi-VN') : 'N/A'}</p>
                 <p><strong>Cập nhật bởi:</strong> {latestRetryInfo.updatedByName || batch?.farmerName || 'Nông dân'}</p>
                 {latestRetryInfo.stageDescription && (
                   <p><strong>Mô tả:</strong> {latestRetryInfo.stageDescription}</p>
                 )}
               </div>
             </div>
           </div>
         </div>
       )}

       {/* Action guidance */}
       <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
                         <h4 className="text-sm font-medium text-blue-900 mb-1">
               Hướng dẫn tiếp theo:
             </h4>
             <p className="text-sm text-blue-800">
               {hasFarmerRetried 
                 ? `Nông dân đã cập nhật lại công đoạn <strong>${failureInfo.stageName}</strong>. Bạn có thể đánh giá lại để kiểm tra chất lượng cải thiện.`
                 : `Hãy cập nhật tiến trình cho công đoạn <strong>${failureInfo.stageName}</strong> với những cải thiện theo khuyến nghị của chuyên gia.`
               }
             </p>
          </div>
        </div>
      </div>

      {/* Debug info */}
      <div className="mt-3 p-2 bg-gray-50 border border-gray-200 rounded text-xs text-gray-600">
        <strong>Debug:</strong> OrderIndex: {failureInfo.orderIndex}, StageId: {failureInfo.stageId || 'N/A'}, 
        Raw Comments: {evaluation.comments?.substring(0, 100)}...
      </div>
    </div>
  );
}
