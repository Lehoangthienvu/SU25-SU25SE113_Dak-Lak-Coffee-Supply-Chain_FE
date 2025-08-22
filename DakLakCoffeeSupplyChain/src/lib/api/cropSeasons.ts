import api from "./axios";
import { CropSeasonStatusValue, CropSeasonStatusValueToNumber } from "../constants/cropSeasonStatus";

// Define types locally since they're not exported from a types file
interface CropSeason {
  id: string;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  status: CropSeasonStatusValue;
  // Add other properties as needed
}

interface CropSeasonListItem {
  id: string;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  status: CropSeasonStatusValue;
  // Add other properties as needed
}

// Define response types for better type safety
interface PaginatedResponse<T> {
  data: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface ErrorResponse {
  response?: {
    status?: number;
    data?: unknown;
  };
  message?: string;
  code?: string;
}

interface BackendResponse {
  message?: string;
  code?: number | string;
  data?: unknown;
}

export interface CropSeasonDetail {
  detailId: string;
  coffeeTypeId: string;
  typeName: string;
  areaAllocated: number;
  expectedHarvestStart: string;
  expectedHarvestEnd: string;
  estimatedYield: number;
  actualYield: number | null;
  plannedQuality: string;
  qualityGrade: string;
  status: string;
  farmerId: string;
  farmerName: string;
}

export interface CropSeasonUpdatePayload {
  cropSeasonId: string;
  seasonName: string;
  startDate: string;
  endDate: string;   
  note?: string | null;
}


interface ServiceResult<T = unknown> {
  code: number | string;
  message: string;
  data: T | null;
}


// Lấy tất cả mùa vụ (dành cho Admin hoặc Manager)
export async function getAllCropSeasons(): Promise<CropSeasonListItem[]> {
  try {
    // Tối ưu: Sử dụng cache để tránh gọi API nhiều lần
    const res = await api.get<CropSeasonListItem[] | PaginatedResponse<CropSeasonListItem>>("/CropSeasons", {
      // Tối ưu: Thêm timeout để tránh chờ quá lâu
      timeout: 10000,
      // Tối ưu: Sử dụng cache headers
      headers: {
        'Cache-Control': 'max-age=300' // Cache 5 phút
      }
    });
    
    // Kiểm tra response data và xử lý cả 2 format
    if (res.data) {
      // Format mới từ backend với pagination
      if (typeof res.data === 'object' && 'data' in res.data && Array.isArray((res.data as PaginatedResponse<CropSeasonListItem>).data)) {
        return (res.data as PaginatedResponse<CropSeasonListItem>).data;
      }
      // Format cũ trực tiếp là array
      else if (Array.isArray(res.data)) {
        return res.data;
      }
    }
    
    console.warn("Response data không đúng format:", res.data);
    return [];
  } catch (err) {
    console.error("Lỗi getAllCropSeasons:", err);
    
    // Log chi tiết lỗi để debug
    if (typeof err === 'object' && err !== null) {
      const errorObj = err as ErrorResponse;
      if (errorObj.response) {
        console.error("Response status:", errorObj.response.status);
        console.error("Response data:", errorObj.response.data);
      }
      if (errorObj.message) {
        console.error("Error message:", errorObj.message);
      }
    }
    
    return [];
  }
}


function buildStatusFilter(raw?: string): string | undefined {
  if (!raw) return;

  const s = raw.trim();

  // Map label VN → số enum
  const vnToNumber: Record<string, number> = {
    "Đang hoạt động": 0,
    "Tạm dừng": 1,
    "Hoàn thành": 2,
    "Đã hủy": 3,
  };

  // Map value EN → số enum
  const enToNumber: Record<string, number> = {
    Active: 0,
    Paused: 1,
    Completed: 2,
    Cancelled: 3,
  };

  // Nếu có map trung tâm của bạn:
  if (s in CropSeasonStatusValueToNumber) {
    return `Status eq ${CropSeasonStatusValueToNumber[s as CropSeasonStatusValue]}`;
  }

  if (vnToNumber[s] !== undefined) return `Status eq ${vnToNumber[s]}`;
  if (enToNumber[s] !== undefined) return `Status eq ${enToNumber[s]}`;
  if (/^\d+$/.test(s)) return `Status eq ${parseInt(s, 10)}`; // fallback nếu truyền số trực tiếp

  console.warn("Không map được status, bỏ qua filter:", s);
  return;
}


export async function getCropSeasonsForCurrentUser(params: {
  search?: string;
  status?: string;   // có thể truyền 'Active' | 'Đang hoạt động' | '0'
  page?: number;
  pageSize?: number;
}): Promise<CropSeasonListItem[]> {
  const { search, status, page = 1, pageSize = 6 } = params ?? {};
  const q: Record<string, string | number> = {};

  // Tối ưu: Sử dụng query parameters đơn giản thay vì OData
  if (search && search.trim()) {
    q["search"] = search.trim();
  }

  if (status) {
    const statusFilter = buildStatusFilter(status);
    if (statusFilter) {
      q["status"] = statusFilter;
    }
  }

  q["page"] = page;
  q["pageSize"] = pageSize;

  // Thêm retry logic và timeout tối ưu
  const maxRetries = 2;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Tối ưu: Sử dụng timeout ngắn hơn và cache headers
      const res = await api.get<CropSeasonListItem[] | PaginatedResponse<CropSeasonListItem>>("/CropSeasons", { 
        params: q,
        timeout: 15000, // Tăng timeout lên 15 giây
        headers: {
          'Cache-Control': 'max-age=300'
        }
      });
      
      // Kiểm tra response data và xử lý cả 2 format
      if (res.data) {
        // Format mới từ backend với pagination
        if (typeof res.data === 'object' && 'data' in res.data && Array.isArray((res.data as PaginatedResponse<CropSeasonListItem>).data)) {
          return (res.data as PaginatedResponse<CropSeasonListItem>).data;
        }
        // Format cũ trực tiếp là array
        else if (Array.isArray(res.data)) {
          return res.data;
        }
      }
      
      console.warn("Response data không đúng format:", res.data);
      return [];
    } catch (err: unknown) {
      lastError = err;
      
      // Kiểm tra nếu là timeout error
      if (typeof err === 'object' && err !== null) {
        const errorObj = err as ErrorResponse;
        if (errorObj.message?.includes('mất quá nhiều thời gian') || errorObj.code === 'ECONNABORTED') {
          console.warn(`Lần thử ${attempt}/${maxRetries}: Timeout khi lấy crop seasons, đang thử lại...`);
          
          // Nếu còn lần thử, chờ một chút rồi thử lại
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Tăng delay theo số lần thử
            continue;
          }
        }
      }
      
