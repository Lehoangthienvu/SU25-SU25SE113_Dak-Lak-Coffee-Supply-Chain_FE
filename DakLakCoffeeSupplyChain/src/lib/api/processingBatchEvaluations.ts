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

// 🔧 MỚI: Interface cho thông tin retry
export interface FailedStagesInfo {
  failedStages: string[];
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

// ================== RETRY FAILURE INFO INTERFACES ==================

export interface EvaluationFailureInfo {
  batchId: string;
  evaluationId: string;
  failedAt: string;
  comments: string;
  failedStage?: {
    stageId: number;
    stageName: string;
    orderIndex: number;
    lastStepIndex: number;
  };
  completedStages: Array<{
    stageId: number;
    stageName: string;
    orderIndex: number;
    stepIndex: number;
    outputQuantity: number;
    outputUnit: string;
    progressDate: string;
  }>;
  note: string;
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

// 🔧 MỚI: API để lấy thông tin về các stage cần cập nhật khi retry
export async function getFailedStagesForBatch(batchId: string): Promise<FailedStagesInfo> {
  try {
    const res = await api.get(`/Evaluations/failed-stages/${batchId}`);
    return res.data || { failedStages: [] };
  } catch (err) {
    console.error("❌ Lỗi getFailedStagesForBatch:", err);
    return { failedStages: [] };
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
    
    // 🔧 CẢI THIỆN: Kiểm tra response data structure trước khi kiểm tra HTTP status
    if (!res.data) {
      console.error("❌ ERROR: No response data received");
      throw new Error("Không nhận được dữ liệu phản hồi từ máy chủ");
    }
    
    console.log("🔍 DEBUG: Response data structure:", {
      hasStatus: 'status' in res.data,
      hasMessage: 'message' in res.data,
      hasData: 'data' in res.data,
      hasWorkflow: 'workflow' in res.data,
      hasEvaluationId: 'evaluationId' in res.data,
      responseKeys: Object.keys(res.data),
      httpStatus: res.status,
      fullResponseData: res.data
    });
    
    // 🔧 CẢI THIỆN: Backend có thể trả về nhiều format khác nhau
    // Format 1: {status: 1, message: '...', data: {...}}
    // Format 2: {evaluationId: '...', status: '...'}
    // Format 3: Trực tiếp data object
    // Format 4: EvaluationWorkflowResponse {data: ProcessingBatchEvaluation, message: string, workflow: {...}}
    
    // 🔧 CẢI THIỆN: Nếu có status field, kiểm tra nó
    if (res.data.status !== undefined) {
      if (res.data.status !== 1 && res.data.status !== 'Success' && res.data.status !== 'success') {
        console.error("❌ ERROR: Response data status indicates failure:", res.data.status);
        throw new Error(res.data.message || "Tạo đánh giá thất bại theo phản hồi từ máy chủ");
      }
    }
    
    // 🔧 CẢI THIỆN: Nếu có message field và chứa từ khóa lỗi
    if (res.data.message && typeof res.data.message === 'string') {
      const lowerMessage = res.data.message.toLowerCase();
      if (lowerMessage.includes('thất bại') || lowerMessage.includes('lỗi') || lowerMessage.includes('fail')) {
        console.error("❌ ERROR: Response message indicates failure:", res.data.message);
        throw new Error(res.data.message);
      }
    }
    
    console.log("🔍 DEBUG: Full response data:", {
      status: res.status,
      statusText: res.statusText,
      data: res.data,
      hasData: !!res.data.data,
      hasWorkflow: !!res.data.workflow,
      hasEvaluationId: !!res.data.evaluationId,
      message: res.data.message,
      messageType: typeof res.data.message
    });
    
    // 🔧 CẢI THIỆN: Kiểm tra nếu là EvaluationWorkflowResponse format
    if (res.data.data && res.data.workflow) {
      console.log("✅ SUCCESS: Valid EvaluationWorkflowResponse format detected");
    }
    
    // 🔧 CẢI THIỆN: Nếu backend xử lý thành công (có data hoặc workflow), coi như thành công
    // ngay cả khi HTTP status là 400 (có thể do validation warning nhưng vẫn xử lý được)
    if (res.data.data || res.data.workflow || res.data.evaluationId) {
      console.log("✅ SUCCESS: Backend processed evaluation successfully despite HTTP status:", res.status);
      return res.data;
    }
    
    // 🔧 CẢI THIỆN: Kiểm tra thêm các dấu hiệu thành công khác
    if (res.data.message && (
      res.data.message.toLowerCase().includes('thành công') || 
      res.data.message.toLowerCase().includes('success') ||
      res.data.message.toLowerCase().includes('đã tạo') ||
      res.data.message.toLowerCase().includes('đã gửi')
    )) {
      console.log("✅ SUCCESS: Backend message indicates success:", res.data.message);
      return res.data;
    }
    
    // 🔧 CẢI THIỆN: Kiểm tra HTTP status chỉ khi không có dấu hiệu thành công từ data
    if (res.status !== 200 && res.status !== 201) {
      console.error("❌ ERROR: HTTP status not successful and no success indicators in data:", res.status);
      throw new Error(`HTTP Error: ${res.status} - ${res.statusText}`);
    }
    
    console.log("✅ SUCCESS: Evaluation created successfully");
    return res.data;
  } catch (err: any) {
    console.error("❌ Lỗi createProcessingBatchEvaluation:", err);
    console.error("❌ Error details:", {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
      isAxiosError: err.isAxiosError
    });
    
    // 🔧 CẢI THIỆN: Xử lý lỗi chi tiết hơn
    if (err.response?.status === 400) {
      throw new Error("Dữ liệu đánh giá không hợp lệ. Vui lòng kiểm tra lại thông tin.");
    } else if (err.response?.status === 500) {
      throw new Error("Lỗi máy chủ. Vui lòng thử lại sau.");
    } else if (err.response?.data?.message) {
      throw new Error(err.response.data.message);
    } else {
      throw new Error(err.message || "Tạo đánh giá thất bại.");
    }
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

export function getEvaluationResultDisplayNameI18n(result: string, t: (key: string) => string): string {
  switch (result) {
    case EVALUATION_RESULTS.PASS:
      return t("processing.pages.farmerEvaluationDetail.evaluationResults.pass");
    case EVALUATION_RESULTS.FAIL:
      return t("processing.pages.farmerEvaluationDetail.evaluationResults.fail");
    case EVALUATION_RESULTS.NEEDS_IMPROVEMENT:
      return t("processing.pages.farmerEvaluationDetail.evaluationResults.needsImprovement");
    case EVALUATION_RESULTS.TEMPORARY:
      return t("processing.pages.farmerEvaluationDetail.evaluationResults.temporary");
    case EVALUATION_RESULTS.PENDING:
      return t("processing.pages.farmerEvaluationDetail.evaluationResults.pending");
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

// ================== RETRY FAILURE INFO APIs ==================

/**
 * Lấy thông tin failure và stages cần retry khi batch bị đánh giá FAIL
 */
export async function getFailureInfo(batchId: string): Promise<EvaluationFailureInfo | null> {
  try {
    const res = await api.get(`/evaluations/failure-info/${batchId}`);
    console.log('🔍 DEBUG: Failure info response:', res.data);
    
    if (res.data?.status === 'SUCCESS') {
      return res.data.data;
    } else if (res.data?.status === 'WARNING_NO_DATA') {
      console.log('⚠️ No failure info found for batch:', batchId);
      return null;
    } else {
      console.error('❌ Error response from failure info API:', res.data);
      return null;
    }
  } catch (err) {
    console.error("❌ Lỗi getFailureInfo:", err);
    return null;
  }
}
