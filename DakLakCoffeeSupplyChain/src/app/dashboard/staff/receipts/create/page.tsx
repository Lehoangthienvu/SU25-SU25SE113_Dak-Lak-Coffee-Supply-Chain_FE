'use client';

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createWarehouseReceipt } from "@/lib/api/warehouseReceipt";
import { getAllWarehouses } from "@/lib/api/warehouses";
import { getAllInboundRequests } from "@/lib/api/warehouseInboundRequest";
import { getInventoriesByWarehouseId, createInventory } from "@/lib/api/inventory";
import { toast } from "sonner";
import { useTranslation } from 'react-i18next';

import {
  Card, CardHeader, CardTitle, CardContent
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectTrigger, SelectContent, SelectItem
} from "@/components/ui/select";

type Warehouse = { warehouseId: string; name: string; };

type InboundRequest = {
  inboundRequestId: string;
  requestCode: string;
  status: string;
  batchId?: string;
  detailId?: string;
  requestedQuantity?: number;
  preferredDeliveryDate?: string;
  note?: string;
  batchCode?: string;
  detailCode?: string;
  coffeeType?: string;
  cropSeasonName?: string;
};

type InventoryRaw = any;
type Inventory = {
  inventoryId: string;
  batchId?: string;
  detailId?: string;
  productName?: string;
  quantity?: number;
  unit?: string;
};

function normalizeInventory(x: InventoryRaw): Inventory {
  return {
    inventoryId: x.inventoryId ?? x.id ?? x.inventoryID ?? x.InventoryID,
    batchId:
      x.batchId ??
      x.BatchId ??
      x.batchID ??
      x.BatchID ??
      x?.batch?.id ??
      x?.processingBatchId ??
      x?.ProcessingBatchId,
    detailId:
      x.detailId ??
      x.DetailId ??
      x.detailID ??
      x.DetailID ??
      x?.detail?.id ??
      x?.cropSeasonDetailId ??
      x?.CropSeasonDetailId,
    productName: x.productName ?? x.ProductName ?? x?.product?.name ?? x.Name,
    quantity: x.quantity ?? x.Quantity ?? x.quantityKg ?? x.Qty,
    unit: x.unit ?? x.Unit ?? (x.quantityKg ? "kg" : undefined),
  };
}

