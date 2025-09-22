'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getSystemWallet, SystemWallet } from '@/lib/api/admin';
import { AppToast } from '@/components/ui/AppToast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, Wallet, TrendingUp, Clock, CreditCard, BarChart3 } from 'lucide-react';
import Link from 'next/link';

export default function SystemWalletPage() {
  const { t } = useTranslation();
  const [systemWallet, setSystemWallet] = useState<SystemWallet | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSystemWallet = async () => {
    try {
      const wallet = await getSystemWallet();
      setSystemWallet(wallet);
    } catch (error: any) {
      console.error('Lỗi khi lấy thông tin ví System:', error);
      AppToast.error(error.message || 'Có lỗi xảy ra khi lấy thông tin ví System');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchSystemWallet();
    setRefreshing(false);
    AppToast.success('Đã cập nhật thông tin ví System');
  };

  useEffect(() => {
    fetchSystemWallet();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ví Hệ Thống</h1>
          <p className="text-gray-600 mt-1">
            Quản lý và theo dõi số dư ví System (Admin)
          </p>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={refreshing}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Làm mới
        </Button>
      </div>

      {/* System Wallet Card */}
      {systemWallet && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              Thông tin ví System
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Wallet ID */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-500">ID Ví</label>
                <div className="text-sm font-mono bg-gray-100 p-2 rounded">
                  {systemWallet.walletId}
                </div>
              </div>

              {/* Wallet Type */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-500">Loại Ví</label>
                <div>
                  <Badge variant="secondary" className="text-sm">
                    {systemWallet.walletType}
                  </Badge>
                </div>
              </div>

              {/* Total Balance */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-500">Số Dư</label>
                <div className="text-2xl font-bold text-green-600 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  {formatCurrency(systemWallet.totalBalance)}
                </div>
              </div>

              {/* Last Updated */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-500">Cập Nhật Cuối</label>
                <div className="text-sm text-gray-600 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {formatDate(systemWallet.lastUpdated)}
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">Thông tin ví System</h3>
              <p className="text-sm text-blue-700">
                Ví System là ví chính của hệ thống, nhận tất cả các khoản phí từ người dùng 
                như phí đăng ký kế hoạch thu mua, phí đăng ký tài khoản, v.v. Số dư hiện tại 
                phản ánh tổng số tiền đã thu được từ các giao dịch thanh toán.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      {systemWallet && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link href="/dashboard/admin/wallet-transactions">
            <Card className="hover:shadow-lg transition cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <CreditCard className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Quản lý giao dịch</h3>
                    <p className="text-sm text-gray-600">
                      Xem và quản lý tất cả giao dịch ví trong hệ thống
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard/admin">
            <Card className="hover:shadow-lg transition cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <BarChart3 className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Dashboard tổng quan</h3>
                    <p className="text-sm text-gray-600">
                      Quay lại trang dashboard chính của admin
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      )}

      {/* No Data */}
      {!systemWallet && !loading && (
        <Card>
          <CardContent className="text-center py-8">
            <Wallet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Không tìm thấy ví System
            </h3>
            <p className="text-gray-600 mb-4">
              Có thể ví System chưa được tạo hoặc có lỗi xảy ra.
            </p>
            <Button onClick={handleRefresh} variant="outline">
              Thử lại
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
