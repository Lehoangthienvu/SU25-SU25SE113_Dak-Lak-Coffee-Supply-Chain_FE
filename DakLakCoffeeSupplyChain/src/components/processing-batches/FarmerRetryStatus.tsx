"use client";

import React from 'react';
import { CheckCircle, RefreshCw } from 'lucide-react';
import { getStageFailureDisplayInfo } from '@/lib/helpers/evaluationHelpers';

interface FarmerRetryStatusProps {
  evaluation: {
    evaluationResult: string;
    comments?: string;
    evaluatedAt?: string;
  };
  batch?: {
    farmerName: string;
    status?: string;
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

export default function FarmerRetryStatus({ evaluation, batch }: FarmerRetryStatusProps) {
  const failureInfo = evaluation.comments ? getStageFailureDisplayInfo(evaluation.comments) : null;
  
  // Kiểm tra xem farmer đã retry chưa
  const hasFarmerRetried = React.useMemo(() => {
    if (!failureInfo?.hasFailure || !batch?.progresses || !evaluation.evaluatedAt) return false;
    
    // 🔧 CẢI THIỆN: Kiểm tra trạng thái batch trước
    // Nếu batch đã chuyển sang "AwaitingEvaluation" thì có nghĩa là farmer đã cập nhật lại
    if (batch.status === 'AwaitingEvaluation') {
      console.log('🔍 DEBUG FarmerRetryStatus: Batch status is AwaitingEvaluation - farmer has retried');
      return true;
    }
    
    const evaluationDate = new Date(evaluation.evaluatedAt);
    
    // Tìm các progress của stage bị fail
    const failedStageProgresses = (batch.progresses || []).filter(progress => {
      // Tìm stage có OrderIndex tương ứng với failedOrderIndex
      const stageOrderIndex = (batch.progresses || []).findIndex(p => p.stageName === progress.stageName) + 1;
      return stageOrderIndex === failureInfo.orderIndex;
    });
    
    // 🔧 CẢI THIỆN: Kiểm tra xem có progress nào được tạo sau evaluation không
    // Và đảm bảo đó là retry thực sự (có stageDescription chứa "Retry" hoặc có stepIndex cao hơn)
    return failedStageProgresses.some(progress => {
      if (!progress.progressDate) return false;
      const progressDate = new Date(progress.progressDate);
      
      // Kiểm tra ngày cập nhật sau evaluation
      const isAfterEvaluation = progressDate > evaluationDate;
      
      // Kiểm tra có phải retry thực sự không
      const isRetry = progress.stageDescription?.toLowerCase().includes('retry') || 
                     progress.stepIndex > 1; // Nếu stepIndex > 1 thì có thể là retry
      
      console.log(`🔍 DEBUG FarmerRetryStatus: Progress ${progress.progressId}:`, {
        stageName: progress.stageName,
        progressDate: progress.progressDate,
        evaluationDate: evaluation.evaluatedAt,
        isAfterEvaluation,
        stageDescription: progress.stageDescription,
        stepIndex: progress.stepIndex,
        isRetry,
        finalResult: isAfterEvaluation && isRetry
      });
      
      return isAfterEvaluation && isRetry;
    });
  }, [failureInfo, batch, evaluation.evaluatedAt]);
  
  // Lấy thông tin retry mới nhất
  const latestRetryInfo = React.useMemo(() => {
    if (!hasFarmerRetried || !batch?.progresses || !evaluation.evaluatedAt) return null;
    
    const evaluationDate = new Date(evaluation.evaluatedAt);
    const failedStageProgresses = (batch.progresses || []).filter(progress => {
      const stageOrderIndex = (batch.progresses || []).findIndex(p => p.stageName === progress.stageName) + 1;
      return stageOrderIndex === failureInfo?.orderIndex;
    });
    
    // 🔧 CẢI THIỆN: Nếu batch status là AwaitingEvaluation, lấy progress mới nhất của stage bị fail
    if (batch.status === 'AwaitingEvaluation') {
      if (failedStageProgresses.length > 0) {
        const latestProgress = failedStageProgresses.sort((a, b) => 
          new Date(b.progressDate || '').getTime() - new Date(a.progressDate || '').getTime()
        )[0];
        
        return {
          progressDate: latestProgress.progressDate,
          updatedByName: latestProgress.updatedByName,
          stageDescription: latestProgress.stageDescription || 'Đã cập nhật lại theo khuyến nghị'
        };
      }
      return null;
    }
    
    const retryProgresses = failedStageProgresses.filter(progress => {
      if (!progress.progressDate) return false;
      const progressDate = new Date(progress.progressDate);
      
      // Kiểm tra ngày cập nhật sau evaluation
      const isAfterEvaluation = progressDate > evaluationDate;
      
      // Kiểm tra có phải retry thực sự không
      const isRetry = progress.stageDescription?.toLowerCase().includes('retry') || 
                     progress.stepIndex > 1;
      
      return isAfterEvaluation && isRetry;
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
    
    return null;
  }, [hasFarmerRetried, batch, failureInfo, evaluation.evaluatedAt]);
  
  if (!failureInfo?.hasFailure) return null;
  
  return (
    <div className="mt-3">
      {hasFarmerRetried ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-green-800">
              ✅ {batch?.farmerName || 'Nông dân'} đã cập nhật lại công đoạn {failureInfo.stageName}
            </span>
          </div>
          
          {latestRetryInfo && (
            <div className="text-sm text-green-700 space-y-1">
              <p><strong>Ngày cập nhật:</strong> {latestRetryInfo.progressDate ? new Date(latestRetryInfo.progressDate).toLocaleDateString('vi-VN') : 'N/A'}</p>
              <p><strong>Cập nhật bởi:</strong> {latestRetryInfo.updatedByName || batch?.farmerName || 'Nông dân'}</p>
              {latestRetryInfo.stageDescription && (
                <p><strong>Mô tả:</strong> {latestRetryInfo.stageDescription}</p>
              )}
            </div>
          )}
          
          <div className="mt-2 text-sm text-green-600">
            {batch?.status === 'AwaitingEvaluation' 
              ? 'Nông dân đã cập nhật lại và đang chờ bạn đánh giá.'
              : 'Bạn có thể đánh giá lại để kiểm tra chất lượng cải thiện.'
            }
          </div>
        </div>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-yellow-600" />
            <span className="text-sm text-yellow-800">
              ⏳ Đang chờ {batch?.farmerName || 'nông dân'} cập nhật lại công đoạn {failureInfo.stageName}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
