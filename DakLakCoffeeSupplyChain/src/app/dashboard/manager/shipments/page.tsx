"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import { Eye, Pencil, Trash2, Search } from "lucide-react";
import {
  useShipmentDeliveryStatusMap,
  ShipmentDeliveryStatusValue,
} from "@/lib/constants/shipmentDeliveryStatus";
import FilterStatusPanel from "@/components/ui/filterStatusPanel";
import { cn } from "@/lib/utils";
import {
  ShipmentViewAllDto,
  getAllShipments,
  softDeleteShipment,
} from "@/lib/api/shipments";
import { ConfirmDialog } from "@/components/ui/confirmDialog";
import { useTranslation } from "react-i18next";

export default function ShipmentsPage() {
  const { t, i18n } = useTranslation();
  const statusMap = useShipmentDeliveryStatusMap();
  const [shipments, setShipments] = useState<ShipmentViewAllDto[]>([]);
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] =
    useState<ShipmentDeliveryStatusValue | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const router = useRouter();
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [shipmentToDelete, setShipmentToDelete] =
    useState<ShipmentViewAllDto | null>(null);

  useEffect(() => {
    getAllShipments().then((data) => {
      if (Array.isArray(data)) setShipments(data);
    });
  }, []);

  const filtered = useMemo(() => {
    return shipments.filter((s) => {
      const matchesStatus =
        !selectedStatus || s.deliveryStatus === selectedStatus;
      const matchesSearch =
        !search ||
        [s.shipmentCode, s.orderCode, s.deliveryStaffName, s.deliveryStatus]
          .join(" ")
          .toLowerCase()
          .includes(search.toLowerCase());
      // Date range filter: shippedAt – receivedAt
      const shipped = s.shippedAt ? new Date(s.shippedAt) : null;
      const received = s.receivedAt ? new Date(s.receivedAt) : null;

      const matchesStartDate =
        !startDate ||
        (shipped && shipped >= startDate) ||
        (received && received >= startDate);

      const matchesEndDate =
        !endDate ||
        (received && received <= endDate) ||
        (shipped && shipped <= endDate);

      return (
        matchesStatus && matchesSearch && matchesStartDate && matchesEndDate
      );
    });
  }, [shipments, search, selectedStatus, startDate, endDate]);

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const pagedShipments = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const statusCounts = shipments.reduce<
    Record<ShipmentDeliveryStatusValue, number>
  >(
    (acc, s) => {
      const status = s.deliveryStatus as ShipmentDeliveryStatusValue;
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    },
    {
      Pending: 0,
      InTransit: 0,
      Delivered: 0,
      Failed: 0,
      Returned: 0,
      Canceled: 0,
    }
  );

  const formatDateTime = (iso?: string | null) => {
    if (!iso) return "";
    const date = new Date(iso);
    return new Intl.DateTimeFormat(i18n.language === 'en' ? "en-US" : "vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date);
  };

  return (
    <div className="flex min-h-screen bg-amber-50 p-6 gap-6">
      <aside className="w-64 space-y-4">
        <div className="bg-white rounded-xl shadow-sm p-4 space-y-4">
          <h2 className="text-sm font-medium text-gray-700">
            {t('shipments.search.title')}
          </h2>
          <div className="relative">
            <Input
              placeholder={t('shipments.search.placeholder')}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="pr-10"
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
        </div>

        <FilterStatusPanel<ShipmentDeliveryStatusValue>
          selectedStatus={selectedStatus}
          setSelectedStatus={setSelectedStatus}
          statusCounts={statusCounts}
          statusMap={statusMap}
        />
      </aside>

      <main className="flex-1 space-y-6">
        <div className="bg-white rounded-xl shadow-sm p-4 space-y-4">
          <div className="flex justify-between items-center gap-4 flex-wrap">
            <div className="flex gap-4 items-center">
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700">
                  {t('shipments.search.fromDate')}
                </label>
                <Input
                  type="date"
                  value={startDate ? startDate.toISOString().split("T")[0] : ""}
                  onChange={(e) =>
                    setStartDate(
                      e.target.value ? new Date(e.target.value) : null
                    )
                  }
                  className="w-[150px]"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700">
                  {t('shipments.search.toDate')}
                </label>
                <Input
                  type="date"
                  value={endDate ? endDate.toISOString().split("T")[0] : ""}
                  onChange={(e) =>
                    setEndDate(e.target.value ? new Date(e.target.value) : null)
                  }
                  className="w-[150px]"
                />
              </div>
            </div>
            <Button
              className="bg-black text-white hover:bg-gray-800"
              onClick={() => router.push("/dashboard/manager/shipments/create")}
            >
              {t('shipments.actions.createNew')}
            </Button>
          </div>

          <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead className="bg-gray-100 text-sm text-gray-600">
                <tr>
                  <th className="px-4 py-2 text-left">{t('shipments.table.headers.shipmentCode')}</th>
                  <th className="px-4 py-2 text-left">{t('shipments.table.headers.orderCode')}</th>
                  <th className="px-4 py-2 text-left">{t('shipments.table.headers.deliveryStaff')}</th>
                  <th className="px-4 py-2 text-center">{t('shipments.table.headers.status')}</th>
                  <th className="px-4 py-2 text-center">
                    {t('shipments.table.headers.timeRange')}
                  </th>
                  <th className="px-4 py-2 text-center">{t('shipments.table.headers.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {pagedShipments.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="text-center py-8 text-sm text-muted-foreground"
                    >
                      {t('shipments.table.noData')}
                    </td>
                  </tr>
                ) : (
                  pagedShipments.map((s) => (
                    <tr
                      key={s.shipmentId}
                      className="border-t text-sm hover:bg-gray-50"
                    >
                      <td className="px-4 py-2 whitespace-nowrap">
                        {s.shipmentCode}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        {s.orderCode}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        {s.deliveryStaffName}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-center">
                        {(() => {
                          const meta =
                            statusMap[s.deliveryStatus];
                          return (
                            <span
                              className={cn(
                                "px-2 py-1 rounded-full text-xs font-medium",
                                `bg-${meta.color}-100 text-${meta.color}-700`
                              )}
                            >
                              {meta.label}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap">
                        <div className="flex justify-center items-center text-sm font-mono">
                          {s.shippedAt ? (
                            <>
                              <span>{formatDateTime(s.shippedAt)}</span>
                              <span className="mx-1 text-gray-500">–</span>
                              <span>{formatDateTime(s.receivedAt)}</span>
                            </>
                          ) : (
                            ""
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <div className="flex items-center gap-[2px] justify-center">
                          <Tooltip content={t('shipments.actions.view')}>
                            <Button
                              variant="ghost"
                              className="p-[2px] w-7 h-7"
                              onClick={() =>
                                router.push(
                                  `/dashboard/manager/shipments/${s.shipmentId}`
                                )
                              }
                            >
                              <Eye className="w-4 h-4 text-blue-500" />
                            </Button>
                          </Tooltip>
                          <Tooltip content={t('shipments.actions.edit')}>
                            <Button
                              variant="ghost"
                              className="p-[2px] w-7 h-7"
                              onClick={() =>
                                router.push(
                                  `/dashboard/manager/shipments/${s.shipmentId}/edit`
                                )
                              }
                            >
                              <Pencil className="w-4 h-4 text-yellow-500" />
                            </Button>
                          </Tooltip>
                          <Tooltip content={t('shipments.actions.delete')}>
                            <Button
                              variant="ghost"
                              className="p-[2px] w-7 h-7"
                              onClick={() => {
                                setShipmentToDelete(s);
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

        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mt-4 px-4 py-2 bg-gray-50 border rounded-md text-sm text-gray-700">
            <div className="text-sm text-gray-600">
              {t('shipments.table.pagination.showing')}{" "}
              <span className="font-medium">
                {(currentPage - 1) * pageSize + 1}
              </span>
              –
              <span className="font-medium">
                {Math.min(currentPage * pageSize, filtered.length)}
              </span>{" "}
              {t('shipments.table.pagination.of')} {filtered.length} {t('shipments.table.pagination.shipments')}
            </div>
            <div className="flex gap-2 justify-end mt-2 sm:mt-0">
              <Button
                variant="outline"
                size="sm"
                className="px-3"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                {t('shipments.actions.previous')}
              </Button>
              <span className="flex items-center px-2">
                {t('shipments.table.pagination.page')} <span className="mx-1 font-semibold">{currentPage}</span>{" "}
                {t('shipments.table.pagination.of')} {totalPages}
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
                {t('shipments.actions.next')}
              </Button>
            </div>
          </div>
        )}
        <ConfirmDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          title={t('shipments.deleteDialog.title')}
          description={
            <span>
              {t('shipments.deleteDialog.description', { 
                shipmentCode: shipmentToDelete?.shipmentCode 
              })}
            </span>
          }
          confirmText={t('shipments.deleteDialog.confirm')}
          cancelText={t('shipments.deleteDialog.cancel')}
          onConfirm={async () => {
            if (!shipmentToDelete) return;
            try {
              await softDeleteShipment(shipmentToDelete.shipmentId);
              setShipments((prev) =>
                prev.filter((x) => x.shipmentId !== shipmentToDelete.shipmentId)
              );
            } finally {
              setShowDeleteDialog(false);
              setShipmentToDelete(null);
            }
          }}
        />
      </main>
    </div>
  );
}
