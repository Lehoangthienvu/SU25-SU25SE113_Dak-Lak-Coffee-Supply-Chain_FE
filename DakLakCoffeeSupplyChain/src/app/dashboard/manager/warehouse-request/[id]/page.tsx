'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getOutboundRequestById, cancelOutboundRequest } from '@/lib/api/warehouseOutboundRequest';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';
import { 
  ArrowLeft, 
  Package, 
  Warehouse, 
  FileText, 
  User, 
  CalendarClock, 
  Hash,
  Coffee,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  MapPin
} from 'lucide-react';

export default function ViewOutboundRequestDetail() {
  const { t } = useTranslation();
  const { id } = useParams();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || typeof id !== 'string') return;

    getOutboundRequestById(id)
      .then((res) => {
        if (res?.status === 1 && res?.data) {
          setData(res.data);
        } else {
          alert(res?.message || t('managerWarehouseRequest.error.loadDetail'));
        }
      })
      .catch((err) => alert(t('managerWarehouseRequest.error.loadData') + ': ' + err.message))
      .finally(() => setLoading(false));
  }, [id, t]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending':
      case '0':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />{t('managerWarehouseRequest.status.pending')}</Badge>;
      case 'Accepted':
      case '1':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />{t('managerWarehouseRequest.status.accepted')}</Badge>;
      case 'Completed':
        return <Badge className="bg-blue-100 text-blue-800"><CheckCircle className="w-3 h-3 mr-1" />{t('managerWarehouseRequest.status.completed')}</Badge>;
      case 'Rejected':
      case '2':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />{t('managerWarehouseRequest.status.rejected')}</Badge>;
      case 'Cancelled':
      case '3':
        return <Badge className="bg-gray-100 text-gray-700"><XCircle className="w-3 h-3 mr-1" />{t('managerWarehouseRequest.status.cancelled')}</Badge>;
      default:
        return <Badge variant="outline">{status || t('managerWarehouseRequest.status.unknown')}</Badge>;
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return t('managerWarehouseRequest.common.noData');
    const d = new Date(dateStr);
    return isNaN(d.getTime())
      ? t('managerWarehouseRequest.common.noData')
      : d.toLocaleString('vi-VN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        });
  };

  const handleCancel = async () => {
    if (!data) return;
    const confirm = window.confirm(t('managerWarehouseRequest.confirmation.cancelMessage'));
    if (!confirm) return;

    try {
      const result = await cancelOutboundRequest(data.outboundRequestId);
      alert('✅ ' + result.message);
      router.push('/dashboard/manager/warehouse-request');
    } catch (err: any) {
      alert('❌ ' + err.message);
    }
  };

  if (loading) return <p className="p-6">{t('managerWarehouseRequest.loading.loadingDetail')}</p>;
  if (!data) return <p className="p-6 text-red-500">{t('managerWarehouseRequest.common.notFound')}</p>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-100 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">{t('managerWarehouseRequest.detail.title')}</h1>
                <p className="text-orange-100 text-sm mt-1">Chi tiết yêu cầu xuất kho</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={() => router.push('/dashboard/manager/warehouse-request')}
              className="bg-white/90 text-orange-600 border-white hover:bg-white hover:text-orange-700 font-medium shadow-md"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('managerWarehouseRequest.detail.backToList')}
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Basic Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Request Info */}
            <Card className="bg-white shadow-lg border-0">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
                <CardTitle className="text-lg font-bold text-blue-800 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Thông tin yêu cầu
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Hash className="w-4 h-4 text-blue-600" />
                      <span className="font-semibold text-gray-700">Mã yêu cầu:</span>
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        {data.outboundRequestCode || t('managerWarehouseRequest.common.unknown')}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <CalendarClock className="w-4 h-4 text-green-600" />
                      <span className="font-semibold text-gray-700">Trạng thái:</span>
                      {getStatusBadge(data.status)}
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-purple-600" />
                      <span className="font-semibold text-gray-700">Người yêu cầu:</span>
                      <span className="text-gray-800">{data.requestedByName || t('managerWarehouseRequest.common.unknown')}</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <TrendingDown className="w-4 h-4 text-red-600" />
                      <span className="font-semibold text-gray-700">Số lượng yêu cầu:</span>
                      <Badge variant="secondary" className="bg-red-100 text-red-800">
                        {data.requestedQuantity} {data.unit}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <CalendarClock className="w-4 h-4 text-orange-600" />
                      <span className="font-semibold text-gray-700">Ngày tạo:</span>
                      <span className="text-gray-800">{formatDate(data.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CalendarClock className="w-4 h-4 text-indigo-600" />
                      <span className="font-semibold text-gray-700">Cập nhật lần cuối:</span>
                      <span className="text-gray-800">{formatDate(data.updatedAt)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Warehouse & Inventory Info */}
            <Card className="bg-white shadow-lg border-0">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100">
                <CardTitle className="text-lg font-bold text-green-800 flex items-center gap-2">
                  <Package className="w-5 h-5 text-green-600" />
                  Thông tin kho và tồn kho
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Warehouse Info */}
                  <div className="space-y-4">
                    <h3 className="text-md font-semibold text-gray-800 flex items-center gap-2">
                      <Warehouse className="w-4 h-4 text-orange-600" />
                      Kho xuất
                    </h3>
                    <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="w-4 h-4 text-orange-600" />
                        <span className="font-semibold text-orange-800">{data.warehouseName || t('managerWarehouseRequest.common.unknown')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Inventory Info */}
                  <div className="space-y-4">
                    <h3 className="text-md font-semibold text-gray-800 flex items-center gap-2">
                      <Package className="w-4 h-4 text-blue-600" />
                      Tồn kho
                    </h3>
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Hash className="w-3 h-3 text-blue-600" />
                          <span className="font-medium text-blue-800">Mã tồn kho:</span>
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
                            {data.inventoryCode || 'N/A'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Package className="w-3 h-3 text-blue-600" />
                          <span className="font-medium text-blue-800">Sản phẩm:</span>
                          <span className="text-blue-700">{data.inventoryName || t('managerWarehouseRequest.common.unknown')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Coffee className="w-3 h-3 text-blue-600" />
                          <span className="font-medium text-blue-800">Loại cà phê:</span>
                          <Badge variant="secondary" className="bg-purple-100 text-purple-800 text-xs">
                            {data.coffeeTypeName || 'N/A'}
                          </Badge>
                        </div>
                        {data.batchCode && (
                          <div className="flex items-center gap-2">
                            <Hash className="w-3 h-3 text-blue-600" />
                            <span className="font-medium text-blue-800">Mã mẻ:</span>
                            <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                              {data.batchCode}
                            </Badge>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <TrendingDown className="w-3 h-3 text-blue-600" />
                          <span className="font-medium text-blue-800">Số lượng hiện tại:</span>
                          <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                            {data.inventoryQuantity || 0} {data.inventoryUnit || 'kg'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Purpose & Reason */}
            {(data.purpose || data.reason) && (
              <Card className="bg-white shadow-lg border-0">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-purple-100">
                  <CardTitle className="text-lg font-bold text-purple-800 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-purple-600" />
                    Mục đích và lý do
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {data.purpose && (
                      <div className="space-y-2">
                        <h3 className="text-sm font-semibold text-gray-700">Mục đích:</h3>
                        <div className="bg-green-50 p-3 rounded-lg border border-green-200 text-sm text-green-800">
                          {data.purpose}
                        </div>
                      </div>
                    )}
                    {data.reason && (
                      <div className="space-y-2">
                        <h3 className="text-sm font-semibold text-gray-700">Lý do:</h3>
                        <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200 text-sm text-emerald-800">
                          {data.reason}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Order Item Info */}
            {data.orderItemId && (
              <Card className="bg-white shadow-lg border-0">
                <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-indigo-100">
                  <CardTitle className="text-lg font-bold text-indigo-800 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-indigo-600" />
                    Thông tin đơn hàng
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Hash className="w-4 h-4 text-indigo-600" />
                        <span className="font-semibold text-indigo-800">Mã mục hàng:</span>
                        <Badge variant="secondary" className="bg-indigo-100 text-indigo-800">
                          {data.orderItemId.slice(0, 8)}...
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-indigo-600" />
                        <span className="font-semibold text-indigo-800">Sản phẩm:</span>
                        <span className="text-indigo-700">{data.orderItemProductName || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Coffee className="w-4 h-4 text-indigo-600" />
                        <span className="font-semibold text-indigo-800">Loại cà phê:</span>
                        <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                          {data.orderItemCoffeeTypeName || 'N/A'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Rejection Reason */}
            {data.status === 'Rejected' && data.reason && (
              <Card className="bg-white shadow-lg border-0">
                <CardHeader className="bg-gradient-to-r from-red-50 to-pink-50 border-b border-red-100">
                  <CardTitle className="text-lg font-bold text-red-800 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    Lý do từ chối
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="bg-red-50 p-4 rounded-lg border border-red-200 text-red-800">
                    {data.reason}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Actions */}
          <div className="space-y-6">
            {/* Actions */}
            <Card className="bg-white shadow-lg border-0">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-slate-50 border-b border-gray-100">
                <CardTitle className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-gray-600" />
                  Thao tác
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3">
                  <Button 
                    variant="outline" 
                    onClick={() => router.push('/dashboard/manager/warehouse-request')}
                    className="w-full h-10 border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    {t('managerWarehouseRequest.detail.backToList')}
                  </Button>

                  {data.status === 'Pending' && (
                    <Button 
                      variant="destructive" 
                      onClick={handleCancel}
                      className="w-full h-10 bg-red-600 hover:bg-red-700"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      {t('managerWarehouseRequest.actions.cancelRequest')}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Coffee Type Match Warning */}
            {data.orderItemId && data.coffeeTypeName && data.orderItemCoffeeTypeName && 
             data.coffeeTypeName.toLowerCase() !== data.orderItemCoffeeTypeName.toLowerCase() && (
              <Card className="bg-white shadow-lg border-0">
                <CardHeader className="bg-gradient-to-r from-red-50 to-pink-50 border-b border-red-100">
                  <CardTitle className="text-sm font-bold text-red-800 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    Cảnh báo loại cà phê
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                    <div className="text-red-700 text-xs space-y-1">
                      <div className="font-medium">⚠️ Loại cà phê không khớp!</div>
                      <div>Đơn hàng: {data.orderItemCoffeeTypeName}</div>
                      <div>Tồn kho: {data.coffeeTypeName}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
