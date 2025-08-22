const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
const ENDPOINT = `${API_BASE_URL}/WarehouseOutboundRequests`;

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

function getToken() {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Chưa đăng nhập");
  return token;
}

export async function createWarehouseOutboundRequest(
  input: CreateWarehouseOutboundRequestInput
): Promise<string> {
  const token = getToken();

  console.log('DEBUG: Sending request with payload:', input);

  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  });

  console.log('DEBUG: Response status:', response.status);
  console.log('DEBUG: Response headers:', response.headers);

  const result = await response.json();
  console.log('DEBUG: Response body:', result);

  if (!response.ok) {
    throw new Error(result.message || `HTTP ${response.status}: Gửi yêu cầu thất bại`);
  }

  if (result.status !== 1) {
    throw new Error(result.message || "Gửi yêu cầu thất bại");
  }

  return result.message || "Gửi yêu cầu thành công";
}

export async function getAllOutboundRequests(): Promise<ServiceResult<any[]>> {
  const token = getToken();
  const res = await fetch(`${ENDPOINT}/all`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const result = await res.json();
  if (!res.ok || result.status !== 1) {
    throw new Error(result.message || "Lỗi tải danh sách");
  }

  return result;
}

export async function getOutboundRequestById(id: string): Promise<ServiceResult<any>> {
  const token = getToken();
  const res = await fetch(`${ENDPOINT}/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const result = await res.json();
  if (!res.ok || result.status !== 1) {
    throw new Error(result.message || "Không tìm thấy yêu cầu");
  }

  return result;
}

export async function acceptOutboundRequest(id: string): Promise<ServiceResult<any>> {
  const token = getToken();
  const res = await fetch(`${ENDPOINT}/${id}/accept`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
  });

  return await res.json();
}

export async function cancelOutboundRequest(id: string): Promise<ServiceResult<any>> {
  const token = getToken();
  const res = await fetch(`${ENDPOINT}/${id}/cancel`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
  });

  return await res.json();
}
export async function rejectOutboundRequest(id: string, reason: string): Promise<ServiceResult<any>> {
  const token = getToken();
  const res = await fetch(`${ENDPOINT}/${id}/reject`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ rejectReason: reason }),
  });

  return await res.json();
}

// ✅ Thêm function mới để lấy order items với số lượng còn lại
export async function getOrderItemsWithRemainingQuantity(orderId: string): Promise<any[]> {
  const token = getToken();
  const res = await fetch(`${ENDPOINT}/order/${orderId}/items`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(errText || "Không lấy được danh sách mục hàng với số lượng còn lại.");
  }

  return await res.json();
}
