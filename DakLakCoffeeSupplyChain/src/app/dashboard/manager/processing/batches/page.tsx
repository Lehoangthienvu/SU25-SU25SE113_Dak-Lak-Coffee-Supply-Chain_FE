"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { getAllProcessingBatches, ProcessingBatch } from "@/lib/api/processingBatches";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Eye, 
  Trash2, 
  Search, 
  FileText, 
  MapPin, 
  Users, 
  TrendingUp, 
  CheckCircle, 
  Clock, 
  ClipboardCheck, 
  AlertTriangle,
  Package,
  PlusCircle,
  Edit
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ProcessingStatus } from "@/lib/constants/batchStatus";

const ITEMS_PER_PAGE = 10;

export default function ManagerProcessingBatchesPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [batches, setBatches] = useState<ProcessingBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch all batches
  const fetchAllBatches = async () => {
    try {
      setLoading(true);
      const data = await getAllProcessingBatches();
      setBatches(data || []);
    } catch (err) {
      setError(t('common.networkError'));
      console.error("Error fetching batches:", err);
    } finally {
      setLoading(false);
    }
  };

  // Handle view batch details
  const handleViewDetail = (batchId: string) => {
    router.push(`/dashboard/manager/processing/batches/${batchId}`);
  };

  // Handle edit batch
  const handleEdit = (batchId: string) => {
    router.push(`/dashboard/manager/processing/batches/${batchId}/edit`);
  };

  // Handle delete batch
  const handleDelete = (batchId: string) => {
    if (confirm(t('common.confirm'))) {
      // TODO: Implement soft delete API call
      
    }
  };

  // Get status info with icon
  const getStatusInfo = (status: any) => {
    const statusMap: Record<string | number, any> = {
      // Number mapping từ Backend
      0: { label: t('processing.pages.managerBatches.status.notStarted'), color: "bg-yellow-100 text-yellow-700 border-yellow-200", icon: Clock },
      1: { label: t('processing.pages.managerBatches.status.inProgress'), color: "bg-blue-100 text-blue-700 border-blue-200", icon: TrendingUp },
      2: { label: t('processing.pages.managerBatches.status.completed'), color: "bg-green-100 text-green-700 border-green-200", icon: CheckCircle },
      3: { label: t('processing.pages.managerBatches.status.awaitingEvaluation'), color: "bg-orange-100 text-orange-700 border-orange-200", icon: ClipboardCheck },
      4: { label: t('processing.pages.managerBatches.status.cancelled'), color: "bg-red-100 text-red-700 border-red-200", icon: AlertTriangle },
      
      // String mapping từ enum
      "notstarted": { label: t('processing.pages.managerBatches.status.notStarted'), color: "bg-yellow-100 text-yellow-700 border-yellow-200", icon: Clock },
      "inprogress": { label: t('processing.pages.managerBatches.status.inProgress'), color: "bg-blue-100 text-blue-700 border-blue-200", icon: TrendingUp },
      "completed": { label: t('processing.pages.managerBatches.status.completed'), color: "bg-green-100 text-green-700 border-green-200", icon: CheckCircle },
      "awaitingevaluation": { label: t('processing.pages.managerBatches.status.awaitingEvaluation'), color: "bg-orange-100 text-orange-700 border-orange-200", icon: ClipboardCheck },
      "cancelled": { label: t('processing.pages.managerBatches.status.cancelled'), color: "bg-red-100 text-red-700 border-red-200", icon: AlertTriangle },
      
      // Vietnamese string mapping
      "chưa bắt đầu": { label: t('processing.pages.managerBatches.status.notStarted'), color: "bg-yellow-100 text-yellow-700 border-yellow-200", icon: Clock },
      "đang xử lý": { label: t('processing.pages.managerBatches.status.inProgress'), color: "bg-blue-100 text-blue-700 border-blue-200", icon: TrendingUp },
      "hoàn thành": { label: t('processing.pages.managerBatches.status.completed'), color: "bg-green-100 text-green-700 border-green-200", icon: CheckCircle },
      "chờ đánh giá": { label: t('processing.pages.managerBatches.status.awaitingEvaluation'), color: "bg-orange-100 text-orange-700 border-orange-200", icon: ClipboardCheck },
      "đã hủy": { label: t('processing.pages.managerBatches.status.cancelled'), color: "bg-red-100 text-red-700 border-red-200", icon: AlertTriangle },
      
      // Enum mapping
      [ProcessingStatus.NotStarted]: { label: t('processing.pages.managerBatches.status.notStarted'), color: "bg-yellow-100 text-yellow-700 border-yellow-200", icon: Clock },
      [ProcessingStatus.InProgress]: { label: t('processing.pages.managerBatches.status.inProgress'), color: "bg-blue-100 text-blue-700 border-blue-200", icon: TrendingUp },
      [ProcessingStatus.Completed]: { label: t('processing.pages.managerBatches.status.completed'), color: "bg-green-100 text-green-700 border-green-200", icon: CheckCircle },
      [ProcessingStatus.AwaitingEvaluation]: { label: t('processing.pages.managerBatches.status.awaitingEvaluation'), color: "bg-orange-100 text-orange-700 border-orange-200", icon: ClipboardCheck },
      [ProcessingStatus.Cancelled]: { label: t('processing.pages.managerBatches.status.cancelled'), color: "bg-red-100 text-red-700 border-red-200", icon: AlertTriangle },
    };
    
    // Thử tìm theo key gốc
    if (statusMap[status] !== undefined) {
      return statusMap[status];
    }
    
    // Thử tìm theo string lowercase
    const statusStr = String(status || '').toLowerCase().trim();
    if (statusMap[statusStr] !== undefined) {
      return statusMap[statusStr];
    }
    
    // Thử tìm theo number
    const statusNum = Number(status);
    if (!isNaN(statusNum) && statusMap[statusNum] !== undefined) {
      return statusMap[statusNum];
    }
    
    // Fallback
    return { label: t('processing.pages.managerBatches.status.unknown'), color: "bg-gray-100 text-gray-700 border-gray-200", icon: Package };
  };

  // Filter batches
  const filteredBatches = batches.filter(batch => {
    const matchesSearch = batch.batchCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         batch.cropSeasonName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         batch.methodName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === "all" || String(batch.status) === String(filterStatus);
    
    return matchesSearch && matchesFilter;
  });

  // Calculate pagination
  const totalPages = Math.ceil(filteredBatches.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedBatches = filteredBatches.slice(startIndex, endIndex);

  // Reset page when search/filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus]);

  // Fetch data on mount
  useEffect(() => {
    fetchAllBatches();
  }, []);

  // Calculate statistics
  const totalBatches = batches.length;
  const activeBatches = batches.filter(b => String(b.status) === '1' || String(b.status) === 'InProgress' || String(b.status) === '3' || String(b.status) === 'AwaitingEvaluation').length;
  const totalOutput = batches.reduce((sum, b) => sum + (b.totalOutputQuantity || 0), 0);

  // Đếm số lượng theo trạng thái
  const statusCounts = batches.reduce<Record<string, number>>((acc, batch) => {
    acc[batch.status] = (acc[batch.status] || 0) + 1;
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="min-h-screen bg-amber-50 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
                      <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
              <p className="text-lg text-gray-600 font-medium">{t('processing.pages.managerBatches.loading.title')}</p>
              <p className="text-sm text-gray-500">{t('processing.pages.managerBatches.loading.description')}</p>
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
            <div className="text-center space-y-4 py-8">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              </div>
              <div className="space-y-2">
                <h2 className="text-lg font-semibold text-gray-900">{t('processing.pages.managerBatches.error.title')}</h2>
                <p className="text-sm text-gray-600">{error}</p>
              </div>
              <Button
                onClick={() => window.location.reload()}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                {t('processing.pages.managerBatches.error.retry')}
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
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">{t('processing.pages.managerBatches.title')}</h2>
                <p className="text-gray-600">{t('processing.pages.managerBatches.subtitle')}</p>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => router.push("/dashboard/manager/processing/reports")}
                  className="bg-white hover:bg-gray-50"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  {t('sidebar.reports')}
                </Button>
              </div>
            </div>
            
            {/* Stats inline trong header */}
            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-orange-600" />
                <span className="text-sm text-gray-600">{t('processing.pages.managerBatches.totalBatches')}: <span className="font-semibold text-gray-900">{totalBatches}</span></span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-green-600" />
                <span className="text-sm text-gray-600">{t('processing.pages.managerBatches.active')}: <span className="font-semibold text-gray-900">{activeBatches}</span></span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-600" />
                <span className="text-sm text-gray-600">{t('processing.pages.managerBatches.totalOutput')}: <span className="font-semibold text-gray-900">{totalOutput.toFixed(1)} kg</span></span>
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
                  <h2 className="text-sm font-medium text-gray-700 mb-3">{t('processing.pages.managerBatches.searchTitle')}</h2>
                  <div className="relative">
                    <Input
                      placeholder={t('processing.pages.managerBatches.searchPlaceholder')}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pr-10"
                    />
                    <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  </div>
                </div>

                {/* Status Filter */}
                <div>
                  <h2 className="text-sm font-medium text-gray-700 mb-3">{t('processing.pages.managerBatches.filterTitle')}</h2>
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
                      {t('processing.pages.managerBatches.allStatuses')}
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
                      {t('common.noData')}
                    </p>
                  </div>
                ) : (
                  <table className="w-full text-sm table-auto">
                    <thead className="bg-gray-100 text-gray-700 font-medium">
                      <tr>
                        <th className="px-4 py-3 text-left">{t('processing.pages.managerBatches.table.batchCode')}</th>
                        <th className="px-4 py-3 text-left">{t('sidebar.farmer')}</th>
                        <th className="px-4 py-3 text-left">{t('processing.pages.managerBatches.table.cropSeason')}</th>
                        <th className="px-4 py-3 text-left">{t('processing.pages.managerBatches.table.method')}</th>
                        <th className="px-4 py-3 text-left">{t('processing.pages.managerBatches.table.status')}</th>
                        <th className="px-4 py-3 text-left">{t('processing.pages.managerBatches.table.creationDate')}</th>
                        <th className="px-4 py-3 text-left">{t('processing.pages.managerBatches.table.action')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedBatches.map((batch) => {
                        const statusInfo = getStatusInfo(batch.status);
                        
                        return (
                          <tr key={batch.batchId} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <button
                                onClick={() => handleViewDetail(batch.batchId)}
                                className="font-medium text-gray-800 hover:text-orange-600 transition-colors cursor-pointer text-left"
                              >
                                {batch.batchCode}
                              </button>
                            </td>
                            <td className="px-4 py-3">
                              <button
                                onClick={() => handleViewDetail(batch.batchId)}
                                className="text-gray-700 hover:text-orange-600 transition-colors cursor-pointer text-left"
                              >
                                {(batch as any).farmerName || (batch as any).farmer?.name || t('processing.pages.managerBatches.farmer.unknown')}
                              </button>
                            </td>
                            <td className="px-4 py-3">
                              <button
                                onClick={() => handleViewDetail(batch.batchId)}
                                className="text-gray-700 hover:text-orange-600 transition-colors cursor-pointer text-left"
                              >
                                {batch.cropSeasonName || `ID: ${batch.cropSeasonId}`}
                              </button>
                            </td>
                            <td className="px-4 py-3">
                              <button
                                onClick={() => handleViewDetail(batch.batchId)}
                                className="text-gray-700 hover:text-orange-600 transition-colors cursor-pointer text-left"
                              >
                                {batch.methodName || `ID: ${batch.methodId}`}
                              </button>
                            </td>
                            <td className="px-4 py-3">
                              <Badge className={`${statusInfo.color} whitespace-nowrap`}>
                                {statusInfo.label}
                              </Badge>
                            </td>
                            <td className="px-4 py-3">
                              <button
                                onClick={() => handleViewDetail(batch.batchId)}
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
                                  onClick={() => handleEdit(batch.batchId)}
                                  className="h-8 px-2 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700"
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDelete(batch.batchId)}
                                  className="h-8 px-2 hover:bg-red-50 hover:border-red-300 hover:text-red-700"
                                >
                                  <Trash2 className="h-3 w-3" />
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
                    {t('processing.pages.managerBatches.pagination.showing')} {startIndex + 1} {t('processing.pages.managerBatches.pagination.to')} {Math.min(endIndex, filteredBatches.length)} {t('processing.pages.managerBatches.pagination.of')} {filteredBatches.length} {t('processing.pages.managerBatches.pagination.batches')}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      {t('processing.pages.managerBatches.pagination.previous')}
                    </Button>
                    <span className="text-sm text-gray-700">
                      {t('processing.pages.managerBatches.pagination.page')} {currentPage} / {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      {t('processing.pages.managerBatches.pagination.next')}
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
