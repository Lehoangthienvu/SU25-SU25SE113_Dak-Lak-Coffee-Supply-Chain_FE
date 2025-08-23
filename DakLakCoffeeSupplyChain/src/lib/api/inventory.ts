import api from "./axios";

export async function getAllInventories() {
  const response = await api.get("/Inventories");
  return response.data;
}

export async function getInventoryById(id: string) {
  const response = await api.get(`/Inventories/${id}`);
  return response.data;
}

export async function getInventoriesByWarehouseId(warehouseId: string) {
  try {
    const response = await api.get(`/Inventories/warehouse/${warehouseId}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || error.message || "Không lấy được tồn kho theo kho.");
  }
}

// ✅ Thêm function mới để lấy tồn kho với khuyến nghị FIFO
export async function getInventoriesByWarehouseIdWithFifo(warehouseId: string, requestedQuantity?: number) {
  try {
    const url = requestedQuantity 
      ? `/Inventories/warehouse/${warehouseId}/fifo?requestedQuantity=${requestedQuantity}`
      : `/Inventories/warehouse/${warehouseId}/fifo`;
      
    const response = await api.get(url);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || error.message || "Không lấy được tồn kho với khuyến nghị FIFO.");
  }
}

// ✅ Thêm function mới để lấy TẤT CẢ tồn kho (cả sơ chế và tươi) cho warehouse detail
export async function getInventoriesByWarehouseIdForDetail(warehouseId: string) {
  try {
    const response = await api.get(`/Inventories/warehouse/${warehouseId}/detail`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || error.message || "Không lấy được tồn kho theo kho.");
  }
}


export async function createInventory(data: any) {
  try {
    const response = await api.post("/Inventories", data);
    return {
      status: response.status,
      ...response.data,
    };
  } catch (error: any) {
    return {
      status: error.response?.status || 500,
      message: error.response?.data?.message || error.message || "Tạo tồn kho thất bại",
    };
  }
}
export async function softDeleteInventory(id: string) {
  try {
    const response = await api.delete(`/Inventories/soft/${id}`);
    return {
      status: response.status,
      ...response.data,
    };
  } catch (error: any) {
    return {
      status: error.response?.status || 500,
      message: error.response?.data?.message || error.message || "Xóa tồn kho thất bại",
    };
  }
}


