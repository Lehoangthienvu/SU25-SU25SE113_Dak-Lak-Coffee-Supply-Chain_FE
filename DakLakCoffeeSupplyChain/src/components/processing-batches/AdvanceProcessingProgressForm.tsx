// AdvanceProcessingProgressForm.tsx
"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ValidationErrorHandler } from "@/utils/errorHandler";
import { ErrorDisplay } from "@/components/ErrorDisplay";
import { ProcessedError } from "@/types/processing";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { ProcessingErrorDisplay, FieldValidationError } from "@/components/shared/ProcessingErrorDisplay";

import imageCompression from "browser-image-compression";
import { advanceToNextProcessingProgress } from "@/lib/api/processingBatchProgress";
import { getProcessingBatchById } from "@/lib/api/processingBatches";
import { getProcessingStagesByMethodId, ProcessingStage } from "@/lib/api/processingStages";
import WasteInput, { WasteInputData } from "./WasteInput";

import { ProcessingBatchProgress } from "@/lib/api/processingBatchProgress";
import { ProcessingStatus } from "@/lib/constants/batchStatus";

interface Props {
  batchId: string;
  latestProgress?: ProcessingBatchProgress; // Làm optional để hỗ trợ trường hợp chưa có progress
  batchStatus?: string; // Thêm batch status
  failedStageInfo?: { // Thêm thông tin stage bị fail
    stageId: number;
    stageName: string;
    failureDetails: string;
  };
  onSuccess?: () => void;
}

