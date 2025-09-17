'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createWallet, getMyWallet } from '@/lib/api/wallet';
import { toast } from 'sonner';

export default function TestWalletPage() {
  const [loading, setLoading] = useState(false);

  const handleCreateWallet = async () => {
    setLoading(true);
    try {
      const result = await createWallet({
        userId: '', // Backend sẽ lấy từ token
        walletType: 'Business',
        totalBalance: 0
      });
      
      console.log('Tạo ví thành công:', result);
      toast.success('Tạo ví thành công!');
    } catch (error: any) {
      console.error('Lỗi tạo ví:', error);
      toast.error(error.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  const handleGetWallet = async () => {
    setLoading(true);
    try {
      const result = await getMyWallet();
      
      console.log('Thông tin ví:', result);
      toast.success('Lấy thông tin ví thành công!');
    } catch (error: any) {
      console.error('Lỗi lấy ví:', error);
      toast.error(error.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Test Wallet Functions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={handleCreateWallet}
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Đang xử lý...' : 'Tạo ví test'}
          </Button>
          
          <Button 
            onClick={handleGetWallet}
            disabled={loading}
            variant="outline"
            className="w-full"
          >
            {loading ? 'Đang xử lý...' : 'Lấy thông tin ví'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
