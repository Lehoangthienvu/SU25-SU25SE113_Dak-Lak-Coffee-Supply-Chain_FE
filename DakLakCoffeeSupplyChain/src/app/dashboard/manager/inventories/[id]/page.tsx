'use client';

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getInventoryById } from "@/lib/api/inventory";
import { useParams, useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { 
  Coffee, 
  Package, 
  Warehouse, 
  Hash, 
  CalendarClock, 
  TrendingUp, 
  MapPin, 
  ArrowLeft,
  Leaf,
  Boxes,
  Clock,
  Star
} from "lucide-react";

export default function InventoryDetailManagerPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const router = useRouter();
  const [inventory, setInventory] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (id) {
      async function fetchInventory() {
        try {
          const res = await getInventoryById(id as string);
          console.log('🔍 Inventory API Response:', res); // Debug log
          
          if (res?.data) {
            setInventory(res.data);
            console.log('🔍 Inventory Data:', res.data); // Debug log
          } else if (res?.inventoryId) {
            setInventory(res);
            console.log('🔍 Inventory Direct:', res); // Debug log
          } else {
            setError(res.message || t('managerInventories.error.notFound'));
          }
        } catch (err: any) {
          setError(err.message || t('managerInventories.error.loadInventoryData'));
        }
      }
      fetchInventory();
    }
  }, [id, t]);

  // Helper function to determine coffee type
  const getCoffeeType = (inventory: any) => {
    console.log('🔍 getCoffeeType input:', { batchId: inventory.batchId, detailId: inventory.detailId });
    
    // Cà phê đã sơ chế: có batchId, không có detailId
    if (inventory.batchId && !inventory.detailId) {
      console.log('🔍 Returning processed');
      return 'processed';
    }
    // Cà phê tươi: không có batchId, có detailId
    if (!inventory.batchId && inventory.detailId) {
      console.log('🔍 Returning fresh');
      return 'fresh';
    }
    
    console.log('🔍 Returning unknown');
    return 'unknown';
  };

  const getCoffeeTypeLabel = (inventory: any) => {
    const type = getCoffeeType(inventory);
    switch (type) {
      case 'fresh': return t('managerInventories.coffeeTypes.fresh');
      case 'processed': return t('managerInventories.coffeeTypes.processed');
      default: return t('managerInventories.coffeeTypes.unknown');
    }
  };

  const getCoffeeTypeIcon = (inventory: any) => {
    const type = getCoffeeType(inventory);
    switch (type) {
      case 'fresh': return <Leaf className="w-4 h-4 text-orange-600" />;
      case 'processed': return <Coffee className="w-4 h-4 text-purple-600" />;
      default: return <Package className="w-4 h-4 text-gray-600" />;
    }
  };

  const getCoffeeInfo = (inventory: any) => {
    const type = getCoffeeType(inventory);
    switch (type) {
      case 'fresh':
        return {
          label: t('managerInventories.coffeeInfo.season'),
          value: inventory?.cropSeasonName || inventory?.detailCode || 'N/A',
          color: 'text-orange-700'
        };
      case 'processed':
        return {
          label: t('managerInventories.coffeeInfo.batch'),
          value: inventory?.batchCode ? `${inventory.batchCode} - ${inventory.coffeeTypeName || t('managerInventories.coffeeTypes.processed')}` : 'N/A',
          color: 'text-purple-700'
        };
      default:
        return {
          label: t('managerInventories.coffeeInfo.info'),
          value: 'N/A',
          color: 'text-gray-700'
        };
    }
  };

  if (error) return <div className="text-red-500 p-6">{error}</div>;
  if (!inventory) return <div className="p-6">{t('managerInventories.detail.loading')}</div>;

  // Debug logs
  console.log('🔍 Inventory Object:', inventory);
  console.log('🔍 BatchId:', inventory.batchId);
  console.log('🔍 DetailId:', inventory.detailId);

  const coffeeType = getCoffeeType(inventory);
  const coffeeTypeLabel = getCoffeeTypeLabel(inventory);
  const coffeeTypeIcon = getCoffeeTypeIcon(inventory);
  const coffeeInfo = getCoffeeInfo(inventory);

  console.log('🔍 Coffee Type:', coffeeType);
  console.log('🔍 Coffee Info:', coffeeInfo);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-100 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">{t('managerInventories.detail.title')}</h1>
                <p className="text-orange-100 text-sm mt-1">Thông tin chi tiết tồn kho</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={() => router.push('/dashboard/manager/inventories')}
              className="bg-white/90 text-orange-600 border-white hover:bg-white hover:text-orange-700 font-medium shadow-md"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('managerInventories.detail.actions.backToList')}
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Basic Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Inventory Info */}
            <Card className="bg-white shadow-lg border-0">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
                <CardTitle className="text-lg font-bold text-blue-800 flex items-center gap-2">
                  <Package className="w-5 h-5 text-blue-600" />
                  Thông tin tồn kho
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Hash className="w-4 h-4 text-blue-600" />
                      <span className="font-semibold text-gray-700">Mã tồn kho:</span>
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        {inventory.inventoryCode}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Warehouse className="w-4 h-4 text-orange-600" />
                      <span className="font-semibold text-gray-700">Kho:</span>
                      <span className="text-gray-800">{inventory.warehouseName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-green-600" />
                      <span className="font-semibold text-gray-700">Số lượng:</span>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        {inventory.quantity} {inventory.unit}
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <CalendarClock className="w-4 h-4 text-purple-600" />
                      <span className="font-semibold text-gray-700">Ngày tạo:</span>
                      <span className="text-gray-800">{new Date(inventory.createdAt).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-indigo-600" />
                      <span className="font-semibold text-gray-700">Cập nhật lần cuối:</span>
                      <span className="text-gray-800">{new Date(inventory.updatedAt).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Coffee Info */}
            <Card className="bg-white shadow-lg border-0">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100">
                <CardTitle className="text-lg font-bold text-green-800 flex items-center gap-2">
                  <Coffee className="w-5 h-5 text-green-600" />
                  Thông tin cà phê
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Coffee Type */}
                  <div className="space-y-4">
                    <h3 className="text-md font-semibold text-gray-800 flex items-center gap-2">
                      <Coffee className="w-4 h-4 text-purple-600" />
                      Loại cà phê
                    </h3>
                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                      <div className="flex items-center gap-2 mb-2">
                        {coffeeTypeIcon}
                        <span className="font-semibold text-purple-800">{coffeeTypeLabel}</span>
                      </div>
                      <div className="text-purple-700 text-sm">
                        {coffeeType === 'processed' && inventory.coffeeTypeName && (
                          <div className="flex items-center gap-2">
                            <Star className="w-3 h-3 text-purple-600" />
                            <span>{inventory.coffeeTypeName}</span>
                          </div>
                        )}
                        {coffeeType === 'fresh' && inventory.coffeeTypeNameDetail && (
                          <div className="flex items-center gap-2">
                            <Leaf className="w-3 h-3 text-orange-600" />
                            <span>{inventory.coffeeTypeNameDetail}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Batch/Season Info */}
                  <div className="space-y-4">
                    <h3 className="text-md font-semibold text-gray-800 flex items-center gap-2">
                      <Boxes className="w-4 h-4 text-blue-600" />
                      {coffeeType === 'processed' ? 'Thông tin mẻ' : 'Thông tin mùa vụ'}
                    </h3>
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <div className="space-y-2">
                        {coffeeType === 'processed' && (
                          <>
                            <div className="flex items-center gap-2">
                              <Hash className="w-3 h-3 text-blue-600" />
                              <span className="font-medium text-blue-800">Mã mẻ:</span>
                              <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
                                {inventory.batchCode || 'N/A'}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              <Package className="w-3 h-3 text-blue-600" />
                              <span className="font-medium text-blue-800">Sản phẩm:</span>
                              <span className="text-blue-700">{inventory.productName || 'N/A'}</span>
                            </div>
                          </>
                        )}
                        {coffeeType === 'fresh' && (
                          <>
                            <div className="flex items-center gap-2">
                              <Hash className="w-3 h-3 text-blue-600" />
                              <span className="font-medium text-blue-800">Mùa vụ:</span>
                              <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
                                {inventory.cropSeasonName || inventory.detailCode || 'N/A'}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              <Package className="w-3 h-3 text-blue-600" />
                              <span className="font-medium text-blue-800">Sản phẩm:</span>
                              <span className="text-blue-700">{inventory.productName || 'N/A'}</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Additional Info */}
            {(inventory.farmerName || inventory.farmLocation || inventory.evaluationResult) && (
              <Card className="bg-white shadow-lg border-0">
                <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-indigo-100">
                  <CardTitle className="text-lg font-bold text-indigo-800 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-indigo-600" />
                    Thông tin bổ sung
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {inventory.farmerName && (
                      <div className="space-y-2">
                        <h3 className="text-sm font-semibold text-gray-700">Nông dân:</h3>
                        <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-200 text-sm text-indigo-800">
                          {inventory.farmerName}
                        </div>
                      </div>
                    )}
                    {inventory.farmLocation && (
                      <div className="space-y-2">
                        <h3 className="text-sm font-semibold text-gray-700">Vị trí nông trại:</h3>
                        <div className="bg-purple-50 p-3 rounded-lg border border-purple-200 text-sm text-purple-800">
                          {inventory.farmLocation}
                        </div>
                      </div>
                    )}
                    {inventory.evaluationResult && (
                      <div className="space-y-2">
                        <h3 className="text-sm font-semibold text-gray-700">Kết quả đánh giá:</h3>
                        <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200 text-sm text-emerald-800">
                          {inventory.evaluationResult}
                          {inventory.totalScore && (
                            <div className="mt-1 text-xs">
                              Điểm: {inventory.totalScore}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
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
                  <Package className="w-5 h-5 text-gray-600" />
                  Thao tác
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3">
                  <Button 
                    variant="outline" 
                    onClick={() => router.push('/dashboard/manager/inventories')}
                    className="w-full h-10 border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    {t('managerInventories.detail.actions.backToList')}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Coffee Type Summary */}
            <Card className="bg-white shadow-lg border-0">
              <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100">
                <CardTitle className="text-sm font-bold text-amber-800 flex items-center gap-2">
                  <Coffee className="w-4 h-4 text-amber-600" />
                  Tóm tắt loại cà phê
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
                  <div className="text-amber-700 text-xs space-y-1">
                    <div className="font-medium">📦 {coffeeTypeLabel}</div>
                    <div className="flex items-center gap-2">
                      {coffeeTypeIcon}
                      <span>
                        {coffeeType === 'processed' && inventory.coffeeTypeName && inventory.coffeeTypeName}
                        {coffeeType === 'fresh' && inventory.coffeeTypeNameDetail && inventory.coffeeTypeNameDetail}
                        {coffeeType === 'unknown' && 'Không xác định'}
                      </span>
                    </div>
                    <div className="text-xs text-amber-600">
                      {coffeeInfo.label}: {coffeeInfo.value}
                    </div>
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
