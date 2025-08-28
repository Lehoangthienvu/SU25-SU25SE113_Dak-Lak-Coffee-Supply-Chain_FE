const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
const ENDPOINT = `${API_BASE_URL}/WarehouseInboundRequests`;

export interface CreateWarehouseInboundRequestInput {
  requestedQuantity: number;
  preferredDeliveryDate: string;
  note?: string;
  batchId?: string;  // Cho cà phê đã sơ chế
  detailId?: string; // Cho cà phê tươi
}

export async function createWarehouseInboundRequest(
  input: CreateWarehouseInboundRequestInput
): Promise<string> {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Chưa đăng nhập");

  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  });

  const contentType = response.headers.get("content-type");

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Lỗi server: ${errorText}`);
  }

  if (contentType?.includes("application/json")) {
    const result = await response.json();
    if (result.status !== 1) {
      throw new Error(result.message || "Gửi yêu cầu thất bại");
    }
    return result.message;
  }

  const text = await response.text();
  return text || "Gửi yêu cầu thành công";
}

export async function getAllInboundRequests() {
  const token = localStorage.getItem("token");
  console.log("🔍 DEBUG: getAllInboundRequests - Token:", token ? "Present" : "Missing");
  console.log("🔍 DEBUG: getAllInboundRequests - ENDPOINT:", ENDPOINT);
  
  const res = await fetch(ENDPOINT, {
    headers: { Authorization: `Bearer ${token}` },
  });

  console.log("🔍 DEBUG: getAllInboundRequests - Response status:", res.status);
  console.log("🔍 DEBUG: getAllInboundRequests - Response ok:", res.ok);

  const ct = res.headers.get("content-type") || "";
  console.log("🔍 DEBUG: getAllInboundRequests - Content-Type:", ct);

  // ⚠️ Nếu !ok thì đọc text để hiện lỗi, đừng parse JSON
  if (!res.ok) {
    const text = await res.text();
    console.log("🔍 DEBUG: getAllInboundRequests - Error response:", text);
    throw new Error(text || `HTTP ${res.status}`);
  }

  // Chỉ parse JSON khi đúng content-type
  if (ct.includes("application/json")) {
    const jsonData = await res.json();
    console.log("🔍 DEBUG: getAllInboundRequests - JSON response:", jsonData);
    return jsonData;
  } else {
    const text = await res.text();
    console.log("🔍 DEBUG: getAllInboundRequests - Text response:", text);
    return { status: 0, message: text };
  }
}


export async function getInboundRequestById(id: string) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${ENDPOINT}/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return await res.json();
}

export async function approveInboundRequest(id: string) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${ENDPOINT}/${id}/approve`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return await res.json();
}

export async function rejectInboundRequest(id: string) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${ENDPOINT}/${id}/reject`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return await res.json();
}
export async function cancelInboundRequest(id: string) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${ENDPOINT}/${id}/cancel`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return await res.json();
}
export async function getAllInboundRequestsForFarmer() {
  const token = localStorage.getItem("token");
  const res = await fetch(`${ENDPOINT}/farmer`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return await res.json();
}
export async function getInboundRequestDetailForFarmer(id: string) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${ENDPOINT}/farmer/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return await res.json();
}
