import api from "@/lib/api/axios";
import { SeverityLevelEnum } from "../constants/SeverityLevelEnum";

// ========== TYPES ==========

export interface GeneralFarmerReportViewAllDto {
  reportId: string;
  title: string;
  reportedAt: string;
  reportedByName: string;
  isResolved: boolean | null;
}

export interface GeneralFarmerReportViewDetailsDto {
  cropStageCode: string;
  cropStageDescription: string;
  reportId: string;
  title: string;
  description: string;
  severityLevel: number;
  imageUrl?: string;
  videoUrl?: string;
  isResolved: boolean | null;
  reportedAt: string;
  updatedAt: string;
  resolvedAt?: string;
  reportedByName: string;
  cropStageName?: string;
  processingBatchCode?: string;
}

export type ReportType = "Crop" | "Processing";

export interface GeneralFarmerReportCreateDto {
  reportType: ReportType;
  cropProgressId?: string;
  processingProgressId?: string; // Sửa thành ProcessingProgressId để khớp với Backend DTO
  title: string;
  description: string;
  severityLevel: SeverityLevelEnum;
  imageUrl?: string;
  videoUrl?: string;
  // Media files for upload
  photoFiles?: File[];
  videoFiles?: File[];
}

// Interface cho ProcessingBatchProgress - khớp với ProcessingBatchProgress từ Backend
export interface ProcessingBatchProgressForReport {
  progressId: string;
  batchId: string;
  batchCode: string;
  stepIndex: number;
  stageId: number; // ✅ Nhất quán với backend C# sử dụng int
  stageName: string;
  stageDescription: string;
  progressDate: string;
  outputQuantity: number;
  outputUnit: string;
  updatedBy: string;
  photoUrl?: string;
  videoUrl?: string;
  createdAt: string;
  updatedAt: string;
}

// ✅ Lấy danh sách báo cáo (của chính Farmer đang login)
export async function getAllFarmerReports(): Promise<GeneralFarmerReportViewAllDto[]> {
  try {
    const res = await api.get<GeneralFarmerReportViewAllDto[]>("/GeneralFarmerReports");
    return res.data;
  } catch (err) {
    console.error("Lỗi getAllFarmerReports:", err);
    return [];
  }
}

// ✅ Lấy danh sách báo cáo cho BusinessManager (tất cả báo cáo)
export async function getAllFarmerReportsForManager(): Promise<GeneralFarmerReportViewForManagerDto[]> {
  try {
    const res = await api.get<GeneralFarmerReportViewForManagerDto[]>("/GeneralFarmerReports/manager/all");
    return res.data;
  } catch (err) {
    console.error("Lỗi getAllFarmerReportsForManager:", err);
    return [];
  }
}

// Interface mới cho BusinessManager
export interface GeneralFarmerReportViewForManagerDto {
  reportId: string;
  reportCode: string;
  title: string;
  description: string;
  reportType: string;
  severityLevel: number | null;
  reportedAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  reportedByName: string;
  reportedByEmail: string;
  reportedByPhone: string;
  imageUrl: string | null;
  videoUrl: string | null;
  isResolved: boolean | null;
  expertAdviceCount: number;
}

// ✅ Lấy chi tiết 1 báo cáo
export async function getFarmerReportById(reportId: string): Promise<GeneralFarmerReportViewDetailsDto | null> {
  try {
    const res = await api.get<GeneralFarmerReportViewDetailsDto>(`/GeneralFarmerReports/${reportId}`);
    return res.data;
  } catch (err) {
    console.error("Lỗi getFarmerReportById:", err);
    return null;
  }
}

