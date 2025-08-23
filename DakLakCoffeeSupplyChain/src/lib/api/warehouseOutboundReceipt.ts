import api from "./axios";

export interface CreateOutboundReceiptInput {
  warehouseId: string;
  inventoryId: string;
  exportedQuantity: number;
  note?: string;
  destination?: string;
}

export interface ConfirmOutboundReceiptInput {
  confirmedQuantity: number;
  destinationNote?: string;
}

// 👉 kiểu dữ liệu summary trả về từ BE
export interface OutboundRequestSummary {
  requestedQuantity: number;
  confirmedQuantity: number;
  createdQuantity: number;
  draftQuantity: number;
  remainingByConfirm: number;
  remainingHardCap: number;
  inventoryAvailable: number;
}

export async function getAllOutboundReceipts() {
  try {
    const response = await api.get("/WarehouseOutboundReceipts");
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || error.message || "Lỗi tải danh sách phiếu xuất kho");
  }
}

export async function getOutboundReceiptById(id: string) {
  try {
    const response = await api.get(`/WarehouseOutboundReceipts/${id}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || error.message || "Không tìm thấy phiếu xuất kho");
  }
}

export async function createOutboundReceipt(
  outboundRequestId: string,
  input: CreateOutboundReceiptInput
) {
  try {
    const response = await api.post(`/WarehouseOutboundReceipts/${outboundRequestId}/receipt`, input);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || error.message || "Lỗi tạo phiếu xuất kho");
  }
}

export async function confirmOutboundReceipt(
  receiptId: string,
  input: ConfirmOutboundReceiptInput
) {
  try {
    const response = await api.put(`/WarehouseOutboundReceipts/${receiptId}/confirm`, input);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || error.message || "Lỗi xác nhận phiếu xuất kho");
  }
}

// ✅ THÊM HÀM NÀY & EXPORT
export async function getOutboundRequestSummary(
  outboundRequestId: string
): Promise<OutboundRequestSummary> {
  try {
    const response = await api.get(`/WarehouseOutboundReceipts/${outboundRequestId}/summary`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || error.message || "Lỗi tải thông tin summary");
  }
}
