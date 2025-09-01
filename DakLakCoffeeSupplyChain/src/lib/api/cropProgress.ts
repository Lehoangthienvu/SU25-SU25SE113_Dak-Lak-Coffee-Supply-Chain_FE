import api from "@/lib/api/axios";

// =====================
// TYPE DEFINITIONS
// =====================

export type CropProgress = {
  progressId: string;
  cropSeasonDetailId: string;
  stageId: number;
  stageName: string;
  stageCode: string;
  progressDate?: string;
  note: string;
  photoUrl: string;
  videoUrl: string;
  stepIndex?: number;
  actualYield?: number;
};

export type CropProgressCreateRequest = {
  cropSeasonDetailId: string;
  stageId: number;
  progressDate: string;
  actualYield?: number;
  notes?: string;
  mediaFiles?: File[];
};

export type CropProgressUpdateRequest = {
  progressId: string;
  cropSeasonDetailId: string;
  stageId: number;
  stageDescription: string;
  progressDate?: string;
  photoUrl?: string; // Optional - backend will preserve existing if not provided
  videoUrl?: string; // Optional - backend will preserve existing if not provided
  note?: string;
  stepIndex?: number;
  actualYield?: number;
};

export type CropProgressViewAllDto = {
  progressId: string;
  cropSeasonDetailId: string;
  stageId: number;
  stepIndex?: number;
  stageName: string;
  stageCode: string;
  stageDescription: string;
  progressDate?: string;
  note: string;
  photoUrl: string;
  videoUrl: string;
  actualYield?: number;
  updatedBy?: string;
  updatedByName?: string;
  createdAt?: string;
  updatedAt?: string;
  cropSeasonName?: string;
  cropSeasonDetailName?: string;
};

export type CropProgressViewDetailsDto = {
  progressId: string;
  cropSeasonDetailId: string;
  updatedBy?: string;
  stageId: number;
  stageName: string;
  stageCode: string;
  stageDescription: string;
  actualYield?: number;
  progressDate?: string;
  note: string;
  photoUrl: string;
  videoUrl: string;
  updatedByName: string;
  stepIndex?: number;
  createdAt: string;
  updatedAt: string;
  cropSeasonName?: string;
  cropSeasonDetailName?: string;
  farmerName?: string;
  cropName?: string;
  location?: string;
  status?: string;
  stageOrderIndex?: number;
  isFinalStage?: boolean;
};

// =====================
// GET ALL
// =====================

export async function getAllCropProgresses(): Promise<CropProgressViewAllDto[]> {
  const response = await api.get("/CropProgresses");
  return response.data;
}

// ✅ Lấy tất cả crop progress của user hiện tại (fallback khi không có detailId)
export async function getAllCropProgressesForCurrentUser(): Promise<CropProgressViewAllDto[]> {
  try {
    const response = await api.get(`/CropProgresses`);
    return response.data || [];
  } catch (error: unknown) {
    console.error("Lỗi getAllCropProgressesForCurrentUser:", error);
    if (typeof error === 'object' && error !== null && 'response' in error) {
      const response = (error as { response?: { status?: number } }).response;
      if (response?.status === 404) {
        return [];
      }
    }
    return [];
  }
}

// =====================
// GET BY DETAIL
// =====================

export async function getCropProgressesByDetailId(id: string): Promise<CropProgressViewAllDto[]> {
  try {
    const response = await api.get(`/CropProgresses/by-detail/${id}`);
    return response.data.progresses || [];
  } catch (error: unknown) {
    if (typeof error === 'object' && error !== null && 'response' in error) {
      const response = (error as { response?: { status?: number } }).response;
      if (response?.status === 404) {
        return [];
      }
    }
    throw error;
  }
}

// =====================
// GET BY ID
// =====================

export async function getCropProgressById(id: string): Promise<CropProgressViewDetailsDto> {
  const response = await api.get(`/CropProgresses/${id}`);
  return response.data;
}

// =====================
// CREATE
// =====================

export async function createCropProgress(data: CropProgressCreateRequest): Promise<CropProgressViewDetailsDto> {
  try {
    console.log('Creating crop progress:', data);
    
    const formData = new FormData();
    formData.append("cropSeasonDetailId", data.cropSeasonDetailId);
    formData.append("stageId", data.stageId.toString());
    formData.append("progressDate", data.progressDate);
    
    if (data.actualYield !== undefined) {
      formData.append("actualYield", data.actualYield.toString());
    }
    
    if (data.notes) {
      formData.append("notes", data.notes);
    }
    
    if (data.mediaFiles && data.mediaFiles.length > 0) {
      data.mediaFiles.forEach((file) => {
        formData.append(`mediaFiles`, file);
      });
    }

    const response = await api.post("/CropProgresses", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    
    console.log('Create response:', response.data);
    return response.data;
  } catch (error: unknown) {
    console.error('Create crop progress error:', error);
    
    if (typeof error === 'object' && error !== null && 'response' in error) {
      const response = (error as { response?: { status?: number; data?: { message?: string; errors?: Record<string, string[]>; title?: string } } }).response;
      console.error('Error response:', response);
      
      if (response?.data) {
        // Handle validation errors from backend
        if (response.data.errors && typeof response.data.errors === 'object') {
          const errorMessages = Object.values(response.data.errors).flat();
          if (errorMessages.length > 0) {
            throw new Error(errorMessages.join(', '));
          }
        }
        
        // Handle general error message
        if (response.data.message) {
          throw new Error(response.data.message);
        }
        
        // Handle title if available
        if (response.data.title) {
          throw new Error(response.data.title);
        }
      }
    }
    
    throw error;
  }
}

// =====================
// UPDATE
// =====================

export async function updateCropProgress(progressId: string, data: CropProgressUpdateRequest): Promise<CropProgressViewDetailsDto> {
  try {
    console.log('Updating crop progress:', { progressId, data });
    
    const response = await api.put(`/CropProgresses/${progressId}`, data);
    
    console.log('Update response:', response.data);
    return response.data;
  } catch (error: unknown) {
    console.error('Update crop progress error:', error);
    
    if (typeof error === 'object' && error !== null && 'response' in error) {
      const response = (error as { response?: { status?: number; data?: { message?: string; errors?: Record<string, string[]>; title?: string } } }).response;
      console.error('Error response:', response);
      
      if (response?.data) {
        // Handle validation errors from backend
        if (response.data.errors && typeof response.data.errors === 'object') {
          const errorMessages = Object.values(response.data.errors).flat();
          if (errorMessages.length > 0) {
            throw new Error(errorMessages.join(', '));
          }
        }
        
        // Handle general error message
        if (response.data.message) {
          throw new Error(response.data.message);
        }
        
        // Handle title if available
        if (response.data.title) {
          throw new Error(response.data.title);
        }
      }
    }
    
    throw error;
  }
}

// =====================
// DELETE
// =====================

export async function deleteCropProgress(progressId: string): Promise<void> {
  await api.patch(`/CropProgresses/soft-delete/${progressId}`);
}

// =====================
// HARD DELETE
// =====================

export async function hardDeleteCropProgress(progressId: string): Promise<void> {
  await api.delete(`/CropProgresses/${progressId}/hard-delete`);
}