'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getAllWarehouses, deleteWarehouse } from '@/lib/api/warehouses';
import { getInventoriesByWarehouseId } from '@/lib/api/inventory';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, Eye, Plus, Search, Warehouse, MapPin, Package, TrendingUp, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useConfirmationDialog } from '@/components/ui/confirmation-dialog';
import Link from 'next/link';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

type Warehouse = {
  warehouseId: string;
  name: string;
  location: string;
  capacity?: number;
  usedCapacity: number;
};

export default function WarehouseListPage() {
  const { t } = useTranslation();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [usedCapacities, setUsedCapacities] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { openDialog, ConfirmationDialog } = useConfirmationDialog();

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await getAllWarehouses();
        const list = Array.isArray(res) ? res : res?.data || [];

        setWarehouses(list);

        // ✅ Tối ưu hóa: Sử dụng usedCapacity từ API thay vì gọi riêng
        const usageMap: Record<string, number> = {};
        for (const warehouse of list) {
          usageMap[warehouse.warehouseId] = warehouse.usedCapacity || 0;
        }
        setUsedCapacities(usageMap);
              } catch (error) {
          toast.error(t('managerWarehouses.error.loadData'));
        } finally {
          setLoading(false);
        }
      }

      fetchData();
    }, [t]);

  const filtered = warehouses.filter((w) =>
    w.name.toLowerCase().includes(search.toLowerCase())
  );

  // Tính toán thống kê
  const totalWarehouses = warehouses.length;
  const totalCapacity = warehouses.reduce((sum, w) => sum + (w.capacity || 0), 0);
  const totalUsed = Object.values(usedCapacities).reduce((sum, used) => sum + used, 0);
  const totalAvailable = Math.max(0, totalCapacity - totalUsed);
  const avgUsagePercent = totalCapacity > 0 ? (totalUsed / totalCapacity) * 100 : 0;

  // Phân loại kho theo mức sử dụng
  const criticalWarehouses = filtered.filter(w => {
    const used = usedCapacities[w.warehouseId] || 0;
    const total = w.capacity || 0;
    return total > 0 && (used / total) > 0.8;
  });

  const handleDelete = async (id: string) => {
    openDialog({
      title: t('managerWarehouses.error.deleteConfirm'),
      message: t('managerWarehouses.error.deleteConfirm'),
      confirmText: t('managerWarehouses.actions.delete'),
      cancelText: t('common.cancel'),
      type: "danger",
      onConfirm: async () => {
        const res = await deleteWarehouse(id);
        if (res.status === 1) {
          toast.success(t('managerWarehouses.success.deleteSuccess'));
          setWarehouses((prev) => prev.filter((w) => w.warehouseId !== id));
        } else {
          toast.error(res.message);
        }
      }
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 p-6 space-y-6">
      {/* Header với gradient */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl p-4 text-white shadow-lg">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-bold">{t('managerWarehouses.title')}</h1>
        </div>
        <p className="text-amber-100 text-base">{t('managerWarehouses.subtitle')}</p>
      </div>

      {/* Thống kê tổng quan */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white shadow-md hover:shadow-lg transition-shadow border-0">
          <CardContent className="p-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Warehouse className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600 font-medium">{t('managerWarehouses.stats.totalWarehouses')}</p>
                <p className="text-xl font-bold text-blue-600">{totalWarehouses}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-md hover:shadow-lg transition-shadow border-0">
          <CardContent className="p-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600 font-medium">{t('managerWarehouses.stats.totalCapacity')}</p>
                <p className="text-xl font-bold text-green-600">{totalCapacity.toLocaleString()} {t('managerWarehouses.stats.kg')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-md hover:shadow-lg transition-shadow border-0">
          <CardContent className="p-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600 font-medium">{t('managerWarehouses.stats.usedCapacity')}</p>
                <p className="text-xl font-bold text-orange-600">{totalUsed.toLocaleString()} {t('managerWarehouses.stats.kg')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-md hover:shadow-lg transition-shadow border-0">
          <CardContent className="p-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600 font-medium">{t('managerWarehouses.stats.criticalWarehouses')}</p>
                <p className="text-xl font-bold text-amber-600">{criticalWarehouses.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Thanh tìm kiếm và tạo mới */}
      <Card className="bg-white shadow-md border-0">
        <CardContent className="p-3">
          <div className="flex flex-wrap justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Input
                  placeholder={t('managerWarehouses.search.placeholder')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-72 pr-10 border-amber-200 focus:border-amber-400 focus:ring-amber-400 text-sm"
                />
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-amber-400" />
              </div>
              {search && (
                <Badge variant="secondary" className="bg-amber-100 text-amber-800 text-xs">
                  {filtered.length} {t('managerWarehouses.search.results')}
                </Badge>
              )}
            </div>
            <Link href="/dashboard/manager/warehouses/create">
              <Button className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 text-sm px-4 py-2">
                <Plus className="w-4 h-4 mr-2" />
                {t('managerWarehouses.actions.createNew')}
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Nội dung kho hàng */}
      {loading ? (
        <Card className="bg-white shadow-md border-0">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg">{t('managerWarehouses.loading.title')}</p>
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="bg-white shadow-md border-0">
          <CardContent className="p-8 text-center">
            <Warehouse className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-2">{t('managerWarehouses.empty.title')}</p>
            <p className="text-gray-400">{t('managerWarehouses.empty.description')}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((warehouse) => {
            const used = usedCapacities[warehouse.warehouseId] || 0;
            const total = warehouse.capacity || 0;
            const available = Math.max(0, total - used);
            const usedPercent = total > 0 ? (used / total) * 100 : 0;
            const isCritical = usedPercent > 80;
            const isWarning = usedPercent > 60;

            return (
              <Card key={warehouse.warehouseId} className="bg-white shadow-lg hover:shadow-xl transition-all duration-300 border-0 overflow-hidden group">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        isCritical ? 'bg-red-500' : isWarning ? 'bg-yellow-500' : 'bg-green-500'
                      }`}></div>
                      <Badge variant="outline" className="text-xs">
                        {isCritical ? t('managerWarehouses.status.critical') : isWarning ? t('managerWarehouses.status.warning') : t('managerWarehouses.status.normal')}
                      </Badge>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex gap-1">
                        <Link href={`/dashboard/manager/warehouses/${warehouse.warehouseId}`}>
                          <Button size="icon" variant="outline" className="w-7 h-7">
                            <Eye className="w-3 h-3" />
                          </Button>
                        </Link>
                        <Button
                          size="icon"
                          variant="destructive"
                          className="w-7 h-7"
                          onClick={() => handleDelete(warehouse.warehouseId)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-3 pt-0">
                  <div className="flex items-start gap-3">
                    {/* Biểu đồ tròn */}
                    <div className="w-16 h-16 relative">
                      <Doughnut
                        data={{
                          labels: [t('managerWarehouses.stats.usedCapacity'), t('managerWarehouses.detail.available')],
                          datasets: [
                            {
                              data: [used, available],
                              backgroundColor: [
                                isCritical ? '#EF4444' : isWarning ? '#F59E0B' : '#10B981',
                                '#E5E7EB'
                              ],
                              hoverOffset: 6,
                              borderWidth: 0,
                            },
                          ],
                        }}
                        options={{
                          plugins: { legend: { display: false } },
                          cutout: '65%',
                          responsive: true,
                          maintainAspectRatio: false,
                        }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className={`text-xs font-bold ${
                          isCritical ? 'text-red-600' : isWarning ? 'text-yellow-600' : 'text-green-600'
                        }`}>
                          {usedPercent.toFixed(0)}%
                        </span>
                      </div>
                    </div>

                    {/* Thông tin kho */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-bold text-gray-800 mb-2 truncate">
                        {warehouse.name}
                      </h3>
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <span className="truncate">{warehouse.location}</span>
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-600">{t('managerWarehouses.stats.totalCapacity')}:</span>
                            <span className="font-semibold text-gray-800">
                              {total.toLocaleString()} {t('managerWarehouses.stats.kg')}
                            </span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-600">{t('managerWarehouses.stats.usedCapacity')}:</span>
                            <span className={`font-semibold ${
                              isCritical ? 'text-red-600' : isWarning ? 'text-yellow-600' : 'text-green-600'
                            }`}>
                              {used.toLocaleString()} {t('managerWarehouses.stats.kg')}
                            </span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-600">{t('managerWarehouses.detail.available')}:</span>
                            <span className="font-semibold text-gray-800">
                              {available.toLocaleString()} {t('managerWarehouses.stats.kg')}
                            </span>
                          </div>
                        </div>

                        {/* Thanh tiến trình */}
                        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                          <div
                            className={`h-1.5 rounded-full transition-all duration-300 ${
                              isCritical ? 'bg-red-500' : isWarning ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${Math.min(usedPercent, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      
      {/* Confirmation Dialog */}
      <ConfirmationDialog />
    </div>
  );
}
