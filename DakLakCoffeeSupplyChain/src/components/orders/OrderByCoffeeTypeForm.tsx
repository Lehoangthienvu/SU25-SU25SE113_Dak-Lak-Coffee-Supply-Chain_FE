"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/DatePicker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import {
  createOrderByCoffeeType,
  getAvailableCoffeeTypesByContract,
  type OrderStatus,
} from "@/lib/api/orders";
import { getAllContracts, type ContractViewDto } from "@/lib/api/contracts";
import { OrderStatus as OrderStatusEnum } from "@/lib/constants/orderStatus";

type Props = {
  onSuccess: () => void;
};

type CoffeeTypeOption = {
  coffeeTypeId: string;
  typeName: string;
  availableQuantity: number;
  contractQuantity: number;
  orderedQuantity: number;
  remainingContractQuantity: number;
  unitPrice: number;
};

type FormState = {
  contractId: string;
  coffeeTypeId: string;
  deliveryRound: string;
  orderDate: string;
  actualDeliveryDate: string;
  note: string;
  status: OrderStatus;
  cancelReason: string;
  requestedQuantity: string;
  unitPrice: string;
  discountAmount: string;
};

export default function OrderByCoffeeTypeForm({ onSuccess }: Props) {
  const { t } = useTranslation();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [contracts, setContracts] = useState<ContractViewDto[]>([]);
  const [coffeeTypeOptions, setCoffeeTypeOptions] = useState<CoffeeTypeOption[]>([]);
  const [selectedCoffeeType, setSelectedCoffeeType] = useState<CoffeeTypeOption | null>(null);

  const [form, setForm] = useState<FormState>({
    contractId: "",
    coffeeTypeId: "",
    deliveryRound: "",
    orderDate: "",
    actualDeliveryDate: "",
    note: "",
    status: OrderStatusEnum.Pending,
    cancelReason: "",
    requestedQuantity: "",
    unitPrice: "",
    discountAmount: "",
  });

  // Load danh sách hợp đồng
  useEffect(() => {
    (async () => {
      try {
        const all = await getAllContracts();
        setContracts(all || []);
      } catch (e) {
        console.error(e);
        toast.error(t("managerOrders.form.errors.loadContracts"));
      }
    })();
  }, [t]);

  // Khi chọn hợp đồng → load CoffeeType có sẵn
  useEffect(() => {
    if (!form.contractId) {
      setCoffeeTypeOptions([]);
      setSelectedCoffeeType(null);
      return;
    }

    (async () => {
      try {
        const options = await getAvailableCoffeeTypesByContract(form.contractId);
        setCoffeeTypeOptions(options || []);
      } catch (e: any) {
        toast.error(e.message || t("managerOrders.form.errors.loadCoffeeTypes"));
      }
    })();
  }, [form.contractId, t]);

  // Khi chọn CoffeeType → tự động điền thông tin
  useEffect(() => {
    if (!form.coffeeTypeId) {
      setSelectedCoffeeType(null);
      return;
    }

    const selected = coffeeTypeOptions.find(ct => ct.coffeeTypeId === form.coffeeTypeId);
    if (selected) {
      setSelectedCoffeeType(selected);
      setForm(prev => ({
        ...prev,
        unitPrice: selected.unitPrice.toString(),
        requestedQuantity: selected.availableQuantity.toString()
      }));
    }
  }, [form.coffeeTypeId, coffeeTypeOptions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.contractId || !form.coffeeTypeId || !form.requestedQuantity || !form.unitPrice) {
      toast.error(t("managerOrders.form.errors.requiredFields"));
      return;
    }

    const qty = Number(form.requestedQuantity);
    const price = Number(form.unitPrice);
    
    if (qty <= 0 || price <= 0) {
      toast.error(t("managerOrders.form.errors.invalidQuantityOrPrice"));
      return;
    }

    if (selectedCoffeeType && qty > selectedCoffeeType.availableQuantity) {
      toast.error(t("managerOrders.form.errors.exceedAvailableQuantity"));
      return;
    }

    try {
      setLoading(true);
      
      const payload = {
        contractId: form.contractId,
        coffeeTypeId: form.coffeeTypeId,
        deliveryRound: form.deliveryRound ? Number(form.deliveryRound) : null,
        orderDate: form.orderDate || null,
        actualDeliveryDate: form.actualDeliveryDate || null,
        note: form.note?.trim() || null,
        status: form.status,
        cancelReason: form.cancelReason?.trim() || null,
        requestedQuantity: qty,
        unitPrice: price,
        discountAmount: form.discountAmount ? Number(form.discountAmount) : 0,
      };

      await createOrderByCoffeeType(payload);
      toast.success(t("managerOrders.form.actions.createSuccess"));
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || t("managerOrders.form.actions.createError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>{t("managerOrders.createByCoffeeType.title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Chọn hợp đồng */}
          <div className="grid gap-2">
            <label className="text-sm font-medium">
              {t("managerOrders.form.fields.contract")} <span className="text-red-500">*</span>
            </label>
            <select
              value={form.contractId}
              onChange={(e) => setForm(prev => ({ ...prev, contractId: e.target.value }))}
              className="p-2 border rounded"
              required
            >
              <option value="">{t("managerOrders.form.selectContract")}</option>
              {contracts.map((contract) => (
                <option key={contract.contractId} value={contract.contractId}>
                  {contract.contractCode} — {contract.buyerName}
                </option>
              ))}
            </select>
          </div>

          {/* Chọn loại cà phê */}
          <div className="grid gap-2">
            <label className="text-sm font-medium">
              {t("managerOrders.form.fields.coffeeType")} <span className="text-red-500">*</span>
            </label>
            <select
              value={form.coffeeTypeId}
              onChange={(e) => setForm(prev => ({ ...prev, coffeeTypeId: e.target.value }))}
              className="p-2 border rounded"
              required
              disabled={!form.contractId}
            >
              <option value="">{t("managerOrders.form.selectCoffeeType")}</option>
              {coffeeTypeOptions.map((option) => (
                <option key={option.coffeeTypeId} value={option.coffeeTypeId}>
                  {option.typeName} (Có sẵn: {option.availableQuantity}kg)
                </option>
              ))}
            </select>
          </div>

          {/* Thông tin số lượng và giá */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">
                {t("managerOrders.form.fields.quantity")} <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                min={0}
                max={selectedCoffeeType?.availableQuantity || 0}
                step={0.1}
                value={form.requestedQuantity}
                onChange={(e) => setForm(prev => ({ ...prev, requestedQuantity: e.target.value }))}
                placeholder={t("managerOrders.form.placeholders.quantity")}
                required
              />
              {selectedCoffeeType && (
                <p className="text-xs text-gray-500">
                  Còn lại: {selectedCoffeeType.remainingContractQuantity}kg
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">
                {t("managerOrders.form.fields.unitPrice")} <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                min={0}
                step={1000}
                value={form.unitPrice}
                onChange={(e) => setForm(prev => ({ ...prev, unitPrice: e.target.value }))}
                placeholder={t("managerOrders.form.placeholders.unitPrice")}
                required
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">
                {t("managerOrders.form.fields.discountAmount")}
              </label>
              <Input
                type="number"
                min={0}
                step={1000}
                value={form.discountAmount}
                onChange={(e) => setForm(prev => ({ ...prev, discountAmount: e.target.value }))}
                placeholder={t("managerOrders.form.placeholders.discountAmount")}
              />
            </div>
          </div>

          {/* Thông tin khác */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">
                {t("managerOrders.form.fields.deliveryRound")}
              </label>
              <Input
                type="number"
                min={1}
                value={form.deliveryRound}
                onChange={(e) => setForm(prev => ({ ...prev, deliveryRound: e.target.value }))}
                placeholder={t("managerOrders.form.placeholders.deliveryRound")}
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">
                {t("managerOrders.form.fields.status")}
              </label>
              <select
                value={form.status}
                onChange={(e) => setForm(prev => ({ ...prev, status: e.target.value as OrderStatus }))}
                className="p-2 border rounded"
              >
                <option value={OrderStatusEnum.Pending}>{t("orderStatus.pending")}</option>
                <option value={OrderStatusEnum.Processing}>{t("orderStatus.processing")}</option>
                <option value={OrderStatusEnum.Completed}>{t("orderStatus.completed")}</option>
                <option value={OrderStatusEnum.Cancelled}>{t("orderStatus.cancelled")}</option>
              </select>
            </div>
          </div>

          {/* Ghi chú */}
          <div className="grid gap-2">
            <label className="text-sm font-medium">
              {t("managerOrders.form.fields.note")}
            </label>
            <Textarea
              value={form.note}
              onChange={(e) => setForm(prev => ({ ...prev, note: e.target.value }))}
              placeholder={t("managerOrders.form.placeholders.note")}
              rows={3}
            />
          </div>

          {/* Submit */}
          <div className="flex gap-4">
            <Button type="submit" disabled={loading}>
              {loading ? t("managerOrders.form.actions.creating") : t("managerOrders.form.actions.create")}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              {t("common.cancel")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
