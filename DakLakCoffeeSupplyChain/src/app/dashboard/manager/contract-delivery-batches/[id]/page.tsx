"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  ContractDeliveryItemUpdateDto,
  softDeleteContractDeliveryItem,
} from "@/lib/api/contractDeliveryItems";
import {
  ContractDeliveryBatchViewDetailsDto,
  ContractDeliveryItemViewDto,
  getContractDeliveryBatchById,
} from "@/lib/api/contractDeliveryBatches";
import { formatDate, formatQuantity } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { FiCalendar } from "react-icons/fi";
import { Pencil, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tooltip } from "@/components/ui/tooltip";
import { useRouter } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { ConfirmDialog } from "@/components/ui/confirmDialog";
import { ContractItemViewDto } from "@/lib/api/contractItems";
import {
  getContractDetails,
  ContractViewDetailsDto,
} from "@/lib/api/contracts";
import ContractDeliveryItemFormDialog from "@/components/contract-delivery-batches/ContractDeliveryItemFormDialog";
import { useTranslation } from "react-i18next";
import { getContractDeliveryBatchStatusLabel } from "@/lib/constants/contractDeliveryBatchStatus";

export default function ContractDeliveryBatchDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const [batch, setBatch] =
    useState<ContractDeliveryBatchViewDetailsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [editingItem, setEditingItem] =
    useState<ContractDeliveryItemViewDto | null>(null);
  const [showItemFormDialog, setShowItemFormDialog] = useState(false);
  const [itemToDelete, setItemToDelete] =
    useState<ContractDeliveryItemViewDto | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [contractItems, setContractItems] = useState<ContractItemViewDto[]>([]);

  const ITEMS_PER_PAGE = 5;
  const [currentPage, setCurrentPage] = useState(1);

  const totalItems = batch?.contractDeliveryItems.length ?? 0;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  const paginatedItems =
    batch?.contractDeliveryItems.slice(
      (currentPage - 1) * ITEMS_PER_PAGE,
      currentPage * ITEMS_PER_PAGE
    ) ?? [];

  const fetchData = async () => {
    if (!id) return;
    try {
      const result = await getContractDeliveryBatchById(id as string);
      setBatch(result);

      const contract = await getContractDetails(result.contractId);
      setContractItems(
        contract.contractItems.map((item) => ({
          ...item,
          quantity: item.quantity ?? 0,
          unitPrice: item.unitPrice ?? 0,
          discountAmount: item.discountAmount ?? 0,
        }))
      );
    } catch (err) {
      console.error(t("contractDeliveryBatches.detail.errors.loadData"), err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleDelete = async () => {
    if (!itemToDelete?.deliveryItemId) return;

    try {
      // Gọi API xoá mềm mặt hàng đợt giao (tên hàm giả định)
      await softDeleteContractDeliveryItem(itemToDelete.deliveryItemId);

      // Đóng dialog
      setShowDeleteDialog(false);

      // Reload lại batch (từ server) hoặc cập nhật local:
      const updated = {
        ...batch!,
        contractDeliveryItems: batch!.contractDeliveryItems.filter(
          (i) => i.deliveryItemId !== itemToDelete.deliveryItemId
        ),
      };
      setBatch(updated);
    } catch (error) {
      console.error(t("contractDeliveryBatches.detail.errors.deleteFailed"), error);
      alert(t("contractDeliveryBatches.detail.errors.deleteError"));
    }
  };

  if (loading) return <div className="p-6">{t("contractDeliveryBatches.detail.loading")}</div>;
  if (!batch)
    return (
      <div className="p-6 text-red-500">{t("contractDeliveryBatches.detail.notFound")}</div>
    );

  return (
    <div className="w-full min-h-screen bg-orange-50 px-4 py-6 lg:px-20 flex justify-center">
      <div className="w-full max-w-6xl space-y-6">
        {/* Title */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-2xl font-semibold text-gray-800">
            <FiCalendar className="text-orange-600 w-6 h-6" />
            <span>{t("contractDeliveryBatches.detail.title")} {batch.deliveryBatchCode}</span>
          </div>
          <Button
            className="bg-[#f59e0b] hover:bg-[#d97706] text-white font-medium px-4 py-2 rounded-lg shadow-md flex items-center gap-2"
            onClick={() =>
              router.push(
                `/dashboard/manager/contract-delivery-batches/${batch.deliveryBatchId}/edit`
              )
            }
          >
            {t("contractDeliveryBatches.detail.actions.edit")}
          </Button>
        </div>

        <Separator className="border-t border-gray-200 my-2" />

        {/* Delivery Batch Info */}
        <Card>
          <CardHeader>
            <CardTitle>{t("contractDeliveryBatches.detail.info.title")}</CardTitle>
          </CardHeader>

          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <strong>{t("contractDeliveryBatches.detail.info.contractNumber")}</strong> {batch.contractNumber}
            </div>
            <div>
              <strong>{t("contractDeliveryBatches.detail.info.contractTitle")}</strong> {batch.contractTitle}
            </div>
            <div>
              <strong>{t("contractDeliveryBatches.detail.info.deliveryRound")}</strong> {batch.deliveryRound}
            </div>
            <div>
              <strong>{t("contractDeliveryBatches.detail.info.expectedDate")}</strong>{" "}
              {batch.expectedDeliveryDate
                ? formatDate(batch.expectedDeliveryDate)
                : "—"}
            </div>
            <div>
              <strong>{t("contractDeliveryBatches.detail.info.quantity")}</strong>{" "}
              {formatQuantity(batch.totalPlannedQuantity ?? 0)}
            </div>
            <div>
              <strong>{t("contractDeliveryBatches.detail.info.status")}</strong>
              <span
                className={`ml-2 px-2 py-1 rounded text-xs font-semibold bg-blue-100 text-blue-700`}
              >
                {getContractDeliveryBatchStatusLabel(batch.status, t)}
              </span>
            </div>
            <div>
              <strong>{t("contractDeliveryBatches.detail.info.createdAt")}</strong>{" "}
              {batch.createdAt ? formatDate(batch.createdAt) : "—"}
            </div>
            <div>
              <strong>{t("contractDeliveryBatches.detail.info.updatedAt")}</strong>{" "}
              {batch.updatedAt ? formatDate(batch.updatedAt) : "—"}
            </div>
          </CardContent>
        </Card>

        {/* Danh sách mặt hàng giao */}
        <div className="rounded-xl border bg-white p-4">
          {/* Header */}
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold">{t("contractDeliveryBatches.detail.items.title")}</h2>
            <Button
              className="bg-black text-white hover:bg-gray-800"
              onClick={() => {
                setEditingItem(null); // chế độ tạo mới
                setShowItemFormDialog(true);
              }}
            >
              {t("contractDeliveryBatches.detail.actions.addItem")}
            </Button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto text-sm border border-gray-200">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  <th className="px-4 py-2 text-left whitespace-nowrap">
                    {t("contractDeliveryBatches.detail.items.table.headers.coffeeType")}
                  </th>
                  <th className="px-4 py-2 text-center whitespace-nowrap">
                    {t("contractDeliveryBatches.detail.items.table.headers.plannedQuantity")}
                  </th>
                  <th className="px-4 py-2 text-center whitespace-nowrap">
                    {t("contractDeliveryBatches.detail.items.table.headers.fulfilledQuantity")}
                  </th>
                  <th className="px-4 py-2 text-left">{t("contractDeliveryBatches.detail.items.table.headers.note")}</th>
                  <th className="px-4 py-2 text-center">{t("contractDeliveryBatches.detail.items.table.headers.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {batch.contractDeliveryItems.length === 0 ? (
                  <tr>
                    <td className="py-8 text-center text-gray-500" colSpan={5}>
                      {t("contractDeliveryBatches.detail.items.noItems")}
                    </td>
                  </tr>
                ) : (
                  paginatedItems.map((item) => (
                    <tr
                      key={item.deliveryItemId}
                      className="border-t hover:bg-gray-50"
                    >
                      <td className="px-4 py-2">{item.coffeeTypeName}</td>
                      <td className="px-4 py-2 text-center">
                        {formatQuantity(item.plannedQuantity)}
                      </td>
                      <td className="px-4 py-2 text-center">
                        {item.fulfilledQuantity != null
                          ? formatQuantity(item.fulfilledQuantity)
                          : "—"}
                      </td>
                      <td className="px-4 py-2">{item.note || "—"}</td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <div className="flex justify-center gap-[2px]">
                          <Tooltip content={t("contractDeliveryBatches.detail.items.tooltips.edit")}>
                            <Button
                              variant="ghost"
                              className="h-7 w-7 p-[2px]"
                              onClick={() => {
                                setEditingItem(item);
                                setShowItemFormDialog(true);
                              }}
                            >
                              <Pencil className="h-4 w-4 text-yellow-500" />
                            </Button>
                          </Tooltip>
                          <Tooltip content={t("contractDeliveryBatches.detail.items.tooltips.delete")}>
                            <Button
                              variant="ghost"
                              className="h-7 w-7 p-[2px]"
                              onClick={() => {
                                setItemToDelete(item);
                                setShowDeleteDialog(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mt-4 px-4 py-2 bg-gray-50 border rounded-md text-sm text-gray-700">
              <div className="text-sm text-gray-600">
                {t("contractDeliveryBatches.detail.pagination.showing")}{" "}
                <span className="font-medium">
                  {(currentPage - 1) * ITEMS_PER_PAGE + 1}
                </span>
                –
                <span className="font-medium">
                  {Math.min(currentPage * ITEMS_PER_PAGE, totalItems)}
                </span>{" "}
                {t("contractDeliveryBatches.detail.pagination.of")} {totalItems} {t("contractDeliveryBatches.detail.pagination.items")}
              </div>
              <div className="flex gap-2 justify-end mt-2 sm:mt-0">
                <Button
                  variant="outline"
                  size="sm"
                  className="px-3"
                  disabled={currentPage === 1}
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                >
                  {t("contractDeliveryBatches.detail.pagination.previous")}
                </Button>
                <span className="flex items-center px-2">
                  {t("contractDeliveryBatches.detail.pagination.page")}{" "}
                  <span className="mx-1 font-semibold">{currentPage}</span> /{" "}
                  {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="px-3"
                  disabled={currentPage === totalPages}
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                >
                  {t("contractDeliveryBatches.detail.pagination.next")}
                </Button>
              </div>
            </div>
          )}
        </div>
        {/* Footer */}
        <div className="flex justify-end mt-4">
          <Button variant="outline" onClick={() => history.back()}>
            {t("contractDeliveryBatches.detail.actions.back")}
          </Button>
        </div>
      </div>

      <ContractDeliveryItemFormDialog
        open={showItemFormDialog}
        onOpenChange={setShowItemFormDialog}
        deliveryBatchId={batch.deliveryBatchId}
        contractItems={contractItems}
        initialData={
          editingItem
            ? ({
              deliveryItemId: editingItem.deliveryItemId,
              deliveryBatchId: batch.deliveryBatchId,
              contractItemId: editingItem.contractItemId,
              plannedQuantity: editingItem.plannedQuantity,
              fulfilledQuantity: editingItem.fulfilledQuantity ?? undefined,
              note: editingItem.note,
            } as ContractDeliveryItemUpdateDto)
            : undefined
        }
        mode={editingItem ? "edit" : "create"}
        onSuccess={() => {
          setShowItemFormDialog(false);
          setEditingItem(null);
          fetchData();
        }}
      />
      {/* Dialog xác nhận xoá mặt hàng */}
      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title={t("contractDeliveryBatches.detail.deleteDialog.title")}
        description={
          <span>
            {t("contractDeliveryBatches.detail.deleteDialog.description")}{" "}
            <strong>{itemToDelete?.coffeeTypeName}</strong> {t("contractDeliveryBatches.detail.deleteDialog.fromDelivery")}
          </span>
        }
        confirmText={t("contractDeliveryBatches.detail.deleteDialog.confirm")}
        cancelText={t("contractDeliveryBatches.detail.deleteDialog.cancel")}
        onConfirm={handleDelete}
      />
    </div>
  );
}
