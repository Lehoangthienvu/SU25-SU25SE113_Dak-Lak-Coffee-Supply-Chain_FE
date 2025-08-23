'use client';

import { useEffect, useState } from 'react';
import { getAllWarehouseReceipts, getDebugInfo, cancelWarehouseReceipt } from '@/lib/api/warehouseReceipt';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, Search, ChevronLeft, ChevronRight, Package, TrendingUp, CheckCircle, Clock, Plus, Leaf, Coffee, X, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

export default function ReceiptListPage() {
  const [receipts, setReceipts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [coffeeTypeFilter, setCoffeeTypeFilter] = useState<string>('all'); // 'all', 'processed', 'fresh'
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const pageSize = 15;
  
  // State cho modal hủy phiếu
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [receiptToCancel, setReceiptToCancel] = useState<any>(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await getAllWarehouseReceipts();
        if (res.status === 1) {
          const data = Array.isArray(res.data) ? res.data : [];
          // Debug logs removed for performance
          setReceipts(data);
        } else {
          toast.error(res.message || 'Không thể tải danh sách phiếu nhập kho');
        }
      } catch {
        toast.error('Lỗi khi tải dữ liệu từ server.');
      } finally {
        setLoading(false);
      }
    })();

    // Debug call - REMOVED for performance
  }, []);

  // Helper function to determine coffee type
  const getCoffeeType = (receipt: any) => {
    // Cà phê đã sơ chế: có batchId, không có detailId
    if (receipt.batchId && !receipt.detailId) return 'processed';
    // Cà phê tươi: không có batchId, có detailId
    if (!receipt.batchId && receipt.detailId) return 'fresh';
    return 'unknown';
  };

  const getCoffeeTypeLabel = (receipt: any) => {
    const type = getCoffeeType(receipt);
    switch (type) {
      case 'fresh': return 'Cà phê tươi';
      case 'processed': return 'Cà phê đã sơ chế';
      default: return 'Không xác định';
    }
  };

  const getCoffeeTypeIcon = (receipt: any) => {
    const type = getCoffeeType(receipt);
    switch (type) {
      case 'fresh': return <Leaf className="w-4 h-4 text-orange-600" />;
      case 'processed': return <Coffee className="w-4 h-4 text-purple-600" />;
      default: return <Package className="w-4 h-4 text-gray-600" />;
    }
  };

  // Helper function to get coffee information
  // Function xử lý hủy phiếu
  const handleCancelReceipt = async () => {
    if (!receiptToCancel) return;
    
    setCancelling(true);
    try {
      const res = await cancelWarehouseReceipt(receiptToCancel.receiptId);
      
      if (res.status === 1) {
        toast.success('Hủy phiếu nhập kho thành công!');
        // Cập nhật danh sách - xóa phiếu đã hủy
        setReceipts(prev => prev.filter(r => r.receiptId !== receiptToCancel.receiptId));
        setShowCancelModal(false);
        setReceiptToCancel(null);
      } else {
        toast.error(res.message || 'Không thể hủy phiếu nhập kho');
      }
    } catch (error) {
      toast.error('Lỗi khi hủy phiếu nhập kho');
    } finally {
      setCancelling(false);
    }
  };

  const openCancelModal = (receipt: any) => {
    setReceiptToCancel(receipt);
    setShowCancelModal(true);
  };

  const getCoffeeInfo = (receipt: any) => {
    if (receipt.batchId && !receipt.detailId) {
      // Cà phê sơ chế
      return {
        type: 'processed',
        label: 'Cà phê đã sơ chế',
        info: receipt.batchCode || 'N/A',
        icon: <Coffee className="w-4 h-4 text-purple-600" />
      };
    } else if (!receipt.batchId && receipt.detailId) {
      // Cà phê tươi
      return {
        type: 'fresh',
        label: 'Cà phê tươi',
        info: receipt.cropSeasonName || receipt.detailCode || 'N/A',
        icon: <Leaf className="w-4 h-4 text-orange-600" />
      };
    } else {
      return {
        type: 'unknown',
        label: 'Không xác định',
        info: 'N/A',
        icon: <Package className="w-4 h-4 text-gray-600" />
      };
    }
  };

  const filtered = receipts.filter((r) => {
    const matchesSearch = 
      r.receiptCode?.toLowerCase().includes(search.toLowerCase()) ||
      r.warehouseName?.toLowerCase().includes(search.toLowerCase()) ||
      r.batchCode?.toLowerCase().includes(search.toLowerCase()) ||
      r.cropSeasonName?.toLowerCase().includes(search.toLowerCase()) ||
      r.detailCode?.toLowerCase().includes(search.toLowerCase()) ||
      r.coffeeType?.toLowerCase().includes(search.toLowerCase());

    const matchesType = 
      coffeeTypeFilter === 'all' || 
      getCoffeeType(r) === coffeeTypeFilter;

    return matchesSearch && matchesType;
  });

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const confirmedReceipts = filtered.filter(r => r?.note?.toLowerCase().includes('confirmed at'));
  const pendingReceipts = filtered.filter(r => !r?.note?.toLowerCase().includes('confirmed at'));
  const totalQuantity = filtered.reduce((sum, r) => sum + (r.receivedQuantity || 0), 0);

  // Thống kê theo loại cà phê
  const freshCoffeeReceipts = filtered.filter(r => getCoffeeType(r) === 'fresh');
  const processedCoffeeReceipts = filtered.filter(r => getCoffeeType(r) === 'processed');
  const freshCoffeeQuantity = freshCoffeeReceipts.reduce((sum, r) => sum + (r.receivedQuantity || 0), 0);
  const processedCoffeeQuantity = processedCoffeeReceipts.reduce((sum, r) => sum + (r.receivedQuantity || 0), 0);

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-gray-600">Đang tải danh sách phiếu nhập kho...</p>
      </div>
    </div>
  );

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
                  📥 Phiếu nhập kho
                </h1>
                <p className="text-gray-600 text-sm">
                  Quản lý và theo dõi các phiếu nhập kho đã được duyệt
                </p>
              </div>
            </div>
            <div className="flex gap-2 items-center relative">
              <Input
                placeholder="Tìm mã phiếu, kho, lô..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-72 pr-10 border-blue-200 focus:ring-blue-400 focus:border-blue-400"
              />
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-400 w-4 h-4" />
              <Link href="/dashboard/staff/receipts/create">
                <Button className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Tạo mới
                </Button>
              </Link>
            </div>
          </div>

          {/* Filter Panel */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-700">Lọc theo loại cà phê:</span>
              <Select value={coffeeTypeFilter} onValueChange={(value) => {
                setCoffeeTypeFilter(value);
                setPage(1);
              }}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Chọn loại cà phê" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả ({filtered.length})</SelectItem>
                  <SelectItem value="fresh">
                    <div className="flex items-center gap-2">
                      <Leaf className="w-4 h-4 text-orange-600" />
                      Cà phê tươi ({freshCoffeeReceipts.length})
                    </div>
                  </SelectItem>
                  <SelectItem value="processed">
                    <div className="flex items-center gap-2">
                      <Coffee className="w-4 h-4 text-purple-600" />
                      Cà phê đã sơ chế ({processedCoffeeReceipts.length})
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Tổng phiếu</p>
                  <p className="text-2xl font-bold">{filtered.length}</p>
                </div>
                <Package className="w-8 h-8 text-green-200" />
              </div>
            </div>
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Đã xác nhận</p>
                  <p className="text-2xl font-bold">{confirmedReceipts.length}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-blue-200" />
              </div>
            </div>
            <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-100 text-sm font-medium">Chưa xác nhận</p>
                  <p className="text-2xl font-bold">{pendingReceipts.length}</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-200" />
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
                  <p className="text-xl font-bold">{freshCoffeeReceipts.length} phiếu</p>
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
                  <p className="text-xl font-bold">{processedCoffeeReceipts.length} phiếu</p>
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
              Chi tiết phiếu nhập kho
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filtered.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Package className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium">Không có phiếu nhập kho nào</p>
                <p className="text-gray-400 text-sm">Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full table-auto border border-gray-200 rounded-lg text-sm bg-white">
                  <thead className="bg-gradient-to-r from-green-50 to-green-100 text-green-800 font-semibold">
                    <tr>
                      <th className="px-4 py-3 text-left border-b border-green-200">Mã phiếu</th>
                      <th className="px-4 py-3 text-left border-b border-green-200">Kho</th>
                      <th className="px-4 py-3 text-left border-b border-green-200">Loại cà phê</th>
                      <th className="px-4 py-3 text-left border-b border-green-200">Thông tin</th>
                      <th className="px-4 py-3 text-right border-b border-green-200">Số lượng</th>
                      <th className="px-4 py-3 text-center border-b border-green-200">Trạng thái</th>
                      <th className="px-4 py-3 text-center border-b border-green-200">Xem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paged.map((r) => {
                      const isConfirmed = r?.note?.toLowerCase().includes('confirmed at');
                      const quantity = r.receivedQuantity || r.quantity || r.requestedQuantity || 0;
                      const coffeeInfo = getCoffeeInfo(r);
                      
                      // Thông tin hiển thị
                      let displayInfo = '';
                      if (coffeeInfo.type === 'fresh') {
                        displayInfo = r.cropSeasonName || r.detailCode || 'N/A';
                      } else if (coffeeInfo.type === 'processed') {
                        displayInfo = r.batchCode || 'N/A';
                      } else {
                        displayInfo = 'N/A';
                      }

                      return (
                        <tr key={r.receiptId} className="border-b border-gray-100 hover:bg-green-50 transition-colors">
                          <td className="px-4 py-3 font-mono font-semibold text-gray-900">{r.receiptCode}</td>
                          <td className="px-4 py-3 text-gray-700">{r.warehouseName}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {coffeeInfo.icon}
                              <span className={`font-medium ${
                                coffeeInfo.type === 'fresh' ? 'text-orange-700' : 
                                coffeeInfo.type === 'processed' ? 'text-purple-700' : 'text-gray-700'
                              }`}>
                                {coffeeInfo.label}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-700 font-mono text-sm">{displayInfo}</td>
                          <td className="px-4 py-3 text-right font-semibold">
                            {quantity > 0 ? `${quantity.toLocaleString()} kg` : 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {isConfirmed ? (
                              <Badge className="bg-green-100 text-green-800 border border-green-200 px-3 py-1 rounded-full">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Đã xác nhận
                              </Badge>
                            ) : (
                              <Badge className="bg-yellow-100 text-yellow-800 border border-yellow-200 px-3 py-1 rounded-full">
                                <Clock className="w-3 h-3 mr-1" />
                                Chưa xác nhận
                              </Badge>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <Link href={`/dashboard/staff/receipts/${r.receiptId}`}>
                                <Button
                                  size="icon"
                                  variant="outline"
                                  className="text-blue-600 hover:text-blue-800 border-blue-200 hover:bg-blue-50"
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </Link>
                              
                              {/* Chỉ hiển thị nút hủy cho phiếu chưa xác nhận */}
                              {!isConfirmed && (
                                <Button
                                  size="icon"
                                  variant="outline"
                                  onClick={() => openCancelModal(r)}
                                  className="text-red-600 hover:text-red-800 border-red-200 hover:bg-red-50"
                                  title="Hủy phiếu"
                                >
                                  <X className="w-4 h-4" />
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
            {filtered.length > 0 && (
              <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200">
                <span className="text-sm text-gray-600">
                  Hiển thị {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)} trong {filtered.length} phiếu
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

      {/* Modal xác nhận hủy phiếu */}
      {showCancelModal && receiptToCancel && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-full">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Xác nhận hủy phiếu</h3>
                <p className="text-sm text-gray-600">Bạn có chắc chắn muốn hủy phiếu này?</p>
              </div>
            </div>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="text-sm text-red-800">
                <p className="font-medium mb-2">Thông tin phiếu:</p>
                <p><span className="font-medium">Mã phiếu:</span> {receiptToCancel.receiptCode}</p>
                <p><span className="font-medium">Kho:</span> {receiptToCancel.warehouseName}</p>
                <p><span className="font-medium">Loại:</span> {getCoffeeTypeLabel(receiptToCancel)}</p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCancelModal(false);
                  setReceiptToCancel(null);
                }}
                className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
                disabled={cancelling}
              >
                Hủy bỏ
              </Button>
              <Button
                onClick={handleCancelReceipt}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                disabled={cancelling}
              >
                {cancelling ? 'Đang hủy...' : 'Xác nhận hủy'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
