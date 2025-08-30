"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getAllInventories, softDeleteInventory } from "@/lib/api/inventory";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Plus,
  History as HistoryIcon,
  Eye,
  XCircle,
  Package,
  TrendingUp,
  AlertTriangle,
  Warehouse,
  Coffee,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function ManagerInventoryListPage() {
  const { t } = useTranslation();
  const [inventories, setInventories] = useState<any[]>([]);
  const [search, setSearch] = useState("");
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
          toast.error(res.message || t('managerInventories.error.loadData'));
        }
      } catch (err: any) {
        toast.error(t('managerInventories.error.systemError') + err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [t]);

  const filtered = inventories.filter((inv) =>
    inv.inventoryCode?.toLowerCase().includes(search.toLowerCase()) ||
    inv.warehouseName?.toLowerCase().includes(search.toLowerCase()) ||
    inv.productName?.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paged = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Tính toán thống kê
  // Helper function to determine coffee type (giống như Staff)
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
          value: inventory?.cropSeasonName || inventory?.detailCode || t('common.notAvailable'),
          color: 'text-orange-700'
        };
      case 'processed':
        return {
          label: t('managerInventories.coffeeInfo.batch'),
          value: inventory?.batchCode ? `${inventory.batchCode} - ${inventory.coffeeTypeName || t('managerInventories.coffeeTypes.processed')}` : t('common.notAvailable'),
          color: 'text-purple-700'
        };
      default:
        return {
          label: t('managerInventories.coffeeInfo.info'),
          value: t('common.notAvailable'),
          color: 'text-gray-700'
        };
    }
  };

  const totalInventories = inventories.length;
  const totalQuantity = inventories.reduce((sum, inv) => sum + (inv.quantity || 0), 0);
  const inStockCount = inventories.filter(inv => (inv.quantity || 0) > 0).length;
  const outOfStockCount = totalInventories - inStockCount;
  const uniqueWarehouses = [...new Set(inventories.map(inv => inv.warehouseName))].length;
  const uniqueProducts = [...new Set(inventories.map(inv => inv.productName))].length;

  const handleSoftDelete = async (id: string) => {
    if (!confirm(t('managerInventories.error.deleteConfirm'))) return;

    try {
      const res = await softDeleteInventory(id);
      if (res.status === 200) {
        toast.success(t('managerInventories.error.deleteSuccess'));
        setInventories((prev) => prev.filter((i) => i.inventoryId !== id));
      } else {
        toast.error(`❌ ${res.message || t('managerInventories.error.deleteFailed')}`);
      }
    } catch (err: any) {
      toast.error(t('managerInventories.error.systemError') + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6 space-y-6">
      {/* Header với gradient */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-4 text-white shadow-lg">
        <div className="flex items-center gap-3 mb-2">
          <Package className="w-6 h-6" />
          <h1 className="text-2xl font-bold">{t('managerInventories.title')}</h1>
        </div>
        <p className="text-blue-100 text-base">{t('managerInventories.subtitle')}</p>
      </div>

      {/* Thống kê tổng quan */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-white shadow-md hover:shadow-lg transition-shadow border-0">
          <CardContent className="p-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600 font-medium">{t('managerInventories.stats.totalInventories')}</p>
                <p className="text-xl font-bold text-blue-600">{totalInventories}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-md hover:shadow-lg transition-shadow border-0">
          <CardContent className="p-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600 font-medium">{t('managerInventories.stats.totalQuantity')}</p>
                <p className="text-xl font-bold text-green-600">{totalQuantity.toLocaleString()} {t('managerInventories.stats.kg')}</p>
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
                <p className="text-xs text-gray-600 font-medium">{t('managerInventories.stats.inStock')}</p>
                <p className="text-xl font-bold text-emerald-600">{inStockCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-md hover:shadow-lg transition-shadow border-0">
          <CardContent className="p-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600 font-medium">{t('managerInventories.stats.outOfStock')}</p>
                <p className="text-xl font-bold text-red-600">{outOfStockCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-md hover:shadow-lg transition-shadow border-0">
          <CardContent className="p-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Warehouse className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600 font-medium">{t('managerInventories.stats.warehouses')}</p>
                <p className="text-xl font-bold text-purple-600">{uniqueWarehouses}</p>
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
                  placeholder={t('managerInventories.search.placeholder')}
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-72 pr-10 border-blue-200 focus:border-blue-400 focus:ring-blue-400 text-sm"
                />
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-400" />
              </div>
              {search && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
                  {filtered.length} {t('managerInventories.search.results')}
                </Badge>
              )}
            </div>
            <Link href="/dashboard/manager/inventories/create">
              <Button className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 text-sm px-4 py-2">
                <Plus className="w-4 h-4 mr-2" />
                {t('managerInventories.actions.createNew')}
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Bảng tồn kho */}
      <Card className="bg-white shadow-lg border-0 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
          <CardTitle className="text-lg font-bold text-blue-800 flex items-center gap-2">
            <Package className="w-4 h-4" />
            {t('managerInventories.table.title')}
          </CardTitle>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3"></div>
              <p className="text-gray-600 text-base">{t('managerInventories.loading.title')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                                 <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
                   <tr>
                     <th className="text-left px-4 py-3 text-sm font-semibold text-blue-800">{t('managerInventories.table.headers.warehouseName')}</th>
                     <th className="text-left px-4 py-3 text-sm font-semibold text-blue-800">{t('managerInventories.table.headers.coffeeType')}</th>
                     <th className="text-left px-4 py-3 text-sm font-semibold text-blue-800">{t('managerInventories.table.headers.info')}</th>
                     <th className="text-left px-4 py-3 text-sm font-semibold text-blue-800">{t('managerInventories.table.headers.product')}</th>
                     <th className="text-right px-4 py-3 text-sm font-semibold text-blue-800">{t('managerInventories.table.headers.quantity')}</th>
                     <th className="text-center px-4 py-3 text-sm font-semibold text-blue-800">{t('managerInventories.table.headers.status')}</th>
                     <th className="text-center px-4 py-3 text-sm font-semibold text-blue-800">{t('managerInventories.table.headers.actions')}</th>
                   </tr>
                 </thead>
                <tbody className="divide-y divide-gray-100">
                  {paged.map((inv, index) => (
                    <tr key={inv.inventoryId} className={`hover:bg-blue-50 transition-colors ${
                      index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                    }`}>
                      <td className="px-4 py-3 font-semibold text-gray-900">{inv.warehouseName}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {(() => {
                            const coffeeType = getCoffeeType(inv);
                            const coffeeTypeLabel = getCoffeeTypeLabel(inv);
                            const coffeeTypeIcon = getCoffeeTypeIcon(inv);
                            return (
                              <>
                                {coffeeTypeIcon}
                                <span className={`font-medium ${
                                  coffeeType === 'fresh' ? 'text-orange-700' : 
                                  coffeeType === 'processed' ? 'text-purple-700' : 'text-gray-700'
                                }`}>
                                  {coffeeTypeLabel}
                                </span>
                              </>
                            );
                          })()}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-700 font-mono text-sm">
                        {(() => {
                          const coffeeType = getCoffeeType(inv);
                          const coffeeInfo = getCoffeeInfo(inv);
                          return (
                            <span className={coffeeInfo.color}>{coffeeInfo.value}</span>
                          );
                        })()}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {(() => {
                          const coffeeType = getCoffeeType(inv);
                          return coffeeType === 'fresh' 
                            ? (inv.coffeeTypeNameDetail || inv.coffeeTypeName || t('managerInventories.coffeeTypes.fresh'))
                            : (inv.productName || t('common.notAvailable'));
                        })()}
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
                          {inv.quantity > 0 ? t('managerInventories.table.status.inStock') : t('managerInventories.table.status.outOfStock')}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex justify-center gap-2">
                          <Link href={`/dashboard/manager/inventories/${inv.inventoryId}`}>
                            <Button size="icon" variant="outline" className="w-7 h-7 hover:bg-blue-50 hover:border-blue-300">
                              <Eye className="w-3 h-3 text-blue-600" />
                            </Button>
                          </Link>

                          <Link href={`/dashboard/manager/inventories/${inv.inventoryId}/logs`}>
                            <Button size="icon" variant="outline" className="w-7 h-7 hover:bg-indigo-50 hover:border-indigo-300">
                              <HistoryIcon className="w-3 h-3 text-indigo-600" />
                            </Button>
                          </Link>

                          <Button
                            size="icon"
                            variant="outline"
                            className="w-7 h-7 hover:bg-red-50 hover:border-red-300"
                            onClick={() => handleSoftDelete(inv.inventoryId)}
                          >
                            <XCircle className="w-3 h-3 text-red-600" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {paged.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-8">
                        <div className="flex flex-col items-center gap-3">
                          <Package className="w-12 h-12 text-gray-300" />
                          <p className="text-gray-500 text-base">{t('managerInventories.empty.title')}</p>
                          <p className="text-gray-400 text-sm">{t('managerInventories.empty.description')}</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Phân trang */}
      {!loading && filtered.length > 0 && (
        <Card className="bg-white shadow-md border-0">
          <CardContent className="p-3">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <span className="text-xs text-gray-600">
                {t('managerInventories.pagination.showing')} {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filtered.length)} {t('managerInventories.pagination.of')} {filtered.length} {t('managerInventories.pagination.items')}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="w-7 h-7 hover:bg-blue-50 hover:border-blue-300"
                >
                  <ChevronLeft className="w-3 h-3" />
                </Button>
                
                {[...Array(totalPages).keys()].map((_, i) => {
                  const page = i + 1;
                  return (
                    <Button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-7 h-7 text-xs rounded-lg transition-all ${
                        page === currentPage
                          ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg"
                          : "bg-white text-gray-700 border border-gray-200 hover:bg-blue-50 hover:border-blue-300"
                      }`}
                    >
                      {page}
                    </Button>
                  );
                })}
                
                <Button
                  variant="outline"
                  size="icon"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="w-7 h-7 hover:bg-blue-50 hover:border-blue-300"
                >
                  <ChevronRight className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
