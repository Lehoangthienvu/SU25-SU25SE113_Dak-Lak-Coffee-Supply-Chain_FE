'use client';

import React, { useState } from 'react';
import WalletTransactionList from '@/components/wallet/WalletTransactionList';
import WalletTransactionStats from '@/components/wallet/WalletTransactionStats';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, 
  List, 
  Wallet
} from 'lucide-react';

export default function MyTransactionsPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleTransactionCreated = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Giao dịch của tôi</h1>
          <p className="text-gray-600 mt-1">
            Xem lịch sử và thống kê giao dịch ví của bạn
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="transactions" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="transactions" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            Lịch sử giao dịch
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Thống kê
          </TabsTrigger>
        </TabsList>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Lịch sử giao dịch</CardTitle>
            </CardHeader>
            <CardContent>
              <WalletTransactionList 
                key={refreshKey}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Statistics Tab */}
        <TabsContent value="stats" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Thống kê giao dịch</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Wallet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  Thống kê sẽ được hiển thị khi có giao dịch
                </p>
                <p className="text-sm text-gray-400 mt-2">
                  Liên hệ admin để xem thống kê chi tiết
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}