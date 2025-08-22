"use client";

import { useEffect, useState } from "react";
import {
  getAllInboundRequestsForFarmer,
  cancelInboundRequest,
} from "@/lib/api/warehouseInboundRequest";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useConfirmationDialog } from "@/components/ui/confirmation-dialog";
import {
  Search,
  PackagePlus,
  Eye,
  XCircle,
  Package,
  Filter,
  Calendar,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Clock,
  AlertCircle,
  Truck,
  Leaf,
  Coffee,
  CheckCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { toast } from "sonner";

const ITEMS_PER_PAGE = 5;

export default function FarmerDeliveryRequestListPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null); // Thêm filter theo loại
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedSections, setExpandedSections] = useState({
    search: true,
    type: true,
    status: true
  });
  const router = useRouter();
  const { openDialog, ConfirmationDialog } = useConfirmationDialog();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getAllInboundRequestsForFarmer();
        if (res.status === 1) {
          setRequests(res.data);
        } else toast.error("Lỗi tải danh sách: " + res.message);
      } catch {
        toast.error("Không thể kết nối máy chủ.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleCancel = async (id: string) => {
    openDialog({
      title: "Xác nhận hủy yêu cầu",
      message: "Bạn có chắc chắn muốn hủy yêu cầu này không? Hành động này không thể hoàn tác.",
      confirmText: "Hủy yêu cầu",
      cancelText: "Không",
      type: "danger",
      onConfirm: async () => {
        setLoadingId(id);
        try {
          const res = await cancelInboundRequest(id);
          toast.success(res.message);
          setRequests((prev) => prev.filter((r) => r.inboundRequestId !== id));
        } catch (error: any) {
          toast.error("Lỗi khi huỷ yêu cầu: " + error.message);
        } finally {
          setLoadingId(null);
        }
      }
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Pending":
        return <Badge className="bg-yellow-100 text-yellow-800 border border-yellow-200 px-3 py-1 rounded-full">
          <Clock className="w-3 h-3 mr-1" />
          Đang chờ duyệt
        </Badge>;
      case "Approved":
        return <Badge className="bg-blue-100 text-blue-800 border border-blue-200 px-3 py-1 rounded-full">
          <CheckCircle className="w-3 h-3 mr-1" />
          Đã duyệt
        </Badge>;
      case "Completed":
        return <Badge className="bg-green-100 text-green-800 border border-green-200 px-3 py-1 rounded-full">
          <CheckCircle className="w-3 h-3 mr-1" />
          Hoàn tất
        </Badge>;
      case "Rejected":
        return <Badge className="bg-red-100 text-red-800 border border-red-200 px-3 py-1 rounded-full">
          <XCircle className="w-3 h-3 mr-1" />
          Từ chối
        </Badge>;
      case "Cancelled":
        return <Badge className="bg-gray-100 text-gray-800 border border-gray-200 px-3 py-1 rounded-full">
          <XCircle className="w-3 h-3 mr-1" />
          Đã huỷ
        </Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 border border-gray-200 px-3 py-1 rounded-full">
          {status}
        </Badge>;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "Pending": return "Chờ duyệt";
      case "Approved": return "Đã duyệt";
      case "Rejected": return "Từ chối";
      case "Cancelled": return "Đã huỷ";
      case "Completed": return "Hoàn thành";
      default: return status;
    }
  };

  // Hàm xác định loại cà phê (tươi hay đã sơ chế)
  const getCoffeeType = (request: any) => {
    // Cà phê đã sơ chế: có batchId, không có detailId
    if (request.batchId && !request.detailId) return "processed";
    // Cà phê tươi: không có batchId, có detailId
    if (!request.batchId && request.detailId) return "fresh";
    return "unknown";
  };

  const getCoffeeTypeLabel = (type: string) => {
    switch (type) {
      case "processed": return "Cà phê đã sơ chế";
      case "fresh": return "Cà phê tươi";
      default: return "Không xác định";
    }
  };

  const getCoffeeTypeIcon = (type: string) => {
    switch (type) {
      case "processed": return <Coffee className="w-4 h-4 text-purple-600" />;
      case "fresh": return <Leaf className="w-4 h-4 text-orange-600" />;
      default: return <Package className="w-4 h-4 text-gray-600" />;
    }
  };

  const getCoffeeTypeStyle = (type: string) => {
    switch (type) {
      case "processed": return "bg-purple-100 text-purple-800 border border-purple-200";
      case "fresh": return "bg-orange-100 text-orange-800 border border-orange-200";
      default: return "bg-gray-100 text-gray-800 border border-gray-200";
    }
  };

  const filtered = requests.filter(
    (r) => {
      const matchesStatus = !selectedStatus || r.status === selectedStatus;
      const matchesType = !selectedType || getCoffeeType(r) === selectedType;
      const matchesSearch = 
        r.requestCode?.toLowerCase().includes(search.toLowerCase()) ||
        getCoffeeTypeLabel(getCoffeeType(r)).toLowerCase().includes(search.toLowerCase()) ||
        r.batchCode?.toLowerCase().includes(search.toLowerCase()) ||
        r.detailCode?.toLowerCase().includes(search.toLowerCase()) ||
        r.coffeeType?.toLowerCase().includes(search.toLowerCase()) ||
        r.typeName?.toLowerCase().includes(search.toLowerCase());
      return matchesStatus && matchesType && matchesSearch;
    }
  );

  // Tính toán phân trang
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedData = filtered.slice(startIndex, endIndex);

  // Reset về trang 1 khi thay đổi filter
  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedStatus, selectedType]);

  const statusCounts = requests.reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {});

  const typeCounts = requests.reduce<Record<string, number>>((acc, r) => {
    const type = getCoffeeType(r);
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  // Tính toán thống kê
  const totalRequests = requests.length;
  const pendingRequests = requests.filter(r => r.status === 'Pending').length;
  const approvedRequests = requests.filter(r => r.status === 'Approved').length;
  const totalQuantity = requests.reduce((sum, r) => sum + (r.requestedQuantity || 0), 0);
  const processedRequests = requests.filter(r => getCoffeeType(r) === 'processed').length;
  const freshRequests = requests.filter(r => getCoffeeType(r) === 'fresh').length;
  
  // Thống kê số lượng theo loại cà phê
  const freshCoffeeQuantity = requests.filter(r => getCoffeeType(r) === 'fresh').reduce((sum, r) => sum + (r.requestedQuantity || 0), 0);
  const processedCoffeeQuantity = requests.filter(r => getCoffeeType(r) === 'processed').reduce((sum, r) => sum + (r.requestedQuantity || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-6 px-4 overflow-x-hidden">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-blue-100">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                Yêu cầu giao hàng
              </h1>
              <p className="text-gray-600 text-lg">
                Theo dõi và quản lý các yêu cầu đã gửi
              </p>
            </div>
            <Button
              onClick={() => router.push("/dashboard/farmer/warehouse-request/create")}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-4 rounded-xl shadow-lg flex items-center gap-3 text-lg font-semibold transition-all duration-200 transform hover:scale-105"
            >
              <Truck className="w-6 h-6" />
              Gửi yêu cầu mới
            </Button>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-6">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white shadow-lg transform hover:scale-105 transition-all duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-xs font-medium">Tổng yêu cầu</p>
                  <p className="text-2xl font-bold">{totalRequests}</p>
                </div>
                <Package className="w-6 h-6 text-blue-200" />
              </div>
            </div>
            <div className="bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl p-4 text-white shadow-lg transform hover:scale-105 transition-all duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-100 text-xs font-medium">Chờ duyệt</p>
                  <p className="text-2xl font-bold">{pendingRequests}</p>
                </div>
                <Clock className="w-6 h-6 text-yellow-200" />
              </div>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl p-4 text-white shadow-lg transform hover:scale-105 transition-all duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-xs font-medium">Đã duyệt</p>
                  <p className="text-2xl font-bold">{approvedRequests}</p>
                </div>
                <TrendingUp className="w-6 h-6 text-green-200" />
              </div>
            </div>
            <div className="bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl p-4 text-white shadow-lg transform hover:scale-105 transition-all duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-indigo-100 text-xs font-medium">Tổng số lượng</p>
                  <p className="text-2xl font-bold">{totalQuantity.toFixed(1)} kg</p>
                </div>
                <Package className="w-6 h-6 text-indigo-200" />
              </div>
            </div>
            <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl p-4 text-white shadow-lg transform hover:scale-105 transition-all duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-amber-100 text-xs font-medium">Yêu cầu đã sơ chế</p>
                  <p className="text-2xl font-bold">{processedRequests}</p>
                </div>
                <Coffee className="w-6 h-6 text-amber-200" />
              </div>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl p-4 text-white shadow-lg transform hover:scale-105 transition-all duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-xs font-medium">Yêu cầu tươi</p>
                  <p className="text-2xl font-bold">{freshRequests}</p>
                </div>
                <Leaf className="w-6 h-6 text-green-200" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-4">
          {/* Sidebar */}
          <aside className="w-full lg:w-56 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-lg border border-blue-100">
              {/* Search Section */}
              <div className="border-b border-blue-100">
                <button
                  onClick={() => setExpandedSections(prev => ({ ...prev, search: !prev.search }))}
                  className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Search className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-semibold text-gray-800">Tìm kiếm yêu cầu</span>
                  </div>
                  {expandedSections.search ? (
                    <ChevronUp className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  )}
                </button>
                {expandedSections.search && (
                  <div className="px-4 pb-4">
                    <div className="relative">
                      <Input
                        placeholder="Tìm mã yêu cầu, loại cà phê..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pr-8 border-blue-200 focus:border-blue-500 focus:ring-blue-500 rounded-lg text-sm"
                      />
                      <Search className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                )}
              </div>

              {/* Filter by Type Section */}
              <div className="border-b border-blue-100">
                <button
                  onClick={() => setExpandedSections(prev => ({ ...prev, type: !prev.type }))}
                  className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-semibold text-gray-800">Lọc theo loại</span>
                  </div>
                  {expandedSections.type ? (
                    <ChevronUp className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  )}
                </button>
                {expandedSections.type && (
                  <div className="px-4 pb-4">
                    <div className="space-y-2">
                      <button
                        onClick={() => setSelectedType(null)}
                        className={`w-full text-left p-3 rounded-lg transition-all duration-200 flex items-center gap-2 text-xs ${
                          selectedType === null ? "bg-blue-100 border-2 border-blue-300 text-blue-700 font-semibold" : "hover:bg-gray-50 border-2 border-transparent"
                        }`}
                      >
                        <Filter className="w-4 h-4" />
                        Tất cả ({requests.length})
                      </button>
                      {Object.entries(typeCounts).map(([type, count]) => (
                        <button
                          key={type}
                          onClick={() => setSelectedType(type)}
                          className={`w-full text-left p-3 rounded-lg transition-all duration-200 flex items-center gap-2 text-xs ${
                            selectedType === type
                              ? "bg-blue-100 border-2 border-blue-300 text-blue-700 font-semibold"
                              : "hover:bg-gray-50 border-2 border-transparent"
                          }`}
                        >
                          {getCoffeeTypeIcon(type)}
                          {getCoffeeTypeLabel(type)} ({count})
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Filter by Status Section */}
              <div>
                <button
                  onClick={() => setExpandedSections(prev => ({ ...prev, status: !prev.status }))}
                  className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-semibold text-gray-800">Lọc theo trạng thái</span>
                  </div>
                  {expandedSections.status ? (
                    <ChevronUp className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  )}
                </button>
                {expandedSections.status && (
                  <div className="px-4 pb-4">
                    <div className="space-y-2">
                      <button
                        onClick={() => setSelectedStatus(null)}
                        className={`w-full text-left p-3 rounded-lg transition-all duration-200 text-xs ${
                          selectedStatus === null ? "bg-blue-100 border-2 border-blue-300 text-blue-700 font-semibold" : "hover:bg-gray-50 border-2 border-transparent"
                        }`}
                      >
                        Tất cả ({requests.length})
                      </button>
                      {Object.entries(statusCounts).map(([status, count]) => (
                        <button
                          key={status}
                          onClick={() => setSelectedStatus(status)}
                          className={`w-full text-left p-3 rounded-lg transition-all duration-200 text-xs ${
                            selectedStatus === status
                              ? "bg-blue-100 border-2 border-blue-300 text-blue-700 font-semibold"
                              : "hover:bg-gray-50 border-2 border-transparent"
                          }`}
                        >
                          {getStatusLabel(status)} ({count})
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0 w-full overflow-hidden">
            <div className="bg-white rounded-xl shadow-lg border border-blue-100">
              <div className="p-4 border-b border-blue-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Danh sách yêu cầu giao hàng</h2>
                    <p className="text-gray-600 mt-1 text-sm">
                      Hiển thị {filtered.length} yêu cầu • {totalRequests} tổng cộng
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-gray-600 font-medium text-sm">
                        {totalPages > 1 ? `Trang ${currentPage} / ${totalPages}` : "Tất cả yêu cầu"}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push("/dashboard/farmer/warehouse-request/create")}
                      className="text-blue-600 border-blue-200 hover:bg-blue-50 hover:border-blue-300"
                    >
                      <PackagePlus className="w-4 h-4 mr-2" />
                      Tạo yêu cầu mới
                    </Button>
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="text-center py-16">
                  <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
                  <p className="text-gray-500 text-lg font-medium">Đang tải dữ liệu...</p>
                </div>
              ) : paginatedData.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <AlertCircle className="w-10 h-10 text-gray-400" />
                  </div>
                  <p className="text-gray-500 text-xl font-medium mb-3">Không tìm thấy yêu cầu nào</p>
                  <p className="text-gray-400 text-lg">
                    {search || selectedStatus || selectedType ? 'Thử thay đổi bộ lọc tìm kiếm' : 'Bạn chưa có yêu cầu giao hàng nào'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                                     <table className="w-full table-fixed min-w-[720px]">
                     <thead className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200">
                       <tr>
                         <th className="w-32 px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                           Mã yêu cầu
                         </th>
                         <th className="w-40 px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                           Loại
                         </th>
                         <th className="w-24 px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                           Số lượng
                         </th>
                         <th className="w-48 px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                           Nguồn
                         </th>
                         <th className="w-32 px-3 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                           Trạng thái
                         </th>
                                                   <th className="w-36 px-3 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Hành động
                          </th>
                       </tr>
                     </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {paginatedData.map((req) => {
                        const coffeeType = getCoffeeType(req);
                        return (
                          <tr key={req.inboundRequestId} className="hover:bg-blue-50 transition-colors duration-200">
                            <td className="px-3 py-3">
                              <div className="flex flex-col">
                                <span className="text-sm font-semibold text-gray-900 truncate">{req.requestCode}</span>
                                <span className="text-xs text-gray-500">ID: {req.inboundRequestId.slice(-6)}</span>
                              </div>
                            </td>
                            <td className="px-3 py-3">
                              <div className="flex items-center gap-2">
                                {getCoffeeTypeIcon(coffeeType)}
                                <Badge className={`px-2 py-1 rounded-full text-xs font-semibold ${getCoffeeTypeStyle(coffeeType)} truncate`}>
                                  {getCoffeeTypeLabel(coffeeType)}
                                </Badge>
                              </div>
                            </td>
                            <td className="px-3 py-3">
                              <div className="text-sm font-semibold text-gray-900">
                                {req.requestedQuantity} kg
                              </div>
                            </td>
                                                         <td className="px-3 py-3">
                               <div className="flex flex-col">
                                 <span className="text-sm font-medium text-gray-900 truncate">
                                   {coffeeType === 'fresh' 
                                     ? (req.cropSeasonName || req.detailCode || "N/A")
                                     : coffeeType === 'processed' 
                                       ? (req.batchCode || "N/A")
                                       : "N/A"
                                   }
                                 </span>
                                 <span className={`text-xs ${
                                   coffeeType === 'fresh' ? 'text-orange-700' : 
                                   coffeeType === 'processed' ? 'text-purple-700' : 'text-gray-700'
                                 } truncate`}>
                                   {coffeeType === 'fresh'
                                     ? (req.typeName || "Cà phê tươi")
                                     : coffeeType === 'processed'
                                       ? (req.coffeeType || "Cà phê đã sơ chế")
                                       : "Không rõ"
                                   }
                                 </span>
                                 <span className="text-xs text-gray-500 mt-1">
                                   {new Date(req.createdAt).toLocaleDateString("vi-VN")} {new Date(req.createdAt).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })}
                                 </span>
                               </div>
                             </td>
                            
                            <td className="px-3 py-3 text-center">
                              {getStatusBadge(req.status)}
                            </td>
                                                         <td className="px-3 py-3 text-center">
                               <div className="flex items-center justify-center gap-1">
                                 <Button
                                   variant="outline"
                                   size="sm"
                                   onClick={() => router.push(`/dashboard/farmer/warehouse-request/${req.inboundRequestId}`)}
                                   className="text-blue-600 border-blue-200 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 text-xs px-2 py-1"
                                 >
                                   <Eye className="w-3 h-3 mr-1" />
                                   Xem
                                 </Button>
                                 {req.status === "Pending" && (
                                   <Button
                                     variant="destructive"
                                     size="sm"
                                     disabled={loadingId === req.inboundRequestId}
                                     onClick={() => handleCancel(req.inboundRequestId)}
                                     className="transition-all duration-200 text-xs px-1 py-1"
                                   >
                                     <XCircle className="w-3 h-3 mr-1" />
                                     Huỷ
                                   </Button>
                                 )}
                               </div>
                             </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination */}
              {!loading && totalPages > 1 && (
                <div className="p-4 border-t border-blue-100">
                  <div className="flex justify-between items-center">
                    <div className="text-gray-600 font-medium text-sm">
                      Hiển thị {startIndex + 1}–{endIndex} trong {filtered.length} yêu cầu
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        className="border-blue-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      {[...Array(totalPages)].map((_, i) => {
                        const page = i + 1;
                        return (
                          <Button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`rounded-lg px-3 py-1 text-xs font-semibold transition-all duration-200 ${
                              page === currentPage
                                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg"
                                : "bg-white text-gray-700 border border-blue-200 hover:border-blue-300 hover:bg-blue-50"
                            }`}
                          >
                            {page}
                          </Button>
                        );
                      })}
                      <Button
                        variant="outline"
                        size="icon"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        className="border-blue-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
      
      {/* Confirmation Dialog */}
      <ConfirmationDialog />
    </div>
  );
}
