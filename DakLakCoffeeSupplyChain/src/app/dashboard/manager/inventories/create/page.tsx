'use client';

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { createInventory } from "@/lib/api/inventory";
import { getAllWarehouses } from "@/lib/api/warehouses";
import { getAllProcessingBatches } from "@/lib/api/processingBatches";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";

export default function CreateInventoryPage() {
  const { t } = useTranslation();
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const router = useRouter();

  useEffect(() => {
    async function fetchInitialData() {
      const [warehouseRes, batchRes] = await Promise.all([
        getAllWarehouses(),
        getAllProcessingBatches()
      ]);

      if (warehouseRes?.status === 1) {
        setWarehouses(warehouseRes.data);
      } else {
        console.error("❌ Không thể tải kho:", warehouseRes?.message || warehouseRes);
      }

      if (Array.isArray(batchRes)) {
        setBatches(batchRes);
      } else {
        console.error("❌ Không thể tải mẻ hàng:", batchRes);
      }
    }

    fetchInitialData();
  }, []);

  const onSubmit = async (data: any) => {
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const res = await createInventory(data);

      if (res && (res.status === 1 || res.status === 200 || res.status === 201)) {
        setSuccessMessage(t('managerInventories.success.createSuccess'));
        setTimeout(() => {
          router.push("/dashboard/manager/inventories");
        }, 1500);
      } else {
        const fallbackMessage = typeof res?.message === "string"
          ? res.message
          : t('managerInventories.error.createFailed');
        setErrorMessage(`❌ ${fallbackMessage}`);
      }

    } catch (err: any) {
      console.error("❌ Lỗi hệ thống:", err);
      const fallback = typeof err?.message === "string" ? err.message : t('managerInventories.error.unknownError');
      setErrorMessage(t('managerInventories.error.systemErrorCreate') + fallback);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-orange-600 flex items-center gap-2">
            {t('managerInventories.create.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {successMessage && (
            <div className="mb-4 p-3 bg-green-100 text-green-800 rounded">
              {successMessage}
            </div>
          )}
          {errorMessage && (
            <div className="mb-4 p-3 bg-red-100 text-red-800 rounded">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Kho */}
            <div>
              <Label>{t('managerInventories.create.fields.warehouse')}</Label>
              <select
                {...register("warehouseId", { required: true })}
                className="w-full border p-2 rounded"
              >
                <option value="">{t('managerInventories.create.placeholders.selectWarehouse')}</option>
                {warehouses.map((w) => (
                  <option key={w.warehouseId} value={w.warehouseId}>
                    {w.name} - {w.location} ({w.capacity?.toLocaleString()} {t('managerWarehouses.stats.kg')})
                  </option>
                ))}
              </select>
              {errors.warehouseId && (
                <p className="text-red-500 text-sm mt-1">{t('managerInventories.create.validation.selectWarehouse')}</p>
              )}
            </div>

            {/* Mẻ hàng */}
            <div>
              <Label>{t('managerInventories.create.fields.batch')}</Label>
              <select
                {...register("batchId", { required: true })}
                className="w-full border p-2 rounded"
              >
                <option value="">{t('managerInventories.create.placeholders.selectBatch')}</option>
                {batches.map((b) => (
                  <option key={b.batchId} value={b.batchId}>
                    {b.batchCode} - {b.methodName} ({b.totalOutputQuantity} {t('managerWarehouses.stats.kg')})
                  </option>
                ))}
              </select>
              {errors.batchId && (
                <p className="text-red-500 text-sm mt-1">{t('managerInventories.create.validation.selectWarehouse')}</p>
              )}
            </div>

            {/* Số lượng */}
            <div>
              <Label>{t('managerInventories.create.fields.quantity')}</Label>
              <Input
                {...register("quantity", { required: true, min: 1 })}
                type="number"
                placeholder={t('managerInventories.create.placeholders.quantity')}
              />
              {errors.quantity && (
                <p className="text-red-500 text-sm mt-1">{t('managerInventories.create.validation.quantityRequired')}</p>
              )}
            </div>

            {/* Đơn vị */}
            <div>
              <Label>{t('managerInventories.create.fields.unit')}</Label>
              <Input
                {...register("unit", { required: true })}
                placeholder={t('managerInventories.create.placeholders.unit')}
              />
              {errors.unit && (
                <p className="text-red-500 text-sm mt-1">{t('managerInventories.create.validation.unitRequired')}</p>
              )}
            </div>

            <div className="pt-4">
              <Button type="submit" className="w-full">{t('managerInventories.create.actions.create')}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
