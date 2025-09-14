"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, XCircle, Clock, AlertTriangle, Home, RotateCcw } from "lucide-react";
import { AppToast } from "@/components/ui/AppToast";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

function PaymentResultContent() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [message, setMessage] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [amount, setAmount] = useState(0);

  useEffect(() => {
    const processPaymentResult = () => {
      try {
        // Lấy các tham số từ VNPay return URL
        const responseCode = searchParams.get("vnp_ResponseCode");
        const transactionId = searchParams.get("vnp_TransactionNo");
        const amount = searchParams.get("vnp_Amount");
        const secureHash = searchParams.get("vnp_SecureHash");

        if (!responseCode) {
          setMessage("Thiếu thông tin thanh toán");
          setIsSuccess(false);
          setLoading(false);
          return;
        }

        // Kiểm tra response code
        if (responseCode === "00") {
          setIsSuccess(true);
          setMessage("Thanh toán thành công");
          setTransactionId(transactionId || "");
          setAmount(amount ? parseInt(amount) / 100 : 0);
        } else {
          setIsSuccess(false);
          setMessage("Thanh toán thất bại");
          setTransactionId(transactionId || "");
          setAmount(amount ? parseInt(amount) / 100 : 0);
        }
      } catch (err) {
        console.error("Lỗi xử lý kết quả thanh toán:", err);
        setMessage("Có lỗi xảy ra khi xử lý kết quả thanh toán");
        setIsSuccess(false);
      } finally {
        setLoading(false);
      }
    };

    processPaymentResult();
  }, [searchParams]);

  const handleGoHome = () => {
    router.push("/dashboard/manager/procurement-plans");
  };

  const handleRetryPayment = () => {
    // Chuyển về trang tạo kế hoạch để thử lại
    router.push("/dashboard/manager/procurement-plans/create");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4">
            <LoadingSpinner />
          </div>
          <p className="text-gray-600">Đang xử lý kết quả thanh toán...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="shadow-lg border-0">
          <CardHeader className={`${isSuccess ? 'bg-green-500' : 'bg-red-500'} text-white rounded-t-xl`}>
            <div className="flex items-center space-x-3">
              {isSuccess ? (
                <CheckCircle2 className="h-8 w-8" />
              ) : (
                <XCircle className="h-8 w-8" />
              )}
              <div>
                <CardTitle className="text-2xl font-bold">
                  {isSuccess ? "Thanh toán thành công" : "Thanh toán thất bại"}
                </CardTitle>
                <p className={`${isSuccess ? 'text-green-100' : 'text-red-100'} mt-1`}>
                  {message}
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-8">
            <div className="space-y-6">
              {/* Thông tin giao dịch */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <Clock className="h-5 w-5 text-gray-500 mr-2" />
                  Thông tin giao dịch
                </h3>
                <div className="space-y-2">
                  {transactionId && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Mã giao dịch VNPay:</span>
                      <span className="font-mono text-sm">{transactionId}</span>
                    </div>
                  )}
                  {amount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Số tiền:</span>
                      <span className="font-bold text-lg">
                        {amount.toLocaleString("vi-VN")} VNĐ
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Trạng thái:</span>
                    <Badge 
                      variant={isSuccess ? "default" : "destructive"}
                      className={isSuccess ? "bg-green-100 text-green-800" : ""}
                    >
                      {isSuccess ? "Thành công" : "Thất bại"}
                    </Badge>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Thông báo tiếp theo */}
              <div className={`p-4 rounded-lg border ${isSuccess ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                  {isSuccess ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500 mr-2" />
                  )}
                  {isSuccess ? "Bước tiếp theo" : "Cần làm gì?"}
                </h3>
                <ul className="text-sm text-gray-700 space-y-1">
                  {isSuccess ? (
                    <>
                      <li>• Kế hoạch thu mua đã được kích hoạt thành công</li>
                      <li>• Bạn có thể quản lý kế hoạch trong danh sách</li>
                      <li>• Nông dân có thể đăng ký tham gia kế hoạch</li>
                    </>
                  ) : (
                    <>
                      <li>• Thanh toán không thành công, vui lòng thử lại</li>
                      <li>• Kiểm tra thông tin thẻ và số dư tài khoản</li>
                      <li>• Liên hệ hỗ trợ nếu vấn đề vẫn tiếp diễn</li>
                    </>
                  )}
                </ul>
              </div>

              {/* Nút hành động */}
              <div className="flex space-x-4 pt-4">
                <Button
                  onClick={handleGoHome}
                  className={`flex-1 ${isSuccess ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'} text-white`}
                >
                  <Home className="mr-2 h-4 w-4" />
                  {isSuccess ? "Xem kế hoạch" : "Về trang chủ"}
                </Button>
                {!isSuccess && (
                  <Button
                    onClick={handleRetryPayment}
                    variant="outline"
                    className="flex-1"
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Thử lại
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function PaymentResultPage() {
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
      <PaymentResultContent />
    </Suspense>
  );
}
