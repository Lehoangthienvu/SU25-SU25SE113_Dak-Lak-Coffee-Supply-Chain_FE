'use client';

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getAllInboundRequests } from "@/lib/api/warehouseInboundRequest";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Search, Eye, Package, TrendingUp, Clock, CheckCircle, XCircle, Leaf, Coffee } from "lucide-react";
import { Badge } from "@/components/ui/badge";

function InboundRequestListContent() {
  const [requests, setRequests] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [coffeeTypeFilter, setCoffeeTypeFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const pageSize = 15;
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Lấy status filter từ URL query params
    const statusFromUrl = searchParams.get('status');
    if (statusFromUrl) {
      setStatusFilter(statusFromUrl);
    }
  }, [searchParams]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await getAllInboundRequests();
        if (res.status === 1) {
          setRequests(Array.isArray(res.data) ? res.data : []);
        } else {
          toast.error(res.message || 'Không thể tải danh sách yêu cầu nhập kho');
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Lỗi khi tải dữ liệu từ server.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Helper function to determine coffee type
  const getCoffeeType = (request: any) => {
    // Cà phê đã sơ chế: có batchId, không có detailId
    if (request.batchId && !request.detailId) return 'processed';
    // Cà phê tươi: không có batchId, có detailId
    if (!request.batchId && request.detailId) return 'fresh';
    return 'unknown';
  };

  const getCoffeeTypeLabel = (request: any) => {
    const type = getCoffeeType(request);
    switch (type) {
      case 'fresh': return 'Cà phê tươi';
      case 'processed': return 'Cà phê đã sơ chế';
      default: return 'Không xác định';
    }
  };

  const getCoffeeTypeIcon = (request: any) => {
    const type = getCoffeeType(request);
    switch (type) {
      case 'fresh': return <Leaf className="w-4 h-4 text-orange-600" />;
      case 'processed': return <Coffee className="w-4 h-4 text-purple-600" />;
      default: return <Package className="w-4 h-4 text-gray-600" />;
    }
  };

  const filtered = requests.filter((r) => {
    const matchesSearch =
      r.requestCode?.toLowerCase().includes(search.toLowerCase()) ||
      r.farmerName?.toLowerCase().includes(search.toLowerCase()) ||
      r.batchCode?.toLowerCase().includes(search.toLowerCase()) ||
      r.cropSeasonName?.toLowerCase().includes(search.toLowerCase()) ||
      r.detailCode?.toLowerCase().includes(search.toLowerCase()) ||
      r.coffeeType?.toLowerCase().includes(search.toLowerCase());

    // Xử lý lọc trạng thái
    let matchesStatus = true;
    if (statusFilter && statusFilter !== 'all') {
      if (statusFilter === 'Pending') {
        matchesStatus = r.status === 'Pending' || r.status === 'Processing';
      } else if (statusFilter === 'Accepted') {
        matchesStatus = r.status === 'Accepted' || r.status === 'Approved';
      } else {
        matchesStatus = r.status === statusFilter;
      }
    }

    // Xử lý lọc loại cà phê
    const matchesType =
      coffeeTypeFilter === 'all' ||
      getCoffeeType(r) === coffeeTypeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const pendingRequests = filtered.filter(r => r.status === 'Pending' || r.status === 'Processing');
  const acceptedRequests = filtered.filter(r => r.status === 'Accepted' || r.status === 'Approved');
  const completedRequests = filtered.filter(r => r.status === 'Completed');
  const totalQuantity = filtered.reduce((sum, r) => {
    const quantity = r.requestedQuantity || r.quantity || r.amount || r.requestQuantity || 0;
    return sum + quantity;
  }, 0);

  // Thống kê theo loại cà phê
  const freshCoffeeRequests = filtered.filter(r => getCoffeeType(r) === 'fresh');
  const processedCoffeeRequests = filtered.filter(r => getCoffeeType(r) === 'processed');
  const freshCoffeeQuantity = freshCoffeeRequests.reduce((sum, r) => sum + (r.requestedQuantity || 0), 0);
  const processedCoffeeQuantity = processedCoffeeRequests.reduce((sum, r) => sum + (r.requestedQuantity || 0), 0);

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
      default:
        return <Badge className="bg-gray-100 text-gray-800 border border-gray-200 px-3 py-1 rounded-full">
          {status}
        </Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-600">Đang tải danh sách yêu cầu nhập kho...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-6 px-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-blue-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-green-500 to-green-600 rounded-lg">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  📥 Yêu cầu nhập kho
                </h1>
                <p className="text-gray-600 text-sm">
                  Quản lý và duyệt các yêu cầu nhập kho từ nông dân
                </p>
              </div>
            </div>
            <div className="flex gap-2 items-center relative">
              <Input
                placeholder="Tìm mã yêu cầu, nông dân, lô..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-72 pr-10 border-blue-200 focus:ring-blue-400 focus:border-blue-400"
              />
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-400 w-4 h-4" />
            </div>
          </div>

          {/* Filter Panel */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Trạng thái:</span>
                <Select value={statusFilter} onValueChange={(value) => {
                  setStatusFilter(value);
                  setPage(1);
                }}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Chọn trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="Pending">Đang chờ</SelectItem>
                    <SelectItem value="Accepted">Đã duyệt</SelectItem>
                    <SelectItem value="Rejected">Từ chối</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Loại cà phê:</span>
                <Select value={coffeeTypeFilter} onValueChange={(value) => {
                  setCoffeeTypeFilter(value);
                  setPage(1);
                }}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Chọn loại cà phê" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả ({requests.length})</SelectItem>
                    <SelectItem value="fresh">
                      <div className="flex items-center gap-2">
                        <Leaf className="w-4 h-4 text-orange-600" />
                        Cà phê tươi ({freshCoffeeRequests.length})
                      </div>
                    </SelectItem>
                    <SelectItem value="processed">
                      <div className="flex items-center gap-2">
                        <Coffee className="w-4 h-4 text-purple-600" />
                        Cà phê đã sơ chế ({processedCoffeeRequests.length})
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Tổng yêu cầu</p>
                  <p className="text-2xl font-bold">{filtered.length}</p>
                </div>
                <Package className="w-8 h-8 text-green-200" />
              </div>
            </div>
            <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-100 text-sm font-medium">Đang chờ</p>
                  <p className="text-2xl font-bold">{pendingRequests.length}</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-200" />
              </div>
            </div>
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Đã duyệt</p>
                  <p className="text-2xl font-bold">{acceptedRequests.length}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-blue-200" />
              </div>
            </div>
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Tổng lượng</p>
                  <p className="text-2xl font-bold">{totalQuantity.toLocaleString()} kg</p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-200" />
              </div>
            </div>
          </div>

          {/* Coffee Type Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Leaf className="w-4 h-4" />
                    <p className="text-orange-100 text-sm font-medium">Cà phê tươi</p>
                  </div>
                  <p className="text-xl font-bold">{freshCoffeeRequests.length} yêu cầu</p>
                  <p className="text-orange-200 text-sm">{freshCoffeeQuantity.toLocaleString()} kg</p>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Coffee className="w-4 h-4" />
                    <p className="text-purple-100 text-sm font-medium">Cà phê đã sơ chế</p>
                  </div>
                  <p className="text-xl font-bold">{processedCoffeeRequests.length} yêu cầu</p>
                  <p className="text-purple-200 text-sm">{processedCoffeeQuantity.toLocaleString()} kg</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <Card className="border-blue-100 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-gray-800">
              Chi tiết yêu cầu nhập kho
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filtered.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Package className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium">Không có yêu cầu nhập kho nào</p>
                <p className="text-gray-400 text-sm">Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full table-auto border border-gray-200 rounded-lg text-sm">
                  <thead className="bg-gradient-to-r from-green-50 to-green-100 text-green-800 font-semibold">
                    <tr>
                      <th className="px-4 py-3 text-left border-b border-green-200">Mã yêu cầu</th>
                      <th className="px-4 py-3 text-left border-b border-green-200">Nông dân</th>
                      <th className="px-4 py-3 text-left border-b border-green-200">Loại cà phê</th>
                      <th className="px-4 py-3 text-left border-b border-green-200">Thông tin</th>
                      <th className="px-4 py-3 text-right border-b border-green-200">Số lượng</th>
                      <th className="px-4 py-3 text-left border-b border-green-200">Ngày tạo</th>
                      <th className="px-4 py-3 text-center border-b border-green-200">Trạng thái</th>
                      <th className="px-4 py-3 text-center border-b border-green-200">Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paged.map((req) => {
                      const coffeeType = getCoffeeType(req);
                      const coffeeTypeLabel = getCoffeeTypeLabel(req);
                      const coffeeTypeIcon = getCoffeeTypeIcon(req);

                      // Thông tin hiển thị
                      let displayInfo = '';
                      if (coffeeType === 'fresh') {
                        displayInfo = req.cropSeasonName || req.detailCode || 'N/A';
                      } else if (coffeeType === 'processed' && req.batchCode) {
                        displayInfo = `${req.batchCode} - ${req.coffeeType || 'Đã sơ chế'}`;
                      } else {
                        displayInfo = 'N/A';
                      }

                      return (
                        <tr key={req.inboundRequestId} className="border-b border-gray-100 hover:bg-green-50 transition-colors">
                          <td className="px-4 py-3 font-mono font-semibold text-gray-900">{req.requestCode}</td>
                          <td className="px-4 py-3 text-gray-700">{req.farmerName || 'N/A'}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {coffeeTypeIcon}
                              <span className={`font-medium ${coffeeType === 'fresh' ? 'text-orange-700' :
                                coffeeType === 'processed' ? 'text-purple-700' : 'text-gray-700'
                                }`}>
                                {coffeeTypeLabel}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-700 font-mono text-sm">{displayInfo}</td>
                          <td className="px-4 py-3 text-right font-semibold">
                            {req.requestedQuantity || req.quantity || req.amount || req.requestQuantity || 0} kg
                          </td>
                          <td className="px-4 py-3 text-gray-700">{new Date(req.createdAt).toLocaleDateString("vi-VN")}</td>
                          <td className="px-4 py-3 text-center">{getStatusBadge(req.status)}</td>
                          <td className="px-4 py-3 text-center">
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={() => router.push(`/dashboard/staff/inbounds/${req.inboundRequestId}`)}
                              className="text-blue-600 hover:text-blue-800 border-blue-200 hover:bg-blue-50"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {!loading && filtered.length > 0 && (
              <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200">
                <span className="text-sm text-gray-600">
                  Hiển thị {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)} trong {filtered.length} yêu cầu
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={page === 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="border-green-200 text-green-700 hover:bg-green-50"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  {[...Array(totalPages)].map((_, i) => (
                    <Button
                      key={i}
                      size="sm"
                      onClick={() => setPage(i + 1)}
                      className={page === i + 1 ? 'bg-green-600 text-white' : 'bg-white text-green-600 border border-green-400 hover:bg-green-50'}
                    >
                      {i + 1}
                    </Button>
                  ))}
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={page === totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="border-green-200 text-green-700 hover:bg-green-50"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function InboundRequestListPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <InboundRequestListContent />
    </Suspense>
  );
}
