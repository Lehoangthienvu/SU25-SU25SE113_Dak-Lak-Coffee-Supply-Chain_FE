"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { getAllProcessingStages, ProcessingStage } from "@/lib/api/processingStages";
import { Eye, Edit, Trash2, Plus, Settings, Clock, CheckCircle, Search } from "lucide-react";

// Import các component chung
import ProcessingHeader from "@/components/processing/ProcessingHeader";
import SearchBox from "@/components/processing/SearchBox";
import ProcessingTable from "@/components/processing/ProcessingTable";

export default function ManagerProcessingStagesPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [stages, setStages] = useState<ProcessingStage[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const stageData = await getAllProcessingStages();
        setStages(stageData || []);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filtered = stages.filter((stage) =>
    stage.stageName?.toLowerCase().includes(search.toLowerCase())
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

  const handleDelete = (id: string) => {
    // MANAGER: Có quyền xóa mềm giai đoạn
    if (confirm(t('processing.pages.managerBatches.stages.deleteConfirm'))) {
      // TODO: Implement soft delete API call
      
    }
  };

  // Cấu hình cột cho table
  const columns = [
    {
      key: "stageId",
      title: t('processing.pages.managerBatches.stages.table.stageId'),
      render: (value: string) => (
        <span className="font-medium text-blue-600">
          {typeof value === 'string' ? value.slice(-6) : value}
        </span>
      )
    },
    {
      key: "stageName",
      title: t('processing.pages.managerBatches.stages.table.stageName'),
      render: (value: string) => (
        <span className="font-medium">{value}</span>
      )
    },
    {
      key: "orderIndex",
      title: t('processing.pages.managerBatches.stages.table.orderIndex'),
      render: (value: number) => (
        <div className="flex items-center justify-center">
          <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
            {value}
          </span>
        </div>
      ),
      align: "center" as const
    },
    {
      key: "methodId",
      title: t('processing.pages.managerBatches.stages.table.methodId'),
      render: (value: number) => (
        <span className="text-sm text-gray-600">ID: {value}</span>
      )
    },
    {
      key: "isRequired",
      title: t('processing.pages.managerBatches.stages.table.isRequired'),
      render: (value: boolean) => (
        <div className="flex items-center justify-center">
          {value ? (
            <span className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
              <CheckCircle className="w-3 h-3" />
              {t('processing.pages.managerBatches.stages.status.required')}
            </span>
          ) : (
            <span className="flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
              <Settings className="w-3 h-3" />
              {t('processing.pages.managerBatches.stages.status.optional')}
            </span>
          )}
        </div>
      ),
      align: "center" as const
    },
    {
      key: "isDeleted",
      title: t('processing.pages.managerBatches.stages.table.isDeleted'),
      render: (value: boolean) => {
        return (
          <div className="flex items-center justify-center">
            {!value ? (
              <span className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                <CheckCircle className="w-3 h-3" />
                {t('processing.pages.managerBatches.stages.status.active')}
              </span>
            ) : (
              <span className="flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                <Settings className="w-3 h-3" />
                {t('processing.pages.managerBatches.stages.status.deleted')}
              </span>
            )}
          </div>
        );
      },
      align: "center" as const
    }
  ];

  // Cấu hình actions cho table - MANAGER: Xem, sửa, và xóa mềm
  const actions = [
    {
      label: t('processing.pages.managerBatches.stages.actions.view'),
      icon: <Eye className="w-3 h-3" />,
      onClick: (stage: ProcessingStage) => router.push(`/dashboard/manager/processing/stages/${stage.stageId}`),
      className: "hover:bg-green-50 hover:border-green-300"
    },
    {
      label: t('processing.pages.managerBatches.stages.actions.edit'),
      icon: <Edit className="w-3 h-3" />,
      onClick: (stage: ProcessingStage) => router.push(`/dashboard/manager/processing/stages/${stage.stageId}/edit`),
      className: "hover:bg-blue-50 hover:border-blue-300"
    },
    {
      label: t('processing.pages.managerBatches.stages.actions.softDelete'),
      icon: <Trash2 className="w-3 h-3" />,
      onClick: (stage: ProcessingStage) => handleDelete(stage.stageId.toString()),
      className: "hover:bg-red-50 hover:border-red-300"
    }
  ];

  // Tính toán thống kê
  const totalStages = stages.length;
  const activeStages = stages.filter(s => !s.isDeleted).length;
  const inactiveStages = stages.filter(s => s.isDeleted).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <ProcessingHeader
          title={t('processing.pages.managerBatches.stages.title')}
          description={`${t('processing.pages.managerBatches.stages.description')} • ${totalStages} ${t('processing.pages.managerBatches.stages.stats.totalStages').toLowerCase()} • ${activeStages} ${t('processing.pages.managerBatches.stages.stats.activeStages').toLowerCase()}`}
          createButtonText={t('processing.pages.managerBatches.stages.createButtonText')}
          onCreateClick={() => router.push("/dashboard/manager/processing/stages/create")}
        />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Settings className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{t('processing.pages.managerBatches.stages.stats.totalStages')}</p>
                <p className="text-2xl font-bold text-gray-900">{totalStages}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{t('processing.pages.managerBatches.stages.stats.activeStages')}</p>
                <p className="text-2xl font-bold text-gray-900">{activeStages}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Settings className="w-6 h-6 text-gray-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{t('processing.pages.managerBatches.stages.stats.inactiveStages')}</p>
                <p className="text-2xl font-bold text-gray-900">{inactiveStages}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{t('processing.pages.managerBatches.stages.stats.methods')}</p>
                <p className="text-2xl font-bold text-gray-900">
                  {new Set(stages.map(s => s.methodId)).size}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 max-w-md">
              <SearchBox
                placeholder={t('processing.pages.managerBatches.stages.search.placeholder')}
                value={search}
                onChange={setSearch}
              />
            </div>
            <div className="text-sm text-gray-600">
              {search && (
                <span className="flex items-center gap-1">
                  <Search className="w-4 h-4" />
                  <span>{t('processing.pages.managerBatches.stages.search.results', { count: filtered.length })}</span>
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
                <h2 className="text-lg font-semibold text-gray-900">{t('processing.pages.managerBatches.stages.summary.title')}</h2>
                <p className="text-sm text-gray-600 mt-1">
                  {t('processing.pages.managerBatches.stages.summary.description', { totalStages: filtered.length, activeStages })}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">
                  {totalPages > 1 ? t('processing.pages.managerBatches.stages.summary.pageInfo', { current: currentPage, total: totalPages }) : t('processing.pages.managerBatches.stages.summary.allStages')}
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
              emptyMessage={t('processing.pages.managerBatches.stages.empty.title')}
              emptyDescription={t('processing.pages.managerBatches.stages.empty.description')}
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