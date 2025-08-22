const API_URL = `${process.env.NEXT_PUBLIC_API_URL}/Warehouses`;

// ✅ Hàm tiện ích dùng chung gọi API an toàn, hỗ trợ cả ServiceResult và JSON thuần
async function safeFetch(
  url: string,
  options: RequestInit = {}
): Promise<{ status: number; message: string; data?: any }> {
  const token = localStorage.getItem("token");

  if (!token) {
    return { status: 0, message: "Token không tồn tại trong localStorage" };
  }

  const headers: HeadersInit = {
    Authorization: `Bearer ${token}`,
    ...(options.headers || {}),
  };

  try {
    const res = await fetch(url, { ...options, headers });

    const contentType = res.headers.get("content-type");
    const isJson = contentType?.includes("application/json");

    if (!res.ok) {
      const errorBody = isJson ? await res.json() : await res.text();
      const message =
        typeof errorBody === "string"
          ? errorBody
          : errorBody?.message || `Lỗi server: ${res.status}`;
      return { status: 0, message };
    }

    // Nếu phản hồi có JSON
    if (isJson) {
      const data = await res.json();

      // Nếu là kiểu ServiceResult
      if (typeof data === "object" && data !== null && "status" in data && "message" in data) {
        if (data.status !== 1) {
          return { status: 0, message: data.message || "Lỗi từ backend" };
        }
        return { status: 1, message: data.message, data: data.data };
      }

      // Nếu chỉ là phản hồi JSON thuần
      return { status: 1, message: "Thành công", data };
    }

    // Nếu không phải JSON mà là text thường
    const text = await res.text();
    return { status: 1, message: "Thành công", data: text };
  } catch (err) {
    console.error("❌ Fetch exception:", err);
    return { status: 0, message: "Lỗi kết nối hoặc token không hợp lệ" };
  }
}

// ============================
// 📦 LẤY DANH SÁCH KHO
// ============================
export async function getAllWarehouses() {
  return await safeFetch(API_URL);
}

// ============================
// 📄 LẤY CHI TIẾT 1 KHO
// ============================
export async function getWarehouseById(id: string) {
  return await safeFetch(`${API_URL}/${id}`);
}

// ============================
// 📝 TẠO KHO MỚI
// ============================
export async function createWarehouse(data: any) {
  return await safeFetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

// ============================
// ✏️ CẬP NHẬT KHO
// ============================
export async function updateWarehouse(id: string, data: any) {
  return await safeFetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

// ============================
// ❌ XOÁ KHO (MỀM)
// ============================
export async function deleteWarehouse(id: string) {
  return await safeFetch(`${API_URL}/${id}`, {
    method: "DELETE",
  });
}
