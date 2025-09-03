'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

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
  coffeeTypeName: string; // ✅ Thêm thông tin loại cà phê
};

export default function CreateOutboundRequestPage() {
  const { t } = useTranslation();
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
        else toast.error(wres.message || t('managerWarehouseRequest.create.errors.loadWarehouses'));
      } catch (e: any) {
        toast.error(e.message || t('managerWarehouseRequest.create.errors.loadWarehouses'));
      }

      try {
        const ores = await getOrders();
        setOrders(ores || []);
      } catch (e: any) {
        toast.error(e.message || t('managerWarehouseRequest.create.errors.loadOrders'));
      }
    })();
  }, [t]);

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
        toast.error(e.message || t('managerWarehouseRequest.create.errors.loadInventories'));
      }
    })();
  }, [form.warehouseId, form.requestedQuantity, t]);

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
  }, [form.requestedQuantity, form.warehouseId, t]);

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
        toast.error(e.message || t('managerWarehouseRequest.create.errors.loadOrderItems'));
      }
    })();
  }, [form.orderId, t]);

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
      toast.error(t('managerWarehouseRequest.create.errors.requiredFields'));
      return;
    }
    if (Number.isNaN(qty) || qty <= 0) {
      toast.error(t('managerWarehouseRequest.create.errors.invalidQuantity'));
      return;
    }

    // ✅ Kiểm tra số lượng yêu cầu không vượt quá số lượng còn lại của order item
    if (form.orderItemId && selectedOrderItem) {
      if (qty > selectedOrderItem.remainingQuantity) {
        toast.error(t('managerWarehouseRequest.create.errors.exceedQuantity', {
          quantity: qty,
          remaining: selectedOrderItem.remainingQuantity
        }));
        return;
      }
    }

    // ✅ Kiểm tra loại cà phê khớp với đơn hàng
    if (form.orderItemId && selectedOrderItem && selectedInventory) {
      const orderItemCoffeeType = selectedOrderItem.coffeeTypeName.toLowerCase();
      const inventoryCoffeeType = selectedInventory.coffeeTypeName.toLowerCase();
      
      if (orderItemCoffeeType !== inventoryCoffeeType) {
        toast.error(`❌ Loại cà phê không khớp! Đơn hàng yêu cầu: ${selectedOrderItem.coffeeTypeName}, Tồn kho có: ${selectedInventory.coffeeTypeName}`);
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
      toast.success(message || t('managerWarehouseRequest.success.createRequest'));
      router.push('/dashboard/manager/warehouse-request');
    } catch (err: any) {
      // ✅ CẢI THIỆN: Xử lý lỗi chi tiết từ backend
      let errorMessage = t('managerWarehouseRequest.error.createRequest');
      
      if (err.response?.data) {
        // Lỗi từ backend có response data
        if (err.response.data.message) {
          errorMessage = err.response.data.message;
        } else if (typeof err.response.data === 'string') {
          errorMessage = err.response.data;
        } else if (err.response.data.errors) {
          // Validation errors
          const validationErrors = Object.values(err.response.data.errors).flat();
          errorMessage = validationErrors.join(', ');
        } else if (err.response.data.status !== undefined && err.response.data.status !== 1) {
          // ServiceResult format từ backend
          errorMessage = err.response.data.message || t('managerWarehouseRequest.error.createRequest');
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      toast.error(`❌ Lỗi: ${errorMessage}`);
      
      // Log chi tiết để debug
      console.error('❌ Create outbound request error:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        fullError: err
      });
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
                <h1 className="text-2xl font-bold">{t('managerWarehouseRequest.create.title')}</h1>
                <p className="text-orange-100 text-sm">{t('managerWarehouseRequest.create.subtitle')}</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={() => router.push('/dashboard/manager/warehouse-request')}
              className="bg-white/90 text-orange-600 border-white hover:bg-white hover:text-orange-700 font-medium shadow-md"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('managerWarehouseRequest.create.back')}
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
                  {t('managerWarehouseRequest.create.form.title')}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Cột 1: Kho và tồn kho */}
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <Warehouse className="w-4 h-4 text-orange-600" />
                        {t('managerWarehouseRequest.create.form.warehouseLabel')}
                      </Label>
                      <select
                        name="warehouseId"
                        value={form.warehouseId}
                        onChange={handleChange}
                        className="w-full h-10 border-2 border-orange-200 rounded-lg px-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all duration-200 bg-white text-sm"
                      >
                        <option value="">{t('managerWarehouseRequest.placeholders.selectWarehouse')}</option>
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
                        {t('managerWarehouseRequest.create.form.inventoryLabel')}
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
                        <option value="">{t('managerWarehouseRequest.placeholders.selectInventory')}</option>
                        {inventories.map((inv) => (
                          <option key={inv.inventoryId} value={inv.inventoryId}>
                            {inv.isRecommended ? '⭐ ' : ''}{inv.inventoryCode} – {inv.quantity} {inv.unit ?? ''} ({inv.coffeeTypeName})
                            {inv.isRecommended ? ` (${t('managerWarehouseRequest.create.info.recommended')})` : ''}
                          </option>
                        ))}
                      </select>
                      
                      {/* Hiển thị thông tin khuyến nghị FIFO */}
                      {selectedInventory && selectedInventory.isRecommended && (
                        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center gap-2 text-green-700 text-sm">
                            <Star className="w-4 h-4 text-green-600" />
                            <span className="font-medium">{t('managerWarehouseRequest.create.info.fifoPriority')}:</span>
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
                        {t('managerWarehouseRequest.create.form.quantityLabel')}
                      </Label>
                      <Input
                        type="number"
                        name="requestedQuantity"
                        min={0}
                        step="any"
                        value={form.requestedQuantity}
                        onChange={handleChange}
                        placeholder={t('managerWarehouseRequest.placeholders.quantity')}
                        className="h-10 border-2 border-red-200 focus:border-red-500 focus:ring-2 focus:ring-red-200 text-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <Hash className="w-4 h-4 text-purple-600" />
                        {t('managerWarehouseRequest.create.form.unitLabel')}
                      </Label>
                      <Input 
                        name="unit" 
                        value={form.unit} 
                        onChange={handleChange} 
                        placeholder={t('managerWarehouseRequest.placeholders.unit')}
                        className="h-10 border-2 border-purple-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Mục đích và lý do - 1 hàng */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">{t('managerWarehouseRequest.create.form.purposeLabel')}</Label>
                    <Textarea
                      name="purpose"
                      value={form.purpose}
                      onChange={handleChange}
                                              placeholder={t('managerWarehouseRequest.placeholders.purpose')}
                      className="min-h-[80px] border-2 border-green-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 resize-none text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">{t('managerWarehouseRequest.create.form.reasonLabel')}</Label>
                    <Textarea
                      name="reason"
                      value={form.reason}
                      onChange={handleChange}
                                              placeholder={t('managerWarehouseRequest.placeholders.reason')}
                      className="min-h-[80px] border-2 border-emerald-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 resize-none text-sm"
                    />
                  </div>
                </div>

                {/* Đơn hàng - 1 hàng */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="space-y-2">
                                          <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <ShoppingCart className="w-4 h-4 text-purple-600" />
                        {t('managerWarehouseRequest.create.form.orderLabel')}
                      </Label>
                    <select
                      name="orderId"
                      value={form.orderId}
                      onChange={handleChange}
                      className="w-full h-10 border-2 border-purple-200 rounded-lg px-3 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200 bg-white text-sm"
                    >
                                              <option value="">{t('managerWarehouseRequest.placeholders.selectOrder')}</option>
                      {orders.map((order) => (
                        <option key={order.orderId} value={order.orderId}>
                          {order.orderCode} – {order.contractNumber || order.deliveryBatchCode || 'N/A'}
                        </option>
                      ))}
                    </select>
                  </div>

                  {form.orderId && (
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-gray-700">{t('managerWarehouseRequest.create.form.orderItemLabel')}</Label>
                      <select
                        name="orderItemId"
                        value={form.orderItemId}
                        onChange={handleChange}
                        className="w-full h-10 border-2 border-indigo-200 rounded-lg px-3 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-200 bg-white text-sm"
                      >
                                                  <option value="">{t('managerWarehouseRequest.placeholders.selectOrderItem')}</option>
                        {orderItems.map((item) => (
                          <option key={item.orderItemId} value={item.orderItemId}>
                            {item.productName} – {t('managerWarehouseRequest.fields.remaining')}: {item.remainingQuantity} {t('managerWarehouses.stats.kg')}
                            {item.remainingQuantity <= 0 ? ` (${t('managerWarehouseRequest.create.info.outOfStock')})` : ''}
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
                    {t('managerWarehouseRequest.create.cancel')}
                  </Button>
                  <Button 
                    onClick={handleSubmit} 
                    disabled={loading} 
                    className="h-10 px-6 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        {t('managerWarehouseRequest.create.submitting')}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        {t('managerWarehouseRequest.create.submit')}
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
                  {t('managerWarehouseRequest.create.info.stats')}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3">
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('managerWarehouseRequest.create.info.totalWarehouses')}:</span>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
                      {warehouses.length}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('managerWarehouseRequest.create.info.totalOrders')}:</span>
                    <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                      {orders.length}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('managerWarehouseRequest.create.info.currentInventory')}:</span>
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
                  {t('managerWarehouseRequest.create.info.selectedWarehouse')}
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
                    {t('managerWarehouseRequest.create.info.selectedInventory')}
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
                      <span className="text-gray-600">{t('managerWarehouseRequest.fields.quantity')}:</span>
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
                        {selectedInventory.quantity} {selectedInventory.unit}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('managerWarehouseRequest.create.info.coffeeType')}:</span>
                      <Badge variant="secondary" className="bg-purple-100 text-purple-800 text-xs">
                        {selectedInventory.coffeeTypeName}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('managerWarehouseRequest.create.info.fifoPriority')}:</span>
                      <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                        #{selectedInventory.fifoPriority}
                      </Badge>
                    </div>
                    {selectedInventory.isRecommended && (
                      <div className="flex items-center gap-2 mt-2 p-2 bg-green-50 border border-green-200 rounded">
                        <Star className="w-3 h-3 text-green-600" />
                        <span className="text-green-700 text-xs font-medium">{t('managerWarehouseRequest.create.info.recommended')}</span>
                      </div>
                    )}
                    
                    {/* ✅ Cảnh báo khi loại cà phê không khớp với đơn hàng */}
                    {selectedOrderItem && selectedInventory && 
                     selectedOrderItem.coffeeTypeName.toLowerCase() !== selectedInventory.coffeeTypeName.toLowerCase() && (
                      <div className="flex items-center gap-2 mt-2 p-2 bg-red-50 border border-red-200 rounded">
                        <AlertCircle className="w-3 h-3 text-red-600" />
                        <div className="text-red-700 text-xs">
                          <div className="font-medium">⚠️ Loại cà phê không khớp!</div>
                          <div>Đơn hàng: {selectedOrderItem.coffeeTypeName}</div>
                          <div>Tồn kho: {selectedInventory.coffeeTypeName}</div>
                        </div>
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
                  {t('managerWarehouseRequest.create.info.selectedOrderItem')}
                </CardTitle>
                </CardHeader>
                <CardContent className="p-3">
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3 h-3 text-purple-600" />
                      <span className="font-semibold text-gray-800">{selectedOrderItem.productName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('managerWarehouseRequest.create.info.totalQuantity')}:</span>
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
                        {selectedOrderItem.totalQuantity} kg
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('managerWarehouseRequest.create.info.confirmedQuantity')}:</span>
                      <Badge variant="secondary" className="bg-orange-100 text-orange-800 text-xs">
                        {selectedOrderItem.confirmedQuantity} kg
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('managerWarehouseRequest.create.info.remainingQuantity')}:</span>
                      <Badge variant="secondary" className={`text-xs ${
                        selectedOrderItem.remainingQuantity > 0 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {selectedOrderItem.remainingQuantity} kg
                        {selectedOrderItem.remainingQuantity <= 0 ? ` (${t('managerWarehouseRequest.create.info.outOfStock')})` : ''}
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
                  {t('managerWarehouseRequest.create.guide.title')}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3">
                <div className="text-xs text-green-700 space-y-1">
                  <p>{t('managerWarehouseRequest.create.guide.step1')}</p>
                  <p>{t('managerWarehouseRequest.create.guide.step2')}</p>
                  <p>{t('managerWarehouseRequest.create.guide.step3')}</p>
                  <p>{t('managerWarehouseRequest.create.guide.step4')}</p>
                </div>
                <div className="mt-3 pt-3 border-t border-green-100">
                  <div className="text-xs text-orange-700 space-y-1">
                    <p className="font-medium">{t('managerWarehouseRequest.create.guide.fifoTitle')}</p>
                    <p>{t('managerWarehouseRequest.create.guide.fifo1')}</p>
                    <p>{t('managerWarehouseRequest.create.guide.fifo2')}</p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-green-100">
                  <div className="text-xs text-purple-700 space-y-1">
                    <p className="font-medium">{t('managerWarehouseRequest.create.guide.featuresTitle')}</p>
                    <p>{t('managerWarehouseRequest.create.guide.feature1')}</p>
                    <p>{t('managerWarehouseRequest.create.guide.feature2')}</p>
                    <p>{t('managerWarehouseRequest.create.guide.feature3')}</p>
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
