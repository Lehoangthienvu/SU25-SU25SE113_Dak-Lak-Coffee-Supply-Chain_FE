export interface StageFailureInfo {
  failedOrderIndex: number; // Thêm lại để tương thích với code hiện tại
  failedStageId?: number; // ✅ Nhất quán với backend C# sử dụng int
  failedStageName: string;
  failureDetails: string;
  recommendations: string;
  isFailure: boolean;
}

export interface StageFailureDisplayInfo {
  hasFailure: boolean;
  stageName: string;
  details: string;
  recommendations: string;
  orderIndex: number;
  stageId?: number; // ✅ Nhất quán với backend C# sử dụng int
  rawComments?: string;
  // 🔧 CẢI THIỆN: Thêm properties để hiển thị tiêu chí bị fail
  failedCriteria?: Array<{
    criteriaId: string;
    criteriaName: string;
    actualValue: number;
    expectedValue: string;
    unit: string;
    failureReason?: string;
  }>;
  selectedFailureReasons?: string[];
}

/**
 * Parse thông tin stage failure từ comments của evaluation
 * Format: FAILED_STAGE_ID:1|FAILED_STAGE_NAME:Thu hoạch|DETAILS:Vấn đề|RECOMMENDATIONS:Khuyến nghị
 */
export function parseStageFailureFromComments(comments: string): StageFailureInfo | null {
  if (!comments || !comments.includes('FAILED_STAGE_ID:')) {
    return null;
  }

  try {
    const parts = comments.split('|');
    
    const stageIdPart = parts.find(p => p.startsWith('FAILED_STAGE_ID:'));
    const stageNamePart = parts.find(p => p.startsWith('FAILED_STAGE_NAME:'));
    const detailsPart = parts.find(p => p.startsWith('DETAILS:'));
    const recommendationsPart = parts.find(p => p.startsWith('RECOMMENDATIONS:'));

    if (!stageIdPart) return null;

    const orderIndexStr = stageIdPart.replace('FAILED_STAGE_ID:', '');
    const orderIndex = parseInt(orderIndexStr);
    
    if (isNaN(orderIndex)) return null;

    return {
      failedOrderIndex: orderIndex,
      failedStageId: undefined, // Sẽ được set từ service
      failedStageName: stageNamePart?.replace('FAILED_STAGE_NAME:', '') || '',
      failureDetails: detailsPart?.replace('DETAILS:', '') || '',
      recommendations: recommendationsPart?.replace('RECOMMENDATIONS:', '') || '',
      isFailure: true
    };
  } catch (error) {
    console.error('Error parsing stage failure from comments:', error);
    return null;
  }
}

/**
 * Tạo format comments chuẩn cho failure
 */
export function createFailureComment(orderIndex: number, stageName: string, details: string, recommendations: string): string {
  return `FAILED_STAGE_ID:${orderIndex}|FAILED_STAGE_NAME:${stageName}|DETAILS:${details}|RECOMMENDATIONS:${recommendations}`;
}

/**
 * Kiểm tra xem comments có chứa thông tin failure không
 */
export function isFailureComment(comments: string): boolean {
  return Boolean(comments && comments.includes('FAILED_STAGE_ID:'));
}

/**
 * Lấy thông tin hiển thị cho stage failure
 */
export function getStageFailureDisplayInfo(comments: string): StageFailureDisplayInfo {
  const failureInfo = parseStageFailureFromComments(comments);
  
  if (!failureInfo) {
    return {
      hasFailure: false,
      stageName: '',
      details: '',
      recommendations: '',
      orderIndex: 0,
      stageId: undefined,
      rawComments: comments
    };
  }

  return {
    hasFailure: true,
    stageName: failureInfo.failedStageName,
    details: failureInfo.failureDetails, // Sử dụng failureDetails
    recommendations: failureInfo.recommendations,
    orderIndex: failureInfo.failedOrderIndex,
    stageId: failureInfo.failedStageId,
    rawComments: comments
  };
}

/**
 * Tạo thông tin stage failure từ form data của Expert
 */
export function createStageFailureFromFormData(
  problematicStep: string,
  comments: string,
  recommendations: string
): StageFailureInfo | null {
  // Parse step từ format "Bước X: StageName"
  const stepMatch = problematicStep.match(/Bước\s*(\d+):\s*(.+)/);
  
  if (!stepMatch) {
    return null;
  }

  const orderIndex = parseInt(stepMatch[1]);
  const stageName = stepMatch[2].trim();
  
  if (isNaN(orderIndex)) {
    return null;
  }

  return {
    failedOrderIndex: orderIndex,
    failedStageId: undefined, // Sẽ được set từ service
    failedStageName: stageName,
    failureDetails: comments || 'Tiến trình có vấn đề',
    recommendations: recommendations || 'Cần cải thiện theo hướng dẫn',
    isFailure: true
  };
}

/**
 * Validate stage failure data
 */
export function validateStageFailureData(failureInfo: StageFailureInfo): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!failureInfo.failedStageName || failureInfo.failedStageName.trim() === '') {
    errors.push('Tên stage không được để trống');
  }

  if (failureInfo.failedOrderIndex <= 0) {
    errors.push('OrderIndex phải lớn hơn 0');
  }

  if (!failureInfo.failureDetails || failureInfo.failureDetails.trim() === '') {
    errors.push('Chi tiết vấn đề không được để trống');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Debug helper để log thông tin stage failure
 */
export function debugStageFailure(comments: string, context: string = '') {
  console.log(`🔍 DEBUG STAGE FAILURE ${context}:`);
  console.log(`  - Raw comments: ${comments}`);
  
  const failureInfo = parseStageFailureFromComments(comments);
  if (failureInfo) {
    console.log(`  - Parsed successfully:`);
    console.log(`    - OrderIndex: ${failureInfo.failedOrderIndex}`);
    console.log(`    - StageId: ${failureInfo.failedStageId || 'undefined'}`);
    console.log(`    - StageName: ${failureInfo.failedStageName}`);
    console.log(`    - FailureDetails: ${failureInfo.failureDetails}`);
    console.log(`    - Recommendations: ${failureInfo.recommendations}`);
  } else {
    console.log(`  - Failed to parse - not a failure comment`);
  }
}

/**
 * Tạo StageFailureParser object để tương thích với code cũ
 */
export const StageFailureParser = {
  parseFailureFromComments: parseStageFailureFromComments,
  createFailureComment,
  isFailureComment,
  getStageFailureDisplayInfo,
  createStageFailureFromFormData,
  validateStageFailureData,
  debugStageFailure
};
