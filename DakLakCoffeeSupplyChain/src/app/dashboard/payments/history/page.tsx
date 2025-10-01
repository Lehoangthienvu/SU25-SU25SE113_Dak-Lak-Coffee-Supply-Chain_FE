"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getPaymentHistory, PaymentHistory } from "@/lib/api/payments";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RefreshCw, Search } from "lucide-react";
import { formatDateTimeVN } from "@/lib/utils";
import { Pagination } from "@/components/processing/Pagination";

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

const statusFilters = [
  { value: "all", label: "Tất cả" },
  { value: "success", label: "Thành công" },
  { value: "pending", label: "Đang xử lý" },
  { value: "failed", label: "Thất bại" },
  { value: "other", label: "Khác" },
] as const;

type StatusFilter = (typeof statusFilters)[number]["value"];

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
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const itemsPerPage = 10;
  const router = useRouter();

  const loadHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getPaymentHistory();
      setItems(data);
      setCurrentPage(1);
      setStatusFilter("all");
      setSearchTerm("");
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

  const summary = useMemo(() => {
    const totals = {
      totalTransactions: 0,
      totalAmount: 0,
      success: { count: 0, amount: 0 },
      pending: { count: 0, amount: 0 },
      failed: { count: 0, amount: 0 },
      other: { count: 0, amount: 0 },
    };

    for (const item of items) {
      const amount = item.paymentAmount ?? 0;
      const status = item.paymentStatus?.toLowerCase() ?? "";

      totals.totalTransactions += 1;
      totals.totalAmount += amount;

      if (status === "success") {
        totals.success.count += 1;
        totals.success.amount += amount;
      } else if (status === "pending") {
        totals.pending.count += 1;
        totals.pending.amount += amount;
      } else if (status === "failed") {
        totals.failed.count += 1;
        totals.failed.amount += amount;
      } else {
        totals.other.count += 1;
        totals.other.amount += amount;
      }
    }

    return totals;
  }, [items]);

  const filteredItems = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return items.filter((item) => {
      const normalizedStatus = item.paymentStatus?.toLowerCase() ?? "";
      const isStandardStatus = ["success", "pending", "failed"].includes(normalizedStatus);
      const matchesStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "other"
          ? !isStandardStatus
          : normalizedStatus === statusFilter;

      if (!matchesStatus) return false;

      if (!normalizedSearch) return true;

      return (item.paymentCode || "").toLowerCase().includes(normalizedSearch);
    });
  }, [items, statusFilter, searchTerm]);

  const totalItems = filteredItems.length;
  const totalPages = useMemo(() => Math.max(1, Math.ceil(totalItems / itemsPerPage)), [totalItems, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchTerm]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredItems.slice(start, start + itemsPerPage);
  }, [filteredItems, currentPage, itemsPerPage]);

  const showOtherCard = summary.other.count > 0;

  const handleContinuePayment = (item: PaymentHistory) => {
    const planId = item.relatedEntityId;
    if (!planId) return;

    const amountQuery = item.paymentAmount ? `?amount=${item.paymentAmount}` : "";
    router.push(`/dashboard/manager/procurement-plans/${planId}/payment${amountQuery}`);
  };

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

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Tổng số giao dịch</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{loading ? "..." : summary.totalTransactions}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Tổng số tiền</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-3xl font-bold">
              {loading ? "..." : currencyFormatter.format(summary.totalAmount)}
            </div>
            {!loading && <p className="text-sm text-gray-500">Bao gồm tất cả trạng thái</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Tiền thành công</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-semibold">
              {loading ? "..." : currencyFormatter.format(summary.success.amount)}
            </div>
            {!loading && <p className="text-sm text-gray-500">Số giao dịch: {summary.success.count}</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Tiền đang xử lý</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-semibold">
              {loading ? "..." : currencyFormatter.format(summary.pending.amount)}
            </div>
            {!loading && <p className="text-sm text-gray-500">Số giao dịch: {summary.pending.count}</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Tiền thất bại</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-semibold">
              {loading ? "..." : currencyFormatter.format(summary.failed.amount)}
            </div>
            {!loading && <p className="text-sm text-gray-500">Số giao dịch: {summary.failed.count}</p>}
          </CardContent>
        </Card>
        {showOtherCard && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Tiền trạng thái khác</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <div className="text-2xl font-semibold">
                {loading ? "..." : currencyFormatter.format(summary.other.amount)}
              </div>
              {!loading && <p className="text-sm text-gray-500">Số giao dịch: {summary.other.count}</p>}
            </CardContent>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader className="space-y-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:gap-4">
              <div>
                <CardTitle>Lịch sử thanh toán gần đây</CardTitle>
                {error && <p className="text-sm text-red-600">{error}</p>}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {statusFilters.map(({ value, label }) => {
                  const active = statusFilter === value;
                  return (
                    <Button
                      key={value}
                      size="sm"
                      variant={active ? "default" : "outline"}
                      onClick={() => setStatusFilter(value)}
                      className={
                        active
                          ? "bg-orange-500 text-white shadow-sm border-orange-500"
                          : "border-orange-200 text-orange-600 hover:bg-orange-50 hover:border-orange-300"
                      }
                    >
                      {label}
                    </Button>
                  );
                })}
              </div>
            </div>
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Tìm theo mã thanh toán"
                className="w-full pl-9"
              />
              <p className="mt-1 text-xs text-gray-500">Tìm kiếm theo mã thanh toán (paymentCode).</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto space-y-4">
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
                <TableHead>Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-8 text-center text-gray-500">
                    Đang tải dữ liệu...
                  </TableCell>
                </TableRow>
              ) : paginatedItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-8 text-center text-gray-500">
                    {items.length === 0
                      ? "Chưa có giao dịch thanh toán nào."
                      : "Không có giao dịch phù hợp với bộ lọc."}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedItems.map((item) => {
                  const normalizedStatus = item.paymentStatus?.toLowerCase() ?? "";
                  const canContinue = normalizedStatus === "pending" && Boolean(item.relatedEntityId);

                  return (
                    <TableRow key={item.paymentId}>
                      <TableCell className="font-medium">{item.paymentCode}</TableCell>
                      <TableCell>{item.paymentPurpose || "-"}</TableCell>
                      <TableCell>{item.paymentMethod || "-"}</TableCell>
                      <TableCell>{renderStatusBadge(item.paymentStatus)}</TableCell>
                      <TableCell>{currencyFormatter.format(item.paymentAmount || 0)}</TableCell>
                      <TableCell>{formatDateTimeVN(item.createdAt)}</TableCell>
                      <TableCell>{item.paymentTime ? formatDateTimeVN(item.paymentTime) : "Chưa cập nhật"}</TableCell>
                      <TableCell>
                        {canContinue ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleContinuePayment(item)}
                            className="border-orange-200 text-orange-600 hover:bg-orange-50 hover:border-orange-300"
                          >
                            Tiếp tục thanh toán
                          </Button>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>

          {!loading && totalItems > itemsPerPage && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              itemsPerPage={itemsPerPage}
              totalItems={totalItems}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
