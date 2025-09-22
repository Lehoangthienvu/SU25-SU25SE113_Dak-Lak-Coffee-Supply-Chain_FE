'use client';

import React, { useState, useEffect } from 'react';
import { getTransactionsByWallet, WalletTransactionList } from '@/lib/api/walletTransaction';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  TrendingUp, 
  TrendingDown, 
  ArrowUpRight, 
  ArrowDownRight,
  Wallet,
  CreditCard,
  Send,
  ShoppingCart
} from 'lucide-react';

interface WalletTransactionStatsProps {
  walletId: string;
}

interface TransactionStats {
  totalTransactions: number;
  totalTopUp: number;
  totalWithdraw: number;
  totalTransfer: number;
  totalPayment: number;
  lastTransaction?: string;
}

export default function WalletTransactionStats({ walletId }: WalletTransactionStatsProps) {
  const [stats, setStats] = useState<TransactionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Lấy tất cả giao dịch của ví
      const transactions = await getTransactionsByWallet(walletId);
      
      // Tính toán stats từ dữ liệu
      const calculatedStats: TransactionStats = {
        totalTransactions: transactions.length,
        totalTopUp: transactions
          .filter(t => t.transactionType.toLowerCase() === 'topup' || t.transactionType.toLowerCase() === 'directtopup')
          .reduce((sum, t) => sum + t.amount, 0),
        totalWithdraw: transactions
          .filter(t => t.transactionType.toLowerCase() === 'withdraw')
          .reduce((sum, t) => sum + t.amount, 0),
        totalTransfer: transactions
          .filter(t => t.transactionType.toLowerCase() === 'transfer')
          .reduce((sum, t) => sum + t.amount, 0),
        totalPayment: transactions
          .filter(t => t.transactionType.toLowerCase() === 'payment')
          .reduce((sum, t) => sum + t.amount, 0),
        lastTransaction: transactions.length > 0 
          ? transactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0].createdAt
          : undefined
      };
      
      setStats(calculatedStats);
    } catch (err) {
      setError('Không thể tải thống kê');
      console.error('Error loading stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (walletId) {
      loadStats();
    }
  }, [walletId]);

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('vi-VN', {
      style: 'currency',
      currency: 'VND'
    });
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-4 text-center">
          <p className="text-red-600">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return null;
  }

  const statCards = [
    {
      title: 'Tổng giao dịch',
      value: stats?.totalTransactions || 0,
      icon: Wallet,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Tổng nạp tiền',
      value: formatCurrency(stats?.totalTopUp || 0),
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Tổng rút tiền',
      value: formatCurrency(stats?.totalWithdraw || 0),
      icon: TrendingDown,
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    },
    {
      title: 'Tổng chuyển tiền',
      value: formatCurrency(stats?.totalTransfer || 0),
      icon: Send,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Tổng thanh toán',
      value: formatCurrency(stats?.totalPayment || 0),
      icon: ShoppingCart,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    }
  ];

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Thống kê giao dịch</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">
                      {stat.title}
                    </p>
                    <p className="text-lg font-semibold">
                      {stat.value}
                    </p>
                  </div>
                  <div className={`p-2 rounded-full ${stat.bgColor}`}>
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Tổng thu nhập
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <ArrowUpRight className="h-4 w-4 text-green-600" />
              <span className="text-2xl font-bold text-green-600">
                {formatCurrency((stats?.totalTopUp || 0) + (stats?.totalTransfer || 0))}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Nạp tiền + Chuyển tiền
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Tổng chi tiêu
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <ArrowDownRight className="h-4 w-4 text-red-600" />
              <span className="text-2xl font-bold text-red-600">
                {formatCurrency((stats?.totalWithdraw || 0) + (stats?.totalPayment || 0))}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Rút tiền + Thanh toán
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Last Transaction */}
      {stats?.lastTransaction && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">
              Giao dịch gần nhất
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700">
              {new Date(stats.lastTransaction).toLocaleDateString('vi-VN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
