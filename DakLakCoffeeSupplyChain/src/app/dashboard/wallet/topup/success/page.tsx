'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, Loader2, ArrowLeft, Wallet } from 'lucide-react';
import { toast } from 'sonner';

// ✅ mới: FE chỉ confirm với BE rồi đọc ví
import { confirmVnPayReturn } from '@/lib/api/payments';
import { getMyWallet } from '@/lib/api/wallet';

function WalletTopupSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transactionData, setTransactionData] = useState<{ amount: number; newBalance: number } | null>(null);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        // Gom chỉ tham số vnp_* từ URL
        const vnp = new URLSearchParams();
        searchParams.forEach((v, k) => {
          if (k.startsWith('vnp_')) vnp.append(k, v);
        });

        const vnpAmount = vnp.get('vnp_Amount');
        const amount = vnpAmount ? parseInt(vnpAmount, 10) / 100 : 0;

        // ✅ Gọi BE /Payments/vnpay/return để xác thực chữ ký & finalize
        const res = await confirmVnPayReturn(vnp); // { code, message }

        if (!cancelled && res.code === '00') {
          // Thành công: đọc số dư mới từ BE (IPN/Return đã ghi DB)
          const wallet = await getMyWallet();
          setSuccess(true);
          setTransactionData({
            amount,
            newBalance: wallet?.totalBalance ?? 0,
          });
          toast.success('Nạp tiền vào ví thành công!');
        } else if (!cancelled) {
          setError(res.message || 'Thanh toán thất bại hoặc bị hủy');
          toast.error('Thanh toán thất bại');
        }
      } catch (err: any) {
        if (!cancelled) {
          console.error('Lỗi xử lý thanh toán:', err);
          setError(err?.message || 'Có lỗi xảy ra khi xử lý thanh toán');
          toast.error('Có lỗi xảy ra khi xử lý thanh toán');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
              <h2 className="text-xl font-semibold">Đang xử lý thanh toán...</h2>
              <p className="text-gray-600 text-center">
                Vui lòng chờ trong giây lát, chúng tôi đang xử lý giao dịch của bạn.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {success ? (
            <>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl text-green-600">Thanh toán thành công!</CardTitle>
              <CardDescription>Giao dịch nạp tiền vào ví đã được xử lý thành công</CardDescription>
            </>
          ) : (
            <>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
              <CardTitle className="text-2xl text-red-600">Thanh toán thất bại</CardTitle>
              <CardDescription>{error || 'Có lỗi xảy ra trong quá trình thanh toán'}</CardDescription>
            </>
          )}
        </CardHeader>

        <CardContent className="space-y-6">
          {success && transactionData && (
            <div className="space-y-4">
              <div className="rounded-lg bg-green-50 p-4">
                <div className="flex items-center space-x-2 text-green-800">
                  <Wallet className="h-5 w-5" />
                  <span className="font-medium">Chi tiết giao dịch</span>
                </div>
                <div className="mt-2 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Số tiền nạp:</span>
                    <span className="font-medium">{formatCurrency(transactionData.amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Số dư mới:</span>
                    <span className="font-medium text-green-600">
                      {formatCurrency(transactionData.newBalance)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col space-y-3">
            <Button onClick={() => router.push('/dashboard')} className="w-full">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Về trang chủ
            </Button>

            {success && (
              <Button variant="outline" onClick={() => router.push('/dashboard/wallet')} className="w-full">
                <Wallet className="h-4 w-4 mr-2" />
                Xem ví của tôi
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
            <h2 className="text-xl font-semibold">Đang tải...</h2>
            <p className="text-gray-600 text-center">Vui lòng chờ trong giây lát.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function WalletTopupSuccessPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <WalletTopupSuccessContent />
    </Suspense>
  );
}
