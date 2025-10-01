"use client";

import { useEffect, useMemo, useState } from "react";
import { getPaymentHistory, PaymentHistory } from "@/lib/api/payments";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { formatDateTimeVN } from "@/lib/utils";

const currencyFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

const statusVariantMap: Record<string, string> = {
  success: "bg-green-100 text-green-700 border-green-200",
  pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
  failed: "bg-red-100 text-red-700 border-red-200",
};

function renderStatusBadge(status: string) {
  const normalized = status?.toLowerCase() ?? "";
  const variant = statusVariantMap[normalized] ?? "bg-slate-100 text-slate-700 border-slate-200";

  let label = status;
  if (normalized === "success") label = "Thành công";
  else if (normalized === "pending") label = "Đang xử lý";
  else if (normalized === "failed") label = "Thất bại";

  return <Badge className={variant}>{label || "Không xác định"}</Badge>;
}

export default function PaymentHistoryPage() {
  const [items, setItems] = useState<PaymentHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getPaymentHistory();
      setItems(data);
    } catch (err) {
      console.error("Failed to load payment history", err);
      setError("Không thể tải lịch sử thanh toán. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const totalAmount = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.paymentAmount || 0), 0);
  }, [items]);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Lịch sử thanh toán</h1>
          <p className="text-gray-600">Theo dõi tất cả khoản thanh toán đã thực hiện trên hệ thống.</p>
        </div>
        <Button variant="outline" onClick={loadHistory} disabled={loading} className="w-fit">
          <RefreshCw className={"mr-2 h-4 w-4" + (loading ? " animate-spin" : "")} />
          Làm mới
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Tổng số giao dịch</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{loading ? "..." : items.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Tổng số tiền</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{loading ? "..." : currencyFormatter.format(totalAmount)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Lịch sử thanh toán gần đây</CardTitle>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã thanh toán</TableHead>
                <TableHead>Mục đích</TableHead>
                <TableHead>Phương thức</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Số tiền</TableHead>
                <TableHead>Tạo lúc</TableHead>
                <TableHead>Hoàn tất lúc</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-gray-500">
                    Đang tải dữ liệu...
                  </TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-gray-500">
                    Chưa có giao dịch thanh toán nào.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow key={item.paymentId}>
                    <TableCell className="font-medium">{item.paymentCode}</TableCell>
                    <TableCell>{item.paymentPurpose || "-"}</TableCell>
                    <TableCell>{item.paymentMethod || "-"}</TableCell>
                    <TableCell>{renderStatusBadge(item.paymentStatus)}</TableCell>
                    <TableCell>{currencyFormatter.format(item.paymentAmount || 0)}</TableCell>
                    <TableCell>{formatDateTimeVN(item.createdAt)}</TableCell>
                    <TableCell>{item.paymentTime ? formatDateTimeVN(item.paymentTime) : "Chưa cập nhật"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
