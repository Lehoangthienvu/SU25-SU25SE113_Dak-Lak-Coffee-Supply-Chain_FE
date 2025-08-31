import api from "./axios";

export interface AgriculturalExpert {
  expertId: string;
  expertCode: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  expertiseArea: string;
  qualifications: string;
  yearsOfExperience?: number;
  affiliatedOrganization: string;
  bio: string;
  rating?: number;
  isVerified?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateExpertRequest {
  expertiseArea: string;
  qualifications: string;
  yearsOfExperience?: number;
  affiliatedOrganization: string;
  bio?: string;
  rating?: number;
}

export interface UpdateExpertRequest {
  expertId: string;
  expertiseArea: string;
  qualifications: string;
  yearsOfExperience?: number;
  affiliatedOrganization: string;
  bio?: string;
  rating?: number;
  isVerified?: boolean;
}

// Lấy danh sách tất cả chuyên gia
export const getAllExperts = async (): Promise<AgriculturalExpert[]> => {
  try {
    console.log("🔍 DEBUG: Calling getAllExperts API...");
    console.log("🔍 DEBUG: API endpoint: /AgriculturalExperts");
    
    const response = await api.get("/AgriculturalExperts");
    console.log("✅ API Response received:", response);
    console.log("✅ API Response data:", response.data);
    
    // Kiểm tra nếu response có cấu trúc ServiceResult
    if (response.data && typeof response.data === 'object' && 'data' in response.data) {
      console.log("✅ ServiceResult format detected, extracting data...");
      return response.data.data || [];
    }
    
    // Nếu response trực tiếp là array
    if (Array.isArray(response.data)) {
      console.log("✅ Direct array format detected");
      return response.data;
    }
    
    console.warn("⚠️ Unexpected API response format:", response.data);
    return [];
  } catch (error) {
    console.error("❌ Error fetching experts:", error);
    console.error("❌ Error details:", {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      name: error instanceof Error ? error.name : 'Unknown error type'
    });
    throw error;
  }
};

// Lấy chuyên gia theo ID
export const getExpertById = async (expertId: string): Promise<AgriculturalExpert> => {
  try {
    const response = await api.get(`/AgriculturalExperts/${expertId}`);
    console.log("Get Expert Response:", response.data); // Debug log
    
    // Kiểm tra nếu response có cấu trúc ServiceResult
    if (response.data && typeof response.data === 'object' && 'data' in response.data) {
      return response.data.data;
    }
    
    // Nếu response trực tiếp là object
    if (response.data && typeof response.data === 'object') {
      return response.data;
    }
    
    throw new Error("Invalid response format");
  } catch (error) {
    console.error("Error fetching expert:", error);
    throw error;
  }
};

// Lấy chuyên gia theo UserId
export const getExpertByUserId = async (userId: string): Promise<AgriculturalExpert> => {
  try {
    const response = await api.get(`/AgriculturalExperts/user/${userId}`);
    
    if (response.data && typeof response.data === 'object' && 'data' in response.data) {
      return response.data.data;
    }
    
    if (response.data && typeof response.data === 'object') {
      return response.data;
    }
    
    throw new Error("Invalid response format");
  } catch (error) {
    console.error("Error fetching expert by userId:", error);
    throw error;
  }
};

// Lấy danh sách chuyên gia đã xác thực
export const getVerifiedExperts = async (): Promise<AgriculturalExpert[]> => {
  try {
    const response = await api.get("/AgriculturalExperts/verified");
    
    if (response.data && typeof response.data === 'object' && 'data' in response.data) {
      return response.data.data || [];
    }
    
    if (Array.isArray(response.data)) {
      return response.data;
    }
    
    return [];
  } catch (error) {
    console.error("Error fetching verified experts:", error);
    throw error;
  }
};

// Cập nhật trạng thái xác thực chuyên gia
export const updateExpertVerification = async (
  expertId: string,
  isVerified: boolean
): Promise<AgriculturalExpert> => {
  try {
    const response = await api.patch(`/AgriculturalExperts/${expertId}/verify`, isVerified);
    
    if (response.data && typeof response.data === 'object' && 'data' in response.data) {
      return response.data.data;
    }
    
    return response.data;
  } catch (error) {
    console.error("Error updating expert verification:", error);
    throw error;
  }
};

// Tạo mới chuyên gia
export const createExpert = async (
  expertData: CreateExpertRequest,
  userId: string
): Promise<AgriculturalExpert> => {
  try {
    const response = await api.post(`/AgriculturalExperts?userId=${userId}`, expertData);
    
    if (response.data && typeof response.data === 'object' && 'data' in response.data) {
      return response.data.data;
    }
    
    if (response.data && typeof response.data === 'object') {
      return response.data;
    }
    
    throw new Error("Invalid response format");
  } catch (error) {
    console.error("Error creating expert:", error);
    throw error;
  }
};

// Cập nhật chuyên gia
export const updateExpert = async (
  expertId: string,
  expertData: UpdateExpertRequest
): Promise<AgriculturalExpert> => {
  try {
    const response = await api.put(`/AgriculturalExperts/${expertId}`, expertData);
    
    if (response.data && typeof response.data === 'object' && 'data' in response.data) {
      return response.data.data;
    }
    
    if (response.data && typeof response.data === 'object') {
      return response.data;
    }
    
    throw new Error("Invalid response format");
  } catch (error) {
    console.error("Error updating expert:", error);
    throw error;
  }
};

// Xóa cứng chuyên gia
export const deleteExpert = async (expertId: string): Promise<void> => {
  try {
    await api.delete(`/AgriculturalExperts/${expertId}`);
  } catch (error) {
    console.error("Error deleting expert:", error);
    throw error;
  }
};

// Xóa mềm chuyên gia
export const softDeleteExpert = async (expertId: string): Promise<void> => {
  try {
    await api.patch(`/AgriculturalExperts/soft-delete/${expertId}`);
  } catch (error) {
    console.error("Error soft deleting expert:", error);
    throw error;
  }
};
