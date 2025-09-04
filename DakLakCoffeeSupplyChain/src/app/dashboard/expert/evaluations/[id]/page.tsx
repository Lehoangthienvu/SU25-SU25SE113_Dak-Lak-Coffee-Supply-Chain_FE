"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthGuard } from "@/lib/auth/useAuthGuard";
import { getProcessingBatchById, ProcessingBatch } from "@/lib/api/processingBatches";
import { getEvaluationsByBatch, ProcessingBatchEvaluation, EVALUATION_RESULTS, getEvaluationResultDisplayNameI18n, getEvaluationResultColor, getEvaluationResultDisplayName } from "@/lib/api/processingBatchEvaluations";

import { ProcessingStatus } from "@/lib/constants/batchStatus";
import { FiArrowLeft, FiSave, FiAlertCircle, FiCheckCircle, FiClock, FiUser, FiCalendar, FiPackage, FiBarChart2, FiX, FiActivity, FiTarget, FiAward, FiTrendingUp as FiTrendingUpIcon, FiXCircle } from "react-icons/fi";
import StageFailureDisplay from "@/components/processing-batches/StageFailureDisplay";
import FarmerRetryStatus from "@/components/processing-batches/FarmerRetryStatus";
import RetryGuidanceInfo from "@/components/processing-batches/RetryGuidanceInfo";
import EvaluationCriteriaForm from "@/components/processing-batches/EvaluationCriteriaForm";
import EvaluationRetryInfo from "@/components/processing-batches/EvaluationRetryInfo";
import EvaluationCriteriaDisplay from "@/components/processing-batches/EvaluationCriteriaDisplay";
import EvaluationCommentsDisplay from "@/components/processing-batches/EvaluationCommentsDisplay";
import { AppToast } from "@/components/ui/AppToast";
import { useTranslation } from "react-i18next";

