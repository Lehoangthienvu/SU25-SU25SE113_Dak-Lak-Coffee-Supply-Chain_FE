"use client";

import { useEffect, useState } from "react";
import {
  getAllOutboundRequests,
  cancelOutboundRequest,
} from "@/lib/api/warehouseOutboundRequest";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  XCircle,
  Plus,
  Search,
  Package,
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import Link from "next/link";
import { useTranslation } from 'react-i18next';

export default function ManagerOutboundRequestList() {
  const { t } = useTranslation();
  const [data, setData] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const pageSize = 10;
  const router = useRouter();

  useEffect(() => {
    getAllOutboundRequests()
      .then((res) => {
        if (res.status === 1 && Array.isArray(res.data)) {
          console.log('Outbound requests data:', res.data); // Debug log
          setData(res.data);
        } else {
          toast.error(res.message || t('managerWarehouseRequest.error.invalidData'));
        }
      })
      .catch((err) => toast.error(t('managerWarehouseRequest.error.loadRequests') + ": " + err.message))
      .finally(() => setLoading(false));
  }, [t]);

  const handleCancel = async (id: string) => {
    const confirm = window.confirm(t('managerWarehouseRequest.confirmation.cancelMessage'));
    if (!confirm) return;

    try {
      const result = await cancelOutboundRequest(id);
      toast(result.message);
      if (result.status === 1) {
        setData((prev) => prev.filter((r) => r.outboundRequestId !== id));
      }
    } catch (err: any) {
      toast.error(t('managerWarehouseRequest.error.cancelRequest') + ": " + err.message);
    }
  };

  const filtered = data.filter((item) =>
    item.outboundRequestCode.toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.ceil(filtered.length / pageSize);
  const paged = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Tính toán thống kê
  const totalRequests = data.length;
  const pendingCount = data.filter(item => item.status === "Pending").length;
  const approvedCount = data.filter(item => item.status === "Approved" || item.status === "Accepted").length;
  const completedCount = data.filter(item => item.status === "Completed").length;
  const cancelledCount = data.filter(item => item.status === "Cancelled" || item.status === "Rejected").length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Approved":
      case "Accepted":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Rejected":
        return "bg-red-100 text-red-800 border-red-200";
      case "Cancelled":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "Completed":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "Pending":
        return t('managerWarehouseRequest.status.pending');
      case "Approved":
      case "Accepted":
        return t('managerWarehouseRequest.status.approved');
      case "Rejected":
        return t('managerWarehouseRequest.status.rejected');
      case "Cancelled":
        return t('managerWarehouseRequest.status.cancelled');
      case "Completed":
        return t('managerWarehouseRequest.status.completed');
      default:
        return status;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 p-6 space-y-6">
      {/* Header với gradient */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-600 rounded-2xl p-4 text-white shadow-lg">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-bold">{t('managerWarehouseRequest.title')}</h1>
        </div>
        <p className="text-orange-100 text-base">{t('managerWarehouseRequest.subtitle')}</p>
      </div>

      {/* Thống kê tổng quan */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-white shadow-md hover:shadow-lg transition-shadow border-0">
          <CardContent className="p-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600 font-medium">{t('managerWarehouseRequest.stats.totalRequests')}</p>
                <p className="text-xl font-bold text-orange-600">{totalRequests}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-md hover:shadow-lg transition-shadow border-0">
          <CardContent className="p-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600 font-medium">{t('managerWarehouseRequest.stats.pendingRequests')}</p>
                <p className="text-xl font-bold text-yellow-600">{pendingCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-md hover:shadow-lg transition-shadow border-0">
          <CardContent className="p-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600 font-medium">{t('managerWarehouseRequest.stats.approvedRequests')}</p>
                <p className="text-xl font-bold text-blue-600">{approvedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-md hover:shadow-lg transition-shadow border-0">
          <CardContent className="p-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600 font-medium">{t('managerWarehouseRequest.stats.completedRequests')}</p>
                <p className="text-xl font-bold text-green-600">{completedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-md hover:shadow-lg transition-shadow border-0">
          <CardContent className="p-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600 font-medium">{t('managerWarehouseRequest.stats.cancelledRequests')}</p>
                <p className="text-xl font-bold text-red-600">{cancelledCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Thanh tìm kiếm và tạo mới */}
      <Card className="bg-white shadow-md border-0">
        <CardContent className="p-3">
          <div className="flex flex-wrap justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Input
                  placeholder={t('managerWarehouseRequest.placeholders.search')}
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-72 pr-10 border-orange-200 focus:border-orange-400 focus:ring-orange-400 text-sm"
                />
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-orange-400" />
              </div>
              {search && (
                <Badge variant="secondary" className="bg-orange-100 text-orange-800 text-xs">
                  {filtered.length} {t('managerWarehouseRequest.search.results')}
                </Badge>
              )}
            </div>
                          <Link href="/dashboard/manager/warehouse-request/create">
                <Button className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 text-sm px-4 py-2">
                  <Plus className="w-4 h-4 mr-2" />
                  {t('managerWarehouseRequest.actions.createNew')}
                </Button>
              </Link>
          </div>
        </CardContent>
      </Card>

      {/* Bảng yêu cầu xuất kho */}
      <Card className="bg-white shadow-lg border-0 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 border-b border-orange-100">
          <CardTitle className="text-lg font-bold text-orange-800 flex items-center gap-2">
            <Package className="w-4 h-4" />
            {t('managerWarehouseRequest.sections.requestList')}
          </CardTitle>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-600 mx-auto mb-3"></div>
              <p className="text-gray-600 text-base">{t('managerWarehouseRequest.loading.loadingData')}</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-6 text-center">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-base">{t('managerWarehouseRequest.empty.noRequests')}</p>
              <p className="text-gray-400 text-sm">{t('managerWarehouseRequest.empty.noRequestsYet')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-orange-50 to-amber-50">
                  <tr>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-orange-800">{t('managerWarehouseRequest.fields.requestCode')}</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-orange-800">{t('managerWarehouseRequest.fields.warehouse')}</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-orange-800">{t('managerWarehouseRequest.fields.quantity')}</th>
                    <th className="text-center px-4 py-3 text-sm font-semibold text-orange-800">{t('managerWarehouseRequest.fields.status')}</th>
                    <th className="text-center px-4 py-3 text-sm font-semibold text-orange-800">{t('managerWarehouseRequest.fields.actions')}</th>
                  </tr>
                </thead>
                                 <tbody className="divide-y divide-gray-100">
                   {paged.map((item, index) => {
                     // Debug log for first item
                     if (index === 0) {
                       console.log('First item structure:', item);
                       console.log('Warehouse fields:', {
                         warehouseName: item.warehouseName,
                         'warehouse.name': item.warehouse?.name,
                         'warehouse.warehouseName': item.warehouse?.warehouseName
                       });
                     }
                     
                     return (
                       <tr key={item.outboundRequestId} className={`hover:bg-orange-50 transition-colors ${
                         index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                       }`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-orange-100 rounded-lg flex items-center justify-center">
                            <Package className="w-3 h-3 text-orange-600" />
                          </div>
                          <span className="font-mono text-xs font-medium text-gray-900">{item.outboundRequestCode}</span>
                        </div>
                      </td>
                                             <td className="px-4 py-3">
                         <div className="flex items-center gap-2">
                           <div className="w-5 h-5 bg-orange-100 rounded-lg flex items-center justify-center">
                             <Package className="w-2.5 h-2.5 text-orange-600" />
                           </div>
                           <span className="text-xs text-gray-700 max-w-[200px] truncate" title={item.warehouseName || item.warehouse?.name || item.warehouse?.warehouseName || t('common.notAvailable')}>
                             {item.warehouseName || item.warehouse?.name || item.warehouse?.warehouseName || t('common.notAvailable')}
                           </span>
                         </div>
                       </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="font-mono text-xs">
                          {item.requestedQuantity} {item.unit}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge
                          className={`capitalize px-2 py-1 rounded-full font-medium text-xs border ${getStatusColor(
                            item.status
                          )}`}
                        >
                          {getStatusLabel(item.status)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex justify-center gap-2">
                          <Button
                            size="icon"
                            variant="outline"
                            className="w-7 h-7 hover:bg-orange-50 hover:border-orange-300"
                            onClick={() =>
                              router.push(
                                `/dashboard/manager/warehouse-request/${item.outboundRequestId}`
                              )
                            }
                          >
                            <Eye className="w-3 h-3 text-orange-600" />
                          </Button>
                          {item.status === "Pending" && (
                            <Button
                              size="icon"
                              variant="outline"
                              className="w-7 h-7 hover:bg-red-50 hover:border-red-300"
                              onClick={() => handleCancel(item.outboundRequestId)}
                            >
                              <XCircle className="w-3 h-3 text-red-600" />
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
        </CardContent>
      </Card>

      {/* Phân trang */}
      {!loading && filtered.length > 0 && (
        <Card className="bg-white shadow-md border-0">
          <CardContent className="p-3">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <span className="text-xs text-gray-600">
                {t('managerWarehouseRequest.pagination.showing')} {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filtered.length)} {t('managerWarehouseRequest.pagination.of')} {filtered.length} {t('managerWarehouseRequest.pagination.requests')}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="w-7 h-7 hover:bg-orange-50 hover:border-orange-300"
                >
                  <ChevronLeft className="w-3 h-3" />
                </Button>
                
                {[...Array(totalPages).keys()].map((_, i) => {
                  const page = i + 1;
                  return (
                    <Button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-7 h-7 text-xs rounded-lg transition-all ${
                        page === currentPage
                          ? "bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-lg"
                          : "bg-white text-gray-700 border border-gray-200 hover:bg-orange-50 hover:border-orange-300"
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
                  className="w-7 h-7 hover:bg-orange-50 hover:border-orange-300"
                >
                  <ChevronRight className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
