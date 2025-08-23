import React from 'react';
import { getStageFailureDisplayInfo, debugStageFailure } from '@/lib/helpers/evaluationHelpers';
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface StageFailureDisplayProps {
  comments: string;
  className?: string;
  batch?: {
    progresses?: Array<{
      stageId: number; // ✅ Nhất quán với model database và Backend: int StageId
      stageName: string;
      stepIndex: number;
    }>;
  };
}

export default function StageFailureDisplay({ comments, className = '', batch }: StageFailureDisplayProps) {
  // Debug log để kiểm tra comments
  React.useEffect(() => {
    if (comments) {
      console.log("🔍 DEBUG: StageFailureDisplay received comments:", comments);
      debugStageFailure(comments, 'StageFailureDisplay');
    }
  }, [comments]);

  const failureInfo = getStageFailureDisplayInfo(comments);
  
  // 🔧 CẢI THIỆN: Lấy StageId thực từ batch data dựa trên OrderIndex
  const actualStageId = React.useMemo(() => {
    if (!failureInfo.hasFailure || !batch?.progresses) return undefined;
    
    // Tìm progress có stepIndex tương ứng với orderIndex
    const matchingProgress = batch.progresses.find(progress => 
      progress.stepIndex === failureInfo.orderIndex
    );
    
    return matchingProgress?.stageId;
  }, [failureInfo, batch]);
  
  // 🔧 CẢI THIỆN: Debug thông tin parsed
  React.useEffect(() => {
    console.log("🔍 DEBUG: StageFailureDisplay parsed info:", failureInfo);
  }, [failureInfo]);

  // 🔧 CẢI THIỆN: Hiển thị thông tin failure hoặc thông tin thường
  if (!failureInfo.hasFailure) {
    return (
      <div className={`bg-blue-50 border border-blue-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center gap-2">
          <Info className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-blue-800">Thông tin đánh giá</h3>
        </div>
        <p className="text-blue-700 mt-2">{comments || 'Không có thông tin chi tiết'}</p>
      </div>
    );
  }

  return (
    <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="w-5 h-5 text-red-600" />
        <h3 className="font-semibold text-red-800">🔧 Công đoạn cần cải thiện</h3>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-start gap-2">
          <span className="text-red-600 font-medium min-w-[80px]">Công đoạn:</span>
          <div>
            <span className="text-red-800 font-semibold">{failureInfo.stageName}</span>
            <span className="text-red-600 text-sm ml-2">(Bước {failureInfo.orderIndex})</span>
          </div>
        </div>
        
        <div className="flex items-start gap-2">
          <span className="text-red-600 font-medium min-w-[80px]">Vấn đề:</span>
          <span className="text-red-700">{failureInfo.details}</span>
        </div>
        
        {failureInfo.recommendations && (
          <div className="flex items-start gap-2">
            <span className="text-red-600 font-medium min-w-[80px]">Khuyến nghị:</span>
            <span className="text-red-700">{failureInfo.recommendations}</span>
          </div>
        )}
      </div>
      
      {/* 🔧 CẢI THIỆN: Thêm thông tin debug */}
      {/* 🔧 CẢI THIỆN: Ẩn debug info để giao diện đẹp hơn */}
      {/* Debug info đã được ẩn - chỉ hiển thị khi cần thiết */}
      
      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-yellow-600" />
          <p className="text-sm text-yellow-800">
            <strong>Hướng dẫn:</strong> Vui lòng cải thiện công đoạn này theo khuyến nghị của chuyên gia và cập nhật lại tiến trình.
          </p>
        </div>
      </div>
    </div>
  );
}
