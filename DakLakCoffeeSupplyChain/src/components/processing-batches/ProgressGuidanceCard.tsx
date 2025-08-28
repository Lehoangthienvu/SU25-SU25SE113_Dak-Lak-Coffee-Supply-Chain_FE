"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertTriangle, Info, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { StageFailureInfo } from "@/lib/helpers/evaluationHelpers";
import { ProcessingBatchProgress } from "@/lib/api/processingBatchProgress";

interface ProgressGuidanceCardProps {
  failureInfo: StageFailureInfo | null;
  latestProgress: ProcessingBatchProgress | null;
  batchStatus: string;
}

export default function ProgressGuidanceCard({
  failureInfo,
  latestProgress,
  batchStatus
}: ProgressGuidanceCardProps) {
  const { t } = useTranslation();
  const isRetryMode = batchStatus === "InProgress" && failureInfo;
  const isCurrentStageFailed = latestProgress?.stageId === failureInfo?.failedStageId;

  if (!failureInfo) {
    return null;
  }

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-800">
          <Info className="h-5 w-5" />
          {t('progressGuidanceCard.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Action guidance */}
        <div className="space-y-3">
          {isRetryMode && isCurrentStageFailed ? (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-medium text-orange-900 mb-1">
                    {t('progressGuidanceCard.needToRetry')}:
                  </h4>
                  <p className="text-sm text-orange-800">
                    {t('progressGuidanceCard.stageNotMet', { stageName: failureInfo.failedStageName })} 
                    {t('progressGuidanceCard.updateWithImprovements')}
                  </p>
                </div>
              </div>
            </div>
          ) : isRetryMode ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-medium text-green-900 mb-1">
                    {t('progressGuidanceCard.canContinue')}:
                  </h4>
                  <p className="text-sm text-green-800">
                    {t('progressGuidanceCard.stageImproved', { stageName: failureInfo.failedStageName })} 
                    {t('progressGuidanceCard.continueNextStep')}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-medium text-red-900 mb-1">
                    {t('progressGuidanceCard.needToHandle')}:
                  </h4>
                  <p className="text-sm text-red-800">
                    {t('progressGuidanceCard.stageNeedsRetry', { stageName: failureInfo.failedStageName })} 
                    {t('progressGuidanceCard.updateProgressForStage')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Next action button */}
          <div className="flex items-center gap-2 text-sm text-blue-700">
            <ArrowRight className="w-4 h-4" />
            <span>
              {isRetryMode && isCurrentStageFailed
                ? t('progressGuidanceCard.clickUpdateToRetry')
                : isRetryMode
                ? t('progressGuidanceCard.clickUpdateToContinue')
                : t('progressGuidanceCard.clickUpdateToRetryFailed')}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
