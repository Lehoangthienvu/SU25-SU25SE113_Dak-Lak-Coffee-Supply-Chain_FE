"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AppToast } from "@/components/ui/AppToast";
import { getProcessingWasteById, ProcessingWaste } from "@/lib/api/processingWastes";
import { ArrowLeft, Trash2, Package, Calendar, Info, FileText, TrendingUp, Eye, AlertTriangle } from "lucide-react";

// Import các component chung
import ProcessingHeader from "@/components/processing/ProcessingHeader";
import { ProcessingErrorDisplay } from "@/components/shared/ProcessingErrorDisplay";

export default function ProcessingWasteDetailPage() {
  const router = useRouter();
  const params = useParams();
  const wasteId = params.id as string;

  const [waste, setWaste] = useState<ProcessingWaste | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

      // Load chi tiết chất thải
  useEffect(() => {
    async function fetchWaste() {
      try {
        setLoading(true);
        const wasteData = await getProcessingWasteById(wasteId);
        if (wasteData) {
          setWaste(wasteData);
        } else {
          AppToast.error("Không tìm thấy thông tin chất thải");
          router.push("/dashboard/farmer/processing/wastes");
        }
      } catch (err) {
        console.error("Lỗi tải chi tiết chất thải:", err);
        setError(err);
      } finally {
        setLoading(false);
      }
    }

    if (wasteId) {
      fetchWaste();
    }
  }, [wasteId, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100">
        <div className="p-6 max-w-4xl mx-auto">
          {/* Header Skeleton */}
          <div className="flex items-center gap-4 mb-8">
            <div className="h-10 w-10 bg-gray-200 rounded-lg animate-pulse"></div>
            <div className="space-y-2">
              <div className="h-8 bg-gray-200 rounded-lg w-64 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-48 animate-pulse"></div>
            </div>
          </div>

          {/* Content Skeleton */}
          <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-orange-200 p-6">
            <div className="space-y-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                  <div className="h-12 bg-gray-200 rounded-lg animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>

                     {/* Loading Indicator */}
           <div className="text-center space-y-4 mt-8">
             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
             <p className="text-lg text-gray-600 font-medium">Đang tải dữ liệu...</p>
             <p className="text-sm text-gray-500">Đang tải thông tin chất thải</p>
           </div>
        </div>
      </div>
    );
  }

  if (!waste) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100">
        <div className="p-6 max-w-4xl mx-auto">
                   <div className="text-center space-y-4">
           <AlertTriangle className="w-16 h-16 text-orange-600" />
           <h1 className="text-2xl font-bold text-gray-900">Không tìm thấy thông tin chất thải</h1>
           <p className="text-gray-600">Thông tin chất thải bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.</p>
           <Button onClick={() => router.push("/dashboard/farmer/processing/wastes")}>
             Quay lại danh sách
           </Button>
         </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100">
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <ProcessingHeader
          title="Chi tiết chất thải"
          description="Xem thông tin chi tiết về chất thải sơ chế"
          showCreateButton={false}
        />
        
        {/* Error Display */}
        {error && <ProcessingErrorDisplay error={error} />}
        
        <div className="flex justify-end">
          <Button 
            variant="outline" 
            onClick={() => router.back()}
            className="flex items-center gap-2 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại
          </Button>
        </div>

        {/* Main Content */}
        <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-orange-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-6 text-white">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              Thông tin chất thải
            </h2>
            <p className="text-orange-100 mt-1">Mã chất thải: {waste.wasteCode}</p>
          </div>
          
          <div className="p-6 space-y-6">
            {/* Thông tin cơ bản */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Info className="w-5 h-5 text-blue-600" />
                Thông tin cơ bản
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white/90 rounded-lg p-4 border border-orange-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-gray-600">Mã chất thải</span>
                  </div>
                  <p className="text-lg font-semibold text-gray-900">{waste.wasteCode}</p>
                </div>
                
                                 <div className="bg-white/90 rounded-lg p-4 border border-orange-200">
                   <div className="flex items-center gap-2 mb-2">
                     <Trash2 className="w-4 h-4 text-orange-600" />
                     <span className="text-sm font-medium text-gray-600">Loại chất thải</span>
                   </div>
                   <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">
                     {waste.wasteType}
                   </span>
                 </div>
                
                <div className="bg-white/90 rounded-lg p-4 border border-orange-200">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-gray-600">Số lượng</span>
                  </div>
                  <p className="text-lg font-semibold text-gray-900">
                    {waste.quantity} {waste.unit}
                  </p>
                </div>
                
                <div className="bg-white/90 rounded-lg p-4 border border-orange-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-medium text-gray-600">Ngày ghi nhận</span>
                  </div>
                  <p className="text-lg font-semibold text-gray-900">
                    {new Date(waste.recordedAt).toLocaleDateString('vi-VN')}
                  </p>
                </div>
              </div>
            </div>

            {/* Trạng thái xử lý */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Eye className="w-5 h-5 text-green-600" />
                Trạng thái xử lý
              </h3>
              
              <div className="bg-white/90 rounded-lg p-4 border border-orange-200">
                                 <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                   waste.isDisposed 
                     ? 'bg-amber-100 text-amber-800' 
                     : 'bg-orange-100 text-orange-800'
                 }`}>
                   {waste.isDisposed ? 'Đã xử lý' : 'Chưa xử lý'}
                 </span>
              </div>
            </div>

            {/* Ghi chú */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-600" />
                Ghi chú
              </h3>
              
              <div className="bg-white/90 rounded-lg p-4 border border-orange-200">
                <p className="text-gray-700 leading-relaxed">
                  {waste.note || "Không có ghi chú"}
                </p>
              </div>
            </div>

            {/* Thông tin bổ sung */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Info className="w-5 h-5 text-orange-600" />
                Thông tin bổ sung
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white/90 rounded-lg p-4 border border-orange-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-600">Ngày tạo</span>
                  </div>
                  <p className="text-sm text-gray-700">
                    {new Date(waste.createdAt).toLocaleDateString('vi-VN')}
                  </p>
                </div>
                
                <div className="bg-white/90 rounded-lg p-4 border border-orange-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-600">ID chất thải</span>
                  </div>
                  <p className="text-sm text-gray-700 font-mono">{waste.wasteId}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
