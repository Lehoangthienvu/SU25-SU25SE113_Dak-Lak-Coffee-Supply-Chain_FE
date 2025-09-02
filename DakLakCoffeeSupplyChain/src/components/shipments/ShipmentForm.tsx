"use client";

import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { DialogFooter } from "@/components/ui/dialog";
import { DatePicker } from "@/components/ui/DatePicker";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { getOrderDetails, getAllOrders } from "@/lib/api/orders";
import {
  ShipmentCreateDto,
  ShipmentUpdateDto,
  createShipment,
  updateShipment,
} from "@/lib/api/shipments";
import {
  useShipmentDeliveryStatusMap,
  ShipmentDeliveryStatusValue,
} from "@/lib/constants/shipmentDeliveryStatus";
import { fromDateOnly, toDateOnly } from "@/lib/utils";
import { useTranslation } from "react-i18next";

type Props = {
  initialData?: ShipmentUpdateDto;
  onSuccess: () => void;
  orderId?: string; // nếu tạo theo một đơn hàng có sẵn
  deliveryStaffOptions?: { deliveryStaffId: string; name: string }[];
  orderCodeDisplay?: string; // dùng cho trang edit để hiển thị code thay vì GUID
};

type FormState = {
  orderId: string;
  deliveryStaffId: string;
  shippedQuantity?: number | null;
  shippedAt?: Date | undefined;
  deliveryStatus: ShipmentDeliveryStatusValue;
  receivedAt?: Date | undefined;
  shipmentDetails: {
    shipmentDetailId?: string;
    orderItemId: string;
    quantity: number;
    unit: string;
    note?: string;
  }[];
};

type ValidationErrors = {
  [key: string]: string;
};

