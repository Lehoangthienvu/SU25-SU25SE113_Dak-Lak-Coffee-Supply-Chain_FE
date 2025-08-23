'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { createWarehouseOutboundRequest, getOrderItemsWithRemainingQuantity } from '@/lib/api/warehouseOutboundRequest';
import { getAllWarehouses } from '@/lib/api/warehouses';
import { getInventoriesByWarehouseIdWithFifo } from '@/lib/api/inventory';
import { getOrders } from '@/lib/api/orders';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Warehouse, 
  Package, 
  TrendingDown, 
  FileText, 
  ShoppingCart, 
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  MapPin,
  Hash,
  BarChart3,
  Clock,
  Star
} from 'lucide-react';

type Warehouse = { warehouseId: string; name: string; location?: string };

type Order = { orderId: string; orderCode: string; contractNumber?: string; deliveryBatchCode?: string };

type OrderItem = { 
  orderItemId: string; 
  productName: string; 
  quantity?: number | null;
  totalQuantity: number;
  confirmedQuantity: number;
  remainingQuantity: number;
  coffeeTypeName: string;
};

type Inventory = {
  inventoryId: string;
  inventoryCode: string;
  quantity: number;
  unit: string;
  productName: string;
  batchCode: string;
  createdAt: string;
  fifoPriority: number;
  isRecommended: boolean;
  fifoRecommendation: string;
};

