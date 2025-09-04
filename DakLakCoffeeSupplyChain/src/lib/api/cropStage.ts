import api from "@/lib/api/axios";

export type CropStage = {
  stageId: number;
  stageCode: string;
  stageName: string;
  description?: string;
  orderIndex: number;
};

export type CropStageCreateRequest = {
  stageCode: string;
  stageName: string;
  description?: string;
  orderIndex: number;
};

export type CropStageUpdateRequest = {
  stageId: number;
  stageCode: string;
  stageName: string;
  description?: string;
  orderIndex: number;
};

// Lấy tất cả giai đoạn
export async function getCropStages(): Promise<CropStage[]> {
  const response = await api.get("/CropStages");
  return response.data.map((s: CropStage) => ({
    ...s,
    // Ensure stageCode is always a string and trim whitespace
    stageCode: String(s.stageCode || "").trim().toLowerCase(),
  }));
}

// Lấy giai đoạn theo ID
export async function getCropStageById(stageId: number): Promise<CropStage> {
  const response = await api.get(`/CropStages/${stageId}`);
  return {
    ...response.data,
    stageCode: String(response.data.stageCode || "").trim().toLowerCase(),
  };
}

// Tạo giai đoạn mới
export async function createCropStage(data: CropStageCreateRequest): Promise<CropStage> {
  const response = await api.post("/CropStages", data);
  return {
    ...response.data,
    stageCode: String(response.data.stageCode || "").trim().toLowerCase(),
  };
}

// Cập nhật giai đoạn
export async function updateCropStage(stageId: number, data: CropStageUpdateRequest): Promise<CropStage> {
  const response = await api.put(`/CropStages/${stageId}`, data);
  return {
    ...response.data,
    stageCode: String(response.data.stageCode || "").trim().toLowerCase(),
  };
}

// Xóa cứng giai đoạn (chỉ Admin)
export async function deleteCropStage(stageId: number): Promise<void> {
  await api.delete(`/CropStages/${stageId}`);
}

// Xóa mềm giai đoạn (Admin + BusinessManager)
export async function softDeleteCropStage(stageId: number): Promise<void> {
  await api.patch(`/CropStages/${stageId}/soft-delete`);
}
