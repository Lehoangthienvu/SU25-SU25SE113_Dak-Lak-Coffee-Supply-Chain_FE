"use client";

import React from 'react';
import { AlertTriangle, Info, CheckCircle, RefreshCw } from 'lucide-react';
import { getStageFailureDisplayInfo, debugStageFailure } from '@/lib/helpers/evaluationHelpers';
import { useTranslation } from 'react-i18next';

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
      updatedByName?: string;
    }>;
  };
}

export default function EvaluationFailureInfo({ evaluation, batch, className = '' }: EvaluationFailureInfoProps) {
  const { t } = useTranslation();
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

        };
      }
    }
    
    return null;
  }, [hasFarmerRetried, batch, failureInfo, evaluation.evaluatedAt]);
  
  // Debug log
  React.useEffect(() => {
    if (evaluation.comments) {
      
      debugStageFailure(evaluation.comments, 'EvaluationFailureInfo');
    }
  }, [evaluation]);

  // Nếu không phải FAIL hoặc không có thông tin failure
  if (evaluation.evaluationResult !== 'Fail' || !failureInfo?.hasFailure) {
    return (
      <div className={`bg-blue-50 border border-blue-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center gap-2 mb-3">
          <Info className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-blue-800">{t('evaluationFailureInfo.evaluationInfo')}</h3>
        </div>
        
        <div className="space-y-2">
          <p className="text-blue-700">
            <strong>{t('evaluationFailureInfo.result')}:</strong> {evaluation.evaluationResult}
          </p>
          
          {evaluation.comments && (
            <p className="text-blue-700">
              <strong>{t('evaluationFailureInfo.comments')}:</strong> {evaluation.comments}
            </p>
          )}
          
          {evaluation.detailedFeedback && (
            <p className="text-blue-700">
              <strong>{t('evaluationFailureInfo.detailedFeedback')}:</strong> {evaluation.detailedFeedback}
            </p>
          )}
          
          {evaluation.recommendations && (
            <p className="text-blue-700">
              <strong>{t('evaluationFailureInfo.recommendations')}:</strong> {evaluation.recommendations}
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
          <h3 className="font-semibold text-red-900">{t('evaluationFailureInfo.failedEvaluation')}</h3>
          <p className="text-sm text-red-700">
            {t('evaluationFailureInfo.stage')}: {failureInfo.stageName} ({t('evaluationFailureInfo.step')} {failureInfo.orderIndex})
          </p>
        </div>
      </div>

             {/* Status indicator */}
       <div className="mb-3">
         {hasFarmerRetried ? (
           <div className="flex items-center gap-2 text-green-700 bg-green-100 px-3 py-2 rounded-lg">
             <CheckCircle className="w-4 h-4" />
             <span className="text-sm font-medium">
               ✅ {batch?.farmerName || t('evaluationFailureInfo.farmer')} {t('evaluationFailureInfo.hasUpdatedStage')}
             </span>
           </div>
         ) : (
           <div className="flex items-center gap-2 text-red-700 bg-red-100 px-3 py-2 rounded-lg">
             <RefreshCw className="w-4 h-4" />
             <span className="text-sm font-medium">
               {t('evaluationFailureInfo.needToRetryStage')}
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
                  {t('evaluationFailureInfo.problemDetails')}:
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
                  {t('evaluationFailureInfo.improvementRecommendations')}:
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
                  {t('evaluationFailureInfo.detailedFeedback')}:
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
                  {t('evaluationFailureInfo.failedCriteria')}:
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
                          <span className="font-medium">{t('evaluationFailureInfo.actualValue')}:</span>
                          <span className="ml-1">{criteria.actualValue} {criteria.unit}</span>
                        </div>
                        <div>
                          <span className="font-medium">{t('evaluationFailureInfo.expectedValue')}:</span>
                          <span className="ml-1">{criteria.expectedValue}</span>
                        </div>
                      </div>
                      {criteria.failureReason && (
                        <div className="mt-1 text-xs text-red-700">
                          <span className="font-medium">{t('evaluationFailureInfo.reason')}:</span>
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
                  {t('evaluationFailureInfo.selectedFailureReasons')}:
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
                 {t('evaluationFailureInfo.retryInfo')}:
               </h4>
               <div className="space-y-1 text-sm text-green-800">
                 <p><strong>{t('evaluationFailureInfo.updateDate')}:</strong> {latestRetryInfo.progressDate ? new Date(latestRetryInfo.progressDate).toLocaleDateString('vi-VN') : 'N/A'}</p>
                 <p><strong>{t('evaluationFailureInfo.updatedBy')}:</strong> {latestRetryInfo.updatedByName || batch?.farmerName || t('evaluationFailureInfo.farmer')}</p>
                 
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
               {t('evaluationFailureInfo.nextSteps')}:
             </h4>
             <p className="text-sm text-blue-800">
               {hasFarmerRetried 
                 ? t('evaluationFailureInfo.farmerHasUpdated', { stageName: failureInfo.stageName })
                 : t('evaluationFailureInfo.updateProgressWithImprovements', { stageName: failureInfo.stageName })
               }
             </p>
          </div>
        </div>
      </div>

      {/* Debug info */}
      <div className="mt-3 p-2 bg-gray-50 border border-gray-200 rounded text-xs text-gray-600">
        <strong>Debug:</strong> {t('evaluationFailureInfo.debug.orderIndex')}: {failureInfo.orderIndex}, {t('evaluationFailureInfo.debug.stageId')}: {failureInfo.stageId || 'N/A'}, 
        {t('evaluationFailureInfo.debug.rawComments')}: {evaluation.comments?.substring(0, 100)}...
      </div>
    </div>
  );
}
