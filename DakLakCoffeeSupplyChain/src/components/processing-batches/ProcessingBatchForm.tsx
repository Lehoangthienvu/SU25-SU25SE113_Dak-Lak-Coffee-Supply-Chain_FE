"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { createProcessingBatch, getAvailableProcessingData, ProcessingBatch, ProcessingDataResponse, ProcessingInfo, CoffeeType } from "@/lib/api/processingBatches";
import { getAllProcessingMethods, ProcessingMethod } from "@/lib/api/processingMethods";
import { getAllCropSeasons, CropSeasonListItem } from "@/lib/api/cropSeasons";

interface Props {
  onSuccess?: () => void;
}

export default function ProcessingBatchForm({ onSuccess }: Props) {
  const { t } = useTranslation();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [cropSeasons, setCropSeasons] = useState<CropSeasonListItem[]>([]);
  const [coffeeTypes, setCoffeeTypes] = useState<CoffeeType[]>([]);
  const [processingInfo, setProcessingInfo] = useState<ProcessingInfo[]>([]);
  const [processingMethods, setProcessingMethods] = useState<ProcessingMethod[]>([]);
  
  const [form, setForm] = useState({
    cropSeasonId: "",
    coffeeTypeId: "",
    methodId: 0,
    batchCode: "",
  });

  useEffect(() => {
    fetchCropSeasons();
    fetchProcessingMethods();
  }, []);

  useEffect(() => {
    if (form.cropSeasonId) {
      fetchCoffeeTypes();
    } else {
      setCoffeeTypes([]);
      setProcessingInfo([]);
    }
  }, [form.cropSeasonId]);

  // Tự động chọn phương pháp sơ chế từ plan khi chọn loại cà phê
  useEffect(() => {
    if (form.coffeeTypeId && processingInfo.length > 0) {
      const info = processingInfo.find(p => p.coffeeTypeId === form.coffeeTypeId);
      if (info && info.hasPlanProcessingMethod && info.planProcessingMethodId) {
        setForm(prev => ({
          ...prev,
          methodId: info.planProcessingMethodId || 0
        }));
      }
    }
  }, [form.coffeeTypeId, processingInfo]);

  const fetchCropSeasons = async () => {
    try {
      const response = await getAvailableProcessingData();
      setCropSeasons(response.cropSeasons || []);
    } catch (err) {
      console.error("❌ Lỗi fetchCropSeasons:", err);
    }
  };

  const fetchProcessingMethods = async () => {
    try {
      const methods = await getAllProcessingMethods();
      setProcessingMethods(methods || []);
    } catch (err) {
      console.error("❌ Lỗi fetchProcessingMethods:", err);
    }
  };

  const fetchCoffeeTypes = async () => {
    try {
      setLoading(true);
      const response: ProcessingDataResponse = await getAvailableProcessingData(form.cropSeasonId);
      setCoffeeTypes(response.coffeeTypes || []);
      setProcessingInfo(response.processingInfo || []);
    } catch (err) {
      console.error("❌ Lỗi fetchCoffeeTypes:", err);
      setCoffeeTypes([]);
      setProcessingInfo([]);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: name === "methodId" ? parseInt(value) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    // Validation
    if (!form.cropSeasonId) {
      setError(t('processing.batch.validation.selectCropSeason'));
      setLoading(false);
      return;
    }

    if (!form.coffeeTypeId) {
      setError(t('processing.batch.validation.selectCoffeeType'));
      setLoading(false);
      return;
    }

    // Kiểm tra xem plan có định nghĩa phương pháp sơ chế không
    const info = processingInfo.find(p => p.coffeeTypeId === form.coffeeTypeId);
    if (!info || !info.hasPlanProcessingMethod || !info.planProcessingMethodId) {
      setError(t('processing.batch.validation.noPlanProcessingMethod'));
      setLoading(false);
      return;
    }

    if (!form.batchCode.trim()) {
      setError(t('processing.batch.validation.enterBatchCode'));
      setLoading(false);
      return;
    }

    try {
      // Sử dụng phương pháp sơ chế từ plan
      await createProcessingBatch({
        cropSeasonId: form.cropSeasonId,
        coffeeTypeId: form.coffeeTypeId,
        methodId: info.planProcessingMethodId,
        batchCode: form.batchCode.trim(),
        inputQuantity: 0, // Sẽ được backend tính toán tự động
        inputUnit: "kg", // Đơn vị mặc định
      });

      setSuccess(t('processing.batch.createSuccess'));
      onSuccess?.();
      setTimeout(() => router.push("/dashboard/farmer/processing/batches"), 1200);
    } catch (err: any) {
      console.error("❌ Create batch error:", err);
      const errorMessage = err?.response?.data?.message || err?.message || t('processing.batch.createError');
      setError(errorMessage);
    }
    setLoading(false);
  };

  // Lấy thông tin phương pháp sơ chế từ plan cho loại cà phê đang chọn
  const getSelectedCoffeeTypeInfo = () => {
    if (!form.coffeeTypeId) return null;
    return processingInfo.find(p => p.coffeeTypeId === form.coffeeTypeId);
  };

  const selectedCoffeeTypeInfo = getSelectedCoffeeTypeInfo();

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('processing.batch.create')}</h2>
        <p className="text-gray-600">{t('processing.batch.createDescription')}</p>
      </div>

      <div>
        <label className="block font-medium mb-2">{t('processing.batch.cropSeason')} *</label>
        <select
          name="cropSeasonId"
          value={form.cropSeasonId}
          onChange={handleChange}
          required
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">{t('processing.batch.selectCropSeason')}</option>
          {cropSeasons.map((season) => (
            <option key={season.cropSeasonId} value={season.cropSeasonId}>
              {season.seasonName} ({new Date(season.startDate).getFullYear()})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block font-medium mb-2">{t('processing.batch.coffeeType')} *</label>
        <select
          name="coffeeTypeId"
          value={form.coffeeTypeId}
          onChange={handleChange}
          required
          disabled={!form.cropSeasonId || loading}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
        >
          <option value="">
            {!form.cropSeasonId ? t('processing.batch.selectCropSeasonFirst') : t('processing.batch.selectCoffeeType')}
          </option>
          {coffeeTypes.map((type) => (
            <option key={type.coffeeTypeId} value={type.coffeeTypeId}>
              {type.typeName} ({type.typeCode})
            </option>
          ))}
        </select>
        {!form.cropSeasonId && (
          <p className="text-sm text-gray-500 mt-1">{t('processing.batch.selectCropSeasonToViewCoffeeTypes')}</p>
        )}
        {loading && (
          <p className="text-sm text-blue-500 mt-1">{t('processing.batch.loadingCoffeeTypes')}</p>
        )}
      </div>

      {/* Hiển thị thông tin phương pháp sơ chế từ plan */}
      {selectedCoffeeTypeInfo && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">{t('processing.batch.planInformation')}:</h4>
          <div className="text-sm text-blue-800">
            <p>✅ <strong>{t('processing.batch.processingMethod')}:</strong> {selectedCoffeeTypeInfo.planProcessingMethodName} ({selectedCoffeeTypeInfo.planProcessingMethodCode})</p>
            <p className="text-xs text-blue-600 mt-1">{t('processing.batch.methodAppliedAutomatically')}</p>
          </div>
        </div>
      )}

      {/* Không hiển thị dropdown chọn phương pháp vì đã có từ plan */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <p className="text-sm text-gray-700">
          <strong>{t('processing.batch.note')}:</strong> {t('processing.batch.onlyCoffeeTypesWithPlanRequirements')}
        </p>
      </div>

      <div>
        <label className="block font-medium mb-2">{t('processing.batch.batchCode')} *</label>
        <Input
          type="text"
          name="batchCode"
          value={form.batchCode}
          onChange={handleChange}
          placeholder={t('processing.batch.batchCodePlaceholder')}
          required
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-sm text-gray-500 mt-1">{t('processing.batch.batchCodeDescription')}</p>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}
      {success && <p className="text-green-600 text-sm">{success}</p>}

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
        >
          {t('processing.batch.cancel')}
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-600 text-white"
        >
          {loading ? t('processing.batch.creating') : t('processing.batch.createBatch')}
        </Button>
      </div>
    </form>
  );
}
