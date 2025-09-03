"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuthGuard } from "@/lib/auth/useAuthGuard";
import { useTranslation } from "react-i18next";
import { getAllInboundRequests } from "@/lib/api/warehouseInboundRequest";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, Package, Clock, CheckCircle, TrendingUp, ChevronLeft, ChevronRight, Search, Filter } from "lucide-react";
import Link from "next/link";

interface InboundRequestItem {
  inboundRequestId: string;
  inboundCode: string;
  status: string;
  farmerName: string;
  batchCode?: string;
  coffeeTypeName?: string;
  preferredDeliveryDate: string;
  requestedQuantity: number;
  createdAt: string;
  businessStaffName?: string; // ✅ THÊM: Người cập nhật (duyệt/từ chối)
}

const statusBadge = (status: string, t: any) => {
  const s = (status || "").toLowerCase();
  if (s === "pending") return <Badge className="bg-yellow-100 text-yellow-800 border border-yellow-200">{t('inboundRequests.status.pending')}</Badge>;
  if (s === "approved") return <Badge className="bg-blue-100 text-blue-800 border border-blue-200">{t('inboundRequests.status.approved')}</Badge>;
  if (s === "completed") return <Badge className="bg-green-100 text-green-800 border border-green-200">{t('inboundRequests.status.completed')}</Badge>;
  if (s === "rejected") return <Badge className="bg-red-100 text-red-800 border border-red-200">{t('inboundRequests.status.rejected')}</Badge>;
  if (s === "cancelled") return <Badge className="bg-gray-100 text-gray-700 border border-gray-200">{t('inboundRequests.status.cancelled')}</Badge>;
  return <Badge className="bg-gray-100 text-gray-700 border border-gray-200">{status}</Badge>;
};

