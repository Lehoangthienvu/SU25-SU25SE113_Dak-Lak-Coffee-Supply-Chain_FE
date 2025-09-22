"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreditCard, Clock, AlertCircle, CheckCircle2, Wallet } from "lucide-react";
import { createVnPayUrl, processWalletPayment } from "@/lib/api/payments";
import { AppToast } from "@/components/ui/AppToast";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface PaymentNotificationData {
  planId: string;
  amount: number;
  planTitle: string;
}

function PaymentNotificationContent() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [paymentData, setPaymentData] = useState<PaymentNotificationData | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>('VNPay');

  useEffect(() => {
    // Lấy dữ liệu từ URL params
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
      // Nếu không có params, chuyển về trang danh sách
      router.push("/dashboard/manager/procurement-plans");
    }
  }, [searchParams, router]);

  const handleProceedToPayment = async () => {
    if (!paymentData) return;

    setLoading(true);
    try {
      if (paymentMethod === 'VNPay') {
        // Thanh toán qua VNPay
        const returnUrl = `${window.location.origin}/dashboard/manager/procurement-plans/payment-result`;
        const url = await createVnPayUrl({
          planId: paymentData.planId,
          returnUrl
        });

        if (url) {
          // Chuyển đến VNPay sandbox
          window.location.href = url;
        } else {
          AppToast.error("Không thể tạo URL thanh toán");
        }
      } else {
        // Thanh toán qua ví nội bộ
        const result = await processWalletPayment({
          planId: paymentData.planId,
          amount: paymentData.amount,
          description: `Thanh toán phí đăng ký kế hoạch: ${paymentData.planTitle}`
        });

        if (result.success) {
          AppToast.success("Thanh toán thành công! Kế hoạch đã được kích hoạt.");
          // Chuyển về trang danh sách kế hoạch
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

  const handleCancel = () => {
    router.push("/dashboard/manager/procurement-plans");
  };

  if (!paymentData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="shadow-lg border-0">
          <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-t-xl">
            <div className="flex items-center space-x-3">
              <CreditCard className="h-8 w-8" />
              <div>
                <CardTitle className="text-2xl font-bold">
                  Xác nhận thanh toán
                </CardTitle>
                <p className="text-blue-100 mt-1">
                  Vui lòng xác nhận thông tin thanh toán trước khi chuyển đến VNPay
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-8">
            <div className="space-y-6">
              {/* Thông tin kế hoạch */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
                  Thông tin kế hoạch thu mua
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tên kế hoạch:</span>
                    <span className="font-medium">{paymentData.planTitle}</span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Chọn phương thức thanh toán */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <CreditCard className="h-5 w-5 text-blue-500 mr-2" />
                  Phương thức thanh toán
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Chọn phương thức thanh toán
                    </label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Chọn phương thức thanh toán" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="VNPay">
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4" />
                            VNPay (Ngân hàng)
                          </div>
                        </SelectItem>
                        <SelectItem value="Wallet">
                          <div className="flex items-center gap-2">
                            <Wallet className="h-4 w-4" />
                            Ví nội bộ
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Thông tin thanh toán */}
              <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <AlertCircle className="h-5 w-5 text-amber-500 mr-2" />
                  Thông tin thanh toán
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Phí đăng ký:</span>
                    <span className="font-bold text-lg text-amber-600">
                      {paymentData.amount.toLocaleString("vi-VN")} VNĐ
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Phương thức:</span>
                    <span className="font-medium">
                      {paymentMethod === 'VNPay' ? 'VNPay (Ngân hàng)' : 'Ví nội bộ'}
                    </span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Lưu ý */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                  <Clock className="h-5 w-5 text-blue-500 mr-2" />
                  Lưu ý quan trọng
                </h3>
                <ul className="text-sm text-gray-700 space-y-1">
                  {paymentMethod === 'VNPay' ? (
                    <>
                      <li>• Bạn sẽ được chuyển đến trang thanh toán VNPay</li>
                      <li>• Sử dụng thông tin thẻ test để thanh toán</li>
                      <li>• Sau khi thanh toán thành công, kế hoạch sẽ được kích hoạt</li>
                      <li>• Nếu thanh toán thất bại, bạn có thể thử lại</li>
                    </>
                  ) : (
                    <>
                      <li>• Số tiền sẽ được trừ trực tiếp từ ví nội bộ của bạn</li>
                      <li>• Đảm bảo ví có đủ số dư để thanh toán</li>
                      <li>• Sau khi thanh toán thành công, kế hoạch sẽ được kích hoạt</li>
                      <li>• Giao dịch sẽ được ghi nhận trong lịch sử ví</li>
                    </>
                  )}
                </ul>
              </div>

              {/* Nút hành động */}
              <div className="flex space-x-4 pt-4">
                <Button
                  onClick={handleProceedToPayment}
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {loading ? (
                    <>
                      <div className="mr-2 h-4 w-4">
                        <LoadingSpinner />
                      </div>
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      {paymentMethod === 'VNPay' ? (
                        <CreditCard className="mr-2 h-4 w-4" />
                      ) : (
                        <Wallet className="mr-2 h-4 w-4" />
                      )}
                      {paymentMethod === 'VNPay' ? 'Thanh toán VNPay' : 'Thanh toán ví'}
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  className="flex-1"
                >
                  Hủy bỏ
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function PaymentNotificationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4">
            <LoadingSpinner />
          </div>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    }>
      <PaymentNotificationContent />
    </Suspense>
  );
}