export default function CreateOutboundRequestPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    warehouseId: '',
    inventoryId: '',
    requestedQuantity: '',
    unit: '',
    purpose: '',
    reason: '',
    orderId: '',
    orderItemId: '',
  });

  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [inventories, setInventories] = useState<Inventory[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Load kho + đơn hàng lúc đầu
  useEffect(() => {
    (async () => {
      try {
        const wres = await getAllWarehouses();
        if (wres.status === 1) setWarehouses(wres.data || []);
        else toast.error(wres.message || 'Không thể tải danh sách kho');
      } catch (e: any) {
        toast.error(e.message || 'Lỗi khi tải kho');
      }

      try {
        const ores = await getOrders();
        setOrders(ores || []);
      } catch (e: any) {
        toast.error(e.message || 'Không thể tải danh sách đơn hàng');
      }
    })();
  }, []);

  // Khi đổi kho → reset tồn kho đã chọn + nạp tồn kho của kho đó
  useEffect(() => {
    if (!form.warehouseId) {
      setInventories([]);
      setForm((p) => ({ ...p, inventoryId: '' }));
      return;
    }
    (async () => {
      try {
        const requestedQty = parseFloat(form.requestedQuantity) || undefined;
        const data = await getInventoriesByWarehouseIdWithFifo(form.warehouseId, requestedQty);
        setInventories(data || []);
        
        // Tự động chọn inventory được khuyến nghị đầu tiên
        const recommendedInventory = data?.find((inv: Inventory) => inv.isRecommended);
        if (recommendedInventory && !form.inventoryId) {
          setForm((p) => ({ ...p, inventoryId: recommendedInventory.inventoryId }));
        }
      } catch (e: any) {
        toast.error(e.message || 'Không thể tải tồn kho');
      }
    })();
  }, [form.warehouseId, form.requestedQuantity]);

  // Khi thay đổi số lượng yêu cầu → cập nhật khuyến nghị FIFO
  useEffect(() => {
    if (!form.warehouseId) return;
    
    const timeoutId = setTimeout(async () => {
      try {
        const requestedQty = parseFloat(form.requestedQuantity) || undefined;
        const data = await getInventoriesByWarehouseIdWithFifo(form.warehouseId, requestedQty);
        setInventories(data || []);
        
        // Tự động chọn inventory được khuyến nghị đầu tiên
        const recommendedInventory = data?.find((inv: Inventory) => inv.isRecommended);
        if (recommendedInventory && !form.inventoryId) {
          setForm((p) => ({ ...p, inventoryId: recommendedInventory.inventoryId }));
        }
      } catch (e: any) {
        // Lỗi khi cập nhật khuyến nghị FIFO - không hiển thị toast để tránh spam
      }
    }, 500); // Debounce 500ms

    return () => clearTimeout(timeoutId);
  }, [form.requestedQuantity, form.warehouseId]);

  // Khi chọn đơn hàng → reset orderItemId + nạp danh sách item theo đơn
  useEffect(() => {
    if (!form.orderId) {
      setOrderItems([]);
      setForm((p) => ({ ...p, orderItemId: '' }));
      return;
    }
    (async () => {
      try {
        const detail = await getOrderItemsWithRemainingQuantity(form.orderId);
        setOrderItems(detail || []);
      } catch (e: any) {
        toast.error(e.message || 'Không thể tải danh sách mục hàng');
      }
    })();
  }, [form.orderId]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    // các field phụ thuộc
    if (name === 'warehouseId') {
      setForm((p) => ({ ...p, warehouseId: value, inventoryId: '' }));
      return;
    }
    if (name === 'orderId') {
      setForm((p) => ({ ...p, orderId: value, orderItemId: '' }));
      return;
    }
    if (name === 'orderItemId') {
      setForm((p) => ({ ...p, orderItemId: value }));
      
      // ✅ Tự động điền số lượng yêu cầu bằng số lượng còn lại của order item
      if (value) {
        const selectedItem = orderItems.find(item => item.orderItemId === value);
        if (selectedItem && selectedItem.remainingQuantity > 0) {
          setForm((p) => ({ 
            ...p, 
            orderItemId: value,
            requestedQuantity: selectedItem.remainingQuantity.toString(),
            unit: 'kg'
          }));
        }
      }
      return;
    }
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    const qty = Number(form.requestedQuantity);

    if (!form.warehouseId || !form.inventoryId || !form.unit || !form.requestedQuantity) {
      toast.error('Vui lòng nhập đầy đủ các trường bắt buộc');
      return;
    }
    if (Number.isNaN(qty) || qty <= 0) {
      toast.error('Số lượng yêu cầu phải lớn hơn 0');
      return;
    }

    // ✅ Kiểm tra số lượng yêu cầu không vượt quá số lượng còn lại của order item
    if (form.orderItemId && selectedOrderItem) {
      if (qty > selectedOrderItem.remainingQuantity) {
        toast.error(`Số lượng yêu cầu (${qty}) vượt quá số lượng còn lại của đơn hàng (${selectedOrderItem.remainingQuantity})`);
        return;
      }
    }

    try {
      setLoading(true);
      const payload = {
        warehouseId: form.warehouseId,
        inventoryId: form.inventoryId,
        requestedQuantity: qty,
        unit: form.unit.trim(),
        purpose: form.purpose?.trim() || undefined,
        reason: form.reason?.trim() || undefined,
        orderItemId: form.orderItemId && form.orderItemId !== '' ? form.orderItemId : undefined,
      };

      // Debug logs removed for performance

      const message = await createWarehouseOutboundRequest(payload);
      toast.success(message || 'Tạo yêu cầu thành công');
      router.push('/dashboard/manager/warehouse-request');
    } catch (err: any) {
      toast.error(err.message || 'Tạo yêu cầu thất bại');
    } finally {
      setLoading(false);
    }
  };

  // Tính toán thống kê
  const selectedWarehouse = warehouses.find(w => w.warehouseId === form.warehouseId);
  const selectedInventory = inventories.find(inv => inv.inventoryId === form.inventoryId);
  const selectedOrderItem = orderItems.find(item => item.orderItemId === form.orderItemId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-100 p-4">
      <div className="max-w-5xl mx-auto space-y-4">
        {/* Header gọn hơn */}
        <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-xl shadow-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">📤 Tạo yêu cầu xuất kho</h1>
                <p className="text-orange-100 text-sm">Tạo yêu cầu xuất kho mới cho hệ thống quản lý</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={() => router.push('/dashboard/manager/warehouse-request')}
              className="border-white/20 text-white hover:bg-white/10"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Quay lại
            </Button>
          </div>
        </div>

        {/* Main Content - Gộp thành 2 cột */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Left Column - Form (3 cột) */}
          <div className="lg:col-span-3 space-y-4">
            {/* Gộp tất cả form vào 1 card */}
            <Card className="bg-white shadow-lg border-0">
              <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 border-b border-orange-100">
                <CardTitle className="text-lg font-bold text-orange-800 flex items-center gap-2">
                  <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center">
                    <TrendingDown className="w-3 h-3 text-orange-600" />
                  </div>
                  Thông tin yêu cầu xuất kho
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Cột 1: Kho và tồn kho */}
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <Warehouse className="w-4 h-4 text-orange-600" />
                        Chọn kho hàng *
                      </Label>
                      <select
                        name="warehouseId"
                        value={form.warehouseId}
                        onChange={handleChange}
                        className="w-full h-10 border-2 border-orange-200 rounded-lg px-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all duration-200 bg-white text-sm"
                      >
                        <option value="">-- Chọn kho hàng --</option>
                        {warehouses.map((w) => (
                          <option key={w.warehouseId} value={w.warehouseId}>
                            {w.name} {w.location ? `– ${w.location}` : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <Package className="w-4 h-4 text-blue-600" />
                        Chọn tồn kho * (FIFO)
                      </Label>
                      <select
                        name="inventoryId"
                        value={form.inventoryId}
                        onChange={handleChange}
                        disabled={!form.warehouseId}
                        className={`w-full border-2 rounded-lg px-3 focus:outline-none focus:ring-2 transition-all duration-200 text-sm ${
                          !form.warehouseId 
                            ? 'border-gray-200 bg-gray-50 text-gray-400' 
                            : 'border-blue-200 focus:border-blue-500 focus:ring-blue-200 bg-white'
                        }`}
                      >
                        <option value="">-- Chọn tồn kho --</option>
                        {inventories.map((inv) => (
                          <option key={inv.inventoryId} value={inv.inventoryId}>
                            {inv.isRecommended ? '⭐ ' : ''}{inv.inventoryCode} – {inv.quantity} {inv.unit ?? ''} 
                            {inv.isRecommended ? ' (Khuyến nghị)' : ''}
                          </option>
                        ))}
                      </select>
                      
                      {/* Hiển thị thông tin khuyến nghị FIFO */}
                      {selectedInventory && selectedInventory.isRecommended && (
                        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center gap-2 text-green-700 text-sm">
                            <Star className="w-4 h-4 text-green-600" />
                            <span className="font-medium">Khuyến nghị FIFO:</span>
                          </div>
                          <p className="text-green-600 text-xs mt-1 ml-6">
                            {selectedInventory.fifoRecommendation}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Cột 2: Số lượng và đơn vị */}
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <TrendingDown className="w-4 h-4 text-red-600" />
                        Số lượng yêu cầu *
                      </Label>
                      <Input
                        type="number"
                        name="requestedQuantity"
                        min={0}
                        step="any"
                        value={form.requestedQuantity}
                        onChange={handleChange}
                        placeholder="Nhập số lượng..."
                        className="h-10 border-2 border-red-200 focus:border-red-500 focus:ring-2 focus:ring-red-200 text-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <Hash className="w-4 h-4 text-purple-600" />
                        Đơn vị *
                      </Label>
                      <Input 
                        name="unit" 
                        value={form.unit} 
                        onChange={handleChange} 
                        placeholder="kg, tấn, bao..."
                        className="h-10 border-2 border-purple-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Mục đích và lý do - 1 hàng */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">Mục đích xuất kho</Label>
                    <Textarea
                      name="purpose"
                      value={form.purpose}
                      onChange={handleChange}
                      placeholder="Ghi chú về mục đích xuất kho..."
                      className="min-h-[80px] border-2 border-green-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 resize-none text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">Lý do xuất kho</Label>
                    <Textarea
                      name="reason"
                      value={form.reason}
                      onChange={handleChange}
                      placeholder="Lý do cần xuất kho..."
                      className="min-h-[80px] border-2 border-emerald-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 resize-none text-sm"
                    />
                  </div>
                </div>

                {/* Đơn hàng - 1 hàng */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <ShoppingCart className="w-4 h-4 text-purple-600" />
                      Chọn đơn hàng (tùy chọn)
                    </Label>
                    <select
                      name="orderId"
                      value={form.orderId}
                      onChange={handleChange}
                      className="w-full h-10 border-2 border-purple-200 rounded-lg px-3 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200 bg-white text-sm"
                    >
                      <option value="">-- Không chọn đơn hàng --</option>
                      {orders.map((order) => (
                        <option key={order.orderId} value={order.orderId}>
                          {order.orderCode} – {order.contractNumber || order.deliveryBatchCode || 'N/A'}
                        </option>
                      ))}
                    </select>
                  </div>

                  {form.orderId && (
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-gray-700">Chọn mục hàng từ đơn hàng</Label>
                      <select
                        name="orderItemId"
                        value={form.orderItemId}
                        onChange={handleChange}
                        className="w-full h-10 border-2 border-indigo-200 rounded-lg px-3 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-200 bg-white text-sm"
                      >
                        <option value="">-- Chọn mục hàng --</option>
                        {orderItems.map((item) => (
                          <option key={item.orderItemId} value={item.orderItemId}>
                            {item.productName} – Còn lại: {item.remainingQuantity} kg
                            {item.remainingQuantity <= 0 ? ' (Hết hàng)' : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Submit buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <Button 
                    variant="outline" 
                    onClick={() => router.push('/dashboard/manager/warehouse-request')}
                    className="h-10 px-4 border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                  >
                    Hủy bỏ
                  </Button>
                  <Button 
                    onClick={handleSubmit} 
                    disabled={loading} 
                    className="h-10 px-6 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ⏳ Đang tạo...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Tạo yêu cầu xuất kho
                      </div>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Info gọn gàng (1 cột) */}
          <div className="space-y-4">
            {/* Quick Stats gọn */}
            <Card className="bg-white shadow-lg border-0">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100 p-3">
                <CardTitle className="text-sm font-bold text-blue-800 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-blue-600" />
                  Thống kê
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3">
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tổng kho:</span>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
                      {warehouses.length}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tổng đơn hàng:</span>
                    <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                      {orders.length}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tồn kho hiện tại:</span>
                    <Badge variant="secondary" className="bg-purple-100 text-purple-800 text-xs">
                      {form.warehouseId ? inventories.length : 'N/A'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Selected Info gọn */}
            {selectedWarehouse && (
              <Card className="bg-white shadow-lg border-0">
                <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 border-b border-orange-100 p-3">
                  <CardTitle className="text-sm font-bold text-orange-800 flex items-center gap-2">
                    <Warehouse className="w-4 h-4 text-orange-600" />
                    Kho đã chọn
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3">
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3 h-3 text-orange-600" />
                      <span className="font-semibold text-gray-800">{selectedWarehouse.name}</span>
                    </div>
                    {selectedWarehouse.location && (
                      <div className="text-gray-600">{selectedWarehouse.location}</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Thông tin tồn kho đã chọn */}
            {selectedInventory && (
              <Card className="bg-white shadow-lg border-0">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100 p-3">
                  <CardTitle className="text-sm font-bold text-blue-800 flex items-center gap-2">
                    <Package className="w-4 h-4 text-blue-600" />
                    Tồn kho đã chọn
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3">
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2">
                      <Hash className="w-3 h-3 text-blue-600" />
                      <span className="font-semibold text-gray-800">{selectedInventory.inventoryCode}</span>
                    </div>
                    <div className="text-gray-600">{selectedInventory.productName}</div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Số lượng:</span>
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
                        {selectedInventory.quantity} {selectedInventory.unit}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Thứ tự FIFO:</span>
                      <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                        #{selectedInventory.fifoPriority}
                      </Badge>
                    </div>
                    {selectedInventory.isRecommended && (
                      <div className="flex items-center gap-2 mt-2 p-2 bg-green-50 border border-green-200 rounded">
                        <Star className="w-3 h-3 text-green-600" />
                        <span className="text-green-700 text-xs font-medium">Được khuyến nghị</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Thông tin mục hàng đã chọn */}
            {selectedOrderItem && (
              <Card className="bg-white shadow-lg border-0">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-purple-100 p-3">
                  <CardTitle className="text-sm font-bold text-purple-800 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-purple-600" />
                    Mục hàng đã chọn
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3">
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3 h-3 text-purple-600" />
                      <span className="font-semibold text-gray-800">{selectedOrderItem.productName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tổng số lượng:</span>
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
                        {selectedOrderItem.totalQuantity} kg
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Đã xuất:</span>
                      <Badge variant="secondary" className="bg-orange-100 text-orange-800 text-xs">
                        {selectedOrderItem.confirmedQuantity} kg
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Còn lại:</span>
                      <Badge variant="secondary" className={`text-xs ${
                        selectedOrderItem.remainingQuantity > 0 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {selectedOrderItem.remainingQuantity} kg
                        {selectedOrderItem.remainingQuantity <= 0 ? ' (Hết hàng)' : ''}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Help gọn */}
            <Card className="bg-white shadow-lg border-0">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100 p-3">
                <CardTitle className="text-sm font-bold text-green-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-green-600" />
                  💡 Hướng dẫn
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3">
                <div className="text-xs text-green-700 space-y-1">
                  <p>• Chọn kho và tồn kho cần xuất</p>
                  <p>• Nhập số lượng và đơn vị chính xác</p>
                  <p>• Ghi rõ mục đích và lý do xuất kho</p>
                  <p>• Có thể liên kết với đơn hàng (tùy chọn)</p>
                </div>
                <div className="mt-3 pt-3 border-t border-green-100">
                  <div className="text-xs text-orange-700 space-y-1">
                    <p className="font-medium">⭐ Hệ thống áp dụng FIFO (First In, First Out)</p>
                    <p>• Tồn kho nhập trước sẽ được khuyến nghị xuất trước</p>
                    <p>• Giúp tối ưu hóa quản lý tồn kho và chất lượng sản phẩm</p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-green-100">
                  <div className="text-xs text-purple-700 space-y-1">
                    <p className="font-medium">📊 Tính năng thông minh:</p>
                    <p>• Tự động tính số lượng còn lại của đơn hàng</p>
                    <p>• Tự động điền số lượng khi chọn mục hàng</p>
                    <p>• Kiểm tra giới hạn số lượng trước khi tạo yêu cầu</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
