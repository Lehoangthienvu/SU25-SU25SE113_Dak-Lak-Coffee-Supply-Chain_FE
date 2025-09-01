"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import {
  getAllProcessingBatchProgresses,
  ProcessingBatchProgress,
} from "@/lib/api/processingBatchProgress";
import { getAllProcessingBatches, ProcessingBatch } from "@/lib/api/processingBatches";
import { ProcessingStatus } from "@/lib/constants/batchStatus";
import { 
  Eye, 
  Plus, 
  TrendingUp, 
  Search,
  Clock,
  CheckCircle,
  AlertTriangle,
  Package,
  Calendar,
  User,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import Pagination from "@/components/ui/pagination";
import { ProcessingErrorDisplay } from "@/components/shared/ProcessingErrorDisplay";

const ITEMS_PER_PAGE = 10;

interface GroupedProgress {
  batchId: string;
  batchCode: string;
  batch: ProcessingBatch;
  progresses: ProcessingBatchProgress[];
  totalProgresses: number;
  lastUpdated: string;
  currentStage: string;
}

export default function ProcessingProgressesPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [progresses, setProgresses] = useState<ProcessingBatchProgress[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [batches, setBatches] = useState<ProcessingBatch[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [error, setError] = useState<any>(null);

  useEffect(() => {
  const fetchData = async () => {
    setLoading(true);
      try {
    const [progressRes, batchRes] = await Promise.all([
      getAllProcessingBatchProgresses(),
      getAllProcessingBatches()
    ]);
        setProgresses(progressRes || []);
        setBatches(batchRes || []);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError(error);
        setProgresses([]);
        setBatches([]);
      } finally {
    setLoading(false);
      }
  };
    fetchData();
  }, []);

  // Gộp progress theo batchId
  const groupedProgresses: GroupedProgress[] = batches.map(batch => {
    const batchProgresses = progresses.filter(p => p.batchId === batch.batchId);
    const sortedProgresses = batchProgresses.sort((a, b) => b.stepIndex - a.stepIndex);
    const lastProgress = sortedProgresses[0];
    
    // Xác định giai đoạn hiện tại
    let currentStage = t('processing.pages.farmerProgresses.overview.table.stages.notStarted');
    if (lastProgress) {
      currentStage = lastProgress.stageName || t('processing.pages.farmerProgresses.overview.table.stages.inProgress');
    } else if (batch.status === ProcessingStatus.Completed) {
      currentStage = t('processing.pages.farmerProgresses.overview.table.stages.completed');
    } else if (batch.status === ProcessingStatus.InProgress) {
      currentStage = t('processing.pages.farmerProgresses.overview.table.stages.inProgress');
    } else if (batch.status === ProcessingStatus.NotStarted) {
      currentStage = t('processing.pages.farmerProgresses.overview.table.stages.waiting');
    }
    
    return {
      batchId: batch.batchId,
      batchCode: batch.batchCode,
      batch,
      progresses: batchProgresses,
      totalProgresses: batchProgresses.length,
      lastUpdated: lastProgress?.progressDate || batch.createdAt,
      currentStage: currentStage
    };
  });

  const filtered = groupedProgresses.filter((group) => {
    const matchesSearch = (group.batchCode?.toLowerCase() || '').includes(search.toLowerCase());
    
    // Copy logic từ batches/page.tsx - sử dụng String comparison đơn giản
    const matchesStatus = !selectedStatus || String(group.batch.status) === String(selectedStatus);
    
    return matchesSearch && matchesStatus;
  });

  // Tính toán phân trang
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedData = filtered.slice(startIndex, endIndex);

  // Reset về trang 1 khi thay đổi filter
  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedStatus]);

  // Cấu hình cột cho table
  const columns = [
    { 
      key: "batchCode", 
      title: t('processing.pages.farmerProgresses.overview.table.columns.batchCode'),
      render: (value: string, item: GroupedProgress) => (
        <div className="flex flex-col">
          <span className="font-medium text-gray-900">{value}</span>
          <span className="text-xs text-gray-500">ID: {item.batchId.slice(-6)}</span>
        </div>
      )
    },
    { 
      key: "currentStage", 
      title: t('processing.pages.farmerProgresses.overview.table.columns.currentStage'),
      render: (value: string, item: GroupedProgress) => {
        const getStageColor = (stage: string) => {
          if (stage === t('processing.pages.farmerProgresses.overview.table.stages.completed')) return "text-green-700 bg-green-100";
          if (stage === t('processing.pages.farmerProgresses.overview.table.stages.inProgress')) return "text-blue-700 bg-blue-100";
          if (stage === t('processing.pages.farmerProgresses.overview.table.stages.waiting')) return "text-yellow-700 bg-yellow-100";
          if (stage === t('processing.pages.farmerProgresses.overview.table.stages.notStarted')) return "text-gray-700 bg-gray-100";
          return "text-purple-700 bg-purple-100";
        };
        
        return (
          <span className={`text-sm px-2 py-1 rounded-full font-medium ${getStageColor(value)}`}>
            {value}
          </span>
        );
      }
    },
    { 
      key: "totalProgresses", 
      title: t('processing.pages.farmerProgresses.overview.table.columns.progressCount'),
      render: (value: number, item: GroupedProgress) => {
        const totalStages = item.batch.stageCount || 0;
        const progressPercentage = totalStages > 0 ? Math.round((value / totalStages) * 100) : 0;
        
        return (
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{value}</span>
              <span className="text-xs text-gray-500">/ {totalStages || "?"}</span>
            </div>
            <div className="text-xs text-gray-500">{t('processing.pages.farmerProgresses.overview.steps.step')}</div>
            {totalStages > 0 && (
              <div className="w-16 bg-gray-200 rounded-full h-1.5">
                <div 
                  className="bg-green-500 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                ></div>
              </div>
            )}
          </div>
        );
      },
      align: "center" as const
    },
    { 
      key: "batchStatus", 
      title: t('processing.pages.farmerProgresses.overview.table.columns.status'),
      render: (value: any, item: GroupedProgress) => {
        const getStatusInfo = (status: any) => {
          const statusStr = String(status || '').toLowerCase();
          
          if (statusStr === 'notstarted' || statusStr === 'pending' || statusStr === 'chờ xử lý' || statusStr === '0') {
            return { label: t('processing.pages.farmerProgresses.overview.table.stages.waiting'), color: "bg-yellow-100 text-yellow-700" };
          } else if (statusStr === 'inprogress' || statusStr === 'processing' || statusStr === 'đang xử lý' || statusStr === '1') {
            return { label: t('processing.pages.farmerProgresses.overview.table.stages.inProgress'), color: "bg-blue-100 text-blue-700" };
          } else if (statusStr === 'completed' || statusStr === 'hoàn thành' || statusStr === '2') {
            return { label: t('processing.pages.farmerProgresses.overview.table.stages.completed'), color: "bg-green-100 text-green-700" };
          } else if (statusStr === 'awaitingevaluation' || statusStr === 'chờ đánh giá' || statusStr === '3') {
            return { label: t('processing.pages.farmerProgresses.overview.table.stages.waiting'), color: "bg-orange-100 text-orange-700" };
          } else if (statusStr === 'cancelled' || statusStr === 'đã hủy' || statusStr === '4') {
            return { label: t('processing.pages.farmerProgresses.overview.table.stages.cancelled'), color: "bg-red-100 text-red-700" };
          } else {
            return { label: t('processing.pages.farmerProgresses.overview.table.stages.unknown'), color: "bg-gray-100 text-gray-700" };
          }
        };
        
        const statusInfo = getStatusInfo(item.batch.status);
        return (
          <div className="flex items-center justify-center">
            <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${statusInfo.color}`}>
              {statusInfo.label}
            </span>
          </div>
        );
      },
      align: "center" as const
    },
    { 
      key: "lastUpdated", 
      title: t('processing.pages.farmerProgresses.overview.table.columns.lastUpdated'),
      render: (value: string, item: GroupedProgress) => {
        if (!value) return "—";
        
        const date = new Date(value);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - date.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        let timeAgo = "";
        if (diffDays === 1) {
          timeAgo = t('processing.pages.farmerProgresses.overview.table.time.yesterday');
        } else if (diffDays === 0) {
          timeAgo = t('processing.pages.farmerProgresses.overview.table.time.today');
        } else if (diffDays < 7) {
          timeAgo = t('processing.pages.farmerProgresses.overview.table.time.daysAgo', { days: diffDays });
        } else {
          timeAgo = date.toLocaleDateString("vi-VN");
        }
        
        return (
          <div className="flex flex-col items-center">
            <span className="text-sm font-medium">{date.toLocaleDateString("vi-VN")}</span>
            <span className="text-xs text-gray-500">{timeAgo}</span>
          </div>
        );
      },
      align: "center" as const
    }
  ];

  // Cấu hình actions cho table - FARMER: Có thể xem chi tiết và thêm tiến trình
  const actions = [
    {
      label: t('processing.pages.farmerProgresses.overview.table.actions.viewDetails'),
      icon: <Eye className="w-3 h-3" />,
      onClick: (group: GroupedProgress) => router.push(`/dashboard/farmer/processing/progresses/${group.batchId}`),
      className: "hover:bg-green-50 hover:border-green-300 text-green-700"
    },
    {
      label: t('processing.pages.farmerProgresses.overview.table.actions.addProgress'),
      icon: <Plus className="w-3 h-3" />,
      onClick: (group: GroupedProgress) => router.push(`/dashboard/farmer/processing/progresses/create?batchId=${group.batchId}`),
      className: "hover:bg-blue-50 hover:border-blue-300 text-blue-700"
    }
  ];

  // Calculate stats
  const totalBatches = batches.length;
  const activeBatches = batches.filter(b => b.status === ProcessingStatus.InProgress).length;
  const totalProgresses = progresses.length;

  const getStatusInfo = (status: any) => {
    // Xử lý status có thể là string, number, hoặc enum
    const statusStr = String(status || '').toLowerCase();
    
    if (statusStr === 'notstarted' || statusStr === 'pending' || statusStr === 'chờ xử lý' || statusStr === '0') {
      return { label: t('processing.pages.farmerProgresses.overview.table.stages.waiting'), color: "bg-amber-100 text-amber-700 border-amber-200", icon: Clock };
    } else if (statusStr === 'inprogress' || statusStr === 'processing' || statusStr === 'đang xử lý' || statusStr === '1') {
      return { label: t('processing.pages.farmerProgresses.overview.table.stages.inProgress'), color: "bg-orange-100 text-orange-700 border-orange-200", icon: TrendingUp };
    } else if (statusStr === 'completed' || statusStr === 'hoàn thành' || statusStr === '2') {
      return { label: t('processing.pages.farmerProgresses.overview.table.stages.completed'), color: "bg-green-100 text-green-700 border-green-200", icon: CheckCircle };
    } else if (statusStr === 'awaitingevaluation' || statusStr === 'chờ đánh giá' || statusStr === '3') {
      return { label: t('processing.pages.farmerProgresses.overview.table.stages.waiting'), color: "bg-blue-100 text-blue-700 border-blue-200", icon: Clock };
    } else if (statusStr === 'cancelled' || statusStr === 'đã hủy' || statusStr === '4') {
      return { label: t('processing.pages.farmerProgresses.overview.table.stages.cancelled'), color: "bg-red-100 text-red-700 border-red-200", icon: AlertTriangle };
    } else {
      return { label: t('processing.pages.farmerProgresses.overview.table.stages.unknown'), color: "bg-gray-100 text-gray-700 border-gray-200", icon: Package };
    }
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
            </div>
            <div className="flex-1 bg-white rounded-xl shadow-sm p-6">
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
                <p className="text-sm text-muted-foreground mt-2">{t('processing.pages.farmerProgresses.overview.loading')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-amber-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('processing.pages.farmerProgresses.overview.title')}</h1>
            <p className="text-gray-600">{t('processing.pages.farmerProgresses.overview.subtitle')}</p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => router.push("/dashboard/farmer/processing/progresses/create")}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t('processing.pages.farmerProgresses.overview.addProgress')}
            </Button>
          </div>
        </div>

        {/* Error Display */}
        {error && <ProcessingErrorDisplay error={error} />}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Package className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">{t('processing.pages.farmerProgresses.overview.stats.totalBatches')}</p>
                <p className="text-2xl font-bold text-gray-900">{totalBatches}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">{t('processing.pages.farmerProgresses.overview.stats.activeBatches')}</p>
                <p className="text-2xl font-bold text-gray-900">{activeBatches}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-sm p-6 text-white">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-white/80">{t('processing.pages.farmerProgresses.overview.stats.totalProgresses')}</p>
                <p className="text-2xl font-bold">{totalProgresses}</p>
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
                <h2 className="text-sm font-medium text-gray-700 mb-3">{t('processing.pages.farmerProgresses.overview.search.title')}</h2>
                <div className="relative">
                  <Input
                    placeholder={t('processing.pages.farmerProgresses.overview.search.placeholder')}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pr-10"
                  />
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>

              {/* Filters */}
              <div>
                <h2 className="text-sm font-medium text-gray-700 mb-3">{t('processing.pages.farmerProgresses.overview.filters.title')}</h2>
                <div className="space-y-3">
                   {/* Status Filter */}
                   <div>
                     <label className="text-xs text-gray-600 mb-3 block font-medium">{t('processing.pages.farmerProgresses.overview.filters.status')}</label>
                     <div className="space-y-2">
                       {/* All Statuses Button */}
                       <button
                         onClick={() => setSelectedStatus("")}
                         className={cn(
                           "w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 text-left flex items-center gap-3",
                           !selectedStatus
                             ? "bg-orange-100 text-orange-700 border-2 border-orange-300 shadow-sm"
                             : "text-gray-600 hover:bg-orange-50 hover:text-orange-600 hover:border hover:border-orange-200"
                         )}
                       >
                         <Package className="h-4 w-4" />
                         <span className="flex-1">{t('processing.pages.farmerProgresses.overview.filters.statusPlaceholder')}</span>
                         <Badge variant="secondary" className="ml-auto text-xs bg-orange-200 text-orange-700">
                           {groupedProgresses.length}
                         </Badge>
                       </button>
                       
                       {/* Dynamic Status Buttons */}
                       {Array.from(new Set(batches.map(b => b.status))).map((status, index) => {
                         const statusInfo = getStatusInfo(status);
                         const count = batches.filter(b => b.status === status).length;
                         const IconComponent = statusInfo.icon;
                         
                         return (
                           <button
                             key={index}
                             onClick={() => setSelectedStatus(status)}
                             className={cn(
                               "w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 text-left flex items-center gap-3",
                               selectedStatus === status
                                 ? "bg-orange-100 text-orange-700 border-2 border-orange-300 shadow-sm"
                                 : "text-gray-600 hover:bg-orange-50 hover:text-orange-600 hover:border hover:border-orange-200"
                             )}
                           >
                             <IconComponent className="h-4 w-4" />
                             <span className="flex-1">{statusInfo.label}</span>
                             <Badge variant="secondary" className="ml-auto text-xs bg-orange-200 text-orange-700">
                               {count}
                             </Badge>
                           </button>
                         );
                       })}
                     </div>
                   </div>

                                     {/* Filter Actions */}
                   <div className="flex gap-2">
                     <Button
                       variant="outline"
                       size="sm"
                       onClick={() => setSelectedStatus("")}
                       className="flex-1 text-xs"
                     >
                       {t('processing.pages.farmerProgresses.overview.filters.clearFilters')}
                     </Button>
                   </div>
                </div>
              </div>

              {/* Steps Overview */}
              <div>
                <h2 className="text-sm font-medium text-gray-700 mb-3">{t('processing.pages.farmerProgresses.overview.steps.title')}</h2>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">{t('processing.pages.farmerProgresses.overview.steps.totalSteps')}:</span>
                    <span className="font-medium">{batches.reduce((total, batch) => total + (batch.stageCount || 0), 0)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">{t('processing.pages.farmerProgresses.overview.steps.completedSteps')}:</span>
                    <span className="font-medium text-green-600">{progresses.length}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">{t('processing.pages.farmerProgresses.overview.steps.remainingSteps')}:</span>
                    <span className="font-medium text-orange-600">
                      {Math.max(0, batches.reduce((total, batch) => total + (batch.stageCount || 0), 0) - progresses.length)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </aside>

                     {/* Main Content Area */}
           <main className="flex-1">
             <div className="bg-white rounded-xl shadow-sm p-6">
               <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {t('processing.pages.farmerProgresses.overview.table.title')} ({filtered.length})
              </h2>
              
              {paginatedData.length === 0 ? (
                <div className="text-center py-12">
                  <TrendingUp className="w-16 h-16 text-orange-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {search ? t('processing.pages.farmerProgresses.overview.empty.noSearchResults') : t('processing.pages.farmerProgresses.overview.empty.noProgresses')}
                  </h3>
                  <p className="text-gray-500">
                    {search 
                      ? t('processing.pages.farmerProgresses.overview.empty.searchHint')
                      : t('processing.pages.farmerProgresses.overview.empty.createHint')
                    }
                  </p>
                </div>
              ) : (
                <table className="w-full text-sm table-auto">
                  <thead className="bg-gray-100 text-gray-700 font-medium">
                    <tr>
                      <th className="px-4 py-3 text-left">{t('processing.pages.farmerProgresses.overview.table.columns.batchCode')}</th>
                      <th className="px-4 py-3 text-left">{t('processing.pages.farmerProgresses.overview.table.columns.farmer')}</th>
                      <th className="px-4 py-3 text-left">{t('processing.pages.farmerProgresses.overview.table.columns.currentStage')}</th>
                      <th className="px-4 py-3 text-left">{t('processing.pages.farmerProgresses.overview.table.columns.status')}</th>
                      <th className="px-4 py-3 text-left">{t('processing.pages.farmerProgresses.overview.table.columns.progressCount')}</th>
                      <th className="px-4 py-3 text-left">{t('processing.pages.farmerProgresses.overview.table.columns.lastUpdated')}</th>
                      <th className="px-4 py-3 text-left">{t('processing.pages.farmerProgresses.overview.table.columns.actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedData.map((group) => {
                      const statusInfo = getStatusInfo(group.batch.status);
                      return (
                        <tr 
                          key={group.batchId} 
                          className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                          onClick={() => router.push(`/dashboard/farmer/processing/progresses/${group.batchId}`)}
                        >
                          <td className="px-4 py-3">
                            <span className="font-medium text-gray-800">{group.batchCode}</span>
                          </td>
                          <td className="px-4 py-3">{group.batch.farmerName}</td>
                          <td className="px-4 py-3">
                            <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                              {group.currentStage}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <Badge className={statusInfo.color}>
                              {statusInfo.label}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-medium text-gray-800">{group.totalProgresses}</span>
                          </td>
                          <td className="px-4 py-3">
                            {group.lastUpdated ? new Date(group.lastUpdated).toLocaleDateString("vi-VN") : "—"}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.push(`/dashboard/farmer/processing/progresses/${group.batchId}`)}
                                className="h-8 px-2 hover:bg-green-50 hover:border-green-300 hover:text-green-700"
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.push(`/dashboard/farmer/processing/progresses/create?batchId=${group.batchId}`)}
                                className="h-8 px-2 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700"
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination */}
            {!loading && totalPages > 1 && (
              <div className="mt-4">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={filtered.length}
                  itemsPerPage={ITEMS_PER_PAGE}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}