export default function ManagerInboundRequestsPage() {
  useAuthGuard(["manager"]);
  const { t } = useTranslation();

  const [items, setItems] = useState<InboundRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await getAllInboundRequests();
        const data = Array.isArray(res) ? res : res?.data;
        setItems(Array.isArray(data) ? (data as InboundRequestItem[]) : []);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = useMemo(() => {
    return items.filter((r) => {
      const matchStatus = status === "all" || (r.status || "").toLowerCase() === status;
      const text = `${r.farmerName} ${r.batchCode ?? ""}`.toLowerCase(); // ✅ BỎ: coffeeTypeName khỏi search
      const matchSearch = !search || text.includes(search.toLowerCase());
      return matchStatus && matchSearch;
    });
  }, [items, status, search]);

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const pageSlice = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const pendingCount = filtered.filter((x) => (x.status || "").toLowerCase() === "pending").length;
  const approvedCount = filtered.filter((x) => (x.status || "").toLowerCase() === "approved").length;
  const totalQuantity = filtered.reduce((sum, x) => sum + (Number(x.requestedQuantity) || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-6 px-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-blue-100 p-6">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">{t('inboundRequests.title')}</h1>
                <p className="text-gray-600 text-sm">{t('inboundRequests.subtitle')}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg">
                <Filter className="w-4 h-4 text-blue-600" />
                <Select value={status} onValueChange={(v) => { setStatus(v); setCurrentPage(1); }}>
                  <SelectTrigger className="w-[140px] border-0 bg-transparent">
                    <SelectValue placeholder={t('inboundRequests.filters.status')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('inboundRequests.filters.all')}</SelectItem>
                    <SelectItem value="pending">{t('inboundRequests.filters.pending')}</SelectItem>
                    <SelectItem value="approved">{t('inboundRequests.filters.approved')}</SelectItem>
                    <SelectItem value="completed">{t('inboundRequests.filters.completed')}</SelectItem>
                    <SelectItem value="rejected">{t('inboundRequests.filters.rejected')}</SelectItem>
                    <SelectItem value="cancelled">{t('inboundRequests.filters.cancelled')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input 
                  placeholder={t('inboundRequests.search.placeholder')} 
                  value={search} 
                  onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} 
                  className="pl-10 w-80 border-blue-200 focus:border-blue-400 focus:ring-blue-400"
                />
              </div>

              <Button 
                onClick={() => window.location.reload()} 
                variant="outline" 
                size="sm"
                className="border-blue-200 text-blue-700 hover:bg-blue-50"
              >
                {t('inboundRequests.actions.refresh')}
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">{t('inboundRequests.stats.totalRequests')}</p>
                  <p className="text-2xl font-bold">{filtered.length}</p>
                </div>
                <Package className="w-8 h-8 text-blue-200" />
              </div>
            </div>
            <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-100 text-sm font-medium">{t('inboundRequests.stats.pending')}</p>
                  <p className="text-2xl font-bold">{pendingCount}</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-200" />
              </div>
            </div>
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">{t('inboundRequests.stats.approved')}</p>
                  <p className="text-2xl font-bold">{approvedCount}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-blue-200" />
              </div>
            </div>
            <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-lg p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-100 text-sm font-medium">{t('inboundRequests.stats.totalQuantity')}</p>
                  <p className="text-2xl font-bold">{totalQuantity.toLocaleString()} kg</p>
                </div>
                <TrendingUp className="w-8 h-8 text-emerald-200" />
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <Card className="border-blue-100 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-gray-800">{t('inboundRequests.table.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-10 text-gray-500">{t('inboundRequests.table.loading')}</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-10 text-gray-500">{t('inboundRequests.table.noData')}</div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full table-auto border border-gray-200 rounded-lg text-sm bg-white">
                    <thead className="bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-800 font-semibold">
                      <tr>
                        <th className="px-4 py-3 text-left border-b border-blue-200">{t('inboundRequests.table.columns.farmer')}</th>
                        <th className="px-4 py-3 text-left border-b border-blue-200">{t('inboundRequests.table.columns.batch')}</th>
                        <th className="px-4 py-3 text-right border-b border-blue-200">{t('inboundRequests.table.columns.quantity')}</th>
                        <th className="px-4 py-3 text-center border-b border-blue-200">{t('inboundRequests.table.columns.status')}</th>
                        <th className="px-4 py-3 text-center border-b border-blue-200">{t('inboundRequests.table.columns.updatedBy')}</th>
                        <th className="px-4 py-3 text-center border-b border-blue-200">{t('inboundRequests.table.columns.view')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pageSlice.map((r) => (
                        <tr key={r.inboundRequestId} className="border-b border-gray-100 hover:bg-blue-50 transition-colors">
                          <td className="px-4 py-3 font-medium text-gray-900">{r.farmerName}</td>
                          <td className="px-4 py-3 text-gray-700 font-mono">{r.batchCode || "-"}</td>
                          <td className="px-4 py-3 text-right font-semibold text-blue-600">{Number(r.requestedQuantity || 0).toLocaleString()}</td>
                          <td className="px-4 py-3 text-center">{statusBadge(r.status, t)}</td>
                          <td className="px-4 py-3 text-center">
                            {r.businessStaffName ? (
                              <span className="text-sm text-gray-700 font-medium">{r.businessStaffName}</span>
                            ) : (
                              <span className="text-sm text-gray-400 italic">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Link href={`/dashboard/manager/inbound-requests/${r.inboundRequestId}`}>
                              <Button size="icon" variant="outline" className="text-blue-600 hover:text-blue-800 border-blue-200 hover:bg-blue-50">
                                <Eye className="w-4 h-4" />
                              </Button>
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {totalPages > 1 && (
                  <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200">
                    <span className="text-sm text-gray-600">
                      {t('inboundRequests.pagination.info', {
                        start: (currentPage - 1) * pageSize + 1,
                        end: Math.min(currentPage * pageSize, filtered.length),
                        total: filtered.length
                      })}
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        className="border-blue-200 text-blue-700 hover:bg-blue-50"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      {[...Array(totalPages).keys()].map((_, i) => {
                        const page = i + 1;
                        return (
                          <Button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`rounded-full px-3 py-1 text-sm ${page === currentPage ? "bg-blue-600 text-white" : "bg-white text-blue-600 border border-blue-400 hover:bg-blue-50"}`}
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
                        className="border-blue-200 text-blue-700 hover:bg-blue-50"
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
    </div>
  );
}
