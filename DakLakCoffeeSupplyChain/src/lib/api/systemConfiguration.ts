import api from "./axios";

export type SystemConfiguration = {
  name: string;
  description: string;
  minValue: number | null;
  maxValue: number | null;
  unit: string;
  isActive: boolean;
  effectedDateFrom: string;
  effectedDateTo: string | null;
  createdAt: string;
  updatedAt: string;
  targetEntity: string | null;
  targetField: string | null;
  operator: string | null;
  scopeType: string | null;
  scopeId: string | null;
  severity: string | null;
  ruleGroup: string | null;
  versionNo: string | null;
  createdBy: string | null;
  updatedBy: string | null;
};

// ========== PROCESSING BATCH CRITERIA TYPES ==========

export interface ProcessingBatchCriteria {
  id: number;
  name: string;
  description: string;
  minValue: number | null;
  maxValue: number | null;
  unit: string;
  operator: string;
  severity: string; // Hard, Soft
  ruleGroup: string;
  isActive: boolean;
  effectedDateFrom: string;
  effectedDateTo: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
}

export interface CreateProcessingBatchCriteriaDto {
  name: string;
  description: string;
  minValue?: number | null;
  maxValue?: number | null;
  unit: string;
  operator: string;
  severity: string;
  ruleGroup: string;
  isActive?: boolean;
  effectedDateFrom?: string;
  effectedDateTo?: string | null;
}

export interface UpdateProcessingBatchCriteriaDto {
  description?: string;
  minValue?: number | null;
  maxValue?: number | null;
  unit?: string;
  operator?: string;
  severity?: string;
  ruleGroup?: string;
  isActive?: boolean;
  effectedDateFrom?: string;
  effectedDateTo?: string | null;
}

// ========== PAYMENT CONFIGURATION TYPES ==========

// Backend DTOs
export interface PaymentConfigurationViewAllDto {
  configId: string;
  roleName: string;
  feeType: string;
  amount: number;
  minTons?: number | null;
  maxTons?: number | null;
  configName?: string;
  isActive: boolean | null;
  effectiveFrom: string;
  effectiveTo: string | null;
}

export interface PaymentConfigurationViewDetailsDto {
  configId: string;
  roleId: number;
  roleName: string;
  feeType: string;
  amount: number;
  minTons?: number | null;
  maxTons?: number | null;
  configName?: string;
  description: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  createdAt: string;
  updatedAt: string;
  isActive: boolean | null;
}

export interface PaymentConfigurationCreateDto {
  roleId: number;
  feeType: string;
  amount: number;
  minTons?: number | null;
  maxTons?: number | null;
  configName?: string;
  description?: string | null;
  effectiveFrom: string;
  effectiveTo?: string | null;
  isActive?: boolean | null;
}

export interface PaymentConfigurationUpdateDto {
  configId: string;
  roleId: number;
  feeType: string;
  amount: number;
  minTons?: number | null;
  maxTons?: number | null;
  configName?: string;
  description?: string | null;
  effectiveFrom: string;
  effectiveTo?: string | null;
  isActive?: boolean | null;
}

// Frontend types (compatible with backend)
export interface PaymentConfiguration extends PaymentConfigurationViewDetailsDto {
  // Alias for compatibility
  configID: string;
  roleID: number;
}

export interface CreatePaymentConfigurationDto extends PaymentConfigurationCreateDto {
  // Alias for compatibility
  roleID: number;
}

export interface UpdatePaymentConfigurationDto extends PaymentConfigurationUpdateDto {
  // Alias for compatibility
  configID: string;
  roleID: number;
}

// ========== SYSTEM CONFIGURATION APIs ==========

export async function getAllSytemConfiguration(): Promise<SystemConfiguration[]> {
  const response = await api.get("/SystemConfiguration");
  return response.data;
}
export async function getSytemConfigurationByName(name: string): Promise<SystemConfiguration> {
  const response = await api.get(`/SystemConfiguration/${name}`);
  return response.data;
}

// ========== PROCESSING BATCH CRITERIA APIs ==========

/**
 * Lấy tất cả tiêu chí đánh giá chất lượng cho ProcessingBatch
 */
