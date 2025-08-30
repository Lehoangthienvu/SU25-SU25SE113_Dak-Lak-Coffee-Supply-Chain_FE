"use client";

import { useEffect, useMemo, useState } from "react";
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
import {
  createShipmentDetail,
  updateShipmentDetail,
  ShipmentDetailCreateDto,
  ShipmentDetailUpdateDto,
  ShipmentDetailViewDto,
} from "@/lib/api/shipments";
import axios from "axios";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

export interface OrderItemOption {
  orderItemId: string;
  label: string;
}

interface ShipmentDetailsFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  shipmentId: string;
  orderCode?: string;
  orderItems: OrderItemOption[];
  initialData?: ShipmentDetailViewDto;
  onSuccess?: () => void;
}

export default function ShipmentDetailsFormDialog({
  open,
  onOpenChange,
  mode,
  shipmentId,
  orderCode,
  orderItems,
  initialData,
  onSuccess,
}: ShipmentDetailsFormDialogProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<
    ShipmentDetailCreateDto | ShipmentDetailUpdateDto
  >({
    shipmentId,
    orderItemId: "",
    quantity: 0,
    unit: "Kg",
    note: "",
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && initialData) {
      setFormData({
        shipmentDetailId: initialData.shipmentDetailId,
        shipmentId,
        orderItemId: initialData.orderItemId,
        quantity: initialData.quantity ?? 0,
        unit: String(initialData.unit ?? "Kg"),
        note: initialData.note ?? "",
      } as ShipmentDetailUpdateDto);
    } else {
      setFormData({
        shipmentId,
        orderItemId: "",
        quantity: 0,
        unit: "Kg",
        note: "",
      });
    }
  }, [open, mode, shipmentId, (initialData as any)?.shipmentDetailId]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "quantity" ? Number(value) : value,
    }));
  };

  const orderItemOptions = useMemo(() => {
    const seen = new Set<string>();
    return (orderItems ?? []).filter((o) => {
      const id = String(o.orderItemId || "");
      if (!id || seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  }, [orderItems]);

  const handleSubmit = async () => {
    if (!formData.orderItemId) {
      toast.error(t('shipments.detailsForm.validation.selectOrderItem'));
      return;
    }
    if ((formData.quantity ?? 0) <= 0) {
      toast.error(t('shipments.detailsForm.validation.quantityRequired'));
      return;
    }
    if (!formData.unit) {
      toast.error(t('shipments.detailsForm.validation.unitRequired'));
      return;
    }

    setLoading(true);
    try {
      if (mode === "create") {
        await createShipmentDetail(formData as ShipmentDetailCreateDto);
        toast.success(t('shipments.detailsForm.success.add'));
      } else {
        await updateShipmentDetail(formData as ShipmentDetailUpdateDto);
        toast.success(t('shipments.detailsForm.success.create'));
      }

      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      let message = t('shipments.detailsForm.validation.unknownError');
      if (axios.isAxiosError(error)) {
        message =
          error.response?.data?.message ??
          t('shipments.detailsForm.validation.serverError', { status: error.response?.status });
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
        <BaseDialog.DialogHeader className="px-5 pt-5 pb-0 text-left">
          <BaseDialog.DialogTitle>
            {mode === "create"
              ? t('shipments.detailsForm.title.create')
              : t('shipments.detailsForm.title.edit')}
          </BaseDialog.DialogTitle>
        </BaseDialog.DialogHeader>

        <div className="grid gap-2 px-5 py-4">
          <div className="grid gap-1">
            <Label>{t('shipments.detailsForm.orderCode')}</Label>
            <Input value={orderCode ?? ""} disabled />
          </div>

          <div className="grid gap-1">
            <Label>{t('shipments.detailsForm.orderItem')}</Label>
            <Select
              value={(formData.orderItemId as string) || undefined}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, orderItemId: value }))
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t('shipments.detailsForm.selectOrderItem')} />
              </SelectTrigger>
              <SelectContent>
                {orderItemOptions.map((o) => (
                  <SelectItem key={o.orderItemId} value={o.orderItemId}>
                    {o.label || o.orderItemId}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-1">
            <Label>{t('shipments.detailsForm.quantity')}</Label>
            <Input
              name="quantity"
              type="number"
              value={formData.quantity ?? 0}
              onChange={handleChange}
              min={0}
              step={1}
              placeholder={t('shipments.detailsForm.quantityPlaceholder')}
            />
          </div>

          <div className="grid gap-1">
            <Label>{t('shipments.detailsForm.unit')}</Label>
            <Select
              value={formData.unit || undefined}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, unit: value }))
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t('shipments.detailsForm.selectUnit')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Kg">Kg</SelectItem>
                <SelectItem value="Ta">Tạ</SelectItem>
                <SelectItem value="Tan">Tấn</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-1">
            <Label>{t('shipments.detailsForm.note')}</Label>
            <Textarea
              name="note"
              value={formData.note ?? ""}
              onChange={handleChange}
              placeholder={t('shipments.detailsForm.notePlaceholder')}
            />
          </div>
        </div>

        <div className="px-5 pb-5 flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            {t('shipments.detailsForm.buttons.cancel')}
          </Button>
          <Button
            className="bg-orange-500 hover:bg-orange-600 text-white"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? t('shipments.detailsForm.buttons.saving') : mode === "create" ? t('shipments.detailsForm.buttons.add') : t('shipments.detailsForm.buttons.update')}
          </Button>
        </div>
      </FormDialog.Content>
    </BaseDialog.Dialog>
  );
}
