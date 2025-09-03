'use client';

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getInventoryById } from "@/lib/api/inventory";
import { useParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Coffee, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Hash, Boxes, Tag, Warehouse, Building2, MapPin, Clock, Calendar, RefreshCw } from "lucide-react";

export default function InventoryDetailManagerPage() {
  const { t } = useTranslation();
  const { id } = useParams();
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

  // Helper function to determine coffee type (giống như Staff và List)
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
      case 'fresh': return <Coffee className="w-4 h-4 text-orange-600" />;
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
          color: 'text-orange-700',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200'
        };
      case 'processed':
        return {
          label: t('managerInventories.coffeeInfo.batch'),
          value: inventory?.batchCode ? `${inventory.batchCode} - ${inventory.coffeeTypeName || t('managerInventories.coffeeTypes.processed')}` : 'N/A',
          color: 'text-purple-700',
          bgColor: 'bg-purple-50',
          borderColor: 'border-purple-200'
        };
      default:
        return {
          label: t('managerInventories.coffeeInfo.info'),
          value: 'N/A',
          color: 'text-gray-700',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200'
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

  const specificCoffeeType = coffeeType === 'fresh' 
    ? (inventory.coffeeTypeNameDetail || inventory.coffeeTypeName || t('managerInventories.coffeeTypes.fresh'))
    : (inventory.productName || 'N/A');

  console.log('🔍 Coffee Type:', coffeeType);
  console.log('🔍 Coffee Info:', coffeeInfo);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Package className="w-8 h-8 text-orange-600" />
              {t('managerInventories.detail.title')}
            </h1>
            <p className="text-gray-600 mt-2">{t('managerInventories.detail.subtitle')}</p>
          </div>
          <Link href="/dashboard/manager/inventories">
            <Button variant="outline" className="rounded-lg border-orange-200 text-orange-700 hover:bg-orange-50">
              ← {t('managerInventories.detail.actions.backToList')}
            </Button>
          </Link>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Basic Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Inventory Basic Information */}
            <Card className="shadow-lg border-0 bg-white rounded-xl">
              <CardHeader className="bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-t-xl">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <Hash className="w-6 h-6" />
                  {t('managerInventories.detail.fields.inventoryCode')}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="text-center">
                  <Badge variant="secondary" className="text-2xl font-mono px-6 py-3 bg-orange-100 text-orange-800 border-orange-200">
                    {inventory.inventoryCode}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Coffee Type Information */}
            <Card className="shadow-lg border-0 bg-white rounded-xl">
              <CardHeader className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-t-xl">
                <CardTitle className="flex items-center gap-3 text-xl">
                  {coffeeTypeIcon}
                  {t('managerInventories.detail.fields.coffeeType')}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
                    <span className="font-medium text-gray-700">{t('managerInventories.detail.fields.coffeeType')}:</span>
                    <Badge variant="outline" className="text-purple-700 border-purple-300 bg-purple-50">
                      {coffeeTypeLabel}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
                    <span className="font-medium text-gray-700">{t('managerInventories.detail.fields.product')}:</span>
                    <Badge variant="outline" className="text-blue-700 border-blue-300 bg-blue-50">
                      {specificCoffeeType}
                    </Badge>
                  </div>

                  <div className={`p-4 rounded-lg border ${coffeeInfo.bgColor} ${coffeeInfo.borderColor}`}>
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-700">📦 {coffeeInfo.label}:</span>
                      <span className={`font-semibold ${coffeeInfo.color}`}>{coffeeInfo.value}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Product & Quantity Information */}
            <Card className="shadow-lg border-0 bg-white rounded-xl">
              <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-t-xl">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <Boxes className="w-6 h-6" />
                  {t('managerInventories.detail.productInfo')}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Tag className="w-4 h-4 text-green-600" />
                      <span className="font-medium text-gray-700">{t('managerInventories.detail.fields.product')}:</span>
                    </div>
                    <p className="text-green-800 font-semibold">
                      {coffeeType === 'fresh' 
                        ? (inventory.coffeeTypeNameDetail || inventory.coffeeTypeName || t('managerInventories.coffeeTypes.fresh'))
                        : (inventory.productName || 'N/A')
                      }
                    </p>
                  </div>
                  
                  <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Boxes className="w-4 h-4 text-emerald-600" />
                      <span className="font-medium text-gray-700">{t('managerInventories.detail.fields.quantity')}:</span>
                    </div>
                    <p className="text-emerald-800 font-semibold text-xl">
                      {inventory.quantity?.toLocaleString()} {inventory.unit}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Warehouse & Timestamps */}
          <div className="space-y-6">
            {/* Warehouse Information */}
            <Card className="shadow-lg border-0 bg-white rounded-xl">
              <CardHeader className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-t-xl">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <Warehouse className="w-6 h-6" />
                  {t('managerInventories.detail.warehouseInfo')}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Building2 className="w-4 h-4 text-blue-600" />
                      <span className="font-medium text-gray-700">{t('managerInventories.detail.fields.warehouseName')}:</span>
                    </div>
                    <p className="text-blue-800 font-semibold">{inventory.warehouseName}</p>
                  </div>
                  
                  <div className="p-4 bg-cyan-50 rounded-lg border border-cyan-200">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="w-4 h-4 text-cyan-600" />
                      <span className="font-medium text-gray-700">{t('managerInventories.detail.fields.warehouseName')}:</span>
                    </div>
                    <p className="text-cyan-800 font-semibold">
                      {inventory.warehouseLocation || inventory.warehouseAddress || t('managerInventories.detail.fields.warehouseName')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Timestamps */}
            <Card className="shadow-lg border-0 bg-white rounded-xl">
              <CardHeader className="bg-gradient-to-r from-gray-500 to-slate-500 text-white rounded-t-xl">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <Clock className="w-6 h-6" />
                  {t('managerInventories.detail.timestamps')}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-4 h-4 text-gray-600" />
                      <span className="font-medium text-gray-700">{t('managerInventories.detail.fields.createdAt')}:</span>
                    </div>
                    <p className="text-gray-800 font-semibold">
                      {new Date(inventory.createdAt).toLocaleString('vi-VN')}
                    </p>
                  </div>
                  
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex items-center gap-2 mb-2">
                      <RefreshCw className="w-4 h-4 text-slate-600" />
                      <span className="font-medium text-gray-700">{t('managerInventories.detail.fields.updatedAt')}:</span>
                    </div>
                    <p className="text-slate-800 font-semibold">
                      {new Date(inventory.updatedAt).toLocaleString('vi-VN')}
                    </p>
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
