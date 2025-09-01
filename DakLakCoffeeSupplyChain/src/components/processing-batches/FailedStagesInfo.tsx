"use client";

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Info, CheckCircle } from 'lucide-react';
import { getFailedStagesForBatch, type FailedStagesInfo } from '@/lib/api/processingBatchEvaluations';

interface FailedStagesInfoProps {
  batchId: string;
}

export default function FailedStagesInfo({ batchId }: FailedStagesInfoProps) {
  const { t } = useTranslation();
  const [failedStagesInfo, setFailedStagesInfo] = useState<FailedStagesInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadFailedStagesInfo();
  }, [batchId]);

  const loadFailedStagesInfo = async () => {
    try {
      setLoading(true);
      setError(null);
      const info = await getFailedStagesForBatch(batchId);
      setFailedStagesInfo(info);
    } catch (err: any) {
      console.error('❌ Lỗi loadFailedStagesInfo:', err);
      setError(err.message || t('evaluation.error.loadingFailedStages'));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-600"></div>
            <span className="ml-2 text-yellow-700">{t('evaluation.failedStages.loading')}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-4">
          <div className="flex items-center text-red-700">
            <AlertTriangle className="w-5 h-5 mr-2" />
            <span>{error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!failedStagesInfo || !failedStagesInfo.failedStages || failedStagesInfo.failedStages.length === 0) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-4">
          <div className="flex items-center text-green-700">
            <CheckCircle className="w-5 h-5 mr-2" />
            <span>{t('evaluation.failedStages.noFailedStages')}</span>
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
          {t('evaluation.failedStages.title')}
        </CardTitle>
        <p className="text-sm text-yellow-700">
          {t('evaluation.failedStages.description')}
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {failedStagesInfo.failedStages.map((stage, index) => (
            <div key={index} className="flex items-center space-x-3 p-3 border border-yellow-300 rounded-lg bg-white">
              <div className="flex items-center justify-center w-6 h-6 bg-yellow-500 text-white rounded-full text-sm font-bold">
                {index + 1}
              </div>
              <div className="flex-1">
                <span className="font-medium text-gray-900">{stage}</span>
              </div>
              <Badge variant="outline" className="text-yellow-700 border-yellow-300">
                {t('evaluation.failedStages.needsUpdate')}
              </Badge>
            </div>
          ))}
        </div>
        
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-600" />
            <span className="text-sm text-blue-800">
              {t('evaluation.failedStages.updateInstructions')}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
