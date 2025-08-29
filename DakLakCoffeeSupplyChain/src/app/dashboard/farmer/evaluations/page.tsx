"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthGuard } from "@/lib/auth/useAuthGuard";
import { getAllProcessingBatchEvaluations, ProcessingBatchEvaluation, getEvaluationResultDisplayNameI18n, getEvaluationResultColor } from "@/lib/api/processingBatchEvaluations";
import { FiEye, FiAlertCircle, FiCheckCircle, FiClock, FiUser, FiCalendar, FiPackage, FiSearch, FiFilter } from "react-icons/fi";
import { useTranslation } from "react-i18next";

export default function FarmerEvaluationsPage() {
  useAuthGuard(["farmer"]);
  const router = useRouter();
  const { t } = useTranslation();

  const [evaluations, setEvaluations] = useState<ProcessingBatchEvaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log("🔍 DEBUG: Fetching evaluations...");

      const data = await getAllProcessingBatchEvaluations();
      console.log("🔍 DEBUG: Evaluations data:", data);

      setEvaluations(data);
    } catch (err: any) {
      console.error("❌ Lỗi fetchData:", err);
      console.error("❌ Error details:", {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data
      });
      setError(t("processing.pages.farmerEvaluation.error"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter evaluations
  const filteredEvaluations = evaluations.filter(evaluation => {
    const matchesSearch = evaluation.batchId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         evaluation.evaluationCode.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === "all" || 
                         evaluation.evaluationResult.toLowerCase() === filterStatus.toLowerCase();
    
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">{t("processing.pages.farmerEvaluation.loading")}</p>
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
            onClick={fetchData}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            {t("processing.pages.farmerEvaluation.retry")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-green-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">{t("processing.pages.farmerEvaluation.title")}</h1>
          <p className="text-gray-600">{t("processing.pages.farmerEvaluation.subtitle")}</p>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder={t("processing.pages.farmerEvaluation.search.placeholder")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>

            {/* Filter */}
            <div className="flex items-center gap-2">
              <FiFilter className="text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="all">{t("processing.pages.farmerEvaluation.filter.all")}</option>
                <option value="pass">{t("processing.pages.farmerEvaluation.filter.pass")}</option>
                <option value="fail">{t("processing.pages.farmerEvaluation.filter.fail")}</option>
                <option value="needsimprovement">{t("processing.pages.farmerEvaluation.filter.needsImprovement")}</option>
                <option value="temporary">{t("processing.pages.farmerEvaluation.filter.temporary")}</option>
                <option value="pending">{t("processing.pages.farmerEvaluation.filter.pending")}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {filteredEvaluations.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t("processing.pages.farmerEvaluation.table.evaluationCode")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t("processing.pages.farmerEvaluation.table.batchId")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t("processing.pages.farmerEvaluation.table.result")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t("processing.pages.farmerEvaluation.table.evaluatedAt")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t("processing.pages.farmerEvaluation.table.actions")}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredEvaluations.map((evaluation) => (
                    <tr key={evaluation.evaluationId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <FiPackage className="text-green-500 mr-2" />
                          <span className="text-sm font-medium text-gray-900">
                            {evaluation.evaluationCode}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
                          {evaluation.batchId}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getEvaluationResultColor(evaluation.evaluationResult)}`}>
                          {getEvaluationResultDisplayNameI18n(evaluation.evaluationResult, t)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <FiCalendar className="text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">
                            {evaluation.evaluatedAt 
                              ? new Date(evaluation.evaluatedAt).toLocaleDateString('vi-VN')
                              : new Date(evaluation.createdAt).toLocaleDateString('vi-VN')
                            }
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => router.push(`/dashboard/farmer/evaluations/${evaluation.batchId}`)}
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                        >
                          <FiEye className="mr-1" />
                          {t("processing.pages.farmerEvaluation.table.viewDetails")}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <FiAlertCircle className="text-gray-400 text-4xl mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm || filterStatus !== "all" ? t("processing.pages.farmerEvaluation.emptyState.noResults") : t("processing.pages.farmerEvaluation.emptyState.noEvaluations")}
              </h3>
              <p className="text-gray-500">
                {searchTerm || filterStatus !== "all" 
                  ? t("processing.pages.farmerEvaluation.emptyState.noResultsHint")
                  : t("processing.pages.farmerEvaluation.emptyState.noEvaluationsHint")
                }
              </p>
            </div>
          )}
        </div>

        {/* Summary Stats */}
        {evaluations.length > 0 && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <FiCheckCircle className="h-8 w-8 text-green-500" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">{t("processing.pages.farmerEvaluation.stats.total")}</p>
                  <p className="text-2xl font-semibold text-gray-900">{evaluations.length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <FiCheckCircle className="h-8 w-8 text-green-500" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">{t("processing.pages.farmerEvaluation.stats.pass")}</p>
                  <p className="text-2xl font-semibold text-green-600">
                    {evaluations.filter(e => e.evaluationResult === 'Pass').length}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <FiAlertCircle className="h-8 w-8 text-red-500" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">{t("processing.pages.farmerEvaluation.stats.fail")}</p>
                  <p className="text-2xl font-semibold text-red-600">
                    {evaluations.filter(e => e.evaluationResult === 'Fail').length}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <FiClock className="h-8 w-8 text-yellow-500" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">{t("processing.pages.farmerEvaluation.stats.pending")}</p>
                  <p className="text-2xl font-semibold text-yellow-600">
                    {evaluations.filter(e => e.evaluationResult === 'Pending').length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
