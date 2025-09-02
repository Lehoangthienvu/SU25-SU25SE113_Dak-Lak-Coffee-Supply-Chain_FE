
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
  Eye
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ProcessingBatchProgress, ProcessingParameter } from "@/lib/api/processingBatchProgress";
import { ProcessingWaste } from "@/lib/api/processingBatchWastes";
import CreateProcessingProgressForm from "@/components/processing-batches/CreateProcessingProgressForm";
import AdvanceProcessingProgressForm from "@/components/processing-batches/AdvanceProcessingProgressForm";
import UpdateAfterEvaluationForm from "@/components/processing-batches/UpdateAfterEvaluationForm";
import EvaluationCriteriaForm from "@/components/processing-batches/EvaluationCriteriaForm";
import FailureInfoCard from "@/components/processing-batches/FailureInfoCard";
import ProgressGuidanceCard from "@/components/processing-batches/ProgressGuidanceCard";

import { ProcessingStatus } from "@/lib/constants/batchStatus";
import { StageFailureParser, StageFailureInfo } from "@/lib/helpers/evaluationHelpers";
import { getProcessingStagesByMethodId } from "@/lib/api/processingStages";
import { ProcessingErrorDisplay } from "@/components/shared/ProcessingErrorDisplay";
import FailedStagesInfo from "@/components/processing-batches/FailedStagesInfo";
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

  // Kiểm tra xem có đánh giá fail không
  const hasFailedEvaluation = useMemo(() => {
    if (!evaluations || evaluations.length === 0) return false;

    const latestEvaluation = evaluations[0]; // Đã sort theo createdAt desc
    return latestEvaluation.evaluationResult === 'Fail';
  }, [evaluations]);

  // Lấy thông tin stage bị fail
  const failedStageInfo = useMemo(() => {
    if (!hasFailedEvaluation || !evaluations || evaluations.length === 0) return null;

    const latestEvaluation = evaluations[0];
    const comments = latestEvaluation.comments || '';



    // Sử dụng StageFailureParser để parse thông tin
    const failureInfo = StageFailureParser.parseFailureFromComments(comments);


    if (failureInfo) {
      return {
        stageId: failureInfo.failedOrderIndex, // Sử dụng failedOrderIndex thay vì failedStageId
        stageName: failureInfo.failedStageName || t('processing.pages.farmerBatches.batchDetail.status.unknown'),
        failureDetails: failureInfo.failureDetails || t('processing.pages.farmerBatches.batchDetail.status.canContinue'), // Sử dụng failureDetails
        evaluationId: latestEvaluation.evaluationId
      };
    }

    // Fallback: Parse stage info từ comments nếu không có format chuẩn


    // Pattern 1: "Tiến trình có vấn đề: Bước 1: Thu hoach"
    const stepMatch = comments.match(/Bước\s*(\d+):\s*([^,\n]+)/);
    if (stepMatch) {

      return {
        stageId: parseInt(stepMatch[1]),
        stageName: stepMatch[2].trim(),
        failureDetails: comments,
        evaluationId: latestEvaluation.evaluationId
      };
    }

    // Pattern 2: "StageId: X, StageName: Y"
    const stageIdMatch = comments.match(/StageId:\s*(\d+)/);
    const stageNameMatch = comments.match(/StageName:\s*([^,\n]+)/);
    const detailsMatch = comments.match(/FailureDetails:\s*([^,\n]+)/);

    if (stageIdMatch) {

      return {
        stageId: parseInt(stageIdMatch[1]),
        stageName: stageNameMatch ? stageNameMatch[1].trim() : t('processing.pages.farmerBatches.batchDetail.status.unknown'),
        failureDetails: detailsMatch ? detailsMatch[1].trim() : t('processing.pages.farmerBatches.batchDetail.status.canContinue'),
        evaluationId: latestEvaluation.evaluationId
      };
    }

    return null;
  }, [hasFailedEvaluation, evaluations]);

  // State để lưu max OrderIndex của method
  const [maxOrderIndex, setMaxOrderIndex] = useState<number>(0);

  // Lấy OrderIndex lớn nhất trong method
  useEffect(() => {
    const fetchMaxOrderIndex = async () => {
      if (batch?.methodId) {
        try {

          const stages = await getProcessingStagesByMethodId(batch.methodId);

          if (stages && stages.length > 0) {
            // Tìm OrderIndex lớn nhất
            const maxIndex = Math.max(...stages.map((stage: any) => stage.orderIndex));

            setMaxOrderIndex(maxIndex);
          } else {

            setMaxOrderIndex(batch.stageCount || 0);
          }
        } catch (error) {
          console.error("DEBUG: Error fetching stages:", error);
          // Fallback: sử dụng stageCount từ batch
          setMaxOrderIndex(batch.stageCount || 0);
        }
      }
    };

    fetchMaxOrderIndex();
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
            {/* Nút cập nhật tiến trình - hiển thị khi có thể cập nhật VÀ chưa ở stage cuối HOẶC có failed evaluation */}
            {batch.progresses && batch.progresses.length > 0 &&
              batch.status !== ProcessingStatus.Completed &&
              batch.status !== ProcessingStatus.AwaitingEvaluation &&
              (!isAtLastStage || hasFailedEvaluation) && (
                <Button
                  onClick={() => setOpenAdvanceModal(true)}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white transition-all duration-200"
                >
                  <PlusCircle className="w-4 h-4" />
                  {t('processing.pages.farmerBatches.batchDetail.quickActions.advanceProgress')}
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

                 {/* 🔧 ALERT: Chỉ hiện khi có đánh giá fail và batch status là InProgress */}
         {hasFailedEvaluation && failedStageInfo && batch.status === ProcessingStatus.InProgress && (
           <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
             <div className="flex items-start">
               <div className="flex-shrink-0">
                 <div className="flex items-center space-x-2">
                   <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                     <AlertTriangle className="w-4 h-4 text-red-600" />
                   </div>
                   <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                     <XCircle className="w-4 h-4 text-red-600" />
                   </div>
                 </div>
               </div>
               <div className="ml-3 flex-1">
                 <h3 className="text-lg font-semibold text-red-800 mb-2">
                   {t('processing.pages.farmerBatches.batchDetail.status.canContinue')}
                 </h3>
                 <p className="text-red-700 mb-4">
                   {t('processing.pages.farmerBatches.batchDetail.status.canContinue')} <strong>{failedStageInfo.stageName}</strong>.
                   {t('processing.pages.farmerBatches.batchDetail.status.canContinue')}
                 </p>
                 <div className="flex space-x-3">
                   <Button
                     onClick={() => {
                       // Mở form cập nhật progress cho stage bị fail
                       setOpenUpdateAfterEvaluationModal(true);
                     }}
                     className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
                   >
                     <Edit className="w-4 h-4" />
                     Cập nhật sau đánh giá
                   </Button>
                 </div>
               </div>
             </div>
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
          {latestProgress?.outputQuantity || batch.totalOutputQuantity || 0}kg
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

        {/* Failure Info Card - Hiển thị khi có failure */}
        {failureInfo && (
          <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-orange-200 overflow-hidden">
            <div className="bg-gradient-to-r from-red-500 to-orange-500 p-6 text-white">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                {t('processing.pages.farmerBatches.batchDetail.evaluation.title')}
              </h2>
            </div>
            <div className="p-6">
              <FailureInfoCard
                failureInfo={failureInfo}
              />
            </div>
          </div>
        )}



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
            {/* Progress Guidance Card - Hiển thị khi có failure */}
            {failureInfo && (
              <ProgressGuidanceCard
                failureInfo={failureInfo}
                latestProgress={latestProgress}
                batchStatus={batch.status}
              />
            )}

            {batch.progresses && batch.progresses.length > 0 ? (
              <div className="space-y-4">
                {batch.progresses
                  .sort((a, b) => a.stepIndex - b.stepIndex) // Sắp xếp theo stepIndex
                  .map((progress, idx) => {
                    // Kiểm tra xem có phải bước retry không
                    const isRetryStep = progress.stepIndex > 1 && idx > 0;
                    const previousProgress = idx > 0 ? batch.progresses.find(p => p.stepIndex === progress.stepIndex - 1) : null;
                    const isRetry = previousProgress && previousProgress.stageName === progress.stageName;

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
                                    {t('processing.pages.farmerBatches.batchDetail.progress.retry')}
                                  </span>
                                )}
                              </span>
                              <h3 className="font-semibold text-gray-900 text-lg">
                                {progress.stageName}
                                {isRetry && (
                                  <span className="ml-2 text-sm text-orange-600 font-medium">
                                    ({t('processing.pages.farmerBatches.batchDetail.progress.retry')})
                                  </span>
                                )}
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
            {/* Failed Stages Info - Hiển thị khi có đánh giá fail */}
            {hasFailedEvaluation && (
              <div className="mb-6">
                <FailedStagesInfo batchId={id as string} />
              </div>
            )}
            
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

        {failedStageInfo && (
          <UpdateAfterEvaluationForm
            batchId={id as string}
            failedStageInfo={failedStageInfo}
            isOpen={openUpdateAfterEvaluationModal}
            onClose={() => setOpenUpdateAfterEvaluationModal(false)}
            onSuccess={() => {
              window.location.reload();
            }}
          />
        )}

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