      // Nếu không phải timeout hoặc đã hết lần thử, break
      break;
    }
  }

  // Tối ưu: Cải thiện error handling
  console.error("Lỗi getCropSeasonsForCurrentUser sau khi thử lại:", lastError);
  
  // Log chi tiết lỗi để debug
  if (typeof lastError === 'object' && lastError !== null) {
    const errorObj = lastError as ErrorResponse;
    if (errorObj.response) {
      console.error("Response status:", errorObj.response.status);
      console.error("Response data:", errorObj.response.data);
    }
    if (errorObj.message) {
      console.error("Error message:", errorObj.message);
    }
  }
  
  // Trả về mảng rỗng thay vì throw error để tránh crash UI
  return [];
}

export async function getCropSeasonById(id: string): Promise<CropSeason | null> {
  try {
    const res = await api.get<CropSeason>(`/CropSeasons/${id}`);
    return res.data;
  } catch (err) {
    console.error("Lỗi getCropSeasonById:", err);
    return null;
  }
}

export async function deleteCropSeasonById(id: string): Promise<{ code: number; message: string }> {
  try {
    const res = await api.patch(`/CropSeasons/soft-delete/${id}`); 
    return {
      code: 200,
      message: res.data || 'Xoá thành công',
    };
  } catch (err: unknown) {
    console.error("Chi tiết lỗi deleteCropSeasonById:", err);
    
    let message = 'Xoá mùa vụ thất bại.';
    
    // Type guard để kiểm tra response
    const isResponseError = (error: unknown): error is ErrorResponse => {
      return typeof error === 'object' && error !== null && 'response' in error;
    };
    
    const isErrorWithMessage = (error: unknown): error is { message: string } => {
      return typeof error === 'object' && error !== null && 'message' in error && typeof (error as { message: unknown }).message === 'string';
    };
    
    if (isResponseError(err)) {
      // Xử lý lỗi từ backend - ưu tiên ServiceResult.message
      if (err.response?.data && typeof err.response.data === 'object' && 'message' in err.response.data) {
        message = (err.response.data as BackendResponse).message || 'Xoá mùa vụ thất bại.';
      } 
      // Xử lý lỗi từ backend - trường hợp response.data là string
      else if (err.response?.data && typeof err.response.data === 'string') {
        message = err.response.data;
      }
      // Xử lý lỗi HTTP status
      else if (err.response?.status) {
        switch (err.response.status) {
          case 400:
            message = "Dữ liệu không hợp lệ";
            break;
          case 401:
            message = "Không có quyền truy cập";
            break;
          case 404:
            message = "Không tìm thấy mùa vụ";
            break;
          case 500:
            message = "Lỗi server";
            break;
          default:
            message = `Lỗi HTTP ${err.response.status}`;
            break;
        }
      }
    }
    // Xử lý lỗi từ Error object
    else if (isErrorWithMessage(err)) {
      message = err.message;
    }
    
    return {
      code: 400,
      message,
    };
  }
}

