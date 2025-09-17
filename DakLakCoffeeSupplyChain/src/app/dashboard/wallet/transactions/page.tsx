'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Wallet, TrendingUp, Calendar, DollarSign } from 'lucide-react';
import { getMyWallet } from '@/lib/api/wallet';
import { WalletDetail } from '@/lib/api/wallet';
import { getWalletTransactionSummary, WalletTransactionSummary } from '@/lib/api/walletTransaction';
import WalletTransactionList from '@/components/wallet/WalletTransactionList';
import WalletTransactionDetail from '@/components/wallet/WalletTransactionDetail';
import { WalletTransactionList as TransactionListType } from '@/lib/api/walletTransaction';
import { toast } from 'sonner';

export default function TransactionsPage() {
  const router = useRouter();
  const [wallet, setWallet] = useState<WalletDetail | null>(null);
  const [summary, setSummary] = useState<WalletTransactionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);
  const [transactionDetailOpen, setTransactionDetailOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const walletData = await getMyWallet();
      setWallet(walletData);

      // Load transaction summary
      if (walletData?.walletId) {
        const summaryData = await getWalletTransactionSummary(walletData.walletId);
        setSummary(summaryData);
      }
    } catch (error: any) {
      console.error('Lỗi tải dữ liệu:', error);
      toast.error('Không thể tải dữ liệu giao dịch');
    } finally {
      setLoading(false);
    }
  };

  const handleTransactionClick = (transaction: TransactionListType) => {
    setSelectedTransactionId(transaction.transactionId);
    setTransactionDetailOpen(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Đang tải lịch sử giao dịch...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!wallet) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-gray-600">Không tìm thấy thông tin ví</p>
          <Button 
            onClick={() => router.push('/dashboard/wallet')}
            className="mt-4"
          >
            Quay lại trang ví
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Button 
          variant="outline" 
          onClick={() => router.push('/dashboard/wallet')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Quay lại ví
        </Button>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Lịch sử giao dịch</h1>
        <p className="text-gray-600">Chi tiết tất cả giao dịch của ví {wallet.walletType}</p>
      </div>

      {/* Wallet Info */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Số dư hiện tại
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(wallet.totalBalance)}
            </div>
          </CardContent>
        </Card>

        {summary && (
          <>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Tổng giao dịch
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {summary.totalTransactions}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Tổng nạp tiền
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(summary.totalTopUp)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Tổng chi tiêu
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(summary.totalWithdraw + summary.totalPayment)}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Transaction Summary Cards */}
      {summary && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="bg-green-50 border-green-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-800">Nạp tiền</p>
                  <p className="text-lg font-bold text-green-900">
                    {formatCurrency(summary.totalTopUp)}
                  </p>
                </div>
                <div className="h-8 w-8 bg-green-200 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-green-800" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-red-50 border-red-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-800">Rút tiền</p>
                  <p className="text-lg font-bold text-red-900">
                    {formatCurrency(summary.totalWithdraw)}
                  </p>
                </div>
                <div className="h-8 w-8 bg-red-200 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-red-800 rotate-180" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-800">Chuyển tiền</p>
                  <p className="text-lg font-bold text-blue-900">
                    {formatCurrency(summary.totalTransfer)}
                  </p>
                </div>
                <div className="h-8 w-8 bg-blue-200 rounded-full flex items-center justify-center">
                  <ArrowLeft className="h-4 w-4 text-blue-800 rotate-45" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-orange-50 border-orange-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-800">Thanh toán</p>
                  <p className="text-lg font-bold text-orange-900">
                    {formatCurrency(summary.totalPayment)}
                  </p>
                </div>
                <div className="h-8 w-8 bg-orange-200 rounded-full flex items-center justify-center">
                  <DollarSign className="h-4 w-4 text-orange-800" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Transaction List */}
      <WalletTransactionList
        walletId={wallet.walletId}
        onTransactionClick={handleTransactionClick}
        showActions={true}
        initialPageSize={20}
      />

      {/* Transaction Detail Dialog */}
      <WalletTransactionDetail
        transactionId={selectedTransactionId}
        open={transactionDetailOpen}
        onOpenChange={setTransactionDetailOpen}
      />
    </div>
  );
}
