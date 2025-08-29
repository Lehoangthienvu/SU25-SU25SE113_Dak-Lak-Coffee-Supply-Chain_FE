"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthGuard } from "@/lib/auth/useAuthGuard";
import { getProcessingBatchById, ProcessingBatch } from "@/lib/api/processingBatches";
import { getEvaluationsByBatch, ProcessingBatchEvaluation, getEvaluationResultDisplayNameI18n, getEvaluationResultColor } from "@/lib/api/processingBatchEvaluations";
import { ProcessingStatus } from "@/lib/constants/batchStatus";
import { FiArrowLeft, FiAlertCircle, FiCheckCircle, FiClock, FiUser, FiCalendar, FiPackage, FiBarChart2, FiEye, FiMessageCircle, FiTrendingUp } from "react-icons/fi";
import { StageFailureParser, StageFailureInfo } from "@/lib/helpers/evaluationHelpers";
import StageFailureDisplay from "@/components/processing-batches/StageFailureDisplay";
import { useTranslation } from "react-i18next";
import CommentListDisplay from "@/components/CommentListDisplay";


export default function FarmerEvaluationDetailPage() {
  useAuthGuard(["farmer"]);
  const params = useParams();
  const router = useRouter();
  const { t } = useTranslation();
  const batchId = params.id as string;

  const [batch, setBatch] = useState<ProcessingBatch | null>(null);
  const [evaluations, setEvaluations] = useState<ProcessingBatchEvaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Failure info state
  const [failureInfo, setFailureInfo] = useState<StageFailureInfo | null>(null);

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

      if (!batchData) {
        console.log("❌ DEBUG: No batch data found");
        setError(t("processing.pages.farmerEvaluationDetail.error.batchNotFound"));
        return;
      }

      setBatch(batchData);
      setEvaluations(evaluationsData);
      
      // Parse failure info từ evaluation cuối cùng
      if (evaluationsData && evaluationsData.length > 0) {
        const latestEvaluation = evaluationsData[0]; // Sắp xếp theo createdAt desc
        if (latestEvaluation.evaluationResult === 'Fail') {
          const failureInfo = StageFailureParser.parseFailureFromComments(latestEvaluation.comments || '');
          setFailureInfo(failureInfo);
        }
      }
    } catch (err: any) {
      console.error("❌ Lỗi fetchData:", err);
      console.error("❌ Error details:", {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data
      });
      setError(t("processing.pages.farmerEvaluationDetail.error.fetchData"));
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
        return { text: t("processing.pages.farmerEvaluationDetail.status.notStarted"), color: "text-gray-600 bg-gray-100", icon: <FiClock className="text-gray-500" /> };
      case ProcessingStatus.InProgress:
        return { text: t("processing.pages.farmerEvaluationDetail.status.inProgress"), color: "text-blue-600 bg-blue-100", icon: <FiClock className="text-blue-500" /> };
      case ProcessingStatus.AwaitingEvaluation:
        return { text: t("processing.pages.farmerEvaluationDetail.status.awaitingEvaluation"), color: "text-yellow-600 bg-yellow-100", icon: <FiAlertCircle className="text-yellow-500" /> };
      case ProcessingStatus.Completed:
        return { text: t("processing.pages.farmerEvaluationDetail.status.completed"), color: "text-green-600 bg-green-100", icon: <FiCheckCircle className="text-green-500" /> };
      case ProcessingStatus.Cancelled:
        return { text: t("processing.pages.farmerEvaluationDetail.status.cancelled"), color: "text-red-600 bg-red-100", icon: <FiAlertCircle className="text-red-500" /> };
      default:
        return { text: t("processing.pages.farmerEvaluationDetail.status.unknown"), color: "text-gray-600 bg-gray-100", icon: <FiAlertCircle className="text-gray-500" /> };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">{t("processing.pages.farmerEvaluationDetail.loading")}</p>
        </div>
      </div>
    );
  }

  if (error || !batch) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <FiAlertCircle className="text-red-500 text-4xl mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error || t("processing.pages.farmerEvaluationDetail.error.batchNotFound")}</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            {t("processing.pages.farmerEvaluationDetail.back")}
          </button>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo(batch.status);
  const latestEvaluation = evaluations.length > 0 ? evaluations[0] : null;

  return (
    <div className="p-6 bg-green-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-green-600 hover:text-green-700 mb-4 transition-colors"
          >
            <FiArrowLeft />
            {t("processing.pages.farmerEvaluationDetail.back")}
          </button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">{t("processing.pages.farmerEvaluationDetail.title")}</h1>
              <p className="text-gray-600">{t("processing.pages.farmerEvaluationDetail.batchCode")}: {batch.batchCode}</p>
            </div>
            
            <div className="flex items-center gap-3">
              <span className={`px-3 py-2 text-sm font-medium rounded-full ${statusInfo.color}`}>
                {statusInfo.text}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Batch Information */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">{t("processing.pages.farmerEvaluationDetail.batchInfo.title")}</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <FiPackage className="text-green-500" />
                    <div>
                      <p className="text-sm text-gray-600">{t("processing.pages.farmerEvaluationDetail.batchInfo.batchCode")}</p>
                      <p className="font-medium text-gray-900">{batch.batchCode}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <FiUser className="text-green-500" />
                    <div>
                      <p className="text-sm text-gray-600">{t("processing.pages.farmerEvaluationDetail.batchInfo.farmer")}</p>
                      <p className="font-medium text-gray-900">{batch.farmerName}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <FiCalendar className="text-green-500" />
                    <div>
                      <p className="text-sm text-gray-600">{t("processing.pages.farmerEvaluationDetail.batchInfo.cropSeason")}</p>
                      <p className="font-medium text-gray-900">{batch.cropSeasonName}</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <FiBarChart2 className="text-green-500" />
                    <div>
                      <p className="text-sm text-gray-600">{t("processing.pages.farmerEvaluationDetail.batchInfo.inputQuantity")}</p>
                      <p className="font-medium text-gray-900">{batch.totalInputQuantity} kg</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <FiBarChart2 className="text-green-500" />
                    <div>
                      <p className="text-sm text-gray-600">{t("processing.pages.farmerEvaluationDetail.batchInfo.outputQuantity")}</p>
                      <p className="font-medium text-gray-900">{batch.totalOutputQuantity} kg</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 flex items-center justify-center">
                      {statusInfo.icon}
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">{t("processing.pages.farmerEvaluationDetail.batchInfo.status")}</p>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusInfo.color}`}>
                        {statusInfo.text}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Evaluation Results */}
            {latestEvaluation && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <FiEye className="text-green-500" />
                  {t("processing.pages.farmerEvaluationDetail.evaluationResults.title")}
                </h2>
                
                <div className="space-y-6">
                  {/* Evaluation Status */}
                  <div className="flex items-center gap-3">
                    <span className={`px-4 py-2 text-sm font-medium rounded-full ${getEvaluationResultColor(latestEvaluation.evaluationResult)}`}>
                      {getEvaluationResultDisplayNameI18n(latestEvaluation.evaluationResult, t)}
                    </span>
                    {latestEvaluation.evaluatedAt && (
                      <span className="text-sm text-gray-500">
                        {t("processing.pages.farmerEvaluationDetail.evaluationResults.evaluatedAt")}: {new Date(latestEvaluation.evaluatedAt).toLocaleDateString('vi-VN')} {new Date(latestEvaluation.evaluatedAt).toLocaleTimeString('vi-VN')}
                      </span>
                    )}
                  </div>

                  {/* Failure Info Card */}
                  {failureInfo && (
                    <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                          <FiAlertCircle className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-red-900">{t("processing.pages.farmerEvaluationDetail.failureInfo.title")}</h3>
                          <p className="text-sm text-red-700">
                            {t("processing.pages.farmerEvaluationDetail.failureInfo.stage")}: {failureInfo.failedStageName}
                          </p>
                        </div>
                      </div>

                      {/* Details */}
                      <div className="space-y-3">
                        {failureInfo.failureDetails && (
                          <div className="bg-white/50 rounded-lg p-3">
                            <div className="flex items-start gap-2">
                              <FiMessageCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                              <div>
                                <h4 className="text-sm font-medium text-red-900 mb-1">
                                  {t("processing.pages.farmerEvaluationDetail.failureInfo.details.title")}:
                                </h4>
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
                              <FiCheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                              <div>
                                <h4 className="text-sm font-medium text-green-900 mb-1">
                                  {t("processing.pages.farmerEvaluationDetail.failureInfo.recommendations.title")}:
                                </h4>
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
                          <FiMessageCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <h4 className="text-sm font-medium text-blue-900 mb-1">
                              {t("processing.pages.farmerEvaluationDetail.failureInfo.nextSteps.title")}:
                            </h4>
                            <p className="text-sm text-blue-800">
                              {t("processing.pages.farmerEvaluationDetail.failureInfo.nextSteps.description", { stageName: failureInfo.failedStageName })}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Comments */}
                  {latestEvaluation.comments && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">{t("processing.pages.farmerEvaluationDetail.comments.title")}:</h4>
                      {/* Hiển thị failure info nếu là failure comment */}
                      {latestEvaluation.evaluationResult === 'Fail' && (
                        <StageFailureDisplay comments={latestEvaluation.comments} batch={batch} />
                      )}
                      
                      {/* Hiển thị comments thông thường nếu không phải failure */}
                      {latestEvaluation.evaluationResult !== 'Fail' && (
                        <div className="bg-gray-50 rounded-lg p-4">
                          <CommentListDisplay comments={latestEvaluation.comments} />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Progresses */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">{t("processing.pages.farmerEvaluationDetail.progress.title")}</h2>
              
              {batch.progresses && batch.progresses.length > 0 ? (
                <div className="space-y-4">
                  {batch.progresses
                    .sort((a, b) => a.stepIndex - b.stepIndex) // Sắp xếp theo stepIndex
                    .map((progress, index) => {
                      // Kiểm tra xem có phải bước retry không
                      const isRetryStep = progress.stepIndex > 1 && index > 0;
                      const previousProgress = index > 0 ? batch.progresses.find(p => p.stepIndex === progress.stepIndex - 1) : null;
                      const isRetry = previousProgress && previousProgress.stageName === progress.stageName;
                      
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
                                  {t("processing.pages.farmerEvaluationDetail.progress.step")} {progress.stepIndex}
                                  {isRetry && (
                                    <span className="ml-2 text-xs bg-orange-200 text-orange-800 px-2 py-0.5 rounded-full">
                                      {t("processing.pages.farmerEvaluationDetail.progress.retry")}
                                    </span>
                                  )}
                                </span>
                                <h3 className="font-semibold text-gray-900 text-lg">
                                  {progress.stageName}
                                  {isRetry && (
                                    <span className="ml-2 text-sm text-orange-600 font-medium">
                                      ({t("processing.pages.farmerEvaluationDetail.progress.retry")})
                                    </span>
                                  )}
                                </h3>
                              </div>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <FiTrendingUp className="w-4 h-4 text-green-600" />
                              <span className="text-gray-500">{t("processing.pages.farmerEvaluationDetail.progress.output")}:</span>
                              <span className="font-medium text-gray-900">{progress.outputQuantity} {progress.outputUnit}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <FiUser className="w-4 h-4 text-blue-600" />
                              <span className="text-gray-500">{t("processing.pages.farmerEvaluationDetail.progress.updatedBy")}:</span>
                              <span className="font-medium text-gray-900">{progress.updatedByName}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">{t("processing.pages.farmerEvaluationDetail.progress.noProgress")}</p>
              )}
            </div>

            {/* Evaluation History */}
            {evaluations.length > 1 && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">{t("processing.pages.farmerEvaluationDetail.history.title")}</h2>
                
                <div className="space-y-3">
                  {evaluations.slice(1).map((evaluation, index) => (
                    <div key={`${evaluation.evaluationId}-${index}`} className="border-l-2 border-gray-200 pl-4">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getEvaluationResultColor(evaluation.evaluationResult)}`}>
                          {getEvaluationResultDisplayNameI18n(evaluation.evaluationResult, t)}
                        </span>
                        <span className="text-xs text-gray-500">
                          {evaluation.evaluatedAt ? new Date(evaluation.evaluatedAt).toLocaleDateString('vi-VN') : t("processing.pages.farmerEvaluationDetail.history.noDate")}
                        </span>
                      </div>
                      
                      {evaluation.comments && (
                        <div className="mt-2">
                          {/* Hiển thị failure info nếu là failure comment */}
                          {evaluation.evaluationResult === 'Fail' && (
                            <StageFailureDisplay comments={evaluation.comments} batch={batch} />
                          )}
                          
                          {/* Hiển thị comments thông thường nếu không phải failure */}
                          {evaluation.evaluationResult !== 'Fail' && (
                            <div className="bg-gray-50 rounded-lg p-2">
                              <CommentListDisplay comments={evaluation.comments} />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Evaluation Summary */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">{t("processing.pages.farmerEvaluationDetail.summary.title")}</h2>
              
              {latestEvaluation ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${getEvaluationResultColor(latestEvaluation.evaluationResult)}`}>
                      {getEvaluationResultDisplayNameI18n(latestEvaluation.evaluationResult, t)}
                    </span>
                  </div>
                  
                  {latestEvaluation.evaluatedAt && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">{t("processing.pages.farmerEvaluationDetail.summary.evaluationDate")}:</p>
                      <p className="text-sm text-gray-900">
                        {new Date(latestEvaluation.evaluatedAt).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                  )}
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-700">
                      <strong>{t("processing.pages.farmerEvaluationDetail.summary.note.title")}:</strong> {t("processing.pages.farmerEvaluationDetail.summary.note.description")}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <FiAlertCircle className="text-yellow-500 text-2xl mx-auto mb-2" />
                  <p className="text-sm text-gray-600">{t("processing.pages.farmerEvaluationDetail.summary.noEvaluation")}</p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">{t("processing.pages.farmerEvaluationDetail.actions.title")}</h2>
              
              <div className="space-y-3">
                <button
                  onClick={() => router.push(`/dashboard/farmer/processing/batches/${batchId}`)}
                  className="w-full px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                >
                  <FiEye />
                  {t("processing.pages.farmerEvaluationDetail.actions.viewBatchDetails")}
                </button>
                
                <button
                  onClick={() => router.back()}
                  className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                >
                  <FiArrowLeft />
                  {t("processing.pages.farmerEvaluationDetail.actions.backToList")}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
