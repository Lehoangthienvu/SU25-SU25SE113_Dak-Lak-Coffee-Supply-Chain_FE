"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthGuard } from "@/lib/auth/useAuthGuard";
import { getAllProcessingBatchEvaluations, ProcessingBatchEvaluation, EVALUATION_RESULTS, getEvaluationResultDisplayName, getEvaluationResultColor } from "@/lib/api/processingBatchEvaluations";
import { ProcessingStatus } from "@/lib/constants/batchStatus";
import { FiEye, FiPlus, FiRefreshCw, FiAlertCircle, FiCheckCircle, FiClock, FiXCircle } from "react-icons/fi";
import { AppToast } from "@/components/ui/AppToast";

interface EvaluationBatch {
  batchId: string;
  batchCode: string;
  farmerName: string;
  methodName: string;
  totalInputQuantity: number;
  inputUnit: string;
  status: string;
  evaluationStatus: "pending" | "evaluated" | "none";
  evaluationResult?: string;
  evaluationDate?: string;
  latestEvaluation?: ProcessingBatchEvaluation;
}

export default function ExpertEvaluationsPage() {
  useAuthGuard(["expert"]);
  const router = useRouter();
  
  const [evaluationBatches, setEvaluationBatches] = useState<EvaluationBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "evaluated">("all");

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("🔍 DEBUG: Starting API call to Evaluations...");
      const evaluations = await getAllProcessingBatchEvaluations();

      console.log("🔍 DEBUG: Evaluations API response received");
      console.log("🔍 DEBUG: evaluations type:", typeof evaluations, "length:", evaluations?.length);

      if (!evaluations || !Array.isArray(evaluations)) {
        setError("Không thể tải danh sách đánh giá");
        return;
      }

      console.log("🔍 DEBUG: Evaluations data:", evaluations);

      // Chuyển đổi evaluations thành format hiển thị
      const evaluationBatches: EvaluationBatch[] = evaluations.map((evaluation: any) => {
        // Xác định trạng thái đánh giá
        let evaluationStatus: "pending" | "evaluated" | "none" = "none";
        let evaluationResult: string | undefined;
        let evaluationDate: string | undefined;

        if (evaluation.evaluatedBy && evaluation.evaluationResult) {
          evaluationStatus = "evaluated";
          evaluationResult = evaluation.evaluationResult;
          evaluationDate = evaluation.evaluatedAt;
        } else if (evaluation.batchStatus === "AwaitingEvaluation") {
          evaluationStatus = "pending";
        } else if (evaluation.batchStatus === "Completed") {
          evaluationStatus = "evaluated";
        }

        return {
          // Thông tin batch từ evaluation
          batchId: evaluation.batchId,
          batchCode: evaluation.batchCode,
          farmerName: evaluation.farmerName,
          methodName: evaluation.methodName,
          totalInputQuantity: evaluation.inputQuantity,
          inputUnit: evaluation.inputUnit, // Thêm inputUnit
          status: evaluation.batchStatus,
          evaluationStatus,
          evaluationResult,
          evaluationDate,
          latestEvaluation: evaluation
        };
      });

      console.log("🔍 DEBUG: Final evaluationBatches:", evaluationBatches);
      setEvaluationBatches(evaluationBatches);
    } catch (err) {
      console.error("❌ Lỗi fetchData:", err);
      setError("Có lỗi xảy ra khi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredBatches = evaluationBatches.filter(batch => {
    if (filter === "pending") return batch.evaluationStatus === "pending";
    if (filter === "evaluated") return batch.evaluationStatus === "evaluated";
    return true;
  });

  const getStatusIcon = (status: "pending" | "evaluated" | "none") => {
    switch (status) {
      case "pending":
        return <FiClock className="text-yellow-500" />;
      case "evaluated":
        return <FiCheckCircle className="text-green-500" />;
      default:
        return <FiAlertCircle className="text-gray-400" />;
    }
  };

  const getStatusText = (status: "pending" | "evaluated" | "none") => {
    switch (status) {
      case "pending":
        return "Chờ đánh giá";
      case "evaluated":
        return "Đã đánh giá";
      default:
        return "Không cần đánh giá";
    }
  };

  const getStatusColor = (status: "pending" | "evaluated" | "none") => {
    switch (status) {
      case "pending":
        return "text-yellow-600 bg-yellow-100";
      case "evaluated":
        return "text-green-600 bg-green-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <FiRefreshCw className="animate-spin text-orange-500 text-4xl mx-auto mb-4" />
          <p className="text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <FiXCircle className="text-red-500 text-4xl mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-orange-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Đánh giá lô sơ chế</h1>
          <p className="text-gray-600">Quản lý và đánh giá chất lượng các lô sơ chế cà phê</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tổng số lô</p>
                <p className="text-2xl font-bold text-gray-800">{evaluationBatches.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FiEye className="text-blue-600 text-xl" />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Chờ đánh giá</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {evaluationBatches.filter(b => b.evaluationStatus === "pending").length}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <FiClock className="text-yellow-600 text-xl" />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Đã đánh giá</p>
                <p className="text-2xl font-bold text-green-600">
                  {evaluationBatches.filter(b => b.evaluationStatus === "evaluated").length}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <FiCheckCircle className="text-green-600 text-xl" />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tỷ lệ hoàn thành</p>
                <p className="text-2xl font-bold text-orange-600">
                  {evaluationBatches.length > 0 
                    ? Math.round((evaluationBatches.filter(b => b.evaluationStatus === "evaluated").length / evaluationBatches.length) * 100)
                    : 0}%
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <FiAlertCircle className="text-orange-600 text-xl" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-xl shadow-sm mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex gap-2">
              <button
                onClick={() => setFilter("all")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === "all"
                    ? "bg-orange-100 text-orange-700"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Tất cả ({evaluationBatches.length})
              </button>
              <button
                onClick={() => setFilter("pending")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === "pending"
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Chờ đánh giá ({evaluationBatches.filter(b => b.evaluationStatus === "pending").length})
              </button>
              <button
                onClick={() => setFilter("evaluated")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === "evaluated"
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Đã đánh giá ({evaluationBatches.filter(b => b.evaluationStatus === "evaluated").length})
              </button>
            </div>
            
            <button
              onClick={fetchData}
              className="ml-auto px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-2"
            >
              <FiRefreshCw className="text-sm" />
              Làm mới
            </button>
          </div>
        </div>

        {/* Batches List */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {filteredBatches.length === 0 ? (
            <div className="p-12 text-center">
              <FiAlertCircle className="text-gray-400 text-4xl mx-auto mb-4" />
              <p className="text-gray-600 mb-2">Không có lô nào cần đánh giá</p>
              <p className="text-sm text-gray-500">Các lô sơ chế sẽ xuất hiện ở đây khi cần đánh giá</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mã lô
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nông dân
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phương pháp
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Khối lượng
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Kết quả đánh giá
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ngày đánh giá
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredBatches.map((batch) => (
                    <tr key={batch.batchId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{batch.batchCode}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{batch.farmerName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{batch.methodName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{batch.totalInputQuantity} {batch.inputUnit}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(batch.evaluationStatus)}
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(batch.evaluationStatus)}`}>
                            {getStatusText(batch.evaluationStatus)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {batch.evaluationResult ? (
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getEvaluationResultColor(batch.evaluationResult)}`}>
                            {getEvaluationResultDisplayName(batch.evaluationResult)}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {batch.evaluationDate ? new Date(batch.evaluationDate).toLocaleDateString('vi-VN') : '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              console.log("🔍 DEBUG: Clicking evaluation button for batch:", batch.batchId);
                              console.log("🔍 DEBUG: Navigation URL:", `/dashboard/expert/evaluations/${batch.batchId}`);
                              
                              if (!batch.batchId) {
                                console.error("❌ ERROR: batchId is undefined or null");
                                AppToast.error("Lỗi: Không tìm thấy ID của lô");
                                return;
                              }
                              
                              router.push(`/dashboard/expert/evaluations/${batch.batchId}`);
                            }}
                            className="px-3 py-1 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-xs"
                          >
                            {batch.evaluationStatus === "evaluated" ? "Xem chi tiết" : "Đánh giá"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
