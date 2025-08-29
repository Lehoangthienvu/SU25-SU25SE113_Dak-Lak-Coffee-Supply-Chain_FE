"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { AppToast } from "@/components/ui/AppToast";
import { getAllProcessingWastes, ProcessingWaste } from "@/lib/api/processingWastes";
import { Plus, Trash2, Package, Calendar, Search, Filter, Eye } from "lucide-react";

// Import các component chung
import ProcessingHeader from "@/components/processing/ProcessingHeader";
import SearchBox from "@/components/processing/SearchBox";
import ProcessingTable from "@/components/processing/ProcessingTable";
import Pagination from "@/components/processing/Pagination";

export default function ProcessingWastesPage() {
  const router = useRouter();
  const { t } = useTranslation();

  const [wastes, setWastes] = useState<ProcessingWaste[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(10);

      // Load danh sách chất thải
  useEffect(() => {
    async function fetchWastes() {
      try {
        setLoading(true);
        const wastesData = await getAllProcessingWastes();
        
        if (Array.isArray(wastesData)) {
          setWastes(wastesData);
          setTotalPages(Math.ceil(wastesData.length / itemsPerPage));
        } else {
          setWastes([]);
          setTotalPages(1);
        }
      } catch (err) {
        console.error("Lỗi tải danh sách chất thải:", err);
        AppToast.error(t("processing.pages.farmerWastes.error.title"));
        setWastes([]);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    }

    fetchWastes();
  }, [itemsPerPage, t]);

  // Filter và pagination
  const filteredWastes = wastes.filter((waste) => {
    if (!waste) return false;
    
    return (waste.wasteCode?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
           (waste.wasteType?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
           (waste.note?.toLowerCase() || '').includes(searchTerm.toLowerCase());
  });

  const paginatedWastes = filteredWastes.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const columns = [
    {
      key: "wasteCode",
      title: t("processing.pages.farmerWastes.table.wasteCode"),
      render: (value: any, waste: ProcessingWaste) => {
        if (!waste) return <span className="text-gray-400">N/A</span>;
        return (
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-green-600" />
            <span className="font-medium">{waste.wasteCode || 'N/A'}</span>
          </div>
        );
      },
    },
    {
      key: "wasteType",
      title: t("processing.pages.farmerWastes.table.wasteType"),
             render: (value: any, waste: ProcessingWaste) => {
         if (!waste) return <span className="text-gray-400">N/A</span>;
         return (
           <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">
             {waste.wasteType || 'N/A'}
           </span>
         );
       },
    },
    {
      key: "quantity",
      title: t("processing.pages.farmerWastes.table.quantity"),
      render: (value: any, waste: ProcessingWaste) => {
        if (!waste) return <span className="text-gray-400">N/A</span>;
        return (
          <span className="font-medium">
            {waste.quantity || 0} {waste.unit || 'kg'}
          </span>
        );
      },
    },
    {
      key: "isDisposed",
      title: t("processing.pages.farmerWastes.table.disposalStatus"),
      render: (value: any, waste: ProcessingWaste) => {
        if (!waste) return <span className="text-gray-400">N/A</span>;
        return (
                   <span className={`px-3 py-1 rounded-full text-sm font-medium ${
           waste.isDisposed 
             ? 'bg-amber-100 text-amber-800' 
             : 'bg-orange-100 text-orange-800'
         }`}>
           {waste.isDisposed ? t("processing.pages.farmerWastes.status.disposed") : t("processing.pages.farmerWastes.status.notDisposed")}
         </span>
        );
      },
    },
    {
      key: "recordedAt",
      title: t("processing.pages.farmerWastes.table.recordedAt"),
      render: (value: any, waste: ProcessingWaste) => {
        if (!waste || !waste.recordedAt) return <span className="text-gray-400">N/A</span>;
        return (
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <span>{new Date(waste.recordedAt).toLocaleDateString('vi-VN')}</span>
          </div>
        );
      },
    },
    {
      key: "actions",
      title: t("processing.pages.farmerWastes.table.actions"),
      render: (value: any, waste: ProcessingWaste) => {
        if (!waste || !waste.wasteId) return <span className="text-gray-400">N/A</span>;
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/dashboard/farmer/processing/wastes/${waste.wasteId}`)}
              className="flex items-center gap-1 hover:bg-blue-50 hover:border-blue-300"
            >
              <Eye className="w-4 h-4" />
              {t("processing.pages.farmerWastes.table.view")}
            </Button>
          </div>
        );
      },
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100">
        <div className="p-6 max-w-7xl mx-auto">
          {/* Header Skeleton */}
          <div className="flex items-center gap-4 mb-8">
            <div className="h-10 w-10 bg-gray-200 rounded-lg animate-pulse"></div>
            <div className="space-y-2">
              <div className="h-8 bg-gray-200 rounded-lg w-64 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-48 animate-pulse"></div>
            </div>
          </div>

          {/* Search Skeleton */}
          <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-orange-200 p-4 mb-6">
            <div className="h-12 bg-gray-200 rounded-lg animate-pulse"></div>
          </div>

          {/* Table Skeleton */}
          <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-orange-200">
            <div className="border-b border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50 p-4">
              <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
            </div>
            <div className="p-4 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-200 rounded-lg animate-pulse"></div>
              ))}
            </div>
          </div>

          {/* Loading Indicator */}
          <div className="text-center space-y-4 mt-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
            <p className="text-lg text-gray-600 font-medium">{t("processing.pages.farmerWastes.loading.title")}</p>
            <p className="text-sm text-gray-500">{t("processing.pages.farmerWastes.loading.description")}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100">
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <ProcessingHeader
          title={t("processing.pages.farmerWastes.title")}
          description={t("processing.pages.farmerWastes.description")}
          showCreateButton={true}
          onCreateClick={() => router.push("/dashboard/farmer/processing/wastes/create")}
        />

        {/* Search */}
        <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-orange-200 p-4">
                     <SearchBox
             value={searchTerm}
             onChange={setSearchTerm}
             placeholder={t("processing.pages.farmerWastes.searchPlaceholder")}
           />
        </div>

        {/* Table */}
        <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-orange-200">
          <ProcessingTable
            data={paginatedWastes}
            columns={columns}
            emptyMessage={t("processing.pages.farmerWastes.emptyMessage")}
          />
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredWastes.length}
            onPageChange={setCurrentPage}
          />
        )}

        

         {/* Stats */}
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                     <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-orange-200 p-6">
             <div className="flex items-center gap-3">
               <div className="p-3 bg-orange-100 rounded-lg">
                 <Trash2 className="w-6 h-6 text-orange-600" />
               </div>
               <div>
                 <p className="text-sm text-gray-600">{t("processing.pages.farmerWastes.stats.totalWastes")}</p>
                 <p className="text-2xl font-bold text-gray-900">{wastes.length}</p>
               </div>
             </div>
           </div>
          
                     <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-orange-200 p-6">
             <div className="flex items-center gap-3">
               <div className="p-3 bg-amber-100 rounded-lg">
                 <Package className="w-6 h-6 text-amber-600" />
               </div>
               <div>
                 <p className="text-sm text-gray-600">{t("processing.pages.farmerWastes.stats.processedBatches")}</p>
                 <p className="text-2xl font-bold text-gray-900">
                   {wastes.filter(w => w && w.isDisposed).length}
                 </p>
               </div>
             </div>
           </div>
          
                     <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-orange-200 p-6">
             <div className="flex items-center gap-3">
               <div className="p-3 bg-blue-100 rounded-lg">
                 <Calendar className="w-6 h-6 text-blue-600" />
               </div>
               <div>
                 <p className="text-sm text-gray-600">{t("processing.pages.farmerWastes.stats.thisMonth")}</p>
                                    <p className="text-2xl font-bold text-gray-900">
                     {wastes.filter(w => {
                       if (!w || !w.recordedAt) return false;
                       const wasteDate = new Date(w.recordedAt);
                       const now = new Date();
                       return wasteDate.getMonth() === now.getMonth() && 
                              wasteDate.getFullYear() === now.getFullYear();
                     }).length}
                   </p>
               </div>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}
