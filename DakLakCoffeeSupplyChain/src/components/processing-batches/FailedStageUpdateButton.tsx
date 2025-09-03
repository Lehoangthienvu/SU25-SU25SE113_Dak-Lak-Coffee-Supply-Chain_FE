"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Edit, AlertTriangle, CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AppToast } from '@/components/ui/AppToast';

interface FailedStageUpdateButtonProps {
  stageName: string;
  stageOrder: number;
  batchId: string;
  isFailed: boolean;
  onUpdateClick: (stageName: string, stageOrder: number) => void;
}

export default function FailedStageUpdateButton({
  stageName,
  stageOrder,
  batchId,
  isFailed,
  onUpdateClick
}: FailedStageUpdateButtonProps) {
  const { t } = useTranslation();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdateClick = async () => {
    if (isUpdating) return;
    
    setIsUpdating(true);
    try {
      onUpdateClick(stageName, stageOrder);
      AppToast.success(`Đã mở form cập nhật cho giai đoạn: ${stageName}`);
    } catch (error) {
      console.error('Error opening update form:', error);
      AppToast.error('Có lỗi xảy ra khi mở form cập nhật');
    } finally {
      setIsUpdating(false);
    }
  };

  if (!isFailed) {
    return null;
  }

  return (
    <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
      <div className="flex items-center space-x-3">
        <div className="flex items-center justify-center w-8 h-8 bg-red-100 rounded-full">
          <AlertTriangle className="w-4 h-4 text-red-600" />
        </div>
        <div>
          <h4 className="font-medium text-red-800">
            {stageName} (Bước {stageOrder})
          </h4>
          <p className="text-sm text-red-600">
            Giai đoạn này cần được cập nhật lại
          </p>
        </div>
      </div>
      
      <Button
        onClick={handleUpdateClick}
        disabled={isUpdating}
        className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2"
        size="sm"
      >
        <Edit className="w-4 h-4" />
        {isUpdating ? 'Đang mở...' : 'Cập nhật'}
      </Button>
    </div>
  );
}
