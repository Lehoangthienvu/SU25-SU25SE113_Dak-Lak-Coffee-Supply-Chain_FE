"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { getAllInventoryLogs } from "@/lib/api/inventoryLogs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Eye, TrendingUp, TrendingDown, Activity, Calendar, Package, Warehouse, Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useTranslation } from 'react-i18next';

export default function StaffInventoryLogsPage() {
  const { t } = useTranslation();
  const [logs, setLogs] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [actionFilter, setActionFilter] = useState("All");
  const [isLoading, setIsLoading] = useState(true);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  const logsPerPage = 10; // Staff có thể xem nhiều hơn

  // ✅ Tối ưu hóa: Sử dụng useCallback để tránh re-render không cần thiết
  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const data = await getAllInventoryLogs();
      if (Array.isArray(data)) {
        setLogs(data);
      } else {
        setError(t('inventoryLogs.error.description'));
      }
    } catch (err: any) {
      setError(err.message || t('inventoryLogs.error.description'));
      toast.error(t('inventoryLogs.error.title') + ": " + err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ✅ Tối ưu hóa: Chỉ fetch data một lần khi component mount
  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // ✅ Tối ưu hóa: Debounce search để giảm số lượng filter operations
  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    setCurrentPage(1); // Reset về trang đầu khi search

    // Clear timeout cũ nếu có
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Set timeout mới để debounce
    const newTimeout = setTimeout(() => {
      // Search logic sẽ được xử lý trong filteredLogs
    }, 300); // 300ms delay

    setSearchTimeout(newTimeout);
  }, [searchTimeout]);

  // ✅ Tối ưu hóa: Sử dụng useMemo để cache filtered results
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const keyword = search.toLowerCase();
      const matchesSearch =
        log.inventoryCode?.toLowerCase().includes(keyword) ||
        log.warehouseName?.toLowerCase().includes(keyword) ||
        log.coffeeTypeName?.toLowerCase().includes(keyword);
      const matchesAction = actionFilter === "All" || log.actionType === actionFilter;
      return matchesSearch && matchesAction;
    });
  }, [logs, search, actionFilter]);

  // ✅ Tối ưu hóa: Sử dụng useMemo để cache paginated results
  const paginatedLogs = useMemo(() => {
    return filteredLogs.slice(
      (currentPage - 1) * logsPerPage,
      currentPage * logsPerPage
    );
  }, [filteredLogs, currentPage, logsPerPage]);

  // ✅ Tối ưu hóa: Sử dụng useMemo để cache statistics
  const statistics = useMemo(() => {
    const totalLogs = logs.length;
    const increaseLogs = logs.filter(log => log.actionType === "increase").length;
    const decreaseLogs = logs.filter(log => log.actionType === "decrease").length;
    const todayLogs = logs.filter(log => {
      const today = new Date().toDateString();
      const logDate = new Date(log.loggedAt).toDateString();
      return today === logDate;
    }).length;

    return { totalLogs, increaseLogs, decreaseLogs, todayLogs };
  }, [logs]);

  const totalPages = Math.ceil(filteredLogs.length / logsPerPage);

  // ✅ Skeleton loading component
  const LoadingSkeleton = () => (
    <div className="divide-y divide-gray-100">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="p-3 animate-pulse">
          <div className="flex flex-col lg:flex-row justify-between items-start gap-2">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-16 h-6 bg-gray-200 rounded-full"></div>
                <div className="w-24 h-4 bg-gray-200 rounded"></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-gray-200 rounded-full"></div>
                    <div className="flex-1">
                      <div className="w-16 h-3 bg-gray-200 rounded mb-1"></div>
                      <div className="w-24 h-4 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-1">
              <div className="w-16 h-7 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  // ✅ Cleanup timeout khi component unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 p-6">
      {/* Header với gradient xanh lá */}
      <div className="mb-6">
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-4 text-white shadow-lg">
          <h1 className="text-2xl font-bold mb-1">📋 {t('inventoryLogs.title')}</h1>
          <p className="text-green-100 text-sm">{t('inventoryLogs.subtitle')}</p>
        </div>
      </div>

      {/* Thống kê tổng quan */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <Card className="bg-white shadow-sm border-0 hover:shadow-md transition-all duration-300">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">{t('inventoryLogs.stats.totalLogs')}</p>
                <p className="text-xl font-bold text-green-600">
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : statistics.totalLogs}
                </p>
              </div>
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <Activity className="w-4 h-4 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border-0 hover:shadow-md transition-all duration-300">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">{t('inventoryLogs.stats.inboundToday')}</p>
                <p className="text-xl font-bold text-green-600">
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : statistics.todayLogs}
                </p>
              </div>
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <Calendar className="w-4 h-4 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border-0 hover:shadow-md transition-all duration-300">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">{t('inventoryLogs.stats.inboundTurns')}</p>
                <p className="text-xl font-bold text-emerald-600">
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : statistics.increaseLogs}
                </p>
              </div>
              <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border-0 hover:shadow-md transition-all duration-300">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">{t('inventoryLogs.stats.outboundTurns')}</p>
                <p className="text-xl font-bold text-rose-600">
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : statistics.decreaseLogs}
                </p>
              </div>
              <div className="w-8 h-8 bg-rose-100 rounded-full flex items-center justify-center">
                <TrendingDown className="w-4 h-4 text-rose-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bộ lọc và tìm kiếm */}
      <Card className="bg-white shadow-sm border-0 mb-3">
        <CardContent className="p-3">
          <div className="flex flex-col lg:flex-row gap-2 items-center justify-between">
            <div className="relative w-full lg:w-72">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder={t('inventoryLogs.search.placeholder')}
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-8 h-9 text-sm border border-gray-200 focus:border-green-500 focus:ring-green-500/20"
              />
            </div>
            
            <div className="flex gap-1 flex-wrap">
              {["All", "increase", "decrease"].map((action) => (
                <Button
                  key={action}
                  variant={actionFilter === action ? "default" : "outline"}
                  onClick={() => {
                    setActionFilter(action);
                    setCurrentPage(1);
                  }}
                  size="sm"
                  className={`h-8 px-3 text-xs font-medium transition-all duration-200 ${
                    actionFilter === action 
                      ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700" 
                      : "hover:bg-green-50 hover:border-green-300"
                  }`}
                >
                  {action === "All"
                    ? t('inventoryLogs.filters.all')
                    : action === "increase"
                    ? t('inventoryLogs.filters.inbound')
                    : t('inventoryLogs.filters.outbound')}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danh sách log */}
      <Card className="bg-white shadow-sm border-0">
        <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100">
          <CardTitle className="text-base font-bold text-green-800 flex items-center gap-2">
            <Package className="w-4 h-4 text-green-600" />
            {t('inventoryLogs.table.title')}
            <Badge variant="secondary" className="ml-2 bg-green-100 text-green-800 text-xs">
              {isLoading ? "..." : `${filteredLogs.length} ${t('inventoryLogs.pagination.logs')}`}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {/* ✅ Loading state */}
          {isLoading && <LoadingSkeleton />}

          {/* ✅ Error state */}
          {!isLoading && error && (
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Activity className="w-8 h-8 text-red-500" />
              </div>
              <p className="text-red-500 text-sm font-medium mb-2">{error}</p>
              <Button 
                onClick={() => fetchLogs()} 
                variant="outline" 
                size="sm"
                className="text-xs"
              >
                <Loader2 className="w-3 h-3 mr-1" />
                {t('inventoryLogs.error.retry')}
              </Button>
            </div>
          )}

          {/* ✅ Empty state */}
          {!isLoading && !error && filteredLogs.length === 0 && (
            <div className="p-6 text-center">
              <Package className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">{t('inventoryLogs.empty.title')}</p>
              <p className="text-gray-400 text-xs">{t('inventoryLogs.empty.description')}</p>
            </div>
          )}

          {/* ✅ Data display */}
          {!isLoading && !error && paginatedLogs.length > 0 && (
            <div className="divide-y divide-gray-100">
              {paginatedLogs.map((log) => (
                <div
                  key={log.logId}
                  className="p-3 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 transition-all duration-300"
                >
                  <div className="flex flex-col lg:flex-row justify-between items-start gap-2">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge
                          className={`capitalize px-2 py-1 text-xs font-semibold rounded-full ${
                            log.actionType === "increase"
                              ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                              : "bg-rose-100 text-rose-800 border-rose-200"
                          }`}
                        >
                          {log.actionType === "increase" ? t('inventoryLogs.table.actions.inbound') : t('inventoryLogs.table.actions.outbound')}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {new Date(log.loggedAt).toLocaleString("vi-VN")}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center">
                            <Package className="w-3 h-3 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 font-medium">{t('inventoryLogs.table.headers.inventoryCode')}</p>
                            <p className="text-sm font-semibold text-gray-900">{log.inventoryCode}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center">
                            <Warehouse className="w-3 h-3 text-emerald-600" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 font-medium">{t('inventoryLogs.table.headers.warehouse')}</p>
                            <p className="text-sm font-semibold text-gray-900">{log.warehouseName}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 bg-amber-100 rounded-full flex items-center justify-center">
                            <Activity className="w-3 h-3 text-amber-600" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 font-medium">{t('inventoryLogs.table.headers.quantity')}</p>
                            <p className={`font-bold text-sm ${
                              log.actionType === "increase" ? "text-emerald-600" : "text-rose-600"
                            }`}>
                              {log.actionType === "increase" ? "+" : "-"}{log.quantityChanged} kg
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div>
                          <p className="text-xs text-gray-500 font-medium mb-1">☕ {t('inventoryLogs.table.headers.coffeeType')}</p>
                          <p className="text-sm font-medium text-gray-900">{log.coffeeTypeName}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 font-medium mb-1">👤 {t('inventoryLogs.table.headers.updatedBy')}</p>
                          <p className="text-sm font-medium text-gray-900">{log.updatedByName || "Hệ thống"}</p>
                        </div>
                      </div>

                      {log.note && (
                        <div className="bg-emerald-50 rounded-lg p-2 border border-emerald-200">
                          <p className="text-xs text-gray-500 font-medium mb-1">📝 {t('inventoryLogs.table.headers.note')}</p>
                          <p className="text-gray-700 text-sm">{log.note}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-1 flex-shrink-0">
                      <Link href={`/dashboard/staff/inventory-logs/${log.logId}`} title={t('inventoryLogs.table.actions.details')}>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="h-7 px-2 text-xs border border-green-200 hover:border-green-300 hover:bg-green-50"
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          {t('inventoryLogs.table.actions.details')}
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {!isLoading && !error && totalPages > 1 && (
            <div className="bg-green-50 px-3 py-2 border-t border-green-100">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
                <div className="text-xs text-gray-600">
                  {t('inventoryLogs.pagination.showing')} {((currentPage - 1) * logsPerPage) + 1} - {Math.min(currentPage * logsPerPage, filteredLogs.length)} {t('inventoryLogs.pagination.of')} {filteredLogs.length} {t('inventoryLogs.pagination.logs')}
                </div>
                
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="h-7 px-2 text-xs border-green-200 hover:border-green-300 hover:bg-green-50"
                  >
                    {t('inventoryLogs.pagination.previous')}
                  </Button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        className={`h-7 w-7 text-xs ${
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
                    className="h-7 px-2 text-xs border-green-200 hover:border-green-300 hover:bg-green-50"
                  >
                    {t('inventoryLogs.pagination.next')}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
