import api from "./axios";

export interface Farmer {
  farmerId: string;
  farmerCode: string;
  userId: string;
  farmLocation: string;
  farmerName: string;
  isVerified: boolean | null;
}

export interface FarmerDetails {
  farmerId: string;
  farmerCode: string;
  userId: string;
  farmerName: string;
  farmLocation: string;
  farmSize?: number;
  certificationStatus?: string;
  certificationUrl?: string;
  isVerified?: boolean;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
}

// Lấy danh sách tất cả farmers
export const getAllFarmers = async (): Promise<Farmer[]> => {
  try {
    const response = await api.get("/Farmer");
    
    if (response.data && typeof response.data === 'object' && 'data' in response.data) {
      return response.data.data || [];
    }
    
    if (Array.isArray(response.data)) {
      return response.data;
    }
    
    return [];
  } catch (error) {
    console.error("Error fetching farmers:", error);
    throw error;
  }
};

// Lấy thông tin chi tiết farmer theo ID
export const getFarmerById = async (farmerId: string): Promise<FarmerDetails> => {
  try {
    const response = await api.get(`/Farmer/${farmerId}`);
    
    if (response.data && typeof response.data === 'object' && 'data' in response.data) {
      return response.data.data;
    }
    
    return response.data;
  } catch (error) {
    console.error("Error fetching farmer:", error);
    throw error;
  }
};

// Xóa mềm farmer
export const softDeleteFarmer = async (farmerId: string): Promise<void> => {
  try {
    await api.delete(`/Farmer/${farmerId}`);
  } catch (error) {
    console.error("Error deleting farmer:", error);
    throw error;
  }
};

// Cập nhật trạng thái xác thực farmer
export const updateFarmerVerification = async (
  farmerId: string,
  isVerified: boolean
): Promise<FarmerDetails> => {
  try {
    await api.patch(`/Farmer/${farmerId}/verify`, {
      isVerified
    });
    
    // Refresh farmer data after verification
    const updatedFarmer = await getFarmerById(farmerId);
    return updatedFarmer;
  } catch (error) {
    console.error("Error updating farmer verification:", error);
    throw error;
  }
};
