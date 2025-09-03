"use client";

import React from 'react';
import { AlertTriangle, Info, CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface QuantityValidationInfoProps {
  stageName: string;
  currentQuantity: number;
  currentUnit: string;
  previousQuantity?: number;
  previousUnit?: string;
  tolerance: number;
}

export default function QuantityValidationInfo({
  stageName,
  currentQuantity,
  currentUnit,
  previousQuantity,
  previousUnit,
  tolerance
}: QuantityValidationInfoProps) {
  const { t } = useTranslation();

  if (!previousQuantity) {
    return null;
  }

  // Tính toán thay đổi
  const changePercentage = ((currentQuantity - previousQuantity) / previousQuantity) * 100;
  const isIncrease = changePercentage > 0;
  const isDecrease = changePercentage < 0;
  const isWithinTolerance = Math.abs(changePercentage) <= tolerance * 100;

  // Lấy thông tin tolerance cho stage
  const getToleranceInfo = (stage: string) => {
    switch (stage.toLowerCase()) {
      case 'thu hoạch':
        return { tolerance: 15, reason: 'Ít biến động do quy trình chuẩn' };
      case 'phơi':
        return { tolerance: 30, reason: 'Có thể thay đổi nhiều do thời tiết' };
      case 'xay vỏ':
        return { tolerance: 20, reason: 'Trung bình, có thể hao hụt' };
      case 'rang':
        return { tolerance: 25, reason: 'Có thể thay đổi do nhiệt độ' };
      case 'đóng gói':
        return { tolerance: 10, reason: 'Ít biến động do quy trình chuẩn' };
      default:
        return { tolerance: 25, reason: 'Tolerance mặc định' };
    }
  };

  const toleranceInfo = getToleranceInfo(stageName);

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <Info className="h-5 w-5 text-blue-600" />
        <h4 className="font-medium text-blue-800">Thông tin validation khối lượng</h4>
      </div>
      
      <div className="space-y-3">
        {/* Thông tin so sánh */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">Lần trước:</span>
            <span className="ml-2 text-gray-600">{previousQuantity} {previousUnit}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Lần này:</span>
            <span className="ml-2 text-gray-600">{currentQuantity} {currentUnit}</span>
          </div>
        </div>

        {/* Thay đổi */}
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-700">Thay đổi:</span>
          <span className={`px-2 py-1 rounded text-sm font-medium ${
            isWithinTolerance 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {isIncrease ? '+' : ''}{changePercentage.toFixed(1)}%
          </span>
          {isWithinTolerance && (
            <CheckCircle className="h-4 w-4 text-green-600" />
          )}
          {!isWithinTolerance && (
            <AlertTriangle className="h-4 w-4 text-red-600" />
          )}
        </div>

        {/* Tolerance info */}
        <div className="bg-white border border-blue-300 rounded p-3">
          <div className="flex items-center gap-2 mb-2">
            <Info className="h-4 w-4 text-blue-600" />
            <span className="font-medium text-blue-800">Tolerance cho {stageName}</span>
          </div>
          <div className="text-sm text-blue-700">
            <p>• Giới hạn: ±{toleranceInfo.tolerance}%</p>
            <p>• Lý do: {toleranceInfo.reason}</p>
            <p>• Trạng thái: {isWithinTolerance ? '✅ Hợp lệ' : '❌ Vượt quá giới hạn'}</p>
          </div>
        </div>

        {/* Cảnh báo nếu vượt quá */}
        {!isWithinTolerance && (
          <div className="bg-yellow-50 border border-yellow-300 rounded p-3">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <span className="font-medium text-yellow-800">Cảnh báo</span>
            </div>
            <div className="text-sm text-yellow-700">
              {isIncrease ? (
                <p>Khối lượng tăng quá cao so với lần trước. Hãy kiểm tra lại quy trình và đảm bảo tính nhất quán.</p>
              ) : (
                <p>Khối lượng giảm quá nhiều so với lần trước. Có thể do hao hụt hoặc điều kiện thay đổi.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
