"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  getContractDetails,
  ContractViewDetailsDto,
} from "@/lib/api/contracts";
import {
  ContractItemCreateDto,
  ContractItemUpdateDto,
  softDeleteContractItem,
} from "@/lib/api/contractItems";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { FileText, Pencil, Trash2 } from "lucide-react";
import { Tooltip } from "@/components/ui/tooltip";
import { ConfirmDialog } from "@/components/ui/confirmDialog";
import ContractItemFormDialog from "@/components/contracts/ContractItemFormDialog";
import SettlementCard from "@/components/contracts/SettlementCard";
import { getCoffeeTypes, CoffeeType } from "@/lib/api/coffeeType";
import { formatQuantity, formatDate, formatDiscount } from "@/lib/utils";

const contractStatusMap: Record<string, { className: string }> = {
  NotStarted: {
    className: "bg-gray-100 text-gray-600",
  },
  PreparingDelivery: {
    className: "bg-purple-100 text-purple-700",
  },
  InProgress: {
    className: "bg-green-100 text-green-700",
  },
  PartialCompleted: {
    className: "bg-yellow-100 text-yellow-700",
  },
  Completed: {
    className: "bg-blue-100 text-blue-700",
  },
  Cancelled: {
    className: "bg-red-100 text-red-700",
  },
  Expired: {
    className: "bg-orange-100 text-orange-700",
  },
};

