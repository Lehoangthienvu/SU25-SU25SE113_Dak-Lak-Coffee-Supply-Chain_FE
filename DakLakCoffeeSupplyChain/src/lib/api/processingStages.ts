import api from "./axios";

export interface ProcessingStage {
  stageId: number; 
  stageCode: string;
  description: string;
  stageName: string;
  orderIndex: number;
  methodId: number;
  isRequired: boolean;
  isDeleted: boolean;
}

export async function getProcessingStagesByMethodId(methodId: number): Promise<ProcessingStage[]> {
  try {
    console.log("🔍 DEBUG: Calling GET /ProcessingStages/method/{methodId} API...");
    console.log("🔍 DEBUG: URL:", `/ProcessingStages/method/${methodId}`);
    const res = await api.get(`/ProcessingStages/method/${methodId}`);
    console.log("🔍 DEBUG: GET /ProcessingStages response:", res);
    console.log("🔍 DEBUG: Response status:", res.status);
    console.log("🔍 DEBUG: Response data:", res.data);
    return res.data || [];
  } catch (err: any) {
    console.error("❌ Lỗi getProcessingStagesByMethodId:", err);
    console.error("❌ Error response:", err?.response?.data);
    console.error("❌ Error status:", err?.response?.status);
    return [];
  }
}

export async function getAllProcessingStages(): Promise<ProcessingStage[]> {
  try {
    console.log("🔍 DEBUG: Calling GET /ProcessingStages API...");
    const res = await api.get("/ProcessingStages");
    console.log("🔍 DEBUG: GET /ProcessingStages response:", res);
    return res.data || [];
  } catch (err) {
    console.error("❌ Lỗi getAllProcessingStages:", err);
    return [];
  }
}

export async function createProcessingStages(
  data: Omit<ProcessingStage, "stageId">
) {
  try {
    const res = await api.post("/ProcessingStages", data);
    return res.data;
  } catch (err) {
    console.error("Lỗi createProcessingStages:", err);
    throw err;
  }
}

export async function updateProcessingStages(
  id: string,
  data: ProcessingStage
) {
  try {
    const res = await api.put(`/ProcessingStages/${id}`, data);
    return res.data;
  } catch (err) {
    console.error("Lỗi updateProcessingStages:", err);
    throw err;
  }
}

export async function deleteProcessingStages(id: string) {
  try {
    await api.delete(`/ProcessingStages/${id}`);
  } catch (err) {
    console.error("Lỗi deleteProcessingStages:", err);
    throw err;
  }
}
