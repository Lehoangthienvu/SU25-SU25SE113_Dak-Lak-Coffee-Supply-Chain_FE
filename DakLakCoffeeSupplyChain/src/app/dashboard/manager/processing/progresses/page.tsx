"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { getAllProcessingBatches, ProcessingBatch } from "@/lib/api/processingBatches";
import { getAllProcessingBatchProgresses, ProcessingBatchProgress } from "@/lib/api/processingBatchProgress";
import { Eye, Edit, TrendingUp, Package, Calendar, Search } from "lucide-react";

// Import các component chung
import ProcessingHeader from "@/components/processing/ProcessingHeader";
import SearchBox from "@/components/processing/SearchBox";
import ProcessingTable from "@/components/processing/ProcessingTable";
import { ProcessingStatus } from "@/lib/constants/batchStatus";

interface GroupedProgress {
  batchId: string;
  batchCode: string;
  batch: ProcessingBatch;
  progresses: ProcessingBatchProgress[];
  totalProgresses: number;
  lastUpdated: string;
  currentStage: string;
}

export default function ManagerProcessingProgressesPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [batches, setBatches] = useState<ProcessingBatch[]>([]);
  const [progresses, setProgresses] = useState<ProcessingBatchProgress[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [batchData, progressData] = await Promise.all([
          getAllProcessingBatches(),
          getAllProcessingBatchProgresses()
        ]);
        setBatches(batchData || []);
        setProgresses(progressData || []);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Nhóm progresses theo batchId
  const groupedProgresses: GroupedProgress[] = batches.map(batch => {
    const batchProgresses = progresses.filter(p => p.batchId === batch.batchId);
    const sortedProgresses = batchProgresses.sort((a, b) => b.stepIndex - a.stepIndex);
    const lastProgress = sortedProgresses[0];
    
    return {
      batchId: batch.batchId,
      batchCode: batch.batchCode,
      batch: batch,
      progresses: batchProgresses,
      totalProgresses: batchProgresses.length,
      lastUpdated: lastProgress?.progressDate || batch.createdAt,
      currentStage: lastProgress?.stageName || t('processing.pages.managerBatches.progresses.stage.notStarted')
    };
  }).sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());

  const filtered = groupedProgresses.filter((group) =>
    group.batchCode.toLowerCase().includes(search.toLowerCase())
  );

  // Tính toán phân trang
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedData = filtered.slice(startIndex, endIndex);

  // Reset về trang 1 khi thay đổi search
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  // Cấu hình cột cho table
  const columns = [
    { 
      key: "batchCode", 
      title: t('processing.pages.managerBatches.progresses.table.batchCode'),
      render: (value: string, item: GroupedProgress) => (
        <span className="font-medium">{value}</span>
      )
    },
    { 
      key: "currentStage", 
      title: t('processing.pages.managerBatches.progresses.table.currentStage'),
      render: (value: string, item: GroupedProgress) => {
        const getStageColor = (stage: string) => {
          if (stage.includes(t('processing.pages.managerBatches.progresses.stage.completed'))) return "bg-green-100 text-green-700";
          if (stage.includes(t('processing.pages.managerBatches.progresses.stage.inProgress'))) return "bg-blue-100 text-blue-700";
          if (stage.includes(t('processing.pages.managerBatches.progresses.stage.waiting'))) return "bg-yellow-100 text-yellow-700";
          return "bg-gray-100 text-gray-700";
        };
        
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStageColor(value)}`}>
            {value}
          </span>
        );
      }
    },
    { 
      key: "totalProgresses", 
      title: t('processing.pages.managerBatches.progresses.table.totalProgresses'),
      render: (value: number, item: GroupedProgress) => {
        const currentProgress = item.progresses.length;
        const totalStages = item.batch.stageCount || 0;
        const percentage = totalStages > 0 ? (currentProgress / totalStages) * 100 : 0;
        
        return (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{currentProgress} / {totalStages}</span>
            <div className="w-16 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${percentage}%` }}
              ></div>
            </div>
          </div>
        );
      }
    },
    { 
      key: "batchStatus", 
      title: t('processing.pages.managerBatches.progresses.table.batchStatus'),
      render: (value: any, item: GroupedProgress) => {
        const getStatusInfo = (status: number) => {
          // Debug: Log status để xem giá trị thực tế
  
          
          // Xử lý status có thể là number hoặc string
          let statusString: string;
          if (typeof status === 'number') {
            // Nếu là number, chuyển đổi theo mapping
            switch (status) {
              case 0: statusString = ProcessingStatus.NotStarted; break;
              case 1: statusString = ProcessingStatus.InProgress; break;
              case 2: statusString = ProcessingStatus.Completed; break;
              case 3: statusString = ProcessingStatus.AwaitingEvaluation; break;
              case 4: statusString = ProcessingStatus.Cancelled; break;
              default: statusString = status.toString();
            }
          } else {
            statusString = status;
          }
          
          
          
          // Kiểm tra xem status có trong enum không
          const isValidStatus = Object.values(ProcessingStatus).includes(statusString as ProcessingStatus);
          
          
          
          if (!isValidStatus) {
            return { label: `${t('processing.pages.managerBatches.progresses.status.unknown')} (${statusString})`, color: "bg-gray-100 text-gray-700" };
          }
          
          // Sử dụng statusString để so sánh
          switch (statusString) {
            case ProcessingStatus.NotStarted:
              return { label: t('processing.pages.managerBatches.progresses.status.notStarted'), color: "bg-yellow-100 text-yellow-700" };
            case ProcessingStatus.InProgress:
              return { label: t('processing.pages.managerBatches.progresses.status.inProgress'), color: "bg-blue-100 text-blue-700" };
            case ProcessingStatus.Completed:
              return { label: t('processing.pages.managerBatches.progresses.status.completed'), color: "bg-green-100 text-green-700" };
            case ProcessingStatus.AwaitingEvaluation:
              return { label: t('processing.pages.managerBatches.progresses.status.awaitingEvaluation'), color: "bg-orange-100 text-orange-700" };
            case ProcessingStatus.Cancelled:
              return { label: t('processing.pages.managerBatches.progresses.status.cancelled'), color: "bg-red-100 text-red-700" };
            default:
              return { label: t('processing.pages.managerBatches.progresses.status.unknown'), color: "bg-gray-100 text-gray-700" };
          }
        };
        
        const statusInfo = getStatusInfo(item.batch.status as any);
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
      title: t('processing.pages.managerBatches.progresses.table.lastUpdated'),
      render: (value: string, item: GroupedProgress) => {
        if (!value) return "—";
        
        const date = new Date(value);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - date.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        let timeAgo = "";
        if (diffDays === 1) {
          timeAgo = t('processing.pages.managerBatches.progresses.time.yesterday');
        } else if (diffDays === 0) {
          timeAgo = t('processing.pages.managerBatches.progresses.time.today');
        } else if (diffDays < 7) {
          timeAgo = `${diffDays} ${t('processing.pages.managerBatches.progresses.time.daysAgo')}`;
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

  // Cấu hình actions cho table - MANAGER: Chỉ xem chi tiết, không tạo mới
  const actions = [
    {
      label: t('processing.pages.managerBatches.progresses.actions.viewDetail'),
      icon: <Eye className="w-3 h-3" />,
      onClick: (group: GroupedProgress) => router.push(`/dashboard/manager/processing/progresses/${group.batchId}`),
      className: "hover:bg-green-50 hover:border-green-300 text-green-700"
    }
    // MANAGER: Không có quyền thêm tiến trình từ list
    // {
    //   label: "Thêm tiến trình",
    //   icon: <Plus className="w-3 h-3" />,
    //   onClick: (group: GroupedProgress) => router.push(`/dashboard/manager/processing/progresses/create?batchId=${group.batchId}`),
    //   className: "hover:bg-blue-50 hover:border-green-300 text-blue-700"
    // }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <ProcessingHeader
          title={t('processing.pages.managerBatches.progresses.title')}
          description={`${t('processing.pages.managerBatches.progresses.description')} • ${batches.length} lô • ${progresses.length} tiến trình`}
          // MANAGER: Không có quyền tạo tiến trình từ đây
          // createButtonText="Thêm tiến trình"
          // onCreateClick={() => router.push("/dashboard/manager/processing/progresses/create")}
        />

        {/* Search */}
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 max-w-md">
              <SearchBox
                placeholder={t('processing.pages.managerBatches.progresses.search.placeholder')}
                value={search}
                onChange={setSearch}
              />
            </div>
            <div className="text-sm text-gray-600">
              {search && (
                <span className="flex items-center gap-1">
                  <Search className="w-4 h-4" />
                  <span>{t('processing.pages.managerBatches.progresses.search.results', { count: filtered.length })}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{t('processing.pages.managerBatches.progresses.summary.title')}</h2>
                <p className="text-sm text-gray-600 mt-1">
                  {t('processing.pages.managerBatches.progresses.summary.description', { batchCount: filtered.length, progressCount: progresses.length })}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">
                  {totalPages > 1 ? t('processing.pages.managerBatches.progresses.summary.pageInfo', { current: currentPage, total: totalPages }) : t('processing.pages.managerBatches.progresses.summary.allBatches')}
                </p>
              </div>
            </div>
          </div>
          <div className="p-0">
            <ProcessingTable
              data={paginatedData}
              columns={columns}
              actions={actions}
              loading={loading}
              emptyMessage={t('processing.pages.managerBatches.progresses.empty.title')}
              emptyDescription={t('processing.pages.managerBatches.progresses.empty.description')}
              renderPagination={filtered.length > ITEMS_PER_PAGE}
              pagination={{
                currentPage,
                totalPages,
                onPageChange: setCurrentPage,
                itemsPerPage: ITEMS_PER_PAGE,
                totalItems: filtered.length
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
} 