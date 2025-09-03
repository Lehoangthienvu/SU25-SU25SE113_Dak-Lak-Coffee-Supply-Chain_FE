"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Edit } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import FailedStageUpdateButton from './FailedStageUpdateButton';

interface FailedStage {
  name: string;
  order: number;
}

interface FailedStagesListProps {
  failedStages: FailedStage[];
  batchId: string;
  onUpdateStage: (stageName: string, stageOrder: number) => void;
}

export default function FailedStagesList({
  failedStages,
  batchId,
  onUpdateStage
}: FailedStagesListProps) {
  const { t } = useTranslation();

  if (!failedStages || failedStages.length === 0) {
    return null;
  }

  return (
    <Card className="border-red-200 bg-red-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-800">
          <AlertTriangle className="h-5 w-5" />
          {t('componentsprocessing.failedStagesList.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-red-700 mb-4">
          {t('componentsprocessing.failedStagesList.description')}
        </p>
        
        <div className="space-y-3">
          {failedStages.map((stage, index) => (
            <div key={index} className="flex items-center space-x-3 p-3 border border-red-300 rounded-lg bg-white">
              <div className="flex items-center justify-center w-6 h-6 bg-red-500 text-white rounded-full text-xs font-bold">
                {index + 1}
              </div>
              <span className="font-medium text-gray-900 flex-1">
                {stage.name} (Thứ tự: {stage.order})
              </span>
              <button
                onClick={() => onUpdateStage(stage.name, stage.order)}
                className="px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-white rounded-md text-sm flex items-center gap-1 transition-colors"
              >
                <Edit className="w-3 h-3" />
                                 {t('componentsprocessing.failedStagesList.retryButton')}
              </button>
            </div>
          ))}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs">i</span>
            </div>
            <span className="text-sm text-blue-800">
                             {t('componentsprocessing.failedStagesList.infoMessage')}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
