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
import { ProcessingErrorDisplay } from "@/components/shared/ProcessingErrorDisplay";

interface Props {
  onSuccess?: () => void;
}

export default function ProcessingBatchForm({ onSuccess }: Props) {
  const { t } = useTranslation();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);
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
    setError(null);
    setSuccess("");

    // Validation
    if (!form.cropSeasonId) {
      setError({ message: t('componentsprocessing.processingBatchForm.validation.selectCropSeason') });
      setLoading(false);
      return;
    }

    if (!form.coffeeTypeId) {
      setError({ message: t('componentsprocessing.processingBatchForm.validation.selectCoffeeType') });
      setLoading(false);
      return;
    }

    // Kiểm tra xem plan có định nghĩa phương pháp sơ chế không
    const info = processingInfo.find(p => p.coffeeTypeId === form.coffeeTypeId);
    if (!info || !info.hasPlanProcessingMethod || !info.planProcessingMethodId) {
      setError({ message: t('componentsprocessing.processingBatchForm.validation.noPlanProcessingMethod') });
      setLoading(false);
      return;
    }

    if (!form.batchCode.trim()) {
      setError({ message: t('componentsprocessing.processingBatchForm.validation.enterBatchCode') });
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

      setSuccess(t('componentsprocessing.processingBatchForm.createSuccess'));
      onSuccess?.();
      setTimeout(() => router.push("/dashboard/farmer/processing/batches"), 1200);
    } catch (err: any) {
      console.error("❌ Create batch error:", err);
      setError(err);
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
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('componentsprocessing.processingBatchForm.create')}</h2>
        <p className="text-gray-600">{t('componentsprocessing.processingBatchForm.createDescription')}</p>
      </div>

      <div>
        <label className="block font-medium mb-2">{t('componentsprocessing.processingBatchForm.cropSeason')} *</label>
        {cropSeasons.length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-yellow-800">
                  Không có mùa vụ nào khả dụng để tạo lô sơ chế
                </p>
                                 <p className="text-xs text-yellow-700 mt-1">
                   Tất cả mùa vụ đều đã có lô sơ chế cho tất cả loại cà phê hoặc không có yêu cầu sơ chế từ kế hoạch.
                 </p>
              </div>
            </div>
          </div>
        ) : (
          <select
            name="cropSeasonId"
            value={form.cropSeasonId}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">{t('componentsprocessing.processingBatchForm.selectCropSeason')}</option>
            {cropSeasons.map((season) => (
              <option key={season.cropSeasonId} value={season.cropSeasonId}>
                {season.seasonName} ({new Date(season.startDate).getFullYear()})
              </option>
            ))}
          </select>
        )}
      </div>

      <div>
        <label className="block font-medium mb-2">{t('componentsprocessing.processingBatchForm.coffeeType')} *</label>
        {!form.cropSeasonId ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-600">{t('componentsprocessing.processingBatchForm.selectCropSeasonToViewCoffeeTypes')}</p>
          </div>
        ) : coffeeTypes.length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-yellow-800">
                  Không có loại cà phê nào khả dụng cho mùa vụ này
                </p>
                                 <p className="text-xs text-yellow-700 mt-1">
                   Tất cả loại cà phê trong mùa vụ này đều đã có lô sơ chế.
                 </p>
              </div>
            </div>
          </div>
        ) : (
          <select
            name="coffeeTypeId"
            value={form.coffeeTypeId}
            onChange={handleChange}
            required
            disabled={loading}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          >
            <option value="">{t('componentsprocessing.processingBatchForm.selectCoffeeType')}</option>
            {coffeeTypes.map((type) => (
              <option key={type.coffeeTypeId} value={type.coffeeTypeId}>
                {type.typeName} ({type.typeCode})
              </option>
            ))}
          </select>
        )}
        {loading && (
                      <p className="text-sm text-blue-500 mt-1">{t('componentsprocessing.processingBatchForm.loadingCoffeeTypes')}</p>
        )}
      </div>

      {/* Hiển thị thông tin phương pháp sơ chế từ plan */}
      {selectedCoffeeTypeInfo && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                     <h4 className="font-medium text-blue-900 mb-2">{t('componentsprocessing.processingBatchForm.planInformation')}:</h4>
          <div className="text-sm text-blue-800">
                         <p>✅ <strong>{t('componentsprocessing.processingBatchForm.processingMethod')}:</strong> {selectedCoffeeTypeInfo.planProcessingMethodName} ({selectedCoffeeTypeInfo.planProcessingMethodCode})</p>
             <p className="text-xs text-blue-600 mt-1">{t('componentsprocessing.processingBatchForm.methodAppliedAutomatically')}</p>
          </div>
        </div>
      )}

      {/* Không hiển thị dropdown chọn phương pháp vì đã có từ plan */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
                         <p className="text-sm font-medium text-blue-800">
               {t('componentsprocessing.processingBatchForm.note')}:
             </p>
                         <ul className="text-xs text-blue-700 mt-1 space-y-1">
                               <li>• {t('componentsprocessing.processingBatchForm.onlyCoffeeTypesWithPlanRequirements')}</li>
               <li>• Chỉ hiển thị những mùa vụ có ít nhất 1 loại cà phê chưa có lô sơ chế</li>
               <li>• Chỉ hiển thị những loại cà phê chưa có lô sơ chế</li>
             </ul>
          </div>
        </div>
      </div>

      <div>
                 <label className="block font-medium mb-2">{t('componentsprocessing.processingBatchForm.batchCode')} *</label>
        <Input
          type="text"
          name="batchCode"
          value={form.batchCode}
          onChange={handleChange}
                     placeholder={t('componentsprocessing.processingBatchForm.batchCodePlaceholder')}
          required
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
                 <p className="text-sm text-gray-500 mt-1">{t('componentsprocessing.processingBatchForm.batchCodeDescription')}</p>
      </div>

      {error && <ProcessingErrorDisplay error={error} />}
      {success && <p className="text-green-600 text-sm">{success}</p>}

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
        >
                     {t('componentsprocessing.processingBatchForm.cancel')}
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-600 text-white"
        >
                     {loading ? t('componentsprocessing.processingBatchForm.creating') : t('componentsprocessing.processingBatchForm.createBatch')}
        </Button>
      </div>
    </form>
  );
}
