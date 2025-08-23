import api from "./axios";

// Interface dựa trên EvaluationViewDto từ BE
export interface ProcessingBatchEvaluation {
  evaluationId: string;
  evaluationCode: string;
  batchId: string;
  evaluatedBy?: string;
  evaluationResult: string;
  comments?: string;
  detailedFeedback?: string;
  problematicSteps?: string[];
  recommendations?: string;
  evaluatedAt?: string;
  createdAt: string;
  updatedAt: string;
  expertName?: string; // Tên của expert đánh giá
}

// Interface dựa trên EvaluationCreateDto từ BE
export interface CreateEvaluationDto {
  BatchId: string; // Backend expect PascalCase
  EvaluationResult: string; // Backend expect PascalCase
  Comments?: string; // Backend expect PascalCase
  DetailedFeedback?: string; // Backend expect PascalCase
  ProblematicSteps?: string[]; // Backend expect PascalCase
  Recommendations?: string; // Backend expect PascalCase
  EvaluatedAt?: string; // Backend expect PascalCase
  RequestReason?: string; // Lý do yêu cầu đánh giá
  AdditionalNotes?: string; // Ghi chú bổ sung
}

// Interface dựa trên EvaluationUpdateDto từ BE
export interface UpdateEvaluationDto {
  evaluationResult: string;
  comments?: string;
  detailedFeedback?: string;
  problematicSteps?: string[];
  recommendations?: string;
  evaluatedAt?: string;
}

// Interface cho response workflow
export interface EvaluationWorkflowResponse {
  data: ProcessingBatchEvaluation;
  message: string;
  workflow: {
    batchStatusUpdated: string;
  };
}

// ================== EVALUATION CRITERIA INTERFACES ==================

export interface EvaluationCriteria {
  criteriaId: string;
  criteriaName: string;
  criteriaType: string; // Physical, Chemical, Visual, Quality
  minValue?: number;
  maxValue?: number;
  targetValue?: number;
  unit: string;
  weight: number;
  isRequired: boolean;
  description: string;
}

export interface FailureReason {
  reasonId: string;
  reasonCode: string;
  reasonName: string;
  category: string; // Quality, Process, Equipment, Safety
  severityLevel: number;
  description: string;
}

export interface EvaluateCriteriaRequest {
  criteria: EvaluationCriteria;
  actualValue: number;
}

export interface EvaluateCriteriaResponse {
  criteria: EvaluationCriteria;
  actualValue: number;
  result: string;
  isPass: boolean;
}

export interface CalculateScoreRequest {
  criteriaResults: Array<{
    criteria: EvaluationCriteria;
    result: string;
  }>;
}

export interface CalculateScoreResponse {
  overallScore: number;
  totalCriteria: number;
  passedCriteria: number;
  failedCriteria: number;
}

export interface CreateFailureCommentRequest {
  orderIndex: number;
  stageName: string;
  criteriaResults: Array<{
    criteria: EvaluationCriteria;
    result: string;
  }>;
  selectedReasons?: string[];
}

export interface CreateFailureCommentResponse {
  failureComment: string;
  orderIndex: number;
  stageName: string;
  totalCriteria: number;
  failedCriteria: number;
}

// ================== GET ALL EVALUATIONS ==================
export async function getAllProcessingBatchEvaluations(): Promise<ProcessingBatchEvaluation[]> {
  try {
    console.log("🔍 DEBUG: Calling GET /Evaluations API...");
    const res = await api.get("/Evaluations");
    console.log("🔍 DEBUG: GET /Evaluations response:", res);
    console.log("🔍 DEBUG: Response data:", res.data);
    console.log("🔍 DEBUG: Response data type:", typeof res.data);
    console.log("🔍 DEBUG: Response data length:", Array.isArray(res.data) ? res.data.length : "Not an array");
    return res.data || [];
  } catch (err) {
    console.error("❌ Lỗi getAllProcessingBatchEvaluations:", err);
    return [];
  }
}

