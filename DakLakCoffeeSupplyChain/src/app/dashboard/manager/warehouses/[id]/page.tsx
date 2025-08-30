'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { getWarehouseById, deleteWarehouse } from '@/lib/api/warehouses';
import { getInventoriesByWarehouseIdForDetail } from '@/lib/api/inventory';
import { toast } from 'sonner';
import { useConfirmationDialog } from '@/components/ui/confirmation-dialog';
import {
  Hash,
  Building2,
  MapPin,
  Boxes,
  User,
  CalendarDays,
  RefreshCw,
  PackageOpen,
  Pencil,
  Trash2,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function WarehouseDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const router = useRouter();
  const [warehouse, setWarehouse] = useState<any>(null);
  const [inventories, setInventories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingInventory, setLoadingInventory] = useState(true);
  const [showInventories, setShowInventories] = useState(false);
  const { openDialog, ConfirmationDialog } = useConfirmationDialog();

  useEffect(() => {
    const fetchWarehouse = async () => {
      try {
        const res = await getWarehouseById(id as string);
        if (res.status === 1 && res.data) {
          setWarehouse(res.data);
        } else {
          toast.error(t('managerWarehouses.detail.error.loadData') + res.message);
        }
      } catch {
        toast.error(t('managerWarehouses.detail.error.loadData'));
      } finally {
        setLoading(false);
      }
    };

    const fetchInventories = async () => {
      try {
        const res = await getInventoriesByWarehouseIdForDetail(id as string);
        if (Array.isArray(res)) {
          setInventories(res);
        }
      } catch {
        console.warn('❌ Lỗi khi tải tồn kho');
      } finally {
        setLoadingInventory(false);
      }
    };

    fetchWarehouse();
    fetchInventories();
  }, [id, t]);

  const handleDelete = async () => {
    openDialog({
      title: t('managerWarehouses.detail.actions.deleteConfirm'),
      message: t('managerWarehouses.detail.actions.deleteMessage'),
      confirmText: t('managerWarehouses.detail.actions.delete'),
      cancelText: t('common.cancel'),
      type: "danger",
      onConfirm: async () => {
        const res = await deleteWarehouse(id as string);
        if (res.status === 1) {
          toast.success(t('managerWarehouses.detail.actions.deleteSuccess'));
          router.push('/dashboard/manager/warehouses');
        } else {
          toast.error(res.message);
        }
      }
    });
  };

  if (loading) {
    return <div className="p-6 text-gray-500">{t('managerWarehouses.detail.loading')}</div>;
  }

  if (!warehouse) {
    return <div className="p-6 text-red-500">{t('managerWarehouses.detail.error.notFound')}</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50">
      <div className="p-6 max-w-6xl mx-auto space-y-10">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-yellow-500 bg-clip-text text-transparent">
              {t('managerWarehouses.detail.title')}
            </h1>
            <p className="text-gray-600">{t('managerWarehouses.detail.subtitle')}</p>
          </div>
          <div className="flex gap-2">
            <Link href="/dashboard/manager/warehouses">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t('managerWarehouses.detail.actions.back')}
              </Button>
            </Link>
            <Link href={`/dashboard/manager/warehouses/${id}/edit`}>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                <Pencil className="w-4 h-4 mr-2" />
                {t('managerWarehouses.detail.actions.edit')}
              </Button>
            </Link>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleDelete}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {t('managerWarehouses.detail.actions.delete')}
            </Button>
          </div>
        </div>

        {/* Warehouse Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-orange-100 p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-orange-600" />
              {t('managerWarehouses.detail.warehouseInfo.title')}
            </h2>
            <div className="space-y-3">

              <div className="flex items-center gap-3">
                <Building2 className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">{t('managerWarehouses.detail.warehouseInfo.fields.name')}</span>
                <span className="font-semibold">{warehouse.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">{t('managerWarehouses.detail.warehouseInfo.fields.location')}</span>
                <span>{warehouse.location}</span>
              </div>
              <div className="flex items-center gap-3">
                <Boxes className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">{t('managerWarehouses.detail.warehouseInfo.fields.capacity')}</span>
                <span className="font-semibold">{warehouse.capacity?.toLocaleString() ?? 0} {t('managerWarehouses.stats.kg')}</span>
              </div>
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">{t('managerWarehouses.detail.warehouseInfo.fields.manager')}</span>
                <span className="font-semibold">{warehouse.managerName ?? t('common.notAvailable')}</span>
              </div>
              <div className="flex items-center gap-3">
                <CalendarDays className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">{t('managerWarehouses.detail.warehouseInfo.fields.createdAt')}</span>
                <span>{new Date(warehouse.createdAt).toLocaleDateString('vi-VN')}</span>
              </div>
              <div className="flex items-center gap-3">
                <RefreshCw className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">{t('managerWarehouses.detail.warehouseInfo.fields.updatedAt')}</span>
                <span>{new Date(warehouse.updatedAt).toLocaleDateString('vi-VN')}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-orange-100 p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <PackageOpen className="w-5 h-5 text-orange-600" />
              {t('managerWarehouses.detail.inventoryInfo.title')}
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">{t('managerWarehouses.detail.inventoryInfo.fields.itemTypes')}</span>
                <span className="font-semibold">{inventories.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">{t('managerWarehouses.detail.inventoryInfo.fields.totalQuantity')}</span>
                <span className="font-semibold">
                  {inventories.reduce((sum, inv) => sum + (inv.quantity || 0), 0).toLocaleString()} {t('managerWarehouses.stats.kg')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">{t('managerWarehouses.detail.inventoryInfo.fields.usageRate')}</span>
                <span className="font-semibold">
                  {warehouse.capacity ? 
                    ((inventories.reduce((sum, inv) => sum + (inv.quantity || 0), 0) / warehouse.capacity) * 100).toFixed(1)
                    : 0
                  }%
                </span>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full mt-4 border-orange-200 text-orange-700 hover:bg-orange-50"
              onClick={() => setShowInventories(!showInventories)}
            >
              {showInventories ? (
                <>
                  <ChevronUp className="w-4 h-4 mr-2" />
                  {t('managerWarehouses.detail.actions.hideInventory')}
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 mr-2" />
                  {t('managerWarehouses.detail.actions.showInventory')}
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Inventories List */}
        {showInventories && (
          <div className="bg-white rounded-xl shadow-sm border border-orange-100 p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">{t('managerWarehouses.detail.inventoryList.title')}</h2>
            {loadingInventory ? (
              <div className="text-center py-4 text-gray-500">{t('managerWarehouses.detail.inventoryList.loading')}</div>
            ) : inventories.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <PackageOpen className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>{t('managerWarehouses.detail.inventoryList.empty')}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 px-4 font-medium text-gray-700">{t('managerWarehouses.detail.inventoryList.headers.inventoryCode')}</th>
                      <th className="text-left py-2 px-4 font-medium text-gray-700">{t('managerWarehouses.detail.inventoryList.headers.product')}</th>
                      <th className="text-right py-2 px-4 font-medium text-gray-700">{t('managerWarehouses.detail.inventoryList.headers.quantity')}</th>
                      <th className="text-left py-2 px-4 font-medium text-gray-700">{t('managerWarehouses.detail.inventoryList.headers.unit')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventories.map((inv) => (
                      <tr key={inv.inventoryId} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-2 px-4 font-mono text-sm">{inv.inventoryCode}</td>
                        <td className="py-2 px-4">{inv.productName || inv.coffeeTypeName || t('common.notAvailable')}</td>
                        <td className="py-2 px-4 text-right font-semibold">{inv.quantity?.toLocaleString()}</td>
                        <td className="py-2 px-4">{inv.unit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Confirmation Dialog */}
      <ConfirmationDialog />
    </div>
  );
}