export default function ShipmentForm({
  initialData,
  onSuccess,
  orderId,
  deliveryStaffOptions = [],
  orderCodeDisplay,
}: Props) {
  const { t } = useTranslation();
  const isEdit = !!initialData?.shipmentId;
  const router = useRouter();

  const [formData, setFormData] = useState<FormState | null>(null);
  const [orderItems, setOrderItems] = useState<
    { orderItemId: string; productName: string; quantity: number }[]
  >([]);
  const [orderOptions, setOrderOptions] = useState<
    { orderId: string; orderCode: string }[]
  >([]);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
    {}
  );

  useEffect(() => {
    if (initialData) {
      setFormData({
        orderId: initialData.orderId,
        deliveryStaffId: initialData.deliveryStaffId,
        shippedQuantity: initialData.shippedQuantity ?? null,
        shippedAt: initialData.shippedAt
          ? new Date(initialData.shippedAt)
          : undefined,
        deliveryStatus: initialData.deliveryStatus,
        receivedAt: initialData.receivedAt
          ? new Date(initialData.receivedAt)
          : undefined,
        shipmentDetails: (initialData.shipmentDetails || []).map((d: any) => ({
          shipmentDetailId: d.shipmentDetailId,
          orderItemId: d.orderItemId,
          quantity: d.quantity ?? 0,
          unit: String(d.unit ?? "Kg"),
          note: d.note ?? "",
        })),
      });
    } else {
      setFormData({
        orderId: orderId ?? "",
        deliveryStaffId: "",
        shippedQuantity: null,
        shippedAt: undefined,
        deliveryStatus: "Pending",
        receivedAt: undefined,
        shipmentDetails: [],
      });
    }
  }, [initialData, orderId]);

  // load order items for selected orderId
  useEffect(() => {
    const oid = formData?.orderId;
    if (!oid) {
      setOrderItems([]);
      return;
    }
    (async () => {
      try {
        const detail = await getOrderDetails(oid);
        setOrderItems(
          (detail.orderItems || []).map((item: any) => ({
            orderItemId: item.orderItemId,
            productName: item.productName,
            quantity: item.quantity || 0,
          }))
        );
      } catch (e) {
        console.error(e);
        toast.error(t("shipments.form.validation.loadOrderItemsFailed"));
      }
    })();
  }, [formData?.orderId, t]);

  // load order list for dropdown when creating
  useEffect(() => {
    if (isEdit) return; // edit: giữ nguyên orderId
    (async () => {
      try {
        const list = await getAllOrders();
        setOrderOptions(
          (list || []).map((o) => ({
            orderId: o.orderId,
            orderCode: o.orderCode,
          }))
        );
      } catch {
        setOrderOptions([]);
      }
    })();
  }, [isEdit]);

  if (!formData) {
    return (
      <div className="text-gray-500 text-center py-10">
        {t("shipments.form.loading")}
      </div>
    );
  }

  // Validation functions
  const validateForm = (): ValidationErrors => {
    const errors: ValidationErrors = {};
    const now = new Date();
    const maxShipFutureDays = 15;
    const maxReceiveFutureDays = 25;

    // Required fields validation
    if (!formData.orderId) {
      errors.orderId = t("shipments.form.validation.orderIdRequired");
    }

    if (!formData.deliveryStaffId) {
      errors.deliveryStaffId = t(
        "shipments.form.validation.deliveryStaffIdRequired"
      );
    }

    if (!formData.shippedAt) {
      errors.shippedAt = t("shipments.form.validation.shippedAtRequired");
    }

    // Date validation
    if (formData.shippedAt) {
      const maxShipDate = new Date();
      maxShipDate.setDate(now.getDate() + maxShipFutureDays);

      if (formData.shippedAt > maxShipDate) {
        errors.shippedAt = t("shipments.form.validation.shippedAtMaxFuture", {
          days: maxShipFutureDays,
        });
      }
    }

    if (formData.receivedAt) {
      const maxReceiveDate = new Date();
      maxReceiveDate.setDate(now.getDate() + maxReceiveFutureDays);

      if (formData.receivedAt > maxReceiveDate) {
        errors.receivedAt = t("shipments.form.validation.receivedAtMaxFuture", {
          days: maxReceiveFutureDays,
        });
      }
    }

    // Date logic validation
    if (
      formData.shippedAt &&
      formData.receivedAt &&
      formData.receivedAt < formData.shippedAt
    ) {
      errors.receivedAt = t(
        "shipments.form.validation.receivedAtAfterShippedAt"
      );
    }

    // Quantity validation
    if (
      formData.shippedQuantity !== null &&
      formData.shippedQuantity !== undefined
    ) {
      if (formData.shippedQuantity <= 0) {
        errors.shippedQuantity = t(
          "shipments.form.validation.shippedQuantityPositive"
        );
      }
    }

    // Shipment details validation
    if (!formData.shipmentDetails || formData.shipmentDetails.length === 0) {
      errors.shipmentDetails = t(
        "shipments.form.validation.shipmentDetailsRequired"
      );
    } else {
      // Check for duplicate order items
      const orderItemIds = formData.shipmentDetails.map((d) => d.orderItemId);
      const duplicateIds = orderItemIds.filter(
        (id, index) => orderItemIds.indexOf(id) !== index
      );

      if (duplicateIds.length > 0) {
        errors.shipmentDetails = t(
          "shipments.form.validation.duplicateOrderItems"
        );
      }

      // Validate each detail
      formData.shipmentDetails.forEach((detail, index) => {
        if (!detail.orderItemId) {
          errors[`shipmentDetails.${index}.orderItemId`] = t(
            "shipments.form.validation.orderItemIdRequired"
          );
        }

        if (!detail.quantity || detail.quantity <= 0) {
          errors[`shipmentDetails.${index}.quantity`] = t(
            "shipments.form.validation.quantityPositive"
          );
        }

        if (!detail.unit) {
          errors[`shipmentDetails.${index}.unit`] = t(
            "shipments.form.validation.unitRequired"
          );
        }

        // Note length validation
        if (detail.note && detail.note.length > 1000) {
          errors[`shipmentDetails.${index}.note`] = t(
            "shipments.form.validation.noteMaxLength",
            { maxLength: 1000 }
          );
        }

        // Check if quantity exceeds available quantity
        const orderItem = orderItems.find(
          (item) => item.orderItemId === detail.orderItemId
        );
        if (orderItem && detail.quantity > orderItem.quantity) {
          errors[`shipmentDetails.${index}.quantity`] = t(
            "shipments.form.validation.quantityExceedsAvailable",
            {
              available: orderItem.quantity,
              productName: orderItem.productName,
            }
          );
        }
      });
    }

    return errors;
  };

  const handleChange = (field: keyof FormState, value: any) => {
    setFormData((prev) => ({ ...(prev as FormState), [field]: value }));

    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const ensureDetails = () =>
    setFormData((prev) => ({
      ...(prev as FormState),
      shipmentDetails: Array.isArray(prev?.shipmentDetails)
        ? (prev as FormState).shipmentDetails
        : [],
    }));

  const addRow = () => {
    ensureDetails();
    setFormData((prev) => ({
      ...(prev as FormState),
      shipmentDetails: [
        ...((prev as FormState).shipmentDetails || []),
        { orderItemId: "", quantity: 0, unit: "Kg", note: "" },
      ],
    }));
  };

  const updateRow = (
    index: number,
    field: "orderItemId" | "quantity" | "unit" | "note",
    value: any
  ) => {
    setFormData((prev) => {
      const base = { ...(prev as FormState) };
      const arr = [...(base.shipmentDetails || [])];
      arr[index] = {
        ...arr[index],
        [field]: field === "quantity" ? Number(value) : value,
      };
      base.shipmentDetails = arr;
      return base;
    });

    // Clear validation error for this field
    const errorKey = `shipmentDetails.${index}.${field}`;
    if (validationErrors[errorKey]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        return newErrors;
      });
    }
  };

  const removeRow = (index: number) =>
    setFormData((prev) => {
      const base = { ...(prev as FormState) };
      const arr = [...(base.shipmentDetails || [])];
      arr.splice(index, 1);
      base.shipmentDetails = arr;
      return base;
    });

  const sumQuantity = () =>
    (formData.shipmentDetails || []).reduce(
      (acc, x) => acc + (Number(x.quantity) || 0),
      0
    );

  const getFieldError = (fieldName: string): string | undefined => {
    return validationErrors[fieldName];
  };

  const hasFieldError = (fieldName: string): boolean => {
    return !!validationErrors[fieldName];
  };

  const getShipmentDetailError = (
    index: number,
    field: string
  ): string | undefined => {
    return validationErrors[`shipmentDetails.${index}.${field}`];
  };

  const hasShipmentDetailError = (index: number, field: string): boolean => {
    return !!validationErrors[`shipmentDetails.${index}.${field}`];
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    // Clear previous errors
    setValidationErrors({});

    // Validate form
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      toast.error(t("shipments.form.validation.checkFormErrors"));
      return;
    }

    if (!formData) {
      toast.error(t("shipments.form.validation.formNotReady"));
      return;
    }

    const data: FormState = formData;
    const shippedAtStr = data.shippedAt
      ? toDateOnly(data.shippedAt)
      : undefined;
    const receivedAtStr = data.receivedAt
      ? toDateOnly(data.receivedAt)
      : undefined;

    try {
      if (isEdit && initialData) {
        const payload: ShipmentUpdateDto = {
          shipmentId: (initialData as any).shipmentId,
          orderId: data.orderId,
          deliveryStaffId: data.deliveryStaffId,
          shippedQuantity: data.shippedQuantity ?? null,
          shippedAt: shippedAtStr as any,
          deliveryStatus: data.deliveryStatus,
          receivedAt: receivedAtStr as any,
          shipmentDetails: (data.shipmentDetails || []).map((d) => ({
            shipmentDetailId: d.shipmentDetailId as string,
            shipmentId: (initialData as any).shipmentId,
            orderItemId: d.orderItemId,
            quantity: d.quantity,
            unit: d.unit,
            note: d.note || "",
          })) as any,
        };
        console.log("[ShipmentForm] Update payload:", payload);
        await updateShipment(payload.shipmentId, payload);
        toast.success(t("shipments.form.success.update"));
        console.log("[ShipmentForm] Update success");
      } else {
        const payload: ShipmentCreateDto = {
          orderId: data.orderId,
          deliveryStaffId: data.deliveryStaffId,
          shippedQuantity: data.shippedQuantity ?? null,
          shippedAt: shippedAtStr as any,
          deliveryStatus: data.deliveryStatus,
          receivedAt: receivedAtStr as any,
          shipmentDetails: (data.shipmentDetails || []).map((d) => ({
            orderItemId: d.orderItemId,
            quantity: d.quantity,
            unit: d.unit,
            note: d.note || "",
          })) as any,
        };
        console.log("[ShipmentForm] Create payload:", payload);
        const newId = await createShipment(payload);
        toast.success(t("shipments.form.success.create"));
        console.log("[ShipmentForm] Create success id=", newId);
      }
      onSuccess();
    } catch (err: any) {
      console.error("[ShipmentForm] Error:", err);

      // Handle backend validation errors
      if (err?.response?.data?.errors) {
        const backendErrors = err.response.data.errors;
        const newValidationErrors: ValidationErrors = {};

        Object.entries(backendErrors).forEach(([field, messages]) => {
          if (Array.isArray(messages) && messages.length > 0) {
            const message = messages[0];

            // Map backend field names to frontend field names
            if (field.startsWith("ShipmentDetails[") && field.includes("].")) {
              const match = field.match(/ShipmentDetails\[(\d+)\]\.(\w+)/);
              if (match) {
                const index = match[1];
                const itemField = match[2];
                newValidationErrors[
                  `shipmentDetails.${index}.${itemField.toLowerCase()}`
                ] = message;
              }
            } else {
              newValidationErrors[field.toLowerCase()] = message;
            }
          }
        });

        if (Object.keys(newValidationErrors).length > 0) {
          setValidationErrors(newValidationErrors);
          toast.error(t("shipments.form.validation.backendValidationErrors"));
          return;
        }
      }

      if (err?.response) {
        console.error("[ShipmentForm] Error response:", err.response?.data);
      }
      toast.error(t("shipments.form.validation.saveFailed"));
    }
  }

  const shippedStr = toDateOnly(formData.shippedAt);
  const receivedStr = toDateOnly(formData.receivedAt);

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-5xl mx-auto bg-white border rounded-2xl shadow p-8 space-y-8"
    >
      <h2 className="text-2xl font-semibold text-center mb-6">
        {isEdit
          ? t("shipments.form.title.edit")
          : t("shipments.form.title.create")}
      </h2>

      {/* Đơn hàng + Nhân viên giao */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">
            {t("shipments.form.order")} <span className="text-red-500">*</span>
          </label>
          {isEdit ? (
            <Input
              value={orderCodeDisplay || formData.orderId}
              disabled
              className="h-10"
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <select
                className={`w-full p-2 border rounded h-10 ${
                  hasFieldError("orderId") ? "border-red-500" : ""
                }`}
                value={formData.orderId}
                onChange={(e) => handleChange("orderId", e.target.value)}
              >
                <option value="">{t("shipments.form.selectOrder")}</option>
                {orderOptions.map((o) => (
                  <option key={o.orderId} value={o.orderId}>
                    {o.orderCode}
                  </option>
                ))}
              </select>
              <Input
                placeholder={t("shipments.form.orderCodePlaceholder")}
                className="h-10"
                onChange={(e) => {
                  const code = e.target.value.trim().toLowerCase();
                  const found = orderOptions.find(
                    (o) => o.orderCode.toLowerCase() === code
                  );
                  if (found) handleChange("orderId", found.orderId);
                }}
              />
            </div>
          )}
          {hasFieldError("orderId") && (
            <p className="text-red-500 text-xs mt-1">
              {getFieldError("orderId")}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">
            {t("shipments.form.deliveryStaff")}{" "}
            <span className="text-red-500">*</span>
          </label>
          <select
            className={`w-full p-2 border rounded h-10 ${
              hasFieldError("deliveryStaffId") ? "border-red-500" : ""
            }`}
            value={formData.deliveryStaffId}
            onChange={(e) => handleChange("deliveryStaffId", e.target.value)}
          >
            <option value="">{t("shipments.form.selectStaff")}</option>
            {deliveryStaffOptions.map((s) => (
              <option key={s.deliveryStaffId} value={s.deliveryStaffId}>
                {s.name}
              </option>
            ))}
          </select>
          {hasFieldError("deliveryStaffId") && (
            <p className="text-red-500 text-xs mt-1">
              {getFieldError("deliveryStaffId")}
            </p>
          )}
        </div>
      </div>

      {/* Thông tin giao hàng */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Số lượng đã giao - chỉ hiển thị khi EDIT */}
        {isEdit && (
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">
              {t("shipments.form.shippedQuantity")}
            </label>
            <Input
              type="number"
              min={0}
              step={0.1}
              value={formData.shippedQuantity ?? 0}
              onChange={(e) =>
                handleChange("shippedQuantity", Number(e.target.value))
              }
              className={`h-10 ${
                hasFieldError("shippedQuantity") ? "border-red-500" : ""
              }`}
            />
            {hasFieldError("shippedQuantity") && (
              <p className="text-red-500 text-xs mt-1">
                {getFieldError("shippedQuantity")}
              </p>
            )}
          </div>
        )}

        <div
          className={`flex flex-col gap-2 ${!isEdit ? "md:col-span-2" : ""}`}
        >
          <label className="text-sm font-medium">
            {t("shipments.form.status")}
          </label>
          {!isEdit ? (
            // CREATE: cứng "Đang chờ", không thể thay đổi
            <Input
              value={t("shipments.status.pending")}
              readOnly
              className="h-10 bg-muted/40 cursor-not-allowed"
            />
          ) : (
            // EDIT: có thể chọn trạng thái
            <select
              className="w-full p-2 border rounded h-10"
              value={formData.deliveryStatus}
              onChange={(e) =>
                handleChange(
                  "deliveryStatus",
                  e.target.value as ShipmentDeliveryStatusValue
                )
              }
            >
              {/* Chỉ cho phép chọn các trạng thái hợp lệ khi tạo/sửa */}
              <option value="Pending">{t("shipments.status.pending")}</option>
              <option value="InTransit">
                {t("shipments.status.inTransit")}
              </option>
              <option value="Delivered">
                {t("shipments.status.delivered")}
              </option>
            </select>
          )}
        </div>
      </div>

      {/* Date pickers nhóm cuối bên trái */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">
            {t("shipments.form.shippedAt")}{" "}
            <span className="text-red-500">*</span>
          </label>
          <DatePicker
            className={`h-10 ${
              hasFieldError("shippedAt") ? "border-red-500" : ""
            }`}
            value={shippedStr}
            onChange={(d) => handleChange("shippedAt", fromDateOnly(d))}
          />
          {hasFieldError("shippedAt") && (
            <p className="text-red-500 text-xs mt-1">
              {getFieldError("shippedAt")}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">
            {t("shipments.form.receivedAt")}
          </label>
          <DatePicker
            className={`h-10 ${
              hasFieldError("receivedAt") ? "border-red-500" : ""
            }`}
            value={receivedStr}
            onChange={(d) => handleChange("receivedAt", fromDateOnly(d))}
          />
          {hasFieldError("receivedAt") && (
            <p className="text-red-500 text-xs mt-1">
              {getFieldError("receivedAt")}
            </p>
          )}
        </div>
      </div>

      {/* Danh sách sản phẩm giao */}
      <div>
        <label className="block mb-1 text-sm font-medium">
          {t("shipments.form.productList")}{" "}
          <span className="text-red-500">*</span>
        </label>

        {/* Hiển thị lỗi tổng quát cho shipment details */}
        {hasFieldError("shipmentDetails") && (
          <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600 text-sm font-medium">
              {getFieldError("shipmentDetails")}
            </p>
          </div>
        )}

        {(formData.shipmentDetails?.length ?? 0) > 0 && (
          <div className="hidden md:grid md:grid-cols-6 gap-3 mb-1 text-xs font-medium text-muted-foreground">
            <span>
              {t("shipments.form.table.orderItem")}{" "}
              <span className="text-red-500">*</span>
            </span>
            <span className="text-left">
              {t("shipments.form.table.quantity")}{" "}
              <span className="text-red-500">*</span>
            </span>
            <span>{t("shipments.form.table.unit")}</span>
            <span className="col-span-3">{t("shipments.form.table.note")}</span>
          </div>
        )}

        {(formData.shipmentDetails || []).map((row, idx) => (
          <div key={idx} className="grid grid-cols-1 md:grid-cols-6 gap-3 mb-2">
            <select
              value={row.orderItemId}
              onChange={(e) => {
                const orderItemId = e.target.value;
                updateRow(idx, "orderItemId", orderItemId);

                // Tự động cập nhật số lượng từ orderItem tương ứng
                if (orderItemId) {
                  const selectedItem = orderItems.find(
                    (item) => item.orderItemId === orderItemId
                  );
                  if (selectedItem) {
                    updateRow(idx, "quantity", selectedItem.quantity);
                  }
                }
              }}
              className={`p-2 border rounded h-10 ${
                hasShipmentDetailError(idx, "orderItemId")
                  ? "border-red-500"
                  : ""
              }`}
            >
              <option value="">{t("shipments.form.selectOrderItem")}</option>
              {orderItems.map((opt) => (
                <option key={opt.orderItemId} value={opt.orderItemId}>
                  {opt.productName}
                </option>
              ))}
            </select>
            {hasShipmentDetailError(idx, "orderItemId") && (
              <p className="text-red-500 text-xs mt-1 md:col-span-6">
                {getShipmentDetailError(idx, "orderItemId")}
              </p>
            )}

            <Input
              type="number"
              min={0}
              step={0.1}
              value={row.quantity ?? 0}
              onChange={(e) => updateRow(idx, "quantity", e.target.value)}
              className={`no-spinner text-left h-10 ${
                hasShipmentDetailError(idx, "quantity") ? "border-red-500" : ""
              }`}
            />
            {hasShipmentDetailError(idx, "quantity") && (
              <p className="text-red-500 text-xs mt-1 md:col-span-6">
                {getShipmentDetailError(idx, "quantity")}
              </p>
            )}

            <select
              value={row.unit}
              onChange={(e) => updateRow(idx, "unit", e.target.value)}
              className={`p-2 border rounded h-10 ${
                hasShipmentDetailError(idx, "unit") ? "border-red-500" : ""
              }`}
            >
              <option value="Kg">Kg</option>
              <option value="Ta">Tạ</option>
              <option value="Tan">Tấn</option>
            </select>
            {hasShipmentDetailError(idx, "unit") && (
              <p className="text-red-500 text-xs mt-1 md:col-span-6">
                {getShipmentDetailError(idx, "unit")}
              </p>
            )}

            <Input
              placeholder={t("shipments.form.notePlaceholder")}
              value={row.note || ""}
              onChange={(e) => updateRow(idx, "note", e.target.value)}
              className={`md:col-span-2 h-10 ${
                hasShipmentDetailError(idx, "note") ? "border-red-500" : ""
              }`}
            />
            {hasShipmentDetailError(idx, "note") && (
              <p className="text-red-500 text-xs mt-1 md:col-span-6">
                {getShipmentDetailError(idx, "note")}
              </p>
            )}

            <Button
              type="button"
              variant="destructive"
              onClick={() => removeRow(idx)}
              className="h-10"
            >
              {t("shipments.form.delete")}
            </Button>
          </div>
        ))}

        <div className="flex items-center justify-between mt-2">
          <Button
            type="button"
            variant="outline"
            onClick={addRow}
            disabled={!formData.orderId}
          >
            {t("shipments.form.addRow")}
          </Button>
          <div className="text-sm text-gray-600">
            {t("shipments.form.totalQuantity")}{" "}
            <strong>{sumQuantity().toLocaleString()}</strong>{" "}
            {t("shipments.form.kg")}
          </div>
        </div>
      </div>

      <DialogFooter className="flex justify-between pt-4">
        <Button type="submit">
          <h2>
            {isEdit
              ? t("shipments.form.buttons.save")
              : t("shipments.form.buttons.create")}
          </h2>
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          {t("shipments.form.buttons.back")}
        </Button>
      </DialogFooter>
    </form>
  );
}
