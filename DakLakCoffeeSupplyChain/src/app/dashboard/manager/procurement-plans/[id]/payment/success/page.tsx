"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { checkPaymentStatus } from "@/lib/api/payments"; // Import hàm API của bạn
import { Loader2, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function PaymentReturnContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState("pending"); // Các trạng thái: pending | success | failed | timeout
  const [message, setMessage] = useState("Đang xác nhận thanh toán, vui lòng chờ...");

  useEffect(() => {
    // Chỉ chạy logic một lần khi component được mount
    if (status !== 'pending') return;

    // Lấy các tham số từ URL mà VNPay trả về
    const vnp_ResponseCode = searchParams.get("vnp_ResponseCode");
    const vnp_OrderInfo = searchParams.get("vnp_OrderInfo");

    // Trích xuất planId từ vnp_OrderInfo. BE phải đảm bảo format là "SomePrefix:planId"
    const planId = vnp_OrderInfo?.split(':')[1];

    if (!planId) {
      setStatus("failed");
      setMessage("Không tìm thấy mã kế hoạch. Giao dịch không thể được xác minh.");
      return;
    }

    // Nếu người dùng hủy hoặc giao dịch thất bại ngay tại cổng VNPay
    if (vnp_ResponseCode !== "00") {
      setStatus("failed");
      setMessage("Giao dịch đã bị hủy hoặc thất bại tại cổng thanh toán.");
      return;
    }

    // Bắt đầu kiểm tra trạng thái lặp lại (Polling) với backend
    const intervalId = setInterval(async () => {
      try {
        const res = await checkPaymentStatus(planId);
        if (res.paymentStatus === "Success") {
          setStatus("success");
          setMessage("Thanh toán thành công! Tự động chuyển trang sau 3 giây...");
          clearInterval(intervalId);
          setTimeout(() => router.push("/dashboard/manager/procurement-plans"), 3000);
        } else if (res.paymentStatus === "Failed") {
          setStatus("failed");
          setMessage("Thanh toán đã thất bại. Vui lòng thử lại.");
          clearInterval(intervalId);
        }
        // Nếu trạng thái vẫn là "Pending", không làm gì cả và đợi lần kiểm tra tiếp theo
      } catch (error) {
        console.error("Lỗi khi kiểm tra trạng thái thanh toán:", error);
        // Có thể thêm xử lý lỗi ở đây nếu muốn
      }
    }, 3000); // Lặp lại mỗi 3 giây

    // Dừng polling sau 45 giây để tránh lặp vô hạn
    const timeoutId = setTimeout(() => {
      // Chỉ cập nhật trạng thái nếu nó vẫn đang là pending
      setStatus(currentStatus => {
        if (currentStatus === 'pending') {
          setMessage("Giao dịch của bạn đang được xử lý. Hệ thống sẽ cập nhật và thông báo cho bạn sau.");
          clearInterval(intervalId);
          return "timeout";
        }
        return currentStatus;
      });
    }, 45000);

    // Cleanup function: Dừng interval khi component bị unmount
    return () => {
      clearInterval(intervalId);
      clearTimeout(timeoutId);
    };
  }, [searchParams, router, status]); // Thêm 'status' để tránh chạy lại effect không cần thiết

  const renderStatus = () => {
    switch (status) {
      case "success":
        return <CheckCircle className="w-16 h-16 text-green-500" />;
      case "failed":
        return <XCircle className="w-16 h-16 text-red-500" />;
      case "timeout":
        return <AlertTriangle className="w-16 h-16 text-yellow-500" />;
      default: // pending
        return <Loader2 className="w-16 h-16 animate-spin text-blue-500" />;
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle>Kết quả thanh toán</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4 p-6">
          {renderStatus()}
          <p className="text-lg">{message}</p>
          {(status === 'failed' || status === 'timeout') && (
            <Button onClick={() => router.push('/dashboard/manager/procurement-plans')}>
              Về trang quản lý
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


// Component cha sử dụng Suspense để đảm bảo useSearchParams hoạt động đúng
export default function PaymentReturnPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Đang tải...</div>}>
      <PaymentReturnContent />
    </Suspense>
  )
}