// ================== GET EVALUATIONS BY BATCH ==================
export async function getEvaluationsByBatch(batchId: string): Promise<ProcessingBatchEvaluation[]> {
  try {
    const res = await api.get(`/Evaluations/by-batch/${batchId}`);
    return res.data || [];
  } catch (err) {
    console.error("❌ Lỗi getEvaluationsByBatch:", err);
    return [];
  }
}

// ================== GET EVALUATION SUMMARY BY BATCH ==================
export async function getEvaluationSummaryByBatch(batchId: string): Promise<any> {
  try {
    const res = await api.get(`/Evaluations/summary/${batchId}`);
    return res.data;
  } catch (err) {
    console.error("❌ Lỗi getEvaluationSummaryByBatch:", err);
    return null;
  }
}

// ================== CREATE EVALUATION ==================
export async function createProcessingBatchEvaluation(
  data: CreateEvaluationDto
): Promise<EvaluationWorkflowResponse | null> {
  try {
    console.log("🔍 DEBUG: Creating evaluation with data:", data);
    const res = await api.post("/Evaluations", data);
    console.log("🔍 DEBUG: Create evaluation response:", res);
    return res.data;
  } catch (err: any) {
    console.error("❌ Lỗi createProcessingBatchEvaluation:", err);
    console.error("❌ Error details:", {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data
    });
    
    // Throw error để component có thể handle
    throw new Error(err.response?.data || err.message || "Tạo đánh giá thất bại.");
  }
}

// ================== UPDATE EVALUATION ==================
export async function updateProcessingBatchEvaluation(
  evaluationId: string,
  data: UpdateEvaluationDto
): Promise<EvaluationWorkflowResponse | null> {
  try {
    const res = await api.put(`/Evaluations/${evaluationId}`, data);
    return res.data;
  } catch (err) {
    console.error("❌ Lỗi updateProcessingBatchEvaluation:", err);
    return null;
  }
}

// ================== DELETE EVALUATION ==================
export async function deleteProcessingBatchEvaluation(evaluationId: string): Promise<boolean> {
  try {
    await api.delete(`/Evaluations/${evaluationId}`);
    return true;
  } catch (err) {
    console.error("❌ Lỗi deleteProcessingBatchEvaluation:", err);
    return false;
  }
}

// ================== GET EVALUATION BY ID ==================
export async function getProcessingBatchEvaluationById(evaluationId: string): Promise<ProcessingBatchEvaluation | null> {
  try {
    const res = await api.get(`/Evaluations/${evaluationId}`);
    return res.data;
  } catch (err) {
    console.error("❌ Lỗi getProcessingBatchEvaluationById:", err);
    return null;
  }
}

// ================== CONSTANTS ==================
export const EVALUATION_RESULTS = {
  PASS: "Pass",
  FAIL: "Fail", 
  NEEDS_IMPROVEMENT: "NeedsImprovement",
  TEMPORARY: "Temporary",
  PENDING: "Pending"
} as const;

export type EvaluationResult = typeof EVALUATION_RESULTS[keyof typeof EVALUATION_RESULTS];

// ================== UTILITY FUNCTIONS ==================
export function getEvaluationResultDisplayName(result: string): string {
  switch (result) {
    case EVALUATION_RESULTS.PASS:
      return "Đạt";
    case EVALUATION_RESULTS.FAIL:
      return "Không đạt";
    case EVALUATION_RESULTS.NEEDS_IMPROVEMENT:
      return "Cần cải thiện";
    case EVALUATION_RESULTS.TEMPORARY:
      return "Tạm thời";
    default:
      return result;
  }
}

export function getEvaluationResultColor(result: string): string {
  switch (result) {
    case EVALUATION_RESULTS.PASS:
      return "text-green-600 bg-green-100";
    case EVALUATION_RESULTS.FAIL:
      return "text-red-600 bg-red-100";
    case EVALUATION_RESULTS.NEEDS_IMPROVEMENT:
      return "text-yellow-600 bg-yellow-100";
    case EVALUATION_RESULTS.TEMPORARY:
      return "text-blue-600 bg-blue-100";
    default:
      return "text-gray-600 bg-gray-100";
  }
}

