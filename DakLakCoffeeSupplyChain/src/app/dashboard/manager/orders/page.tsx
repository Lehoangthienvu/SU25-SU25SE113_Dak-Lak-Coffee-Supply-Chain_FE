"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip } from "@/components/ui/tooltip";
import { ConfirmDialog } from "@/components/ui/confirmDialog";
import { Search, Eye, Pencil, Trash2, Info } from "lucide-react";
import { formatDate } from "@/lib/utils";
import {
  OrderViewAllDto,
  getAllOrders,
  softDeleteOrder,
} from "@/lib/api/orders";
import {
  OrderStatus,
  OrderStatusBadgeClass,
} from "@/lib/constants/orderStatus";
import FilterOrderStatusPanel from "@/components/orders/FilterOrderStatusPanel";
import { toast } from "sonner";

export default function OrdersPage() {
  const { t } = useTranslation();
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | "ALL">(
    "ALL"
  );
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);

  const [data, setData] = useState<OrderViewAllDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 6;

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<OrderViewAllDto | null>(
    null
  );

  const [deleting, setDeleting] = useState(false);

  // format tiền tệ VND
  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      currencyDisplay: "code",
      maximumFractionDigits: 0,
    })
      .format(n)
      .replace("VND", "VNĐ");

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await getAllOrders();
        setData(res);
      } catch (e) {
        console.error(t('managerOrders.list.error.loadOrders'), e);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  // ======= Filter + Search =======
  const filtered = data.filter((o) => {
    const matchesSearch =
      (o.orderCode ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (o.contractNumber ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (o.deliveryBatchCode ?? "").toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      selectedStatus === "ALL" || o.status === selectedStatus;

    // Ưu tiên ngày giao thực tế (ActualDeliveryDate) nếu có, không thì OrderDate
    const orderDate = o.actualDeliveryDate
      ? new Date(o.actualDeliveryDate)
      : o.orderDate
      ? new Date(o.orderDate)
      : null;

    const matchesDate =
      (!fromDate || (orderDate && orderDate >= fromDate)) &&
      (!toDate || (orderDate && orderDate <= toDate));

    return matchesSearch && matchesStatus && matchesDate;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1;
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(
    () => setCurrentPage(1),
    [search, selectedStatus, fromDate, toDate]
  );

  const statusCounts: Record<string, number> = data.reduce((acc, cur) => {
    acc[cur.status] = (acc[cur.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const reload = async () => {
    setLoading(true);
    try {
      const res = await getAllOrders();
      setData(res);
    } finally {
      setLoading(false);
    }
  };

  const isNoData =
    !loading &&
    data.length === 0 &&
    !search &&
    selectedStatus === "ALL" &&
    !fromDate &&
    !toDate;
  const noResult = !loading && filtered.length === 0 && !isNoData;

  // Nếu currentPage > totalPages sau khi filter/xoá, kéo về trang cuối
  useEffect(() => {
    if (currentPage > Math.max(1, totalPages)) {
      setCurrentPage(Math.max(1, totalPages));
    }
  }, [totalPages, currentPage]);

  const handleDelete = async () => {
    if (!orderToDelete?.orderId) return;
    const id = orderToDelete.orderId;
    const code = orderToDelete.orderCode;

    try {
      setDeleting(true);
      await softDeleteOrder(id);

      toast.success(t('managerOrders.list.delete.success'), {
        description: `${t('managerOrders.list.table.headers.orderCode')} ${code} ${t('managerOrders.list.delete.success')}.`,
      });

      // close + optimistic update để biến mất ngay
      setShowDeleteDialog(false);
      setOrderToDelete(null);
      setData((ds) => ds.filter((d) => d.orderId !== id));

      // Reload trang cho chắc cú (không cần toast fallback)
      router.refresh(); // App Router refresh
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        t('managerOrders.list.delete.error');
      console.error(t('managerOrders.list.delete.error'), e);
      toast.error(t('managerOrders.list.delete.error'), { description: msg });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-amber-50 p-6 gap-6">
      {/* Sidebar */}
      <aside className="w-64 space-y-4">
        {/* Tìm kiếm */}
        <div className="bg-white rounded-xl shadow-sm p-4 space-y-4">
          <h2 className="text-sm font-medium text-gray-700">
            {t('managerOrders.list.search.title')}
          </h2>
          <div className="relative">
            <Input
              placeholder={t('managerOrders.list.search.placeholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
        </div>

        {/* Bộ lọc trạng thái */}
        <FilterOrderStatusPanel
          selectedStatus={selectedStatus}
          setSelectedStatus={setSelectedStatus}
          statusCounts={statusCounts}
        />
      </aside>

      {/* Main content */}
      <main className="flex-1 space-y-6">
        <div className="bg-white rounded-xl shadow-sm p-4 space-y-4">
          {/* Header */}
          <div className="flex justify-between items-center flex-wrap gap-4">
            {/* Bộ lọc ngày */}
            <div className="flex gap-4 items-center">
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700">
                  {t('managerOrders.list.filters.fromDate')}
                </label>
                <Input
                  type="date"
                  value={fromDate ? fromDate.toISOString().split("T")[0] : ""}
                  onChange={(e) =>
                    setFromDate(
                      e.target.value ? new Date(e.target.value) : null
                    )
                  }
                  className="w-[150px]"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700">
                  {t('managerOrders.list.filters.toDate')}
                </label>
                <Input
                  type="date"
                  value={toDate ? toDate.toISOString().split("T")[0] : ""}
                  onChange={(e) =>
                    setToDate(e.target.value ? new Date(e.target.value) : null)
                  }
                  className="w-[150px]"
                />
              </div>
            </div>

            {/* Nút tạo mới */}
            <Button
              className="bg-black text-white hover:bg-gray-800"
              onClick={() => router.push("/dashboard/manager/orders/create")}
            >
              {t('managerOrders.list.actions.createNew')}
            </Button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto text-sm border border-gray-200">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  <th className="px-4 py-2 text-left whitespace-nowrap">
                    {t('managerOrders.list.table.headers.orderCode')}
                  </th>
                  <th className="px-4 py-2 text-left whitespace-nowrap">
                    {t('managerOrders.list.table.headers.contractNumber')}
                  </th>
                  <th className="px-4 py-2 text-left whitespace-nowrap">
                    {t('managerOrders.list.table.headers.deliveryBatchCode')}
                  </th>
                  <th className="px-4 py-2 text-center whitespace-nowrap">
                    {t('managerOrders.list.table.headers.deliveryDate')}
                    <Tooltip content={t('managerOrders.list.table.tooltips.deliveryDate')}>
                      <Info className="inline ml-1 w-3 h-3 text-gray-400" />
                    </Tooltip>
                  </th>
                  <th className="px-4 py-2 text-center whitespace-nowrap">
                    {t('managerOrders.list.table.headers.totalAmount')}
                    <Tooltip content={t('managerOrders.list.table.tooltips.totalAmount')}>
                      <Info className="inline ml-1 w-3 h-3 text-gray-400" />
                    </Tooltip>
                  </th>
                  <th className="px-4 py-2 text-center">{t('managerOrders.list.table.headers.status')}</th>
                  <th className="px-4 py-2 text-center">{t('managerOrders.list.table.headers.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-6 text-gray-500">
                      {t('managerOrders.list.loading.loadingData')}
                    </td>
                  </tr>
                ) : isNoData ? (
                  <tr>
                    <td colSpan={7} className="py-10">
                      <div className="flex flex-col items-center gap-3 text-gray-600">
                        <div className="text-lg font-medium">
                          {t('managerOrders.list.empty.noOrders')}
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : noResult ? (
                  <tr>
                    <td colSpan={7} className="text-center py-6 text-gray-500">
                      {t('managerOrders.list.empty.noResults')}
                    </td>
                  </tr>
                ) : (
                  paginated.map((o) => (
                    <tr key={o.orderId} className="hover:bg-gray-50 border-t">
                      <td className="px-4 py-2">{o.orderCode}</td>
                      <td className="px-4 py-2">{o.contractNumber ?? "—"}</td>
                      <td className="px-4 py-2">
                        {o.deliveryBatchCode ?? "—"}
                      </td>
                      <td className="px-4 py-2 text-center">
                        {o.actualDeliveryDate
                          ? formatDate(o.actualDeliveryDate)
                          : o.orderDate
                          ? formatDate(o.orderDate)
                          : "—"}
                      </td>
                      <td className="px-4 py-2 text-center">
                        {o.totalAmount != null
                          ? formatCurrency(o.totalAmount)
                          : "—"}
                      </td>
                      <td className="px-4 py-2 text-center whitespace-nowrap">
                        <span
                          className={`text-xs px-2 py-1 rounded-full font-medium border ${
                            OrderStatusBadgeClass[o.status]
                          }`}
                        >
                          {t(`managerOrders.list.table.status.${o.status.toLowerCase()}`)}
                        </span>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <div className="flex justify-center gap-[2px]">
                          <Tooltip content={t('managerOrders.list.table.tooltips.viewDetails')}>
                            <Button
                              variant="ghost"
                              className="w-7 h-7 p-[2px]"
                              onClick={() =>
                                router.push(
                                  `/dashboard/manager/orders/${o.orderId}`
                                )
                              }
                            >
                              <Eye className="w-4 h-4 text-blue-500" />
                            </Button>
                          </Tooltip>

                          <Tooltip content={t('managerOrders.list.table.tooltips.edit')}>
                            <Button
                              variant="ghost"
                              className="w-7 h-7 p-[2px]"
                              onClick={() =>
                                router.push(
                                  `/dashboard/manager/orders/${o.orderId}/edit`
                                )
                              }
                            >
                              <Pencil className="w-4 h-4 text-yellow-500" />
                            </Button>
                          </Tooltip>

                          <Tooltip content={t('managerOrders.list.table.tooltips.delete')}>
                            <Button
                              variant="ghost"
                              className="w-7 h-7 p-[2px]"
                              onClick={() => {
                                setOrderToDelete(o);
                                setShowDeleteDialog(true);
                              }}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </Tooltip>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mt-4 px-4 py-2 bg-gray-50 border rounded-md text-sm text-gray-700">
            <div className="text-sm text-gray-600">
              {t('managerOrders.list.pagination.showing')}{" "}
              <span className="font-medium">
                {(currentPage - 1) * ITEMS_PER_PAGE + 1}
              </span>
              –
              <span className="font-medium">
                {Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)}
              </span>{" "}
              {t('managerOrders.list.pagination.of')} {filtered.length} {t('managerOrders.list.pagination.orders')}
            </div>
            <div className="flex gap-2 justify-end mt-2 sm:mt-0">
              <Button
                variant="outline"
                size="sm"
                className="px-3"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                {t('managerOrders.list.pagination.previous')}
              </Button>
              <span className="flex items-center px-2">
                {t('managerOrders.list.pagination.page')} <span className="mx-1 font-semibold">{currentPage}</span>{" "}
                {t('managerOrders.list.pagination.of')} {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="px-3"
                disabled={currentPage === totalPages}
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
              >
                {t('managerOrders.list.pagination.next')}
              </Button>
            </div>
          </div>
        )}
      </main>

      {/* Delete dialog */}
      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title={t('managerOrders.list.delete.confirm')}
        description={
          <span>
            {t('managerOrders.list.delete.message', { orderCode: orderToDelete?.orderCode })}
          </span>
        }
        confirmText={t('managerOrders.list.table.tooltips.delete')}
        cancelText={"Huỷ"}
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  );
}
