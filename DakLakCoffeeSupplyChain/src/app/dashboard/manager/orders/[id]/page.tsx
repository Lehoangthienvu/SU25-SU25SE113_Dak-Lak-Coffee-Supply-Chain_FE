"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import { ConfirmDialog } from "@/components/ui/confirmDialog";
import { Pencil, Trash2, Info, Package } from "lucide-react";
import { formatDate, formatQuantity, formatDiscount } from "@/lib/utils";
import { OrderViewDetailsDto, getOrderDetails } from "@/lib/api/orders";
import {
  OrderItemViewDto,
  OrderItemUpdateDto,
  softDeleteOrderItem,
} from "@/lib/api/orderItems";
import { OrderStatus } from "@/lib/constants/orderStatus";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import OrderItemFormDialog from "@/components/orders/OrderItemFormDialog";
import {
  getContractDeliveryBatchById,
  buildCdiOptions,
} from "@/lib/api/contractDeliveryBatches";
import { getProductOptions, type ProductOption } from "@/lib/api/products";

export default function OrderDetailPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [order, setOrder] = useState<OrderViewDetailsDto | null>(null);
  const [loading, setLoading] = useState(true);

  // dialog xoá item
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<OrderItemViewDto | null>(
    null
  );
  const [deleting, setDeleting] = useState(false);

  const [showOrderItemDialog, setShowOrderItemDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [editingItem, setEditingItem] = useState<
    OrderItemUpdateDto | undefined
  >(undefined);

  const orderStatusBadgeMap: Record<
    OrderStatus,
    { label: string; className: string }
  > = {
    Pending: {
      label: t('managerOrders.status.pending'),
      className: "bg-purple-100 text-purple-700",
    },
    Preparing: {
      label: t('managerOrders.status.preparing'),
      className: "bg-blue-100 text-blue-700",
    },
    Shipped: {
      label: t('managerOrders.status.shipped'),
      className: "bg-amber-100 text-amber-700",
    },
    Delivered: {
      label: t('managerOrders.status.delivered'),
      className: "bg-green-100 text-green-700",
    },
    Cancelled: {
      label: t('managerOrders.status.cancelled'),
      className: "bg-red-100 text-red-700",
    },
    Failed: {
      label: t('managerOrders.status.failed'),
      className: "bg-gray-200 text-gray-600",
    },
  } as const;

  // format VND -> "VNĐ"
  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      currencyDisplay: "code",
      maximumFractionDigits: 0,
    })
      .format(n)
      .replace("VND", "VNĐ");

  const reload = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await getOrderDetails(id);
      setOrder(data);
    } catch (e) {
      console.error(t('managerOrders.detail.error.loadData'), e);
      toast.error(t('managerOrders.detail.error.loadData'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
  }, [id, t]);

  // Lấy danh sách item từ order
  const items = order?.orderItems ?? [];

  // Tổng số item & tổng số trang
  const totalItems = items.length;
  const ITEMS_PER_PAGE = 5; // (giữ nguyên vị trí nào bạn thích, nhưng dùng chung 1 biến)
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));

  // Trang hiện tại
  const [currentPage, setCurrentPage] = useState(1);

  // Mảng item của trang hiện tại
  const paginated = useMemo(
    () =>
      items.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
      ),
    [items, currentPage]
  );

  // Khi dữ liệu items thay đổi -> quay về trang 1
  useEffect(() => setCurrentPage(1), [items.length]);

  type ContractDeliveryItemOption = {
    contractDeliveryItemId: string;
    label: string;
  };
  type ProductOption = { productId: string; name: string };

  const [contractDeliveryItems, setContractDeliveryItems] = useState<
    ContractDeliveryItemOption[]
  >([]);
  const [products, setProducts] = useState<ProductOption[]>([]);

  // Nạp dropdown Products cho form
  useEffect(() => {
    // Có order rồi thì load products (hoặc bạn có thể load ngay từ đầu cũng được)
    if (!order) return;
    getProductOptions()
      .then(setProducts)
      .catch(() => toast.error(t('managerOrders.detail.error.loadData')));
  }, [order]);

  // Nạp dropdown ContractDeliveryItems từ chi tiết đợt giao
  useEffect(() => {
    // BE cần trả về deliveryBatchId trong order details
    const deliveryBatchId = (order as any)?.deliveryBatchId as
      | string
      | undefined;

    if (!deliveryBatchId) {
      return;
    }

    (async () => {
      try {
        const details = await getContractDeliveryBatchById(deliveryBatchId);
        setContractDeliveryItems(
          (details.contractDeliveryItems ?? []).map((x) => ({
            contractDeliveryItemId: String(x.deliveryItemId), // ép string
            label: `${x.coffeeTypeName} — KH: ${x.plannedQuantity}`,
          }))
        );
      } catch {
        toast.error(t('managerOrders.detail.error.loadData'));
      }
    })();
  }, [order]);

  // Refetch list sau khi lưu xong
  const orderId = params.id as string;

  const refetchOrderItems = useCallback(async () => {
    const data = await getOrderDetails(orderId);
    setOrder(data);
  }, [orderId]);

  // Mở dialog tạo
  const openCreateDialog = () => {
    setDialogMode("create");
    setEditingItem(undefined);
    setShowOrderItemDialog(true);
  };

  // helper
  const norm = (s: string | undefined | null) =>
    String(s ?? "")
      .trim()
      .toLowerCase();

  // Nạp danh sách ContractDeliveryItems theo batchId
  useEffect(() => {
    if (!order?.deliveryBatchId) return;
    (async () => {
      try {
        const details = await getContractDeliveryBatchById(
          order.deliveryBatchId
        );
        setContractDeliveryItems(
          (details.contractDeliveryItems ?? []).map((x) => ({
            contractDeliveryItemId: norm(x.deliveryItemId), // normalize
            label: `${x.coffeeTypeName} — KH: ${x.plannedQuantity}`,
          }))
        );
      } catch {
        toast.error(t('managerOrders.detail.error.loadData'));
        setContractDeliveryItems([]);
      }
    })();
  }, [order?.deliveryBatchId]);

  // Mở dialog sửa (map từ OrderItemViewDto -> OrderItemUpdateDto)
  const openEditDialog = (row: OrderItemViewDto) => {
    if (!order) return;

    const currentId = norm(row.contractDeliveryItemId); // normalize

    // nếu option hiện tại chưa có thì chèn, dùng key đã normalize để tránh trùng khác case
    setContractDeliveryItems((prev) => {
      const map = new Map(prev.map((o) => [norm(o.contractDeliveryItemId), o]));
      if (!map.has(currentId)) {
        map.set(currentId, {
          contractDeliveryItemId: currentId,
          label: "Mặt hàng đợt giao (hiện tại)",
        });
      }
      return Array.from(map.values());
    });

    setDialogMode("edit");
    setEditingItem({
      orderItemId: row.orderItemId,
      orderId: order.orderId,
      contractDeliveryItemId: currentId, // normalize
      productId: String(row.productId),
      quantity: row.quantity ?? 0,
      unitPrice: row.unitPrice ?? 0,
      discountAmount: row.discountAmount ?? 0,
      note: row.note ?? "",
    });

    setShowOrderItemDialog(true);
  };

  const handleDeleteItem = async () => {
    if (!itemToDelete?.orderItemId) return;
    try {
      setDeleting(true);
      await softDeleteOrderItem(itemToDelete.orderItemId);

      // Optimistic update
      setOrder((prev) =>
        prev
          ? {
              ...prev,
              orderItems: prev.orderItems.filter(
                (x) => x.orderItemId !== itemToDelete.orderItemId
              ),
            }
          : prev
      );

      toast.success(t('managerOrders.detail.actions.deleteSuccess'), {
        description: `${t('managerOrders.detail.actions.deleteMessage', { productName: itemToDelete.productName })}`,
      });

      setShowDeleteDialog(false);
      setItemToDelete(null);

      // đồng bộ lại từ BE (không phá toast nếu lỗi)
      reload().catch(() =>
        toast("Không tải lại dữ liệu được sau khi xoá. Bạn có thể F5 nếu cần.")
      );
    } catch (e: any) {
      const msg =
        e?.response?.data?.message || e?.message || t('managerOrders.detail.actions.deleteError');
      toast.error("Lỗi", { description: msg });
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse text-gray-500">{t('managerOrders.detail.loading')}</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-6">
        <div className="rounded-xl border bg-white p-8 text-center text-gray-600">
          {t('managerOrders.detail.error.notFound')}
          <div className="mt-4">
            <Button variant="outline" onClick={() => router.back()}>
              {t('managerOrders.detail.actions.back')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-orange-50 px-4 py-6 lg:px-20 flex justify-center">
      <div className="w-full max-w-6xl space-y-6">
        {/* Title / Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-2xl font-semibold text-gray-800">
            <Package className="text-orange-600 w-6 h-6" />
            <div className="flex flex-col">
              <span>{t('managerOrders.detail.title')}: {order.orderCode}</span>
              {order.deliveryBatchCode && (
                <span className="text-sm font-normal text-gray-600">
                  {t('managerOrders.detail.orderInfo.fields.deliveryRound')}{" "}
                  <span className="font-medium">{order.deliveryBatchCode}</span>
                </span>
              )}
            </div>
          </div>

          <Button
            className="bg-[#f59e0b] hover:bg-[#d97706] text-white font-medium px-4 py-2 rounded-lg shadow-md"
            onClick={() =>
              router.push(`/dashboard/manager/orders/${order.orderId}/edit`)
            }
          >
            {t('managerOrders.detail.actions.edit')}
          </Button>
        </div>

        <Separator className="border-t border-gray-200 my-2" />

        {/* Order Info */}
        <Card>
          <CardHeader>
            <CardTitle>{t('managerOrders.detail.orderInfo.title')}</CardTitle>
          </CardHeader>

          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <strong>{t('managerOrders.detail.orderInfo.fields.orderCode')}</strong> {order.orderCode}
            </div>
            <div>
              <strong>{t('managerOrders.detail.orderInfo.fields.contractNumber')}</strong> {order.contractNumber}
            </div>

            <div>
              <strong>{t('managerOrders.detail.orderInfo.fields.deliveryRound')}</strong>{" "}
              {order.deliveryRound != null ? String(order.deliveryRound) : "—"}
            </div>

            <div className="flex items-center gap-1">
              <strong>{t('managerOrders.detail.orderInfo.fields.deliveryDate')}</strong>
              <Tooltip content={t('managerOrders.detail.orderInfo.tooltips.deliveryDate')}>
                <Info className="w-3 h-3 text-gray-400" />
              </Tooltip>
              <span className="ml-1">
                {order.actualDeliveryDate
                  ? formatDate(order.actualDeliveryDate)
                  : order.orderDate
                  ? formatDate(order.orderDate)
                  : "—"}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <strong>{t('managerOrders.detail.orderInfo.fields.totalAmount')}</strong>
              <Tooltip content={t('managerOrders.detail.orderInfo.tooltips.totalAmount')}>
                <Info className="w-3 h-3 text-gray-400" />
              </Tooltip>
              <span className="ml-1">
                {order.totalAmount != null
                  ? formatCurrency(order.totalAmount)
                  : "—"}
              </span>
            </div>

            <div>
              <strong>{t('managerOrders.detail.orderInfo.fields.status')}</strong>
              <span
                className={`ml-2 px-2 py-1 rounded text-xs font-semibold ${
                  orderStatusBadgeMap[order.status]?.className
                }`}
              >
                {orderStatusBadgeMap[order.status]?.label ?? order.status}
              </span>
            </div>

            <div className="md:col-span-2">
              <strong>{t('managerOrders.detail.orderInfo.fields.note')}</strong> {order.note?.trim() ? order.note : "—"}
            </div>

            {order.cancelReason?.trim() && (
              <div className="md:col-span-2">
                <strong>{t('managerOrders.detail.orderInfo.fields.cancelReason')}</strong> {order.cancelReason}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Danh sách mặt hàng */}
        <div className="rounded-xl border bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold">{t('managerOrders.detail.productList.title')}</h2>
            <Button
              className="bg-black text-white hover:bg-gray-800"
              onClick={openCreateDialog}
            >
              {t('managerOrders.detail.productList.addItem')}
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full table-auto text-sm border border-gray-200">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  <th className="px-4 py-2 text-left whitespace-nowrap">
                    {t('managerOrders.detail.productList.headers.productName')}
                  </th>
                  <th className="px-4 py-2 text-center whitespace-nowrap">
                    {t('managerOrders.detail.productList.headers.quantity')}
                  </th>
                  <th className="px-4 py-2 text-center whitespace-nowrap">
                    {t('managerOrders.detail.productList.headers.unitPrice')}
                  </th>
                  <th className="px-4 py-2 text-center whitespace-nowrap">
                    {t('managerOrders.detail.productList.headers.discount')}
                  </th>
                  <th className="px-4 py-2 text-center whitespace-nowrap">
                    {t('managerOrders.detail.productList.headers.totalPrice')}
                  </th>
                  <th className="px-4 py-2 text-left">{t('managerOrders.detail.productList.headers.note')}</th>
                  <th className="px-4 py-2 text-center">{t('managerOrders.detail.productList.headers.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td className="py-8 text-center text-gray-500" colSpan={7}>
                      {t('managerOrders.detail.productList.empty')}
                    </td>
                  </tr>
                ) : (
                  paginated.map((it) => (
                    <tr
                      key={it.orderItemId}
                      className="border-t hover:bg-gray-50"
                    >
                      <td className="px-4 py-2">{it.productName}</td>
                      <td className="px-4 py-2 text-center">
                        {it.quantity != null
                          ? formatQuantity(it.quantity)
                          : "—"}
                      </td>
                      <td className="px-4 py-2 text-center">
                        {it.unitPrice != null
                          ? formatCurrency(it.unitPrice)
                          : "—"}
                      </td>
                      <td className="px-4 py-2 text-center">
                        {it.discountAmount != null
                          ? `${it.discountAmount}%`
                          : "—"}
                      </td>
                      <td className="px-4 py-2 text-center">
                        {it.totalPrice != null
                          ? formatCurrency(it.totalPrice)
                          : "—"}
                      </td>
                      <td className="px-4 py-2">{it.note || "—"}</td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <div className="flex justify-center gap-[2px]">
                          <Tooltip content={t('managerOrders.detail.actions.edit')}>
                            <Button
                              variant="ghost"
                              className="h-7 w-7 p-[2px]"
                              onClick={() => openEditDialog(it)}
                            >
                              <Pencil className="h-4 w-4 text-yellow-500" />
                            </Button>
                          </Tooltip>
                          <Tooltip content={t('managerOrders.detail.actions.delete')}>
                            <Button
                              variant="ghost"
                              className="h-7 w-7 p-[2px]"
                              onClick={() => {
                                setItemToDelete(it);
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
                {t('managerOrders.detail.pagination.showing')}{" "}
                <span className="font-medium">
                  {(currentPage - 1) * ITEMS_PER_PAGE + 1}
                </span>
                {t('managerOrders.detail.pagination.to')}
                <span className="font-medium">
                  {Math.min(currentPage * ITEMS_PER_PAGE, totalItems)}
                </span>{" "}
                {t('managerOrders.detail.pagination.of')} {totalItems} {t('managerOrders.detail.pagination.items')}
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
                  {t('managerOrders.detail.pagination.previous')}
                </Button>
                <span className="flex items-center px-2">
                  {t('managerOrders.detail.pagination.page')}{" "}
                  <span className="mx-1 font-semibold">{currentPage}</span> {t('managerOrders.detail.pagination.of')}{" "}
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
                  {t('managerOrders.detail.pagination.next')}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer nút quay lại */}
        <div className="flex justify-end mt-4">
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/manager/orders")}
          >
            {t('managerOrders.detail.actions.back')}
          </Button>
        </div>

        <OrderItemFormDialog
          open={showOrderItemDialog}
          onOpenChange={setShowOrderItemDialog}
          mode={dialogMode}
          orderId={order.orderId}
          orderCode={order.orderCode}
          contractDeliveryItems={contractDeliveryItems}
          products={products}
          initialData={editingItem}
          onSuccess={refetchOrderItems}
        />

        {/* Delete Item dialog */}
        <ConfirmDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          title={t('managerOrders.detail.actions.deleteConfirm')}
          description={
            <span>
              {t('managerOrders.detail.actions.deleteMessage', { productName: itemToDelete?.productName })}
            </span>
          }
          confirmText={deleting ? t('managerOrders.detail.actions.loading') : t('managerOrders.detail.actions.delete')}
          cancelText="Huỷ"
          onConfirm={handleDeleteItem}
          loading={deleting}
        />
      </div>
    </div>
  );
}

/** Hàng thông tin trái-phải gọn gàng */
function InfoRow({
  label,
  value,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="text-sm text-gray-600 font-medium">{label}</div>
      <div className="text-sm text-gray-900">{value}</div>
    </div>
  );
}