// ================== EVALUATION CRITERIA APIs ==================

/**
 * Lấy tiêu chí đánh giá cho stage cụ thể
 */
export async function getEvaluationCriteriaForStage(stageCode: string): Promise<EvaluationCriteria[]> {
  try {
    const res = await api.get(`/Evaluations/criteria/${stageCode}`);
    console.log('🔍 DEBUG: API response structure:', res.data);
    // Backend trả về {status: 1, message: '...', data: Array}
    return res.data?.data || [];
  } catch (err) {
    console.error("❌ Lỗi getEvaluationCriteriaForStage:", err);
    return [];
  }
}

/**
 * Lấy tiêu chí đánh giá cho stage cụ thể (sử dụng stageId)
 */
export async function getEvaluationCriteriaForStageById(stageId: number): Promise<EvaluationCriteria[]> {
  try {
    const res = await api.get(`/Evaluations/criteria-by-id/${stageId}`);
    console.log('🔍 DEBUG: API response structure for stageId:', res.data);
    // Backend trả về {status: 1, message: '...', data: Array}
    return res.data?.data || [];
  } catch (err) {
    console.error("❌ Lỗi getEvaluationCriteriaForStageById:", err);
    return [];
  }
}

/**
 * Lấy lý do không đạt cho stage cụ thể
 */
export async function getFailureReasonsForStage(stageCode: string): Promise<FailureReason[]> {
  try {
    const res = await api.get(`/Evaluations/failure-reasons/${stageCode}`);
    console.log('🔍 DEBUG: API response structure:', res.data);
    // Backend trả về {status: 1, message: '...', data: Array}
    return res.data?.data || [];
  } catch (err) {
    console.error("❌ Lỗi getFailureReasonsForStage:", err);
    return [];
  }
}

/**
 * Lấy tất cả tiêu chí đánh giá cho tất cả stages
 */
export async function getAllEvaluationCriteria(): Promise<Record<string, EvaluationCriteria[]>> {
  try {
    const res = await api.get("/Evaluations/all-criteria");
    return res.data?.data || {};
  } catch (err) {
    console.error("❌ Lỗi getAllEvaluationCriteria:", err);
    return {};
  }
}

/**
 * Lấy tất cả lý do không đạt cho tất cả stages
 */
export async function getAllFailureReasons(): Promise<Record<string, FailureReason[]>> {
  try {
    const res = await api.get("/Evaluations/all-failure-reasons");
    return res.data?.data || {};
  } catch (err) {
    console.error("❌ Lỗi getAllFailureReasons:", err);
    return {};
  }
}

/**
 * Đánh giá tiêu chí dựa trên giá trị thực tế
 */
export async function evaluateCriteria(request: EvaluateCriteriaRequest): Promise<EvaluateCriteriaResponse | null> {
  try {
    const res = await api.post("/Evaluations/evaluate-criteria", request);
    return res.data?.data || null;
  } catch (err) {
    console.error("❌ Lỗi evaluateCriteria:", err);
    return null;
  }
}

/**
 * Tính điểm đánh giá tổng hợp
 */
export async function calculateOverallScore(request: CalculateScoreRequest): Promise<CalculateScoreResponse | null> {
  try {
    const res = await api.post("/Evaluations/calculate-score", request);
    return res.data?.data || null;
  } catch (err) {
    console.error("❌ Lỗi calculateOverallScore:", err);
    return null;
  }
}

/**
 * Tạo failure comment từ đánh giá tiêu chí
 */
export async function createFailureComment(request: CreateFailureCommentRequest): Promise<CreateFailureCommentResponse | null> {
  try {
    const res = await api.post("/Evaluations/create-failure-comment", request);
    return res.data?.data || null;
  } catch (err) {
    console.error("❌ Lỗi createFailureComment:", err);
    return null;
  }
}
