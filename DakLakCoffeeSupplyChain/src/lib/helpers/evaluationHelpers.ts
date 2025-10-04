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
 * Format mới: "Giai đoạn cần cập nhật: Thu hoạch (Thứ tự: 1), Phơi (Thứ tự: 2), Xay vỏ (Thứ tự: 3)"
 */
export function parseStageFailureFromComments(comments: string): StageFailureInfo | null {
  console.log('🔍 DEBUG parseStageFailureFromComments: Starting with comments:', comments);
  
  if (!comments) {
    console.log('🔍 DEBUG parseStageFailureFromComments: No comments provided');
    return null;
  }

  try {
    // Pattern 0: "Giai đoạn cần cập nhật: StageId: 9" (Format mới từ backend)
    const stageIdPattern = /Giai đoạn cần cập nhật:\s*StageId:\s*(\d+)/;
    console.log('🔍 DEBUG parseStageFailureFromComments: Testing StageId pattern:', stageIdPattern);
    const stageIdMatch = comments.match(stageIdPattern);
    console.log('🔍 DEBUG parseStageFailureFromComments: StageId match result:', stageIdMatch);
    
    if (stageIdMatch) {
      const stageId = parseInt(stageIdMatch[1]);
      console.log('🔍 DEBUG parseStageFailureFromComments: Found StageId pattern:', stageId);
      
      // Tìm stage name từ comments
      const stageNamePattern = /Phơi khô|Thu hoạch|Xát vỏ|Lên men|Rửa sạch|Xay vỏ trấu/;
      const stageNameMatch = comments.match(stageNamePattern);
      const stageName = stageNameMatch ? stageNameMatch[0] : `Stage ${stageId}`;
      
      // Map StageId thành OrderIndex dựa trên thông tin từ debug logs backend
      // StageId 9 = "Phơi khô" = OrderIndex 5
      let orderIndex = stageId;
      if (stageId === 9) orderIndex = 5; // Phơi khô
      else if (stageId === 10) orderIndex = 6; // Xay vỏ trấu
      else if (stageId === 5) orderIndex = 1; // Thu hoạch
      else if (stageId === 6) orderIndex = 2; // Xát vỏ
      else if (stageId === 7) orderIndex = 3; // Lên men
      else if (stageId === 8) orderIndex = 4; // Rửa sạch
      
      console.log('🔍 DEBUG parseStageFailureFromComments: Mapped StageId', stageId, 'to OrderIndex', orderIndex);
      
      return {
        failedOrderIndex: orderIndex, // Sử dụng OrderIndex đã map
        failedStageId: stageId,
        failedStageName: stageName,
        failureDetails: `Cần cập nhật giai đoạn: ${stageName} (StageId: ${stageId}, OrderIndex: ${orderIndex})`,
        recommendations: 'Vui lòng cập nhật lại giai đoạn trên để đạt tiêu chuẩn chất lượng',
        isFailure: true
      };
    }

    // Pattern 1: "Giai đoạn cần cập nhật: Thu hoạch (Thứ tự: 1), Phơi (Thứ tự: 2), Xay vỏ (Thứ tự: 3)"
    const stagePattern = /Giai đoạn cần cập nhật:\s*(.+?)(?:\n|$)/;
    const stageMatch = comments.match(stagePattern);
    
    if (stageMatch) {
      const stageText = stageMatch[1];
      // Parse từng stage: "Thu hoạch (Thứ tự: 1), Phơi (Thứ tự: 2), Xay vỏ (Thứ tự: 3)"
      const individualStagePattern = /([^(]+)\s*\(Thứ tự:\s*(\d+)\)/g;
      const stages: Array<{name: string, order: number}> = [];
      
      let match;
      while ((match = individualStagePattern.exec(stageText)) !== null) {
        stages.push({
          name: match[1].trim(),
          order: parseInt(match[2])
        });
      }
      
      if (stages.length > 0) {
        // Lấy stage đầu tiên làm stage chính
        const firstStage = stages[0];
        
        return {
          failedOrderIndex: firstStage.order,
          failedStageId: undefined,
          failedStageName: firstStage.name,
          failureDetails: `Cần cập nhật các giai đoạn: ${stages.map(s => `${s.name} (Thứ tự: ${s.order})`).join(', ')}`,
          recommendations: 'Vui lòng cập nhật lại các giai đoạn trên để đạt tiêu chuẩn chất lượng',
          isFailure: true
        };
      }
    }

    // Pattern 2: "Tiến trình có vấn đề: Thu hoạch (Thứ tự: 1), Phơi (Thứ tự: 2), Xay vỏ (Thứ tự: 3)"
    const problemPattern = /Tiến trình có vấn đề:\s*(.+?)(?:\n|$)/;
    const problemMatch = comments.match(problemPattern);
    
    if (problemMatch) {
      const stageText = problemMatch[1];
      const individualStagePattern = /([^(]+)\s*\(Thứ tự:\s*(\d+)\)/g;
      const stages: Array<{name: string, order: number}> = [];
      
      let match;
      while ((match = individualStagePattern.exec(stageText)) !== null) {
        stages.push({
          name: match[1].trim(),
          order: parseInt(match[2])
        });
      }
      
      if (stages.length > 0) {
        const firstStage = stages[0];
        
        return {
          failedOrderIndex: firstStage.order,
          failedStageId: undefined,
          failedStageName: firstStage.name,
          failureDetails: `Tiến trình có vấn đề: ${stages.map(s => `${s.name} (Thứ tự: ${s.order})`).join(', ')}`,
          recommendations: 'Cần cải thiện công đoạn này theo khuyến nghị của chuyên gia',
          isFailure: true
        };
      }
    }

    // Pattern 3: Format cũ "FAILED_STAGE_ID:1|FAILED_STAGE_NAME:Thu hoạch|DETAILS:Vấn đề|RECOMMENDATIONS:Khuyến nghị"
    if (comments.includes('FAILED_STAGE_ID:')) {
      const parts = comments.split('|');
      
      const stageIdPart = parts.find(p => p.startsWith('FAILED_STAGE_ID:'));
      const stageNamePart = parts.find(p => p.startsWith('FAILED_STAGE_NAME:'));
      const detailsPart = parts.find(p => p.startsWith('DETAILS:'));
      const recommendationsPart = parts.find(p => p.startsWith('RECOMMENDATIONS:'));

      if (stageIdPart) {
        const orderIndexStr = stageIdPart.replace('FAILED_STAGE_ID:', '');
        const orderIndex = parseInt(orderIndexStr);
        
        if (!isNaN(orderIndex)) {
          return {
            failedOrderIndex: orderIndex,
            failedStageId: undefined,
            failedStageName: stageNamePart?.replace('FAILED_STAGE_NAME:', '') || '',
            failureDetails: detailsPart?.replace('DETAILS:', '') || '',
            recommendations: recommendationsPart?.replace('RECOMMENDATIONS:', '') || '',
            isFailure: true
          };
        }
      }
    }

    return null;
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
    console.log(`  - Checking patterns:`);
    console.log(`    - Contains 'Giai đoạn cần cập nhật:': ${comments.includes('Giai đoạn cần cập nhật:')}`);
    console.log(`    - Contains 'StageId:': ${comments.includes('StageId:')}`);
    console.log(`    - Contains 'Tiến trình có vấn đề:': ${comments.includes('Tiến trình có vấn đề:')}`);
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
