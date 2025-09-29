'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createWalletTopupVnPayUrl, getMyWallet } from '@/lib/api/wallet';
import { toast } from 'sonner';

export default function TestTopupPage() {
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState('100000');
  const [walletId, setWalletId] = useState('');

  const handleGetWallet = async () => {
    setLoading(true);
    try {
      const result = await getMyWallet();
      setWalletId(result.walletId);
      toast.success('Lấy thông tin ví thành công!');
    } catch (error: any) {
      console.error('Lỗi lấy ví:', error);
      toast.error(error.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTopupUrl = async () => {
    if (!walletId) {
      toast.error('Vui lòng lấy thông tin ví trước');
      return;
    }

    setLoading(true);
    try {
      const result = await createWalletTopupVnPayUrl({
        walletId: walletId,
        amount: parseFloat(amount),
        description: 'Test nạp tiền',
        // returnUrl: `${window.location.origin}/dashboard/wallet/topup/success` // ← XÓA để dùng appsettings
      });
      
      console.log('Tạo URL thành công:', result);
      toast.success('Tạo URL thành công!');
      
      // Chuyển đến VNPay
      window.location.href = result;
    } catch (error: any) {
      console.error('Lỗi tạo URL:', error);
      toast.error(error.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Test Wallet Topup</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Wallet ID</Label>
            <Input
              value={walletId}
              onChange={(e) => setWalletId(e.target.value)}
              placeholder="Wallet ID sẽ được lấy tự động"
            />
            <Button 
              onClick={handleGetWallet}
              disabled={loading}
              variant="outline"
              className="w-full"
            >
              {loading ? 'Đang xử lý...' : 'Lấy thông tin ví'}
            </Button>
          </div>

          <div className="space-y-2">
            <Label>Số tiền (VND)</Label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Nhập số tiền"
            />
          </div>
          
          <Button 
            onClick={handleCreateTopupUrl}
            disabled={loading || !walletId}
            className="w-full"
          >
            {loading ? 'Đang xử lý...' : 'Tạo VNPay URL'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
