"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { checkPaymentStatus, confirmVnPayReturn } from "@/lib/api/payments"; // <<< thêm import
import { Loader2, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function PaymentReturnContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"pending" | "success" | "failed" | "timeout">("pending");
  const [message, setMessage] = useState("Đang xác nhận thanh toán, vui lòng chờ...");

  useEffect(() => {
    if (status !== "pending") return;

    const planId = searchParams.get("planId");
    const vnp_ResponseCode = searchParams.get("vnp_ResponseCode");

    if (!planId) {
      setStatus("failed");
      setMessage("Không tìm thấy kế hoạch (planId). Không thể xác minh thanh toán.");
      return;
    }

    // 1) Gọi callback return trên BE để xác nhận giao dịch (idempotent)
    (async () => {
      try {
        await confirmVnPayReturn(window.location.search);
      } catch (e) {
        // Không fail flow chỉ vì confirm lỗi tạm thời; vẫn poll tiếp
        console.warn("VNPay return confirm error (ignored):", e);
      }
    })();

    // Nếu user hủy/thất bại ở cổng VNPay -> báo luôn
    if (vnp_ResponseCode && vnp_ResponseCode !== "00") {
      setStatus("failed");
      setMessage("Giao dịch đã bị hủy hoặc thất bại tại cổng thanh toán.");
      return;
    }

    // 2) Poll trạng thái planId
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
        // Pending -> đợi poll tiếp
      } catch (e) {
        console.error("Lỗi khi kiểm tra trạng thái thanh toán:", e);
        // để poll tiếp, tránh false-fail do mạng
      }
    }, 3000);

    // 3) Timeout dừng poll
    const timeoutId = setTimeout(() => {
      setStatus(cur => {
        if (cur === "pending") {
          clearInterval(intervalId);
          setMessage("Giao dịch đang được xử lý. Hệ thống sẽ cập nhật và thông báo cho bạn sau.");
          return "timeout";
        }
        return cur;
      });
    }, 45000);

    return () => {
      clearInterval(intervalId);
      clearTimeout(timeoutId);
    };
  }, [searchParams, router, status]);

  const Icon = status === "success" ? CheckCircle
    : status === "failed" ? XCircle
      : status === "timeout" ? AlertTriangle
        : Loader2;

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-md text-center">
        <CardHeader><CardTitle>Kết quả thanh toán</CardTitle></CardHeader>
        <CardContent className="flex flex-col items-center gap-4 p-6">
          <Icon className={`w-16 h-16 ${status === "pending" ? "animate-spin text-blue-500" : status === "success" ? "text-green-500" : status === "failed" ? "text-red-500" : "text-yellow-500"}`} />
          <p className="text-lg">{message}</p>
          {(status === "failed" || status === "timeout") && (
            <Button onClick={() => router.push('/dashboard/manager/procurement-plans')}>
              Về trang quản lý
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function PaymentReturnPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Đang tải...</div>}>
      <PaymentReturnContent />
    </Suspense>
  );
}