export async function createFarmerReport(
  payload: GeneralFarmerReportCreateDto
): Promise<GeneralFarmerReportViewDetailsDto> {
  
  try {
    console.log("📤 Sending payload to /GeneralFarmerReports");
    
    // Kiểm tra xem có media files không để quyết định content type
    const hasMediaFiles = (payload.photoFiles && payload.photoFiles.length > 0) || 
                         (payload.videoFiles && payload.videoFiles.length > 0);

    let res;
    if (hasMediaFiles) {
      // Có media files - sử dụng FormData
      const formData = new FormData();
      
      // Thêm các trường cơ bản
      formData.append("reportType", payload.reportType);
      if (payload.cropProgressId) {
        formData.append("cropProgressId", payload.cropProgressId);
      }
      if (payload.processingProgressId) {
        formData.append("processingProgressId", payload.processingProgressId);
      }
      formData.append("title", payload.title);
      formData.append("description", payload.description);
      formData.append("severityLevel", payload.severityLevel.toString());
      
      // Thêm media files
      if (payload.photoFiles) {
        payload.photoFiles.forEach(file => formData.append("photoFiles", file));
      }
      if (payload.videoFiles) {
        payload.videoFiles.forEach(file => formData.append("videoFiles", file));
      }
      
      console.log("📤 Sending FormData with media files");
      res = await api.post<GeneralFarmerReportViewDetailsDto>(
        "/GeneralFarmerReports",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
    } else {
      // Không có media files - sử dụng JSON
      console.log("📤 Sending JSON payload:", JSON.stringify(payload, null, 2));
      res = await api.post<GeneralFarmerReportViewDetailsDto>(
        "/GeneralFarmerReports",
        payload
      );
    }

    console.log("📥 Response received:", res);
    console.log("📥 Response status:", res.status);
    console.log("📥 Response data:", res.data);

    if (!res.data || !res.data.reportId) {
      throw new Error("Tạo báo cáo thất bại - Không có reportId trong response.");
    }

    return res.data;
 } catch (err: unknown) {
  console.error("❌ Lỗi createFarmerReport:");
  
  if (err && typeof err === 'object' && 'response' in err) {
    const response = (err as any).response;
    console.error("📦 Response Status:", response?.status);
    console.error("📦 Response StatusText:", response?.statusText);
    console.error("📦 Response Headers:", response?.headers);
    console.error("📦 Response Data:", response?.data);
    console.error("📦 Response Config:", response?.config);
  } else {
    console.error("📦 Error is not an axios error:", err);
    console.error("📦 Error type:", typeof err);
    console.error("📦 Error message:", err instanceof Error ? err.message : 'Unknown error');
  }
  
  throw err;
 }

}


export interface GeneralFarmerReportUpdateDto {
  reportId: string;
  title: string;
  description: string;
  severityLevel: SeverityLevelEnum;
  imageUrl?: string;
  videoUrl?: string;
}

export async function updateFarmerReport(
  payload: GeneralFarmerReportUpdateDto
): Promise<GeneralFarmerReportViewDetailsDto> {
  try {
    const res = await api.put<GeneralFarmerReportViewDetailsDto>(
      `/GeneralFarmerReports/${payload.reportId}`,  // ✅ Đảm bảo đúng URL
      payload
    );
    return res.data;
  } catch (err: unknown) {
    console.error("❌ Lỗi updateFarmerReport:", err);
    throw err;
  }
}

export async function softDeleteFarmerReport(reportId: string): Promise<void> {
  try {
    await api.patch(`/GeneralFarmerReports/soft-delete/${reportId}`); // ✅ Đúng route
  } catch (err) {
    console.error("❌ Lỗi softDeleteFarmerReport:", err);
    throw err;
  }
}


export async function hardDeleteFarmerReport(reportId: string): Promise<void> {
  try {
    await api.delete(`/GeneralFarmerReports/${reportId}`);
  } catch (err) {
    console.error("❌ Lỗi hardDeleteFarmerReport:", err);
    throw err;
  }
}

// ✅ Lấy danh sách ProcessingBatchProgress cho Farmer hiện tại
export async function getProcessingBatchProgressesForCurrentFarmer(): Promise<ProcessingBatchProgressForReport[]> {
  try {
    const res = await api.get<ProcessingBatchProgressForReport[]>("/ProcessingBatchsProgress");
    return res.data || [];
  } catch (err) {
    console.error("Lỗi getProcessingBatchProgressesForCurrentFarmer:", err);
    return [];
  }
}
