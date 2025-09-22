import api from './axios';

// Interfaces cho Wallet Transaction (theo Backend DTOs)
export interface WalletTransactionCreate {
  walletId: string;
  paymentId?: string;
  amount: number;
  transactionType: string;
  description?: string;
}

export interface WalletTransactionDetail {
  transactionId: string;
  walletId: string;
  paymentId?: string;
  amount: number;
  transactionType: string;
  description?: string;
  createdAt: string;
  isDeleted: boolean;
  walletType?: string;
  userName?: string;
  userCode?: string;
  paymentStatus?: string;
}

export interface WalletTransactionList {
  transactionId: string;
  walletId: string;
  amount: number;
  transactionType: string;
  description?: string;
  createdAt: string;
  isDeleted: boolean;
  walletType?: string;
  userName?: string;
}

export interface WalletTransactionSearchResult {
  data: WalletTransactionList[];
  totalRecords: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

export interface WalletTransactionUpdate {
  description?: string;
}

// API Functions - Theo Backend Endpoints

// 1. Tạo giao dịch mới
export async function createWalletTransaction(transaction: WalletTransactionCreate): Promise<WalletTransactionDetail> {
  try {
    const response = await api.post('/WalletTransaction', transaction);
    return response.data;
  } catch (error) {
    console.error('Error creating wallet transaction:', error);
    throw error;
  }
}

// 2. Lấy chi tiết giao dịch theo ID
export async function getWalletTransactionById(transactionId: string): Promise<WalletTransactionDetail> {
  try {
    const response = await api.get(`/WalletTransaction/${transactionId}`);
    return response.data;
  } catch (error) {
    console.error('Error getting wallet transaction by ID:', error);
    throw error;
  }
}

// 3. Lấy lịch sử giao dịch theo ví
export async function getTransactionsByWallet(walletId: string): Promise<WalletTransactionList[]> {
  try {
    const response = await api.get(`/WalletTransaction/wallet/${walletId}`);
    return response.data;
  } catch (error) {
    console.error('Error getting transactions by wallet:', error);
    throw error;
  }
}

// 4. Lấy giao dịch theo User ID (với phân trang)
export async function getTransactionsByUserId(userId: string, pageNumber: number = 1, pageSize: number = 10): Promise<WalletTransactionSearchResult> {
  try {
    const response = await api.get(`/WalletTransaction/user/${userId}?pageNumber=${pageNumber}&pageSize=${pageSize}`);
    return response.data;
  } catch (error) {
    console.error('Error getting transactions by user ID:', error);
    throw error;
  }
}

// 5. Cập nhật giao dịch
export async function updateWalletTransaction(transactionId: string, updateData: WalletTransactionUpdate): Promise<WalletTransactionDetail> {
  try {
    const response = await api.put(`/WalletTransaction/${transactionId}`, updateData);
    return response.data;
  } catch (error) {
    console.error('Error updating wallet transaction:', error);
    throw error;
  }
}

// 6. Xóa giao dịch (soft delete)
export async function deleteWalletTransaction(transactionId: string): Promise<void> {
  try {
    await api.delete(`/WalletTransaction/${transactionId}`);
  } catch (error) {
    console.error('Error deleting wallet transaction:', error);
    throw error;
  }
}

// 7. Xóa vĩnh viễn giao dịch (chỉ Admin)
export async function hardDeleteWalletTransaction(transactionId: string): Promise<void> {
  try {
    await api.delete(`/WalletTransaction/${transactionId}/hard`);
  } catch (error) {
    console.error('Error hard deleting wallet transaction:', error);
    throw error;
  }
}

// Utility functions
export function formatTransactionType(type: string): string {
  switch (type.toLowerCase()) {
    case 'topup':
      return 'Nạp tiền';
    case 'directtopup':
      return 'Nạp tiền trực tiếp';
    case 'withdraw':
      return 'Rút tiền';
    case 'transfer':
      return 'Chuyển tiền';
    case 'payment':
      return 'Thanh toán';
    default:
      return type;
  }
}

export function getTransactionTypeColor(type: string): string {
  switch (type.toLowerCase()) {
    case 'topup':
    case 'directtopup':
      return 'text-green-600 bg-green-50';
    case 'withdraw':
      return 'text-red-600 bg-red-50';
    case 'transfer':
      return 'text-blue-600 bg-blue-50';
    case 'payment':
      return 'text-orange-600 bg-orange-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
}

export function getTransactionAmountColor(type: string): string {
  switch (type.toLowerCase()) {
    case 'topup':
    case 'directtopup':
      return 'text-green-600';
    case 'withdraw':
      return 'text-red-600';
    case 'transfer':
      return 'text-blue-600';
    case 'payment':
      return 'text-orange-600';
    default:
      return 'text-gray-600';
  }
}

export function formatAmount(amount: number, type: string): string {
  const formatted = amount.toLocaleString('vi-VN');
  
  // TopUp và DirectTopup = tăng tiền (+), còn lại là giảm tiền (-)
  if (type.toLowerCase() === 'topup' || type.toLowerCase() === 'directtopup') {
    return `+${formatted} VND`;
  } else {
    return `-${formatted} VND`;
  }
}
