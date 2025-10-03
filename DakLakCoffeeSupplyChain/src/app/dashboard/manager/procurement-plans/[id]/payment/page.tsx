"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, CreditCard, AlertCircle, CheckCircle, Wallet } from 'lucide-react';
import { createVnPayUrl, getPlanPostingFee, processWalletPayment } from '@/lib/api/payments';
import { getProcurementPlanById } from '@/lib/api/procurementPlans';
import { ProcurementPlan } from '@/lib/api/procurementPlans';
import { AppToast } from '@/components/ui/AppToast';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function PaymentPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [plan, setPlan] = useState<ProcurementPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [amount, setAmount] = useState(100000);
  const [paymentMethod, setPaymentMethod] = useState<string>('VNPay');

  useEffect(() => {
    if (!id) return;

    const loadData = async () => {
      try {
        const amountParam = searchParams.get('amount');
        if (amountParam) {
          setAmount(parseInt(amountParam));
        } else {
          const feeInfo = await getPlanPostingFee(id as string);
          setAmount(feeInfo.amount);
        }

        const planData = await getProcurementPlanById(id as string);
        setPlan(planData);
      } catch (error) {
        AppToast.error('Không thể tải thông tin kế hoạch');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, searchParams]);

  const handlePayment = async () => {
    if (!id) return;

    try {
      setProcessing(true);

      if (paymentMethod === 'VNPay') {
        // <<< THAY ĐỔI QUAN TRỌNG Ở ĐÂY >>>
        // URL này trỏ đến trang mới có logic polling, không phải trang 'success' tĩnh
        const returnUrlForUser = `${window.location.origin}/dashboard/manager/procurement-plans/payment-result?planId=${id}`;

        const paymentUrl = await createVnPayUrl({
          planId: id as string,
          returnUrl: returnUrlForUser, // Sử dụng URL đã sửa
          locale: 'vn'
        });

        window.location.href = paymentUrl;
      } else {
        // Thanh toán qua ví nội bộ (giữ nguyên)
        const result = await processWalletPayment({
          planId: id as string,
          amount: amount,
          description: `Thanh toán phí đăng ký kế hoạch: ${plan?.title || 'N/A'}`
        });

        if (result.success) {
          AppToast.success("Thanh toán thành công! Kế hoạch đã được kích hoạt.");
          router.push("/dashboard/manager/procurement-plans");
        } else {
          AppToast.error(result.message || "Thanh toán thất bại");
        }
      }
    } catch (error) {
      AppToast.error('Không thể xử lý thanh toán');
      console.error(error);
    } finally {
      setProcessing(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Không tìm thấy kế hoạch</h2>
          <p className="text-gray-600 mb-4">Kế hoạch này không tồn tại hoặc bạn không có quyền truy cập.</p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Thanh toán phí đăng ký</h1>
          <p className="text-gray-600">Thanh toán để mở đăng ký cho kế hoạch thu mua</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Thông tin kế hoạch */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Thông tin kế hoạch
            </CardTitle>
            <CardDescription>
              Chi tiết kế hoạch cần thanh toán
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Tên kế hoạch</label>
              <p className="text-lg font-semibold text-gray-900">{plan.title}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">Mã kế hoạch</label>
              <p className="text-sm text-gray-900 font-mono">{plan.planId}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">Trạng thái hiện tại</label>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                {plan.status === 'Draft' ? 'Bản nháp' : plan.status}
              </span>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">Tổng sản lượng</label>
              <p className="text-sm text-gray-900">{plan.totalQuantity?.toLocaleString()} kg</p>
            </div>
          </CardContent>
        </Card>

        {/* Thông tin thanh toán */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-blue-500" />
              Thông tin thanh toán
            </CardTitle>
            <CardDescription>
              Chi phí và phương thức thanh toán
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-600">Phí đăng ký kế hoạch</span>
                <span className="text-lg font-bold text-red-600">
                  {formatCurrency(amount)}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                Phí này được tính một lần để mở đăng ký cho kế hoạch
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Phương thức thanh toán</h4>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="VNPay">VNPay (Ngân hàng)</option>
                <option value="Wallet">Ví nội bộ</option>
              </select>

              <div className={`flex items-center gap-3 p-3 border rounded-lg ${paymentMethod === 'VNPay' ? 'bg-blue-50 border-blue-200' : 'bg-green-50 border-green-200'
                }`}>
                {paymentMethod === 'VNPay' ? (
                  <>
                    <CreditCard className="h-6 w-6 text-blue-600" />
                    <div>
                      <p className="font-medium text-blue-900">VNPay</p>
                      <p className="text-sm text-blue-700">Thanh toán trực tuyến an toàn</p>
                    </div>
                  </>
                ) : (
                  <>
                    <Wallet className="h-6 w-6 text-green-600" />
                    <div>
                      <p className="font-medium text-green-900">Ví nội bộ</p>
                      <p className="text-sm text-green-700">Thanh toán trực tiếp từ ví</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="pt-4">
              <Button
                onClick={handlePayment}
                disabled={processing}
                className={`w-full text-white ${paymentMethod === 'VNPay'
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-green-600 hover:bg-green-700'
                  }`}
                size="lg"
              >
                {processing ? (
                  <>
                    <div className="h-4 w-4 mr-2">
                      <LoadingSpinner />
                    </div>
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    {paymentMethod === 'VNPay' ? (
                      <CreditCard className="h-4 w-4 mr-2" />
                    ) : (
                      <Wallet className="h-4 w-4 mr-2" />
                    )}
                    {paymentMethod === 'VNPay' ? 'Thanh toán VNPay' : 'Thanh toán ví'}
                  </>
                )}
              </Button>

              <p className="text-xs text-gray-500 text-center mt-2">
                {paymentMethod === 'VNPay'
                  ? 'Bạn sẽ được chuyển đến trang thanh toán VNPay'
                  : 'Số tiền sẽ được trừ trực tiếp từ ví nội bộ của bạn'
                }
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lưu ý */}
      <Card className="mt-6">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
            <div>
              <h4 className="font-medium text-gray-900 mb-1">Lưu ý quan trọng</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Sau khi thanh toán thành công, kế hoạch sẽ tự động chuyển sang trạng thái "Mở"</li>
                <li>• Nông dân sẽ có thể đăng ký tham gia kế hoạch này</li>
                <li>• Kế hoạch sau khi mở sẽ không thể chỉnh sửa được nữa</li>
                <li>• Nếu có vấn đề với thanh toán, vui lòng liên hệ hỗ trợ</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
