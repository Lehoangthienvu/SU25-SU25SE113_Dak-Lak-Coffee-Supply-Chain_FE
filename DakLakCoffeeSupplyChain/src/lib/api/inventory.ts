// /lib/api/inventory.ts

export async function getAllInventories() {
  const token = localStorage.getItem("token");
  const res = await fetch("https://localhost:7163/api/Inventories", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return await res.json(); // ✅ KHÔNG cần sửa gì ở đây
}

export async function getInventoryById(id: string) {
  const token = localStorage.getItem("token");
  const res = await fetch(`https://localhost:7163/api/Inventories/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return await res.json();
}

export async function getInventoriesByWarehouseId(warehouseId: string) {
  const token = localStorage.getItem("token");
  const res = await fetch(`https://localhost:7163/api/Inventories/warehouse/${warehouseId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(errText || "Không lấy được tồn kho theo kho.");
  }

  const contentType = res.headers.get("content-type");
  if (!contentType?.includes("application/json")) {
    return [];
  }

  return await res.json(); // ✅ Trả mảng tồn kho theo kho
}

// ✅ Thêm function mới để lấy TẤT CẢ tồn kho (cả sơ chế và tươi) cho warehouse detail
export async function getInventoriesByWarehouseIdForDetail(warehouseId: string) {
  const token = localStorage.getItem("token");
  const res = await fetch(`https://localhost:7163/api/Inventories/warehouse/${warehouseId}/detail`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(errText || "Không lấy được tồn kho theo kho.");
  }

  const contentType = res.headers.get("content-type");
  if (!contentType?.includes("application/json")) {
    return [];
  }

  return await res.json(); // ✅ Trả mảng TẤT CẢ tồn kho theo kho (cả cà phê sơ chế và tươi)
}


export async function createInventory(data: any) {
  const token = localStorage.getItem("token");

  const res = await fetch("https://localhost:7163/api/Inventories", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  const contentType = res.headers.get("content-type");

  // Nếu là JSON thì parse
  if (contentType && contentType.includes("application/json")) {
    const json = await res.json();
    return {
      status: res.status,
      ...json,
    };
  }

  // Nếu là plain text (VD: lỗi như "Tồn kho đã tồn tại...")
  const text = await res.text();
  return {
    status: res.status,
    message: text,
  };
}
export async function softDeleteInventory(id: string) {
  const token = localStorage.getItem("token");

  const res = await fetch(`https://localhost:7163/api/Inventories/soft/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const contentType = res.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    const json = await res.json();
    return {
      status: res.status,
      ...json,
    };
  }

  const text = await res.text();
  return {
    status: res.status,
    message: text,
  };
}


