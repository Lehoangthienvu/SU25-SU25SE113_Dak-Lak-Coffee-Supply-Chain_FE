'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { Eye, CheckCircle, Clock, Package, TrendingDown, Plus, Receipt, ChevronLeft, ChevronRight } from 'lucide-react';
import { getAllOutboundReceipts, getOutboundReceiptById } from '@/lib/api/warehouseOutboundReceipt';

interface OutboundReceiptItem {
  outboundReceiptId: string;
  outboundReceiptCode: string;
  warehouseName: string;
  batchCode: string;
  quantity: number;
  unit: string;
  note?: string;
}

export default function OutboundReceiptListPage() {
  const [receipts, setReceipts] = useState<OutboundReceiptItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(4); // Tăng từ 10 lên 15 để hiển thị nhiều hơn
  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => {
    const fetchReceiptsWithNote = async () => {
      try {
        // Fetch danh sách ban đầu
        const response = await getAllOutboundReceipts();
        const list = response.data || response;
        if (!Array.isArray(list)) throw new Error('Dữ liệu không hợp lệ');

        // Fetch chi tiết từng phiếu để lấy `note`
        const enriched = await Promise.all(
          list.map(async (r: any) => {
            try {
              const detailResponse = await getOutboundReceiptById(r.outboundReceiptId);
              const detail = detailResponse.data || detailResponse;
              return { ...r, note: detail.note };
            } catch {
              return r;
            }
          })
        );

        setReceipts(enriched);
      } catch (err: any) {
        toast.error(t('warehouseOutboundReceipts.error.loadFailed') + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchReceiptsWithNote();
  }, []);

  const confirmedReceipts = receipts.filter(r => r.note?.includes('[CONFIRMED:'));
  const pendingReceipts = receipts.filter(r => !r.note?.includes('[CONFIRMED:'));
  const totalQuantity = receipts.reduce((sum, r) => sum + (r.quantity || 0), 0);

  // Phân trang
  const totalPages = Math.ceil(receipts.length / pageSize);
  const pagedReceipts = receipts.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-gray-600">{t('warehouseOutboundReceipts.loading.title')}</p>
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
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  📤 {t('warehouseOutboundReceipts.title')}
                </h1>
                <p className="text-gray-600 text-sm">
                  {t('warehouseOutboundReceipts.subtitle')}
                </p>
              </div>
            </div>
            <Button
              className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white shadow-sm"
              onClick={() => router.push('/dashboard/staff/outbound-receipts/create')}
            >
              <Plus className="w-4 h-4 mr-2" />
              {t('warehouseOutboundReceipts.createNewReceipt')}
            </Button>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-r from-red-500 to-pink-500 rounded-lg p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-sm font-medium">{t('warehouseOutboundReceipts.stats.totalReceipts')}</p>
                  <p className="text-2xl font-bold">{receipts.length}</p>
                </div>
                <Receipt className="w-8 h-8 text-red-200" />
              </div>
            </div>
            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white">
              <div className="flex items-center justify-between">
                                 <div>
                   <p className="text-green-100 text-sm font-medium">{t('warehouseOutboundReceipts.stats.readyForDelivery')}</p>
                   <p className="text-2xl font-bold">{confirmedReceipts.length}</p>
                 </div>
                <Package className="w-8 h-8 text-green-200" />
              </div>
            </div>
            <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-100 text-sm font-medium">{t('warehouseOutboundReceipts.stats.totalQuantity')}</p>
                  <p className="text-2xl font-bold">{totalQuantity.toLocaleString()} kg</p>
                </div>
                <TrendingDown className="w-8 h-8 text-yellow-200" />
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <Card className="border-blue-100 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-gray-800">
              {t('warehouseOutboundReceipts.table.title')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {receipts.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Receipt className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium">{t('warehouseOutboundReceipts.empty.title')}</p>
                <p className="text-gray-400 text-sm">{t('warehouseOutboundReceipts.empty.description')}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border border-gray-200 rounded-lg bg-white">
                  <thead className="bg-gradient-to-r from-red-50 to-pink-50 text-red-800 font-semibold">
                    <tr>
                      <th className="px-4 py-3 text-left border-b border-red-200">{t('warehouseOutboundReceipts.table.headers.receiptId')}</th>
                      <th className="px-4 py-3 text-left border-b border-red-200">{t('warehouseOutboundReceipts.table.headers.warehouse')}</th>
                      <th className="px-4 py-3 text-left border-b border-red-200">{t('warehouseOutboundReceipts.table.headers.batch')}</th>
                      <th className="px-4 py-3 text-right border-b border-red-200">{t('warehouseOutboundReceipts.table.headers.quantity')}</th>
                      <th className="px-4 py-3 text-center border-b border-red-200">{t('warehouseOutboundReceipts.table.headers.status')}</th>
                      <th className="px-4 py-3 text-center border-b border-red-200">{t('warehouseOutboundReceipts.table.headers.action')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedReceipts.map((r) => {
                      const isConfirmed = r.note?.includes('[CONFIRMED:');
                      const isCompleted = r.note?.includes('[COMPLETED:');
                      
                      return (
                        <tr key={r.outboundReceiptId} className="border-b border-gray-100 hover:bg-red-50 transition-colors">
                          <td className="px-4 py-3 font-mono font-semibold text-gray-900">{r.outboundReceiptCode}</td>
                          <td className="px-4 py-3 text-gray-700">{r.warehouseName}</td>
                          <td className="px-4 py-3 text-gray-700 font-mono text-sm">{r.batchCode}</td>
                          <td className="px-4 py-3 text-right font-semibold">{r.quantity} {r.unit || 'kg'}</td>
                          <td className="px-4 py-3 text-center">
                            {isCompleted ? (
                              <Badge className="bg-green-100 text-green-800 border border-green-200 px-3 py-1 rounded-full">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                {t('warehouseOutboundReceipts.detail.status.completed')}
                              </Badge>
                            ) : isConfirmed ? (
                              <Badge className="bg-blue-100 text-blue-800 border border-blue-200 px-3 py-1 rounded-full">
                                <Package className="w-3 h-3 mr-1" />
                                {t('warehouseOutboundReceipts.detail.status.readyForDelivery')}
                              </Badge>
                            ) : (
                              <Badge className="bg-yellow-100 text-yellow-800 border border-yellow-200 px-3 py-1 rounded-full">
                                <Clock className="w-3 h-3 mr-1" />
                                {t('warehouseOutboundReceipts.detail.status.pending')}
                              </Badge>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={() => router.push(`/dashboard/staff/outbound-receipts/${r.outboundReceiptId}`)}
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
            {receipts.length > 0 && (
              <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200">
                <span className="text-sm text-gray-600">
                  {t('warehouseOutboundReceipts.table.summary', { 
                    count: pagedReceipts.length, 
                    total: receipts.length 
                  })}
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
                        className={`rounded-full px-3 py-1 text-sm ${
                          page === currentPage
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
