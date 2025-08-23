import api from "./axios";

export async function getLogsByInventoryId(inventoryId: string) {
  try {
    const response = await api.get(`/InventoryLogs/by-inventory/${inventoryId}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || error.message || "Đã có lỗi xảy ra khi tải lịch sử tồn kho.");
  }
}
export async function getAllInventoryLogs() {
  try {
    const response = await api.get("/InventoryLogs");
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || error.message || "Không thể tải log tồn kho.");
  }
}
export async function getInventoryLogById(logId: string) {
  try {
    const response = await api.get(`/InventoryLogs/${logId}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || error.message || "Không thể tải chi tiết log tồn kho.");
  }
}
export async function softDeleteInventoryLog(logId: string) {
  try {
    await api.delete(`/InventoryLogs/soft/${logId}`);
    return true; // success
  } catch (error: any) {
    throw new Error(error.response?.data?.message || error.message || "Không thể xoá log tồn kho.");
  }
}
