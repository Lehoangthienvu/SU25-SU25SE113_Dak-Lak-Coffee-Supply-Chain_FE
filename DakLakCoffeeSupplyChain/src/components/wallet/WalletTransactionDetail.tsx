'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Calendar,
  User,
  Wallet,
  FileText,
  DollarSign,
  Eye
} from 'lucide-react';
import {
  WalletTransactionDetail as TransactionDetail,
  getWalletTransactionById,
  formatTransactionType,
  getTransactionTypeColor,
  getTransactionAmountColor,
  formatAmount
} from '@/lib/api/walletTransaction';
// Sử dụng Date API có sẵn thay vì date-fns

interface WalletTransactionDetailProps {
  transactionId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function WalletTransactionDetail({
  transactionId,
  open,
  onOpenChange
}: WalletTransactionDetailProps) {
  const [transaction, setTransaction] = useState<TransactionDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (transactionId && open) {
      loadTransactionDetail();
    }
  }, [transactionId, open]);

  const loadTransactionDetail = async () => {
    if (!transactionId) return;

    setLoading(true);
    try {
      const data = await getWalletTransactionById(transactionId);
      setTransaction(data);
    } catch (error: any) {
      console.error('Error loading transaction detail:', error);
    } finally {
      setLoading(false);
    }
  };

  const DetailRow = ({ 
    icon, 
    label, 
    value, 
    badge = false,
    badgeColor = ""
  }: {
    icon: React.ReactNode;
    label: string;
    value: string | number;
    badge?: boolean;
    badgeColor?: string;
  }) => (
    <div className="flex items-center justify-between py-3">
      <div className="flex items-center gap-3">
        <div className="text-gray-500">{icon}</div>
        <span className="font-medium text-gray-700">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {badge ? (
          <Badge className={badgeColor}>{value}</Badge>
        ) : (
          <span className="text-gray-900">{value}</span>
        )}
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[95vh] overflow-y-auto border-0 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-green-50 rounded-lg -z-10"></div>
        <DialogHeader className="text-center pb-6">
          <DialogTitle className="flex items-center justify-center gap-3 text-2xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
            <Eye className="w-6 h-6 text-blue-600" />
            Chi tiết giao dịch
          </DialogTitle>
          <DialogDescription className="text-gray-600 mt-2">
            Thông tin chi tiết về giao dịch trong ví của bạn
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="relative">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200"></div>
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent absolute top-0"></div>
            </div>
            <span className="mt-4 text-gray-600 font-medium">Đang tải chi tiết...</span>
          </div>
        ) : transaction ? (
          <div className="space-y-8">
            {/* Header Card - Amount Showcase */}
            <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-gray-50">
              <CardHeader className="text-center py-8">
                <div className="mb-4">
                  <Badge 
                    className={`${getTransactionTypeColor(transaction.transactionType)} px-4 py-2 text-sm font-semibold rounded-full shadow-md`}
                  >
                    {formatTransactionType(transaction.transactionType)}
                  </Badge>
                </div>
                <div className="text-4xl font-bold mb-2">
                  <span className={`${getTransactionAmountColor(transaction.transactionType)} drop-shadow-sm`}>
                    {formatAmount(transaction.amount, transaction.transactionType)}
                  </span>
                </div>
                <div className="text-gray-500 text-sm">
                  {new Date(transaction.createdAt).toLocaleString('vi-VN', {
                    weekday: 'long',
                    day: '2-digit',
                    month: 'long', 
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </CardHeader>
            </Card>

            {/* Transaction Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Transaction Info */}
              <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-white">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-blue-700">
                    <DollarSign className="w-5 h-5" />
                    Chi tiết giao dịch
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 font-medium">Số tiền gốc</span>
                      <span className="font-bold text-lg">
                        {Math.abs(transaction.amount).toLocaleString('vi-VN')} VND
                      </span>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 font-medium">Thời gian thực hiện</span>
                      <span className="font-semibold text-gray-800">
                        {new Date(transaction.createdAt).toLocaleString('vi-VN', {
                          day: '2-digit',
                          month: '2-digit', 
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                  
                  {transaction.description && (
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="space-y-2">
                        <span className="text-gray-600 font-medium block">Ghi chú</span>
                        <p className="text-gray-800 bg-gray-50 p-3 rounded-md text-sm leading-relaxed">
                          {transaction.description}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Wallet Information */}
              <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-white">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-green-700">
                    <Wallet className="w-5 h-5" />
                    Thông tin ví
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {transaction.walletType && (
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 font-medium">Loại ví</span>
                        <Badge className="bg-green-100 text-green-800 px-3 py-1 rounded-full font-semibold">
                          {transaction.walletType}
                        </Badge>
                      </div>
                    </div>
                  )}
                  
                  {transaction.userName && (
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 font-medium">Chủ ví</span>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-500" />
                          <span className="font-semibold text-gray-800">{transaction.userName}</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Success Status */}
                  <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-green-500">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-green-700 font-semibold">Giao dịch thành công</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

          </div>
        ) : (
          <div className="text-center py-12">
            <div className="bg-red-50 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <Eye className="w-10 h-10 text-red-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Oops! Có lỗi xảy ra</h3>
            <p className="text-gray-500 mb-4">Không thể tải chi tiết giao dịch này</p>
            <div className="text-sm text-gray-400">
              Vui lòng thử lại sau hoặc liên hệ hỗ trợ nếu vấn đề vẫn tiếp diễn
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
