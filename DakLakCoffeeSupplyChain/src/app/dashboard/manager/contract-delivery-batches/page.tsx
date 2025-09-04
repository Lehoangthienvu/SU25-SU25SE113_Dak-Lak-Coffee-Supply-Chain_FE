"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ContractDeliveryBatchStatus,
  getDeliveryBatchDisplayMap,
} from "@/lib/constants/contractDeliveryBatchStatus";
import { formatDate, cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Search,
  Eye,
  Pencil,
  Trash2,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  FileText,
  Info,
} from "lucide-react";
import {
  ContractDeliveryBatchViewAllDto,
  getAllContractDeliveryBatches,
  softDeleteContractDeliveryBatch,
} from "@/lib/api/contractDeliveryBatches";
import FilterDeliveryBatchStatusPanel from "@/components/contract-delivery-batches/FilterDeliveryBatchStatusPanel";
import { Tooltip } from "@/components/ui/tooltip";
import { formatQuantity } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/ui/confirmDialog";
import { useTranslation } from "react-i18next";

function getDeliveryBatchStatusDisplay(
  status: ContractDeliveryBatchStatus | "ALL",
  t: any
) {
  switch (status) {
    case "ALL":
      return {
        label: t("contractDeliveryBatches.status.all"),
        icon: <FileText className="w-4 h-4 text-gray-500" />,
        className: "bg-gray-100 text-gray-600",
      };
    case ContractDeliveryBatchStatus.Planned:
      return {
        label: t("contractDeliveryBatches.status.planned"),
        icon: <Package className="w-4 h-4 text-purple-500" />,
        className: "bg-purple-100 text-purple-700",
      };
    case ContractDeliveryBatchStatus.InProgress:
      return {
        label: t("contractDeliveryBatches.status.inProgress"),
        icon: <Truck className="w-4 h-4 text-green-500" />,
        className: "bg-green-100 text-green-700",
      };
    case ContractDeliveryBatchStatus.Fulfilled:
      return {
        label: t("contractDeliveryBatches.status.fulfilled"),
        icon: <CheckCircle className="w-4 h-4 text-blue-500" />,
        className: "bg-blue-100 text-blue-700",
      };
    case ContractDeliveryBatchStatus.Cancelled:
      return {
        label: t("contractDeliveryBatches.status.cancelled"),
        icon: <XCircle className="w-4 h-4 text-red-500" />,
        className: "bg-red-100 text-red-700",
      };
    default:
      return {
        label: String(status),
        icon: <FileText className="w-4 h-4 text-gray-500" />,
        className: "bg-gray-100 text-gray-600",
      };
  }
}

export default function ContractDeliveryBatchesPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<
    "ALL" | ContractDeliveryBatchStatus
  >("ALL");
  const [data, setData] = useState<ContractDeliveryBatchViewAllDto[]>([]);
  const [loading, setLoading] = useState(true);
  const ITEMS_PER_PAGE = 6;
  const [currentPage, setCurrentPage] = useState(1);
  const router = useRouter();

  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [batchToDelete, setBatchToDelete] =
    useState<ContractDeliveryBatchViewAllDto | null>(null);

  useEffect(() => {
    const fetchBatches = async () => {
      try {
        const result = await getAllContractDeliveryBatches();
        // Sắp xếp theo mới nhất (theo createdAt hoặc updatedAt)
        const sortedBatches = result.sort((a, b) => {
          const dateA = new Date(a.updatedAt || a.createdAt || 0);
          const dateB = new Date(b.updatedAt || b.createdAt || 0);
          return dateB.getTime() - dateA.getTime(); // Sắp xếp giảm dần (mới nhất trước)
        });
        setData(sortedBatches);
      } catch (err) {
        console.error(t("contractDeliveryBatches.errors.loadBatches"), err);
      } finally {
        setLoading(false);
      }
    };

    fetchBatches();
  }, []);

  const filteredData = data.filter((batch) => {
    const matchesSearch =
      batch.deliveryBatchCode.toLowerCase().includes(search.toLowerCase()) ||
      batch.contractNumber.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      selectedStatus === "ALL" || batch.status === selectedStatus;

    const batchDate = batch.expectedDeliveryDate
      ? new Date(batch.expectedDeliveryDate)
      : null;

    const matchesDate =
      (!fromDate || (batchDate && batchDate >= fromDate)) &&
      (!toDate || (batchDate && batchDate <= toDate));

    return matchesSearch && matchesStatus && matchesDate;
  });

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);

  const paginatedData = filteredData.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const statusList: (ContractDeliveryBatchStatus | "ALL")[] = [
    "ALL",
    ContractDeliveryBatchStatus.InProgress,
    ContractDeliveryBatchStatus.Fulfilled,
    ContractDeliveryBatchStatus.Cancelled,
  ];

  const statusCounts: Record<string, number> = data.reduce((acc, item) => {
    acc[item.status] = (acc[item.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Lọc statusCounts để chỉ chứa các trạng thái cần hiển thị
  const filteredStatusCounts: Record<string, number> = {
    [ContractDeliveryBatchStatus.InProgress]:
      statusCounts[ContractDeliveryBatchStatus.InProgress] || 0,
    [ContractDeliveryBatchStatus.Fulfilled]:
      statusCounts[ContractDeliveryBatchStatus.Fulfilled] || 0,
    [ContractDeliveryBatchStatus.Cancelled]:
      statusCounts[ContractDeliveryBatchStatus.Cancelled] || 0,
  };

  // Tính tổng số lượng cho "Tất cả trạng thái"
  const totalFilteredCount = Object.values(filteredStatusCounts).reduce(
    (sum, val) => sum + val,
    0
  );

  // Tạo displayMap đã lọc, bỏ trạng thái "Chuẩn bị giao" (Planned)
  const i18nDisplayMap = getDeliveryBatchDisplayMap(t);
  const filteredDisplayMap: Record<string, any> = {
    ALL: { ...i18nDisplayMap.ALL, count: totalFilteredCount },
    [ContractDeliveryBatchStatus.InProgress]:
      i18nDisplayMap[ContractDeliveryBatchStatus.InProgress],
    [ContractDeliveryBatchStatus.Fulfilled]:
      i18nDisplayMap[ContractDeliveryBatchStatus.Fulfilled],
    [ContractDeliveryBatchStatus.Cancelled]:
      i18nDisplayMap[ContractDeliveryBatchStatus.Cancelled],
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedStatus]);

  const reloadData = async () => {
    setLoading(true);
    try {
      const result = await getAllContractDeliveryBatches();
      // Sắp xếp theo mới nhất (theo createdAt hoặc updatedAt)
      const sortedBatches = result.sort((a, b) => {
        const dateA = new Date(a.updatedAt || a.createdAt || 0);
        const dateB = new Date(b.updatedAt || b.createdAt || 0);
        return dateB.getTime() - dateA.getTime(); // Sắp xếp giảm dần (mới nhất trước)
      });
      setData(sortedBatches);
    } catch (err) {
      console.error(t("contractDeliveryBatches.errors.reloadBatches"), err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBatch = async () => {
    if (!batchToDelete?.deliveryBatchId) return;
    try {
      await softDeleteContractDeliveryBatch(batchToDelete.deliveryBatchId);
      setShowDeleteDialog(false);
      setBatchToDelete(null);
      reloadData(); // hoặc fetch lại danh sách
      toast.success(t("contractDeliveryBatches.delete.success"));
    } catch (error) {
      console.error(t("contractDeliveryBatches.errors.deleteFailed"), error);
      toast.error(t("contractDeliveryBatches.delete.error"));
    }
  };

  return (
    <div className="flex min-h-screen bg-amber-50 p-6 gap-6">
      {/* Sidebar */}
      <aside className="w-64 space-y-4">
        {/* Tìm kiếm */}
        <div className="bg-white rounded-xl shadow-sm p-4 space-y-4">
          <h2 className="text-sm font-medium text-gray-700">
            {t("contractDeliveryBatches.search.title")}
          </h2>
          <div className="relative">
            <Input
              placeholder={t("contractDeliveryBatches.search.placeholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
        </div>

        {/* Bộ lọc trạng thái */}
        <FilterDeliveryBatchStatusPanel
          selectedStatus={selectedStatus}
          setSelectedStatus={setSelectedStatus}
          statusCounts={filteredStatusCounts}
          displayMap={filteredDisplayMap}
        />
      </aside>

      {/* Main Content */}
      <main className="flex-1 space-y-6">
        <div className="bg-white rounded-xl shadow-sm p-4 space-y-4">
          {/* Header */}
          <div className="flex justify-between items-center flex-wrap gap-4">
            {/* Bộ lọc ngày */}
            <div className="flex gap-4 items-center">
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700">
                  {t("contractDeliveryBatches.filters.fromDate")}
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
                  {t("contractDeliveryBatches.filters.toDate")}
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
              onClick={() =>
                router.push(
                  "/dashboard/manager/contract-delivery-batches/create"
                )
              }
            >
              {t("contractDeliveryBatches.actions.createNew")}
            </Button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto text-sm border border-gray-200">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  <th className="px-4 py-2 text-left">
                    {t(
                      "contractDeliveryBatches.table.headers.deliveryBatchCode"
                    )}
                  </th>
                  <th className="px-4 py-2 text-left">
                    {t("contractDeliveryBatches.table.headers.contractNumber")}
                  </th>
                  <th className="px-4 py-2 text-center">
                    {t("contractDeliveryBatches.table.headers.deliveryRound")}
                  </th>
                  <th className="px-4 py-2 text-center whitespace-nowrap">
                    {t(
                      "contractDeliveryBatches.table.headers.expectedDeliveryDate"
                    )}
                  </th>
                  <th className="px-4 py-2 text-center whitespace-nowrap">
                    {t("contractDeliveryBatches.table.headers.quantity")}
                    <Tooltip
                      content={t(
                        "contractDeliveryBatches.table.quantityTooltip"
                      )}
                    >
                      <Info className="inline ml-1 w-3 h-3 text-gray-400" />
                    </Tooltip>
                  </th>
                  <th className="px-4 py-2 text-center">
                    {t("contractDeliveryBatches.table.headers.status")}
                  </th>
                  <th className="px-4 py-2 text-center">
                    {t("contractDeliveryBatches.table.headers.actions")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-6 text-gray-500">
                      {t("contractDeliveryBatches.table.loading")}
                    </td>
                  </tr>
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-6 text-gray-500">
                      {t("contractDeliveryBatches.table.noData")}
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((batch) => (
                    <tr
                      key={batch.deliveryBatchId}
                      className="hover:bg-gray-50 border-t"
                    >
                      <td className="px-4 py-2">{batch.deliveryBatchCode}</td>
                      <td className="px-4 py-2">{batch.contractNumber}</td>
                      <td className="px-4 py-2 text-center">
                        {batch.deliveryRound}
                      </td>
                      <td className="px-4 py-2 text-center">
                        {batch.expectedDeliveryDate
                          ? formatDate(batch.expectedDeliveryDate)
                          : "—"}
                      </td>
                      <td className="px-4 py-2 text-center">
                        {batch.totalPlannedQuantity != null
                          ? formatQuantity(batch.totalPlannedQuantity)
                          : "—"}
                      </td>
                      <td className="px-4 py-2 text-center whitespace-nowrap">
                        {(() => {
                          const statusDisplay = getDeliveryBatchStatusDisplay(
                            batch.status,
                            t
                          );
                          return (
                            <span
                              className={`text-xs px-2 py-1 rounded-full font-medium ${statusDisplay.className}`}
                            >
                              {statusDisplay.label}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-4 py-2 text-center">
                        <div className="flex justify-center gap-[2px]">
                          <Button
                            variant="ghost"
                            className="w-7 h-7 p-[2px]"
                            onClick={() =>
                              router.push(
                                `/dashboard/manager/contract-delivery-batches/${batch.deliveryBatchId}`
                              )
                            }
                          >
                            <Eye className="w-4 h-4 text-blue-500" />
                          </Button>
                          <Button
                            variant="ghost"
                            className="w-7 h-7 p-[2px]"
                            onClick={() =>
                              router.push(
                                `/dashboard/manager/contract-delivery-batches/${batch.deliveryBatchId}/edit`
                              )
                            }
                          >
                            <Pencil className="w-4 h-4 text-yellow-500" />
                          </Button>
                          <Button
                            variant="ghost"
                            className="w-7 h-7 p-[2px]"
                            onClick={() => {
                              setBatchToDelete(batch);
                              setShowDeleteDialog(true);
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
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
            {/* Thông tin số lượng hiển thị */}
            <div className="text-sm text-gray-600">
              {t("contractDeliveryBatches.pagination.showing")}{" "}
              <span className="font-medium">
                {(currentPage - 1) * ITEMS_PER_PAGE + 1}
              </span>
              {" – "}
              <span className="font-medium">
                {Math.min(currentPage * ITEMS_PER_PAGE, filteredData.length)}
              </span>{" "}
              {t("contractDeliveryBatches.pagination.of")} {filteredData.length}{" "}
              {t("contractDeliveryBatches.pagination.deliveryBatches")}
            </div>

            {/* Điều khiển phân trang */}
            <div className="flex gap-2 justify-end mt-2 sm:mt-0">
              <Button
                variant="outline"
                size="sm"
                className="px-3"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                {t("contractDeliveryBatches.pagination.previous")}
              </Button>
              <span className="flex items-center px-2">
                {t("contractDeliveryBatches.pagination.page")}{" "}
                <span className="mx-1 font-semibold">{currentPage}</span>{" "}
                {t("contractDeliveryBatches.pagination.of")} {totalPages}
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
                {t("contractDeliveryBatches.pagination.next")}
              </Button>
            </div>
          </div>
        )}
      </main>
      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title={t("contractDeliveryBatches.delete.title")}
        description={
          <span>
            {t("contractDeliveryBatches.delete.description", {
              deliveryBatchCode: batchToDelete?.deliveryBatchCode,
            })}
          </span>
        }
        confirmText={t("contractDeliveryBatches.delete.confirm")}
        cancelText={t("contractDeliveryBatches.delete.cancel")}
        onConfirm={handleDeleteBatch}
      />
    </div>
  );
}
