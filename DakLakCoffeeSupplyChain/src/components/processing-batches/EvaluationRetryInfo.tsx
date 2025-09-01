"use client";

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertTriangle, RefreshCw, CheckCircle, XCircle, Info } from 'lucide-react';
import { AppToast } from '@/components/ui/AppToast';
import { getFailureInfo, EvaluationFailureInfo } from '@/lib/api/processingBatchEvaluations';

interface EvaluationRetryInfoProps {
  batchId: string;
  isOpen: boolean;
  onClose: () => void;
  onRetry: (stageId: number) => void;
}

interface FailureInfo {
  batchId: string;
  evaluationId: string;
  failedAt: string;
  comments: string;
  failedStage?: {
    stageId: number;
    stageName: string;
    orderIndex: number;
    lastStepIndex: number;
  };
  completedStages: Array<{
    stageId: number;
    stageName: string;
    orderIndex: number;
    stepIndex: number;
    outputQuantity: number;
    outputUnit: string;
    progressDate: string;
  }>;
  note: string;
}

export default function EvaluationRetryInfo({
  batchId,
  isOpen,
  onClose,
  onRetry
}: EvaluationRetryInfoProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [failureInfo, setFailureInfo] = useState<FailureInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && batchId) {
      loadFailureInfo();
    }
  }, [isOpen, batchId]);

  const loadFailureInfo = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/evaluations/failure-info/${batchId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok && data.status === 'SUCCESS') {
        setFailureInfo(data.data);
      } else if (data.status === 'WARNING_NO_DATA') {
        setError(t('evaluations.retry.noRetryNeeded'));
      } else {
        setError(data.message || t('evaluation.error.loadingFailureInfo'));
      }
    } catch (error) {
      console.error('Error loading failure info:', error);
      setError(t('evaluation.error.loadingFailureInfo'));
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = (stageId: number) => {
    onRetry(stageId);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-red-500" />
              <h2 className="text-2xl font-bold text-gray-900">
                {t('evaluations.retry.title')}
              </h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              ×
            </Button>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">{t('common.loading')}</span>
            </div>
          )}

          {error && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2">
                <Info className="h-5 w-5 text-yellow-600" />
                <span className="text-yellow-800">{error}</span>
              </div>
            </div>
          )}

          {failureInfo && (
            <div className="space-y-6">
              {/* Batch Failure Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-600">
                    <XCircle className="h-5 w-5" />
                    {t('evaluations.retry.batchFailed')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm font-medium text-gray-500">
                        {t('evaluation.evaluationDate')}:
                      </span>
                      <p className="text-gray-900">
                        {new Date(failureInfo.failedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">
                        {t('evaluation.comments')}:
                      </span>
                      <p className="text-gray-900 text-sm">
                        {failureInfo.comments || t('common.noData')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Retry Stage */}
              {failureInfo.failedStage && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-blue-600">
                      <RefreshCw className="h-5 w-5" />
                      {t('evaluations.retry.retryStage')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-blue-900">
                            {failureInfo.failedStage.stageName}
                          </h3>
                          <p className="text-sm text-blue-700">
                            {t('evaluations.retry.stageInfo.orderIndex')}: {failureInfo.failedStage.orderIndex} | 
                            {t('evaluations.retry.stageInfo.stepIndex')}: {failureInfo.failedStage.lastStepIndex}
                          </p>
                        </div>
                        <Button
                          onClick={() => handleRetry(failureInfo.failedStage!.stageId)}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          {t('evaluations.retry.retryGuidance.retryButton')}
                        </Button>
                      </div>
                      <p className="text-sm text-blue-600 mt-2">
                        {t('evaluations.retry.retryGuidance.retryHint', { 
                          stageName: failureInfo.failedStage.stageName 
                        })}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Completed Stages */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-5 w-5" />
                    {t('evaluations.retry.completedStages')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t('evaluations.retry.stageInfo.name')}</TableHead>
                          <TableHead>{t('evaluations.retry.stageInfo.orderIndex')}</TableHead>
                          <TableHead>{t('evaluations.retry.stageInfo.stepIndex')}</TableHead>
                          <TableHead>{t('evaluations.retry.stageInfo.outputQuantity')}</TableHead>
                          <TableHead>{t('evaluations.retry.stageInfo.progressDate')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {failureInfo.completedStages.map((stage, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{stage.stageName}</TableCell>
                            <TableCell>{stage.orderIndex}</TableCell>
                            <TableCell>{stage.stepIndex}</TableCell>
                            <TableCell>
                              {stage.outputQuantity} {stage.outputUnit}
                            </TableCell>
                            <TableCell>
                              {new Date(stage.progressDate).toLocaleDateString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              {/* Guidance */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-orange-600">
                    <Info className="h-5 w-5" />
                    {t('evaluations.retry.retryGuidance.title')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <p className="text-orange-800">
                      {t('evaluations.retry.retryGuidance.description')}
                    </p>
                    <div className="mt-3 flex gap-2">
                      <Badge variant="outline" className="text-orange-700 border-orange-300">
                        {failureInfo.completedStages.length} {t('processing.progress.stages')}
                      </Badge>
                      <Badge variant="outline" className="text-orange-700 border-orange-300">
                        {t('processing.batch.status')}: {t('processing.batch.status.awaitingEvaluation')}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              {t('common.close')}
            </Button>
            {failureInfo?.failedStage && (
              <Button
                onClick={() => handleRetry(failureInfo.failedStage!.stageId)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                {t('evaluations.retry.retryGuidance.retryButton')}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