export async function updateCropSeason(
  id: string,
  data: CropSeasonUpdatePayload
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await api.put(`/CropSeasons/${id}`, data);
    
    // Kiểm tra response từ backend
    if (res.data) {
      // Nếu có message lỗi từ backend (validation error)
      if (res.data.code === 400 || res.data.code === "400") {
        return { success: false, error: res.data.message || "Cập nhật mùa vụ thất bại." };
      }
      
      // Nếu thành công
      if (res.data.code === 200 || res.data.code === "200") {
        return { success: true };
      }
    }
    
    return { success: true };
  } catch (err: unknown) {
    console.error("Chi tiết lỗi updateCropSeason:", err);
    
    let message = 'Lỗi không xác định';
    
    // Type guard để kiểm tra response
    const isResponseError = (error: unknown): error is ErrorResponse => {
      return typeof error === 'object' && error !== null && 'response' in error;
    };
    
    const isErrorWithMessage = (error: unknown): error is { message: string } => {
      return typeof error === 'object' && error !== null && 'message' in error && typeof (error as { message: unknown }).message === 'string';
    };
    
    if (isResponseError(err)) {
      // Xử lý lỗi từ backend - ưu tiên ServiceResult.message
      if (err.response?.data && typeof err.response.data === 'object' && 'message' in err.response.data) {
        message = (err.response.data as BackendResponse).message || 'Lỗi không xác định';
      } 
      // Xử lý lỗi từ backend - trường hợp response.data là string
      else if (err.response?.data && typeof err.response.data === 'string') {
        message = err.response.data;
      }
      // Xử lý lỗi từ backend - trường hợp response.data là object có message
      else if (err.response?.data && typeof err.response.data === 'object' && 'message' in err.response.data) {
        message = (err.response.data as BackendResponse).message || 'Lỗi không xác định';
      }
      // Xử lý lỗi HTTP status
      else if (err.response?.status) {
        switch (err.response.status) {
          case 400:
            message = "Dữ liệu không hợp lệ";
            break;
          case 401:
            message = "Không có quyền truy cập";
            break;
          case 404:
            message = "Không tìm thấy mùa vụ";
            break;
          case 500:
            message = "Lỗi server";
            break;
          default:
            message = `Lỗi HTTP ${err.response.status}`;
            break;
        }
      }
    }
    // Xử lý lỗi từ Error object
    else if (isErrorWithMessage(err)) {
      message = err.message;
    }
    
    return { success: false, error: message };
  }
}
export interface CropSeasonCreatePayload {
  commitmentId: string;
  seasonName: string;
  startDate: string;
  endDate: string;
  note?: string;
}


