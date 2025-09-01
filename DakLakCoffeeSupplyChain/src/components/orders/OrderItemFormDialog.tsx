"use client";

import { useEffect, useState, useMemo } from "react";
import {
  createOrderItem,
  updateOrderItem,
  OrderItemCreateForOrder,
  OrderItemUpdateDto,
} from "@/lib/api/orderItems";
import * as BaseDialog from "@/components/ui/dialog";
import { FormDialog } from "@/components/ui/formDialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { toast } from "sonner";
import axios from "axios";
import { useTranslation } from "react-i18next";

interface ContractDeliveryItemOption {
  contractDeliveryItemId: string;
  label: string;
}

interface ProductOption {
  productId: string;
  name: string;
}

interface OrderItemFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  orderId: string;
  orderCode?: string;
  contractDeliveryItems: ContractDeliveryItemOption[];
  products: ProductOption[];
  initialData?: OrderItemUpdateDto;
  onSuccess?: () => void;
}

export default function OrderItemFormDialog({
  open,
  onOpenChange,
  mode,
  orderId,
  orderCode,
  contractDeliveryItems,
  products,
  initialData,
  onSuccess,
}: OrderItemFormDialogProps) {
  const { t } = useTranslation();

  const [formData, setFormData] = useState<
    OrderItemCreateForOrder | OrderItemUpdateDto
  >({
    orderId,
    contractDeliveryItemId: "",
    productId: "",
    quantity: 0,
    unitPrice: 0,
    discountAmount: 0,
    note: "",
  });

  const [loading, setLoading] = useState(false);

  // helper trong file dialog
  const norm = (s: string | undefined | null) =>
    String(s ?? "")
      .trim()
      .toLowerCase();

  useEffect(() => {
    if (!open) return;

    if (mode === "edit" && initialData) {
      setFormData({
        orderId,
        orderItemId: (initialData as any).orderItemId,
        contractDeliveryItemId: norm(initialData.contractDeliveryItemId),
        productId: String(initialData.productId ?? ""),
        quantity: initialData.quantity ?? 0,
        unitPrice: initialData.unitPrice ?? 0,
        discountAmount: initialData.discountAmount ?? 0,
        note: initialData.note ?? "",
      } as OrderItemUpdateDto);
    } else {
      setFormData({
        orderId,
        contractDeliveryItemId: "",
        productId: "",
        quantity: 0,
        unitPrice: 0,
        discountAmount: 0,
        note: "",
      });
    }
  }, [open, mode, orderId, (initialData as any)?.orderItemId]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: ["quantity", "unitPrice", "discountAmount"].includes(name)
        ? Number(value)
        : value,
    }));
  };

  // dedupe options gốc (đã có)
  const cdiOptions = useMemo(() => {
    const seen = new Set<string>();
    return (contractDeliveryItems ?? [])
      .filter((o) => {
        const id = norm(o.contractDeliveryItemId);
        if (!id || seen.has(id)) return false;
        seen.add(id);
        return true;
      })
      .map((o) => ({
        ...o,
        contractDeliveryItemId: norm(o.contractDeliveryItemId),
      })); // normalize value lưu trong options luôn
  }, [contractDeliveryItems]);

  const productOptions = useMemo(() => {
    const seen = new Set<string>();
    return (products ?? []).filter((p) => {
      const id = String(p.productId ?? "");
      if (!id || seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  }, [products]);

  const mergedCdiOptions = useMemo(() => {
    const id = norm((formData as any).contractDeliveryItemId);
    const map = new Map(cdiOptions.map((o) => [o.contractDeliveryItemId, o]));
    if (id && !map.has(id)) {
      map.set(id, {
        contractDeliveryItemId: id,
        label: t(
          "managerOrders.detail.addOrderItem.labels.currentDeliveryItem"
        ),
      });
    }
    return Array.from(map.values());
  }, [cdiOptions, (formData as any).contractDeliveryItemId]);

  const handleSubmit = async () => {
    // Kiểm tra client-side
    if (!formData.contractDeliveryItemId) {
      toast.error(
        t(
          "managerOrders.detail.addOrderItem.validation.selectContractDeliveryItem"
        )
      );
      return;
    }

    if (!formData.productId) {
      toast.error(
        t("managerOrders.detail.addOrderItem.validation.selectProduct")
      );
      return;
    }

    if ((formData.quantity ?? 0) <= 0) {
      toast.error(
        t("managerOrders.detail.addOrderItem.validation.quantityRequired")
      );
      return;
    }

    if ((formData.unitPrice ?? 0) < 0) {
      toast.error(
        t("managerOrders.detail.addOrderItem.validation.unitPriceInvalid")
      );
      return;
    }

    if (
      (formData.discountAmount ?? 0) < 0 ||
      (formData.discountAmount ?? 0) > 100
    ) {
      toast.error(
        t("managerOrders.detail.addOrderItem.validation.discountRange")
      );
      return;
    }

    setLoading(true);
    try {
      if (mode === "create") {
        await createOrderItem(formData as OrderItemCreateForOrder);
        toast.success(
          t("managerOrders.detail.addOrderItem.messages.addSuccess")
        );
      } else {
        await updateOrderItem(formData as OrderItemUpdateDto);
        toast.success(
          t("managerOrders.detail.addOrderItem.messages.updateSuccess")
        );
      }

      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      let message = t(
        "managerOrders.detail.addOrderItem.messages.unknownError"
      );

      if (axios.isAxiosError(error)) {
        message =
          error.response?.data?.message ??
          t("managerOrders.detail.addOrderItem.messages.serverError", {
            status: error.response?.status,
          });
      } else if (error instanceof Error) {
        message = error.message;
      }

      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <BaseDialog.Dialog open={open} onOpenChange={onOpenChange}>
      <FormDialog.Content size="sm">
        <BaseDialog.DialogHeader className="px-5 pt-5 pb-0">
          <BaseDialog.DialogTitle>
            {mode === "create"
              ? t("managerOrders.detail.addOrderItem.title.create")
              : t("managerOrders.detail.addOrderItem.title.edit")}
          </BaseDialog.DialogTitle>
        </BaseDialog.DialogHeader>

        <div className="grid gap-2 px-5 py-4">
          {/* OrderCode: có thể ẩn hoặc hiển thị read-only để người dùng biết họ đang ở đơn hàng nào */}
          <div className="grid gap-1">
            <Label htmlFor="orderCode">
              {t("managerOrders.detail.addOrderItem.fields.orderCode")}
            </Label>
            <Input id="orderCode" value={orderCode ?? ""} disabled />
          </div>

          {/* Mặt hàng đợt giao */}
          <div className="grid gap-1">
            <Label htmlFor="contractDeliveryItemId">
              {t(
                "managerOrders.detail.addOrderItem.fields.contractDeliveryItem"
              )}{" "}
              <span className="text-red-500">*</span>
            </Label>
            <Select
              value={(formData.contractDeliveryItemId as string) || undefined}
              onValueChange={(value) => {
                setFormData((prev) => ({
                  ...prev,
                  contractDeliveryItemId: norm(value),
                }));
              }}
            >
              <SelectTrigger id="contractDeliveryItemId" className="w-full">
                <SelectValue
                  placeholder={t(
                    "managerOrders.detail.addOrderItem.placeholders.selectContractDeliveryItem"
                  )}
                />
              </SelectTrigger>
              <SelectContent>
                {mergedCdiOptions.map((it) => (
                  <SelectItem
                    key={it.contractDeliveryItemId}
                    value={it.contractDeliveryItemId}
                  >
                    {it.label || it.contractDeliveryItemId}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sản phẩm */}
          <div className="grid gap-1">
            <Label htmlFor="productId">
              {t("managerOrders.detail.addOrderItem.fields.product")}{" "}
              <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.productId || undefined}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, productId: value }))
              }
            >
              <SelectTrigger id="productId" className="w-full">
                <SelectValue
                  placeholder={t(
                    "managerOrders.detail.addOrderItem.placeholders.selectProduct"
                  )}
                />
              </SelectTrigger>
              <SelectContent>
                {productOptions.map((p) => (
                  <SelectItem
                    key={String(p.productId)} // key unique
                    value={String(p.productId)} // đảm bảo là string
                  >
                    {p.name || String(p.productId)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Số lượng (kg) */}
          <div className="grid gap-1">
            <Label htmlFor="quantity">
              {t("managerOrders.detail.addOrderItem.fields.quantity")}{" "}
              <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Input
                id="quantity"
                name="quantity"
                type="number"
                value={formData.quantity ?? 0}
                onChange={handleChange}
                min={0}
                step={1}
                placeholder={t(
                  "managerOrders.detail.addOrderItem.placeholders.quantity"
                )}
                className="pr-14"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                {t("managerOrders.detail.addOrderItem.units.kg")}
              </span>
            </div>
          </div>

          {/* Đơn giá (VNĐ/kg) */}
          <div className="grid gap-1">
            <Label htmlFor="unitPrice">
              {t("managerOrders.detail.addOrderItem.fields.unitPrice")}{" "}
              <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Input
                id="unitPrice"
                name="unitPrice"
                type="number"
                value={formData.unitPrice ?? 0}
                onChange={handleChange}
                min={0}
                step={100} // hoặc 1000 tuỳ quy định
                placeholder={t(
                  "managerOrders.detail.addOrderItem.placeholders.unitPrice"
                )}
                className="pr-24"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                {t("managerOrders.detail.addOrderItem.units.vndPerKg")}
              </span>
            </div>
          </div>

          {/* Chiết khấu (%) */}
          <div className="grid gap-1">
            <Label htmlFor="discountAmount">
              {t("managerOrders.detail.addOrderItem.fields.discountAmount")}
            </Label>
            <div className="relative">
              <Input
                id="discountAmount"
                name="discountAmount"
                type="number"
                value={formData.discountAmount ?? 0}
                onChange={handleChange}
                min={0}
                max={100}
                step={1}
                placeholder={t(
                  "managerOrders.detail.addOrderItem.placeholders.discountAmount"
                )}
                className="pr-10"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                {t("managerOrders.detail.addOrderItem.units.percent")}
              </span>
            </div>
          </div>

          <div className="grid gap-1">
            <Label htmlFor="note">
              {t("managerOrders.detail.addOrderItem.fields.note")}
            </Label>
            <Textarea
              id="note"
              name="note"
              value={formData.note ?? ""}
              onChange={handleChange}
              placeholder={t(
                "managerOrders.detail.addOrderItem.placeholders.note"
              )}
            />
          </div>
        </div>

        <div className="px-5 pb-5 flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            {t("managerOrders.detail.addOrderItem.actions.cancel")}
          </Button>
          <Button
            className="bg-orange-500 hover:bg-orange-600 text-white"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading
              ? t("managerOrders.detail.addOrderItem.actions.saving")
              : mode === "create"
              ? t("managerOrders.detail.addOrderItem.actions.add")
              : t("managerOrders.detail.addOrderItem.actions.update")}
          </Button>
        </div>
      </FormDialog.Content>
    </BaseDialog.Dialog>
  );
}
