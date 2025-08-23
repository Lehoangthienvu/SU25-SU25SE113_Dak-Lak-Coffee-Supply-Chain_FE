"use client";

import React from 'react';
import { AlertTriangle, Info, CheckCircle, RefreshCw, ArrowRight } from 'lucide-react';
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
      stageDescription?: string;
      updatedByName?: string;
    }>;
  };
}

export default function RetryGuidanceInfo({ evaluation, batch }: RetryGuidanceInfoProps) {
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
  
  return (
    <div className="mt-4">
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="w-5 h-5 text-orange-600" />
          <h3 className="font-semibold text-orange-800">Hướng dẫn cập nhật lại</h3>
        </div>
        
        <div className="space-y-3">
          {/* Thông tin về stage bị fail */}
          <div className="bg-white/50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <RefreshCw className="w-4 h-4 text-orange-600" />
              <span className="text-sm font-medium text-orange-800">
                Công đoạn cần cập nhật lại: {failureInfo.stageName} (Bước {failureInfo.orderIndex})
              </span>
            </div>
            
            {failedStageInfo && (
              <div className="text-sm text-orange-700 space-y-1">
                <p><strong>Lần cập nhật cuối:</strong> {failedStageInfo.progressDate ? new Date(failedStageInfo.progressDate).toLocaleDateString('vi-VN') : 'N/A'}</p>
                <p><strong>Cập nhật bởi:</strong> {failedStageInfo.updatedByName || batch?.farmerName || 'Nông dân'}</p>
              </div>
            )}
          </div>
          
          {/* Hướng dẫn về các stage đằng sau */}
          {hasCompletedStagesAfterFailure ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span className="text-sm font-medium text-red-800">
                  ⚠️ Cần cập nhật lại các công đoạn đã hoàn thành sau
                </span>
              </div>
              
              <div className="text-sm text-red-700 space-y-2">
                <p>
                  Vì công đoạn <strong>{failureInfo.stageName}</strong> bị đánh giá không đạt, 
                  các công đoạn sau đây cũng cần được cập nhật lại để đảm bảo chất lượng:
                </p>
                
                <div className="space-y-1">
                  {stagesAfterFailure.map((progress, index) => (
                    <div key={progress.progressId} className="flex items-center gap-2">
                      <ArrowRight className="w-3 h-3 text-red-600" />
                      <span className="text-sm">
                        <strong>{progress.stageName}</strong> 
                        {progress.progressDate && (
                          <span className="text-gray-600 ml-2">
                            (cập nhật: {new Date(progress.progressDate).toLocaleDateString('vi-VN')})
                          </span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
                
                <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-xs text-yellow-800">
                    <strong>Lưu ý:</strong> Khi cập nhật lại công đoạn {failureInfo.stageName}, 
                    hệ thống sẽ tự động cho phép bạn cập nhật lại các công đoạn tiếp theo để đảm bảo tính nhất quán.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">
                  ✅ Chỉ cần cập nhật lại công đoạn {failureInfo.stageName}
                </span>
              </div>
              
              <div className="text-sm text-green-700">
                <p>
                  Đây là công đoạn cuối cùng hoặc chưa có công đoạn nào được hoàn thành sau. 
                  Bạn chỉ cần cập nhật lại công đoạn <strong>{failureInfo.stageName}</strong> 
                  theo khuyến nghị của chuyên gia.
                </p>
              </div>
            </div>
          )}
          
          {/* Hướng dẫn hành động */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Info className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">
                Hướng dẫn thực hiện
              </span>
            </div>
            
            <div className="text-sm text-blue-700 space-y-1">
              <p><strong>Bước 1:</strong> Cập nhật lại công đoạn {failureInfo.stageName} theo khuyến nghị</p>
              {hasCompletedStagesAfterFailure && (
                <p><strong>Bước 2:</strong> Cập nhật lại các công đoạn tiếp theo để đảm bảo chất lượng</p>
              )}
              <p><strong>Bước 3:</strong> Chờ chuyên gia đánh giá lại</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
