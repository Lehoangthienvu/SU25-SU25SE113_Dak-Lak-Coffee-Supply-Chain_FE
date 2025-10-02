import api from '@/lib/api/axios';
import { getErrorMessage } from '@/lib/utils';

// ================== TYPES ==================

export type CropSeasonDetail = {
  detailId: string;
  cropSeasonId: string;
  commitmentDetailId: string;
  commitmentDetailCode: string;
  typeName: string;
  expectedHarvestStart: string;
  expectedHarvestEnd: string;
  estimatedYield: number;
  actualYield?: number | null;
  areaAllocated: number;
  plannedQuality: string;
  qualityGrade?: string;
  status: number;
  farmerId: string;
  farmerName: string;
  committedQuantity?: number;
  
  // Crop information - Support both lowercase and uppercase from backend
  cropId?: string;
  cropCode?: string;
  farmName?: string;
  address?: string; // lowercase version
  Address?: string; // uppercase version from backend DTO
  cropArea?: number;
};



// ✅ Tạo vùng trồng – sử dụng commitmentDetailId thay cho coffeeTypeId
export type CropSeasonDetailCreatePayload = {
  cropSeasonId: string;
  commitmentDetailId: string;
  expectedHarvestStart: string;
  expectedHarvestEnd: string;
  areaAllocated: number;
  plannedQuality: string;
};

// ✅ Cập nhật vùng trồng – không thay đổi
export type CropSeasonDetailUpdatePayload = {
  detailId: string;
  commitmentDetailId?: string; // optional nếu không đổi dòng cam kết
  expectedHarvestStart?: string;
  expectedHarvestEnd?: string;
  areaAllocated?: number;
  plannedQuality?: string;
};

// ================== API FUNCTIONS ==================

const baseUrl = '/CropSeasonDetails';

export async function createCropSeasonDetail(
  data: CropSeasonDetailCreatePayload
): Promise<CropSeasonDetail> {
  try {
    const response = await api.post(baseUrl, data);
    return response.data;
  } catch (err) {
    console.error('Lỗi createCropSeasonDetail:', err);
    throw new Error(getErrorMessage(err));
  }
}

export async function updateCropSeasonDetail(
  detailId: string,
  data: CropSeasonDetailUpdatePayload
): Promise<CropSeasonDetail> {
  try {
    const response = await api.put(`${baseUrl}/${detailId}`, data);
    return response.data;
  } catch (err) {
    console.error('Lỗi updateCropSeasonDetail:', err);
    throw new Error(getErrorMessage(err) || 'Cập nhật vùng trồng thất bại');
  }
}

export async function softDeleteCropSeasonDetail(
  detailId: string
): Promise<{ success: boolean }> {
  try {
    await api.patch(`${baseUrl}/soft-delete/${detailId}`); 
    return { success: true };
  } catch (err) {
    console.error('Lỗi softDeleteCropSeasonDetail:', err);
    throw new Error(getErrorMessage(err) || 'Xoá vùng trồng thất bại');
  }
}


export async function getCropSeasonDetailById(
  detailId: string
): Promise<CropSeasonDetail> {
  try {
    const response = await api.get(`${baseUrl}/${detailId}`);
    return response.data;
  } catch (err) {
    console.error('Lỗi getCropSeasonDetailById:', err);
    throw new Error(getErrorMessage(err) || 'Không thể lấy chi tiết vùng trồng');
  }
}

export async function getCropSeasonDetailsByCropSeasonId(
  cropSeasonId: string
): Promise<CropSeasonDetail[]> {
  try {
    // Use GetAll endpoint and filter by cropSeasonId on frontend
    const response = await api.get(`${baseUrl}`);
    
    let allDetails: CropSeasonDetail[] = [];
    
    if (response.data) {
      // Handle ServiceResult format {status, message, data}
      if (response.data.status === 1 && response.data.data) {
        allDetails = response.data.data;
      }
      // Handle direct array format
      else if (Array.isArray(response.data)) {
        allDetails = response.data;
      }
    }
    
    // Filter by cropSeasonId on frontend
    const filteredDetails = allDetails.filter(detail => detail.cropSeasonId === cropSeasonId);
    
    return filteredDetails;
  } catch (err: unknown) {
    console.error('Lỗi getCropSeasonDetailsByCropSeasonId:', err);
    throw new Error(getErrorMessage(err) || 'Không thể lấy danh sách vùng trồng');
  }
}

// Thêm function để lấy crop season details cho farmer hiện tại
export async function getCropSeasonDetailsForCurrentFarmer(): Promise<CropSeasonDetail[]> {
  try {
    const response = await api.get(`${baseUrl}/warehouse-request/available`);
    
    // Backend trả về ServiceResult {status, message, data}
    if (response.data && response.data.status === 1 && response.data.data) {
      return response.data.data;
    } else {
      return [];
    }
  } catch (err: unknown) {
    // Thay vì log ra console, throw error để UI có thể hiển thị
    const errorMessage = getErrorMessage(err) || 'Không thể lấy danh sách vùng trồng';
    throw new Error(errorMessage);
  }
}

// Thêm function để lấy commitment detail information từ commitment chính
export async function getCommitmentDetailInfo(commitmentDetailId: string): Promise<{ coffeeTypeName: string } | null> {
  try {
    // Lấy tất cả commitments để tìm commitment detail
    const response = await api.get('/FarmingCommitment/Farmer');
    const commitments = response.data;
    
    // Tìm commitment detail trong tất cả commitments
    for (const commitment of commitments) {
      if (commitment.farmingCommitmentDetails) {
        const detail = commitment.farmingCommitmentDetails.find(
          (d: { commitmentDetailId?: string; coffeeTypeName?: string }) => d.commitmentDetailId === commitmentDetailId
        );
        if (detail && detail.coffeeTypeName) {
          return { coffeeTypeName: detail.coffeeTypeName };
        }
      }
    }
    
    return null;
  } catch (err) {
    console.error('Lỗi getCommitmentDetailInfo:', err);
    return null;
  }
}


