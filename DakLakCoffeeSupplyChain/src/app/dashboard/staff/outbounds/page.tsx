'use client';

import { useEffect, useState, Suspense } from 'react';
import {
  getAllOutboundRequests,
  acceptOutboundRequest,
  rejectOutboundRequest,
} from '@/lib/api/warehouseOutboundRequest';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, Eye, Check, X, TrendingDown, Clock, CheckCircle, XCircle, Package } from 'lucide-react';
import { toast } from 'sonner';
import { useConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { useTranslation } from 'react-i18next';


function StaffOutboundRequestListContent() {
  const [data, setData] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const pageSize = 4;
  const router = useRouter();
  const searchParams = useSearchParams();
  const { openDialog, ConfirmationDialog } = useConfirmationDialog();
  const { t } = useTranslation();

  useEffect(() => {
    // Lấy status filter từ URL query params
    const statusFromUrl = searchParams.get('status');
    if (statusFromUrl) {
      setStatusFilter(statusFromUrl);
    }
  }, [searchParams]);

  useEffect(() => {
    getAllOutboundRequests()
      .then((res) => {
        if (res.status === 1 && Array.isArray(res.data)) {
          setData(res.data);
        } else {
          toast.error(res.message || 'Dữ liệu không hợp lệ');
        }
      })
      .catch((err) => toast.error('Lỗi khi tải danh sách: ' + err.message))
      .finally(() => setLoading(false));
  }, []);

  const filteredData = data.filter((item) => {
    if (!statusFilter || statusFilter === 'all') return true;

    // Xử lý lọc trạng thái
    if (statusFilter === 'Pending') {
      return item.status === 'Pending' || item.status === 'Processing';
    } else if (statusFilter === 'Accepted') {
      return item.status === 'Accepted' || item.status === 'Approved';
    } else {
      return item.status === statusFilter;
    }
  });

  const totalPages = Math.ceil(filteredData.length / pageSize);
  const pagedData = filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const pendingRequests = filteredData.filter(req => req.status === 'Pending' || req.status === 'Processing');
  const acceptedRequests = filteredData.filter(req => req.status === 'Accepted' || req.status === 'Approved');
  const totalQuantity = filteredData.reduce((sum, req) => sum + (req.requestedQuantity || 0), 0);

  const handleAccept = async (id: string) => {
    openDialog({
      title: t('warehouseOutboundRequests.confirmModal.title'),
      message: t('warehouseOutboundRequests.confirmModal.description'),
      confirmText: t('warehouseOutboundRequests.confirmModal.acceptButton'),
      cancelText: t('warehouseOutboundRequests.confirmModal.cancelButton'),
      type: "info",
      onConfirm: async () => {
        try {
          const result = await acceptOutboundRequest(id);
          if (result.status === 1) {
            toast.success(t('warehouseOutboundRequests.success.acceptSuccess'));
            location.reload();
          } else {
            toast.error(result.message);
          }
        } catch (err: unknown) {
          const errorMessage = err instanceof Error ? err.message : 'Có lỗi xảy ra';
          toast.error(errorMessage);
        }
      }
    });
  };

  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  const handleReject = async (id: string) => {
    setRejectingId(id);
    setRejectReason('');
    setShowRejectInput(true);
  };

  const confirmReject = async () => {
    if (!rejectReason.trim()) {
      toast.error(t('warehouseOutboundRequests.rejectModal.reasonPlaceholder'));
      return;
    }

    if (!rejectingId) return;

    try {
      const result = await rejectOutboundRequest(rejectingId, rejectReason.trim());
      if (result.status === 1) {
        toast.success(t('warehouseOutboundRequests.success.rejectSuccess'));
        setData((prev) =>
          prev.map((item) =>
            item.outboundRequestId === rejectingId
              ? { ...item, status: 'Rejected', rejectReason: rejectReason.trim() }
              : item
          )
        );
        setRejectReason('');
        setShowRejectInput(false);
        setRejectingId(null);
      } else {
        toast.error(result.message);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Có lỗi xảy ra';
      toast.error(errorMessage);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending':
        return <Badge className="bg-yellow-100 text-yellow-800 border border-yellow-200 px-3 py-1 rounded-full">
          <Clock className="w-3 h-3 mr-1" />
          {t('warehouseOutboundRequests.detail.status.pending')}
        </Badge>;
      case 'Accepted':
        return <Badge className="bg-blue-100 text-blue-800 border border-blue-200 px-3 py-1 rounded-full">
          <CheckCircle className="w-3 h-3 mr-1" />
          {t('warehouseOutboundRequests.detail.status.accepted')}
        </Badge>;
      case 'Completed':
        return <Badge className="bg-green-100 text-green-800 border border-green-200 px-3 py-1 rounded-full">
          <CheckCircle className="w-3 h-3 mr-1" />
          {t('warehouseOutboundRequests.detail.status.completed')}
        </Badge>;
      case 'Cancelled':
        return <Badge className="bg-gray-100 text-gray-800 border border-gray-200 px-3 py-1 rounded-full">
          <XCircle className="w-3 h-3 mr-1" />
          {t('warehouseOutboundRequests.detail.status.cancelled')}
        </Badge>;
      case 'Rejected':
        return <Badge className="bg-red-100 text-red-800 border border-red-200 px-3 py-1 rounded-full">
          <XCircle className="w-3 h-3 mr-1" />
          {t('warehouseOutboundRequests.detail.status.rejected')}
        </Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 border border-gray-200 px-3 py-1 rounded-full">
          {status}
        </Badge>;
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-gray-600">{t('warehouseOutboundRequests.loading.title')}</p>
      </div>
    </div>
  );

  if (!data || data.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-6 px-4">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-blue-100 p-6">
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Package className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 font-medium">{t('warehouseOutboundRequests.empty.title')}</p>
              <p className="text-gray-400 text-sm">{t('warehouseOutboundRequests.empty.description')}</p>
            </div>
          </div>
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
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  📤 {t('warehouseOutboundRequests.title')}
                </h1>
                <p className="text-gray-600 text-sm">
                  {t('warehouseOutboundRequests.subtitle')}
                </p>
              </div>
            </div>

            {/* Status Filter */}
            <Select onValueChange={(value) => {
              setStatusFilter(value);
              setCurrentPage(1);
            }} value={statusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t('warehouseOutboundRequests.filters.byStatus.title')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('warehouseOutboundRequests.filters.byStatus.all')}</SelectItem>
                <SelectItem value="Pending">{t('warehouseOutboundRequests.filters.byStatus.pending')}</SelectItem>
                <SelectItem value="Accepted">{t('warehouseOutboundRequests.filters.byStatus.accepted')}</SelectItem>
                <SelectItem value="Completed">{t('warehouseOutboundRequests.filters.byStatus.completed')}</SelectItem>
                <SelectItem value="Cancelled">{t('warehouseOutboundRequests.filters.byStatus.cancelled')}</SelectItem>
                <SelectItem value="Rejected">{t('warehouseOutboundRequests.filters.byStatus.rejected')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-r from-red-500 to-pink-500 rounded-lg p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-sm font-medium">{t('warehouseOutboundRequests.stats.totalRequests')}</p>
                  <p className="text-2xl font-bold">{filteredData.length}</p>
                </div>
                <Package className="w-8 h-8 text-red-200" />
              </div>
            </div>
            <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-100 text-sm font-medium">{t('warehouseOutboundRequests.stats.pendingRequests')}</p>
                  <p className="text-2xl font-bold">{pendingRequests.length}</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-200" />
              </div>
            </div>
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">{t('warehouseOutboundRequests.stats.acceptedRequests')}</p>
                  <p className="text-2xl font-bold">{acceptedRequests.length}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-blue-200" />
              </div>
            </div>
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">{t('warehouseOutboundRequests.stats.totalQuantity')}</p>
                  <p className="text-2xl font-bold">{totalQuantity.toLocaleString()} kg</p>
                </div>
                <TrendingDown className="w-8 h-8 text-purple-200" />
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <Card className="border-blue-100 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-gray-800">
              {t('warehouseOutboundRequests.table.title')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredData.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Package className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium">
                  {statusFilter && statusFilter !== 'all' ? `Không có yêu cầu nào với trạng thái "${statusFilter}"` : 'Không có yêu cầu xuất kho nào'}
                </p>
                <p className="text-gray-400 text-sm">
                  {statusFilter && statusFilter !== 'all' ? 'Thử thay đổi bộ lọc trạng thái' : 'Chưa có yêu cầu nào được tạo'}
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full table-auto border border-gray-200 rounded-lg text-sm bg-white">
                    <thead className="bg-gradient-to-r from-red-50 to-pink-50 text-red-800 font-semibold">
                      <tr>
                        <th className="px-4 py-3 text-left border-b border-red-200">{t('warehouseOutboundRequests.table.headers.requestId')}</th>
                        <th className="px-4 py-3 text-left border-b border-red-200">{t('warehouseOutboundRequests.table.headers.warehouse')}</th>
                        <th className="px-4 py-3 text-left border-b border-red-200">{t('warehouseOutboundRequests.table.headers.inventory')}</th>
                        <th className="px-4 py-3 text-right border-b border-red-200">{t('warehouseOutboundRequests.table.headers.quantity')}</th>
                        <th className="px-4 py-3 text-center border-b border-red-200">{t('warehouseOutboundRequests.table.headers.status')}</th>
                        <th className="px-4 py-3 text-center border-b border-red-200">{t('warehouseOutboundRequests.table.headers.action')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagedData.map((item) => (
                        <tr key={item.outboundRequestId} className="border-b border-gray-100 hover:bg-red-50 transition-colors">
                          <td className="px-4 py-3 font-mono font-semibold text-gray-900">{item.outboundRequestCode}</td>
                          <td className="px-4 py-3 text-gray-700">{item.warehouseName || 'Không rõ'}</td>
                          <td className="px-4 py-3 text-gray-700">{item.productName || 'Cà phê'}</td>
                          <td className="px-4 py-3 text-right font-semibold">
                            {item.requestedQuantity} {item.unit || 'kg'}
                          </td>
                          <td className="px-4 py-3 text-center">{getStatusBadge(item.status)}</td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex justify-center items-center gap-2">
                              <Button
                                size="icon"
                                variant="outline"
                                onClick={() => router.push(`/dashboard/staff/outbounds/${item.outboundRequestId}`)}
                                className="text-blue-600 hover:text-blue-800 border-blue-200 hover:bg-blue-50"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              {item.status === 'Pending' && (
                                <>
                                  <Button
                                    size="icon"
                                    variant="outline"
                                    onClick={() => handleAccept(item.outboundRequestId)}
                                    className="text-green-600 hover:text-green-800 border-green-200 hover:bg-green-50"
                                  >
                                    <Check className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="outline"
                                    onClick={() => handleReject(item.outboundRequestId)}
                                    className="text-red-600 hover:text-red-800 border-red-200 hover:bg-red-50"
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200">
                    <span className="text-sm text-gray-600">
                      Hiển thị {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filteredData.length)} trong {filteredData.length} yêu cầu
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        className="border-red-200 text-red-700 hover:bg-red-50"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      {[...Array(totalPages).keys()].map((_, i) => {
                        const page = i + 1;
                        return (
                          <Button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`rounded-full px-3 py-1 text-sm ${page === currentPage
                              ? 'bg-red-600 text-white'
                              : 'bg-white text-red-600 border border-red-400 hover:bg-red-50'
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
                        className="border-red-200 text-red-700 hover:bg-red-50"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmationDialog />

      {/* Reject Reason Input Modal */}
      {showRejectInput && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowRejectInput(false)} />
          <div className="relative bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Nhập lý do từ chối</h3>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Nhập lý do từ chối..."
              className="w-full p-3 border border-gray-300 rounded-md resize-none mb-4"
              rows={3}
            />
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setShowRejectInput(false)}>
                Hủy
              </Button>
              <Button onClick={confirmReject} className="bg-red-600 hover:bg-red-700">
                Từ chối
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function StaffOutboundRequestList() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <StaffOutboundRequestListContent />
    </Suspense>
  );
}
