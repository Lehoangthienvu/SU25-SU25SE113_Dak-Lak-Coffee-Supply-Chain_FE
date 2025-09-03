"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuthGuard } from "@/lib/auth/useAuthGuard";
import { getAllInboundRequests } from "@/lib/api/warehouseInboundRequest";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, Package, Clock, CheckCircle, TrendingUp, ChevronLeft, ChevronRight } from "lucide-react";
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
}

const statusBadge = (status: string) => {
  const s = (status || "").toLowerCase();
  if (s === "pending") return <Badge className="bg-yellow-100 text-yellow-800 border border-yellow-200">Chờ duyệt</Badge>;
  if (s === "approved") return <Badge className="bg-blue-100 text-blue-800 border border-blue-200">Đã duyệt</Badge>;
  if (s === "completed") return <Badge className="bg-green-100 text-green-800 border border-green-200">Đã nhập kho</Badge>;
  if (s === "rejected") return <Badge className="bg-red-100 text-red-800 border border-red-200">Từ chối</Badge>;
  if (s === "cancelled") return <Badge className="bg-gray-100 text-gray-700 border border-gray-200">Đã hủy</Badge>;
  return <Badge className="bg-gray-100 text-gray-700 border border-gray-200">{status}</Badge>;
};

export default function ManagerInboundRequestsPage() {
  useAuthGuard(["manager"]);

  const [items, setItems] = useState<InboundRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

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
      const text = `${r.inboundCode} ${r.farmerName} ${r.batchCode ?? ""} ${r.coffeeTypeName ?? ""}`.toLowerCase();
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
                <h1 className="text-2xl font-bold text-gray-800">📥 Yêu cầu nhập kho</h1>
                <p className="text-gray-600 text-sm">Theo dõi yêu cầu nông dân và trạng thái xử lý của nhân viên</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Select value={status} onValueChange={(v) => { setStatus(v); setCurrentPage(1); }}>
                <SelectTrigger className="w-[180px]"><SelectValue placeholder="Trạng thái" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="pending">Chờ duyệt</SelectItem>
                  <SelectItem value="approved">Đã duyệt</SelectItem>
                  <SelectItem value="completed">Đã nhập kho</SelectItem>
                  <SelectItem value="rejected">Từ chối</SelectItem>
                  <SelectItem value="cancelled">Đã hủy</SelectItem>
                </SelectContent>
              </Select>
              <Input placeholder="Tìm theo mã, nông dân, lô..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} className="w-64" />
              <Button variant="outline" onClick={() => { setSearch(""); setStatus("all"); setCurrentPage(1); }}>Làm mới</Button>
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Tổng yêu cầu</p>
                  <p className="text-2xl font-bold">{filtered.length}</p>
                </div>
                <Package className="w-8 h-8 text-blue-200" />
              </div>
            </div>
            <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-100 text-sm font-medium">Chờ duyệt</p>
                  <p className="text-2xl font-bold">{pendingCount}</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-200" />
              </div>
            </div>
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Đã duyệt</p>
                  <p className="text-2xl font-bold">{approvedCount}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-blue-200" />
              </div>
            </div>
            <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-lg p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-100 text-sm font-medium">Tổng khối lượng</p>
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
            <CardTitle className="text-lg font-semibold text-gray-800">Danh sách yêu cầu</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-10 text-gray-500">Đang tải...</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-10 text-gray-500">Không có dữ liệu</div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full table-auto border border-gray-200 rounded-lg text-sm bg-white">
                    <thead className="bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-800 font-semibold">
                      <tr>
                        <th className="px-4 py-3 text-left border-b border-blue-200">Mã yêu cầu</th>
                        <th className="px-4 py-3 text-left border-b border-blue-200">Nông dân</th>
                        <th className="px-4 py-3 text-left border-b border-blue-200">Lô sơ chế</th>
                        <th className="px-4 py-3 text-right border-b border-blue-200">Số lượng (kg)</th>
                        <th className="px-4 py-3 text-left border-b border-blue-200">Ngày giao dự kiến</th>
                        <th className="px-4 py-3 text-center border-b border-blue-200">Trạng thái</th>
                        <th className="px-4 py-3 text-center border-b border-blue-200">Xem</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pageSlice.map((r) => (
                        <tr key={r.inboundRequestId} className="border-b border-gray-100 hover:bg-blue-50 transition-colors">
                          <td className="px-4 py-3 font-mono font-semibold text-gray-900">{r.inboundCode}</td>
                          <td className="px-4 py-3 text-gray-700">{r.farmerName}</td>
                          <td className="px-4 py-3 text-gray-700">{r.batchCode || "-"}</td>
                          <td className="px-4 py-3 text-right font-semibold">{Number(r.requestedQuantity || 0).toLocaleString()}</td>
                          <td className="px-4 py-3 text-gray-700">{new Date(r.preferredDeliveryDate).toLocaleDateString("vi-VN")}</td>
                          <td className="px-4 py-3 text-center">{statusBadge(r.status)}</td>
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
                      Hiển thị {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filtered.length)} trong {filtered.length} yêu cầu
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
