"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthGuard } from "@/lib/auth/useAuthGuard";
import { getProcessingBatchById, ProcessingBatch } from "@/lib/api/processingBatches";
import { getEvaluationsByBatch, ProcessingBatchEvaluation, EVALUATION_RESULTS, getEvaluationResultDisplayName, getEvaluationResultColor } from "@/lib/api/processingBatchEvaluations";

import { ProcessingStatus } from "@/lib/constants/batchStatus";
import { FiArrowLeft, FiSave, FiAlertCircle, FiCheckCircle, FiClock, FiUser, FiCalendar, FiPackage, FiBarChart2, FiX, FiActivity, FiTarget, FiAward, FiTrendingUp as FiTrendingUpIcon } from "react-icons/fi";
import StageFailureDisplay from "@/components/processing-batches/StageFailureDisplay";
import FarmerRetryStatus from "@/components/processing-batches/FarmerRetryStatus";
import RetryGuidanceInfo from "@/components/processing-batches/RetryGuidanceInfo";
import EvaluationCriteriaForm from "@/components/processing-batches/EvaluationCriteriaForm";
import { AppToast } from "@/components/ui/AppToast";

export default function ExpertEvaluationDetailPage() {
  useAuthGuard(["expert"]);
  const params = useParams();
  const router = useRouter();
  const batchId = params.id as string;

  const [batch, setBatch] = useState<ProcessingBatch | null>(null);
  const [evaluations, setEvaluations] = useState<ProcessingBatchEvaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEvaluationForm, setShowEvaluationForm] = useState(false);

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
        setError("Không tìm thấy lô sơ chế");
        return;
      }

      setBatch(batchData);
      setEvaluations(evaluationsData);
    } catch (err: unknown) {
      console.error("❌ Lỗi fetchData:", err);
      const errorMessage = err instanceof Error ? err.message : "Có lỗi xảy ra khi tải dữ liệu";
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
          <p className="text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  if (error || !batch) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <FiAlertCircle className="text-red-500 text-4xl mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error || "Không tìm thấy lô sơ chế"}</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo(batch.status);
  const latestEvaluation = evaluations.length > 0 ? evaluations[0] : null;
  const overallEval = calculateOverallEvaluation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 mb-6 transition-colors"
          >
            <FiArrowLeft />
            Quay lại
          </button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                Đánh giá lô sơ chế
              </h1>
              <p className="text-gray-600">Mã lô: {batch.batchCode} • Nông dân: {batch.farmerName}</p>
            </div>

            <button
              onClick={() => setShowEvaluationForm(true)}
              className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl hover:from-indigo-600 hover:to-purple-600 transition-all duration-200 flex items-center gap-2 font-medium shadow-lg hover:shadow-xl"
            >
              <FiSave />
              Cập nhật đánh giá
            </button>
          </div>
        </div>

        {/* 🔥 CẢI THIỆN: UI mới - Layout 2 cột cân đối */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Cột trái: Thông tin cơ bản và tiến trình */}
          <div className="space-y-6">
            {/* Batch Information Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-6 text-white">
                <h2 className="text-xl font-semibold flex items-center gap-3">
                  <FiPackage className="w-6 h-6" />
                  Thông tin lô sơ chế
                </h2>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-100 rounded-lg">
                        <FiPackage className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Mã lô</p>
                        <p className="font-semibold text-gray-900">{batch.batchCode}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <FiUser className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Nông dân</p>
                        <p className="font-semibold text-gray-900">{batch.farmerName}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <FiCalendar className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Mùa vụ</p>
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
                        <p className="text-sm text-gray-600">Khối lượng vào</p>
                        <p className="font-semibold text-gray-900">{batch.totalInputQuantity} kg</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <FiTrendingUpIcon className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Khối lượng ra</p>
                        <p className="font-semibold text-gray-900">{batch.totalOutputQuantity} kg</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        {statusInfo.icon}
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Trạng thái</p>
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
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-6 text-white">
                <h2 className="text-xl font-semibold flex items-center gap-3">
                  <FiActivity className="w-6 h-6" />
                  Tiến trình sơ chế
                </h2>
              </div>

              <div className="p-6">
                {batch.progresses && batch.progresses.length > 0 ? (
                  <div className="space-y-4">
                    {batch.progresses.map((progress, index) => (
                      <div key={progress.progressId} className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-4 hover:shadow-md transition-all duration-200">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                              {index + 1}
                            </div>
                            <h3 className="font-semibold text-gray-900 text-lg">
                              {progress.stageName}
                            </h3>
                          </div>
                          <span className="text-sm text-gray-500 bg-white px-3 py-1 rounded-full">
                            {progress.progressDate ? new Date(progress.progressDate).toLocaleDateString('vi-VN') : 'Chưa bắt đầu'}
                          </span>
                        </div>

                        {progress.stageDescription && (
                          <p className="text-gray-600 mb-3 text-sm">{progress.stageDescription}</p>
                        )}

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <FiTrendingUpIcon className="w-4 h-4 text-green-600" />
                            <span className="text-gray-500">Sản lượng:</span>
                            <span className="font-medium text-gray-900">{progress.outputQuantity} {progress.outputUnit}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <FiUser className="w-4 h-4 text-blue-600" />
                            <span className="text-gray-500">Cập nhật bởi:</span>
                            <span className="font-medium text-gray-900">{progress.updatedByName}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-xl">
                    <FiActivity className="text-gray-400 text-3xl mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">Chưa có tiến trình nào được ghi nhận</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Cột phải: Đánh giá và thống kê */}
          <div className="space-y-6">
            {/* 🔥 CẢI THIỆN: Overall Evaluation Card - UI mới đẹp */}
            {overallEval && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-6 text-white">
                  <h2 className="text-xl font-semibold flex items-center gap-3">
                    <FiAward className="w-6 h-6" />
                    Tổng quan đánh giá lô
                  </h2>
                  <p className="text-emerald-100 mt-2">Kết quả tổng hợp từ tất cả các giai đoạn</p>
                </div>

                <div className="p-6">
                  {/* Kết quả tổng hợp */}
                  <div className="text-center mb-6">
                    <div className={`inline-flex items-center gap-3 px-6 py-3 rounded-xl border-2 ${overallEval.overallResult === 'Pass'
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                      : 'border-red-200 bg-red-50 text-red-800'
                      }`}>
                      <div className={`p-2 rounded-lg ${overallEval.overallResult === 'Pass' ? 'bg-emerald-100' : 'bg-red-100'
                        }`}>
                        {overallEval.overallResult === 'Pass' ? (
                          <FiCheckCircle className="w-6 h-6 text-emerald-600" />
                        ) : (
                          <FiX className="w-6 h-6 text-red-600" />
                        )}
                      </div>
                      <span className="font-bold text-lg">
                        {overallEval.overallResult === 'Pass' ? 'Đạt chuẩn' : 'Không đạt'}
                      </span>
                    </div>
                  </div>

                  {/* Thống kê 3 cột */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    {/* Điểm trung bình */}
                    <div className="text-center">
                      <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-4 rounded-xl shadow-lg">
                        <div className="text-2xl font-bold mb-1">
                          {overallEval.averageScore}
                        </div>
                        <div className="text-sm opacity-90">/100</div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                        <div
                          className="bg-gradient-to-r from-blue-400 to-blue-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${overallEval.averageScore}%` }}
                        ></div>
                      </div>
                      <p className="text-sm text-gray-600 mt-2 font-medium">Điểm trung bình</p>
                    </div>

                    {/* Giai đoạn đạt */}
                    <div className="text-center">
                      <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-4 rounded-xl shadow-lg">
                        <div className="text-2xl font-bold mb-1">
                          {overallEval.passedEvaluations}
                        </div>
                        <div className="text-sm opacity-90">/{overallEval.totalEvaluations}</div>
                      </div>
                      <p className="text-sm text-gray-600 mt-2 font-medium">Giai đoạn đạt</p>
                    </div>

                    {/* Tỷ lệ đạt */}
                    <div className="text-center">
                      <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-4 rounded-xl shadow-lg">
                        <div className="text-2xl font-bold mb-1">
                          {overallEval.passPercentage}%
                        </div>
                        <div className="text-sm opacity-90">Tỷ lệ</div>
                      </div>
                      <p className="text-sm text-gray-600 mt-2 font-medium">Tỷ lệ đạt</p>
                    </div>
                  </div>

                  {/* Logic đánh giá */}
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-4 text-center">
                    <div className="text-sm text-blue-800 font-medium">
                      <span className="font-bold">Logic đánh giá:</span> Đạt ≥80đ HOẶC ≥{Math.ceil(overallEval.totalEvaluations * 0.67)}/{overallEval.totalEvaluations} giai đoạn
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Evaluation Status Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6 text-white">
                <h2 className="text-xl font-semibold flex items-center gap-3">
                  <FiTarget className="w-6 h-6" />
                  Trạng thái đánh giá
                </h2>
              </div>

              <div className="p-6">
                {latestEvaluation ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center">
                      <span className={`px-6 py-3 text-lg font-medium rounded-xl ${getEvaluationResultColor(latestEvaluation.evaluationResult)}`}>
                        {getEvaluationResultDisplayName(latestEvaluation.evaluationResult)}
                      </span>
                    </div>

                    {/* 🔧 CẢI THIỆN: Hiển thị thông tin failure chỉ khi đánh giá không đạt */}
                    {latestEvaluation.comments && latestEvaluation.evaluationResult === EVALUATION_RESULTS.FAIL && (
                      <div className="space-y-4">
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                          <p className="text-sm text-red-800 font-medium mb-3">Nhận xét:</p>
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
                        </div>
                      </div>
                    )}

                    {/* 🔧 CẢI THIỆN: Hiển thị comments thông thường cho đánh giá đạt */}
                    {latestEvaluation.comments && latestEvaluation.evaluationResult !== EVALUATION_RESULTS.FAIL && (
                      <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                        <p className="text-sm text-green-800 font-medium mb-2">Nhận xét:</p>
                        <p className="text-sm text-green-800">{latestEvaluation.comments}</p>
                      </div>
                    )}

                    {/* 🔧 CẢI THIỆN: Hiển thị thông tin chi tiết khác */}
                    {latestEvaluation.detailedFeedback && (
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                        <p className="text-sm text-blue-800 font-medium mb-2">Phản hồi chi tiết:</p>
                        <p className="text-sm text-blue-900">{latestEvaluation.detailedFeedback}</p>
                      </div>
                    )}

                    {latestEvaluation.recommendations && (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                        <p className="text-sm text-emerald-800 font-medium mb-2">Khuyến nghị:</p>
                        <p className="text-sm text-emerald-900">{latestEvaluation.recommendations}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      {latestEvaluation.evaluatedAt && (
                        <div className="bg-gray-50 rounded-xl p-4 text-center">
                          <p className="text-xs text-gray-600 mb-1">Ngày đánh giá</p>
                          <p className="text-sm font-medium text-gray-900">
                            {new Date(latestEvaluation.evaluatedAt).toLocaleDateString('vi-VN')}
                          </p>
                        </div>
                      )}

                      {/* 🔧 CẢI THIỆN: Hiển thị người đánh giá nếu có */}
                      {latestEvaluation.evaluatedBy && (
                        <div className="bg-gray-50 rounded-xl p-4 text-center">
                          <p className="text-xs text-gray-600 mb-1">Đánh giá bởi</p>
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
                    <p className="text-gray-600 text-sm">Chưa có đánh giá</p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Statistics Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-500 to-blue-500 p-6 text-white">
                <h2 className="text-xl font-semibold flex items-center gap-3">
                  <FiBarChart2 className="w-6 h-6" />
                  Thống kê nhanh
                </h2>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-xl">
                    <div className="text-2xl font-bold text-blue-600">
                      {evaluations.length}
                    </div>
                    <div className="text-xs text-blue-700">Lần đánh giá</div>
                  </div>

                  <div className="text-center p-4 bg-green-50 rounded-xl">
                    <div className="text-2xl font-bold text-green-600">
                      {evaluations.filter(e => e.evaluationResult === EVALUATION_RESULTS.PASS).length}
                    </div>
                    <div className="text-xs text-green-700">Đạt chuẩn</div>
                  </div>

                  <div className="text-center p-4 bg-yellow-50 rounded-xl">
                    <div className="text-2xl font-bold text-yellow-600">
                      {evaluations.filter(e => e.evaluationResult === EVALUATION_RESULTS.NEEDS_IMPROVEMENT).length}
                    </div>
                    <div className="text-xs text-yellow-700">Cần cải thiện</div>
                  </div>

                  <div className="text-center p-4 bg-red-50 rounded-xl">
                    <div className="text-2xl font-bold text-red-600">
                      {evaluations.filter(e => e.evaluationResult === EVALUATION_RESULTS.FAIL).length}
                    </div>
                    <div className="text-xs text-red-700">Không đạt</div>
                  </div>
                </div>
              </div>
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
            AppToast.success("Đánh giá đã được cập nhật thành công!");
          }}
        />
      </div>
    </div>
  );
}
