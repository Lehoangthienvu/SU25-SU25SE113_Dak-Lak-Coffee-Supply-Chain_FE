'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wallet, Plus, CreditCard, TrendingUp, History, Eye } from 'lucide-react';
import { getMyWallet } from '@/lib/api/wallet';
import { WalletDetail } from '@/lib/api/wallet';
import SimpleTopupDialog from '@/components/wallet/SimpleTopupDialog';
import WalletTransactionList from '@/components/wallet/WalletTransactionList';
import WalletTransactionDetail from '@/components/wallet/WalletTransactionDetail';
import { WalletTransactionList as TransactionListType } from '@/lib/api/walletTransaction';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export default function WalletPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [wallet, setWallet] = useState<WalletDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [topupDialogOpen, setTopupDialogOpen] = useState(false);
  const [showTransactionHistory, setShowTransactionHistory] = useState(false);
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);
  const [transactionDetailOpen, setTransactionDetailOpen] = useState(false);

  useEffect(() => {
    loadWallet();
  }, []);

  const loadWallet = async () => {
    try {
      setLoading(true);
      const walletData = await getMyWallet();
      setWallet(walletData);
    } catch (error: any) {
      console.error('Lỗi tải thông tin ví:', error);
      toast.error('Không thể tải thông tin ví');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const handleTopupSuccess = () => {
    loadWallet(); // Reload wallet data
    setTopupDialogOpen(false);
  };

  const handleTransactionClick = (transaction: TransactionListType) => {
    setSelectedTransactionId(transaction.transactionId);
    setTransactionDetailOpen(true);
  };

  const toggleTransactionHistory = () => {
    setShowTransactionHistory(!showTransactionHistory);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Đang tải thông tin ví...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!wallet) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                  <Wallet className="h-8 w-8 text-gray-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Bạn chưa có ví
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Hãy tạo ví để bắt đầu sử dụng các dịch vụ thanh toán.
                  </p>
                  <Button onClick={() => router.push('/dashboard/wallet/create')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Tạo ví mới
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Ví của tôi</h1>
        <p className="text-gray-600">Quản lý số dư và giao dịch của bạn</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Wallet Balance Card */}
        <Card className="md:col-span-2 lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Số dư ví
            </CardTitle>
            <CardDescription>
              {wallet.walletType} • Cập nhật lần cuối: {new Date(wallet.lastUpdated).toLocaleString('vi-VN')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600 mb-4">
              {formatCurrency(wallet.totalBalance)}
            </div>
            <Button 
              onClick={() => setTopupDialogOpen(true)}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nạp tiền
            </Button>
          </CardContent>
        </Card>

        {/* Transaction Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Thống kê giao dịch
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Tổng giao dịch:</span>
              <Badge variant="secondary">{wallet.totalTransactions}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Tổng thu:</span>
              <span className="text-sm font-medium text-green-600">
                {formatCurrency(wallet.totalInflow)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Tổng chi:</span>
              <span className="text-sm font-medium text-red-600">
                {formatCurrency(wallet.totalOutflow)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Thao tác nhanh</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => setTopupDialogOpen(true)}
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Nạp tiền qua VNPay
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={toggleTransactionHistory}
            >
              <History className="h-4 w-4 mr-2" />
              {showTransactionHistory ? 'Ẩn lịch sử' : 'Lịch sử giao dịch'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Transaction History */}
      {showTransactionHistory && wallet && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Lịch sử giao dịch</h2>
              <p className="text-gray-600">Xem tất cả giao dịch của ví</p>
            </div>
            <Button 
              variant="outline"
              onClick={() => router.push('/dashboard/wallet/transactions')}
            >
              <Eye className="h-4 w-4 mr-2" />
              Xem chi tiết
            </Button>
          </div>
          
          {wallet.walletId && (
            <WalletTransactionList
              walletId={wallet.walletId}
              onTransactionClick={handleTransactionClick}
              showActions={true}
              initialPageSize={5}
            />
          )}
        </div>
      )}

      {/* Dialogs */}
      <SimpleTopupDialog
        open={topupDialogOpen}
        onOpenChange={setTopupDialogOpen}
        onSuccess={handleTopupSuccess}
      />

      <WalletTransactionDetail
        transactionId={selectedTransactionId}
        open={transactionDetailOpen}
        onOpenChange={setTransactionDetailOpen}
      />
    </div>
  );
}
