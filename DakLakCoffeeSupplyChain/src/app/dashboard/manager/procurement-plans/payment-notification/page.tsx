"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreditCard, Wallet, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { createVnPayUrl, processWalletPayment } from "@/lib/api/payments";
import { AppToast } from "@/components/ui/AppToast";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { Separator } from "@/components/ui/separator";

interface PaymentNotificationData {
  planId: string;
  amount: number;
  planTitle: string;
}

function PaymentNotificationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [paymentData, setPaymentData] = useState<PaymentNotificationData | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>('VNPay');

  useEffect(() => {
    const planId = searchParams.get("planId");
    const amount = searchParams.get("amount");
    const planTitle = searchParams.get("planTitle");

    if (planId && amount && planTitle) {
      setPaymentData({
        planId,
        amount: parseInt(amount),
        planTitle: decodeURIComponent(planTitle)
      });
    } else {
      router.push("/dashboard/manager/procurement-plans");
    }
  }, [searchParams, router]);

  const handleProceedToPayment = async () => {
    if (!paymentData) return;

    setLoading(true);
    try {
      if (paymentMethod === 'VNPay') {
        // <<< SỬA LẠI ĐÚNG ĐƯỜNG DẪN TẠI ĐÂY >>>
        const returnUrl = `${window.location.origin}/dashboard/manager/procurement-plans/payment-result?planId=${paymentData.planId}`;;

        const url = await createVnPayUrl({
          planId: paymentData.planId,
          returnUrl
        });

        if (url) {
          window.location.href = url;
        } else {
          AppToast.error("Không thể tạo URL thanh toán");
        }
      } else {
        const result = await processWalletPayment({
          planId: paymentData.planId,
          amount: paymentData.amount,
          description: `Thanh toán phí đăng ký kế hoạch: ${paymentData.planTitle}`
        });

        if (result.success) {
          AppToast.success("Thanh toán thành công! Kế hoạch đã được kích hoạt.");
          router.push("/dashboard/manager/procurement-plans");
        } else {
          AppToast.error(result.message || "Thanh toán thất bại");
        }
      }
    } catch (error) {
      console.error("Lỗi xử lý thanh toán:", error);
      AppToast.error("Có lỗi xảy ra khi xử lý thanh toán");
    } finally {
      setLoading(false);
    }
  };

  if (!paymentData) {
    return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner /></div>;
  }

  return (
    <div className="min-h-screen py-8 bg-gray-50">
      <div className="max-w-2xl mx-auto px-4">
        <Card className="shadow-lg border-0">
          {/* Card Header */}
          <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-t-xl">
            <div className="flex items-center space-x-3">
              <CreditCard className="h-8 w-8" />
              <div>
                <CardTitle className="text-2xl font-bold">Xác nhận thanh toán</CardTitle>
                <p className="text-blue-100 mt-1">Vui lòng xác nhận thông tin trước khi thanh toán.</p>
              </div>
            </div>
          </CardHeader>

          {/* Card Content */}
          <CardContent className="p-8 space-y-6">
            {/* Plan Info */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
                Thông tin kế hoạch
              </h3>
              <div className="flex justify-between">
                <span className="text-gray-600">Tên kế hoạch:</span>
                <span className="font-medium text-right">{paymentData.planTitle}</span>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <CreditCard className="h-5 w-5 text-blue-500 mr-2" />
                Phương thức thanh toán
              </h3>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="VNPay"><div className="flex items-center gap-2"><CreditCard className="h-4 w-4" />VNPay (Ngân hàng)</div></SelectItem>
                  <SelectItem value="Wallet"><div className="flex items-center gap-2"><Wallet className="h-4 w-4" />Ví nội bộ</div></SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Amount */}
            <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <AlertCircle className="h-5 w-5 text-amber-500 mr-2" />
                Thông tin thanh toán
              </h3>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Phí đăng ký:</span>
                <span className="font-bold text-lg text-amber-600">
                  {paymentData.amount.toLocaleString("vi-VN")} VNĐ
                </span>
              </div>
            </div>

            <Separator />

            {/* Action Buttons */}
            <div className="flex space-x-4 pt-4">
              <Button onClick={() => router.push("/dashboard/manager/procurement-plans")} variant="outline" className="flex-1">Hủy bỏ</Button>
              <Button onClick={handleProceedToPayment} disabled={loading} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                {loading ? <LoadingSpinner /> : (paymentMethod === 'VNPay' ? 'Tiếp tục với VNPay' : 'Thanh toán bằng ví')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function PaymentNotificationPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><LoadingSpinner /></div>}>
      <PaymentNotificationContent />
    </Suspense>
  );
}