export async function createCropSeason(data: CropSeasonCreatePayload): Promise<ServiceResult> {
  try {
    console.log("Gửi request tạo mùa vụ:", data);
    
    const res = await api.post<ServiceResult>("/CropSeasons", data);
    
    console.log("Response từ backend:", res.data);
    console.log("Response status:", res.status);

    // Kiểm tra response từ backend
    if (res.data) {
      console.log("Response data type:", typeof res.data);
      console.log("Response data keys:", Object.keys(res.data));
      
      // Nếu có message lỗi từ backend (validation error)
      if (res.data.code === -1 || res.data.code === "-1" || res.data.code === 400 || res.data.code === "400") {
        console.log("Backend trả về lỗi:", res.data);
        throw new Error(res.data.message || "Tạo mùa vụ thất bại.");
      }
      
      // Nếu thành công (backend trả về code = 1)
      if (res.data.code === 1 || res.data.code === "1") {
        console.log("Backend trả về thành công:", res.data);
        return res.data;
      }
      
      // Nếu có data nhưng code không phải 1, vẫn coi là thành công
      if (res.data.data) {
        console.log("Backend trả về có data, coi như thành công:", res.data);
        return res.data;
      }
      
      // Nếu response có vẻ là CropSeasonViewDetailsDto trực tiếp (trường hợp cũ)
      const responseData = res.data as unknown as Record<string, unknown>;
      if (responseData.cropSeasonId || responseData.seasonName) {
        console.log("Backend trả về CropSeasonViewDetailsDto trực tiếp, coi như thành công:", res.data);
        return { code: 1, message: "Tạo mùa vụ thành công", data: res.data };
      }
      
      console.log("Backend trả về code không xác định:", res.data.code);
      console.log("Backend trả về data:", res.data.data);
    }

    // Nếu không có res.data, kiểm tra res.status
    if (res.status >= 200 && res.status < 300) {
      console.log("HTTP status thành công, coi như thành công");
      return { code: 1, message: "Tạo mùa vụ thành công", data: null };
    }

    // Fallback: Nếu response có vẻ thành công nhưng không match format nào, vẫn coi là thành công
    console.log("Fallback: Response không match format chuẩn, nhưng coi như thành công");
    return { code: 1, message: "Tạo mùa vụ thành công", data: res.data || null };
  } catch (err: unknown) {
    console.error("Chi tiết lỗi createCropSeason:", err);
    console.error("Error type:", typeof err);
    
    let message = 'Tạo mùa vụ thất bại';
    
    // Type guard để kiểm tra response
    const isResponseError = (error: unknown): error is ErrorResponse => {
      return typeof error === 'object' && error !== null && 'response' in error;
    };
    
    const isErrorWithMessage = (error: unknown): error is { message: string } => {
      return typeof error === 'object' && error !== null && 'message' in error && typeof (error as { message: unknown }).message === 'string';
    };
    
    if (isResponseError(err)) {
      // Xử lý lỗi từ backend - ưu tiên ServiceResult.message
      if (err.response?.data && typeof err.response.data === 'object' && 'message' in err.response.data) {
        message = (err.response.data as BackendResponse).message || 'Tạo mùa vụ thất bại';
      } 
      // Xử lý lỗi từ backend - trường hợp response.data là string
      else if (err.response?.data && typeof err.response.data === 'string') {
        message = err.response.data;
      }
      // Xử lý lỗi từ backend - trường hợp response.data là object có message
      else if (err.response?.data && typeof err.response.data === 'object' && 'message' in err.response.data) {
        message = (err.response.data as BackendResponse).message || 'Tạo mùa vụ thất bại';
      }
      // Xử lý lỗi HTTP status
      else if (err.response?.status) {
        switch (err.response.status) {
          case 400:
            message = "Dữ liệu không hợp lệ";
            break;
          case 401:
            message = "Không có quyền truy cập";
            break;
          case 500:
            message = "Lỗi server";
            break;
          default:
            message = `Lỗi HTTP ${err.response.status}`;
            break;
        }
      }
    }
    // Xử lý lỗi từ Error object
    else if (isErrorWithMessage(err)) {
      message = err.message;
    }
    
    // Debug: Log response để hiểu rõ vấn đề
    if (isResponseError(err)) {
      console.log("Response data:", err.response?.data);
      console.log("Response status:", err.response?.status);
    }
    
    throw new Error(message);
  }
}