export default function ExpertEvaluationDetailPage() {
  useAuthGuard(["expert"]);
  const params = useParams();
  const router = useRouter();
  const { t } = useTranslation();
  const batchId = params.id as string;

  const [batch, setBatch] = useState<ProcessingBatch | null>(null);
  const [evaluations, setEvaluations] = useState<ProcessingBatchEvaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEvaluationForm, setShowEvaluationForm] = useState(false);
  const [showRetryInfo, setShowRetryInfo] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("🔍 DEBUG: Fetching data for batchId:", batchId);

      const [batchData, evaluationsData] = await Promise.all([
        getProcessingBatchById(batchId),
        getEvaluationsByBatch(batchId)
      ]);

      console.log("🔍 DEBUG: Batch data:", batchData);
      console.log("🔍 DEBUG: Evaluations data:", evaluationsData);



      // 🔧 CẢI THIỆN: Debug thông tin evaluation
      if (evaluationsData && evaluationsData.length > 0) {
        const latestEval = evaluationsData[0];
        console.log("🔍 DEBUG: Latest evaluation:", {
          evaluationId: latestEval.evaluationId,
          evaluationResult: latestEval.evaluationResult,
          comments: latestEval.comments,
          evaluatedAt: latestEval.evaluatedAt,
          evaluatedBy: latestEval.evaluatedBy
        });

        // Debug stage failure info nếu có
        if (latestEval.comments) {
          const { debugStageFailure } = await import('@/lib/helpers/evaluationHelpers');
          debugStageFailure(latestEval.comments, 'FetchData');
        }
      }

      if (!batchData) {
        console.log("❌ DEBUG: No batch data found");
        setError(t("expertEvaluationDetail.error.batchNotFound"));
        return;
      }

      setBatch(batchData);
      setEvaluations(evaluationsData);
    } catch (err: unknown) {
      console.error("❌ Lỗi fetchData:", err);
      const errorMessage = err instanceof Error ? err.message : t("expertEvaluationDetail.error.loadFailed");
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (batchId) {
      fetchData();
    }
  }, [batchId]);

  const getStatusInfo = (status: ProcessingStatus) => {
    switch (status) {
      case ProcessingStatus.NotStarted:
        return { text: "Chưa bắt đầu", color: "text-gray-600 bg-gray-100", icon: <FiClock className="text-gray-500" /> };
      case ProcessingStatus.InProgress:
        return { text: "Đang thực hiện", color: "text-blue-600 bg-blue-100", icon: <FiClock className="text-blue-500" /> };
      case ProcessingStatus.AwaitingEvaluation:
        return { text: "Chờ đánh giá", color: "text-yellow-600 bg-yellow-100", icon: <FiAlertCircle className="text-yellow-500" /> };
      case ProcessingStatus.Completed:
        return { text: "Hoàn thành", color: "text-green-600 bg-green-100", icon: <FiCheckCircle className="text-green-500" /> };
      case ProcessingStatus.Cancelled:
        return { text: "Đã hủy", color: "text-red-600 bg-red-100", icon: <FiAlertCircle className="text-red-500" /> };
      default:
        return { text: "Không xác định", color: "text-gray-600 bg-gray-100", icon: <FiAlertCircle className="text-gray-500" /> };
    }
  };

  // Tính toán đánh giá tổng quan
  const calculateOverallEvaluation = () => {
    if (!evaluations || evaluations.length === 0) return null;

    const totalEvaluations = evaluations.length;
    const passedEvaluations = evaluations.filter(e => e.evaluationResult === EVALUATION_RESULTS.PASS).length;
    const failedEvaluations = evaluations.filter(e => e.evaluationResult === EVALUATION_RESULTS.FAIL).length;
    const needsImprovementEvaluations = evaluations.filter(e => e.evaluationResult === EVALUATION_RESULTS.NEEDS_IMPROVEMENT).length;

    // Tính điểm trung bình (giả định)
    const averageScore = evaluations.reduce((sum, evaluation) => {
      let score = 0;
      switch (evaluation.evaluationResult) {
        case EVALUATION_RESULTS.PASS: score = 100; break;
        case EVALUATION_RESULTS.NEEDS_IMPROVEMENT: score = 70; break;
        case EVALUATION_RESULTS.FAIL: score = 0; break;
        default: score = 0;
      }
      return sum + score;
    }, 0) / totalEvaluations;

    // Logic đánh giá: Đạt ≥80đ HOẶC ≥67% giai đoạn đạt
    const passPercentage = (passedEvaluations / totalEvaluations) * 100;
    const overallResult = (averageScore >= 80 || passPercentage >= 67) ? 'Pass' : 'Fail';

    return {
      totalEvaluations,
      passedEvaluations,
      failedEvaluations,
      needsImprovementEvaluations,
      averageScore: Math.round(averageScore * 10) / 10,
      passPercentage: Math.round(passPercentage * 10) / 10,
      overallResult
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">{t("expertEvaluationDetail.loading")}</p>
        </div>
      </div>
    );
  }

  if (error || !batch) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <FiAlertCircle className="text-red-500 text-4xl mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error || t("expertEvaluationDetail.error.batchNotFound")}</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            {t("expertEvaluationDetail.backButton")}
          </button>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo(batch.status);
  const latestEvaluation = evaluations.length > 0 ? evaluations[0] : null;
  const overallEval = calculateOverallEvaluation();

    return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Enhanced Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm text-indigo-600 hover:text-indigo-700 hover:bg-white/90 transition-all duration-200 rounded-lg border border-indigo-200 shadow-sm hover:shadow-md"
            >
              <FiArrowLeft className="w-4 h-4" />
              <span className="font-medium">{t("expertEvaluationDetail.backButton")}</span>
            </button>
            
            {/* Status Badge */}
            <div className={`px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 ${
              batch.status === ProcessingStatus.AwaitingEvaluation 
                ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                : batch.status === ProcessingStatus.Completed
                ? 'bg-green-100 text-green-800 border border-green-200'
                : 'bg-blue-100 text-blue-800 border border-blue-200'
            }`}>
              {batch.status === ProcessingStatus.AwaitingEvaluation && <FiAlertCircle className="w-4 h-4" />}
              {batch.status === ProcessingStatus.Completed && <FiCheckCircle className="w-4 h-4" />}
              {batch.status === ProcessingStatus.InProgress && <FiClock className="w-4 h-4" />}
              {statusInfo.text}
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-lg">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex-1">
                <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                  {t("expertEvaluationDetail.title")}
                </h1>
                <p className="text-gray-600 text-sm lg:text-base">
                  {t("expertEvaluationDetail.subtitle", { batchCode: batch.batchCode, farmerName: batch.farmerName })}
                </p>
                
                {/* Quick Stats */}
                <div className="flex flex-wrap gap-3 mt-4">
                  <div className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium border border-blue-200">
                    {evaluations.length} đánh giá
                  </div>
                  <div className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium border border-green-200">
                    {evaluations.filter(e => e.evaluationResult === EVALUATION_RESULTS.PASS).length} đạt
                  </div>
                  <div className="px-3 py-1 bg-red-50 text-red-700 rounded-full text-xs font-medium border border-red-200">
                    {evaluations.filter(e => e.evaluationResult === EVALUATION_RESULTS.FAIL).length} không đạt
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex-shrink-0 flex gap-3">
                {/* Xem lịch sử đánh giá */}
                <button
                  onClick={() => router.push(`/dashboard/expert/evaluation-history?batchId=${batchId}`)}
                  className="px-4 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all duration-200 flex items-center gap-2 font-medium shadow-lg hover:shadow-xl"
                >
                  <FiAward className="w-4 h-4" />
                  Xem lịch sử đánh giá
                </button>

                {/* Update Evaluation Button */}
                {(() => {
                  const canEvaluate = 
                    batch.status === ProcessingStatus.AwaitingEvaluation ||
                    (latestEvaluation && latestEvaluation.evaluationResult === EVALUATION_RESULTS.FAIL);
                  
                  if (!canEvaluate) {
                    const isPassed = latestEvaluation?.evaluationResult === EVALUATION_RESULTS.PASS;
                    return (
                      <div className={`px-6 py-3 rounded-xl border flex items-center gap-2 font-medium ${
                        isPassed 
                          ? 'bg-green-50 text-green-700 border-green-200' 
                          : 'bg-red-50 text-red-700 border-red-200'
                      }`}>
                        {isPassed ? (
                          <FiCheckCircle className="text-green-500" />
                        ) : (
                          <FiXCircle className="text-red-500" />
                        )}
                        {isPassed
                          ? t("expertEvaluationDetail.batchAlreadyPassed")
                          : t("expertEvaluationDetail.batchNotReadyForEvaluation")
                        }
                      </div>
                    );
                  }
                  
                  return (
                    <button
                      onClick={() => setShowEvaluationForm(true)}
                      className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl hover:from-indigo-600 hover:to-purple-600 transition-all duration-200 flex items-center gap-2 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      <FiSave className="w-4 h-4" />
                      {t("expertEvaluationDetail.updateEvaluationButton")}
                    </button>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>

        {/* Layout 1 cột */}
        <div className="space-y-6">
            {/* Batch Information Card */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 overflow-hidden hover:shadow-2xl transition-all duration-300">
              <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-6 text-white">
                <h2 className="text-xl font-semibold flex items-center gap-3">
                  <FiPackage className="w-6 h-6" />
                  {t("expertEvaluationDetail.batchInformation.title")}
                </h2>
                <p className="text-indigo-100 mt-1 text-sm">Thông tin chi tiết về lô sơ chế</p>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-100 rounded-lg">
                        <FiPackage className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">{t("expertEvaluationDetail.batchInformation.batchCode")}</p>
                        <p className="font-semibold text-gray-900">{batch.batchCode}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <FiUser className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">{t("expertEvaluationDetail.batchInformation.farmer")}</p>
                        <p className="font-semibold text-gray-900">{batch.farmerName}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <FiCalendar className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">{t("expertEvaluationDetail.batchInformation.cropSeason")}</p>
                        <p className="font-semibold text-gray-900">{batch.cropSeasonName}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <FiTrendingUpIcon className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">{t("expertEvaluationDetail.batchInformation.inputQuantity")}</p>
                        <p className="font-semibold text-gray-900">{batch.totalInputQuantity} kg</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <FiTrendingUpIcon className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">{t("expertEvaluationDetail.batchInformation.outputQuantity")}</p>
                        <p className="font-semibold text-gray-900">{batch.totalOutputQuantity} kg</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        {statusInfo.icon}
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">{t("expertEvaluationDetail.batchInformation.status")}</p>
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${statusInfo.color}`}>
                          {statusInfo.text}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Progresses Card */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 overflow-hidden hover:shadow-2xl transition-all duration-300">
              <div className="bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 p-6 text-white">
                <h2 className="text-xl font-semibold flex items-center gap-3">
                  <FiActivity className="w-6 h-6" />
                  {t("expertEvaluationDetail.processingProgress.title")}
                </h2>
                <p className="text-blue-100 mt-1 text-sm">Tiến trình sơ chế từng bước</p>
              </div>

              <div className="p-6">
                {batch.progresses && batch.progresses.length > 0 ? (
                  <div className="space-y-4">
                    {batch.progresses
                      .sort((a, b) => a.stepIndex - b.stepIndex) // Sắp xếp theo stepIndex
                      .map((progress, index) => {
                        // 🔧 FIX: Kiểm tra xem có phải bước retry không dựa vào StageDescription
                        const isRetry = progress.stageDescription && progress.stageDescription.includes("Khắc phục (Retry)");
                        
                        return (
                          <div
                            key={index}
                            className={`bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-200 hover:border-purple-300 transition-all duration-300 hover:shadow-lg p-6 ${
                              isRetry 
                                ? 'border-orange-300 hover:border-orange-400 bg-gradient-to-br from-orange-50 to-amber-50' 
                                : 'border-gray-200 hover:border-purple-300'
                            }`}
                          >
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                    isRetry 
                                      ? 'bg-orange-100 text-orange-700' 
                                      : 'bg-purple-100 text-purple-700'
                                  }`}>
                                    {t("expertEvaluationDetail.processingProgress.step", { stepIndex: progress.stepIndex })}
                                    {isRetry && (
                                      <span className="ml-2 text-xs bg-orange-200 text-orange-800 px-2 py-0.5 rounded-full">
                                        {t("expertEvaluationDetail.processingProgress.retry")}
                                      </span>
                                    )}
                                  </span>
                                  <h3 className="font-semibold text-gray-900 text-lg">
                                    {progress.stageName}
                                    {isRetry && (
                                      <span className="ml-2 text-sm text-orange-600 font-medium">
                                        ({t("expertEvaluationDetail.processingProgress.retry")})
                                      </span>
                                    )}
                                  </h3>
                                </div>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div className="flex items-center gap-2">
                                <FiTrendingUpIcon className="w-4 h-4 text-green-600" />
                                <span className="text-gray-500">{t("expertEvaluationDetail.processingProgress.outputQuantity")}</span>
                                <span className="font-medium text-gray-900">{progress.outputQuantity} {progress.outputUnit}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <FiUser className="w-4 h-4 text-blue-600" />
                                <span className="text-gray-500">{t("expertEvaluationDetail.processingProgress.updatedBy")}</span>
                                <span className="font-medium text-gray-900">{progress.updatedByName}</span>
                              </div>
                            </div>
                            
                            {/* 🔧 MỚI: Hiển thị StageDescription nếu có */}
                            {progress.stageDescription && (
                              <div className="mt-3 pt-3 border-t border-gray-200">
                                <div className="flex items-start gap-2">
                                  <span className="text-gray-500 text-sm">{t("expertEvaluationDetail.processingProgress.description")}:</span>
                                  <span className="text-sm text-gray-700 font-medium">{progress.stageDescription}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                      
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-xl">
                    <FiActivity className="text-gray-400 text-3xl mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">{t("expertEvaluationDetail.processingProgress.noProgress")}</p>
                  </div>
                )}
              </div>
            </div>
          </div>



            {/* Evaluation Status Card */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 overflow-hidden hover:shadow-2xl transition-all duration-300">
              <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 p-6 text-white">
                <h2 className="text-xl font-semibold flex items-center gap-3">
                  <FiTarget className="w-6 h-6" />
                  {t("expertEvaluationDetail.evaluationStatus.title")}
                </h2>
                <p className="text-purple-100 mt-1 text-sm">Kết quả đánh giá hiện tại</p>
              </div>

              <div className="p-6">
                {latestEvaluation ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center">
                      <span className={`px-6 py-3 text-lg font-medium rounded-xl ${getEvaluationResultColor(latestEvaluation.evaluationResult)}`}>
                        {getEvaluationResultDisplayNameI18n(latestEvaluation.evaluationResult, t)}
                      </span>
                    </div>

                    {/* 🔧 CẢI THIỆN: Hiển thị thông tin failure chỉ khi đánh giá không đạt */}
                    {latestEvaluation.comments && latestEvaluation.evaluationResult === EVALUATION_RESULTS.FAIL && (
                      <div className="space-y-4">
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                          <p className="text-sm text-red-800 font-medium mb-3">{t("expertEvaluationDetail.evaluationStatus.comments")}</p>
                          
                          {/* 🔥 MỚI: Hiển thị từng tiêu chí đánh giá chi tiết */}
                          <EvaluationCriteriaDisplay comment={latestEvaluation.comments} />
                          
                          <StageFailureDisplay comments={latestEvaluation.comments} batch={{
                            ...batch,
                            progresses: batch.progresses
                          }} />

                          {/* 🔧 CẢI THIỆN: Hiển thị trạng thái retry của farmer */}
                          <FarmerRetryStatus
                            evaluation={latestEvaluation}
                            batch={{
                              ...batch,
                              progresses: batch.progresses
                            }}
                          />

                          {/* 🔧 CẢI THIỆN: Hiển thị hướng dẫn retry */}
                          <RetryGuidanceInfo
                            evaluation={latestEvaluation}
                            batch={{
                              ...batch,
                              progresses: batch.progresses
                            }}
                          />

                          {/* 🔥 MỚI: Nút xem thông tin retry chi tiết */}
                          <div className="mt-4 pt-4 border-t border-red-200">
                            <button
                              onClick={() => setShowRetryInfo(true)}
                              className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2 font-medium"
                            >
                              <FiAlertCircle className="w-4 h-4" />
                              {t("expertEvaluations.retryStage.button")}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 🔧 CẢI THIỆN: Hiển thị comments thông thường cho đánh giá đạt */}
                    {latestEvaluation.comments && latestEvaluation.evaluationResult !== EVALUATION_RESULTS.FAIL && (
                      <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                        <p className="text-sm text-green-800 font-medium mb-2">{t("expertEvaluationDetail.evaluationStatus.comments")}</p>
                        
                        {/* 🔥 MỚI: Hiển thị từng tiêu chí đánh giá chi tiết */}
                        <EvaluationCriteriaDisplay comment={latestEvaluation.comments} />
                        
                        {/* Hiển thị comments gốc nếu không có format đánh giá */}
                        {!latestEvaluation.comments.includes('EVALUATION_TYPE:') && (
                          <p className="text-sm text-green-800 mt-3">{latestEvaluation.comments}</p>
                        )}
                      </div>
                    )}

                    {/* 🔧 CẢI THIỆN: Hiển thị thông tin chi tiết khác */}
                    {latestEvaluation.detailedFeedback && (
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                        <p className="text-sm text-blue-800 font-medium mb-2">{t("expertEvaluationDetail.evaluationStatus.detailedFeedback")}</p>
                        <p className="text-sm text-blue-900">{latestEvaluation.detailedFeedback}</p>
                      </div>
                    )}

                    {latestEvaluation.recommendations && (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                        <p className="text-sm text-emerald-800 font-medium mb-2">{t("expertEvaluationDetail.evaluationStatus.recommendations")}</p>
                        <p className="text-sm text-emerald-900">{latestEvaluation.recommendations}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      {latestEvaluation.evaluatedAt && (
                        <div className="bg-gray-50 rounded-xl p-4 text-center">
                          <p className="text-xs text-gray-600 mb-1">{t("expertEvaluationDetail.evaluationStatus.evaluationDate")}</p>
                          <p className="text-sm font-medium text-gray-900">
                            {new Date(latestEvaluation.evaluatedAt).toLocaleDateString('vi-VN')}
                          </p>
                        </div>
                      )}

                      {/* 🔧 CẢI THIỆN: Hiển thị người đánh giá nếu có */}
                      {latestEvaluation.evaluatedBy && (
                        <div className="bg-gray-50 rounded-xl p-4 text-center">
                          <p className="text-xs text-gray-600 mb-1">{t("expertEvaluationDetail.evaluationStatus.evaluatedBy")}</p>
                          <p className="text-sm font-medium text-gray-900">
                            {latestEvaluation.expertName || latestEvaluation.evaluatedBy}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-xl">
                    <FiAlertCircle className="text-yellow-500 text-3xl mx-auto mb-3" />
                    <p className="text-gray-600 text-sm">{t("expertEvaluationDetail.evaluationStatus.noEvaluation")}</p>
                  </div>
                )}
              </div>
            </div>

                         {/* Quick Statistics Card */}
             <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
               <div className="bg-gradient-to-r from-indigo-500 to-blue-500 p-6 text-white">
                 <h2 className="text-xl font-semibold flex items-center gap-3">
                   <FiBarChart2 className="w-6 h-6" />
                   {t("expertEvaluationDetail.quickStats.title")}
                 </h2>
               </div>

               <div className="p-6">
                 <div className="grid grid-cols-2 gap-4">
                   <div className="text-center p-4 bg-blue-50 rounded-xl">
                     <div className="text-2xl font-bold text-blue-600">
                       {evaluations.length}
                     </div>
                     <div className="text-xs text-blue-700">{t("expertEvaluationDetail.quickStats.evaluations")}</div>
                   </div>

                   <div className="text-center p-4 bg-green-50 rounded-xl">
                     <div className="text-2xl font-bold text-green-600">
                       {evaluations.filter(e => e.evaluationResult === EVALUATION_RESULTS.PASS).length}
                     </div>
                     <div className="text-xs text-green-700">{t("expertEvaluationDetail.quickStats.passed")}</div>
                   </div>

                   <div className="text-center p-4 bg-yellow-50 rounded-xl">
                     <div className="text-2xl font-bold text-yellow-600">
                       {evaluations.filter(e => e.evaluationResult === EVALUATION_RESULTS.NEEDS_IMPROVEMENT).length}
                     </div>
                     <div className="text-xs text-yellow-700">{t("expertEvaluationDetail.quickStats.needsImprovement")}</div>
                   </div>

                   <div className="text-center p-4 bg-red-50 rounded-xl">
                     <div className="text-2xl font-bold text-red-600">
                       {evaluations.filter(e => e.evaluationResult === EVALUATION_RESULTS.FAIL).length}
                     </div>
                     <div className="text-xs text-red-700">{t("expertEvaluationDetail.quickStats.failed")}</div>
                   </div>
                 </div>
               </div>
             </div>

             {/* Evaluation History Card */}
             <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
               <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-6 text-white">
                 <h2 className="text-xl font-semibold flex items-center gap-3">
                   <FiAward className="w-6 h-6" />
                   Lịch sử đánh giá
                 </h2>
                 <p className="text-emerald-100 mt-1">Xem lại tất cả các lần đánh giá đã thực hiện</p>
               </div>

               <div className="p-6">
                 {evaluations && evaluations.length > 0 ? (
                   <div className="space-y-4">
                     {evaluations.map((evaluation, index) => (
                       <div
                         key={evaluation.evaluationId}
                         className={`bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-200 hover:border-emerald-300 transition-all duration-300 hover:shadow-lg p-6 ${
                           index === 0 ? 'border-emerald-300 bg-gradient-to-br from-emerald-50 to-teal-50' : ''
                         }`}
                       >
                         <div className="flex items-start justify-between mb-4">
                           <div className="flex-1">
                             <div className="flex items-center gap-3 mb-2">
                               <span className={`px-3 py-1 rounded-full text-sm font-medium ${getEvaluationResultColor(evaluation.evaluationResult)}`}>
                                 {getEvaluationResultDisplayNameI18n(evaluation.evaluationResult, t)}
                               </span>
                               {index === 0 && (
                                 <span className="px-2 py-1 text-xs bg-emerald-200 text-emerald-800 rounded-full">
                                   Mới nhất
                                 </span>
                               )}
                               <span className="text-sm text-gray-500">
                                 #{evaluations.length - index}
                               </span>
                             </div>
                             <h3 className="font-semibold text-gray-900 text-lg">
                               Đánh giá lần {evaluations.length - index}
                             </h3>
                           </div>
                         </div>
                         
                         <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                           <div className="flex items-center gap-2">
                             <FiCalendar className="w-4 h-4 text-blue-600" />
                             <span className="text-gray-500">Ngày đánh giá:</span>
                             <span className="font-medium text-gray-900">
                               {evaluation.evaluatedAt ? new Date(evaluation.evaluatedAt).toLocaleDateString('vi-VN') : 'N/A'}
                             </span>
                           </div>
                           <div className="flex items-center gap-2">
                             <FiUser className="w-4 h-4 text-green-600" />
                             <span className="text-gray-500">Người đánh giá:</span>
                             <span className="font-medium text-gray-900">
                               {evaluation.expertName || evaluation.evaluatedBy || 'N/A'}
                             </span>
                           </div>
                         </div>

                                                   {evaluation.comments && (
                            <div className="space-y-2">
                              <p className="text-sm text-gray-800 font-medium">Nhận xét:</p>
                              <EvaluationCommentsDisplay 
                                comments={evaluation.comments} 
                                evaluationResult={evaluation.evaluationResult} 
                              />
                            </div>
                          )}

                         {evaluation.detailedFeedback && (
                           <div className="bg-blue-50 rounded-lg p-4 mt-3">
                             <p className="text-sm text-blue-800 font-medium mb-2">Phản hồi chi tiết:</p>
                             <p className="text-sm text-blue-700 line-clamp-2">
                               {evaluation.detailedFeedback.length > 150 
                                 ? `${evaluation.detailedFeedback.substring(0, 150)}...` 
                                 : evaluation.detailedFeedback
                               }
                             </p>
                           </div>
                         )}
                       </div>
                     ))}
                   </div>
                 ) : (
                   <div className="text-center py-8 bg-gray-50 rounded-xl">
                     <FiAward className="text-gray-400 text-3xl mx-auto mb-3" />
                     <p className="text-gray-500 text-sm">Chưa có lịch sử đánh giá nào</p>
                   </div>
                 )}
               </div>
             </div>
        </div>

        {/* Evaluation Criteria Form Modal */}
        <EvaluationCriteriaForm
          batchId={batchId}
          methodId={batch.methodId?.toString()}
          isOpen={showEvaluationForm}
          onClose={() => setShowEvaluationForm(false)}
          onSuccess={() => {
            setShowEvaluationForm(false);
            fetchData(); // Refresh data
            // 🔧 FIX: Xóa AppToast.success() vì EvaluationCriteriaForm đã tự hiển thị toast
          }}
        />

        {/* Retry Info Modal */}
        <EvaluationRetryInfo
          batchId={batchId}
          isOpen={showRetryInfo}
          onClose={() => setShowRetryInfo(false)}
          onRetry={(stageId) => {
            console.log("Retry stage:", stageId);
            setShowRetryInfo(false);
            // Có thể chuyển hướng đến trang progress để retry
            router.push(`/dashboard/farmer/processing-batches/${batchId}/progress?retryStage=${stageId}`);
          }}
        />
      </div>
    
  );
}
