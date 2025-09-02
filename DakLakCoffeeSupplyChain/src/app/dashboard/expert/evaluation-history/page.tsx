"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthGuard } from "@/lib/auth/useAuthGuard";
import { getAllProcessingBatchEvaluations, ProcessingBatchEvaluation, EVALUATION_RESULTS, getEvaluationResultDisplayNameI18n, getEvaluationResultColor } from "@/lib/api/processingBatchEvaluations";
import { getProcessingBatchById, ProcessingBatch } from "@/lib/api/processingBatches";
import { ProcessingStatus } from "@/lib/constants/batchStatus";
import { FiArrowLeft, FiSearch, FiFilter, FiCalendar, FiUser, FiPackage, FiAward, FiEye, FiTrendingUp, FiCheckCircle, FiXCircle, FiAlertCircle } from "react-icons/fi";
import EvaluationCommentsDisplay from "@/components/processing-batches/EvaluationCommentsDisplay";
import { AppToast } from "@/components/ui/AppToast";
import { useTranslation } from "react-i18next";

interface EvaluationWithBatch extends ProcessingBatchEvaluation {
  batch?: ProcessingBatch;
}

function ExpertEvaluationHistoryContent() {
  useAuthGuard(["expert"]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();

  const [evaluations, setEvaluations] = useState<EvaluationWithBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  
  // Lấy batchId từ URL parameter
  const batchIdFromUrl = searchParams.get('batchId');

  const fetchEvaluationHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      // Lấy tất cả evaluations từ API
      const evaluationsData = await getAllProcessingBatchEvaluations();
      console.log("🔍 DEBUG: Fetched evaluations:", evaluationsData);

      // Nhóm evaluations theo batchId
      const batchGroups: { [batchId: string]: ProcessingBatchEvaluation[] } = {};
      
      evaluationsData.forEach(evaluation => {
        if (!batchGroups[evaluation.batchId]) {
          batchGroups[evaluation.batchId] = [];
        }
        batchGroups[evaluation.batchId].push(evaluation);
      });

      // Lấy thông tin batch và tạo danh sách theo batch
      const evaluationsWithBatch: EvaluationWithBatch[] = [];
      
      for (const [batchId, batchEvaluations] of Object.entries(batchGroups)) {
        try {
          const batchData = await getProcessingBatchById(batchId);
          
          // Sắp xếp evaluations theo thời gian (mới nhất trước)
          const sortedEvaluations = batchEvaluations.sort((a, b) => 
            new Date(b.evaluatedAt || b.createdAt).getTime() - new Date(a.evaluatedAt || a.createdAt).getTime()
          );
          
          // Thêm tất cả evaluations của batch này
          sortedEvaluations.forEach(evaluation => {
            evaluationsWithBatch.push({
              ...evaluation,
              batch: batchData
            });
          });
        } catch (batchError) {
          console.warn(`⚠️ Không thể lấy thông tin batch ${batchId}:`, batchError);
          // Vẫn thêm evaluations vào danh sách nhưng không có batch info
          batchEvaluations.forEach(evaluation => {
            evaluationsWithBatch.push({
              ...evaluation,
              batch: undefined
            });
          });
        }
      }

      setEvaluations(evaluationsWithBatch);
    } catch (err: unknown) {
      console.error("❌ Lỗi fetchEvaluationHistory:", err);
      const errorMessage = err instanceof Error ? err.message : t('evaluationHistory.error');
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvaluationHistory();
  }, []);

  // Parse evaluation comments để hiển thị đẹp hơn
  const parseEvaluationComments = (comments: string) => {
    if (!comments) return null;

    const lines = comments.split('\n');
    const parsedData: any = {};

    lines.forEach(line => {
      const [key, value] = line.split(':');
      if (key && value) {
        parsedData[key.trim()] = value.trim();
      }
    });

    return parsedData;
  };

  // Nhóm evaluations theo batch và filter
  const getFilteredBatchGroups = () => {
    // Nhóm evaluations theo batchId
    const batchGroups: { [batchId: string]: EvaluationWithBatch[] } = {};
    
    evaluations.forEach(evaluation => {
      if (!batchGroups[evaluation.batchId]) {
        batchGroups[evaluation.batchId] = [];
      }
      batchGroups[evaluation.batchId].push(evaluation);
    });

    // Filter và sắp xếp các batch
    const filteredBatchGroups: { [batchId: string]: EvaluationWithBatch[] } = {};
    
    Object.entries(batchGroups).forEach(([batchId, batchEvaluations]) => {
      // Nếu có batchId từ URL, chỉ hiển thị batch đó
      if (batchIdFromUrl && batchId !== batchIdFromUrl) {
        return;
      }
      
      const filteredEvaluations = batchEvaluations.filter(evaluation => {
        const matchesSearch = 
          evaluation.batch?.batchCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          evaluation.batch?.farmerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          evaluation.expertName?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === "all" || evaluation.evaluationResult === statusFilter;
        
        const matchesDate = dateFilter === "all" || (() => {
          if (!evaluation.evaluatedAt) return false;
          const evalDate = new Date(evaluation.evaluatedAt);
          const today = new Date();
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          const lastWeek = new Date(today);
          lastWeek.setDate(lastWeek.getDate() - 7);
          const lastMonth = new Date(today);
          lastMonth.setMonth(lastMonth.getMonth() - 1);

          switch (dateFilter) {
            case "today":
              return evalDate.toDateString() === today.toDateString();
            case "yesterday":
              return evalDate.toDateString() === yesterday.toDateString();
            case "lastWeek":
              return evalDate >= lastWeek;
            case "lastMonth":
              return evalDate >= lastMonth;
            default:
              return true;
          }
        })();

        return matchesSearch && matchesStatus && matchesDate;
      });

      if (filteredEvaluations.length > 0) {
        filteredBatchGroups[batchId] = filteredEvaluations;
      }
    });

    return filteredBatchGroups;
  };

  const filteredBatchGroups = getFilteredBatchGroups();

  const getStatusInfo = (status: ProcessingStatus) => {
    switch (status) {
      case ProcessingStatus.NotStarted:
        return { text: "Chưa bắt đầu", color: "text-gray-600 bg-gray-100", icon: <FiAlertCircle className="text-gray-500" /> };
      case ProcessingStatus.InProgress:
        return { text: "Đang thực hiện", color: "text-blue-600 bg-blue-100", icon: <FiTrendingUp className="text-blue-500" /> };
      case ProcessingStatus.AwaitingEvaluation:
        return { text: "Chờ đánh giá", color: "text-yellow-600 bg-yellow-100", icon: <FiAlertCircle className="text-yellow-500" /> };
      case ProcessingStatus.Completed:
        return { text: "Hoàn thành", color: "text-green-600 bg-green-100", icon: <FiCheckCircle className="text-green-500" /> };
      case ProcessingStatus.Cancelled:
        return { text: "Đã hủy", color: "text-red-600 bg-red-100", icon: <FiXCircle className="text-red-500" /> };
      default:
        return { text: "Không xác định", color: "text-gray-600 bg-gray-100", icon: <FiAlertCircle className="text-gray-500" /> };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('evaluationHistory.loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <FiAlertCircle className="text-red-500 text-4xl mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            {t('evaluationHistory.back')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm text-indigo-600 hover:text-indigo-700 hover:bg-white/90 transition-all duration-200 rounded-lg border border-indigo-200 shadow-sm hover:shadow-md"
            >
              <FiArrowLeft className="w-4 h-4" />
              <span className="font-medium">{t('evaluationHistory.back')}</span>
            </button>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-lg">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex-1">
                                 <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                   {batchIdFromUrl ? t('evaluationHistory.pageTitleBatch') : t('evaluationHistory.pageTitle')}
                 </h1>
                 <p className="text-gray-600 text-sm lg:text-base">
                   {batchIdFromUrl 
                     ? (() => {
                         // Tìm batch có batchCode thực tế
                         const batchWithCode = evaluations.find(e => e.batchId === batchIdFromUrl && e.batch?.batchCode);
                         const displayCode = batchWithCode?.batch?.batchCode || batchIdFromUrl;
                         return t('evaluationHistory.pageDescriptionBatch', { batchCode: displayCode });
                       })()
                     : t('evaluationHistory.pageDescription')
                   }
                 </p>
                
                {/* Stats */}
                <div className="flex flex-wrap gap-3 mt-4">
                  <div className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium border border-blue-200">
                    {t('evaluationHistory.stats.total', { count: evaluations.length })}
                  </div>
                  <div className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium border border-green-200">
                    {t('evaluationHistory.stats.passed', { count: evaluations.filter(e => e.evaluationResult === EVALUATION_RESULTS.PASS).length })}
                  </div>
                  <div className="px-3 py-1 bg-red-50 text-red-700 rounded-full text-xs font-medium border border-red-200">
                    {t('evaluationHistory.stats.failed', { count: evaluations.filter(e => e.evaluationResult === EVALUATION_RESULTS.FAIL).length })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder={t('evaluationHistory.filters.search')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <FiFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="all">{t('evaluationHistory.filters.allStatus')}</option>
                <option value={EVALUATION_RESULTS.PASS}>{getEvaluationResultDisplayNameI18n(EVALUATION_RESULTS.PASS, t)}</option>
                <option value={EVALUATION_RESULTS.FAIL}>{getEvaluationResultDisplayNameI18n(EVALUATION_RESULTS.FAIL, t)}</option>
                <option value={EVALUATION_RESULTS.NEEDS_IMPROVEMENT}>{getEvaluationResultDisplayNameI18n(EVALUATION_RESULTS.NEEDS_IMPROVEMENT, t)}</option>
              </select>
            </div>

            {/* Date Filter */}
            <div className="relative">
              <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="all">{t('evaluationHistory.filters.allTime')}</option>
                <option value="today">{t('evaluationHistory.filters.today')}</option>
                <option value="yesterday">{t('evaluationHistory.filters.yesterday')}</option>
                <option value="lastWeek">{t('evaluationHistory.filters.lastWeek')}</option>
                <option value="lastMonth">{t('evaluationHistory.filters.lastMonth')}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Evaluation List */}
        <div className="space-y-6">
          {Object.keys(filteredBatchGroups).length > 0 ? (
            Object.entries(filteredBatchGroups).map(([batchId, batchEvaluations]) => {
              const firstEvaluation = batchEvaluations[0];
              const statusInfo = firstEvaluation.batch ? getStatusInfo(firstEvaluation.batch.status) : null;

                                            return (
                 <div key={batchId} className="space-y-6">
                   {/* Card 1: Thông tin lô */}
                   <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 overflow-hidden hover:shadow-2xl transition-all duration-300">
                     {/* Header */}
                     <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 p-6 text-white">
                       <div className="flex items-center justify-between">
                         <div className="flex items-center gap-3">
                           <FiAward className="w-6 h-6" />
                           <div>
                             <h2 className="text-xl font-semibold">
                               Lô {firstEvaluation.batch?.batchCode || batchId}
                             </h2>
                             <p className="text-emerald-100 text-sm">
                               {firstEvaluation.batch?.farmerName} - {batchEvaluations.length} đánh giá
                             </p>
                           </div>
                         </div>
                         <div className="flex items-center gap-3">
                                                        <button
                               onClick={() => router.push(`/dashboard/expert/evaluations/${batchId}`)}
                               className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors flex items-center gap-2"
                             >
                               <FiEye className="w-4 h-4" />
                               <span className="text-sm">{t('evaluationHistory.batchInfo.viewDetails')}</span>
                             </button>
                         </div>
                       </div>
                     </div>

                     <div className="p-6">
                       {/* Batch Info */}
                       <div className="space-y-4">
                         <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                           <FiPackage className="w-5 h-5 text-indigo-600" />
                           {t('evaluationHistory.batchInfo.title')}
                         </h3>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <div className="flex items-center gap-3">
                             <div className="p-2 bg-indigo-100 rounded-lg">
                               <FiPackage className="w-4 h-4 text-indigo-600" />
                             </div>
                             <div>
                               <p className="text-sm text-gray-600">{t('evaluationHistory.batchInfo.batchCode')}</p>
                               <p className="font-medium text-gray-900">{firstEvaluation.batch?.batchCode}</p>
                             </div>
                           </div>
                           <div className="flex items-center gap-3">
                             <div className="p-2 bg-green-100 rounded-lg">
                               <FiUser className="w-4 h-4 text-green-600" />
                             </div>
                             <div>
                               <p className="text-sm text-gray-600">{t('evaluationHistory.batchInfo.farmer')}</p>
                               <p className="font-medium text-gray-900">{firstEvaluation.batch?.farmerName}</p>
                             </div>
                           </div>
                           <div className="flex items-center gap-3">
                             <div className="p-2 bg-orange-100 rounded-lg">
                               <FiTrendingUp className="w-4 h-4 text-orange-600" />
                             </div>
                             <div>
                               <p className="text-sm text-gray-600">{t('evaluationHistory.batchInfo.yield')}</p>
                               <p className="font-medium text-gray-900">
                                 {firstEvaluation.batch?.totalInputQuantity}kg → {firstEvaluation.batch?.totalOutputQuantity}kg
                               </p>
                             </div>
                           </div>
                           {statusInfo && (
                             <div className="flex items-center gap-3">
                               <div className="p-2 bg-gray-100 rounded-lg">
                                 {statusInfo.icon}
                               </div>
                               <div>
                                 <p className="text-sm text-gray-600">{t('evaluationHistory.batchInfo.status')}</p>
                                 <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusInfo.color}`}>
                                   {statusInfo.text}
                                 </span>
                               </div>
                             </div>
                           )}
                         </div>
                       </div>
                     </div>
                   </div>

                                       {/* Section: Lịch sử đánh giá */}
                    <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 overflow-hidden">
                      <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 p-6 text-white">
                        <div className="flex items-center gap-3">
                          <FiAward className="w-6 h-6" />
                          <div>
                            <h2 className="text-xl font-semibold">
                              {t('evaluationHistory.title')} ({batchEvaluations.length})
                            </h2>
                            <p className="text-emerald-100 text-sm">
                              {t('evaluationHistory.subtitle', { batchCode: firstEvaluation.batch?.batchCode || batchId })}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="p-6">
                        <div className="space-y-6">
                          {batchEvaluations.map((evaluation, index) => (
                            <div 
                              key={evaluation.evaluationId} 
                              className={`rounded-xl border transition-all duration-300 hover:shadow-lg p-6 ${
                                evaluation.evaluationResult === EVALUATION_RESULTS.PASS
                                  ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 hover:border-green-300'
                                  : evaluation.evaluationResult === EVALUATION_RESULTS.FAIL
                                  ? 'bg-gradient-to-br from-red-50 to-rose-50 border-red-200 hover:border-red-300'
                                  : 'bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200 hover:border-yellow-300'
                              }`}
                            >
                              {/* Header với status và thông tin */}
                              <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                  <div className={`p-2 rounded-lg ${
                                    evaluation.evaluationResult === EVALUATION_RESULTS.PASS
                                      ? 'bg-green-100 text-green-600'
                                      : evaluation.evaluationResult === EVALUATION_RESULTS.FAIL
                                      ? 'bg-red-100 text-red-600'
                                      : 'bg-yellow-100 text-yellow-600'
                                  }`}>
                                    {evaluation.evaluationResult === EVALUATION_RESULTS.PASS ? (
                                      <FiCheckCircle className="w-4 h-4" />
                                    ) : evaluation.evaluationResult === EVALUATION_RESULTS.FAIL ? (
                                      <FiXCircle className="w-4 h-4" />
                                    ) : (
                                      <FiAlertCircle className="w-4 h-4" />
                                    )}
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className={`px-3 py-1 text-sm font-medium rounded-full ${getEvaluationResultColor(evaluation.evaluationResult)}`}>
                                        {getEvaluationResultDisplayNameI18n(evaluation.evaluationResult, t)}
                                      </span>
                                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                        #{batchEvaluations.length - index}
                                      </span>
                                      {index === 0 && (
                                        <span className="text-xs bg-emerald-200 text-emerald-800 px-2 py-1 rounded-full">
                                          {t('evaluationHistory.latest')}
                                        </span>
                                      )}
                                    </div>
                                    <h4 className="font-semibold text-gray-900">
                                      {t('evaluationHistory.evaluationNumber', { number: batchEvaluations.length - index })}
                                    </h4>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-xs text-gray-500">
                                    {evaluation.evaluatedAt ? new Date(evaluation.evaluatedAt).toLocaleDateString('vi-VN') : 'N/A'}
                                  </div>
                                </div>
                              </div>

                              {/* Thông tin người đánh giá */}
                              <div className="flex items-center gap-2 mb-4 text-sm">
                                <FiUser className="w-4 h-4 text-gray-500" />
                                <span className="text-gray-600">{t('evaluationHistory.evaluator')}:</span>
                                <span className="font-medium text-gray-900">{evaluation.expertName}</span>
                              </div>

                              {/* Comments với format đẹp */}
                              {evaluation.comments && (
                                <div className="space-y-3">
                                  <div className="flex items-center gap-2">
                                    <FiAward className="w-4 h-4 text-gray-500" />
                                    <span className="text-sm font-medium text-gray-700">{t('evaluationHistory.comments')}:</span>
                                  </div>
                                  <EvaluationCommentsDisplay 
                                    comments={evaluation.comments} 
                                    evaluationResult={evaluation.evaluationResult} 
                                  />
                                </div>
                              )}

                              {/* Detailed Feedback nếu có */}
                              {evaluation.detailedFeedback && (
                                <div className="mt-4 space-y-2">
                                  <div className="flex items-center gap-2">
                                    <FiAlertCircle className="w-4 h-4 text-blue-500" />
                                    <span className="text-sm font-medium text-gray-700">{t('evaluationHistory.detailedFeedback')}:</span>
                                  </div>
                                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                    <p className="text-sm text-blue-800">{evaluation.detailedFeedback}</p>
                                  </div>
                                </div>
                              )}

                              {/* Recommendations nếu có */}
                              {evaluation.recommendations && (
                                <div className="mt-4 space-y-2">
                                  <div className="flex items-center gap-2">
                                    <FiCheckCircle className="w-4 h-4 text-emerald-500" />
                                    <span className="text-sm font-medium text-gray-700">{t('evaluationHistory.recommendations')}:</span>
                                  </div>
                                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                                    <p className="text-sm text-emerald-800">{evaluation.recommendations}</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                 </div>
               );
             })
          ) : (
                         <div className="text-center py-12 bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50">
               <FiAward className="text-gray-400 text-4xl mx-auto mb-4" />
               <h3 className="text-lg font-medium text-gray-900 mb-2">{t('evaluationHistory.noResults.title')}</h3>
               <p className="text-gray-500">{t('evaluationHistory.noResults.description')}</p>
             </div>
          )}
        </div>
      </div>
    </div>
     );
}

export default function ExpertEvaluationHistoryPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    }>
      <ExpertEvaluationHistoryContent />
    </Suspense>
  );
}
