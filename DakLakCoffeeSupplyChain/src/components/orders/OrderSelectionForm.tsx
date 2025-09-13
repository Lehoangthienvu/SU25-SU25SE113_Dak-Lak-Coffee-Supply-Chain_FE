"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import {
  getAllOrders,
  type OrderViewAllDto,
} from "@/lib/api/orders";
import { OrderStatus } from "@/lib/constants/orderStatus";

type Props = {
  onOrderSelect: (orderId: string) => void;
  onBack: () => void;
};

export default function OrderSelectionForm({
  onOrderSelect,
  onBack,
}: Props) {
  const router = useRouter();
  const [orders, setOrders] = useState<OrderViewAllDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("orderDate");

  // Load orders
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const allOrders = await getAllOrders();
        setOrders(allOrders ?? []);
      } catch (error) {
        console.error("Lỗi khi tải danh sách đơn hàng:", error);
        toast.error("Lỗi khi tải danh sách đơn hàng");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Filter and sort orders
  const filteredOrders = React.useMemo(() => {
    let filtered = orders;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.orderCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.deliveryBatchCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.contractNumber?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter) {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    // Sort orders
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "orderDate":
          return new Date(b.orderDate || "").getTime() - new Date(a.orderDate || "").getTime();
        case "deliveryBatchCode":
          return (a.deliveryBatchCode || "").localeCompare(b.deliveryBatchCode || "");
        case "status":
          return (a.status || "").localeCompare(b.status || "");
        case "totalAmount":
          return (b.totalAmount || 0) - (a.totalAmount || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [orders, searchTerm, statusFilter, sortBy]);

  const getStatusBadge = (status: OrderStatus) => {
    const statusConfig = {
      [OrderStatus.Pending]: { label: "Chờ xử lý", className: "bg-yellow-100 text-yellow-800" },
      [OrderStatus.Preparing]: { label: "Đang chuẩn bị", className: "bg-blue-100 text-blue-800" },
      [OrderStatus.Shipped]: { label: "Đã xuất hàng", className: "bg-purple-100 text-purple-800" },
      [OrderStatus.Delivered]: { label: "Đã giao hàng", className: "bg-green-100 text-green-800" },
      [OrderStatus.Cancelled]: { label: "Đã hủy", className: "bg-red-100 text-red-800" },
      [OrderStatus.Failed]: { label: "Giao thất bại", className: "bg-gray-100 text-gray-800" },
    };

    const config = statusConfig[status] || { label: status, className: "bg-gray-100 text-gray-800" };
    return (
      <Badge className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  const formatCurrency = (amount: number | null | undefined) => {
    if (!amount) return "—";
    return new Intl.NumberFormat("vi-VN").format(amount);
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto bg-white border rounded-lg shadow p-6">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-gray-600">Đang tải danh sách đơn hàng...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto bg-white border rounded-lg shadow p-6">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Chọn đơn hàng</h1>
        <p className="text-gray-600 mt-1">
          Chọn đơn hàng để xem chi tiết hoặc chỉnh sửa
        </p>
      </div>

      {/* Filters */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tìm kiếm
            </label>
            <Input
              placeholder="Mã đơn hàng, đợt giao, hợp đồng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Trạng thái
            </label>
            <select
              className="w-full p-2 border border-gray-300 rounded-lg"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Tất cả trạng thái</option>
              {Object.values(OrderStatus).map((status) => (
                <option key={status} value={status}>
                  {status === OrderStatus.Pending ? "Chờ xử lý" :
                   status === OrderStatus.Preparing ? "Đang chuẩn bị" :
                   status === OrderStatus.Shipped ? "Đã xuất hàng" :
                   status === OrderStatus.Delivered ? "Đã giao hàng" :
                   status === OrderStatus.Cancelled ? "Đã hủy" :
                   status === OrderStatus.Failed ? "Giao thất bại" : status}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sắp xếp theo
            </label>
            <select
              className="w-full p-2 border border-gray-300 rounded-lg"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="orderDate">Ngày tạo (mới nhất)</option>
              <option value="deliveryBatchCode">Mã đợt giao</option>
              <option value="status">Trạng thái</option>
              <option value="totalAmount">Tổng tiền (cao nhất)</option>
            </select>
          </div>
          <div className="flex items-end">
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("");
                setSortBy("orderDate");
              }}
              className="w-full"
            >
              Đặt lại
            </Button>
          </div>
        </div>
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {filteredOrders.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <div className="text-gray-500">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">Không có đơn hàng</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || statusFilter ? "Thử thay đổi bộ lọc tìm kiếm" : "Chưa có đơn hàng nào được tạo"}
              </p>
            </div>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <Card key={order.orderId} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    {order.orderCode || "—"}
                  </CardTitle>
                  {getStatusBadge(order.status)}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Đợt giao:</span>
                    <span className="font-medium">{order.deliveryBatchCode || "—"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Hợp đồng:</span>
                    <span className="font-medium">{order.contractNumber || "—"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Ngày tạo:</span>
                    <span className="font-medium">{formatDate(order.orderDate)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Số lượng:</span>
                    <span className="font-medium">{order.totalQuantity?.toLocaleString() || 0} kg</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tổng tiền:</span>
                    <span className="font-medium text-green-600">
                      {formatCurrency(order.totalAmount)} VNĐ
                    </span>
                  </div>
                  
                  <div className="pt-3 border-t">
                    <Button
                      onClick={() => onOrderSelect(order.orderId)}
                      className="w-full"
                      size="sm"
                    >
                      Xem chi tiết
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Summary */}
      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-700">
            Hiển thị {filteredOrders.length} trong tổng số {orders.length} đơn hàng
          </span>
          <div className="flex gap-2 text-xs">
            <span className="text-gray-600">
              Đang chuẩn bị: {orders.filter(o => o.status === OrderStatus.Preparing).length}
            </span>
            <span className="text-gray-600">
              Đã giao: {orders.filter(o => o.status === OrderStatus.Delivered).length}
            </span>
            <span className="text-gray-600">
              Đã hủy: {orders.filter(o => o.status === OrderStatus.Cancelled).length}
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between pt-6 border-t">
        <Button variant="outline" onClick={onBack}>
          Quay lại
        </Button>
        <Button onClick={() => router.push("/orders/create")}>
          Tạo đơn hàng mới
        </Button>
      </div>
    </div>
  );
}

