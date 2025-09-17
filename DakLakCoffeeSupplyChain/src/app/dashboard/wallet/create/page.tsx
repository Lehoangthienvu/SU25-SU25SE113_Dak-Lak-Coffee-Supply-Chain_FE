'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Wallet, Plus, ArrowLeft } from 'lucide-react';
import { createWallet } from '@/lib/api/wallet';
import { toast } from 'sonner';

export default function CreateWalletPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [walletData, setWalletData] = useState({
    walletType: 'Business',
    totalBalance: 0
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setLoading(true);
    try {
      // Lấy userId từ localStorage hoặc token
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Vui lòng đăng nhập lại');
        router.push('/auth/login');
        return;
      }

      // Tạo ví với userId = null, backend sẽ lấy từ token
      await createWallet({
        userId: '', // Backend sẽ lấy userId từ JWT token
        walletType: walletData.walletType,
        totalBalance: walletData.totalBalance
      });

      toast.success('Tạo ví thành công!');
      router.push('/dashboard/wallet');
    } catch (error: any) {
      console.error('Lỗi tạo ví:', error);
      toast.error(error.message || 'Có lỗi xảy ra khi tạo ví');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-8">
        <Button 
          variant="outline" 
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Quay lại
        </Button>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Tạo ví mới</h1>
        <p className="text-gray-600">Tạo ví để quản lý số dư và thực hiện giao dịch</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Thông tin ví
          </CardTitle>
          <CardDescription>
            Điền thông tin để tạo ví mới cho tài khoản của bạn
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="walletType">Loại ví</Label>
              <Input
                id="walletType"
                value={walletData.walletType}
                onChange={(e) => setWalletData(prev => ({ ...prev, walletType: e.target.value }))}
                placeholder="Nhập loại ví (Business, Personal, Trading)"
              />
              <p className="text-sm text-gray-500">
                Mặc định: Business - Ví doanh nghiệp
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="totalBalance">Số dư ban đầu (VND)</Label>
              <Input
                id="totalBalance"
                type="number"
                min="0"
                value={walletData.totalBalance}
                onChange={(e) => setWalletData(prev => ({ 
                  ...prev, 
                  totalBalance: parseFloat(e.target.value) || 0 
                }))}
                placeholder="Nhập số dư ban đầu (có thể để 0)"
              />
              <p className="text-sm text-gray-500">
                Bạn có thể nạp tiền vào ví sau khi tạo thành công
              </p>
            </div>

            <div className="flex gap-4 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => router.back()}
                className="flex-1"
              >
                Hủy
              </Button>
              <Button 
                type="submit" 
                disabled={loading}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Đang tạo...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Tạo ví
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