export default function ContractDetailPage() {
  const { t } = useTranslation();
  const params = useParams();
  const router = useRouter();
  const contractId = params.id as string;

  const [contract, setContract] = useState<ContractViewDetailsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [itemToDelete, setItemToDelete] = useState<
    ContractViewDetailsDto["contractItems"][number] | null
  >(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const ITEMS_PER_PAGE = 5;
  const [currentPage, setCurrentPage] = useState(1);

  const [showItemFormDialog, setShowItemFormDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<
    ContractViewDetailsDto["contractItems"][number] | null
  >(null);

  const [coffeeTypes, setCoffeeTypes] = useState<CoffeeType[]>([]);

  // Helper function to convert PascalCase status to camelCase for translation keys
  const getStatusTranslationKey = (status: string) => {
    return status.charAt(0).toLowerCase() + status.slice(1);
  };

  useEffect(() => {
    getCoffeeTypes().then(setCoffeeTypes).catch(console.error);
  }, []);

  const enrichItems = (items: ContractViewDetailsDto["contractItems"]) => {
    return items.map((item) => {
      return {
        ...item,
        coffeeTypeName:
          coffeeTypes.find((c) => c.coffeeTypeId === item.coffeeTypeId)
            ?.typeName ?? item.coffeeTypeName,
      };
    });
  };

  const reloadContract = () => {
    setLoading(true);
    getContractDetails(contractId)
      .then((data) => {
        console.log("Dữ liệu sau update:", data);
        data.contractItems = enrichItems(data.contractItems);
        setContract(data);
        setLoading(false);
      })
      .catch((err) => {

        setError(err.message || t("contracts.page.detail.error"));
        setLoading(false);
      });
  };

  useEffect(() => {
    if (!contractId) return;
    getContractDetails(contractId)
      .then((data) => {
        setContract(data);
        setLoading(false);
      })
      .catch((err) => {

        setError(err.message || t("contracts.page.detail.error"));

        setLoading(false);
      });
  }, [contractId]);

  const handleDelete = async () => {
    if (!itemToDelete?.contractItemId) return;
    try {
      await softDeleteContractItem(itemToDelete.contractItemId);
      toast.success(t("contracts.page.detail.deleteItemSuccess"));
      setShowDeleteDialog(false);
      reloadContract();
    } catch (error) {
      console.error("Xoá thất bại:", error);
      toast.error(t("contracts.page.detail.deleteItemError"));
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="p-8">
        <Card>
          <CardHeader>
            <CardTitle>{t("contracts.page.detail.error")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-500 mb-3">
              {error || t("contracts.page.detail.notFound")}
            </p>

            <Button onClick={() => router.back()}>
              {t("contracts.page.detail.back")}
            </Button>

          </CardContent>
        </Card>
      </div>
    );
  }

  const totalItems = contract.contractItems.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  const paginatedItems = contract.contractItems.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="w-full min-h-screen bg-orange-50 px-4 py-6 lg:px-20 flex justify-center">
      <div className="w-full max-w-6xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-2xl font-semibold text-gray-800">
            <FileText className="text-orange-600 w-6 h-6" />
            <span>
              {t("contracts.contract.title")}: {contract.contractNumber}
            </span>
          </div>
          <Button
            className="bg-[#f59e0b] hover:bg-[#d97706] text-white font-medium px-4 py-2 rounded-lg shadow-md flex items-center gap-2"
            onClick={() =>
              router.push(
                `/dashboard/manager/contracts/${contract.contractId}/edit`
              )
            }
          >
            {t("contracts.page.detail.editContract")}
          </Button>
        </div>

        <Separator className="border-t border-gray-200 my-2" />

        <Card>
          <CardHeader>
            <CardTitle>{t("contracts.page.detail.contractInfo")}</CardTitle>
          </CardHeader>

          <CardContent className="grid grid-cols-2 md:grid-cols-2 gap-4 text-sm">
            <div>
              <strong>{t("contracts.page.detail.contractTitle")}:</strong>{" "}
              {contract.contractTitle}
            </div>
            <div>
              <strong>{t("contracts.page.detail.seller")}:</strong>{" "}
              {contract.sellerName}
            </div>
            <div>
              <strong>{t("contracts.page.detail.buyer")}:</strong>{" "}
              {contract.buyerName}
            </div>
            <div>
              <strong>{t("contracts.page.detail.deliveryRounds")}:</strong>{" "}
              {contract.deliveryRounds ?? "-"}
            </div>
            <div>
              <strong>{t("contracts.page.detail.totalQuantity")}:</strong>{" "}
              {contract.totalQuantity !== undefined
                ? formatQuantity(contract.totalQuantity)
                : "-"}
            </div>
            <div>
              <strong>{t("contracts.page.detail.totalValue")}:</strong>{" "}
              {contract.totalValue !== undefined
                ? `${contract.totalValue.toLocaleString()} VNĐ`
                : "-"}
            </div>
            <div>
              <strong>{t("contracts.page.detail.startDate")}:</strong>{" "}
              {formatDate(contract.startDate)}
            </div>
            <div>
              <strong>{t("contracts.page.detail.endDate")}:</strong>{" "}
              {formatDate(contract.endDate)}
            </div>
            <div>
              <strong>{t("contracts.page.detail.signedAt")}:</strong>{" "}
              {formatDate(contract.signedAt)}
            </div>
            <div>
              <strong>{t("contracts.page.detail.status")}:</strong>
              <span
                className={`ml-2 px-2 py-1 rounded text-xs font-semibold ${
                  contractStatusMap[contract.status]?.className
                }`}
              >
                {t(
                  `contracts.status.${getStatusTranslationKey(contract.status)}`
                ) || contract.status}
              </span>
            </div>
            {contract.cancelReason && contract.status === "Cancelled" && (
              <div className="col-span-2">
                <strong className="text-red-600">
                  {t("contracts.page.detail.cancelReason")}:
                </strong>{" "}
                {contract.cancelReason}
              </div>
            )}
            <div>
              <strong>{t("contracts.page.detail.createdAt")}:</strong>{" "}
              {formatDate(contract.createdAt)}
            </div>
            <div>
              <strong>{t("contracts.page.detail.updatedAt")}:</strong>{" "}
              {formatDate(contract.updatedAt)}
            </div>
            {contract.contractFileUrl && (
              <div className="col-span-2">
                <strong>{t("contracts.page.detail.contractFile")}:</strong>
                <div className="mt-2 space-y-2">
                  {/* Preview ảnh nếu là file ảnh */}
                  {contract.contractFileUrl.match(
                    /\.(jpg|jpeg|png|gif|webp)$/i
                  ) && (
                    <div className="border rounded-lg p-3 bg-gray-50">
                      <img
                        src={contract.contractFileUrl}
                        alt={t("contracts.page.detail.previewContract")}
                        className="max-w-full h-32 object-contain rounded border cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => {
                          // Mở modal xem ảnh lớn
                          const modal = window.open(
                            "",
                            "_blank",
                            "width=800,height=600"
                          );
                          if (modal) {
                            modal.document.write(`
                              <html>
                                <head>
                                  <title>Xem hợp đồng: ${
                                    contract.contractNumber
                                  }</title>
                                  <style>
                                    body { margin: 0; padding: 20px; background: #f5f5f5; font-family: Arial, sans-serif; }
                                    .container { max-width: 100%; text-align: center; }
                                    img { max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
                                    .close-btn { position: fixed; top: 20px; right: 20px; background: white; border: none; border-radius: 50%; width: 40px; height: 40px; font-size: 18px; cursor: pointer; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
                                    .file-info { margin-top: 15px; color: #666; }
                                  </style>
                                </head>
                                <body>
                                  <button class="close-btn" onclick="window.close()">✕</button>
                                  <div class="container">
                                    <img src="${
                                      contract.contractFileUrl
                                    }" alt="Hợp đồng" />
                                    <div class="file-info">
                                      <strong>File:</strong> ${
                                        contract.contractNumber
                                      } - ${contract.contractTitle}.${
                              contract.contractFileUrl.split(".").pop() || "pdf"
                            }
                                    </div>
                                  </div>
                                </body>
                              </html>
                            `);
                          }
                        }}
                        title={t("contracts.page.detail.clickToViewLarge")}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {t("contracts.page.detail.clickToViewLarge")}
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        {t("contracts.page.detail.fileNameWhenDownload")}:{" "}
                        {contract.contractNumber} - {contract.contractTitle}.
                        {contract.contractFileUrl?.split(".").pop() || "pdf"}
                      </p>
                    </div>
                  )}

                  {/* Link tải xuống và xem trực tiếp */}
                  <div className="flex items-center gap-2">
                    <a
                      href={contract.contractFileUrl}
                      download
                      className="text-blue-600 underline hover:text-blue-800 text-sm cursor-pointer"
                      onClick={async (e) => {
                        // Nếu là URL từ internet, cần xử lý đặc biệt để đặt tên file
                        if (contract.contractFileUrl?.startsWith("http")) {
                          e.preventDefault(); // Ngăn chặn hành vi mặc định

                          try {
                            // Hiển thị thông báo đang tải
                            //toast.info("Đang tải file từ server...");

                            // Tải file về bằng Fetch API
                            const response = await fetch(
                              contract.contractFileUrl
                            );
                            if (!response.ok) {
                              throw new Error(
                                `HTTP error! status: ${response.status}`
                              );
                            }

                            // Lấy blob data
                            const blob = await response.blob();

                            // Lấy đuôi file từ URL một cách chính xác hơn
                            let fileExtension = "pdf"; // Mặc định là PDF
                            if (contract.contractFileUrl.includes(".")) {
                              const lastDotIndex =
                                contract.contractFileUrl.lastIndexOf(".");
                              if (lastDotIndex !== -1) {
                                const ext = contract.contractFileUrl.substring(
                                  lastDotIndex + 1
                                );
                                // Chỉ lấy đuôi file hợp lệ
                                if (
                                  [
                                    "pdf",
                                    "doc",
                                    "docx",
                                    "jpg",
                                    "jpeg",
                                    "png",
                                    "gif",
                                    "webp",
                                  ].includes(ext.toLowerCase())
                                ) {
                                  fileExtension = ext.toLowerCase();
                                }
                              }
                            }

                            // Tạo tên file có ý nghĩa: "Số hợp đồng - Tên hợp đồng.đuôi file"
                            const fileName = `${contract.contractNumber} - ${contract.contractTitle}.${fileExtension}`;

                            // Loại bỏ các ký tự không hợp lệ trong tên file Windows
                            const sanitizedFileName = fileName
                              .replace(/[<>:"/\\|?*]/g, "_")
                              .replace(/\s+/g, " ") // Thay thế nhiều khoảng trắng thành 1
                              .trim();

                            // Tạo URL từ blob
                            const blobUrl = URL.createObjectURL(blob);

                            // Tạo link tải xuống với tên file tùy chỉnh
                            const link = document.createElement("a");
                            link.href = blobUrl;
                            link.download = sanitizedFileName;

                            // Thêm vào DOM, click và xóa
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);

                            // Giải phóng blob URL
                            setTimeout(() => URL.revokeObjectURL(blobUrl), 100);

                            // Hiển thị thông báo thành công
                            toast.success(
                              `${t(
                                "contracts.page.detail.downloadSuccess"
                              )}: ${sanitizedFileName}`
                            );
                          } catch (error) {
                            console.error("Lỗi khi tải file:", error);
                            toast.error(
                              t("contracts.page.detail.downloadError")
                            );

                            // Fallback: mở file trong tab mới
                            window.open(contract.contractFileUrl, "_blank");
                          }
                        }
                      }}
                    >
                      {/* Icon theo loại file */}
                      {contract.contractFileUrl.match(
                        /\.(jpg|jpeg|png|gif|webp)$/i
                      ) && <span className="text-2xl">🖼️</span>}
                      {contract.contractFileUrl.match(/\.pdf$/i) && (
                        <span className="text-2xl">📄</span>
                      )}
                      {contract.contractFileUrl.match(/\.(doc|docx)$/i) && (
                        <span className="text-2xl">📝</span>
                      )}
                      {!contract.contractFileUrl.match(
                        /\.(jpg|jpeg|png|gif|webp|pdf|doc|docx)$/i
                      ) && <span className="text-2xl">📎</span>}
                      {t("contracts.page.detail.downloadContract")}
                    </a>
                    {/* Chỉ hiển thị "Xem trực tiếp" cho file ảnh */}
                    {contract.contractFileUrl.match(
                      /\.(jpg|jpeg|png|gif|webp)$/i
                    ) && (
                      <>
                        <span className="text-gray-400">|</span>
                        <a
                          href={contract.contractFileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-600 underline hover:text-green-800 text-sm"
                        >
                          {t("contracts.page.detail.viewDirectly")}
                        </a>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Settlement Card */}
        <SettlementCard
          settlementFiles={contract.settlementFiles}
          paymentRounds={contract.paymentRounds}
        />

        {/* Danh sách mặt hàng hợp đồng */}
        <div className="rounded-xl border bg-white p-4">
          {/* Header */}
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold">
              {t("contracts.page.detail.itemListTitle")}
            </h2>
            <Button
              className="bg-black text-white hover:bg-gray-800"
              onClick={() => {
                setEditingItem(null); // tạo mới
                setShowItemFormDialog(true);
              }}
            >
              {t("contracts.page.detail.addItem")}
            </Button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto text-sm border border-gray-200">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  <th className="px-4 py-2 text-left whitespace-nowrap">
                    {t("contracts.page.detail.coffeeTypeName")}
                  </th>
                  <th className="px-4 py-2 text-center whitespace-nowrap">
                    {t("contracts.page.detail.quantity")}
                  </th>
                  <th className="px-4 py-2 text-center whitespace-nowrap">
                    {t("contracts.page.detail.unitPrice")}
                  </th>
                  <th className="px-4 py-2 text-center whitespace-nowrap">
                    {t("contracts.page.detail.discount")}
                  </th>
                  <th className="px-4 py-2 text-left">
                    {t("contracts.page.detail.note")}
                  </th>
                  <th className="px-4 py-2 text-center">
                    {t("contracts.page.detail.actions")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {contract.contractItems.length === 0 ? (
                  <tr>
                    <td className="py-8 text-center text-gray-500" colSpan={6}>
                      {t("contracts.page.detail.noItems")}
                    </td>
                  </tr>
                ) : (
                  paginatedItems.map((item) => (
                    <tr
                      key={item.contractItemId}
                      className="border-t hover:bg-gray-50"
                    >
                      <td className="px-4 py-2">{item.coffeeTypeName}</td>
                      <td className="px-4 py-2 text-center">
                        {item.quantity !== undefined
                          ? formatQuantity(item.quantity)
                          : "—"}
                      </td>
                      <td className="px-4 py-2 text-center">
                        {item.unitPrice?.toLocaleString()}{" "}
                        <span className="text-gray-500 text-xs">{t('common.unit.currency')}/kg</span>
                      </td>
                      <td className="px-4 py-2 text-center">
                        {item.discountAmount !== undefined
                          ? `${item.discountAmount}%`
                          : "—"}
                      </td>
                      <td className="px-4 py-2">{item.note || "—"}</td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <div className="flex justify-center gap-[2px]">

                          <Tooltip content={t("contracts.page.detail.edit")}>

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

                          <Tooltip content={t("contracts.page.detail.delete")}>

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

                {t("contracts.page.detail.pagination.showing")}{" "}

                <span className="font-medium">
                  {(currentPage - 1) * ITEMS_PER_PAGE + 1}
                </span>{" "}
                {t("contracts.page.detail.pagination.to")}{" "}
                <span className="font-medium">
                  {Math.min(currentPage * ITEMS_PER_PAGE, totalItems)}
                </span>{" "}

                {t("contracts.page.detail.pagination.of")} {totalItems}{" "}
                {t("contracts.page.detail.pagination.items")}

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

                  {t("contracts.page.detail.pagination.previous")}
                </Button>
                <span className="flex items-center px-2">
                  {t("contracts.page.detail.pagination.page")}{" "}
                  <span className="mx-1 font-semibold">{currentPage}</span>{" "}
                  {t("contracts.page.detail.pagination.of")} {totalPages}

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

                  {t("contracts.page.detail.pagination.next")}

                </Button>
              </div>
            </div>
          )}
        </div>
        {/* Footer */}
        <div className="flex justify-end mt-4">
          <Button variant="outline" onClick={() => router.back()}>

            {t("contracts.page.detail.back")}

          </Button>
        </div>

        <ContractItemFormDialog
          open={showItemFormDialog}
          onOpenChange={setShowItemFormDialog}
          contractId={contract.contractId}
          initialData={
            editingItem
              ? ({
                  contractItemId: editingItem.contractItemId,
                  contractId: contract.contractId,
                  coffeeTypeId: editingItem.coffeeTypeId,
                  quantity: editingItem.quantity,
                  unitPrice: editingItem.unitPrice,
                  discountAmount: editingItem.discountAmount,
                  note: editingItem.note,
                } as ContractItemUpdateDto)
              : undefined
          }
          mode={editingItem ? "edit" : "create"}
          onSuccess={() => {
            setShowItemFormDialog(false);
            reloadContract();
          }}
        />
      </div>
      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}

        title={t("contracts.page.detail.deleteItemTitle")}

        description={
          <span
            dangerouslySetInnerHTML={{
              __html: t("contracts.page.detail.deleteItemDescription", {
                itemName: itemToDelete?.coffeeTypeName,
              }),
            }}
          />
        }

        confirmText={t("contracts.page.detail.deleteItemConfirm")}
        cancelText={t("contracts.page.detail.deleteItemCancel")}

        onConfirm={handleDelete}
      />
    </div>
  );
}
