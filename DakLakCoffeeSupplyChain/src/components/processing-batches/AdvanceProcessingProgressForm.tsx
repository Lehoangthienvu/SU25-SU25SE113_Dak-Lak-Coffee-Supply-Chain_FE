// AdvanceProcessingProgressForm.tsx
"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import imageCompression from "browser-image-compression";
import { advanceToNextProcessingProgress } from "@/lib/api/processingBatchProgress";
import { getProcessingBatchById } from "@/lib/api/processingBatches";
import { getProcessingStagesByMethodId, ProcessingStage } from "@/lib/api/processingStages";

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
  const [progressDate, setProgressDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [outputQuantity, setOutputQuantity] = useState<number>(0);
  const [outputUnit, setOutputUnit] = useState("kg");
  const [stageDescription, setStageDescription] = useState(""); // Thêm state cho description
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [videoFiles, setVideoFiles] = useState<File[]>([]);
  const [parameterName, setParameterName] = useState("");
  const [parameterValue, setParameterValue] = useState("");
  const [unit, setUnit] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // State cho stage selection
  const [availableStages, setAvailableStages] = useState<ProcessingStage[]>([]);
     const [selectedStageId, setSelectedStageId] = useState<number | undefined>(undefined); // ✅ Nhất quán với backend C# sử dụng int
   const [loadingStages, setLoadingStages] = useState(false);

   // Debug log khi selectedStageId thay đổi
   useEffect(() => {
     console.log("🔍 DEBUG: selectedStageId changed to:", selectedStageId);
   }, [selectedStageId]);

  // Tính toán button text dựa trên failedStageInfo
  const getButtonText = () => {
    if (loading) return "Đang lưu...";
    
    if (failedStageInfo) {
      return "Cập nhật lại bước không đạt";
    }
    
    return "Cập nhật tiến trình";
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
             console.log("API chưa có, sử dụng mock data");
             // Fallback: Sử dụng mock data khi API chưa có
            //  availableStages = [
            //    { stageId: "stage_1", stageName: "Thu hoạch", orderIndex: 1, methodId: batch.methodId, isRequired: true, isDeleted: false },
            //    { stageId: "stage_2", stageName: "Làm sạch", orderIndex: 2, methodId: batch.methodId, isRequired: true, isDeleted: false },
            //    { stageId: "stage_3", stageName: "Phân loại", orderIndex: 3, methodId: batch.methodId, isRequired: true, isDeleted: false },
            //    { stageId: "stage_4", stageName: "Phơi", orderIndex: 4, methodId: batch.methodId, isRequired: true, isDeleted: false },
            //    { stageId: "stage_5", stageName: "Rang", orderIndex: 5, methodId: batch.methodId, isRequired: true, isDeleted: false },
            //    { stageId: "stage_6", stageName: "Đóng gói", orderIndex: 6, methodId: batch.methodId, isRequired: true, isDeleted: false }
            //  ];
           }
           
           setAvailableStages(availableStages);
           
           // Debug logs để kiểm tra auto selection
           console.log("🔍 DEBUG: Auto stage selection");
           console.log("Available stages:", availableStages.map(s => ({ stageId: s.stageId, stageName: s.stageName, orderIndex: s.orderIndex })));
           console.log("Latest progress:", latestProgress ? { stageId: latestProgress.stageId, stageName: latestProgress.stageName } : "No progress");
           console.log("Failed stage info:", failedStageInfo);
           
           // Tự động chọn stage bị fail hoặc stage tiếp theo
           if (failedStageInfo) {
             // Nếu có stage bị fail, chọn stage đó
             const failedStage = availableStages.find(s => s.stageId === failedStageInfo.stageId);
             console.log("🔍 DEBUG: Failed stage found:", failedStage);
             setSelectedStageId(failedStage?.stageId || availableStages[0]?.stageId || undefined);
           } else if (latestProgress) {
             // Nếu không có stage bị fail, chọn stage tiếp theo
             let currentStageIndex = availableStages.findIndex(s => s.stageId === latestProgress.stageId);
             console.log("🔍 DEBUG: Current stage index (exact match):", currentStageIndex);
             
             // Nếu không tìm thấy exact match, thử tìm theo stageName
             if (currentStageIndex === -1) {
               currentStageIndex = availableStages.findIndex(s => s.stageName === latestProgress.stageName);
               console.log("🔍 DEBUG: Current stage index (name match):", currentStageIndex);
             }
             
             // Nếu vẫn không tìm thấy, thử tìm theo stepIndex
             if (currentStageIndex === -1 && latestProgress.stepIndex) {
               currentStageIndex = availableStages.findIndex(s => s.orderIndex === latestProgress.stepIndex);
               console.log("🔍 DEBUG: Current stage index (step match):", currentStageIndex);
             }
             
             if (currentStageIndex >= 0 && currentStageIndex < availableStages.length - 1) {
               const nextStage = availableStages[currentStageIndex + 1];
               console.log("🔍 DEBUG: Next stage selected:", nextStage);
               setSelectedStageId(nextStage.stageId || undefined);
             } else if (currentStageIndex >= 0) {
               const currentStage = availableStages[currentStageIndex];
               console.log("🔍 DEBUG: Current stage selected (no next):", currentStage);
               setSelectedStageId(currentStage?.stageId || undefined);
             } else {
               // Nếu không tìm thấy stage hiện tại, chọn stage đầu tiên
               const firstStage = availableStages[0];
               console.log("🔍 DEBUG: First stage selected (fallback):", firstStage);
               setSelectedStageId(firstStage?.stageId || undefined);
             }
           } else {
             // Nếu chưa có progress nào, chọn stage đầu tiên
             const firstStage = availableStages[0];
             console.log("🔍 DEBUG: First stage selected:", firstStage);
             setSelectedStageId(firstStage?.stageId || undefined);
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
    setLoading(true);
    setError(null);

         // Không cần validate selectedStageId vì đã tự động chọn
    if (!progressDate) {
      setError("Vui lòng chọn ngày thực hiện");
      setLoading(false);
      return;
    }
    if (outputQuantity <= 0) {
      setError("Khối lượng đầu ra phải lớn hơn 0");
      setLoading(false);
      return;
    }
    if (!outputUnit.trim()) {
      setError("Vui lòng nhập đơn vị");
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

             await advanceToNextProcessingProgress(batchId, {
         stageId: selectedStageId, // Stage được chọn từ dropdown
         currentStageId: latestProgress?.stageId, // Stage hiện tại để backend validate
         progressDate,
         outputQuantity,
         outputUnit,
         stageDescription: stageDescription || undefined, // Thêm description
         photoFiles: compressedPhotos.length ? compressedPhotos : undefined,
         videoFiles: videoFiles.length ? videoFiles : undefined,
         parameterName: parameterName || undefined,
         parameterValue: parameterValue || undefined,
         unit: unit || undefined,
         recordedAt: new Date().toISOString(),
       });

      onSuccess?.();
         } catch (err: any) {
       // Xử lý lỗi chi tiết hơn
       let errorMessage = "Không thể cập nhật tiến trình.";
       
       if (err?.response?.data?.message) {
         errorMessage = err.response.data.message;
       } else if (err?.response?.data?.error) {
         errorMessage = err.response.data.error;
       } else if (err?.message === "Network Error") {
         errorMessage = "Không nhận được phản hồi từ máy chủ. Vui lòng kiểm tra kết nối.";
       } else if (err?.message) {
         errorMessage = err.message;
       }

               // Thêm thông tin về stage hiện tại và stage được chọn
        const selectedStage = availableStages.find(s => s.stageId === selectedStageId);
        const currentStage = latestProgress ? availableStages.find(s => s.stageId === latestProgress.stageId) : null;
        
        if (selectedStage && currentStage) {
          errorMessage += `\n\nThông tin chi tiết:`;
          errorMessage += `\n• Stage hiện tại: ${currentStage.stageName} (ID: ${currentStage.stageId})`;
          errorMessage += `\n• Stage được chọn: ${selectedStage.stageName} (ID: ${selectedStage.stageId})`;
          errorMessage += `\n• Thứ tự hiện tại: Bước ${currentStage.orderIndex}`;
          errorMessage += `\n• Thứ tự được chọn: Bước ${selectedStage.orderIndex}`;
        }
       
       setError(errorMessage);
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
      onSubmit={handleSubmit}
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
              Cập nhật tiến trình sơ chế
            </h2>
                         <p className="text-orange-100 text-sm">
               {failedStageInfo ? `Công đoạn cần cải thiện: ${failedStageInfo.stageName}` : latestProgress ? `Bước tiếp theo: ${latestProgress.stageName}` : 'Tạo tiến trình đầu tiên'}
             </p>
          </div>
        </div>
        
        {/* Close button */}
        <button
          type="button"
          onClick={() => onSuccess?.()}
          className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-all duration-200"
        >
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
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
              {failedStageInfo ? 'Thông tin bước Lỗi:' : 'Thông tin bước hiện tại:'}
            </span>
                         <span className="font-bold text-lg">
               {failedStageInfo ? failedStageInfo.stageName : latestProgress ? latestProgress.stageName : 'Chưa có tiến trình'}
             </span>
             {!failedStageInfo && latestProgress && (
               <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                 Bước {latestProgress.stepIndex}
               </span>
             )}
             {latestProgress && (
               <span className="ml-auto text-xs opacity-75">
                 Ngày trước: {new Date(latestProgress.progressDate).toLocaleDateString("vi-VN")}
               </span>
             )}
          </div>
          {failedStageInfo && (
            <div className="mt-3 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
              <strong>Lý do không đạt:</strong> {failedStageInfo.failureDetails}
            </div>
          )}
        </div>

        {/* Main form - 3 columns horizontal layout */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-8">
          
          {/* Column 1 - Basic Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-3">
              <div className="w-6 h-6 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              Thông tin cơ bản
            </h3>

            <div className="space-y-4">
                             {/* Stage Selection - Ẩn vì đã auto chọn */}
               {/* <div>
                 <label className="block text-sm font-semibold text-gray-700 mb-2">
                   Công đoạn thực hiện
                 </label>
                 {loadingStages ? (
                   <div className="w-full h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                     <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600"></div>
                   </div>
                 ) : (
                   <select
                     value={selectedStageId}
                     onChange={(e) => setSelectedStageId(e.target.value)}
                     className="w-full h-12 border-2 border-gray-200 rounded-lg px-4 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all duration-200"
                   >
                     <option value="">Chọn công đoạn...</option>
                     {availableStages.map((stage) => (
                       <option key={stage.stageId} value={stage.stageId}>
                         Bước {stage.orderIndex}: {stage.stageName}
                       </option>
                     ))}
                   </select>
                 )}
               </div> */}

              {/* Hiển thị thông tin stage bị fail khi có failedStageInfo */}
              {failedStageInfo && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Công đoạn cần cải thiện
                  </label>
                  <div className="w-full h-12 bg-red-50 border-2 border-red-200 rounded-lg px-4 flex items-center text-sm text-red-700 font-semibold">
                    {failedStageInfo.stageName}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Ngày thực hiện
                </label>
                <Input
                  type="date"
                  value={progressDate}
                  onChange={(e) => setProgressDate(e.target.value)}
                  required
                  className="w-full h-12 border-2 border-gray-200 rounded-lg px-4 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all duration-200"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Khối lượng đầu ra
                </label>
                <Input
                  type="number"
                  value={Number.isNaN(outputQuantity) ? 0 : outputQuantity}
                  min={0}
                  step="any"
                  onChange={(e) => setOutputQuantity(parseFloat(e.target.value))}
                  required
                  className="w-full h-12 border-2 border-gray-200 rounded-lg px-4 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all duration-200"
                  placeholder="Nhập khối lượng..."
                />
              </div>

                             <div>
                 <label className="block text-sm font-semibold text-gray-700 mb-2">
                   Đơn vị
                 </label>
                 <select
                   value={outputUnit}
                   onChange={(e) => setOutputUnit(e.target.value)}
                   required
                   className="w-full h-12 border-2 border-gray-200 rounded-lg px-4 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all duration-200"
                 >
                   <option value="">Chọn đơn vị...</option>
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

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Mô tả công đoạn
                </label>
                <Textarea
                  value={stageDescription}
                  onChange={(e) => setStageDescription(e.target.value)}
                  placeholder="Mô tả chi tiết về công đoạn thực hiện, phương pháp, điều kiện môi trường..."
                  className="w-full min-h-[100px] border-2 border-gray-200 rounded-lg px-4 py-3 text-sm resize-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all duration-200"
                  rows={4}
                />
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
              Thông số kỹ thuật
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Tên thông số
                </label>
                <Input
                  type="text"
                  value={parameterName}
                  onChange={(e) => setParameterName(e.target.value)}
                  placeholder="VD: Nhiệt độ, Độ ẩm..."
                  className="w-full h-10 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Giá trị
                </label>
                <Input
                  type="text"
                  value={parameterValue}
                  onChange={(e) => setParameterValue(e.target.value)}
                  placeholder="VD: 25, 80%..."
                  className="w-full h-10 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Đơn vị thông số
                </label>
                <Input
                  type="text"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder="VD: °C, %, kg..."
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
              Tài liệu minh họa
            </h3>

            <div className="space-y-3">
              {/* Photo upload */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Ảnh minh hoạ
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 text-center hover:border-pink-400 transition-colors bg-gray-50">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      setPhotoFiles(files);
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
                    {photoFiles.length > 0 ? `${photoFiles.length} ảnh` : 'Chọn ảnh'}
                  </label>
                </div>
              </div>

              {/* Video upload */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Video minh hoạ
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 text-center hover:border-teal-400 transition-colors bg-gray-50">
                  <input
                    type="file"
                    multiple
                    accept="video/*"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      setVideoFiles(files);
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
                    {videoFiles.length > 0 ? `${videoFiles.length} video` : 'Chọn video'}
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Media previews - Horizontal layout */}
        {(photoFiles.length > 0 || videoFiles.length > 0) && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Xem trước tài liệu:</h4>
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
              <span>Tối đa 10 files, 50MB</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Ảnh tự động nén</span>
            </div>
          </div>

          <div className="flex gap-4">
            <Button
              type="button"
              onClick={() => onSuccess?.()}
              variant="outline"
              className="px-6 py-3 border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-semibold rounded-lg transition-all duration-200"
            >
              Huỷ
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Đang lưu...
                </div>
              ) : (
                getButtonText()
              )}
            </Button>
          </div>
        </div>

        {error && (
          <div className="mt-6 p-6 bg-red-50 border-2 border-red-200 rounded-xl text-sm text-red-600">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <div className="font-bold mb-3 text-red-800">Lỗi cập nhật tiến trình:</div>
                <div className="whitespace-pre-line text-sm leading-relaxed bg-white p-4 rounded-lg border border-red-100">
                  {error}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </form>
  );
}
