"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  getProcessingBatchById,
  ProcessingBatch,
} from "@/lib/api/processingBatches";
import StatusBadge from "@/components/processing-batches/StatusBadge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Loader, 
  ArrowLeft, 
  Package, 
  Coffee, 
  Calendar, 
  User, 
  Settings, 
  Scale, 
  TrendingUp, 
  CheckCircle, 
  Clock, 
  ClipboardCheck, 
  AlertTriangle,
  FileText,
  BarChart3,
  Eye,
  Edit,
  Trash2
} from "lucide-react";
import { AppToast } from "@/components/ui/AppToast";

export default function ViewProcessingBatchManager() {
  // Lấy ID từ URL params
  const { id } = useParams();
  const router = useRouter();
  const [batch, setBatch] = useState<ProcessingBatch | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch dữ liệu lô sơ chế khi component mount
  useEffect(() => {
    const fetchBatch = async () => {
      if (typeof id === "string") {
        setLoading(true);
        try {
          const data = await getProcessingBatchById(id);
          setBatch(data);
        } catch (error) {
          console.error("Lỗi khi tải dữ liệu lô sơ chế:", error);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchBatch();
  }, [id]);

  // Hàm xử lý trạng thái với icon
  const getStatusInfo = (status: any) => {
    const statusStr = String(status || '').toLowerCase();

    if (statusStr === 'notstarted' || statusStr === 'pending' || statusStr === 'chờ xử lý' || statusStr === '0') {
      return { label: "Chờ xử lý", color: "bg-amber-100 text-amber-700 border-amber-200", icon: Clock };
    } else if (statusStr === 'inprogress' || statusStr === 'processing' || statusStr === 'đang xử lý' || statusStr === '1') {
      return { label: "Đang xử lý", color: "bg-orange-100 text-orange-700 border-orange-200", icon: TrendingUp };
    } else if (statusStr === 'completed' || statusStr === 'hoàn thành' || statusStr === '2') {
      return { label: "Hoàn thành", color: "bg-green-100 text-green-700 border-green-200", icon: CheckCircle };
    } else if (statusStr === 'awaitingevaluation' || statusStr === 'chờ đánh giá' || statusStr === '3') {
      return { label: "Chờ đánh giá", color: "bg-blue-100 text-blue-700 border-blue-200", icon: ClipboardCheck };
    } else if (statusStr === 'cancelled' || statusStr === 'đã hủy' || statusStr === '4') {
      return { label: "Đã hủy", color: "bg-red-100 text-red-700 border-red-200", icon: AlertTriangle };
    } else {
      return { label: "Không xác định", color: "bg-gray-100 text-gray-700 border-gray-200", icon: Package };
    }
  };

  // Tính toán thống kê
  const calculateStats = () => {
    if (!batch) return { totalProgress: 0, totalOutput: 0, efficiency: 0 };
    
    const totalProgress = batch.progresses?.length || 0;
    const totalOutput = batch.totalOutputQuantity || 0;
    const totalInput = batch.totalInputQuantity || 0;
    const efficiency = totalInput > 0 ? ((totalOutput / totalInput) * 100) : 0;
    
    return { totalProgress, totalOutput, efficiency };
  };

  // Xử lý các thao tác nhanh
  const handleViewProgress = () => {
    console.log("Xem tiến độ chi tiết cho lô:", batch?.batchCode);
    // TODO: Implement view progress functionality
    AppToast.info("Chức năng xem tiến độ chi tiết đang được phát triển");
  };

  const handleViewExpertEvaluation = () => {
    console.log("Xem đánh giá của chuyên gia cho lô:", batch?.batchCode);
    // TODO: Implement view expert evaluation functionality
    AppToast.info("Chức năng xem đánh giá của chuyên gia đang được phát triển");
  };

  const handleEditBatch = () => {
    console.log("Chỉnh sửa thông tin lô:", batch?.batchCode);
    // TODO: Implement edit batch functionality
    AppToast.info("Chức năng chỉnh sửa thông tin đang được phát triển");
  };

  const handleDeleteBatch = () => {
    console.log("Xóa lô:", batch?.batchCode);
    if (confirm("Bạn có chắc chắn muốn xóa lô sơ chế này?")) {
      // TODO: Implement delete batch functionality
      AppToast.info("Chức năng xóa lô đang được phát triển");
    }
  };

  const stats = calculateStats();

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
            <p className="text-lg text-gray-600 font-medium">Đang tải dữ liệu...</p>
            <p className="text-sm text-gray-500">Đang tải thông tin lô sơ chế</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state - không tìm thấy lô
  if (!batch) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <AlertTriangle className="w-16 h-16 text-orange-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Không tìm thấy lô sơ chế</h1>
            <p className="text-gray-600 mb-6">Lô sơ chế bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.</p>
            <Button onClick={() => router.push("/dashboard/manager/processing/batches")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Quay lại danh sách
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo(batch.status);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-orange-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                onClick={() => router.push("/dashboard/manager/processing/batches")}
                className="bg-white/80 hover:bg-white border-orange-200 hover:border-orange-300"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Quay lại
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Chi tiết lô sơ chế</h1>
                <p className="text-gray-600 mt-1">Thông tin chi tiết về lô sơ chế cà phê</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                onClick={handleViewProgress}
                className="bg-white/80 hover:bg-white border-orange-200 hover:border-orange-300"
              >
                <Eye className="w-4 h-4 mr-2" />
                Xem tiến độ
              </Button>
              <Button 
                variant="outline" 
                onClick={handleViewExpertEvaluation}
                className="bg-white/80 hover:bg-white border-orange-200 hover:border-orange-300"
              >
                <FileText className="w-4 h-4 mr-2" />
                Báo cáo
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-orange-200 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-orange-100 rounded-xl">
                <Package className="w-8 h-8 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Mã lô</p>
                <p className="text-xl font-bold text-gray-900">{batch.batchCode}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-orange-200 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-xl">
                <TrendingUp className="w-8 h-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Giai đoạn</p>
                <p className="text-xl font-bold text-gray-900">{stats.totalProgress}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-orange-200 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-xl">
                <Scale className="w-8 h-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Sản lượng</p>
                <p className="text-xl font-bold text-gray-900">{stats.totalOutput} kg</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-orange-200 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-xl">
                <BarChart3 className="w-8 h-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Hiệu suất</p>
                <p className="text-xl font-bold text-gray-900">{stats.efficiency.toFixed(1)}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Basic Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-orange-200 p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
                <div className="w-3 h-3 bg-orange-500 rounded-full mr-3"></div>
                Thông tin cơ bản
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg p-4 border border-orange-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="w-4 h-4 text-orange-600" />
                    <span className="font-medium text-gray-700">Mã lô</span>
                  </div>
                  <span className="text-gray-800 font-semibold text-lg">{batch.batchCode}</span>
                </div>
                <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg p-4 border border-orange-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="w-4 h-4 text-blue-600" />
                    <span className="font-medium text-gray-700">Mã hệ thống</span>
                  </div>
                  <span className="text-gray-800 font-semibold text-lg">{batch.systemBatchCode}</span>
                </div>
                <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg p-4 border border-orange-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-green-600" />
                    <span className="font-medium text-gray-700">Mùa vụ</span>
                  </div>
                  <span className="text-gray-800 font-semibold text-lg">{batch.cropSeasonName}</span>
                </div>
                <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg p-4 border border-orange-200">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4 text-purple-600" />
                    <span className="font-medium text-gray-700">Nông dân</span>
                  </div>
                  <span className="text-gray-800 font-semibold text-lg">{batch.farmerName}</span>
                </div>
                <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg p-4 border border-orange-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Settings className="w-4 h-4 text-indigo-600" />
                    <span className="font-medium text-gray-700">Phương pháp</span>
                  </div>
                  <span className="text-gray-800 font-semibold text-lg">{batch.methodName}</span>
                </div>
                <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg p-4 border border-orange-200">
                  <div className="flex items-center gap-2 mb-2">
                    <statusInfo.icon className="w-4 h-4" />
                    <span className="font-medium text-gray-700">Trạng thái</span>
                  </div>
                  <Badge className={statusInfo.color}>
                    <span className="flex items-center gap-1">
                      <statusInfo.icon className="w-3 h-3" />
                      {statusInfo.label}
                    </span>
                  </Badge>
                </div>
                <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg p-4 border border-orange-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Scale className="w-4 h-4 text-blue-600" />
                    <span className="font-medium text-gray-700">Khối lượng vào</span>
                  </div>
                  <span className="text-gray-800 font-semibold text-lg">{batch.totalInputQuantity} kg</span>
                </div>
                <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg p-4 border border-orange-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Scale className="w-4 h-4 text-green-600" />
                    <span className="font-medium text-gray-700">Khối lượng ra</span>
                  </div>
                  <span className="text-gray-800 font-semibold text-lg">{batch.totalOutputQuantity} kg</span>
                </div>
                <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg p-4 border border-orange-200 md:col-span-2">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-gray-600" />
                    <span className="font-medium text-gray-700">Ngày tạo</span>
                  </div>
                  <span className="text-gray-800 font-semibold text-lg">{new Date(batch.createdAt).toLocaleString("vi-VN")}</span>
                </div>
              </div>
            </div>

            {/* Processing Progress */}
            <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-blue-200 p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                Tiến độ chế biến
              </h2>
              {batch.progresses && batch.progresses.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-blue-50 to-cyan-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Tên giai đoạn</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Chi tiết giai đoạn</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Khối lượng đầu ra</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Ngày thực hiện</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-blue-100">
                      {batch.progresses.map((progress, idx) => (
                        <tr key={idx} className="hover:bg-blue-50/50 transition-all duration-200">
                          <td className="px-6 py-4">
                            <span className="font-medium text-gray-800">{progress.stageName}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-gray-700">{progress.stageDescription || "Không có mô tả"}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-gray-800 font-semibold">
                              {progress.outputQuantity} {progress.outputUnit}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-gray-600">
                              {progress.progressDate ? new Date(progress.progressDate).toLocaleDateString("vi-VN") : "—"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-100">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-8 h-8 text-blue-600" />
                  </div>
                  <p className="text-gray-600 font-medium">Chưa có tiến độ nào</p>
                  <p className="text-sm text-gray-500 mt-1">Lô sơ chế chưa được bắt đầu xử lý</p>
                </div>
              )}
            </div>

            
          </div>

          {/* Right Column - Actions & Summary */}
          <div className="space-y-6">
            {/* Quick Actions Section - Các thao tác nhanh cho manager */}
            <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-orange-200 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Thao tác nhanh</h3>
              <div className="space-y-3">
                {/* Nút xem tiến độ chi tiết */}
                <Button 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={handleViewProgress}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Xem tiến độ chi tiết
                </Button>
                {/* Nút xem đánh giá của chuyên gia */}
                <Button 
                  variant="outline" 
                  className="w-full border-orange-200 hover:bg-orange-50"
                  onClick={handleViewExpertEvaluation}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Xem đánh giá của chuyên gia
                </Button>
                {/* Nút chỉnh sửa thông tin lô */}
                <Button 
                  variant="outline" 
                  className="w-full border-green-200 hover:bg-green-50"
                  onClick={handleEditBatch}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Chỉnh sửa thông tin
                </Button>
                {/* Nút xóa lô sơ chế */}
                <Button 
                  variant="outline" 
                  className="w-full border-red-200 hover:bg-red-50 text-red-600"
                  onClick={handleDeleteBatch}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Xóa
                </Button>
              </div>
            </div>

            {/* Batch Summary Section - Tóm tắt thông tin lô */}
            <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-orange-200 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Tóm tắt lô</h3>
              <div className="space-y-4">
                {/* Hiển thị trạng thái hiện tại của lô */}
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Trạng thái hiện tại:</span>
                  <Badge className={statusInfo.color}>
                    <span className="flex items-center gap-1">
                      <statusInfo.icon className="w-3 h-3" />
                      {statusInfo.label}
                    </span>
                  </Badge>
                </div>
                {/* Hiển thị số giai đoạn đã hoàn thành */}
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Số giai đoạn:</span>
                  <span className="font-semibold text-gray-800">{stats.totalProgress}</span>
                </div>
                {/* Hiển thị hiệu suất chế biến */}
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Hiệu suất:</span>
                  <span className="font-semibold text-gray-800">{stats.efficiency.toFixed(1)}%</span>
                </div>
                {/* Hiển thị ngày tạo lô */}
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Ngày tạo:</span>
                  <span className="font-semibold text-gray-800">{new Date(batch.createdAt).toLocaleDateString("vi-VN")}</span>
                </div>
              </div>
            </div>

            {/* Contact Information Section - Thông tin liên hệ */}
            <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-orange-200 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Thông tin liên hệ</h3>
              <div className="space-y-3">
                {/* Thông tin nông dân */}
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="font-medium text-gray-800">{batch.farmerName}</p>
                    <p className="text-sm text-gray-600">Nông dân</p>
                  </div>
                </div>
                {/* Thông tin mùa vụ */}
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="font-medium text-gray-800">{batch.cropSeasonName}</p>
                    <p className="text-sm text-gray-600">Mùa vụ</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 