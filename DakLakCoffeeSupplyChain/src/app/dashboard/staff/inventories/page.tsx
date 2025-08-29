'use client';

import { useEffect, useState } from 'react';
import { getAllInventories } from '@/lib/api/inventory';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, Search, Eye, Package, TrendingUp, AlertTriangle, Warehouse, Coffee, Leaf } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

export default function StaffInventoryListPage() {
  const { t } = useTranslation();
  const [inventories, setInventories] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [coffeeTypeFilter, setCoffeeTypeFilter] = useState<string>('all'); // 'all', 'processed', 'fresh'
  const [warehouseFilter, setWarehouseFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const pageSize = 10;

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await getAllInventories();
        if (Array.isArray(res?.data)) {
          setInventories(res.data);
        } else if (Array.isArray(res)) {
          setInventories(res);
        } else {
          toast.error(res.message || t('inventories.error.description'));
        }
      } catch (err: any) {
        toast.error(`❌ ${t('inventories.error.description')}: ${err.message}`);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Helper function to determine coffee type
  const getCoffeeType = (inventory: any) => {
    // Cà phê đã sơ chế: có batchId, không có detailId
    if (inventory.batchId && !inventory.detailId) return 'processed';
    // Cà phê tươi: không có batchId, có detailId
    if (!inventory.batchId && inventory.detailId) return 'fresh';
    return 'unknown';
  };

  const getCoffeeTypeLabel = (inventory: any) => {
    const type = getCoffeeType(inventory);
    switch (type) {
      case 'fresh': return t('inventories.coffeeTypes.fresh');
      case 'processed': return t('inventories.coffeeTypes.processed');
      default: return t('inventories.coffeeTypes.unknown');
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
          label: t('inventories.infoLabels.cropSeason'),
          value: inventory?.cropSeasonName || inventory?.detailCode || 'N/A',
          color: 'text-orange-700'
        };
      case 'processed':
        return {
          label: t('inventories.infoLabels.batch'),
          value: inventory?.batchCode ? `${inventory.batchCode} - ${inventory.coffeeTypeName || t('inventories.coffeeTypes.processed')}` : 'N/A',
          color: 'text-purple-700'
        };
      default:
        return {
          label: t('inventories.infoLabels.info'),
          value: 'N/A',
          color: 'text-gray-700'
        };
    }
  };

  const filtered = inventories.filter((inv) => {
    const matchesSearch = 
      inv.inventoryCode?.toLowerCase().includes(search.toLowerCase()) ||
      inv.warehouseName?.toLowerCase().includes(search.toLowerCase()) ||
      inv.productName?.toLowerCase().includes(search.toLowerCase()) ||
      inv.batchCode?.toLowerCase().includes(search.toLowerCase()) ||
      inv.cropSeasonName?.toLowerCase().includes(search.toLowerCase()) ||
      inv.detailCode?.toLowerCase().includes(search.toLowerCase()) ||
      inv.coffeeTypeNameDetail?.toLowerCase().includes(search.toLowerCase()) ||
      inv.typeName?.toLowerCase().includes(search.toLowerCase());

    const matchesType = 
      coffeeTypeFilter === 'all' || 
      getCoffeeType(inv) === coffeeTypeFilter;

    const matchesWarehouse = 
      warehouseFilter === 'all' || 
      inv.warehouseName === warehouseFilter;

    return matchesSearch && matchesType && matchesWarehouse;
  });

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paged = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Tính toán thống kê
  const totalInventories = inventories.length;
  const totalQuantity = inventories.reduce((sum, inv) => sum + (inv.quantity || 0), 0);
  const inStockCount = inventories.filter(inv => (inv.quantity || 0) > 0).length;
  const outOfStockCount = totalInventories - inStockCount;
  const uniqueWarehouses = [...new Set(inventories.map(inv => inv.warehouseName))].length;
  const uniqueProducts = [...new Set(inventories.map(inv => inv.productName))].length;

  // Thống kê theo loại cà phê
  const freshCoffeeInventories = inventories.filter(inv => getCoffeeType(inv) === 'fresh');
  const processedCoffeeInventories = inventories.filter(inv => getCoffeeType(inv) === 'processed');
  const freshCoffeeQuantity = freshCoffeeInventories.reduce((sum, inv) => sum + (inv.quantity || 0), 0);
  const processedCoffeeQuantity = processedCoffeeInventories.reduce((sum, inv) => sum + (inv.quantity || 0), 0);

  // Danh sách kho để filter
  const warehouseList = [...new Set(inventories.map(inv => inv.warehouseName))].filter(Boolean);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-6 space-y-6">
      {/* Header với gradient xanh lá */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-4 text-white shadow-lg">
        <div className="flex items-center gap-3 mb-2">
          <Package className="w-6 h-6" />
          <h1 className="text-2xl font-bold">📦 {t('inventories.title')}</h1>
        </div>
        <p className="text-green-100 text-base">{t('inventories.subtitle')}</p>
      </div>

      {/* Thống kê tổng quan */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white shadow-md hover:shadow-lg transition-shadow border-0">
          <CardContent className="p-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600 font-medium">{t('inventories.stats.totalInventory')}</p>
                <p className="text-xl font-bold text-green-600">{totalQuantity.toLocaleString()} kg</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-md hover:shadow-lg transition-shadow border-0">
          <CardContent className="p-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600 font-medium">{t('inventories.stats.inStockBatches')}</p>
                <p className="text-xl font-bold text-emerald-600">{inStockCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-md hover:shadow-lg transition-shadow border-0">
          <CardContent className="p-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                <Warehouse className="w-5 h-5 text-teal-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600 font-medium">{t('inventories.stats.warehouses')}</p>
                <p className="text-xl font-bold text-teal-600">{uniqueWarehouses}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-md hover:shadow-lg transition-shadow border-0">
          <CardContent className="p-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <Coffee className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600 font-medium">{t('inventories.stats.productTypes')}</p>
                <p className="text-xl font-bold text-amber-600">{uniqueProducts}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Thống kê theo loại cà phê */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Leaf className="w-5 h-5" />
                  <p className="text-orange-100 text-sm font-medium">{t('inventories.coffeeTypes.fresh')}</p>
                </div>
                <p className="text-2xl font-bold">{freshCoffeeInventories.length} lô</p>
                <p className="text-orange-200 text-sm">{freshCoffeeQuantity.toLocaleString()} kg</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Coffee className="w-5 h-5" />
                  <p className="text-purple-100 text-sm font-medium">{t('inventories.coffeeTypes.processed')}</p>
                </div>
                <p className="text-2xl font-bold">{processedCoffeeInventories.length} lô</p>
                <p className="text-purple-200 text-sm">{processedCoffeeQuantity.toLocaleString()} kg</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Thanh tìm kiếm và lọc */}
      <Card className="bg-white shadow-md border-0">
        <CardContent className="p-4">
          <div className="flex flex-wrap justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Input
                  placeholder={t('inventories.search.placeholder')}
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                  }}
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
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">{t('inventories.filters.coffeeType')}</span>
                <Select value={coffeeTypeFilter} onValueChange={(value) => {
                  setCoffeeTypeFilter(value);
                  setCurrentPage(1);
                }}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder={t('inventories.filters.selectCoffeeType')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('inventories.filters.all')} ({inventories.length})</SelectItem>
                    <SelectItem value="fresh">
                      <div className="flex items-center gap-2">
                        <Leaf className="w-4 h-4 text-orange-600" />
                        {t('inventories.coffeeTypes.fresh')} ({freshCoffeeInventories.length})
                      </div>
                    </SelectItem>
                    <SelectItem value="processed">
                      <div className="flex items-center gap-2">
                        <Coffee className="w-4 h-4 text-purple-600" />
                        {t('inventories.coffeeTypes.processed')} ({processedCoffeeInventories.length})
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">{t('inventories.filters.warehouse')}</span>
                <Select value={warehouseFilter} onValueChange={(value) => {
                  setWarehouseFilter(value);
                  setCurrentPage(1);
                }}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder={t('inventories.filters.selectWarehouse')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('inventories.filters.allWarehouses')}</SelectItem>
                    {warehouseList.map((warehouse) => (
                      <SelectItem key={warehouse} value={warehouse}>
                        {warehouse}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <div className="mt-3 text-sm text-gray-500">
            {t('inventories.description')}
          </div>
        </CardContent>
      </Card>

      {/* Bảng tồn kho */}
      <Card className="bg-white shadow-md border-0">
        <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100">
          <CardTitle className="text-lg font-semibold text-green-800 flex items-center gap-2">
            <Package className="w-5 h-5 text-green-600" />
                         {t('inventories.table.title')}
            <Badge variant="secondary" className="ml-2 bg-green-100 text-green-800 text-xs">
              {filtered.length} lô
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                             <p className="text-gray-600 text-lg">{t('inventories.loading.title')}</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="w-8 h-8 text-gray-400" />
              </div>
                             <p className="text-gray-500 text-lg mb-2">{t('inventories.empty.title')}</p>
               <p className="text-gray-400 text-sm">{t('inventories.empty.description')}</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full table-auto border border-gray-200 rounded-lg text-sm">
                  <thead className="bg-gradient-to-r from-green-50 to-emerald-50 text-green-800 font-semibold">
                    <tr>
                                             <th className="px-4 py-3 text-left border-b border-green-200">{t('inventories.table.headers.warehouse')}</th>
                       <th className="px-4 py-3 text-left border-b border-green-200">{t('inventories.table.headers.coffeeType')}</th>
                       <th className="px-4 py-3 text-left border-b border-green-200">{t('inventories.table.headers.information')}</th>
                       <th className="px-4 py-3 text-left border-b border-green-200">{t('inventories.table.headers.product')}</th>
                       <th className="px-4 py-3 text-right border-b border-green-200">{t('inventories.table.headers.quantity')}</th>
                       <th className="px-4 py-3 text-center border-b border-green-200">{t('inventories.table.headers.status')}</th>
                       <th className="px-4 py-3 text-center border-b border-green-200">{t('inventories.table.headers.actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paged.map((inv) => {
                      const coffeeType = getCoffeeType(inv);
                      const coffeeTypeLabel = getCoffeeTypeLabel(inv);
                      const coffeeTypeIcon = getCoffeeTypeIcon(inv);
                      const coffeeInfo = getCoffeeInfo(inv);

                      return (
                        <tr
                          key={inv.inventoryId}
                          className="border-b border-gray-100 hover:bg-green-50 transition-colors"
                        >
                          <td className="px-4 py-3 font-semibold text-gray-900">{inv.warehouseName}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {coffeeTypeIcon}
                              <span className={`font-medium ${
                                coffeeType === 'fresh' ? 'text-orange-700' : 
                                coffeeType === 'processed' ? 'text-purple-700' : 'text-gray-700'
                              }`}>
                                {coffeeTypeLabel}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-700 font-mono text-sm">
                            <span className={coffeeInfo.color}>{coffeeInfo.value}</span>
                          </td>
                          <td className="px-4 py-3 text-gray-700">
                            {coffeeType === 'fresh' 
                              ? (inv.coffeeTypeNameDetail || inv.coffeeTypeName || 'Cà phê tươi')
                              : (inv.productName || 'N/A')
                            }
                          </td>
                          <td className="px-4 py-3 text-right font-semibold">{inv.quantity?.toLocaleString() ?? 0}</td>
                          <td className="px-4 py-3 text-center">
                            <Badge
                              className={`capitalize px-3 py-1 rounded-full font-medium text-sm shadow-sm ${
                                inv.quantity > 0
                                  ? 'bg-green-100 text-green-800 border-green-200'
                                  : 'bg-red-100 text-red-800 border-red-200'
                              }`}
                            >
                                                             {inv.quantity > 0 ? t('inventories.status.inStock') : t('inventories.status.outOfStock')}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Link href={`/dashboard/staff/inventories/${inv.inventoryId}`}>
                              <Button
                                size="icon"
                                variant="outline"
                                className="text-green-600 hover:text-green-800 border-green-200 hover:bg-green-50"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="bg-green-50 px-4 py-3 border-t border-green-100">
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
                                         <div className="text-sm text-gray-600">
                       {t('inventories.pagination.showing')} {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, filtered.length)} {t('inventories.pagination.of')} {filtered.length} {t('inventories.pagination.batches')}
                     </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="h-8 px-3 text-sm border-green-200 hover:border-green-300 hover:bg-green-50"
                      >
                        <ChevronLeft className="w-4 h-4 mr-1" />
                                                 {t('inventories.pagination.previous')}
                      </Button>
                      
                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <Button
                            key={page}
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                            className={`h-8 w-8 text-sm ${
                              currentPage === page 
                                ? "bg-gradient-to-r from-green-500 to-emerald-600" 
                                : "border-green-200 hover:border-green-300 hover:bg-green-50"
                            }`}
                          >
                            {page}
                          </Button>
                        ))}
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="h-8 px-3 text-sm border-green-200 hover:border-green-300 hover:bg-green-50"
                      >
                                                 {t('inventories.pagination.next')}
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Thông tin bổ sung */}
      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-white shadow-md border-0">
            <CardContent className="p-4">
              <div className="text-center">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                                 <h3 className="font-semibold text-red-800 mb-2">{t('inventories.stats.outOfStockBatches')}</h3>
                <p className="text-2xl font-bold text-red-600">{outOfStockCount}</p>
                                 <p className="text-sm text-gray-600">{t('inventories.stats.needReplenishment')}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-md border-0">
            <CardContent className="p-4">
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                                 <h3 className="font-semibold text-green-800 mb-2">{t('inventories.stats.totalBatches')}</h3>
                <p className="text-2xl font-bold text-green-600">{totalInventories}</p>
                                 <p className="text-sm text-gray-600">{t('inventories.stats.allProducts')}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
