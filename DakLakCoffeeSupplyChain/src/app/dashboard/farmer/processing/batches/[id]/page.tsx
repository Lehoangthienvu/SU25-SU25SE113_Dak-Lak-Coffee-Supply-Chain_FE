
"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import {
  getProcessingBatchById,
  ProcessingBatch,
} from "@/lib/api/processingBatches";
import { getEvaluationsByBatch, ProcessingBatchEvaluation, getEvaluationResultDisplayName, getEvaluationResultColor } from "@/lib/api/processingBatchEvaluations";
import StatusBadge from "@/components/processing-batches/StatusBadge";
import {
  PlusCircle,
  ArrowLeft,
  ArrowRight,
  Package,
  Calendar,
  User,
  Settings,
  Coffee,
  TrendingUp,
  Edit,
  AlertCircle,
  FileImage,
  Video,
  Scale,
  X,
  ClipboardCheck,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Pencil,
  Target,
  TrendingDown,
  Eye,
  RefreshCw,
  Clock
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ProcessingBatchProgress, ProcessingParameter, updateNextStages } from "@/lib/api/processingBatchProgress";
import { ProcessingWaste } from "@/lib/api/processingBatchWastes";
import CreateProcessingProgressForm from "@/components/processing-batches/CreateProcessingProgressForm";
import AdvanceProcessingProgressForm from "@/components/processing-batches/AdvanceProcessingProgressForm";
import UpdateAfterEvaluationForm from "@/components/processing-batches/UpdateAfterEvaluationForm";
import UpdateNextStagesForm from "@/components/processing-batches/UpdateNextStagesForm";
import FailedStagesList from "@/components/processing-batches/FailedStagesList";
import EvaluationCriteriaForm from "@/components/processing-batches/EvaluationCriteriaForm";
import FailureInfoCard from "@/components/processing-batches/FailureInfoCard";
import ProgressGuidanceCard from "@/components/processing-batches/ProgressGuidanceCard";

import { ProcessingStatus } from "@/lib/constants/batchStatus";
import { StageFailureParser, StageFailureInfo } from "@/lib/helpers/evaluationHelpers";
import { getProcessingStagesByMethodId } from "@/lib/api/processingStages";
import { ProcessingErrorDisplay } from "@/components/shared/ProcessingErrorDisplay";

import EvaluationCriteriaDisplay from "@/components/processing-batches/EvaluationCriteriaDisplay";

