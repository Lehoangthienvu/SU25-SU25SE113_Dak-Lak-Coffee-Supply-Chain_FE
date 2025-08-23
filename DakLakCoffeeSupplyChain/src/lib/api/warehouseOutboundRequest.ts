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

    if (result.status !== 1) {
      throw new Error(result.message || "Gửi yêu cầu thất bại");
    }

    return result.message || "Gửi yêu cầu thành công";
  } catch (error: any) {
    throw new Error(error.response?.data?.message || error.message || "Gửi yêu cầu thất bại");
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
