"use client";

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface FailedStagesInfoProps {
  failedStages: Array<{name: string, order: number}>;
}

export default function FailedStagesInfo({ failedStages }: FailedStagesInfoProps) {
  const { t } = useTranslation();

  if (!failedStages || failedStages.length === 0) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-4">
          <div className="flex items-center text-green-700">
            <CheckCircle className="w-5 h-5 mr-2" />
            <span>Không có giai đoạn nào cần cập nhật</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-yellow-200 bg-yellow-50">
      <CardHeader>
        <CardTitle className="text-lg text-yellow-800 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          {t('componentsprocessing.failedStagesInfo.title')}
        </CardTitle>
        <p className="text-sm text-yellow-700">
          {t('componentsprocessing.failedStagesInfo.description')}
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {failedStages.map((stage, index) => (
            <div key={index} className="flex items-center space-x-3 p-3 border border-yellow-300 rounded-lg bg-white">
              <div className="flex items-center justify-center w-6 h-6 bg-yellow-500 text-white rounded-full text-sm font-bold">
                {index + 1}
              </div>
              <div className="flex-1">
                <span className="font-medium text-gray-900">{stage.name}</span>
              </div>
              <Badge variant="outline" className="text-yellow-700 border-yellow-300">
                Cần cập nhật
              </Badge>
            </div>
          ))}
        </div>
        
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-600" />
            <span className="text-sm text-blue-800">
              {t('componentsprocessing.failedStagesInfo.retryInstructions')}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
