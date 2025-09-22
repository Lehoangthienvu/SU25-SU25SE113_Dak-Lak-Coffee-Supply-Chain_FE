'use client';

import React, { useState } from 'react';
import WalletTransactionList from '@/components/wallet/WalletTransactionList';
import WalletTransactionForm from '@/components/wallet/WalletTransactionForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  BarChart3, 
  List, 
  Users,
  Wallet
} from 'lucide-react';

export default function WalletTransactionsPage() {
  const [selectedWalletId, setSelectedWalletId] = useState<string>('');
  const [refreshKey, setRefreshKey] = useState(0);

  const handleTransactionCreated = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Quản lý giao dịch ví</h1>
          <p className="text-gray-600 mt-1">
            Quản lý và theo dõi tất cả giao dịch ví trong hệ thống
          </p>
        </div>
        
        <div className="flex gap-2">
          <WalletTransactionForm
            walletId={selectedWalletId || 'default'}
            onTransactionCreated={handleTransactionCreated}
            trigger={
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Tạo giao dịch
              </Button>
            }
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            Tất cả giao dịch
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Thống kê
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Theo người dùng
          </TabsTrigger>
          <TabsTrigger value="create" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Tạo mới
          </TabsTrigger>
        </TabsList>

        {/* All Transactions Tab */}
        <TabsContent value="all" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tất cả giao dịch</CardTitle>
            </CardHeader>
            <CardContent>
              <WalletTransactionList 
                isAdmin={true}
                key={refreshKey}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Statistics Tab */}
        <TabsContent value="stats" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Thống kê tổng quan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  Chọn ví để xem thống kê chi tiết
                </p>
                <div className="mt-4">
                  <input
                    type="text"
                    placeholder="Nhập Wallet ID..."
                    value={selectedWalletId}
                    onChange={(e) => setSelectedWalletId(e.target.value)}
                    className="px-3 py-2 border rounded-md w-64"
                  />
                  <p className="text-sm text-gray-400 mt-2">
                    Tính năng thống kê sẽ được phát triển trong tương lai
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Giao dịch theo người dùng</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  Chọn User ID để xem giao dịch của người dùng
                </p>
                <div className="mt-4">
                  <input
                    type="text"
                    placeholder="Nhập User ID..."
                    className="px-3 py-2 border rounded-md w-64"
                  />
                  <Button className="ml-2">Xem giao dịch</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Create Tab */}
        <TabsContent value="create" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tạo giao dịch mới</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-w-md mx-auto">
                <WalletTransactionForm
                  walletId={selectedWalletId || 'default'}
                  onTransactionCreated={handleTransactionCreated}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
