"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { getAllProcessingWastes, ProcessingWaste } from "@/lib/api/processingBatchWastes";
import { getAllProcessingBatches, ProcessingBatch } from "@/lib/api/processingBatches";
import { Eye, Edit, Trash2, Recycle, Scale, Calendar, AlertTriangle, Search } from "lucide-react";

// Import các component chung
import ProcessingHeader from "@/components/processing/ProcessingHeader";
import SearchBox from "@/components/processing/SearchBox";
import ProcessingTable from "@/components/processing/ProcessingTable";

interface WasteWithBatch extends ProcessingWaste {
  batch?: ProcessingBatch;
}

export default function ManagerProcessingWastesPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [wastes, setWastes] = useState<ProcessingWaste[]>([]);
  const [batches, setBatches] = useState<ProcessingBatch[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [wasteData, batchData] = await Promise.all([
          getAllProcessingWastes(),
          getAllProcessingBatches()
        ]);
        setWastes(wasteData || []);
        setBatches(batchData || []);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Kết hợp wastes với batch data
  const wastesWithBatch: WasteWithBatch[] = wastes.map(waste => {
    const batch = batches.find(b => b.batchId === waste.batchId);
    return {
      ...waste,
      batch
    };
  });

  const filtered = wastesWithBatch.filter((waste) =>
    waste.batch?.batchCode?.toLowerCase().includes(search.toLowerCase()) ||
    waste.wasteCode?.toLowerCase().includes(search.toLowerCase()) ||
    waste.wasteType?.toLowerCase().includes(search.toLowerCase())
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
    // MANAGER: Có quyền xóa mềm chất thải
    if (confirm(t('processing.pages.managerBatches.wastes.deleteConfirm'))) {
      // TODO: Implement soft delete API call
      
    }
  };

  // Cấu hình cột cho table
  const columns = [
    { 
      key: "wasteCode", 
      title: t('processing.pages.managerBatches.wastes.table.wasteCode'),
      render: (value: string) => (
        <span className="font-medium">{value}</span>
      )
    },
    { 
      key: "batchCode", 
      title: t('processing.pages.managerBatches.wastes.table.batchCode'),
      render: (value: string, item: WasteWithBatch) => (
        <span className="text-blue-600 font-medium">
          {item.batch?.batchCode || t('processing.pages.managerBatches.wastes.unknown')}
        </span>
      )
    },
    { 
      key: "wasteType", 
      title: t('processing.pages.managerBatches.wastes.table.wasteType'),
      render: (value: string) => {
        const getWasteTypeColor = (type: string) => {
          if (type.includes("Vỏ")) return "bg-orange-100 text-orange-700";
          if (type.includes("Nước")) return "bg-blue-100 text-blue-700";
          if (type.includes("Bã")) return "bg-brown-100 text-brown-700";
          return "bg-gray-100 text-gray-700";
        };
        
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getWasteTypeColor(value)}`}>
            {value}
          </span>
        );
      }
    },
    { 
      key: "quantity", 
      title: t('processing.pages.managerBatches.wastes.table.quantity'),
      render: (value: number, item: ProcessingWaste) => (
        <div className="flex items-center gap-2">
          <Scale className="w-4 h-4 text-gray-400" />
          <span className="font-medium">{value || 0}</span>
          <span className="text-sm text-gray-500">{item.unit || "kg"}</span>
        </div>
      )
    },
    { 
      key: "disposalMethod", 
      title: t('processing.pages.managerBatches.wastes.table.disposalMethod'),
      render: (value: string) => {
        const getDisposalColor = (method: string) => {
          if (method.includes("Tái chế")) return "text-green-600";
          if (method.includes("Chôn")) return "text-orange-600";
          if (method.includes("Đốt")) return "text-red-600";
          return "text-gray-600";
        };
        
        return (
          <span className={`text-sm font-medium ${getDisposalColor(value)}`}>
            {value || t('processing.pages.managerBatches.wastes.unknown')}
          </span>
        );
      }
    },
    { 
      key: "createdAt", 
      title: t('processing.pages.managerBatches.wastes.table.createdAt'),
      render: (value: string) => {
        if (!value) return "—";
        
        const date = new Date(value);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - date.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        let timeAgo = "";
        if (diffDays === 1) {
          timeAgo = t('processing.pages.managerBatches.wastes.time.yesterday');
        } else if (diffDays === 0) {
          timeAgo = t('processing.pages.managerBatches.wastes.time.today');
        } else if (diffDays < 7) {
          timeAgo = t('processing.pages.managerBatches.wastes.time.daysAgo', { days: diffDays });
        } else {
          timeAgo = date.toLocaleDateString("vi-VN");
        }
        
        return (
          <div className="flex flex-col">
            <span className="text-sm font-medium">{date.toLocaleDateString("vi-VN")}</span>
            <span className="text-xs text-gray-500">{timeAgo}</span>
          </div>
        );
      }
    }
  ];

  // Cấu hình actions cho table - MANAGER: Xem, sửa, và xóa mềm
  const actions = [
    {
      label: t('processing.pages.managerBatches.wastes.actions.view'),
      icon: <Eye className="w-3 h-3" />,
      onClick: (waste: WasteWithBatch) => router.push(`/dashboard/manager/processing/wastes/${waste.wasteId}`),
      className: "hover:bg-green-50 hover:border-green-300"
    },
    {
      label: t('processing.pages.managerBatches.wastes.actions.edit'),
      icon: <Edit className="w-3 h-3" />,
      onClick: (waste: WasteWithBatch) => router.push(`/dashboard/manager/processing/wastes/${waste.wasteId}/edit`),
      className: "hover:bg-blue-50 hover:border-blue-300"
    },
    {
      label: t('processing.pages.managerBatches.wastes.actions.softDelete'),
      icon: <Trash2 className="w-3 h-3" />,
      onClick: (waste: WasteWithBatch) => handleDelete(waste.wasteId),
      className: "hover:bg-red-50 hover:border-red-300"
    }
  ];

  // Tính toán thống kê
  const totalWastes = wastes.length;
  const totalQuantity = wastes.reduce((sum, waste) => sum + (waste.quantity || 0), 0);
  const recycledWastes = wastes.filter(w => w.disposalMethod?.includes("Tái chế")).length;
  const hazardousWastes = wastes.filter(w => w.wasteType?.includes("Độc hại")).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <ProcessingHeader
          title={t('processing.pages.managerBatches.wastes.title')}
          description={`${t('processing.pages.managerBatches.wastes.description')} • ${totalWastes} ${t('processing.pages.managerBatches.wastes.stats.totalWastes').toLowerCase()} • ${totalQuantity.toFixed(1)} kg ${t('processing.pages.managerBatches.wastes.stats.totalQuantity').toLowerCase()}`}
          createButtonText={t('processing.pages.managerBatches.wastes.actions.addNew')}
          onCreateClick={() => router.push("/dashboard/manager/processing/wastes/create")}
        />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <Recycle className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{t('processing.pages.managerBatches.wastes.stats.totalWastes')}</p>
                <p className="text-2xl font-bold text-gray-900">{totalWastes}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Scale className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{t('processing.pages.managerBatches.wastes.stats.totalQuantity')}</p>
                <p className="text-2xl font-bold text-gray-900">{totalQuantity.toFixed(1)} kg</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Recycle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{t('processing.pages.managerBatches.wastes.stats.recycled')}</p>
                <p className="text-2xl font-bold text-gray-900">{recycledWastes}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{t('processing.pages.managerBatches.wastes.stats.hazardous')}</p>
                <p className="text-2xl font-bold text-gray-900">{hazardousWastes}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 max-w-md">
              <SearchBox
                                  placeholder={t('processing.pages.managerBatches.wastes.search.placeholder')}
                value={search}
                onChange={setSearch}
              />
            </div>
            <div className="text-sm text-gray-600">
              {search && (
                <span className="flex items-center gap-1">
                  <Search className="w-4 h-4" />
                  <span>{t('processing.pages.managerBatches.wastes.search.results', { count: filtered.length })}</span>
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
                <h2 className="text-lg font-semibold text-gray-900">{t('processing.pages.managerBatches.wastes.table.title')}</h2>
                <p className="text-sm text-gray-600 mt-1">
                  {t('processing.pages.managerBatches.wastes.table.summary', { total: filtered.length, quantity: totalQuantity.toFixed(1) })}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">
                  {totalPages > 1 ? t('processing.pages.managerBatches.wastes.table.pageInfo', { current: currentPage, total: totalPages }) : t('processing.pages.managerBatches.wastes.table.allWastes')}
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
              emptyMessage={t('processing.pages.managerBatches.wastes.table.noData')}
              emptyDescription={t('processing.pages.managerBatches.wastes.table.noDataDescription')}
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