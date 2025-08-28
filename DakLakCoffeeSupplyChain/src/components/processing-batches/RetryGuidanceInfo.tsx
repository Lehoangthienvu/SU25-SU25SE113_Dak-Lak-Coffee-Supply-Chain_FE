"use client";

import React from 'react';
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getStageFailureDisplayInfo } from '@/lib/helpers/evaluationHelpers';

interface RetryGuidanceInfoProps {
  evaluation: {
    evaluationResult: string;
    comments?: string;
    evaluatedAt?: string;
  };
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

export default function RetryGuidanceInfo({ evaluation, batch }: RetryGuidanceInfoProps) {
  const { t } = useTranslation();
  const failureInfo = evaluation.comments ? getStageFailureDisplayInfo(evaluation.comments) : null;
  
  // Kiểm tra xem có phải FAIL không
  if (evaluation.evaluationResult !== 'Fail' || !failureInfo?.hasFailure) {
    return null;
  }
  
  // Lấy thông tin về các stage đã hoàn thành sau stage bị fail
  const stagesAfterFailure = React.useMemo(() => {
    if (!batch?.progresses || !failureInfo.orderIndex) return [];
    
    const progresses = batch.progresses;
    const failedStageOrderIndex = failureInfo.orderIndex;
    
    // Tìm các progress có OrderIndex > failedOrderIndex
    const stagesAfterFailure = progresses.filter(progress => {
      const stageOrderIndex = progresses.findIndex(p => p.stageName === progress.stageName) + 1;
      return stageOrderIndex > failedStageOrderIndex;
    });
    
    return stagesAfterFailure;
  }, [batch, failureInfo]);
  
  // Kiểm tra xem có stage nào đã hoàn thành sau stage bị fail không
  const hasCompletedStagesAfterFailure = stagesAfterFailure.length > 0;
  
  // Lấy thông tin về stage bị fail
  const failedStageInfo = React.useMemo(() => {
    if (!batch?.progresses || !failureInfo.orderIndex) return null;
    
    const progresses = batch.progresses;
    const failedStageOrderIndex = failureInfo.orderIndex;
    
    // Tìm progress của stage bị fail
    const failedStageProgress = progresses.find(progress => {
      const stageOrderIndex = progresses.findIndex(p => p.stageName === progress.stageName) + 1;
      return stageOrderIndex === failedStageOrderIndex;
    });
    
    return failedStageProgress;
  }, [batch, failureInfo]);

  if (!evaluation.comments) return null;

  const hasFailure = evaluation.comments.includes('STAGE') && evaluation.comments.includes('không đạt');
  const hasFarmerRetried = evaluation.comments.includes('đã cập nhật lại');

  if (!hasFailure) return null;
  
  return (
    <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="h-5 w-5 text-yellow-600" />
        <h3 className="font-semibold text-yellow-800">{t('retryGuidanceInfo.title')}</h3>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-start gap-2">
          <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-yellow-700">
            <p className="font-medium">{t('retryGuidanceInfo.currentStatus')}</p>
            <p>{t('retryGuidanceInfo.evaluationFailed')}</p>
          </div>
        </div>

        {hasFarmerRetried ? (
          <div className="flex items-start gap-2">
            <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-green-700">
              <p className="font-medium">{t('retryGuidanceInfo.farmerUpdated')}</p>
              <p>{t('retryGuidanceInfo.waitingForReEvaluation')}</p>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-orange-700">
              <p className="font-medium">{t('retryGuidanceInfo.actionRequired')}</p>
              <p>{t('retryGuidanceInfo.improveAndRetry')}</p>
            </div>
          </div>
        )}

        <div className="mt-4 p-3 bg-white rounded border border-yellow-200">
          <h4 className="font-medium text-yellow-800 mb-2">{t('retryGuidanceInfo.nextSteps')}</h4>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• {t('retryGuidanceInfo.step1')}</li>
            <li>• {t('retryGuidanceInfo.step2')}</li>
            <li>• {t('retryGuidanceInfo.step3')}</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
