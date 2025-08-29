import api from "./axios";

export interface CreateWarehouseOutboundRequestInput {
  warehouseId: string;
  inventoryId: string;
  requestedQuantity: number;
  unit: string;
  purpose?: string;
  reason?: string;
  orderItemId?: string;
}

export interface ServiceResult<T> {
  status: number;
  message: string;
  data: T;
}

export async function createWarehouseOutboundRequest(
  input: CreateWarehouseOutboundRequestInput
): Promise<string> {
  try {
    const response = await api.post("/WarehouseOutboundRequests", input);
    const result = response.data;

    // ✅ CẢI THIỆN: Kiểm tra response status và hiển thị lỗi chi tiết
    if (result.status !== 1) {
      const errorMessage = result.message || "Gửi yêu cầu thất bại";
      console.error('❌ Create outbound request error:', {
        status: result.status,
        message: result.message,
        data: result.data,
        fullResponse: result
      });
      throw new Error(errorMessage);
    }

    return result.message || "Gửi yêu cầu thành công";
  } catch (error: any) {
    // ✅ CẢI THIỆN: Xử lý lỗi chi tiết từ backend
    let errorMessage = "Gửi yêu cầu thất bại";
    
    if (error.response?.data) {
      // Lỗi từ backend có response data
      if (error.response.data.message) {
        errorMessage = error.response.data.message;
      } else if (typeof error.response.data === 'string') {
        errorMessage = error.response.data;
      } else if (error.response.data.errors) {
        // Validation errors
        const validationErrors = Object.values(error.response.data.errors).flat();
        errorMessage = validationErrors.join(', ');
      } else if (error.response.data.status !== undefined && error.response.data.status !== 1) {
        // ServiceResult format từ backend
        errorMessage = error.response.data.message || "Gửi yêu cầu thất bại";
      }
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    console.error('❌ Create outbound request error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      fullError: error
    });
    
    throw new Error(errorMessage);
  }
}

export async function getAllOutboundRequests(): Promise<ServiceResult<any[]>> {
  try {
    const response = await api.get("/WarehouseOutboundRequests/all");
    const result = response.data;
    
    if (result.status !== 1) {
      throw new Error(result.message || "Lỗi tải danh sách");
    }

    return result;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || error.message || "Lỗi tải danh sách");
  }
}

export async function getOutboundRequestById(id: string): Promise<ServiceResult<any>> {
  try {
    const response = await api.get(`/WarehouseOutboundRequests/${id}`);
    const result = response.data;
    
    if (result.status !== 1) {
      throw new Error(result.message || "Không tìm thấy yêu cầu");
    }

    return result;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || error.message || "Không tìm thấy yêu cầu");
  }
}

export async function acceptOutboundRequest(id: string): Promise<ServiceResult<any>> {
  const response = await api.put(`/WarehouseOutboundRequests/${id}/accept`);
  return response.data;
}

export async function cancelOutboundRequest(id: string): Promise<ServiceResult<any>> {
  const response = await api.put(`/WarehouseOutboundRequests/${id}/cancel`);
  return response.data;
}

export async function rejectOutboundRequest(id: string, reason: string): Promise<ServiceResult<any>> {
  const response = await api.put(`/WarehouseOutboundRequests/${id}/reject`, {
    rejectReason: reason
  });
  return response.data;
}

// ✅ Thêm function mới để lấy order items với số lượng còn lại
export async function getOrderItemsWithRemainingQuantity(orderId: string): Promise<any[]> {
  try {
    const response = await api.get(`/WarehouseOutboundRequests/order/${orderId}/items`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || error.message || "Không lấy được danh sách mục hàng với số lượng còn lại.");
  }
}