export default function AdvanceProcessingProgressForm({
  batchId,
  latestProgress,
  batchStatus,
  failedStageInfo,
  onSuccess,
}: Props) {
  const { t } = useTranslation();
  
  const [progressDate, setProgressDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [outputQuantity, setOutputQuantity] = useState<number>(0);
  const [outputUnit, setOutputUnit] = useState("kg");
  const [stageDescription, setStageDescription] = useState("");

  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [videoFiles, setVideoFiles] = useState<File[]>([]);
  const [parameterName, setParameterName] = useState("");
  const [parameterValue, setParameterValue] = useState("");
  const [unit, setUnit] = useState("");
  const [wastes, setWastes] = useState<WasteInputData[]>([
    { wasteType: "", quantity: 0, unit: "kg", note: "", recordedAt: new Date().toISOString().split("T")[0] }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);
  const [processedError, setProcessedError] = useState<ProcessedError | null>(null);
  
  // State cho stage selection
  const [availableStages, setAvailableStages] = useState<ProcessingStage[]>([]);
  const [selectedStageId, setSelectedStageId] = useState<number | undefined>(undefined); // ✅ Nhất quán với backend C# sử dụng int
  const [loadingStages, setLoadingStages] = useState(false);
  const [nextStep, setNextStep] = useState("Thu hoạch");

   

  // Tính toán button text dựa trên failedStageInfo
  const getButtonText = () => {
    if (loading) return t('componentsprocessing.advanceProcessingProgressForm.submitting');
    
    if (failedStageInfo) {
      return t('componentsprocessing.advanceProcessingProgressForm.submit');
    }
    
    return t('componentsprocessing.advanceProcessingProgressForm.submit');
  };

  // Helper functions for file management
  const removePhotoFile = (index: number) => {
    setPhotoFiles(prev => prev.filter((_, i) => i !== index));
  };

  const removeVideoFile = (index: number) => {
    setVideoFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Load available stages khi component mount
  useEffect(() => {
    const loadStages = async () => {
      try {
        setLoadingStages(true);
        const batch = await getProcessingBatchById(batchId);
                 if (batch && batch.methodId) {
           let availableStages: ProcessingStage[] = [];
           
           try {
             // Thử lấy stages thực tế từ API
             const stages = await getProcessingStagesByMethodId(batch.methodId);
             availableStages = stages
               .filter(stage => !stage.isDeleted)
               .sort((a, b) => a.orderIndex - b.orderIndex);
           } catch (err) {

           }
           
           setAvailableStages(availableStages);
           
           // Tự động chọn stage bị fail hoặc stage tiếp theo
           if (failedStageInfo) {
             // Nếu có stage bị fail, chọn stage đó
             const failedStage = availableStages.find(s => s.stageId === failedStageInfo.stageId);
             setSelectedStageId(failedStage?.stageId || availableStages[0]?.stageId || undefined);
           } else if (latestProgress) {
             // Nếu không có stage bị fail, chọn stage tiếp theo
             let currentStageIndex = availableStages.findIndex(s => s.stageId === latestProgress.stageId);
             
             // Nếu không tìm thấy exact match, thử tìm theo stageName
             if (currentStageIndex === -1) {
               currentStageIndex = availableStages.findIndex(s => s.stageName === latestProgress.stageName);
             }
             
             // Nếu vẫn không tìm thấy, thử tìm theo stepIndex
             if (currentStageIndex === -1 && latestProgress.stepIndex) {
               currentStageIndex = availableStages.findIndex(s => s.orderIndex === latestProgress.stepIndex);
             }
             
             if (currentStageIndex >= 0 && currentStageIndex < availableStages.length - 1) {
               const nextStage = availableStages[currentStageIndex + 1];
               setSelectedStageId(nextStage.stageId || undefined);
               setNextStep(nextStage.stageName || "Sơ chế");
             } else if (currentStageIndex >= 0) {
               const currentStage = availableStages[currentStageIndex];
               setSelectedStageId(currentStage?.stageId || undefined);
               // Nếu đang ở stage cuối, không có stage tiếp theo
               setNextStep("Hoàn thành");
             } else {
               // Nếu không tìm thấy stage hiện tại, chọn stage đầu tiên
               const firstStage = availableStages[0];
               setSelectedStageId(firstStage?.stageId || undefined);
               if (availableStages.length > 1) {
                 setNextStep(availableStages[1].stageName || "Sơ chế");
               } else {
                 setNextStep("Hoàn thành");
               }
             }
           } else {
             // Nếu chưa có progress nào, chọn stage đầu tiên
             const firstStage = availableStages[0];
             setSelectedStageId(firstStage?.stageId || undefined);
             if (availableStages.length > 1) {
               setNextStep(availableStages[1].stageName || "Sơ chế");
             } else {
               setNextStep("Hoàn thành");
             }
           }
        }
      } catch (err) {
        console.error("Error loading stages:", err);
      } finally {
        setLoadingStages(false);
      }
    };

    loadStages();
       }, [batchId, latestProgress?.stageId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("🔍 AdvanceProcessingProgressForm handleSubmit started");
    setLoading(true);
    setError(null);
    setProcessedError(null);

              // Không cần validate selectedStageId vì đã tự động chọn
           if (!progressDate) {
        setError(t('componentsprocessing.advanceProcessingProgressForm.validation.progressDateRequired'));
        setLoading(false);
        return;
      }
      if (outputQuantity <= 0) {
        setError(t('componentsprocessing.advanceProcessingProgressForm.validation.outputQuantityRequired'));
        setLoading(false);
        return;
      }
      if (!outputUnit.trim()) {
        setError(t('componentsprocessing.advanceProcessingProgressForm.validation.outputUnitRequired'));
        setLoading(false);
        return;
      }

    try {
      let compressedPhotos: File[] = [];
      if (photoFiles.length > 0) {
        for (const photo of photoFiles) {
          const compressed = await imageCompression(photo, {
            maxSizeMB: 0.5,
            maxWidthOrHeight: 1000,
            useWebWorker: true,
          });
          compressedPhotos.push(
            new File([compressed], photo.name, {
              type: compressed.type,
              lastModified: Date.now(),
            })
          );
        }
      }

                                                       // Lọc waste có dữ liệu hợp lệ
               console.log("🔍 Filtering wastes:", wastes);
               const validWastes = wastes.filter(waste => {
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
               console.log("🔍 All wastes:", wastes);
               console.log("🔍 First waste details:", wastes[0]);
               console.log("🔍 First waste validation check:", {
                 hasWasteType: !!wastes[0]?.wasteType,
                 wasteTypeLength: wastes[0]?.wasteType?.length || 0,
                 hasQuantity: wastes[0]?.quantity > 0,
                 quantityValue: wastes[0]?.quantity,
                 hasUnit: !!wastes[0]?.unit,
                 unitLength: wastes[0]?.unit?.length || 0
               });

             const apiPayload = {
               stageId: selectedStageId, // Stage được chọn từ dropdown
               currentStageId: latestProgress?.stageId, // Stage hiện tại để backend validate
               progressDate,
               outputQuantity,
               outputUnit,
               stageDescription: stageDescription || undefined,
 
               photoFiles: compressedPhotos.length ? compressedPhotos : undefined,
               videoFiles: videoFiles.length ? videoFiles : undefined,
               parameterName: parameterName || undefined,
               parameterValue: parameterValue || undefined,
               unit: unit || undefined,
               recordedAt: new Date().toISOString(),
               wastes: validWastes.length > 0 ? validWastes : undefined,
             };
             
             console.log("🔍 API payload:", apiPayload);
             console.log("🔍 Calling advanceToNextProcessingProgress...");
             
             await advanceToNextProcessingProgress(batchId, apiPayload);

      onSuccess?.();
         } catch (err: any) {
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
     } finally {
      setLoading(false);
    }
  };

  const removePhoto = (index: number) => {
    setPhotoFiles(photoFiles.filter((_, i) => i !== index));
  };

  const removeVideo = (index: number) => {
    setVideoFiles(videoFiles.filter((_, i) => i !== index));
  };

  return (
    <form
      onSubmit={(e) => {
        console.log("🔍 AdvanceProcessingProgressForm onSubmit triggered!");
        console.log("🔍 Event:", e);
        console.log("🔍 Form element:", e.currentTarget);
        console.log("🔍 Submit button clicked - form is submitting!");
        console.log("🔍 Form state at submit:");
        console.log("  - batchId:", batchId);
        console.log("  - progressDate:", progressDate);
        console.log("  - outputQuantity:", outputQuantity);
        console.log("  - outputUnit:", outputUnit);
        console.log("  - selectedStageId:", selectedStageId);
        console.log("  - Wastes count:", wastes.length);
        wastes.forEach((waste, index) => {
          console.log(`  - Waste ${index}:`, {
            wasteType: waste.wasteType,
            quantity: waste.quantity,
            unit: waste.unit,
            note: waste.note,
            recordedAt: waste.recordedAt
          });
        });
        console.log("🔍 About to call handleSubmit...");
        handleSubmit(e);
      }}
      className="bg-white w-full h-full overflow-hidden"
    >
      {/* Header - Orange gradient */}
      <div className="bg-gradient-to-r from-orange-600 via-orange-500 to-orange-400 p-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
                         <h2 className="text-white font-bold text-xl">
                             {t('componentsprocessing.advanceProcessingProgressForm.form.title')}
            </h2>
            <p className="text-orange-100 text-sm">
              {failedStageInfo ? `${t('componentsprocessing.advanceProcessingProgressForm.stageInfo.improvementStage')}: ${failedStageInfo.stageName}` : latestProgress ? `${t('componentsprocessing.advanceProcessingProgressForm.stageInfo.nextStep')}: ${nextStep}` : t('componentsprocessing.advanceProcessingProgressForm.stageInfo.firstProgress')}
            </p>
          </div>
        </div>
        
                 {/* Language Switcher */}
    
         
   
       
      </div>

      {/* Content - Horizontal layout */}
      <div className="p-8">
        {/* Info row */}
        <div className={`mb-6 p-4 border-2 rounded-xl ${
          failedStageInfo 
            ? 'bg-gradient-to-r from-red-50 to-orange-50 border-red-200' 
            : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200'
        }`}>
          <div className={`flex items-center gap-3 text-sm ${
            failedStageInfo ? 'text-red-700' : 'text-blue-700'
          }`}>
            <div className={`w-3 h-3 rounded-full animate-pulse ${
              failedStageInfo ? 'bg-red-500' : 'bg-blue-500'
            }`}></div>
                         <span className="font-semibold">
               {failedStageInfo ? t('componentsprocessing.advanceProcessingProgressForm.stageInfo.errorStage') : t('componentsprocessing.advanceProcessingProgressForm.stageInfo.currentStage')}
             </span>
                          <span className="font-bold text-lg">
                {failedStageInfo ? failedStageInfo.stageName : latestProgress ? latestProgress.stageName : t('componentsprocessing.advanceProcessingProgressForm.stageInfo.noProgress')}
              </span>
              {!failedStageInfo && latestProgress && (
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                  {t('componentsprocessing.advanceProcessingProgressForm.stageInfo.stepNumber')} {latestProgress.stepIndex}
                </span>
              )}
              {latestProgress && (
                <span className="ml-auto text-xs opacity-75">
                  {t('componentsprocessing.advanceProcessingProgressForm.stageInfo.previousDate')} {new Date(latestProgress.progressDate).toLocaleDateString("vi-VN")}
                </span>
              )}
          </div>
                     {failedStageInfo && (
             <div className="mt-3 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
               <strong>{t('componentsprocessing.advanceProcessingProgressForm.stageInfo.failureReason')}</strong> {failedStageInfo.failureDetails}
             </div>
           )}
        </div>

                {/* Main form - 3 columns horizontal layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          
          {/* Column 1 - Basic Info */}
          <div className="space-y-4">
                         <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-3">
               <div className="w-6 h-6 bg-green-100 rounded-lg flex items-center justify-center">
                 <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                 </svg>
               </div>
               {t('componentsprocessing.advanceProcessingProgressForm.basicInfo.title')}
             </h3>

            <div className="space-y-4">
              {/* Hiển thị thông tin stage bị fail khi có failedStageInfo */}
                             {failedStageInfo && (
                 <div>
                   <label className="block text-sm font-semibold text-gray-700 mb-2">
                     {t('componentsprocessing.advanceProcessingProgressForm.stageInfo.improvementStage')}
                   </label>
                   <div className="w-full h-12 bg-red-50 border-2 border-red-200 rounded-lg px-4 flex items-center text-sm text-red-700 font-semibold">
                     {failedStageInfo.stageName}
                   </div>
                 </div>
               )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {t('componentsprocessing.advanceProcessingProgressForm.form.progressDate.label')}
                </label>
                <Input
                  type="date"
                  value={progressDate}
                  onChange={(e) => setProgressDate(e.target.value)}
                  required
                  className="w-full h-12 border-2 border-gray-200 rounded-lg px-4 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all duration-200"
                  placeholder={t('componentsprocessing.advanceProcessingProgressForm.form.progressDate.placeholder')}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {t('componentsprocessing.advanceProcessingProgressForm.form.outputQuantity.label')}
                </label>
                <Input
                  type="number"
                  value={Number.isNaN(outputQuantity) ? 0 : outputQuantity}
                  min={0}
                  step="any"
                  onChange={(e) => setOutputQuantity(parseFloat(e.target.value))}
                  required
                  className="w-full h-12 border-2 border-gray-200 rounded-lg px-4 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all duration-200"
                  placeholder={t('componentsprocessing.advanceProcessingProgressForm.form.outputQuantity.placeholder')}
                />
                <FieldValidationError error={error} fieldName="outputQuantity" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {t('componentsprocessing.advanceProcessingProgressForm.form.stageDescription.label')}
                </label>
                <textarea
                  value={stageDescription}
                  onChange={(e) => setStageDescription(e.target.value)}
                  placeholder={t('componentsprocessing.advanceProcessingProgressForm.form.stageDescription.placeholder')}
                  className="w-full h-24 border-2 border-gray-200 rounded-lg px-4 py-3 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all duration-200 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {t('componentsprocessing.advanceProcessingProgressForm.form.unit.label')}
                </label>
                <select
                  value={outputUnit}
                  onChange={(e) => setOutputUnit(e.target.value)}
                  required
                  className="w-full h-12 border-2 border-gray-200 rounded-lg px-4 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all duration-200"
                >
                  <option value="">{t('componentsprocessing.advanceProcessingProgressForm.form.unit.placeholder')}</option>
                  <option value="kg">Kilogram (kg)</option>
                  <option value="g">Gram (g)</option>
                  <option value="tấn">Tấn</option>
                  <option value="tạ">Tạ</option>
                  <option value="yến">Yến</option>
                  <option value="lạng">Lạng</option>
                  <option value="lb">Pound (lb)</option>
                  <option value="oz">Ounce (oz)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Column 2 - Parameters */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-100 rounded flex items-center justify-center">
                <svg className="w-3 h-3 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              {t('componentsprocessing.advanceProcessingProgressForm.form.technicalParameters.title')}
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  {t('componentsprocessing.advanceProcessingProgressForm.form.technicalParameters.parameterName.label')}
                </label>
                <Input
                  type="text"
                  value={parameterName}
                  onChange={(e) => setParameterName(e.target.value)}
                  placeholder={t('componentsprocessing.advanceProcessingProgressForm.form.technicalParameters.parameterName.placeholder')}
                  className="w-full h-10 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  {t('componentsprocessing.advanceProcessingProgressForm.form.technicalParameters.parameterValue.label')}
                </label>
                <Input
                  type="text"
                  value={parameterValue}
                  onChange={(e) => setParameterValue(e.target.value)}
                  placeholder={t('componentsprocessing.advanceProcessingProgressForm.form.technicalParameters.parameterValue.placeholder')}
                  className="w-full h-10 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  {t('componentsprocessing.advanceProcessingProgressForm.form.technicalParameters.parameterUnit.label')}
                </label>
                <Input
                  type="text"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder={t('componentsprocessing.advanceProcessingProgressForm.form.technicalParameters.parameterUnit.placeholder')}
                  className="w-full h-10 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Column 3 - Media Upload */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <div className="w-4 h-4 bg-pink-100 rounded flex items-center justify-center">
                <svg className="w-3 h-3 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              {t('componentsprocessing.advanceProcessingProgressForm.form.illustrativeDocuments.title')}
            </h3>

            <div className="space-y-3">
              {/* Photo upload */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  {t('componentsprocessing.advanceProcessingProgressForm.form.illustrativeDocuments.image.label')}
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 text-center hover:border-pink-400 transition-colors bg-gray-50">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      setPhotoFiles(prev => [...prev, ...files]);
                    }}
                    className="hidden"
                    id="photo-upload"
                  />
                  <label
                    htmlFor="photo-upload"
                    className="text-xs text-gray-600 cursor-pointer hover:text-pink-600 flex flex-col items-center gap-1"
                  >
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    {photoFiles.length > 0 ? `${photoFiles.length} ảnh` : t('componentsprocessing.advanceProcessingProgressForm.form.illustrativeDocuments.image.placeholder')}
                  </label>
                </div>
                
                {/* Photo preview */}
                {photoFiles.length > 0 && (
                  <div className="mt-3">
                    <div className="flex flex-wrap gap-2">
                      {photoFiles.map((file, index) => (
                        <div key={index} className="relative">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`Photo ${index + 1}`}
                            className="w-20 h-20 object-cover rounded-lg border"
                          />
                          <button
                            type="button"
                            onClick={() => removePhotoFile(index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Video upload */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  {t('componentsprocessing.advanceProcessingProgressForm.form.illustrativeDocuments.video.label')}
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 text-center hover:border-teal-400 transition-colors bg-gray-50">
                  <input
                    type="file"
                    multiple
                    accept="video/*"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      setVideoFiles(prev => [...prev, ...files]);
                    }}
                    className="hidden"
                    id="video-upload"
                  />
                  <label
                    htmlFor="video-upload"
                    className="text-xs text-gray-600 cursor-pointer hover:text-teal-600 flex flex-col items-center gap-1"
                  >
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    {videoFiles.length > 0 ? `${videoFiles.length} video` : t('componentsprocessing.advanceProcessingProgressForm.form.illustrativeDocuments.video.placeholder')}
                  </label>
                </div>
                
                {/* Video preview */}
                {videoFiles.length > 0 && (
                  <div className="mt-3">
                    <div className="flex flex-wrap gap-2">
                      {videoFiles.map((file, index) => (
                        <div key={index} className="relative">
                          <video
                            src={URL.createObjectURL(file)}
                            className="w-20 h-20 object-cover rounded-lg border"
                            controls
                          />
                          <button
                            type="button"
                            onClick={() => removeVideoFile(index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Waste Input Section - Full width below main form */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 rounded-xl p-6">
            <h3 className="text-lg font-bold text-red-800 mb-4 flex items-center gap-3">
              <div className="w-6 h-6 bg-red-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              {t('componentsprocessing.advanceProcessingProgressForm.form.wasteInformation.title')}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-red-700 mb-2">
                  {t('componentsprocessing.advanceProcessingProgressForm.form.wasteInformation.wasteType.label')}
                </label>
                <Input
                  type="text"
                  value={wastes[0]?.wasteType || ""}
                  onChange={(e) => {
                    const newWastes = [...wastes];
                    newWastes[0] = { ...newWastes[0], wasteType: e.target.value };
                    setWastes(newWastes);
                  }}
                  placeholder={t('componentsprocessing.advanceProcessingProgressForm.form.wasteInformation.wasteType.placeholder')}
                  className="w-full h-12 border-2 border-red-200 rounded-lg px-4 text-sm focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all duration-200"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-red-700 mb-2">
                  {t('componentsprocessing.advanceProcessingProgressForm.form.wasteInformation.quantity.label')}
                </label>
                <Input
                  type="number"
                  value={wastes[0]?.quantity || 0}
                  min={0}
                  step="any"
                  onChange={(e) => {
                    const newWastes = [...wastes];
                    newWastes[0] = { ...newWastes[0], quantity: parseFloat(e.target.value) || 0 };
                    setWastes(newWastes);
                  }}
                  placeholder={t('componentsprocessing.advanceProcessingProgressForm.form.wasteInformation.quantity.placeholder')}
                  className="w-full h-12 border-2 border-red-200 rounded-lg px-4 text-sm focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all duration-200"
                />
                <FieldValidationError error={error} fieldName="wasteQuantity" />
              </div>
              
              <div>
                                 <label className="block text-sm font-semibold text-red-700 mb-2">
                   {t('componentsprocessing.advanceProcessingProgressForm.form.wasteInformation.unit.label')}
                 </label>
                <select
                  value={wastes[0]?.unit || "kg"}
                  onChange={(e) => {
                    const newWastes = [...wastes];
                    newWastes[0] = { ...newWastes[0], unit: e.target.value };
                    setWastes(newWastes);
                  }}
                  className="w-full h-12 border-2 border-red-200 rounded-lg px-4 text-sm focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all duration-200"
                >
                  <option value="kg">Kilogram (kg)</option>
                  <option value="g">Gram (g)</option>
                  <option value="tấn">Tấn</option>
                  <option value="tạ">Tạ</option>
                </select>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-red-700 mb-2">
                  {t('componentsprocessing.advanceProcessingProgressForm.form.wasteInformation.notes.label')}
                </label>
                <textarea
                  value={wastes[0]?.note || ""}
                  onChange={(e) => {
                    const newWastes = [...wastes];
                    newWastes[0] = { ...newWastes[0], note: e.target.value };
                    setWastes(newWastes);
                  }}
                  placeholder={t('componentsprocessing.advanceProcessingProgressForm.form.wasteInformation.notes.placeholder')}
                  className="w-full h-24 border-2 border-red-200 rounded-lg px-4 py-3 text-sm focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all duration-200 resize-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-red-700 mb-2">
                  {t('componentsprocessing.advanceProcessingProgressForm.form.wasteInformation.recordDate.label')}
                </label>
                <Input
                  type="date"
                  value={wastes[0]?.recordedAt || new Date().toISOString().split("T")[0]}
                  onChange={(e) => {
                    const newWastes = [...wastes];
                    newWastes[0] = { ...newWastes[0], recordedAt: e.target.value };
                    setWastes(newWastes);
                  }}
                  placeholder={t('componentsprocessing.advanceProcessingProgressForm.form.wasteInformation.recordDate.placeholder')}
                  className="w-full h-12 border-2 border-red-200 rounded-lg px-4 text-sm focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all duration-200"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Media previews - Horizontal layout */}
        {(photoFiles.length > 0 || videoFiles.length > 0) && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-3">{t('componentsprocessing.advanceProcessingProgressForm.form.fileUpload.previewTitle')}</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {photoFiles.map((file, index) => (
                <div key={`photo-${index}`} className="relative group">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-20 object-cover rounded-lg border border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(index)}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ×
                  </button>
                </div>
              ))}
              {videoFiles.map((file, index) => (
                <div key={`video-${index}`} className="relative group">
                  <video
                    src={URL.createObjectURL(file)}
                    className="w-full h-20 object-cover rounded-lg border border-gray-200"
                    controls
                  />
                  <button
                    type="button"
                    onClick={() => removeVideo(index)}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Submit button and info */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-6 border-t-2 border-gray-100">
          <div className="flex items-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{t('componentsprocessing.advanceProcessingProgressForm.form.fileUpload.maxFiles')}</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{t('componentsprocessing.advanceProcessingProgressForm.form.fileUpload.imageCompression')}</span>
            </div>
          </div>

          <div className="flex gap-4">
            <Button
              type="button"
              onClick={() => onSuccess?.()}
              variant="outline"
              className="px-6 py-3 border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-semibold rounded-lg transition-all duration-200"
            >
              {t('componentsprocessing.advanceProcessingProgressForm.form.actions.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {t('componentsprocessing.advanceProcessingProgressForm.form.actions.saving')}
                </div>
              ) : (
                getButtonText()
              )}
            </Button>
          </div>
        </div>

        <ProcessingErrorDisplay error={error} />
      </div>
    </form>
  );
}
