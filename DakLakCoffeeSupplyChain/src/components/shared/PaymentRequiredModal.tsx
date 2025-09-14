"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CreditCard, AlertCircle } from 'lucide-react';

interface PaymentRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPayNow: () => void;
  planTitle: string;
  planId: string;
  amount: number;
}

export const PaymentRequiredModal: React.FC<PaymentRequiredModalProps> = ({
  isOpen,
  onClose,
  onPayNow,
  planTitle,
  planId,
  amount
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-6 w-6 text-amber-500" />
            <DialogTitle>Yêu cầu thanh toán</DialogTitle>
          </div>
          <DialogDescription className="text-left">
            Để mở đăng ký cho kế hoạch này, bạn cần thanh toán phí đăng ký trước.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Thông tin kế hoạch</h4>
            <p className="text-sm text-gray-600 mb-1">
              <span className="font-medium">Tên kế hoạch:</span> {planTitle}
            </p>
            <p className="text-sm text-gray-600 mb-1">
              <span className="font-medium">Mã kế hoạch:</span> {planId}
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-medium">Phí đăng ký:</span> 
              <span className="text-red-600 font-semibold ml-1">
                {formatCurrency(amount)}
              </span>
            </p>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Phương thức thanh toán</h4>
            <div className="flex items-center gap-2 text-sm text-blue-700">
              <CreditCard className="h-4 w-4" />
              <span>VNPay - Thanh toán trực tuyến an toàn</span>
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button onClick={onPayNow} className="bg-green-600 hover:bg-green-700">
            <CreditCard className="h-4 w-4 mr-2" />
            Thanh toán ngay
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
