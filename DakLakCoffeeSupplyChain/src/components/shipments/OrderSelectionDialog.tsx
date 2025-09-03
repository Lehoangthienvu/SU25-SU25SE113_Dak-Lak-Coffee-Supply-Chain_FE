"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { getOrdersForShipment, OrderForShipmentDto } from "@/lib/api/shipments";
import {
  Search,
  Package,
  FileText,
  Truck,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

interface OrderSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectOrder: (order: OrderForShipmentDto) => void;
  selectedOrderId?: string;
}

const OrderSelectionCard = ({
  order,
  isSelected,
  onSelect,
}: {
  order: OrderForShipmentDto;
  isSelected: boolean;
  onSelect: () => void;
}) => {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "preparing":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "shipped":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "delivered":
        return "bg-green-100 text-green-800 border-green-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      case "pending":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "failed":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "preparing":
        return <Package className="w-4 h-4" />;
      case "shipped":
        return <Truck className="w-4 h-4" />;
      case "delivered":
        return <CheckCircle2 className="w-4 h-4" />;
      case "cancelled":
        return <AlertTriangle className="w-4 h-4" />;
      case "pending":
        return <FileText className="w-4 h-4" />;
      case "failed":
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case "preparing":
        return "Đang chuẩn bị";
      case "shipped":
        return "Đã gửi";
      case "delivered":
        return "Đã giao";
      case "cancelled":
        return "Đã hủy";
      case "pending":
        return "Chờ xử lý";
      case "failed":
        return "Thất bại";
      default:
        return status;
    }
  };

  const completionPercentage =
    (order.totalDeliveredQuantity / order.totalOrderQuantity) * 100;
  const isNearlyComplete = completionPercentage > 90;

  return (
    <div
      className={`p-6 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-lg ${
        isSelected
          ? "border-blue-500 bg-blue-50 shadow-lg scale-[1.02]"
          : "border-gray-200 hover:border-blue-300 hover:bg-blue-50/30"
      }`}
      onClick={onSelect}
    >
      {/* Header với Order Code và Status */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">
              {order.orderCode.split("-").pop()}
            </span>
          </div>
          <div>
            <h3 className="font-bold text-xl text-gray-900">
              {order.orderCode}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(
                  order.status
                )} flex items-center gap-1`}
              >
                {getStatusIcon(order.status)}
                {getStatusText(order.status)}
              </span>
            </div>
          </div>
        </div>

        {/* Progress Circle */}
        <div className="relative w-16 h-16">
          <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
            <path
              className="text-gray-200"
              stroke="currentColor"
              strokeWidth="3"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              className="text-blue-500 transition-all duration-500"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              strokeDasharray={`${completionPercentage}, 100`}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-bold text-gray-700">
              {Math.round(completionPercentage)}%
            </span>
          </div>
        </div>
      </div>

      {/* Contract và Delivery Batch Info */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <FileText className="w-4 h-4 text-gray-500" />
            <span className="text-xs font-medium text-gray-600">Hợp đồng</span>
          </div>
          <p className="font-semibold text-gray-900">{order.contractCode}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Truck className="w-4 h-4 text-gray-500" />
            <span className="text-xs font-medium text-gray-600">
              Lô giao hàng
            </span>
          </div>
          <p className="font-semibold text-gray-900">
            {order.deliveryBatchCode}
          </p>
        </div>
      </div>

      {/* Quantity Summary Cards */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="text-center p-3 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-gray-800 mb-1">
            {order.totalOrderQuantity.toLocaleString()}
          </div>
          <div className="text-xs text-gray-600 font-medium">
            Tổng đơn hàng (kg)
          </div>
        </div>
        <div className="text-center p-3 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
          <div className="text-2xl font-bold text-green-700 mb-1">
            {order.totalDeliveredQuantity.toLocaleString()}
          </div>
          <div className="text-xs text-green-600 font-medium">Đã giao (kg)</div>
        </div>
        <div className="text-center p-3 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg border border-orange-200">
          <div className="text-2xl font-bold text-orange-700 mb-1">
            {order.totalRemainingQuantity.toLocaleString()}
          </div>
          <div className="text-xs text-orange-600 font-medium">
            Còn lại (kg)
          </div>
        </div>
      </div>

      {/* Products List */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 mb-2">
          <Package className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-semibold text-gray-700">
            Sản phẩm cần giao:
          </span>
        </div>
        {order.orderItems.map((item, idx) => (
          <div
            key={idx}
            className="bg-white rounded-lg p-3 border border-gray-200"
          >
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-900">
                {item.productName}
              </span>
              <span className="text-sm font-semibold text-orange-600">
                {item.remainingQuantity.toLocaleString()} {item.unit}
              </span>
            </div>
            <div className="text-xs text-gray-500 mt-1">Còn lại cần giao</div>
          </div>
        ))}
      </div>

      {/* Warning for nearly complete orders */}
      {isNearlyComplete && (
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span className="text-sm font-medium text-amber-800">
              Đơn hàng gần hoàn thành ({Math.round(completionPercentage)}%)
            </span>
          </div>
        </div>
      )}

      {/* Success indicator for completed orders */}
      {completionPercentage === 100 && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-800">
              Đơn hàng đã hoàn thành thành công
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default function OrderSelectionDialog({
  open,
  onOpenChange,
  onSelectOrder,
  selectedOrderId,
}: OrderSelectionDialogProps) {
  const [orders, setOrders] = useState<OrderForShipmentDto[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<OrderForShipmentDto[]>(
    []
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] =
    useState<OrderForShipmentDto | null>(null);

  useEffect(() => {
    if (open) {
      loadOrders();
    }
  }, [open]);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredOrders(orders);
    } else {
      const filtered = orders.filter(
        (order) =>
          order.orderCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.contractCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.deliveryBatchCode
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          order.orderItems.some((item) =>
            item.productName.toLowerCase().includes(searchTerm.toLowerCase())
          )
      );
      setFilteredOrders(filtered);
    }
  }, [searchTerm, orders]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const orderList = await getOrdersForShipment();
      setOrders(orderList || []);
      setFilteredOrders(orderList || []);
    } catch (error) {
      console.error("Error loading orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOrder = (order: OrderForShipmentDto) => {
    setSelectedOrder(order);
  };

  const handleConfirm = () => {
    if (selectedOrder) {
      onSelectOrder(selectedOrder);
      onOpenChange(false);
      setSelectedOrder(null);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
    setSelectedOrder(null);
    setSearchTerm("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden">
        <DialogHeader className="pb-4 border-b">
          <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Package className="w-6 h-6 text-blue-600" />
            Chọn đơn hàng để vận chuyển
          </DialogTitle>
          <p className="text-gray-600 mt-2">
            Chọn một đơn hàng để tạo vận chuyển
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Search Bar */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Tìm kiếm đơn hàng, hợp đồng, lô giao hàng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-12 text-base border-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchTerm("")}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                title="Xóa tìm kiếm"
              >
                ×
              </Button>
            )}
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Đang tải đơn hàng...</p>
                </div>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-16">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm
                    ? "Không tìm thấy đơn hàng"
                    : "Không có đơn hàng nào"}
                </h3>
                <p className="text-gray-500">
                  {searchTerm
                    ? "Thử từ khóa tìm kiếm khác"
                    : "Tất cả đơn hàng đã hoàn thành"}
                </p>
              </div>
            ) : (
              <div className="grid gap-6 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                {filteredOrders.map((order) => (
                  <OrderSelectionCard
                    key={order.orderId}
                    order={order}
                    isSelected={selectedOrder?.orderId === order.orderId}
                    onSelect={() => handleSelectOrder(order)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="pt-4 border-t bg-gray-50 -mx-6 -mb-6 px-6 py-4">
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={handleCancel} className="px-6">
              Hủy
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!selectedOrder}
              className="px-6 bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Chọn đơn hàng
            </Button>
          </div>
          {selectedOrder && (
            <div className="text-sm text-gray-600">
              Đã chọn:{" "}
              <span className="font-semibold">{selectedOrder.orderCode}</span>
            </div>
          )}
        </DialogFooter>
      </DialogContent>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </Dialog>
  );
}
