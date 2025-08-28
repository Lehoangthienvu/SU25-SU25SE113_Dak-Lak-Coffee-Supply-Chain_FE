"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { StageFailureInfo } from "@/lib/helpers/evaluationHelpers";

interface FailureInfoCardProps {
  failureInfo: StageFailureInfo | null;
  className?: string;
}

export default function FailureInfoCard({ failureInfo, className = '' }: FailureInfoCardProps) {
  const { t } = useTranslation();

  if (!failureInfo) {
    return null;
  }

  return (
    <Card className={`border-red-200 bg-red-50 ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-800">
          <AlertTriangle className="h-5 w-5" />
          {t('failureInfoCard.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stage information */}
        <div className="bg-white rounded-lg p-3 border border-red-200">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-red-900">
              {t('failureInfoCard.stageInfo')}
            </h4>
            <Badge variant="destructive" className="text-xs">
              {t('failureInfoCard.failed')}
            </Badge>
          </div>
          <div className="space-y-1 text-sm text-red-800">
            <p>
              <span className="font-medium">{t('failureInfoCard.stage')}:</span> {failureInfo.failedStageName}
            </p>
            <p>
              <span className="font-medium">{t('failureInfoCard.step')}:</span> {failureInfo.failedOrderIndex}
            </p>
          </div>
        </div>

        {/* Failure details */}
        {failureInfo.failureDetails && (
          <div className="bg-white rounded-lg p-3 border border-red-200">
            <h4 className="text-sm font-medium text-red-900 mb-2">
              {t('failureInfoCard.failureDetails')}
            </h4>
            <p className="text-sm text-red-800">
              {failureInfo.failureDetails}
            </p>
          </div>
        )}

        {/* Recommendations */}
        {failureInfo.recommendations && (
          <div className="bg-white rounded-lg p-3 border border-red-200">
            <h4 className="text-sm font-medium text-red-900 mb-2">
              {t('failureInfoCard.recommendations')}
            </h4>
            <p className="text-sm text-red-800">
              {failureInfo.recommendations}
            </p>
          </div>
        )}

        {/* Action required */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-blue-900 mb-1">
                {t('failureInfoCard.actionRequired')}
              </h4>
              <p className="text-sm text-blue-800">
                {t('failureInfoCard.improvementGuidance')}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