export async function getProcessingBatchCriteria(): Promise<ProcessingBatchCriteria[]> {
  try {
    const response = await api.get("/SystemConfiguration/processing-batch/criteria");

    // Backend trả về trực tiếp data, không có wrapper status
    if (response.data && Array.isArray(response.data)) {
      return response.data;
    } else if (response.data && response.data.length === 0) {
      return [];
    } else {
      throw new Error('Lỗi khi lấy danh sách tiêu chí');
    }
  } catch (error: any) {
    console.error("❌ Lỗi getProcessingBatchCriteria:", error);
    throw new Error(error.response?.data?.message || error.message || 'Lỗi khi lấy danh sách tiêu chí');
  }
}

/**
 * Lấy tiêu chí đánh giá theo tên
 */
export async function getProcessingBatchCriteriaByName(name: string): Promise<ProcessingBatchCriteria | null> {
  try {
    const response = await api.get(`/SystemConfiguration/processing-batch/criteria/${name}`);

    // Backend trả về trực tiếp data, không có wrapper status
    if (response.data && typeof response.data === 'object') {
      return response.data;
    } else {
      return null;
    }
  } catch (error: any) {
    console.error("❌ Lỗi getProcessingBatchCriteriaByName:", error);
    throw new Error(error.response?.data?.message || error.message || 'Lỗi khi lấy tiêu chí');
  }
}

/**
 * Tạo tiêu chí đánh giá mới
 */
export async function createProcessingBatchCriteria(dto: CreateProcessingBatchCriteriaDto): Promise<ProcessingBatchCriteria> {
  try {
    const response = await api.post("/SystemConfiguration/processing-batch/criteria", dto);

    // Backend trả về trực tiếp data cho create
    if (response.data && typeof response.data === 'object') {
      return response.data;
    } else {
      throw new Error('Lỗi khi tạo tiêu chí');
    }
  } catch (error: any) {
    console.error("❌ Lỗi createProcessingBatchCriteria:", error);
    throw new Error(error.response?.data?.message || error.message || 'Lỗi khi tạo tiêu chí');
  }
}

/**
 * Cập nhật tiêu chí đánh giá
 */
export async function updateProcessingBatchCriteria(name: string, dto: UpdateProcessingBatchCriteriaDto): Promise<ProcessingBatchCriteria> {
  try {
    const response = await api.put(`/SystemConfiguration/processing-batch/criteria/${name}`, dto);

    // Backend trả về trực tiếp data cho update
    if (response.data && typeof response.data === 'object') {
      return response.data;
    } else {
      throw new Error('Lỗi khi cập nhật tiêu chí');
    }
  } catch (error: any) {
    console.error("❌ Lỗi updateProcessingBatchCriteria:", error);
    throw new Error(error.response?.data?.message || error.message || 'Lỗi khi cập nhật tiêu chí');
  }
}

/**
 * Xóa tiêu chí đánh giá
 */
export async function deleteProcessingBatchCriteria(name: string): Promise<string> {
  try {
    const response = await api.delete(`/SystemConfiguration/processing-batch/criteria/${name}`);

    // Backend trả về message trực tiếp cho delete
    if (response.data && typeof response.data === 'string') {
      return response.data;
    } else {
      return 'Xóa tiêu chí thành công';
    }
  } catch (error: any) {
    console.error("❌ Lỗi deleteProcessingBatchCriteria:", error);
    throw new Error(error.response?.data?.message || error.message || 'Lỗi khi xóa tiêu chí');
  }
}

/**
 * Kích hoạt tiêu chí đánh giá
 */
export async function activateProcessingBatchCriteria(name: string): Promise<string> {
  try {
    const response = await api.patch(`/SystemConfiguration/processing-batch/criteria/${name}/activate`);

    // Backend trả về message trực tiếp cho activate
    if (response.data && typeof response.data === 'string') {
      return response.data;
    } else {
      return 'Kích hoạt tiêu chí thành công';
    }
  } catch (error: any) {
    console.error("❌ Lỗi activateProcessingBatchCriteria:", error);
    throw new Error(error.response?.data?.message || error.message || 'Lỗi khi kích hoạt tiêu chí');
  }
}

/**
 * Vô hiệu hóa tiêu chí đánh giá
 */