export default function CreateReceiptPage() {
  const { t } = useTranslation();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [inboundRequests, setInboundRequests] = useState<InboundRequest[]>([]);

  const [warehouseId, setWarehouseId] = useState('');
  const [inboundRequestId, setInboundRequestId] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  const [allInvOfWarehouse, setAllInvOfWarehouse] = useState<Inventory[]>([]);
  const [invLoading, setInvLoading] = useState(false);
  const [invError, setInvError] = useState('');
  const [creatingInv, setCreatingInv] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getAllWarehouses();
        if (res.status === 1) setWarehouses(res.data);
        else toast.error(t('createReceipt.error.loadWarehouses') + ": " + res.message);
      } catch (err: any) {
        console.error("❌ getAllWarehouses:", err);
        toast.error(t('createReceipt.error.loadWarehousesUnknown'));
      }

      try {
        const resInbound = await getAllInboundRequests();
        if (resInbound.status === 1) {
          const approved = resInbound.data.filter((r: any) => r.status === "Approved");
          setInboundRequests(approved);
        } else {
          toast.error(t('createReceipt.error.loadInboundRequests') + ": " + resInbound.message);
        }
      } catch (err: any) {
        console.error("❌ getAllInboundRequests:", err);
        toast.error(t('createReceipt.error.loadInboundRequestsUnknown'));
      }
    };

    fetchData();
  }, [t]);

  useEffect(() => {
    setAllInvOfWarehouse([]);
    setInvError('');
    if (!warehouseId) return;

    let canceled = false;
    (async () => {
      try {
        setInvLoading(true);
        const payload = await getInventoriesByWarehouseId(warehouseId);
        const listRaw = Array.isArray(payload) ? payload : (payload?.data ?? []);
        const list: Inventory[] = (listRaw || []).map(normalizeInventory);

        if (canceled) return;
        setAllInvOfWarehouse(list);
      } catch (err: any) {
        if (!canceled) {
          console.error("❌ getInventoriesByWarehouseId:", err);
          setInvError(err?.message || t('createReceipt.error.loadInventories'));
        }
      } finally {
        if (!canceled) setInvLoading(false);
      }
    })();

    return () => { canceled = true; };
  }, [warehouseId, t]);

  const selectedRequest = useMemo(
    () => inboundRequests.find(r => r.inboundRequestId === inboundRequestId),
    [inboundRequestId, inboundRequests]
  );

  const filteredInv = useMemo(() => {
    const b = selectedRequest?.batchId?.toLowerCase()?.trim();
    const d = selectedRequest?.detailId?.toLowerCase()?.trim();
    if (!b && !d) return [];
    return (allInvOfWarehouse || []).filter(iv =>
      (b && iv.batchId?.toLowerCase()?.trim() === b) ||
      (d && iv.detailId?.toLowerCase()?.trim() === d)
    );
  }, [allInvOfWarehouse, selectedRequest?.batchId, selectedRequest?.detailId]);

  const totalExisting = useMemo(
    () => (filteredInv || []).reduce((s, x) => s + (Number(x.quantity) || 0), 0),
    [filteredInv]
  );

  async function handleCreateEmptyInventory() {
    if (!warehouseId || (!selectedRequest?.batchId && !selectedRequest?.detailId)) return;
    setCreatingInv(true);
    setError('');
    try {
      const payload = {
        warehouseId,
        batchId: selectedRequest.batchId,
        detailId: selectedRequest.detailId,
        quantity: 0,
        unit: "kg",
        note: "Khởi tạo tồn kho trống từ màn tạo phiếu",
      };
      const res = await createInventory(payload);
      if ((res.status >= 200 && res.status < 300) || res.status === 200 || res.status === 201) {
        toast.success(t('createReceipt.success.createEmptyInventory'));
        const payloadAfter = await getInventoriesByWarehouseId(warehouseId);
        const listRaw = Array.isArray(payloadAfter) ? payloadAfter : (payloadAfter?.data ?? []);
        setAllInvOfWarehouse((listRaw || []).map(normalizeInventory));
      } else {
        setError(res.message || t('createReceipt.error.createEmptyInventory'));
      }
    } catch (e: any) {
      setError(e?.message || t('createReceipt.error.createEmptyInventory'));
    } finally {
      setCreatingInv(false);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!warehouseId || !inboundRequestId) {
      setError(t('createReceipt.validation.selectAll'));
      return;
    }
    if (!selectedRequest?.batchId && !selectedRequest?.detailId) {
      setError(t('createReceipt.validation.noProductInfo'));
      return;
    }

    const receiptData = {
      warehouseId,
      batchId: selectedRequest.batchId,
      detailId: selectedRequest.detailId,
      receivedQuantity: 0,
      note,
    };

    try {
      const res = await createWarehouseReceipt(inboundRequestId, receiptData);
      if (res.status === 1) {
        toast.success(t('createReceipt.success.createReceipt'));
        router.push('/dashboard/staff/receipts');
      } else {
        setError(res.message || t('createReceipt.error.createReceiptFailed'));
      }
    } catch (err: any) {
      console.error("❌ Lỗi tạo phiếu từ BE:", err);
      setError(`❌ ${err.message || t('createReceipt.error.createReceiptUnknown')}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-100 py-6 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl shadow-lg p-6 text-white">
          <div className="flex items-center gap-4 mb-3">
            <div className="p-3 bg-white/20 rounded-full">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold">📥 {t('createReceipt.title')}</h1>
              <p className="text-green-100 text-lg">{t('createReceipt.subtitle')}</p>
            </div>
          </div>
        </div>

        {/* Main Form */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Form Card */}
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100">
                <CardTitle className="text-xl font-semibold text-green-800 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  {t('createReceipt.sections.receiptInfo')}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-red-700">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-medium">{error}</span>
                      </div>
                    </div>
                  )}

                  {/* Inbound Request Selection */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      {t('createReceipt.fields.inboundRequest')} *
                    </label>
                    <Select value={inboundRequestId} onValueChange={setInboundRequestId}>
                      <SelectTrigger className="h-12 border-2 border-green-200 focus:border-green-500 focus:ring-green-500">
                        <span className={inboundRequestId ? "text-gray-900" : "text-gray-500"}>
                          {inboundRequestId
                            ? inboundRequests.find(i => i.inboundRequestId === inboundRequestId)?.requestCode || 'Chọn phiếu'
                            : t('createReceipt.placeholders.selectRequest')}
                        </span>
                      </SelectTrigger>
                      <SelectContent>
                        {inboundRequests.map(i => (
                          <SelectItem key={i.inboundRequestId} value={i.inboundRequestId}>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{i.requestCode}</span>
                              <span className="text-xs text-gray-500">({i.status})</span>
                              {i.requestedQuantity && (
                                <span className="text-xs text-green-600 font-medium">
                                  {i.requestedQuantity} kg
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Inbound Request Details */}
                  {selectedRequest && (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="p-2 bg-green-100 rounded-full">
                          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-green-800 mb-2">📋 {t('createReceipt.sections.requestDetails')}</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                            <div>
                              <span className="font-medium text-gray-700">{t('createReceipt.fields.requestCode')}:</span>
                              <span className="ml-2 text-green-700 font-semibold">{selectedRequest.requestCode}</span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">{t('createReceipt.fields.status')}:</span>
                              <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                                {selectedRequest.status}
                              </span>
                            </div>
                            {selectedRequest.requestedQuantity && (
                              <div>
                                <span className="font-medium text-gray-700">{t('createReceipt.fields.requestedQuantity')}:</span>
                                <span className="ml-2 text-blue-700 font-semibold">{selectedRequest.requestedQuantity} kg</span>
                              </div>
                            )}
                            {selectedRequest.preferredDeliveryDate && (
                              <div>
                                <span className="font-medium text-gray-700">{t('createReceipt.fields.preferredDeliveryDate')}:</span>
                                <span className="ml-2 text-gray-700">{selectedRequest.preferredDeliveryDate}</span>
                              </div>
                            )}
                            <div>
                              <span className="font-medium text-gray-700">{t('createReceipt.fields.coffeeType')}:</span>
                              <span className="ml-2 px-2 py-1 text-xs rounded-full font-medium">
                                {selectedRequest.batchId ? (
                                  <span className="bg-purple-100 text-purple-800">☕ {t('createReceipt.coffeeTypes.processed')}</span>
                                ) : selectedRequest.detailId ? (
                                  <span className="bg-orange-100 text-orange-800">🌱 {t('createReceipt.coffeeTypes.fresh')}</span>
                                ) : (
                                  <span className="bg-gray-100 text-gray-800">❓ {t('createReceipt.common.unknown')}</span>
                                )}
                              </span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">{t('createReceipt.fields.information')}:</span>
                              <span className="ml-2 text-gray-700 font-semibold">
                                {selectedRequest.batchId ? (
                                  selectedRequest.batchCode || t('createReceipt.common.processedBatch')
                                ) : selectedRequest.detailId ? (
                                  selectedRequest.cropSeasonName || selectedRequest.detailCode || t('createReceipt.common.cropSeason')
                                ) : (
                                  'N/A'
                                )}
                              </span>
                            </div>
                          </div>
                          {selectedRequest.note && (
                            <div className="mt-3 pt-3 border-t border-green-200">
                              <span className="font-medium text-gray-700">{t('createReceipt.fields.note')}:</span>
                              <p className="mt-1 text-gray-600 text-sm italic">"{selectedRequest.note}"</p>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-blue-800 text-xs">
                          💡 <strong>{t('createReceipt.info.check')}:</strong> {t('createReceipt.info.requestedQuantity')} {selectedRequest.requestedQuantity || 'N/A'} kg. 
                          {t('createReceipt.info.confirmNote')}
                        </p>
                        <div className="mt-2 pt-2 border-t border-blue-200">
                          <p className="text-red-700 text-xs font-medium">
                            ⚠️ <strong>{t('createReceipt.info.remember')}:</strong> {t('createReceipt.info.currentQuantity')} 0 kg ({t('createReceipt.info.default')}). 
                            {t('createReceipt.info.confirmStep')}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Warehouse Selection */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      {t('createReceipt.fields.warehouse')} *
                    </label>
                    <Select value={warehouseId} onValueChange={setWarehouseId}>
                      <SelectTrigger className="h-12 border-2 border-blue-200 focus:border-blue-500 focus:ring-blue-500">
                        <span className={warehouseId ? "text-gray-900" : "text-gray-500"}>
                          {warehouseId
                            ? warehouses.find(w => w.warehouseId === warehouseId)?.name || 'Chọn kho'
                            : t('createReceipt.placeholders.selectWarehouse')}
                        </span>
                      </SelectTrigger>
                      <SelectContent>
                        {warehouses.map(w => (
                          <SelectItem key={w.warehouseId} value={w.warehouseId}>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{w.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Note */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      {t('createReceipt.fields.note')}
                    </label>
                    <Textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder={t('createReceipt.placeholders.note')}
                      className="min-h-[100px] border-2 border-gray-200 focus:border-gray-400 focus:ring-gray-400"
                    />
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    className="w-full h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200"
                    disabled={!warehouseId || !inboundRequestId}
                  >
                    {t('createReceipt.actions.createReceipt')}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Inventory Status Card */}
            {(warehouseId && selectedRequest) && (
              <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
                  <CardTitle className="text-lg font-semibold text-blue-800 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    {t('createReceipt.sections.inventoryStatus')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {invLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
                      <p className="text-blue-700">{t('createReceipt.inventory.loading')}</p>
                    </div>
                  ) : invError ? (
                    <div className="text-center py-8">
                      <div className="text-red-600 mb-3">
                        <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <p className="text-red-700 mb-4">{invError}</p>
                    </div>
                  ) : filteredInv.length === 0 ? (
                    <div className="space-y-4">
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                          <span className="font-medium text-yellow-800">{t('createReceipt.inventory.noInventory')}</span>
                        </div>
                        <p className="text-yellow-700 text-sm">
                          {t('createReceipt.inventory.createEmpty')}
                        </p>
                      </div>
                      
                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="font-medium text-orange-800">{t('createReceipt.warning.title')}</span>
                        </div>
                        <p className="text-orange-700 text-sm">
                          <strong>{t('createReceipt.warning.defaultQuantity')}:</strong> 0 kg
                        </p>
                        <p className="text-orange-700 text-sm">
                          <strong>{t('createReceipt.warning.nextStep')}:</strong> {t('createReceipt.process.step2.title')}
                        </p>
                      </div>
                      
                      <Button
                        onClick={handleCreateEmptyInventory}
                        disabled={creatingInv}
                        className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                      >
                        {creatingInv ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            {t('createReceipt.inventory.creating')}
                          </>
                        ) : (
                          t('createReceipt.inventory.createEmptyButton')
                        )}
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="font-medium text-green-800">{t('createReceipt.inventory.hasInventory')}</span>
                        </div>
                        <p className="text-green-700 text-sm">
                          {t('createReceipt.inventory.totalExisting')} <strong>{totalExisting} kg</strong>
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-700">{t('createReceipt.inventory.details')}:</p>
                        <ul className="space-y-2">
                          {filteredInv.map(iv => (
                            <li key={iv.inventoryId} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                              <span className="text-sm text-gray-700">{iv.productName}</span>
                              <span className="text-sm font-semibold text-gray-900">
                                {iv.quantity} {iv.unit || "kg"}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-blue-800 text-xs">
                          💡 {t('createReceipt.inventory.confirmNote')}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Quick Stats */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-pink-50">
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-purple-800 mb-2">{t('createReceipt.stats.title')}</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('createReceipt.stats.warehouses')}:</span>
                      <span className="font-medium">{warehouses.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('createReceipt.stats.requests')}:</span>
                      <span className="font-medium">{inboundRequests.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('createReceipt.stats.approved')}:</span>
                      <span className="font-medium text-green-600">{inboundRequests.filter(r => r.status === "Approved").length}</span>
                    </div>
                    {selectedRequest && (
                      <>
                        <div className="border-t border-purple-200 pt-2 mt-2">
                          <div className="flex justify-between">
                            <span className="text-gray-600">{t('createReceipt.stats.currentRequest')}:</span>
                            <span className="font-medium text-purple-700">{selectedRequest.requestCode}</span>
                          </div>
                          {selectedRequest.requestedQuantity && (
                            <>
                              <div className="flex justify-between">
                                <span className="text-gray-600">{t('createReceipt.stats.requestedQuantity')}:</span>
                                <span className="font-medium text-blue-600">{selectedRequest.requestedQuantity} kg</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">{t('createReceipt.stats.receiptQuantity')}:</span>
                                <span className="font-medium text-red-600">0 kg (mặc định)</span>
                              </div>
                              <div className="mt-1 p-1 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                                💡 {t('createReceipt.stats.difference')}: {selectedRequest.requestedQuantity} kg - 0 kg = <strong>{selectedRequest.requestedQuantity} kg</strong>
                              </div>
                            </>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
