"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getAllContracts, ContractViewAllDto } from "@/lib/api/contracts";
import FilterStatusPanel from "@/components/contracts/FilterContractStatusPanel";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  Pencil,
  Trash2,
} from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirmDialog";
import { softDeleteContract } from "@/lib/api/contracts";
import { Tooltip } from "@/components/ui/tooltip";

export default function ContractsPage() {
  const { t } = useTranslation();
  const [contracts, setContracts] = useState<ContractViewAllDto[]>([]);
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const router = useRouter();
  const pageSize = 6;
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  useEffect(() => {
    getAllContracts().then((data) => {
      if (Array.isArray(data)) {
        // Sắp xếp theo hợp đồng mới nhất (theo startDate hoặc endDate)
        const sortedContracts = data.sort((a, b) => {
          // Sử dụng startDate nếu có, nếu không thì dùng endDate
          const dateA = new Date(a.startDate || a.endDate || 0);
          const dateB = new Date(b.startDate || b.endDate || 0);
          return dateB.getTime() - dateA.getTime(); // Sắp xếp giảm dần (mới nhất trước)
        });
        setContracts(sortedContracts);
      }
    });
  }, []);

  const filtered = contracts.filter((c) => {
    const matchesStatus = !selectedStatus || c.status === selectedStatus;
    const matchesSearch =
      !search ||
      [c.contractCode, c.contractNumber, c.contractTitle, c.buyerName]
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase());

    const contractStart = c.startDate ? new Date(c.startDate) : null;
    const contractEnd = c.endDate ? new Date(c.endDate) : null;

    const matchesStartDate =
      !startDate || (contractStart && contractStart >= startDate);
    const matchesEndDate = !endDate || (contractEnd && contractEnd <= endDate);

    return matchesStatus && matchesSearch && matchesStartDate && matchesEndDate;
  });

  const totalPages = Math.ceil(filtered.length / pageSize);
  const pagedContracts = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const statusCounts = contracts.reduce<Record<string, number>>((acc, c) => {
    acc[c.status] = (acc[c.status] || 0) + 1;
    return acc;
  }, {});

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date);
  };

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case "NotStarted":
        return {
          label: t("contracts.status.notStarted"),
          className: "bg-gray-100 text-gray-600",
        };
      case "PreparingDelivery":
        return {
          label: t("contracts.status.preparingDelivery"),
          className: "bg-purple-100 text-purple-700",
        };
      case "InProgress":
        return {
          label: t("contracts.status.inProgress"),
          className: "bg-green-100 text-green-700",
        };
      case "PartialCompleted":
        return {
          label: t("contracts.status.partialCompleted"),
          className: "bg-yellow-100 text-yellow-700",
        };
      case "Completed":
        return {
          label: t("contracts.status.completed"),
          className: "bg-blue-100 text-blue-700",
        };
      case "Cancelled":
        return {
          label: t("contracts.status.cancelled"),
          className: "bg-red-100 text-red-700",
        };
      case "Expired":
        return {
          label: t("contracts.status.expired"),
          className: "bg-orange-100 text-orange-700",
        };
      default:
        return { label: status, className: "bg-gray-100 text-gray-600" };
    }
  };

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [contractToDelete, setContractToDelete] =
    useState<ContractViewAllDto | null>(null);

  return (
    <div className="flex min-h-screen bg-amber-50 p-6 gap-6">
      <aside className="w-64 space-y-4">
        <div className="bg-white rounded-xl shadow-sm p-4 space-y-4">
          <h2 className="text-sm font-medium text-gray-700">
            {t("contracts.page.list.search.title")}
          </h2>
          <div className="relative">
            <Input
              placeholder={t("contracts.page.list.search.placeholder")}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="pr-10"
            />
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
        </div>
        <FilterStatusPanel
          selectedStatus={selectedStatus}
          setSelectedStatus={setSelectedStatus}
          statusCounts={statusCounts}
        />
      </aside>

      <main className="flex-1 space-y-6">
        <div className="bg-white rounded-xl shadow-sm p-4 space-y-4">
          <div className="flex justify-between items-center gap-4 flex-wrap">
            <div className="flex gap-4 items-center">
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700">
                  {t("contracts.page.list.filters.dateRange.fromDate")}
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
                  {t("contracts.page.list.filters.dateRange.toDate")}
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
              onClick={() => router.push("/dashboard/manager/contracts/create")}
            >
              {t("contracts.page.list.actions.createNew")}
            </Button>
          </div>

          <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead className="bg-gray-100 text-sm text-gray-600">
                <tr>
                  <th className="px-4 py-2 text-left">
                    {t("contracts.page.list.table.headers.contractNumber")}
                  </th>
                  <th className="px-4 py-2 text-left">
                    {t("contracts.page.list.table.headers.contractTitle")}
                  </th>
                  <th className="px-4 py-2 text-left">
                    {t("contracts.page.list.table.headers.partner")}
                  </th>
                  <th className="px-4 py-2 text-center">
                    {t("contracts.page.list.table.headers.status")}
                  </th>
                  <th className="px-4 py-2 text-center">
                    {t("contracts.page.list.table.headers.time")}
                  </th>
                  <th className="px-4 py-2 text-center">
                    {t("contracts.page.list.table.headers.actions")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {pagedContracts.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="text-center py-8 text-sm text-muted-foreground"
                    >
                      {t("contracts.page.list.table.empty")}
                    </td>
                  </tr>
                ) : (
                  pagedContracts.map((contract) => (
                    <tr
                      key={contract.contractId}
                      className="border-t text-sm hover:bg-gray-50"
                    >
                      <td className="px-4 py-2">{contract.contractNumber}</td>
                      <td className="px-4 py-2">{contract.contractTitle}</td>
                      <td className="px-4 py-2">{contract.buyerName}</td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        {(() => {
                          const { label, className } = getStatusDisplay(
                            contract.status
                          );
                          return (
                            <span
                              className={cn(
                                "px-2 py-1 rounded-full text-xs font-medium",
                                className
                              )}
                            >
                              {label}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap">
                        {contract.startDate && contract.endDate ? (
                          <div className="flex justify-center items-center text-sm font-mono">
                            <span>{formatDate(contract.startDate)}</span>
                            <span className="mx-1 text-gray-500">–</span>
                            <span>{formatDate(contract.endDate)}</span>
                          </div>
                        ) : (
                          ""
                        )}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <div className="flex items-center gap-[2px]">
                          <Tooltip content={t("contracts.actions.view")}>
                            <Button
                              variant="ghost"
                              className="p-[2px] w-7 h-7"
                              onClick={() =>
                                router.push(
                                  `/dashboard/manager/contracts/${contract.contractId}`
                                )
                              }
                            >
                              <Eye className="w-4 h-4 text-blue-500" />
                            </Button>
                          </Tooltip>
                          <Tooltip content={t("contracts.actions.edit")}>
                            <Button
                              variant="ghost"
                              className="p-[2px] w-7 h-7"
                              onClick={() =>
                                router.push(
                                  `/dashboard/manager/contracts/${contract.contractId}/edit`
                                )
                              }
                            >
                              <Pencil className="w-4 h-4 text-yellow-500" />
                            </Button>
                          </Tooltip>
                          <Tooltip content={t("contracts.actions.delete")}>
                            <Button
                              variant="ghost"
                              className="p-[2px] w-7 h-7"
                              onClick={() => {
                                setContractToDelete(contract);
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
            {/* Thông tin hiển thị hợp đồng */}
            <div className="text-sm text-gray-600">
              {t("contracts.page.list.table.pagination.showing")}{" "}
              <span className="font-medium">
                {(currentPage - 1) * pageSize + 1}
              </span>{" "}
              –{" "}
              <span className="font-medium">
                {Math.min(currentPage * pageSize, filtered.length)}
              </span>{" "}
              {t("contracts.page.list.table.pagination.of")} {filtered.length}{" "}
              {t("contracts.page.list.table.pagination.contracts")}
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
                {t("contracts.page.list.table.pagination.previous")}
              </Button>
              <span className="flex items-center px-2">
                {t("contracts.page.list.table.pagination.page")}{" "}
                <span className="mx-1 font-semibold">{currentPage}</span>{" "}
                {t("contracts.page.list.table.pagination.of")} {totalPages}
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
                {t("contracts.page.list.table.pagination.next")}
              </Button>
            </div>
          </div>
        )}
      </main>
      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title={t("contracts.page.list.table.dialog.deleteContract.title")}
        description={
          <span
            dangerouslySetInnerHTML={{
              __html: t(
                "contracts.page.list.table.dialog.deleteContract.description",
                {
                  contractTitle: contractToDelete?.contractTitle,
                }
              ),
            }}
          />
        }
        confirmText={t(
          "contracts.page.list.table.dialog.deleteContract.confirm"
        )}
        cancelText={t("contracts.page.list.table.dialog.deleteContract.cancel")}
        onConfirm={async () => {
          if (!contractToDelete) return;
          try {
            await softDeleteContract(contractToDelete.contractId);
            setContracts((prev) =>
              prev.filter((c) => c.contractId !== contractToDelete.contractId)
            );
            toast.success(t("contracts.crud.success.delete"));
          } catch (error) {
            console.error("Lỗi khi xoá hợp đồng:", error);
            toast.error(t("contracts.crud.error.delete"));
          } finally {
            setShowDeleteDialog(false);
            setContractToDelete(null);
          }
        }}
      />
    </div>
  );
}
