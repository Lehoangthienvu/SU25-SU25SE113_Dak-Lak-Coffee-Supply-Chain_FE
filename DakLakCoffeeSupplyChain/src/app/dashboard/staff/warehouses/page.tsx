'use client';

import { useEffect, useState } from 'react';
import { getAllWarehouses } from '@/lib/api/warehouses';
import { getInventoriesByWarehouseId } from '@/lib/api/inventory';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Eye, Search, Warehouse, MapPin, Package, TrendingUp, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

type Warehouse = {
  warehouseId: string;
  name: string;
  location: string;
  capacity?: number;
};

export default function StaffWarehouseListPage() {
  const { t } = useTranslation();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [usedCapacities, setUsedCapacities] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await getAllWarehouses();
        const list = Array.isArray(res) ? res : res?.data || [];

        setWarehouses(list);

        const usageMap: Record<string, number> = {};
        for (const warehouse of list) {
          try {
            const inventories = await getInventoriesByWarehouseId(warehouse.warehouseId);
            const totalUsed = inventories.reduce((sum: number, i: any) => sum + i.quantity, 0);
            usageMap[warehouse.warehouseId] = totalUsed;
          } catch {
            usageMap[warehouse.warehouseId] = 0;
          }
        }
        setUsedCapacities(usageMap);
      } catch (error) {
        toast.error(t('warehouses.error.description'));
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-6 space-y-6">
      {/* Header với gradient xanh lá */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-4 text-white shadow-lg">
        <div className="flex items-center gap-3 mb-2">
          <Warehouse className="w-6 h-6" />
          <h1 className="text-2xl font-bold">📦 {t('warehouses.title')}</h1>
        </div>
        <p className="text-green-100 text-base">{t('warehouses.subtitle')}</p>
      </div>

      {/* Thống kê tổng quan */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white shadow-md hover:shadow-lg transition-shadow border-0">
          <CardContent className="p-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Warehouse className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600 font-medium">{t('warehouses.stats.totalWarehouses')}</p>
                <p className="text-xl font-bold text-green-600">{totalWarehouses}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-md hover:shadow-lg transition-shadow border-0">
          <CardContent className="p-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600 font-medium">{t('warehouses.stats.totalCapacity')}</p>
                <p className="text-xl font-bold text-emerald-600">{totalCapacity.toLocaleString()} kg</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-md hover:shadow-lg transition-shadow border-0">
          <CardContent className="p-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-teal-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600 font-medium">{t('warehouses.stats.usedCapacity')}</p>
                <p className="text-xl font-bold text-teal-600">{totalUsed.toLocaleString()} kg</p>
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
                <p className="text-xs text-gray-600 font-medium">{t('warehouses.stats.criticalWarehouses')}</p>
                <p className="text-xl font-bold text-amber-600">{criticalWarehouses.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Thanh tìm kiếm */}
      <Card className="bg-white shadow-md border-0">
        <CardContent className="p-3">
          <div className="flex flex-wrap justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Input
                  placeholder={t('warehouses.search.placeholder')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-72 pr-10 border-green-200 focus:border-green-400 focus:ring-green-400 text-sm"
                />
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-400" />
              </div>
              {search && (
                <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                  {filtered.length} kết quả
                </Badge>
              )}
            </div>
            <div className="text-sm text-gray-500">
              💡 {t('warehouses.staffNote')}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Nội dung kho hàng */}
      {loading ? (
        <Card className="bg-white shadow-md border-0">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg">{t('warehouses.loading.title')}</p>
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="bg-white shadow-md border-0">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Warehouse className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 text-lg mb-2">{t('warehouses.empty.title')}</p>
            <p className="text-gray-400 text-sm">{t('warehouses.empty.description')}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((warehouse) => {
            const used = usedCapacities[warehouse.warehouseId] || 0;
            const total = warehouse.capacity || 0;
            const usagePercent = total > 0 ? (used / total) * 100 : 0;
            const isCritical = total > 0 && usagePercent > 80;
            const isWarning = total > 0 && usagePercent > 60;
            const available = Math.max(0, total - used);

            return (
              <Card key={warehouse.warehouseId} className="bg-white shadow-md hover:shadow-lg transition-all duration-300 border-0 group">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-semibold text-gray-800 group-hover:text-green-700 transition-colors">
                        {warehouse.name}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <p className="text-sm text-gray-600">{warehouse.location}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isCritical && (
                                                   <Badge className="bg-red-100 text-red-800 border-red-200 text-xs">
                             <AlertTriangle className="w-3 h-3 mr-1" />
                             {t('warehouses.status.critical')}
                           </Badge>
                      )}
                      {isWarning && !isCritical && (
                                                 <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 text-xs">
                           <AlertTriangle className="w-3 h-3 mr-1" />
                           {t('warehouses.status.warning')}
                         </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {/* Biểu đồ tròn */}
                    {total > 0 && (
                      <div className="flex items-center gap-4">
                        <div className="w-24 h-24">
                          <Doughnut
                            data={{
                                                             labels: [t('warehouses.chart.used'), t('warehouses.chart.available')],
                              datasets: [
                                {
                                  data: [used, available],
                                  backgroundColor: ["#10B981", "#86EFAC"], // Xanh lá cho Staff
                                  hoverOffset: 6,
                                },
                              ],
                            }}
                            options={{
                              plugins: {
                                legend: {
                                  display: false,
                                },
                              },
                              cutout: "60%",
                            }}
                          />
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="text-center p-2 bg-gray-50 rounded-lg">
                                                         <p className="text-xs text-gray-500 font-medium">{t('warehouses.capacity.total')}</p>
                            <p className="text-sm font-semibold text-gray-900">
                              {total.toLocaleString()} kg
                            </p>
                          </div>
                          <div className="text-center p-2 bg-gray-50 rounded-lg">
                                                         <p className="text-xs text-gray-500 font-medium">{t('warehouses.capacity.used')}</p>
                            <p className="text-sm font-semibold text-gray-900">
                              {used.toLocaleString()} kg
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Thanh tiến trình sử dụng */}
                    {total > 0 && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                                                     <span className="text-gray-500">{t('warehouses.usage.rate')}</span>
                          <span className={`font-medium ${
                            isCritical ? 'text-red-600' : 
                            isWarning ? 'text-yellow-600' : 'text-green-600'
                          }`}>
                            {usagePercent.toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${
                              isCritical ? 'bg-red-500' : 
                              isWarning ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${Math.min(usagePercent, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    )}

                    {/* Thông tin bổ sung */}
                    <div className="pt-2 border-t border-gray-100">
                      <div className="flex items-center justify-between text-xs text-gray-500">
                                                 <span>{t('warehouses.status.label')}:</span>
                        <span className={`font-medium ${
                          isCritical ? 'text-red-600' : 
                          isWarning ? 'text-yellow-600' : 'text-green-600'
                        }`}>
                                                     {isCritical ? t('warehouses.status.overloaded') : 
                            isWarning ? t('warehouses.status.attention') : t('warehouses.status.normal')}
                        </span>
                      </div>
                    </div>

                    {/* Nút xem chi tiết */}
                    <div className="pt-2">
                      <Link href={`/dashboard/staff/warehouses/${warehouse.warehouseId}`}>
                        <Button 
                          variant="outline" 
                          className="w-full border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300 transition-colors"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                                                     {t('warehouses.actions.viewDetails')}
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Thông tin tổng quan */}
      {!loading && filtered.length > 0 && (
        <Card className="bg-white shadow-md border-0">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-green-50 rounded-lg">
                                 <p className="text-sm text-gray-600 mb-1">{t('warehouses.overview.avgUsage')}</p>
                <p className="text-2xl font-bold text-green-600">
                  {avgUsagePercent.toFixed(1)}%
                </p>
              </div>
              <div className="p-3 bg-emerald-50 rounded-lg">
                                 <p className="text-sm text-gray-600 mb-1">{t('warehouses.overview.availableCapacity')}</p>
                <p className="text-2xl font-bold text-emerald-600">
                  {totalAvailable.toLocaleString()} kg
                </p>
              </div>
              <div className="p-3 bg-teal-50 rounded-lg">
                                 <p className="text-sm text-gray-600 mb-1">{t('warehouses.overview.healthyWarehouses')}</p>
                <p className="text-2xl font-bold text-teal-600">
                  {filtered.length - criticalWarehouses.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