export async function deactivateProcessingBatchCriteria(name: string): Promise<string> {
  try {
    const response = await api.patch(`/SystemConfiguration/processing-batch/criteria/${name}/deactivate`);

    // Backend trả về message trực tiếp cho deactivate
    if (response.data && typeof response.data === 'string') {
      return response.data;
    } else {
      return 'Vô hiệu hóa tiêu chí thành công';
    }
  } catch (error: any) {
    console.error("❌ Lỗi deactivateProcessingBatchCriteria:", error);
    throw new Error(error.response?.data?.message || error.message || 'Lỗi khi vô hiệu hóa tiêu chí');
  }
}

// ========== PAYMENT CONFIGURATION APIs ==========

/**
 * Lấy tất cả cấu hình phí
 */
export async function getPaymentConfigurations(): Promise<PaymentConfigurationViewAllDto[]> {
  try {
    const response = await api.get("/PaymentConfigurations");

    if (response.data && Array.isArray(response.data)) {
      return response.data;
    } else if (response.data && response.data.length === 0) {
      return [];
    } else {
      throw new Error('Lỗi khi lấy danh sách cấu hình phí');
    }
  } catch (error: any) {
    console.error("❌ Lỗi getPaymentConfigurations:", error);
    throw new Error(error.response?.data?.message || error.message || 'Lỗi khi lấy danh sách cấu hình phí');
  }
}

/**
 * Lấy cấu hình phí theo ID
 */
export async function getPaymentConfigurationById(configID: string): Promise<PaymentConfigurationViewDetailsDto | null> {
  try {
    const response = await api.get(`/PaymentConfigurations/${configID}`);

    if (response.data && typeof response.data === 'object') {
      return response.data;
    } else {
      return null;
    }
  } catch (error: any) {
    console.error("❌ Lỗi getPaymentConfigurationById:", error);
    throw new Error(error.response?.data?.message || error.message || 'Lỗi khi lấy cấu hình phí');
  }
}

/**
 * Tạo cấu hình phí mới
 */
export async function createPaymentConfiguration(dto: PaymentConfigurationCreateDto): Promise<PaymentConfigurationViewDetailsDto> {
  try {
    const response = await api.post("/PaymentConfigurations", dto);

    if (response.data && typeof response.data === 'object') {
      return response.data;
    } else {
      throw new Error('Lỗi khi tạo cấu hình phí');
    }
  } catch (error: any) {
    console.error("❌ Lỗi createPaymentConfiguration:", error);
    throw new Error(error.response?.data?.message || error.message || 'Lỗi khi tạo cấu hình phí');
  }
}

/**
 * Cập nhật cấu hình phí
 */
export async function updatePaymentConfiguration(configID: string, dto: PaymentConfigurationUpdateDto): Promise<PaymentConfigurationViewDetailsDto> {
  try {
    const response = await api.put(`/PaymentConfigurations/${configID}`, dto);

    if (response.data && typeof response.data === 'object') {
      return response.data;
    } else {
      throw new Error('Lỗi khi cập nhật cấu hình phí');
    }
  } catch (error: any) {
    console.error("❌ Lỗi updatePaymentConfiguration:", error);
    throw new Error(error.response?.data?.message || error.message || 'Lỗi khi cập nhật cấu hình phí');
  }
}

/**
 * Xóa cấu hình phí (hard delete)
 */
export async function deletePaymentConfiguration(configID: string): Promise<string> {
  try {
    const response = await api.delete(`/PaymentConfigurations/${configID}`);

    if (response.data && typeof response.data === 'string') {
      return response.data;
    } else {
      return 'Xóa cấu hình phí thành công';
    }
  } catch (error: any) {
    console.error("❌ Lỗi deletePaymentConfiguration:", error);
    throw new Error(error.response?.data?.message || error.message || 'Lỗi khi xóa cấu hình phí');
  }
}

/**
 * Xóa mềm cấu hình phí
 */
export async function softDeletePaymentConfiguration(configID: string): Promise<string> {
  try {
    const response = await api.patch(`/PaymentConfigurations/soft-delete/${configID}`);

    if (response.data && typeof response.data === 'string') {
      return response.data;
    } else {
      return 'Xóa mềm cấu hình phí thành công';
    }
  } catch (error: any) {
    console.error("❌ Lỗi softDeletePaymentConfiguration:", error);
    throw new Error(error.response?.data?.message || error.message || 'Lỗi khi xóa mềm cấu hình phí');
  }
}
