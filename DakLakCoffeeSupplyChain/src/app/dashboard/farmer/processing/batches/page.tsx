"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { getAllProcessingBatches, ProcessingBatch } from "@/lib/api/processingBatches";

import StatusBadge from "@/components/processing-batches/StatusBadge";
import { 
  PlusCircle, 
  Package, 
  Calendar, 
  User, 
  Settings, 
  Coffee, 
  TrendingUp, 
  Search,
  Filter,
  Eye,
  AlertTriangle,
  CheckCircle,
  Clock,
  ClipboardCheck,
  FileText,
  MapPin,
  Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ProcessingStatus } from "@/lib/constants/batchStatus";

import { cn } from "@/lib/utils";
import { ProcessingErrorDisplay } from "@/components/shared/ProcessingErrorDisplay";

const ITEMS_PER_PAGE = 10;

export default function ProcessingBatchesPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [batches, setBatches] = useState<ProcessingBatch[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch batches
        const batchesData = await getAllProcessingBatches();
        setBatches(batchesData || []);
      } catch (err: unknown) {
        console.error('Error fetching data:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);



  // Filter and sort batches
  const filteredBatches = batches
    .filter(batch => {
      const matchesSearch = batch.batchCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           batch.farmerName.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesFilter = filterStatus === "all" || String(batch.status) === String(filterStatus);
      
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      // Sắp xếp theo thời gian tạo (createdAt) - mới nhất lên đầu
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      
      // Sắp xếp mới nhất lên đầu (descending order)
      return dateB.getTime() - dateA.getTime();
    });

  // Tính toán phân trang
  const totalPages = Math.ceil(filteredBatches.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedBatches = filteredBatches.slice(startIndex, endIndex);

  // Reset về trang 1 khi thay đổi filter
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus]);

  // Tính toán thống kê
  const totalBatches = batches.length;

  // Đếm số lượng theo trạng thái
  const statusCounts = batches.reduce<Record<string, number>>((acc, batch) => {
    acc[batch.status] = (acc[batch.status] || 0) + 1;
    return acc;
  }, {});

  const getStatusInfo = (status: any) => {
    
    // Mapping hoàn chỉnh cho tất cả các loại status
    const statusMap: Record<string | number, any> = {
      // Number mapping từ Backend
      0: { label: t('processing.pages.farmerBatches.status.notStarted'), color: "bg-yellow-100 text-yellow-700 border-yellow-200", icon: Clock },
      1: { label: t('processing.pages.farmerBatches.status.inProgress'), color: "bg-blue-100 text-blue-700 border-blue-200", icon: TrendingUp },
      2: { label: t('processing.pages.farmerBatches.status.completed'), color: "bg-green-100 text-green-700 border-green-200", icon: CheckCircle },
      3: { label: t('processing.pages.farmerBatches.status.awaitingEvaluation'), color: "bg-orange-100 text-orange-700 border-orange-200", icon: ClipboardCheck },
      4: { label: t('processing.pages.farmerBatches.status.cancelled'), color: "bg-red-100 text-red-700 border-red-200", icon: AlertTriangle },
      
             // String mapping từ enum (không phân biệt hoa thường)
       "notstarted": { label: t('processing.pages.farmerBatches.status.notStarted'), color: "bg-yellow-100 text-yellow-700 border-yellow-200", icon: Clock },
       "not_started": { label: t('processing.pages.farmerBatches.status.notStarted'), color: "bg-yellow-100 text-yellow-700 border-yellow-200", icon: Clock },
       "inprogress": { label: t('processing.pages.farmerBatches.status.inProgress'), color: "bg-blue-100 text-blue-700 border-blue-200", icon: TrendingUp },
       "in_progress": { label: t('processing.pages.farmerBatches.status.inProgress'), color: "bg-blue-100 text-blue-700 border-blue-200", icon: TrendingUp },
       "completed": { label: t('processing.pages.farmerBatches.status.completed'), color: "bg-green-100 text-green-700 border-green-200", icon: CheckCircle },
       "awaitingevaluation": { label: t('processing.pages.farmerBatches.status.awaitingEvaluation'), color: "bg-orange-100 text-orange-700 border-orange-200", icon: ClipboardCheck },
       "awaiting_evaluation": { label: t('processing.pages.farmerBatches.status.awaitingEvaluation'), color: "bg-orange-100 text-orange-700 border-orange-200", icon: ClipboardCheck },
       "cancelled": { label: t('processing.pages.farmerBatches.status.cancelled'), color: "bg-red-100 text-red-700 border-red-200", icon: AlertTriangle },
      
      // Vietnamese string mapping
      "chưa bắt đầu": { label: t('processing.pages.farmerBatches.status.notStarted'), color: "bg-yellow-100 text-yellow-700 border-yellow-200", icon: Clock },
      "đang xử lý": { label: t('processing.pages.farmerBatches.status.inProgress'), color: "bg-blue-100 text-blue-700 border-blue-200", icon: TrendingUp },
      "hoàn thành": { label: t('processing.pages.farmerBatches.status.completed'), color: "bg-green-100 text-green-700 border-green-200", icon: CheckCircle },
      "chờ đánh giá": { label: t('processing.pages.farmerBatches.status.awaitingEvaluation'), color: "bg-orange-100 text-orange-700 border-orange-200", icon: ClipboardCheck },
      "đã hủy": { label: t('processing.pages.farmerBatches.status.cancelled'), color: "bg-red-100 text-red-700 border-red-200", icon: AlertTriangle },
      
      // Enum mapping
      [ProcessingStatus.NotStarted]: { label: t('processing.pages.farmerBatches.status.notStarted'), color: "bg-yellow-100 text-yellow-700 border-yellow-200", icon: Clock },
      [ProcessingStatus.InProgress]: { label: t('processing.pages.farmerBatches.status.inProgress'), color: "bg-blue-100 text-blue-700 border-blue-200", icon: TrendingUp },
      [ProcessingStatus.Completed]: { label: t('processing.pages.farmerBatches.status.completed'), color: "bg-green-100 text-green-700 border-green-200", icon: CheckCircle },
      [ProcessingStatus.AwaitingEvaluation]: { label: t('processing.pages.farmerBatches.status.awaitingEvaluation'), color: "bg-orange-100 text-orange-700 border-orange-200", icon: ClipboardCheck },
      [ProcessingStatus.Cancelled]: { label: t('processing.pages.farmerBatches.status.cancelled'), color: "bg-red-100 text-red-700 border-red-200", icon: AlertTriangle },
    };
    
    // Thử tìm theo key gốc
    if (statusMap[status] !== undefined) {
      return statusMap[status];
    }
    
         // Thử tìm theo string lowercase (không phân biệt hoa thường)
     const statusStr = String(status || '').toLowerCase().trim();
     if (statusMap[statusStr] !== undefined) {
       return statusMap[statusStr];
     }
    
    // Thử tìm theo number
    const statusNum = Number(status);
    if (!isNaN(statusNum) && statusMap[statusNum] !== undefined) {
      return statusMap[statusNum];
    }
    
    // Fallback cho các trường hợp khác
    return { label: t('processing.pages.farmerBatches.status.unknown'), color: "bg-gray-100 text-gray-700 border-gray-200", icon: Package };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-amber-50 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header Skeleton */}
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-64 animate-pulse"></div>
            </div>
            <div className="flex gap-3">
              <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>

          {/* Stats Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm p-6">
                <div className="h-6 bg-gray-200 rounded w-24 animate-pulse mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-16 animate-pulse"></div>
              </div>
            ))}
          </div>

          {/* Content Skeleton */}
          <div className="flex gap-6">
            <div className="w-64 bg-white rounded-xl shadow-sm p-4 space-y-4">
              <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-8 bg-gray-200 rounded animate-pulse"></div>
                ))}
              </div>
            </div>
            <div className="flex-1 bg-white rounded-xl shadow-sm p-6">
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
                <p className="text-sm text-muted-foreground mt-2">{t('farmerBatchDetail.loading.title')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (  
      <div className="min-h-screen bg-amber-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <ProcessingErrorDisplay error={error} />
            <div className="text-center mt-4">
              <Button
                onClick={() => window.location.reload()}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                {t('common.retry')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-amber-50">
      <div className="p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Main Content Header */}
          <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">{t('processing.pages.farmerBatches.title')}</h2>
                <p className="text-gray-600">{t('processing.pages.farmerBatches.subtitle')}</p>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={() => router.push("/dashboard/farmer/processing/batches/create")}
                  className="bg-orange-600 hover:bg-orange-700 text-white"
                >
                  <PlusCircle className="w-4 h-4 mr-2" />
                  {t('processing.batch.create')}
                </Button>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Package className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">{t('processing.pages.farmerBatches.totalBatches')}</p>
                  <p className="text-2xl font-bold text-gray-900">{totalBatches}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">{t('processing.pages.farmerBatches.active')}</p>
                  <p className="text-2xl font-bold text-gray-900">{batches.filter(b => b.status === ProcessingStatus.InProgress).length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex gap-6">
            {/* Sidebar */}
            <aside className="w-64 space-y-4">
              <div className="bg-white rounded-xl shadow-sm p-4 space-y-4">
                {/* Search */}
                <div>
                  <h2 className="text-sm font-medium text-gray-700 mb-3">{t('processing.pages.farmerBatches.searchTitle')}</h2>
                  <div className="relative">
                    <Input
                      placeholder={t('processing.pages.farmerBatches.searchPlaceholder')}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pr-10"
                    />
                    <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  </div>
                </div>

                {/* Status Filter */}
                <div>
                  <h2 className="text-sm font-medium text-gray-700 mb-3">{t('processing.pages.farmerBatches.filterTitle')}</h2>
                  <div className="space-y-2">
                    <button
                      onClick={() => setFilterStatus("all")}
                      className={cn(
                        "w-full px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 text-left flex items-center gap-2",
                        filterStatus === "all"
                          ? "bg-orange-100 text-orange-700 border border-orange-300"
                          : "text-gray-600 hover:bg-orange-50 hover:text-orange-600"
                      )}
                    >
                      <Package className="h-4 w-4" />
                      {t('processing.pages.farmerBatches.allStatuses')}
                      <Badge variant="secondary" className="ml-auto text-xs">
                        {totalBatches}
                      </Badge>
                    </button>
                    {Object.entries(statusCounts).map(([status, count]) => {
                      const statusInfo = getStatusInfo(status);
                      const IconComponent = statusInfo.icon;
                      return (
                        <button
                          key={status}
                          onClick={() => setFilterStatus(status)}
                          className={cn(
                            "w-full px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 text-left flex items-center gap-2",
                            filterStatus === status
                              ? "bg-orange-100 text-orange-700 border border-orange-300"
                              : "text-gray-600 hover:bg-orange-50 hover:text-orange-600"
                          )}
                        >
                          <IconComponent className="h-4 w-4" />
                          {statusInfo.label}
                          <Badge variant="secondary" className="ml-auto text-xs">
                            {count}
                          </Badge>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1">
              <div className="bg-white rounded-xl shadow-sm p-6">
                {paginatedBatches.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="w-16 h-16 text-orange-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {t('common.noData')}
                    </h3>
                    <p className="text-gray-500">
                      {searchTerm || filterStatus !== "all" 
                        ? t('common.noData')
                        : t('common.noData')
                      }
                    </p>
                  </div>
                ) : (
                  <table className="w-full text-sm table-auto">
                    <thead className="bg-gray-100 text-gray-700 font-medium">
                      <tr>
                        <th className="px-4 py-3 text-left">{t('processing.pages.farmerBatches.table.batchCode')}</th>
                        <th className="px-4 py-3 text-left">{t('processing.pages.farmerBatches.table.cropSeason')}</th>
                        <th className="px-4 py-3 text-left">{t('processing.pages.farmerBatches.table.method')}</th>
                        <th className="px-4 py-3 text-left">{t('processing.pages.farmerBatches.table.status')}</th>
                        <th className="px-4 py-3 text-left">{t('processing.pages.farmerBatches.table.creationDate')}</th>
                        <th className="px-4 py-3 text-left">{t('processing.pages.farmerBatches.table.action')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedBatches.map((batch) => {
                        const statusInfo = getStatusInfo(batch.status);
                        
                        return (
                          <tr key={batch.batchId} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <button
                                onClick={() => router.push(`/dashboard/farmer/processing/batches/${batch.batchId}`)}
                                className="font-medium text-gray-800 hover:text-orange-600 transition-colors cursor-pointer text-left"
                              >
                                {batch.batchCode}
                              </button>
                            </td>
                            <td className="px-4 py-3">
                              <button
                                onClick={() => router.push(`/dashboard/farmer/processing/batches/${batch.batchId}`)}
                                className="text-gray-700 hover:text-orange-600 transition-colors cursor-pointer text-left"
                              >
                                {batch.cropSeasonName || t('processing.pages.farmerBatches.table.fallback.cropSeason', { id: batch.cropSeasonId })}
                              </button>
                            </td>
                            <td className="px-4 py-3">
                              <button
                                onClick={() => router.push(`/dashboard/farmer/processing/batches/${batch.batchId}`)}
                                className="text-gray-700 hover:text-orange-600 transition-colors cursor-pointer text-left"
                              >
                                {batch.methodName || t('processing.pages.farmerBatches.table.fallback.method', { id: batch.methodId })}
                              </button>
                            </td>
                            <td className="px-4 py-3">
                              <Badge className={`${statusInfo.color} whitespace-nowrap`}>
                                {statusInfo.label}
                              </Badge>
                            </td>
                            <td className="px-4 py-3">
                              <button
                                onClick={() => router.push(`/dashboard/farmer/processing/batches/${batch.batchId}`)}
                                className="text-gray-700 hover:text-orange-600 transition-colors cursor-pointer text-left"
                              >
                                {batch.createdAt ? new Date(batch.createdAt).toLocaleDateString("vi-VN") : "—"}
                              </button>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => router.push(`/dashboard/farmer/processing/batches/${batch.batchId}`)}
                                  className="h-8 px-2 hover:bg-green-50 hover:border-green-300 hover:text-green-700"
                                >
                                  <Eye className="h-3 w-3" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-6 flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      {t('processing.pages.farmerBatches.pagination.showing', {
                        start: startIndex + 1,
                        end: Math.min(endIndex, filteredBatches.length),
                        total: filteredBatches.length
                      })}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        {t('processing.pages.farmerBatches.pagination.previous')}
                      </Button>
                      <span className="text-sm text-gray-700">
                        {t('processing.pages.farmerBatches.pagination.pageInfo', {
                          current: currentPage,
                          total: totalPages
                        })}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        {t('processing.pages.farmerBatches.pagination.next')}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
