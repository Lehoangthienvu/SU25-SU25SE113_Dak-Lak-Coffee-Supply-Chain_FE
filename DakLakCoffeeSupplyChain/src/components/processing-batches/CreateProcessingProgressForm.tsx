"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getAllProcessingBatches, ProcessingBatch } from "@/lib/api/processingBatches";
import { createProcessingBatchProgressWithMedia } from "@/lib/api/processingBatchProgress";
import { getProcessingStagesByMethodId, ProcessingStage } from "@/lib/api/processingStages";
import imageCompression from "browser-image-compression";
import { ProcessingStatus } from "@/lib/constants/batchStatus";
import MediaUploadSection from "./MediaUploadSection";
import WasteInput, { WasteInputData } from "./WasteInput";
import { ProcessingErrorDisplay, FieldValidationError } from "@/components/shared/ProcessingErrorDisplay";
import { AlertCircle, Plus, X, Calendar, Scale, Settings, Package, PlayCircle } from "lucide-react";

type Props = {
  defaultBatchId?: string;
  defaultBatchData?: ProcessingBatch; // Thêm prop để truyền thông tin batch
  onSuccess?: () => void;
};

export default function CreateProcessingProgressForm({
  defaultBatchId = "",
  defaultBatchData,
  onSuccess
}: Props) {
  const router = useRouter();
  const [batches, setBatches] = useState<ProcessingBatch[]>([]);
  const [stages, setStages] = useState<ProcessingStage[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<ProcessingBatch | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingStages, setLoadingStages] = useState(false);
  const [form, setForm] = useState({
    batchId: defaultBatchId,
    progressDate: new Date().toISOString().split("T")[0], // Mặc định hôm nay
    outputQuantity: 0,
    outputUnit: "kg",
    photoFiles: [] as File[],
    videoFiles: [] as File[],
    parameters: [{ name: "", value: "", unit: "" }] as Array<{ name: string; value: string; unit: string }>,
    recordedAt: new Date().toISOString(),
    wastes: [{ wasteType: "", quantity: 0, unit: "kg", note: "", recordedAt: new Date().toISOString().split("T")[0] }] as WasteInputData[],
  });
  const [error, setError] = useState<any>(null);
  const [success, setSuccess] = useState("");
  const { t } = useTranslation();

  useEffect(() => {
    const fetchBatches = async () => {
      try {
        const res = await getAllProcessingBatches();

        const filtered = (res || []).filter((b) =>
          b.status === ProcessingStatus.NotStarted ||
          b.status === ProcessingStatus.InProgress ||
          b.status === ProcessingStatus.AwaitingEvaluation
        );

        setBatches(filtered);

        // Nếu có defaultBatchId, tự động select và load stage
        if (defaultBatchId) {
          const targetBatch = filtered.find((b: ProcessingBatch) => b.batchId === defaultBatchId);
          if (targetBatch) {
            setSelectedBatch(targetBatch);
            setForm(prev => ({ ...prev, batchId: defaultBatchId }));
            fetchStagesForBatch(targetBatch.methodId);
          } else {
            // Sử dụng defaultBatchData nếu có, hoặc tạo từ context
            if (defaultBatchData) {
              setSelectedBatch(defaultBatchData);
              setForm(prev => ({ ...prev, batchId: defaultBatchId }));
              fetchStagesForBatch(defaultBatchData.methodId);
            } else {
              const contextBatch = {
                batchId: defaultBatchId,
                batchCode: `BATCH-${defaultBatchId}`,
                status: ProcessingStatus.NotStarted,
                methodId: 1, // Default method ID
                methodName: "Sơ chế Khô" // Default method name
              } as ProcessingBatch;
              setSelectedBatch(contextBatch);
              setForm(prev => ({ ...prev, batchId: defaultBatchId }));
              fetchStagesForBatch(contextBatch.methodId);
            }
          }
        }
                             } catch (error) {
          console.error("❌ Error fetching batches:", error);
          setError({ message: t("common.loadingBatches") });
        }
      };
      fetchBatches();
    }, [defaultBatchId, defaultBatchData, t]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "outputQuantity" ? Number(value) : value,
    }));

    // Nếu chọn batch, lấy thông tin stage
    if (name === "batchId") {
      if (value) {
        const selectedBatch = batches.find(b => b.batchId === value);
        if (selectedBatch) {
          setSelectedBatch(selectedBatch);
          fetchStagesForBatch(selectedBatch.methodId);
        }
      } else {
        // Nếu không chọn lô nào, reset
        setSelectedBatch(null);
        setStages([]);
      }
    }
  };

  const fetchStagesForBatch = async (methodId: number) => {
    try {
      setLoadingStages(true);
      const stagesData = await getProcessingStagesByMethodId(methodId);
      setStages(stagesData || []);
                     } catch (error) {
         console.error("❌ Error fetching stages:", error);
         setError({ message: t("common.loadingStages") });
         setStages([]);
       } finally {
      setLoadingStages(false);
    }
  };

  const handleParameterChange = (index: number, field: 'name' | 'value' | 'unit', value: string) => {
    const newParameters = [...form.parameters];
    newParameters[index][field] = value;
    setForm(prev => ({ ...prev, parameters: newParameters }));
  };

  const addParameter = () => {
    setForm(prev => ({
      ...prev,
      parameters: [...prev.parameters, { name: "", value: "", unit: "" }]
    }));
  };

  const removeParameter = (index: number) => {
    if (form.parameters.length > 1) {
      const newParameters = form.parameters.filter((_, i) => i !== index);
      setForm(prev => ({ ...prev, parameters: newParameters }));
    }
  };

  const handlePhotoFilesChange = (files: File[]) => {
    setForm(prev => ({ ...prev, photoFiles: files }));
  };

  const handleVideoFilesChange = (files: File[]) => {
    setForm(prev => ({ ...prev, videoFiles: files }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("🔍 Form submit started");
    setLoading(true);
    setError("");
    setSuccess("");

    // Validation
    console.log("🔍 Validating form data:", {
      batchId: form.batchId,
      progressDate: form.progressDate,
      outputQuantity: form.outputQuantity,
      outputUnit: form.outputUnit
    });
    
         if (!form.batchId) {
       console.log("❌ Validation failed: No batchId");
       setError({ message: t("common.noBatchSelected") });
       setLoading(false);
       return;
     }

     if (!form.progressDate) {
       console.log("❌ Validation failed: No progressDate");
       setError({ message: t("common.noProgressDate") });
       setLoading(false);
       return;
     }

     // Validate date không được trong tương lai
     const selectedDate = new Date(form.progressDate);
     const today = new Date();
     today.setHours(23, 59, 59, 999); // Set to end of today
     if (selectedDate > today) {
       setError({ message: t("processing.batch.validation.ProgressDateInFuture", {
         ProgressDate: selectedDate.toLocaleDateString('vi-VN'),
         Today: today.toLocaleDateString('vi-VN')
       }) });
       setLoading(false);
       return;
     }

     // Validate date không được quá xa trong quá khứ (1 năm)
     const oneYearAgo = new Date();
     oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
     if (selectedDate < oneYearAgo) {
       setError({ message: t("processing.batch.validation.ProgressDateTooPast", {
         ProgressDate: selectedDate.toLocaleDateString('vi-VN'),
         MinDate: oneYearAgo.toLocaleDateString('vi-VN')
       }) });
       setLoading(false);
       return;
     }

     if (form.outputQuantity <= 0) {
       console.log("❌ Validation failed: outputQuantity <= 0");
       setError({ message: t("common.outputQuantity") });
       setLoading(false);
       return;
     }

     // Validate khối lượng không được quá lớn (ví dụ: 100,000 kg)
     if (form.outputQuantity > 100000) {
       setError({ message: t("common.outputQuantityLimit") });
       setLoading(false);
       return;
     }

     if (!form.outputUnit.trim()) {
       setError({ message: t("common.outputUnit") });
       setLoading(false);
       return;
     }

     // File validation
     if (form.photoFiles.some(file => file.size > 10 * 1024 * 1024)) { // 10MB
       setError({ message: t("common.photoSizeLimit") });
       setLoading(false);
       return;
     }

     if (form.videoFiles.some(file => file.size > 100 * 1024 * 1024)) { // 100MB
       setError({ message: t("common.videoSizeLimit") });
       setLoading(false);
       return;
     }

     // Tính tổng kích thước
     const totalPhotoSize = form.photoFiles.reduce((sum, file) => sum + file.size, 0);
     const totalVideoSize = form.videoFiles.reduce((sum, file) => sum + file.size, 0);
     const totalSize = totalPhotoSize + totalVideoSize;
     const totalSizeMB = totalSize / 1024 / 1024;

     // Giới hạn tổng kích thước (50MB)
     if (totalSizeMB > 50) {
       setError({ message: t("common.totalSizeLimit", { totalSizeMB: totalSizeMB.toFixed(2) }) });
       setLoading(false);
       return;
     }

     // Giới hạn số lượng files (10 files)
     const totalFiles = form.photoFiles.length + form.videoFiles.length;
     if (totalFiles > 10) {
       setError({ message: t("common.totalFilesLimit", { totalFiles }) });
       setLoading(false);
       return;
     }

    try {
      let compressedPhotos: File[] = [];
      if (form.photoFiles.length > 0) {
        const photoPromises = form.photoFiles.map(async (photo) => {
          const compressedPhoto = await imageCompression(photo, {
            maxSizeMB: 0.5,
            maxWidthOrHeight: 1000,
            useWebWorker: true,
          });

          // Tạo file mới với tên gốc
          return new File([compressedPhoto], photo.name, {
            type: compressedPhoto.type,
            lastModified: Date.now(),
          });
        });
        compressedPhotos = await Promise.all(photoPromises);
      }

      // Lấy thông số kỹ thuật đầu tiên (nếu có)
      const firstParameter = form.parameters[0];
      const parameterName = firstParameter.name.trim();
      const parameterValue = firstParameter.value.trim();
      const unit = firstParameter.unit.trim();

                    // Lọc waste có dữ liệu hợp lệ
        console.log("🔍 Filtering wastes:", form.wastes);
        const validWastes = form.wastes.filter(waste => {
          const isValid = waste.wasteType.trim() && waste.quantity > 0 && waste.unit.trim();
          console.log(`🔍 Waste validation:`, {
            wasteType: waste.wasteType.trim(),
            quantity: waste.quantity,
            unit: waste.unit.trim(),
            isValid
          });
          return isValid;
        });
        
        console.log("🔍 Valid wastes:", validWastes);
        console.log("🔍 All wastes:", form.wastes);
        console.log("🔍 About to call API with batchId:", form.batchId);

      const apiPayload = {
        stageId: undefined, // Để Backend tự động xác định stage đầu tiên
        progressDate: form.progressDate,
        outputQuantity: form.outputQuantity,
        outputUnit: form.outputUnit,
        photoFiles: compressedPhotos,
        videoFiles: form.videoFiles,
        parameterName: parameterName || undefined,
        parameterValue: parameterValue || undefined,
        unit: unit || undefined,
        recordedAt: form.recordedAt || undefined,
        wastes: validWastes.length > 0 ? validWastes : undefined,
      };
      
      console.log("🔍 API payload:", apiPayload);
      console.log("🔍 Calling createProcessingBatchProgressWithMedia...");
      
      await createProcessingBatchProgressWithMedia(form.batchId, apiPayload);

      setSuccess(t("common.createProgressSuccess"));
      onSuccess?.();
      setTimeout(() => router.push("/dashboard/farmer/processing/progresses"), 1200);
         } catch (err: unknown) {
       console.error("❌ Submit error:", err);
       console.error("❌ Error type:", typeof err);

       const error = err as Error & { response?: { data?: any } };
       console.error("❌ Error message:", error?.message);
       console.error("❌ Error response:", error?.response);
       console.error("❌ Error stack:", error?.stack);

       if (error.message === "Network Error" || (error.message && error.message.includes("Không nhận được phản hồi"))) {
         setError({ message: t("common.networkError") });
       } else {
         // Sử dụng ProcessingErrorDisplay để xử lý error từ backend
         setError(error?.response?.data || error);
       }
     }
    setLoading(false);
  };


  return (
    <div className="space-y-6">
      {/* Header */}
              <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{t("processing.pages.farmerProgresses.createProgress.headerTitle")}</h2>
          <p className="text-sm text-gray-600">{t("processing.pages.farmerProgresses.createProgress.headerDescription")}</p>
        </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Batch Selection - Chỉ hiển thị khi không có defaultBatchId */}
        {!defaultBatchId && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{t("processing.pages.farmerProgresses.createProgress.batchSelectionTitle")}</h3>
                <p className="text-sm text-gray-600">{t("processing.pages.farmerProgresses.createProgress.batchSelectionDescription")}</p>
              </div>
            </div>

            {batches.length === 0 ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <AlertCircle className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-yellow-800">{t("processing.pages.farmerProgresses.createProgress.noAvailableBatches")}</p>
                    <p className="text-xs text-yellow-700 mt-1">
                      {t("processing.pages.farmerProgresses.createProgress.showBatchesStatus")}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <select
                  name="batchId"
                  value={form.batchId}
                  onChange={handleChange}
                  required
                  aria-label={t("processing.pages.farmerProgresses.createProgress.selectBatchLabel")}
                  className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white hover:border-blue-300 transition-all duration-200 shadow-sm"
                >
                  <option value="">{t("processing.pages.farmerProgresses.createProgress.selectBatchPlaceholder")}</option>
                  {batches.map((b) => (
                    <option key={b.batchId} value={b.batchId}>
                      {b.batchCode} - {b.status}
                    </option>
                  ))}
                </select>
                <FieldValidationError error={error} fieldName="batchId" />
              </div>
            )}
          </div>
        )}

        {/* Stage Information */}
        {selectedBatch && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <PlayCircle className="w-5 h-5 text-green-600" />
              </div>
                          <div>
              <h3 className="text-lg font-semibold text-gray-900">{t("processing.pages.farmerProgresses.createProgress.stageInformationTitle")}</h3>
              <p className="text-sm text-gray-600">{t("processing.pages.farmerProgresses.createProgress.stageInformationDescription")}</p>
            </div>
            </div>

            {loadingStages ? (
              <div className="bg-white rounded-lg p-4 border border-green-200">
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
                  <span className="ml-2 text-gray-600">{t("processing.pages.farmerProgresses.createProgress.loadingStages")}</span>
                </div>
              </div>
            ) : stages.length > 0 ? (
              <div className="bg-white rounded-lg p-4 border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900 text-lg">
                      {t("processing.pages.farmerProgresses.createProgress.stageOrder", { order: stages[0]?.orderIndex || 1 })}: {stages[0]?.stageName || t("processing.pages.farmerProgresses.createProgress.firstStep")}
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {t("processing.pages.farmerProgresses.createProgress.methodInfo", { methodName: selectedBatch.methodName || t("processing.pages.farmerProgresses.createProgress.processing") })}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      {t("processing.pages.farmerProgresses.createProgress.stepOrder", { order: stages[0]?.orderIndex || 1 })}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg p-4 border border-green-200">
                <div className="text-center py-4">
                  <p className="text-gray-600">{t("processing.pages.farmerProgresses.createProgress.noStageInfo")}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Date and Quantity */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Calendar className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{t("processing.pages.farmerProgresses.createProgress.progressInformationTitle")}</h3>
              <p className="text-sm text-gray-600">{t("processing.pages.farmerProgresses.createProgress.progressInformationDescription")}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 text-green-600" />
                {t("processing.pages.farmerProgresses.createProgress.progressDateLabel")}
              </label>
              <Input
                type="date"
                name="progressDate"
                value={form.progressDate}
                onChange={handleChange}
                required
                className="border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 hover:border-purple-300 transition-all duration-200 shadow-sm"
              />
              <FieldValidationError error={error} fieldName="progressDate" />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Scale className="w-4 h-4 text-orange-600" />
                {t("processing.pages.farmerProgresses.createProgress.outputQuantityLabel")}
              </label>
              <div className="relative">
                <Input
                  type="number"
                  name="outputQuantity"
                  value={form.outputQuantity}
                  onChange={handleChange}
                  min={0}
                  step={0.01}
                  required
                  className="border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 pr-12 hover:border-purple-300 transition-all duration-200 shadow-sm"
                  placeholder="0"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <span className="text-gray-500 text-sm font-medium">{form.outputUnit}</span>
                </div>
              </div>
              <FieldValidationError error={error} fieldName="outputQuantity" />
            </div>
          </div>
        </div>

        {/* Technical Parameters Section */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Settings className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{t("processing.pages.farmerProgresses.createProgress.technicalParametersTitle")}</h3>
                <p className="text-sm text-gray-600">{t("processing.pages.farmerProgresses.createProgress.technicalParametersDescription")}</p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addParameter}
              className="flex items-center gap-1 text-xs bg-white hover:bg-amber-50 border-amber-300 text-amber-700"
            >
              <Plus className="w-3 h-3" />
              {t("processing.pages.farmerProgresses.createProgress.addParameter")}
            </Button>
          </div>

          <div className="space-y-4">
            {form.parameters.map((param, index) => (
              <div key={index} className="bg-white rounded-lg p-4 border border-amber-200 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">{t("processing.pages.farmerProgresses.createProgress.parameterNameLabel")}</label>
                    <Input
                      type="text"
                      value={param.name}
                      onChange={(e) => handleParameterChange(index, 'name', e.target.value)}
                      placeholder={t("processing.pages.farmerProgresses.createProgress.parameterNamePlaceholder")}
                      className="text-sm border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 hover:border-amber-300 transition-all duration-200"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">{t("processing.pages.farmerProgresses.createProgress.parameterValueLabel")}</label>
                    <Input
                      type="text"
                      value={param.value}
                      onChange={(e) => handleParameterChange(index, 'value', e.target.value)}
                      placeholder={t("processing.pages.farmerProgresses.createProgress.parameterValuePlaceholder")}
                      className="text-sm border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 hover:border-amber-300 transition-all duration-200"
                    />
                  </div>

                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-600 mb-1">{t("processing.pages.farmerProgresses.createProgress.parameterUnitLabel")}</label>
                      <Input
                        type="text"
                        value={param.unit}
                        onChange={(e) => handleParameterChange(index, 'unit', e.target.value)}
                        placeholder={t("processing.pages.farmerProgresses.createProgress.parameterUnitPlaceholder")}
                        className="text-sm border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 hover:border-amber-300 transition-all duration-200"
                      />
                    </div>
                    {form.parameters.length > 1 && (
                      <div className="flex items-end">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeParameter(index)}
                          className="px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-300"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Waste Input Section - Full width */}
        <div className="mb-6">
          <WasteInput
            wastes={form.wastes}
            onWastesChange={(wastes) => {
              setForm(prev => ({ ...prev, wastes }));
            }}
            error={error}
          />
        </div>

        {/* Media Upload Section */}
        <MediaUploadSection
          photoFiles={form.photoFiles}
          videoFiles={form.videoFiles}
          onPhotoFilesChange={handlePhotoFilesChange}
          onVideoFilesChange={handleVideoFilesChange}
        />

        {/* Error and Success Messages */}
        <ProcessingErrorDisplay error={error} />

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-xs">✓</span>
              </div>
              <p className="text-green-700 text-sm font-medium">{success}</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              onSuccess?.();
            }}
            className="px-8 py-3 hover:bg-gray-50 border-gray-300 text-gray-700 font-medium transition-all duration-200"
          >
            {t("processing.pages.farmerProgresses.createProgress.cancelButton")}
          </Button>
          
          <Button
            type="submit"
            disabled={loading}
            className="px-8 py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200"
          >
            {loading ? t("processing.pages.farmerProgresses.createProgress.saving") : t("processing.pages.farmerProgresses.createProgress.createProgress")}
          </Button>
        </div>
      </form>
    </div>
  );
}
