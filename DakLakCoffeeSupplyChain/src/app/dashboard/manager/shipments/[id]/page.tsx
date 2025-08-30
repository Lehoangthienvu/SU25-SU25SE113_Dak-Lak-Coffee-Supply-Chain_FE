"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { Tooltip } from "@/components/ui/tooltip";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Pencil, Trash2 } from "lucide-react";
import { FiTruck } from "react-icons/fi";
import { ConfirmDialog } from "@/components/ui/confirmDialog";
import * as ShipmentsApi from "@/lib/api/shipments";
import type {
  ShipmentDetailViewDto,
  ShipmentViewDetailsDto,
} from "@/lib/api/shipments";
import { formatDate, formatQuantity } from "@/lib/utils";
import { useShipmentDeliveryStatusMap } from "@/lib/constants/shipmentDeliveryStatus";
import ShipmentDetailsFormDialog from "@/components/shipments/ShipmentDetailsFormDialog";
import { getOrderDetails } from "@/lib/api/orders";
import { useTranslation } from "react-i18next";

export default function ShipmentDetailPage() {
  const { t } = useTranslation();
  const params = useParams();
  const router = useRouter();
  const shipmentId = params.id as string;
  const statusMap = useShipmentDeliveryStatusMap();

  const [shipment, setShipment] = useState<ShipmentViewDetailsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const ITEMS_PER_PAGE = 5;
  const [currentPage, setCurrentPage] = useState(1);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [detailToDelete, setDetailToDelete] =
    useState<ShipmentDetailViewDto | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [editingDetail, setEditingDetail] =
    useState<ShipmentDetailViewDto | null>(null);
  const [orderItemOptions, setOrderItemOptions] = useState<
    { orderItemId: string; productName: string }[]
  >([]);
  const [orderCode, setOrderCode] = useState<string>("");

  const unitLabelMap: Record<string, string> = {
    Kg: "Kg",
    Ta: "Tạ",
    Tan: "Tấn",
  };

  useEffect(() => {
    if (!shipmentId) return;
    setLoading(true);
    ShipmentsApi.getShipmentDetails(shipmentId)
      .then((data) => {
        setShipment(data);
        setLoading(false);
        // Fetch order items for this shipment's order
        if (data?.orderId) {
          getOrderDetails(data.orderId)
            .then((order) => {
              setOrderItemOptions(order.orderItems || []);
              setOrderCode(order.orderCode);
            })
            .catch(() => {
              setOrderItemOptions([]);
            });
        }
      })
      .catch((err) => {
        setError(
          typeof err === "string" ? err : t('shipments.error.loadFailed')
        );
        setLoading(false);
      });
  }, [shipmentId, t]);

  // Prepare data for table consistently across renders
  const details = shipment?.shipmentDetails ?? [];
  const totalItems = details.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const paginatedItems = useMemo(
    () =>
      details.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
      ),
    [details, currentPage]
  );

  if (loading) {
    return (
      <div className="text-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !shipment) {
    return (
      <div className="p-8">
        <Card>
          <CardHeader>
            <CardTitle>{t('shipments.error.notFound')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-500 mb-3">
              {error || t('shipments.error.notFound')}
            </p>
            <Button onClick={() => router.back()}>{t('shipments.detail.backButton')}</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusMeta = statusMap[shipment.deliveryStatus];

  return (
    <div className="w-full min-h-screen bg-orange-50 px-4 py-6 lg:px-20 flex justify-center">
      <div className="w-full max-w-6xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-2xl font-semibold text-gray-800">
            <FiTruck className="text-orange-600 w-6 h-6" />
            <span>{t('shipments.detail.title', { shipmentCode: shipment.shipmentCode })}</span>
          </div>
          <Button
            className="bg-[#f59e0b] hover:bg-[#d97706] text-white font-medium px-4 py-2 rounded-lg shadow-md flex items-center gap-2"
            onClick={() =>
              router.push(
                `/dashboard/manager/shipments/${shipment.shipmentId}/edit`
              )
            }
          >
            {t('shipments.detail.editButton')}
          </Button>
        </div>

        <Separator className="border-t border-gray-200 my-2" />

        <Card>
          <CardHeader>
            <CardTitle>{t('shipments.detail.shipmentInfo')}</CardTitle>
          </CardHeader>

          <CardContent className="grid grid-cols-2 md:grid-cols-2 gap-4 text-sm">
            <div>
              <strong>{t('shipments.detail.shipmentCode')}:</strong> {shipment.shipmentCode}
            </div>
            <div>
              <strong>{t('shipments.detail.order')}:</strong> {shipment.orderCode}
            </div>
            <div>
              <strong>{t('shipments.detail.deliveryStaff')}:</strong> {shipment.deliveryStaffName}
            </div>
            <div>
              <strong>{t('shipments.detail.shippedQuantity')}:</strong>{" "}
              {shipment.shippedQuantity !== undefined &&
              shipment.shippedQuantity !== null
                ? formatQuantity(shipment.shippedQuantity)
                : "-"}
            </div>
            <div>
              <strong>{t('shipments.detail.shippedAt')}:</strong>{" "}
              {formatDate(shipment.shippedAt as any)}
            </div>
            <div>
              <strong>{t('shipments.detail.receivedAt')}:</strong>{" "}
              {formatDate(shipment.receivedAt as any)}
            </div>
            <div className="col-span-2">
              <strong>{t('shipments.detail.status')}:</strong>
              <span
                className={`ml-2 px-2 py-1 rounded text-xs font-semibold bg-${statusMeta.color}-100 text-${statusMeta.color}-700`}
              >
                {statusMeta.label}
              </span>
            </div>
            <div>
              <strong>{t('shipments.detail.createdAt')}:</strong> {formatDate(shipment.createdAt)}
            </div>
            <div>
              <strong>{t('shipments.detail.createdBy')}:</strong> {shipment.createdByName}
            </div>
          </CardContent>
        </Card>

        {/* Danh sách mặt hàng trong lô giao */}
        <div className="rounded-xl border bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold">{t('shipments.detail.productList')}</h2>
            <Button
              className="bg-black text-white hover:bg-gray-800"
              onClick={() => {
                setEditingDetail(null);
                setShowDetailsDialog(true);
              }}
            >
              {t('shipments.detail.addProduct')}
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full table-auto text-sm border border-gray-200">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  <th className="px-4 py-2 text-left whitespace-nowrap">
                    {t('shipments.detail.table.product')}
                  </th>
                  <th className="px-4 py-2 text-center whitespace-nowrap">
                    {t('shipments.detail.table.quantity')}
                  </th>
                  <th className="px-4 py-2 text-center whitespace-nowrap">
                    {t('shipments.detail.table.unit')}
                  </th>
                  <th className="px-4 py-2 text-left">{t('shipments.detail.table.note')}</th>
                  <th className="px-4 py-2 text-center">{t('shipments.detail.table.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {(shipment.shipmentDetails ?? []).length === 0 ? (
                  <tr>
                    <td className="py-8 text-center text-gray-500" colSpan={5}>
                      {t('shipments.detail.noProducts')}
                    </td>
                  </tr>
                ) : (
                  paginatedItems.map((item) => (
                    <tr
                      key={item.shipmentDetailId}
                      className="border-t hover:bg-gray-50"
                    >
                      <td className="px-4 py-2">{item.productName}</td>
                      <td className="px-4 py-2 text-center">
                        {item.quantity !== undefined && item.quantity !== null
                          ? Number(item.quantity).toLocaleString()
                          : "—"}
                      </td>
                      <td className="px-4 py-2 text-center">
                        {unitLabelMap[item.unit] ?? item.unit}
                      </td>
                      <td className="px-4 py-2">{item.note || "—"}</td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <div className="flex justify-center gap-[2px]">
                          <Tooltip content={t('shipments.detail.editProduct')}>
                            <Button
                              variant="ghost"
                              className="h-7 w-7 p-[2px]"
                              onClick={() => {
                                setEditingDetail(item);
                                setShowDetailsDialog(true);
                              }}
                            >
                              <Pencil className="h-4 w-4 text-yellow-500" />
                            </Button>
                          </Tooltip>
                          <Tooltip content={t('shipments.detail.deleteProduct')}>
                            <Button
                              variant="ghost"
                              className="h-7 w-7 p-[2px]"
                              onClick={() => {
                                setDetailToDelete(item);
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

          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mt-4 px-4 py-2 bg-gray-50 border rounded-md text-sm text-gray-700">
              <div className="text-sm text-gray-600">
                {t('shipments.detail.pagination.showing')}{" "}
                <span className="font-medium">
                  {(currentPage - 1) * ITEMS_PER_PAGE + 1}
                </span>
                –
                <span className="font-medium">
                  {Math.min(currentPage * ITEMS_PER_PAGE, totalItems)}
                </span>{" "}
                {t('shipments.detail.pagination.of')} {totalItems} {t('shipments.detail.pagination.products')}
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
                  {t('shipments.detail.pagination.previous')}
                </Button>
                <span className="flex items-center px-2">
                  {t('shipments.detail.pagination.page')}{" "}
                  <span className="mx-1 font-semibold">{currentPage}</span> {t('shipments.detail.pagination.of')}{" "}
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
                  {t('shipments.detail.pagination.next')}
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end mt-4">
          <Button variant="outline" onClick={() => router.back()}>
            {t('shipments.detail.backButton')}
          </Button>
        </div>

        <ShipmentDetailsFormDialog
          open={showDetailsDialog}
          onOpenChange={setShowDetailsDialog}
          mode={editingDetail ? "edit" : "create"}
          shipmentId={shipment.shipmentId}
          orderCode={orderCode || shipment.orderCode}
          orderItems={orderItemOptions.map((oi) => ({
            orderItemId: oi.orderItemId,
            label: oi.productName,
          }))}
          initialData={editingDetail ?? undefined}
          onSuccess={async () => {
            // refetch để đồng bộ dữ liệu mới nhất
            const refreshed = await ShipmentsApi.getShipmentDetails(
              shipment.shipmentId
            );
            setShipment(refreshed);
            // refresh order items as well
            if (refreshed?.orderId) {
              try {
                const order = await getOrderDetails(refreshed.orderId);
                setOrderItemOptions(order.orderItems || []);
                setOrderCode(order.orderCode);
              } catch {
                // ignore
              }
            }
          }}
        />

        <ConfirmDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          title={t('shipments.detail.deleteDialog.title')}
          description={
            <span>
              {t('shipments.detail.deleteDialog.description', { 
                productName: detailToDelete?.productName ?? t('shipments.detail.table.product').toLowerCase()
              })}
            </span>
          }
          confirmText={t('shipments.detail.deleteDialog.confirm')}
          cancelText={t('shipments.detail.deleteDialog.cancel')}
          onConfirm={async () => {
            if (!detailToDelete) return;
            try {
              await ShipmentsApi.softDeleteShipmentDetail(
                detailToDelete.shipmentDetailId
              );
              setShipment((prev) =>
                prev
                  ? {
                      ...prev,
                      shipmentDetails: (prev.shipmentDetails || []).filter(
                        (d) =>
                          d.shipmentDetailId !== detailToDelete.shipmentDetailId
                      ),
                    }
                  : prev
              );
            } catch (err) {
              console.error(err);
              alert(t('shipments.detail.error.loadFailed'));
            } finally {
              setShowDeleteDialog(false);
              setDetailToDelete(null);
            }
          }}
        />
      </div>
    </div>
  );
}