export default function ViewProcessingBatch() {
  const { t } = useTranslation();
  const { id } = useParams();
  const router = useRouter();
  const [batch, setBatch] = useState<ProcessingBatch | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [openAdvanceModal, setOpenAdvanceModal] = useState(false);
  const [openUpdateAfterEvaluationModal, setOpenUpdateAfterEvaluationModal] = useState(false);
  const [openUpdateNextStagesModal, setOpenUpdateNextStagesModal] = useState(false);
  const [selectedStageForUpdate, setSelectedStageForUpdate] = useState<{
    stageName: string;
    stageOrder: number;
  } | null>(null);
  const [openEvaluationCriteriaModal, setOpenEvaluationCriteriaModal] = useState(false);
  const [selectedEvaluation, setSelectedEvaluation] = useState<ProcessingBatchEvaluation | null>(null);
  const [latestProgress, setLatestProgress] = useState<ProcessingBatchProgress | null>(null);
  const [evaluations, setEvaluations] = useState<ProcessingBatchEvaluation[]>([]);

  // Failure info state
  const [failureInfo, setFailureInfo] = useState<StageFailureInfo | null>(null);

  // Media viewer dialog states
  const [mediaViewerOpen, setMediaViewerOpen] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<{
    url: string;
    type: 'image' | 'video';
    caption?: string;
  } | null>(null);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [allMedia, setAllMedia] = useState<Array<{
    url: string;
    type: 'image' | 'video';
    caption?: string;
  }>>([]);

  // Tối ưu: Cache các hàm format để tránh tạo lại
  const formatNumber = useCallback((value: number | string | undefined) => {
    const number = Number(value);
    return isNaN(number)
      ? "-"
      : new Intl.NumberFormat("vi-VN").format(number);
  }, []);

  // Tối ưu: Cache tính toán totalOutputQuantity từ API response

  // Tối ưu: Cache tính toán wastes từ progresses
  const allWastes = useMemo(() => {
    if (!batch?.progresses) return [];
    const wastes: ProcessingWaste[] = [];
    batch.progresses.forEach(progress => {
      if (progress.wastes && progress.wastes.length > 0) {
        wastes.push(...progress.wastes);
      }
    });
    return wastes;
  }, [batch?.progresses]);



  // Hàm xử lý khi click vào nút cập nhật stage
  const handleUpdateStage = useCallback((stageName: string, stageOrder: number) => {
    setSelectedStageForUpdate({ stageName, stageOrder });
    setOpenUpdateAfterEvaluationModal(true);
  }, []);

  // 🔧 MỚI: Hàm xử lý khi click vào nút "Cập nhật tiếp các stages"
  const handleUpdateNextStages = useCallback(() => {
    setOpenUpdateNextStagesModal(true);
  }, []);

  // Hàm mở media viewer với tất cả media
  const openMediaViewer = useCallback((media: { url: string; type: 'image' | 'video'; caption?: string }) => {
    // Thu thập tất cả media từ tất cả progresses
    const allMediaList: Array<{ url: string; type: 'image' | 'video'; caption?: string }> = [];
    let targetIndex = 0;
    let foundTarget = false;

    batch?.progresses?.forEach(progress => {
      if (progress.mediaFiles) {
        progress.mediaFiles.forEach((mediaFile, idx) => {
          allMediaList.push({
            url: mediaFile.mediaUrl,
            type: mediaFile.mediaType,
            caption: mediaFile.caption
          });

          // Tìm index của media được click
          if (mediaFile.mediaUrl === media.url && !foundTarget) {
            targetIndex = allMediaList.length - 1;
            foundTarget = true;
          }
        });
      }
    });

    setAllMedia(allMediaList);
    setCurrentMediaIndex(targetIndex);
    setSelectedMedia(media);
    setMediaViewerOpen(true);
  }, [batch?.progresses]);

  // Hàm chuyển media
  const navigateMedia = useCallback((direction: 'prev' | 'next') => {
    if (allMedia.length === 0) return;

    let newIndex = currentMediaIndex;
    if (direction === 'prev') {
      newIndex = currentMediaIndex > 0 ? currentMediaIndex - 1 : allMedia.length - 1;
    } else {
      newIndex = currentMediaIndex < allMedia.length - 1 ? currentMediaIndex + 1 : 0;
    }

    setCurrentMediaIndex(newIndex);
    setSelectedMedia(allMedia[newIndex]);
  }, [allMedia, currentMediaIndex]);

  // Xử lý keyboard events
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!mediaViewerOpen) return;

      switch (event.key) {
        case 'Escape':
          setMediaViewerOpen(false);
          break;
        case 'ArrowLeft':
          navigateMedia('prev');
          break;
        case 'ArrowRight':
          navigateMedia('next');
          break;
        case 'ArrowUp':
        case 'ArrowDown':
          // Có thể thêm zoom in/out cho ảnh
          break;
      }
    };

    if (mediaViewerOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [mediaViewerOpen, navigateMedia]);

  useEffect(() => {
    const fetchBatch = async () => {
      if (typeof id === "string") {
        try {
          setLoading(true);
          setError(null);

          // Tối ưu: Chỉ cần fetch 1 API call thay vì 3
          const data = await getProcessingBatchById(id);

          setBatch(data);

        } catch (err: unknown) {
          console.error('Error fetching batch:', err);
          setError(err);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchBatch();
  }, [id]);

  useEffect(() => {
    if (batch?.progresses?.length) {
      const latest = [...batch.progresses].sort(
        (a, b) => (b.stepIndex ?? 0) - (a.stepIndex ?? 0)
      )[0];
      setLatestProgress(latest);
    }
  }, [batch]);

  useEffect(() => {
    const fetchEvaluations = async () => {
      if (typeof id === "string") {
        try {
          const data = await getEvaluationsByBatch(id);
          setEvaluations(data);

          // Parse failure info từ evaluation cuối cùng
          if (data && data.length > 0) {
            const latestEvaluation = data[0]; // Sắp xếp theo createdAt desc
            if (latestEvaluation.evaluationResult === 'Fail') {
              const failureInfo = StageFailureParser.parseFailureFromComments(latestEvaluation.comments || '');
              setFailureInfo(failureInfo);
            }
          }
        } catch (err: unknown) {
          console.error('Error fetching evaluations:', err);
          setError(err);
        }
      }
    };
    fetchEvaluations();
  }, [id]);

  // Kiểm tra xem có đánh giá fail không - bao gồm cả khi đã retry một số stages
  const hasFailedEvaluation = useMemo(() => {
    if (!evaluations || evaluations.length === 0) return false;

    // 🔧 DEBUG: Log tất cả evaluations để kiểm tra
    console.log('🔍 DEBUG: All evaluations:', evaluations);
    
    // Kiểm tra xem có evaluation nào có thông tin về stages cần retry không
    const hasEvaluationWithFailedStages = evaluations.some(evaluation => {
      const comments = evaluation.comments || '';
      console.log('🔍 DEBUG: Evaluation comments:', comments);
      console.log('🔍 DEBUG: Evaluation result:', evaluation.evaluationResult);
      
             // Kiểm tra cả evaluationResult === 'Fail' và comments có chứa thông tin stages
       const hasFailedResult = evaluation.evaluationResult === 'Fail';
       const hasStageInfo = comments.includes('🔧 Giai đoạn cần cập nhật:') || 
                           comments.includes('giai đoạn cần cập nhật:') || 
                           comments.includes('Giai đoạn cần cập nhật:') ||
                           comments.includes('Tiến trình có vấn đề:') ||
                           comments.includes('StageId:');
      
      console.log('🔍 DEBUG: Has failed result:', hasFailedResult);
      console.log('🔍 DEBUG: Has stage info:', hasStageInfo);
      
      return hasFailedResult || hasStageInfo;
    });

    console.log('🔍 DEBUG: Has failed evaluation:', hasEvaluationWithFailedStages);
    return hasEvaluationWithFailedStages;
  }, [evaluations]);

  // State để lưu max OrderIndex của method và stages info
  const [maxOrderIndex, setMaxOrderIndex] = useState<number>(0);
  const [stagesInfo, setStagesInfo] = useState<Array<{stageId: number, stageName: string, orderIndex: number}>>([]);

  // Lấy thông tin stage bị fail
  const failedStageInfo = useMemo(() => {
    console.log('🔍 DEBUG failedStageInfo useMemo triggered:');
    console.log('  - hasFailedEvaluation:', hasFailedEvaluation);
    console.log('  - evaluations length:', evaluations?.length);
    console.log('  - stagesInfo length:', stagesInfo.length);
    console.log('  - stagesInfo:', stagesInfo);
    
    if (!hasFailedEvaluation || !evaluations || evaluations.length === 0) return null;

    // Tìm evaluation có thông tin về stages cần retry
    const evaluationWithFailedStages = evaluations.find(evaluation => {
      const comments = evaluation.comments || '';
      return comments.includes('Giai đoạn cần cập nhật:') || comments.includes('Tiến trình có vấn đề:');
    });

    if (!evaluationWithFailedStages) return null;

    const comments = evaluationWithFailedStages.comments || '';

    // Sử dụng StageFailureParser để parse thông tin
    const failureInfo = StageFailureParser.parseFailureFromComments(comments);

    if (failureInfo) {
      // FIX: Map OrderIndex thành StageId thực từ stagesInfo
      const actualStageId = stagesInfo.find(stage => stage.orderIndex === failureInfo.failedOrderIndex)?.stageId;
      
      console.log('🔍 DEBUG failedStageInfo mapping:');
      console.log('  - Parsed OrderIndex:', failureInfo.failedOrderIndex);
      console.log('  - Parsed StageName:', failureInfo.failedStageName);
      console.log('  - Available stagesInfo:', stagesInfo);
      console.log('  - Mapped StageId:', actualStageId);
      
      return {
        stageId: actualStageId || failureInfo.failedOrderIndex, // Fallback về OrderIndex nếu không tìm thấy
        stageName: failureInfo.failedStageName || t('processing.pages.farmerBatches.batchDetail.status.unknown'),
        failureDetails: failureInfo.failureDetails || t('processing.pages.farmerBatches.batchDetail.status.canContinue'),
        evaluationId: evaluationWithFailedStages.evaluationId
      };
    }

    return null;
  }, [hasFailedEvaluation, evaluations, stagesInfo, t]);

  // Lấy OrderIndex lớn nhất trong method và thông tin stages
  useEffect(() => {
    const fetchStagesInfo = async () => {
      if (batch?.methodId) {
        try {
          const stages = await getProcessingStagesByMethodId(batch.methodId);

          if (stages && stages.length > 0) {
            // Tìm OrderIndex lớn nhất
            const maxIndex = Math.max(...stages.map((stage: any) => stage.orderIndex));
            setMaxOrderIndex(maxIndex);
            
            // Lưu thông tin stages để map StageId sang tên stage
            const stagesData = stages.map((stage: any) => ({
              stageId: stage.stageId,
              stageName: stage.stageName,
              orderIndex: stage.orderIndex
            }));
            setStagesInfo(stagesData);
          } else {
            setMaxOrderIndex(batch.stageCount || 0);
            setStagesInfo([]);
          }
        } catch (error) {
          console.error("DEBUG: Error fetching stages:", error);
          // Fallback: sử dụng stageCount từ batch
          setMaxOrderIndex(batch.stageCount || 0);
          setStagesInfo([]);
        }
      }
    };

    fetchStagesInfo();
  }, [batch?.methodId, batch?.stageCount]);

  // Lấy danh sách các stage bị fail
  const failedStages = useMemo(() => {
    if (!evaluations || evaluations.length === 0) return [];

         // 🔧 MỚI: Tìm evaluation có thông tin về stages cần retry - mở rộng pattern matching
     const evaluationWithFailedStages = evaluations.find(evaluation => {
       const comments = evaluation.comments || '';
       return comments.includes('🔧 Giai đoạn cần cập nhật:') || 
              comments.includes('giai đoạn cần cập nhật:') || 
              comments.includes('Giai đoạn cần cập nhật:') ||
              comments.includes('Tiến trình có vấn đề:') ||
              comments.includes('StageId:');
     });

    if (!evaluationWithFailedStages) return [];

    const comments = evaluationWithFailedStages.comments || '';
    console.log('🔍 DEBUG: Parsing comments for failed stages:', comments);

    // Parse danh sách stage từ comments
    const stages: Array<{name: string, order: number}> = [];

         // 🔧 MỚI: Pattern 1 - "🔧 Giai đoạn cần cập nhật: StageId: 1, StageId: 2, StageId: 3, StageId: 4"
     const stageIdPattern = /🔧 Giai đoạn cần cập nhật:\s*StageId:\s*([\d,\s]+)/;
     const stageIdMatch = comments.match(stageIdPattern);
     
     if (stageIdMatch) {
       console.log('🔍 DEBUG: Found StageId pattern:', stageIdMatch[1]);
       const stageIds = stageIdMatch[1].split(',').map(id => parseInt(id.trim()));
       
       // 🔧 MỚI: Lấy thông tin stage từ stagesInfo để map StageId sang tên stage
       stageIds.forEach(stageId => {
         const stageInfo = stagesInfo.find(s => s.stageId === stageId);
         if (stageInfo) {
           stages.push({
             name: stageInfo.stageName,
             order: stageInfo.orderIndex
           });
         } else {
           // Fallback nếu không tìm thấy stage info
           stages.push({
             name: `Stage ${stageId}`,
             order: stageId
           });
         }
       });
     }

    // Pattern 2: "Giai đoạn cần cập nhật: Thu hoạch (Thứ tự: 1), Phơi (Thứ tự: 2), Xay vỏ (Thứ tự: 3)"
    if (stages.length === 0) {
      const stagePattern = /Giai đoạn cần cập nhật:\s*(.+?)(?:\n|$)/;
      const stageMatch = comments.match(stagePattern);
      
      if (stageMatch) {
        const stageText = stageMatch[1];
        console.log('🔍 DEBUG: Found stage pattern:', stageText);
        // 🔧 CẢI THIỆN: Pattern để parse chính xác hơn, loại bỏ dấu phẩy
        const individualStagePattern = /([^(,]+)\s*\(Thứ tự:\s*(\d+)\)/g;
        
        let match;
        while ((match = individualStagePattern.exec(stageText)) !== null) {
          // 🔧 MỚI: Loại bỏ dấu phẩy và khoảng trắng thừa
          const stageName = match[1].trim().replace(/^[,\s]+|[,\s]+$/g, '');
          stages.push({
            name: stageName,
            order: parseInt(match[2])
          });
        }
      }
    }

    // Pattern 3: "Tiến trình có vấn đề: Thu hoạch (Thứ tự: 1), Phơi (Thứ tự: 2), Xay vỏ (Thứ tự: 3)"
    if (stages.length === 0) {
      const problemPattern = /Tiến trình có vấn đề:\s*(.+?)(?:\n|$)/;
      const problemMatch = comments.match(problemPattern);
      
      if (problemMatch) {
        const stageText = problemMatch[1];
        console.log('🔍 DEBUG: Found problem pattern:', stageText);
        // 🔧 CẢI THIỆN: Pattern để parse chính xác hơn, loại bỏ dấu phẩy
        const individualStagePattern = /([^(,]+)\s*\(Thứ tự:\s*(\d+)\)/g;
        
        let match;
        while ((match = individualStagePattern.exec(stageText)) !== null) {
          // 🔧 MỚI: Loại bỏ dấu phẩy và khoảng trắng thừa
          const stageName = match[1].trim().replace(/^[,\s]+|[,\s]+$/g, '');
          stages.push({
            name: stageName,
            order: parseInt(match[2])
          });
        }
      }
    }

    console.log('🔍 DEBUG: Parsed stages:', stages);

    // 🔧 MỚI: Loại bỏ các stages đã được retry
    const retriedStages = batch?.progresses?.filter(p => 
      p.stageDescription && p.stageDescription.includes('Làm lại (Retry)')
    ).map(p => p.stageName) || [];

    const remainingStages = stages.filter(stage => 
      !retriedStages.includes(stage.name)
    );

         console.log('🔍 DEBUG: Remaining stages after retry filter:', remainingStages);
     return remainingStages;
   }, [evaluations, batch?.progresses, batch?.methodId, stagesInfo]);

  // Lấy OrderIndex lớn nhất trong method và thông tin stages
  useEffect(() => {
    const fetchStagesInfo = async () => {
      if (batch?.methodId) {
        try {
          const stages = await getProcessingStagesByMethodId(batch.methodId);

          if (stages && stages.length > 0) {
            // Tìm OrderIndex lớn nhất
            const maxIndex = Math.max(...stages.map((stage: any) => stage.orderIndex));
            setMaxOrderIndex(maxIndex);
            
            // Lưu thông tin stages để map StageId sang tên stage
            const stagesData = stages.map((stage: any) => ({
              stageId: stage.stageId,
              stageName: stage.stageName,
              orderIndex: stage.orderIndex
            }));
            setStagesInfo(stagesData);
          } else {
            setMaxOrderIndex(batch.stageCount || 0);
            setStagesInfo([]);
          }
        } catch (error) {
          console.error("DEBUG: Error fetching stages:", error);
          // Fallback: sử dụng stageCount từ batch
          setMaxOrderIndex(batch.stageCount || 0);
          setStagesInfo([]);
        }
      }
    };

    fetchStagesInfo();
  }, [batch?.methodId, batch?.stageCount]);

  // Kiểm tra xem có phải stage cuối không
  const isAtLastStage = useMemo(() => {
    if (!batch?.progresses || batch.progresses.length === 0) return false;

    const latestProgress = batch.progresses[batch.progresses.length - 1];
    if (!latestProgress) return false;



    // Nếu maxOrderIndex = 0 (API lỗi), sử dụng logic fallback
    if (maxOrderIndex === 0) {
      // Sử dụng stageCount từ batch
      const expectedMaxStage = batch.stageCount || 0;
      const isLast = expectedMaxStage > 0 && latestProgress.stepIndex >= expectedMaxStage;

      return isLast;
    }

    const isLast = latestProgress.stepIndex >= maxOrderIndex;

    return isLast;
  }, [batch?.progresses, maxOrderIndex, batch?.stageCount]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100">
        <div className="p-6 max-w-6xl mx-auto space-y-8">
          {/* Header Skeleton */}
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 bg-gray-200 rounded-lg animate-pulse"></div>
            <div className="space-y-2">
              <div className="h-8 bg-gray-200 rounded-lg w-64 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-48 animate-pulse"></div>
            </div>
          </div>

          {/* Content Skeleton */}
          <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-orange-200 overflow-hidden">
            <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-6">
              <div className="h-6 bg-white/20 rounded w-48 animate-pulse"></div>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                    <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Loading Indicator */}
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
                            <p className="text-lg text-gray-600 font-medium">{t('processing.pages.farmerBatches.batchDetail.loading.title')}</p>
                <p className="text-sm text-gray-500">{t('processing.pages.farmerBatches.batchDetail.loading.description')}</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100 flex items-center justify-center">
        <div className="text-center space-y-6 max-w-md mx-auto p-6">
          <ProcessingErrorDisplay error={error} />
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="flex items-center gap-2 mx-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('processing.pages.farmerBatches.batchDetail.error.back')}
          </Button>
        </div>
      </div>
    );
  }

  if (!batch) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8 text-gray-400" />
          </div>
                                <h2 className="text-xl font-semibold text-gray-900">{t('processing.pages.farmerBatches.batchDetail.notFound.title')}</h2>
            <p className="text-gray-600">{t('processing.pages.farmerBatches.batchDetail.notFound.description')}</p>
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('processing.pages.farmerBatches.batchDetail.notFound.back')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100">
      <div className="p-6 max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
              {t('processing.pages.farmerBatches.batchDetail.title')} - {batch.batchCode}
            </h1>
            <p className="text-gray-600">{t('processing.pages.farmerBatches.batchDetail.subtitle')}</p>

            {/* Thông báo trạng thái */}
            {batch.status === ProcessingStatus.Completed && (
              <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1 rounded-full text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                  <span className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    {t('processing.pages.farmerBatches.batchDetail.status.completed')}
                  </span>
              </div>
            )}

            {batch.status === ProcessingStatus.AwaitingEvaluation && (
              <div className="flex items-center gap-2 text-orange-600 bg-orange-50 px-3 py-1 rounded-full text-sm">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span>{t('processing.pages.farmerBatches.batchDetail.status.awaitingEvaluation')}</span>
              </div>
            )}

            {batch.status !== ProcessingStatus.Completed &&
              batch.status !== ProcessingStatus.AwaitingEvaluation &&
              batch.progresses && batch.progresses.length > 0 &&
              !isAtLastStage && (
                <div className="flex items-center gap-2 text-blue-600 bg-blue-50 px-3 py-1 rounded-full text-sm">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>{t('processing.pages.farmerBatches.batchDetail.status.canContinue')}</span>
                </div>
              )}


          </div>
          <div className="flex items-center gap-3">
            {/* Nút cập nhật tiến trình - hiển thị khi có thể cập nhật VÀ chưa ở stage cuối HOẶC có stages cần retry */}
            {/* 🔧 FIX: Không hiển thị nút "Cập nhật tiến trình" khi có failed stages để tránh nhầm lẫn */}
            {batch.progresses && batch.progresses.length > 0 &&
              batch.status !== ProcessingStatus.Completed &&
              batch.status !== ProcessingStatus.AwaitingEvaluation &&
              !isAtLastStage && 
              failedStages.length === 0 && (
                <Button
                  onClick={() => setOpenAdvanceModal(true)}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white transition-all duration-200"
                >
                  <PlusCircle className="w-4 h-4" />
                  {t('processing.pages.farmerBatches.batchDetail.quickActions.advanceProgress')}
                </Button>
              )}

            {/* 🔧 MỚI: Nút cập nhật tiếp các stages sau stages fail */}
            {hasFailedEvaluation && batch.status === ProcessingStatus.InProgress && failedStages.length === 0 && (
              <Button
                onClick={handleUpdateNextStages}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white transition-all duration-200"
              >
                <TrendingUp className="w-4 h-4" />
                Cập nhật tiếp các stages
              </Button>
            )}

            {/* Nút tạo tiến trình đầu tiên - chỉ hiển thị khi chưa có progress */}
            {(!batch.progresses || batch.progresses.length === 0) && (
              <Button
                onClick={() => {

                  setOpenCreateModal(true);
                }}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white transition-all duration-200"
              >
                <PlusCircle className="w-4 h-4" />
                {t('processing.pages.farmerBatches.batchDetail.quickActions.createProgress')}
              </Button>
            )}





            <Button
              variant="outline"
              onClick={() => router.push(`/dashboard/farmer/processing/batches/${id}/edit`)}
              className="flex items-center gap-2 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200"
            >
              <Edit className="w-4 h-4" />
              {t('processing.pages.farmerBatches.batchDetail.quickActions.editInfo')}
            </Button>
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="flex items-center gap-2 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
            >
              <ArrowLeft className="w-4 h-4" />
              {t('farmerBatchDetail.batchDetail.error.back')}
            </Button>
          </div>
        </div>

                 {/* 🔧 ALERT: Hiển thị FailedStagesList khi có stages cần retry, không phụ thuộc vào evaluation mới nhất */}
         {failedStages.length > 0 && (
           batch.status === ProcessingStatus.InProgress ||
           batch.status === ProcessingStatus.AwaitingEvaluation
         ) && (
           <div className="mb-6">
             <FailedStagesList
               failedStages={failedStages}
               batchId={id as string}
               onUpdateStage={handleUpdateStage}
             />
           </div>
         )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-orange-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">{t('processing.pages.farmerBatches.batchDetail.basicInfo.inputQuantity')}</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatNumber(batch.totalInputQuantity)}
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-xl">
                <Scale className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-orange-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">{t('processing.pages.farmerBatches.batchDetail.stats.output')}</p>
                        <p className="text-2xl font-bold text-amber-600">
          {latestProgress?.outputQuantity || 0}kg
        </p>
              </div>
              <div className="p-3 bg-amber-100 rounded-xl">
                <Package className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-orange-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">{t('processing.pages.farmerBatches.batchDetail.stats.stage')}</p>
                <p className="text-2xl font-bold text-orange-600">
                  {batch.progresses?.length || 0}
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-xl">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">{t('processing.pages.farmerBatches.batchDetail.basicInfo.status')}</p>
                <div className="mt-1">
                  <StatusBadge status={batch.status} />
                </div>
              </div>
              <div className="p-3 bg-orange-100 rounded-xl">
                <Settings className="w-6 h-6 text-orange-600" />
              </div>
            </div>


          </div>
        </div>

        {/* Main Info Card */}
        <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-orange-200 overflow-hidden">
          <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-6 text-white">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Package className="w-5 h-5" />
              {t('processing.pages.farmerBatches.batchDetail.basicInfo.title')}
            </h2>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Package className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{t('processing.pages.farmerBatches.batchDetail.basicInfo.batchCode')}</p>
                    <p className="font-semibold text-gray-900">{batch.batchCode}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Package className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{t('processing.pages.farmerBatches.batchDetail.basicInfo.systemCode')}</p>
                    <p className="font-semibold text-gray-900">{batch.systemBatchCode}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Calendar className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{t('processing.pages.farmerBatches.batchDetail.basicInfo.cropSeason')}</p>
                    <p className="font-semibold text-gray-900">{batch.cropSeasonName}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <User className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{t('processing.pages.farmerBatches.batchDetail.basicInfo.farmer')}</p>
                    <p className="font-semibold text-gray-900">{batch.farmerName}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <Settings className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{t('processing.pages.farmerBatches.batchDetail.basicInfo.method')}</p>
                    <p className="font-semibold text-gray-900">{batch.methodName}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <Coffee className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{t('processing.pages.farmerBatches.batchDetail.basicInfo.type')}</p>
                    <p className="font-semibold text-gray-900">
                      {batch.typeName || t('processing.pages.farmerBatches.batchDetail.fallback.unknownType')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Scale className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{t('processing.pages.farmerBatches.batchDetail.basicInfo.inputQuantity')}</p>
                    <p className="font-semibold text-gray-900">
                      {formatNumber(batch.totalInputQuantity)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Calendar className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{t('processing.pages.farmerBatches.batchDetail.basicInfo.createdAt')}</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(batch.createdAt).toLocaleString("vi-VN")}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        



        {/* Progress Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6 text-white">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                {t('processing.pages.farmerBatches.batchDetail.progress.title')}
              </h2>

              {/* Nút tạo tiến trình đầu tiên đã được di chuyển lên header */}

              {/* Nút cập nhật tiến trình đã được di chuyển lên header */}

              {/* Hiển thị thông báo nếu đã hoàn thành */}
              {batch.status === ProcessingStatus.Completed && (
                <div className="flex items-center gap-2 text-white/80">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-sm">{t('processing.pages.farmerBatches.batchDetail.status.completed')}</span>
                </div>
              )}

              {/* Hiển thị thông báo nếu đang chờ đánh giá */}
              {batch.status === ProcessingStatus.AwaitingEvaluation && (
                <div className="flex items-center gap-2 text-white/80">
                  <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                  <span className="text-sm">{t('processing.pages.farmerBatches.batchDetail.status.awaitingEvaluation')}</span>
                </div>
              )}
            </div>
          </div>

          <div className="p-6">
            

            {batch.progresses && batch.progresses.length > 0 ? (
              <div className="space-y-4">
                {batch.progresses
                  .sort((a, b) => a.stepIndex - b.stepIndex) // Sắp xếp theo stepIndex
                  .map((progress, idx) => {
                    // 🔧 MỚI: Kiểm tra retry dựa trên StageDescription hoặc so sánh stageName
                    const isRetryByDescription = progress.stageDescription && progress.stageDescription.includes('Làm lại (Retry)');
                    const previousProgress = idx > 0 ? batch.progresses.find(p => p.stepIndex === progress.stepIndex - 1) : null;
                    const isRetryByStageName = previousProgress && previousProgress.stageName === progress.stageName;
                    const isRetry = isRetryByDescription || isRetryByStageName;
                    
                    // 🔧 DEBUG: Log để kiểm tra
                    console.log(`Progress ${progress.stepIndex}:`, {
                      stageName: progress.stageName,
                      stageDescription: progress.stageDescription,
                      isRetryByDescription,
                      isRetryByStageName,
                      isRetry
                    });

                    return (
                      <div
                        key={idx}
                        className={`bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-200 hover:border-purple-300 transition-all duration-300 hover:shadow-lg p-6 ${isRetry
                            ? 'border-orange-300 hover:border-orange-400 bg-gradient-to-br from-orange-50 to-amber-50'
                            : 'border-gray-200 hover:border-purple-300'
                          }`}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className={`px-3 py-1 rounded-full text-sm font-medium ${isRetry
                                  ? 'bg-orange-100 text-orange-700'
                                  : 'bg-purple-100 text-purple-700'
                                }`}>
                                {t('processing.pages.farmerBatches.batchDetail.progress.step')} {progress.stepIndex}
                                {isRetry && (
                                  <span className="ml-2 text-xs bg-orange-200 text-orange-800 px-2 py-0.5 rounded-full">
                                    Làm lại
                                  </span>
                                )}
                              </span>
                              <h3 className="font-semibold text-gray-900 text-lg">
                                { progress.stageName}
                               
                              </h3>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Scale className="w-4 h-4 text-green-600" />
                            <span className="font-medium">{t('processing.pages.farmerBatches.batchDetail.progress.outputQuantity')}:</span>
                            <span>{progress.outputQuantity} {progress.outputUnit || 'kg'}</span>
                          </div>

                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <TrendingDown className="w-4 h-4 text-red-600" />
                            <span className="font-medium">{t('processing.pages.farmerBatches.batchDetail.progress.waste')}:</span>
                            <span className="text-red-600">
                              {progress.wastes && progress.wastes.length > 0
                                ? progress.wastes.reduce((total, waste) => total + Number(waste.quantity), 0).toFixed(1) + ' ' + (progress.wastes[0]?.unit || 'kg')
                                : t('processing.pages.farmerBatches.batchDetail.fallback.zeroQuantity')
                              }
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <User className="w-4 h-4 text-blue-600" />
                            <span className="font-medium">{t('processing.pages.farmerBatches.batchDetail.progress.updatedBy')}:</span>
                            <span>{progress.updatedByName ?? t('processing.pages.farmerBatches.batchDetail.fallback.noDate')}</span>
                          </div>

                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="w-4 h-4 text-purple-600" />
                            <span className="font-medium">{t('processing.pages.farmerBatches.batchDetail.progress.executionDate')}:</span>
                            <span>{new Date(progress.progressDate).toLocaleDateString('vi-VN')}</span>
                          </div>
                        </div>

                        {/* Media Section */}
                        {progress.mediaFiles && progress.mediaFiles.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-gray-100">
                            <h4 className="text-sm font-medium text-gray-700 mb-3">{t('processing.pages.farmerBatches.batchDetail.progress.media.title')}</h4>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                              {progress.mediaFiles.map((media, mediaIdx) => (
                                <div key={mediaIdx} className="relative group">
                                  {media.mediaType === 'image' ? (
                                    <div className="relative aspect-square overflow-hidden rounded-lg shadow-md">
                                      <img
                                        src={media.mediaUrl}
                                        alt={media.caption || `${t('processing.pages.farmerBatches.batchDetail.progress.media.image')} ${mediaIdx + 1} của ${progress.stageName}`}
                                        className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                                        loading="lazy"
                                        onClick={() => openMediaViewer({
                                          url: media.mediaUrl,
                                          type: 'image',
                                          caption: media.caption
                                        })}
                                      />
                                      <div className="absolute top-2 left-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded-md font-medium">
                                        {t('processing.pages.farmerBatches.batchDetail.progress.media.image')}
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="relative aspect-square overflow-hidden rounded-lg shadow-md">
                                      <video
                                        className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                                        preload="metadata"
                                        onClick={() => openMediaViewer({
                                          url: media.mediaUrl,
                                          type: 'video',
                                          caption: media.caption
                                        })}
                                      >
                                        <source src={media.mediaUrl} type="video/mp4" />
                                      </video>
                                      <div className="absolute top-2 left-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded-md font-medium">
                                        {t('processing.pages.farmerBatches.batchDetail.progress.media.video')}
                                      </div>
                                      {/* Play button overlay */}
                                      <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="bg-black bg-opacity-40 rounded-full p-2">
                                          <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M8 5v14l11-7z" />
                                          </svg>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                  {media.caption && (
                                    <p className="text-xs text-gray-600 mt-2 truncate" title={media.caption}>
                                      {media.caption}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Legacy Media Support (for backward compatibility) */}
                        {(!progress.mediaFiles || progress.mediaFiles.length === 0) && (progress.photoUrl || progress.videoUrl) && (
                          <div className="mt-4 pt-4 border-t border-gray-100">
                            <h4 className="text-sm font-medium text-gray-700 mb-3">{t('processing.pages.farmerBatches.batchDetail.progress.media.legacy')}</h4>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                              {progress.photoUrl && (
                                <div className="relative aspect-square overflow-hidden rounded-lg shadow-md">
                                  <img
                                    src={progress.photoUrl}
                                    alt={`Photo of ${progress.stageName}`}
                                    className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                                    onClick={() => progress.photoUrl && window.open(progress.photoUrl, '_blank')}
                                  />
                                  <div className="absolute top-2 left-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded-md font-medium">
                                    {t('processing.pages.farmerBatches.batchDetail.progress.media.image')}
                                  </div>
                                </div>
                              )}

                              {progress.videoUrl && (
                                <div className="relative aspect-square overflow-hidden rounded-lg shadow-md">
                                  <video
                                    className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                                    preload="metadata"
                                    onClick={() => progress.videoUrl && window.open(progress.videoUrl, '_blank')}
                                  >
                                    <source src={progress.videoUrl} />
                                  </video>
                                  <div className="absolute top-2 left-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded-md font-medium">
                                    {t('processing.pages.farmerBatches.batchDetail.progress.media.video')}
                                  </div>
                                  {/* Play button overlay */}
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="bg-black bg-opacity-40 rounded-full p-2">
                                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M8 5v14l11-7z" />
                                      </svg>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Parameters Section */}
                        {progress.parameters && progress.parameters.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-gray-100">
                            <h4 className="text-sm font-medium text-gray-700 mb-3">{t('processing.pages.farmerBatches.batchDetail.progress.parameters.title')}</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {progress.parameters.map((parameter, paramIdx: number) => (
                                <div key={paramIdx} className="flex items-center gap-2 text-sm text-gray-600">
                                  <Settings className="w-4 h-4 text-blue-600" />
                                  <span className="font-medium">{parameter.parameterName}:</span>
                                  <span>{parameter.parameterValue} {parameter.unit}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Wastes Section */}
                        {progress.wastes && progress.wastes.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-gray-100">
                            <h4 className="text-sm font-medium text-gray-700 mb-3">{t('processing.pages.farmerBatches.batchDetail.progress.wastes.title')}</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {progress.wastes.map((waste: ProcessingWaste, wasteIdx: number) => (
                                <div key={wasteIdx} className="flex items-center gap-2 text-sm text-gray-600">
                                  <Package className="w-4 h-4 text-red-600" />
                                  <span className="font-medium">{waste.wasteType}:</span>
                                  <span>{waste.quantity} {waste.unit}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">{t('processing.pages.farmerBatches.batchDetail.progress.noProgress.title')}</h3>
                <p className="text-gray-500">{t('processing.pages.farmerBatches.batchDetail.progress.noProgress.description')}</p>
              </div>
            )}

            {/* 🔧 Nút cập nhật tiếp các stages sau khi retry - cho farmer nhập thủ công */}
            {(() => {
              // Kiểm tra xem có progress retry không
              const hasRetryProgress = batch?.progresses?.some(p => 
                p.stageDescription && p.stageDescription.includes('Làm lại (Retry)')
              );
              
              // Kiểm tra xem đã hoàn thành tất cả failed stages chưa (tức là không còn failed stages nào cần retry)
              const allFailedStagesRetried = failedStages.length === 0 && hasFailedEvaluation;
              
              // Hiển thị nút khi: có retry progress, đã retry xong tất cả failed stages, chưa ở AwaitingEvaluation
              const shouldShowUpdateNextStagesButton = hasRetryProgress && 
                                                      allFailedStagesRetried && 
                                                      batch?.status !== ProcessingStatus.AwaitingEvaluation &&
                                                      batch?.status !== ProcessingStatus.Completed;
              
              console.log('🔍 Progress Section - Update Next Stages Button Logic:', {
                hasRetryProgress,
                allFailedStagesRetried,
                failedStagesLength: failedStages.length,
                hasFailedEvaluation,
                batchStatus: batch?.status,
                shouldShowUpdateNextStagesButton
              });
              
              return shouldShowUpdateNextStagesButton;
            })() && (
              <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-blue-900">Hoàn thành retry - Cần cập nhật tiếp</h4>
                      <p className="text-sm text-blue-700">
                        Bạn đã hoàn thành retry các giai đoạn bị lỗi. Hãy cập nhật tiếp các giai đoạn còn lại để hoàn thành quy trình.
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={handleUpdateNextStages}
                    className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                  >
                    <TrendingUp className="w-4 h-4" />
                    Cập nhật tiếp các stages
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>



        {/* Waste Section - Tổng hợp từ tất cả progresses */}
        {allWastes.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-red-500 to-pink-500 p-6 text-white">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Package className="w-5 h-5" />
                {t('processing.pages.farmerBatches.batchDetail.wastes.title')}
              </h2>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {allWastes.map((waste, idx) => (
                  <div
                    key={`${waste.wasteId}-${idx}`}
                    className="bg-gradient-to-br from-white to-red-50 rounded-xl border border-red-200 hover:border-red-300 transition-all duration-300 hover:shadow-lg p-4"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-red-100 rounded-lg">
                        <Package className="w-5 h-5 text-red-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{waste.wasteType}</h3>
                        <p className="text-sm text-gray-500">{t('processing.pages.farmerBatches.batchDetail.wastes.code')}: {waste.wasteCode}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Scale className="w-4 h-4 text-red-600" />
                      <span className="font-medium">{t('processing.pages.farmerBatches.batchDetail.wastes.quantity')}:</span>
                      <span>{waste.quantity} {waste.unit}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">{t('processing.pages.farmerBatches.batchDetail.wastes.createdAt')}:</span>
                      <span>{new Date(waste.createdAt).toLocaleDateString('vi-VN')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}



        {/* 🔧 MỚI: Failed Evaluations Section - Hiển thị riêng các đánh giá fail */}
        {hasFailedEvaluation && (
          <div className="bg-white rounded-2xl shadow-lg border border-red-200 overflow-hidden mb-6">
            <div className="bg-gradient-to-r from-red-500 to-orange-500 p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    Đánh giá cần cập nhật
                  </h2>
                  <p className="text-red-100 mt-1">Các giai đoạn cần cải thiện và làm lại</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium">
                    {failedStages.length} giai đoạn cần cập nhật
                  </span>
                </div>
              </div>
            </div>

            <div className="p-6">
                             {/* Thông báo tổng quan */}
               <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                 <div className="flex items-center gap-2">
                   <AlertTriangle className="w-5 h-5 text-red-600" />
                   <div>
                     <h4 className="text-sm font-medium text-red-900">
                       Tổng số tiêu chí: {
                         (() => {
                           const failedEvaluation = evaluations.find(e => e.evaluationResult === 'Fail');
                           if (!failedEvaluation?.comments) return '0';
                           
                           // 🔧 MỚI: Parse từ format thực tế trong comments
                           const totalMatch = failedEvaluation.comments.match(/Tổng số tiêu chí:\s*(\d+)/);
                           if (totalMatch) return totalMatch[1];
                           
                           // Fallback: đếm số tiêu chí từ EVALUATION_TYPE format
                           const criteriaMatches = failedEvaluation.comments.match(/CRITERIA:/g);
                           return criteriaMatches ? criteriaMatches.length.toString() : '0';
                         })()
                       }
                     </h4>
                     <div className="flex items-center gap-4 mt-1">
                       <span className="text-sm text-green-700 flex items-center gap-1">
                         <CheckCircle className="w-4 h-4" />
                         {
                           (() => {
                             const failedEvaluation = evaluations.find(e => e.evaluationResult === 'Fail');
                             if (!failedEvaluation?.comments) return '0';
                             
                             // 🔧 MỚI: Parse từ format thực tế
                             const passedMatch = failedEvaluation.comments.match(/(\d+)\s*Đạt/);
                             if (passedMatch) return passedMatch[1];
                             
                             // Fallback: đếm RESULT:PASS trong EVALUATION_TYPE format
                             const passedCriteria = failedEvaluation.comments.match(/RESULT:PASS/g);
                             return passedCriteria ? passedCriteria.length.toString() : '0';
                           })()
                         } Đạt
                       </span>
                       <span className="text-sm text-red-700 flex items-center gap-1">
                         <X className="w-4 h-4" />
                         {
                           (() => {
                             const failedEvaluation = evaluations.find(e => e.evaluationResult === 'Fail');
                             if (!failedEvaluation?.comments) return '0';
                             
                             // 🔧 MỚI: Parse từ format thực tế
                             const failedMatch = failedEvaluation.comments.match(/(\d+)\s*Không đạt/);
                             if (failedMatch) return failedMatch[1];
                             
                             // Fallback: đếm RESULT:FAIL trong EVALUATION_TYPE format
                             const failedCriteria = failedEvaluation.comments.match(/RESULT:FAIL/g);
                             return failedCriteria ? failedCriteria.length.toString() : '0';
                           })()
                         } Không đạt
                       </span>
                     </div>
                   </div>
                 </div>
               </div>

              {/* Danh sách các giai đoạn cần cập nhật */}
              {failedStages.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">Các giai đoạn cần cải thiện:</h4>
                  {failedStages.map((stage, index) => (
                    <div key={index} className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                            <AlertTriangle className="w-5 h-5 text-red-600" />
                          </div>
                          <div>
                            <h5 className="font-semibold text-red-900">▲ Công đoạn cần cải thiện</h5>
                            <p className="text-sm text-red-700">Công đoạn: {stage.name} (Bước {stage.order})</p>
                            <p className="text-sm text-red-700">Vấn đề: Tiến trình có vấn đề: {stage.name} (Thứ tự: {stage.order})</p>
                            <p className="text-sm text-green-700">Khuyến nghị: Cần cải thiện công đoạn này theo khuyến nghị của chuyên gia</p>
                          </div>
                        </div>
                        <Button
                          onClick={() => {
                            setSelectedStageForUpdate({
                              stageName: stage.name,
                              stageOrder: stage.order
                            });
                            setOpenUpdateAfterEvaluationModal(true);
                          }}
                          className="bg-yellow-600 hover:bg-yellow-700 text-white"
                        >
                         <RefreshCw className="w-4 h-4 mr-2" />
                          Cần cập nhật
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 🔧 MỚI: Debug log để kiểm tra */}
              {(() => {
                console.log('🔍 COMPONENT RENDER CHECK:', {
                  batchExists: !!batch,
                  progressesExists: !!batch?.progresses,
                  progressesLength: batch?.progresses?.length,
                  batchStatus: batch?.status
                });
                return null;
              })()}

              {/* 🔧 MỚI: Test nút đơn giản */}
              <div className="bg-red-100 p-2 mt-2">
                <p>TEST: Nút này có hiện không?</p>
                <p>Batch status: {batch?.status}</p>
                <p>Progresses length: {batch?.progresses?.length}</p>
              </div>

              {/* 🔧 MỚI: Nút cập nhật các giai đoạn tiếp theo sau khi retry */}
              {(() => {
                console.log('🔍 DEBUG BUTTON CHECK START');
                console.log('🔍 batch:', batch);
                console.log('🔍 batch?.progresses:', batch?.progresses);
                
                if (batch?.progresses) {
                  console.log('🔍 All progresses:');
                  batch.progresses.forEach((p, index) => {
                    console.log(`  Progress ${index}:`, {
                      stageDescription: p.stageDescription,
                      hasRetryText: p.stageDescription?.includes('Làm lại (Retry)'),
                      stageId: p.stageId,
                      stepIndex: p.stepIndex
                    });
                  });
                }
                
                const hasRetryProgress = batch?.progresses?.some(p => 
                  p.stageDescription && p.stageDescription.includes('Làm lại (Retry)')
                );
                
                console.log('🔍 DEBUG BUTTON LOGIC:', {
                  failedStagesLength: failedStages.length,
                  hasRetryProgress,
                  batchStatus: batch?.status,
                  shouldShowButton: hasRetryProgress && batch?.status !== 'AwaitingEvaluation'
                });
                
                return hasRetryProgress && batch?.status !== 'AwaitingEvaluation';
              })() && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-semibold text-sm">✓</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-blue-900">Đã hoàn thành retry</h4>
                        <p className="text-sm text-blue-700">
                          {batch?.status === 'AwaitingEvaluation' 
                            ? 'Các giai đoạn đã được cập nhật lại và đang chờ đánh giá từ chuyên gia'
                            : 'Cần hoàn thành tất cả các giai đoạn tiếp theo để chuyển sang chờ đánh giá'
                          }
                        </p>
                      </div>
                    </div>
                    {batch?.status !== 'AwaitingEvaluation' && (
                      <Button
                        onClick={() => {
                          setOpenUpdateNextStagesModal(true);
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Cập nhật các giai đoạn tiếp theo
                      </Button>
                    )}
                  </div>
                </div>
              )}


              {/* Hướng dẫn */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-4">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h5 className="text-sm font-medium text-green-900 mb-1">Hướng dẫn:</h5>
                    <p className="text-sm text-green-800">Vui lòng cải thiện công đoạn này theo khuyến nghị của chuyên gia và cập nhật lại tiến trình.</p>
                  </div>
                </div>
              </div>

              {/* Trạng thái chờ */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-3">
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-gray-600" />
                  <Clock className="w-4 h-4 text-gray-600" />
                  <span className="text-sm text-gray-700">Đang chờ {batch.farmerName || 'Nông dân'} cập nhật lại công đoạn {failedStages[0]?.name}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Evaluations Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <ClipboardCheck className="w-5 h-5" />
                  {t('processing.pages.farmerBatches.batchDetail.evaluations.title')}
                </h2>
                <p className="text-blue-100 mt-1">{t('processing.pages.farmerBatches.batchDetail.evaluations.subtitle')}</p>
              </div>
              {evaluations.length > 0 && (
                <Button
                  variant="outline"
                  onClick={() => router.push(`/dashboard/farmer/evaluations/${batch.batchId}`)}
                  className="bg-white/20 hover:bg-white/30 text-white border-white/40"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Xem chi tiết đánh giá
                </Button>
              )}
            </div>
          </div>

                     <div className="p-6">
            
            {evaluations.length > 0 ? (
              <div className="space-y-4">
                                         {/* Thông báo đánh giá mới - chỉ hiển thị khi đánh giá mới nhất là Fail */}
             {evaluations.length > 0 && evaluations[0].evaluationResult === 'Fail' && (
               <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                 <div className="flex items-center gap-2">
                   <AlertTriangle className="w-5 h-5 text-red-600" />
                   <div>
                     <h4 className="text-sm font-medium text-red-900">{t('processing.pages.farmerBatches.batchDetail.evaluations.failAlert.title')}</h4>
                     <p className="text-sm text-red-700">
                       {t('processing.pages.farmerBatches.batchDetail.evaluations.failAlert.description')}
                     </p>
                   </div>
                 </div>
               </div>
             )}

                         {/* Thông báo đánh giá đạt - chỉ hiển thị khi đánh giá mới nhất là Pass */}
             {evaluations.length > 0 && evaluations[0].evaluationResult === 'Pass' && (
               <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                 <div className="flex items-center gap-2">
                   <CheckCircle className="w-5 h-5 text-green-600" />
                   <div>
                     <h4 className="text-sm font-medium text-green-900">Đánh giá đạt tiêu chuẩn</h4>
                     <p className="text-sm text-green-700">
                       Lô sơ chế của bạn đã đạt tiêu chuẩn chất lượng.
                     </p>
                   </div>
                 </div>
               </div>
             )}

                {evaluations.map((evaluation, idx) => (
                  <div
                    key={`${evaluation.evaluationId}-${idx}`}
                    className="bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-200 hover:border-blue-300 transition-all duration-300 hover:shadow-lg p-6"
                  >
                    {/* Header với kết quả đánh giá */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <ClipboardCheck className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{t('processing.pages.farmerBatches.batchDetail.evaluations.item.title')} #{evaluation.evaluationCode}</h3>
                          <p className="text-sm text-gray-500">{t('processing.pages.farmerBatches.batchDetail.evaluations.item.code')}: {evaluation.evaluationCode}</p>
                        </div>
                      </div>
                                             <div className="flex items-center gap-2">
                         <span className={`px-3 py-1 text-sm font-medium rounded-full ${getEvaluationResultColor(evaluation.evaluationResult)}`}>
                           {getEvaluationResultDisplayName(evaluation.evaluationResult)}
                         </span>
                       </div>
                    </div>

                    {/* Thông tin chi tiết */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span className="font-medium">{t('processing.pages.farmerBatches.batchDetail.evaluations.item.date')}:</span>
                        <span>{evaluation.evaluatedAt ? new Date(evaluation.evaluatedAt).toLocaleDateString('vi-VN') : t('processing.pages.farmerBatches.batchDetail.fallback.noDate')}</span>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <User className="w-4 h-4 text-gray-500" />
                        <span className="font-medium">{t('processing.pages.farmerBatches.batchDetail.evaluations.item.expert')}:</span>
                        <span>{evaluation.expertName || 'Chuyên gia'}</span>
                      </div>
                    </div>

                    {/* Failure Info Card - Hiển thị khi có failure */}
                    {evaluation.evaluationResult === 'Fail' && failureInfo && (
                      <div className="mb-4">
                        <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-lg p-4">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                              <AlertTriangle className="w-5 h-5 text-red-600" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-red-900">{t('processing.pages.farmerBatches.batchDetail.evaluations.failure.title')}</h4>
                              <p className="text-sm text-red-700">
                                {t('processing.pages.farmerBatches.batchDetail.evaluations.failure.stage')}: {failureInfo.failedStageName}
                              </p>
                            </div>
                          </div>

                          {/* Details */}
                          <div className="space-y-3">
                            {failureInfo.failureDetails && (
                              <div className="bg-white/50 rounded-lg p-3">
                                <div className="flex items-start gap-2">
                                  <ClipboardCheck className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                                  <div>
                                    <h5 className="text-sm font-medium text-red-900 mb-1">
                                      {t('processing.pages.farmerBatches.batchDetail.evaluations.failure.details.title')}:
                                    </h5>
                                    <p className="text-sm text-red-800">
                                      {failureInfo.failureDetails}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}

                            {failureInfo.recommendations && (
                              <div className="bg-white/50 rounded-lg p-3">
                                <div className="flex items-start gap-2">
                                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                  <div>
                                    <h5 className="text-sm font-medium text-green-900 mb-1">
                                      {t('processing.pages.farmerBatches.batchDetail.evaluations.failure.recommendations.title')}:
                                    </h5>
                                    <p className="text-sm text-green-800">
                                      {failureInfo.recommendations}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

                                                     {/* Action guidance */}
                           <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
                             <div className="flex items-start gap-2">
                               <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                               <div>
                                 <h5 className="text-sm font-medium text-blue-900 mb-1">
                                   {t('processing.pages.farmerBatches.batchDetail.evaluations.failure.guidance.title')}:
                                 </h5>
                                 <p className="text-sm text-blue-800">
                                   {t('processing.pages.farmerBatches.batchDetail.evaluations.failure.guidance.description', { stageName: failureInfo.failedStageName })}
                                 </p>
                               </div>
                             </div>
                           </div>
                        </div>
                      </div>
                    )}

                    {/* Nhận xét chính - chỉ hiển thị khi không phải failure comment */}
                    {evaluation.comments && !StageFailureParser.isFailureComment(evaluation.comments) && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">{t('processing.pages.farmerBatches.batchDetail.evaluations.item.comments')}:</h4>
                        <div className="bg-gray-50 rounded-lg p-3">
                          {/* 🔥 MỚI: Hiển thị từng tiêu chí đánh giá chi tiết */}
                          <EvaluationCriteriaDisplay comment={evaluation.comments} />
                          
                          {/* Hiển thị comments gốc nếu không có format đánh giá */}
                          {!evaluation.comments.includes('EVALUATION_TYPE:') && (
                            <p className="text-sm text-gray-800 whitespace-pre-wrap">{evaluation.comments}</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Phản hồi chi tiết */}
                    {evaluation.detailedFeedback && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">{t('evaluationFailureInfo.detailedFeedback')}:</h4>
                        <div className="bg-blue-50 rounded-lg p-3">
                          <p className="text-sm text-gray-800">{evaluation.detailedFeedback}</p>
                        </div>
                      </div>
                    )}

                    {/* Khuyến nghị */}
                    {evaluation.recommendations && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">{t('evaluationFailureInfo.recommendations')}:</h4>
                        <div className="bg-green-50 rounded-lg p-3">
                          <p className="text-sm text-gray-800">{evaluation.recommendations}</p>
                        </div>
                      </div>
                    )}

                    {/* Tiến trình có vấn đề */}
                    {evaluation.problematicSteps && evaluation.problematicSteps.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">{t('evaluationFailureInfo.problemDetails')}:</h4>
                        <div className="bg-yellow-50 rounded-lg p-3">
                          <ul className="text-sm text-gray-800 space-y-1">
                            {evaluation.problematicSteps.map((step, stepIdx) => (
                              <li key={stepIdx} className="flex items-center gap-2">
                                <AlertTriangle className="w-3 h-3 text-yellow-600" />
                                {step}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <ClipboardCheck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg font-medium mb-2">{t('processing.pages.farmerBatches.batchDetail.evaluations.noEvaluations.title')}</p>
                <p className="text-gray-400 text-sm">{t('processing.pages.farmerBatches.batchDetail.evaluations.noEvaluations.description')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Modals */}
        <Dialog open={openCreateModal} onOpenChange={setOpenCreateModal}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold">{t('processing.pages.farmerBatches.batchDetail.modals.createProgress')}</DialogTitle>
            </DialogHeader>
            <div className="mt-4">
              <CreateProcessingProgressForm
                defaultBatchId={batch.batchId}
                defaultBatchData={batch}
                onSuccess={() => {
                  setOpenCreateModal(false);
                  window.location.reload();
                }}
              />
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={openAdvanceModal} onOpenChange={setOpenAdvanceModal}>
          <DialogContent className="max-w-5xl w-[95vw] max-h-[90vh] overflow-y-auto p-0">
            {latestProgress && (
              <AdvanceProcessingProgressForm
                batchId={batch.batchId}
                latestProgress={latestProgress}
                batchStatus={batch.status}
                failedStageInfo={failedStageInfo || undefined}
                onSuccess={() => {
                  setOpenAdvanceModal(false);
                  // Force refresh data immediately

                  window.location.reload();
                }}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Update After Evaluation Modal */}

        {(failedStageInfo || selectedStageForUpdate) && (
          <UpdateAfterEvaluationForm
            batchId={id as string}
            failedStageInfo={selectedStageForUpdate ? {
              stageId: selectedStageForUpdate.stageOrder,
              stageName: selectedStageForUpdate.stageName,
              failureDetails: `Cần cập nhật giai đoạn: ${selectedStageForUpdate.stageName} (Thứ tự: ${selectedStageForUpdate.stageOrder})`,
              evaluationId: evaluations?.[0]?.evaluationId || ''
            } : failedStageInfo!}
            isOpen={openUpdateAfterEvaluationModal}
            onClose={() => {
              setOpenUpdateAfterEvaluationModal(false);
              setSelectedStageForUpdate(null);
            }}
            onSuccess={() => {
              window.location.reload();
            }}
            isRetry={!!selectedStageForUpdate} // 🔧 MỚI: Xác định retry khi có selectedStageForUpdate
          />
        )}

                                   {/* 🔧 MỚI: Update Next Stages Modal */}
          <UpdateNextStagesForm
            batchId={id as string}
            methodId={batch?.methodId}
            currentStageOrder={latestProgress?.stepIndex}
            isOpen={openUpdateNextStagesModal}
            onClose={() => {
              setOpenUpdateNextStagesModal(false);
            }}
            onSuccess={() => {
              setOpenUpdateNextStagesModal(false);
              window.location.reload();
            }}
          />

        {/* Media Viewer Dialog */}
        <Dialog open={mediaViewerOpen} onOpenChange={setMediaViewerOpen}>
          <DialogContent
            className="media-viewer-overlay"
            showCloseButton={false}
          >
            {/* Header */}
            <div className="absolute top-4 right-4 z-50">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMediaViewerOpen(false)}
                className="h-10 w-10 p-0 bg-black/60 hover:bg-red-600 text-white border-white/40 rounded-full shadow-lg hover:shadow-red-500/30 transition-all duration-200"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Navigation Buttons */}
            {allMedia.length > 1 && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateMedia('prev')}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 h-12 w-12 p-0 bg-black/60 hover:bg-white/20 text-white border-white/40 rounded-full z-50 shadow-lg hover:shadow-white/20 transition-all duration-200"
                >
                  <ArrowLeft className="w-6 h-6" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateMedia('next')}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 h-12 w-12 p-0 bg-black/60 hover:bg-white/20 text-white border-white/40 rounded-full z-50 shadow-lg hover:shadow-white/20 transition-all duration-200"
                >
                  <ArrowRight className="w-6 h-6" />
                </Button>
              </>
            )}

            {/* Media Counter */}
            {allMedia.length > 1 && (
              <div className="absolute top-4 left-4 z-50 bg-black/60 text-white px-3 py-1 rounded-full text-sm font-medium">
                {currentMediaIndex + 1} / {allMedia.length}
              </div>
            )}
            {/* Media Content */}
            <div className="media-viewer-content">
              {selectedMedia?.type === 'image' ? (
                <div className="flex flex-col items-center justify-center w-full h-full">
                  <img
                    src={selectedMedia.url}
                    alt={selectedMedia.caption || t('processing.pages.farmerBatches.batchDetail.mediaViewer.image')}
                    className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl"
                  />
                  {selectedMedia.caption && (
                    <div className="mt-4">
                      <p className="text-sm text-white text-center max-w-2xl bg-black/80 px-4 py-2 rounded-lg backdrop-blur-sm">
                        {selectedMedia.caption}
                      </p>
                    </div>
                  )}
                </div>
              ) : selectedMedia?.type === 'video' ? (
                <div className="flex flex-col items-center justify-center w-full h-full">
                  <video
                    controls
                    autoPlay
                    className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl"
                  >
                    <source src={selectedMedia.url} />
                    {t('processing.pages.farmerBatches.batchDetail.mediaViewer.videoNotSupported')}
                  </video>
                  {selectedMedia.caption && (
                    <div className="mt-4">
                      <p className="text-sm text-white text-center max-w-2xl bg-black/80 px-4 py-2 rounded-lg backdrop-blur-sm">
                        {selectedMedia.caption}
                      </p>
                    </div>
                  )}
                </div>
              ) : null}
            </div>


            {/* Keyboard Instructions */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-50 bg-black/60 text-white px-4 py-2 rounded-full text-sm">
              <div className="flex items-center gap-4">
                <span>{t('processing.pages.farmerBatches.batchDetail.mediaViewer.prevNext')}</span>
                <span>{t('processing.pages.farmerBatches.batchDetail.mediaViewer.escClose')}</span>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
} 
