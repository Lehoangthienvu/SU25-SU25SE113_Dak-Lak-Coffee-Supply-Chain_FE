import api from './axios';

// Interfaces cho Wallet Transaction
export interface WalletTransactionCreate {
  walletId: string;
  paymentId?: string;
  amount: number;
  transactionType: 'TopUp' | 'Withdraw' | 'Transfer' | 'Payment';
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
  walletType?: string;
  userName?: string;
}

export interface WalletTransactionList {
  transactionId: string;
  walletId: string;
  amount: number;
  transactionType: string;
  description?: string;
  createdAt: string;
  walletType?: string;
}

export interface WalletTransactionFilter {
  walletId?: string;
  transactionType?: string;
  fromDate?: string;
  toDate?: string;
  minAmount?: number;
  maxAmount?: number;
  pageNumber?: number;
  pageSize?: number;
}

export interface WalletTransactionSummary {
  totalTransactions: number;
  totalTopUp: number;
  totalWithdraw: number;
  totalTransfer: number;
  totalPayment: number;
  lastTransaction?: string;
}

export interface WalletTransactionSearchResult {
  data: WalletTransactionList[];
  totalRecords: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

// API Functions

// Tạo giao dịch mới
export async function createWalletTransaction(transaction: WalletTransactionCreate): Promise<WalletTransactionDetail> {
  const response = await api.post('/WalletTransaction', transaction);
  return response.data;
}

// Lấy chi tiết giao dịch theo ID
export async function getWalletTransactionById(transactionId: string): Promise<WalletTransactionDetail> {
  const response = await api.get(`/WalletTransaction/${transactionId}`);
  return response.data;
}

// Lấy lịch sử giao dịch theo ví
export async function getTransactionsByWallet(walletId: string): Promise<WalletTransactionList[]> {
  const response = await api.get(`/WalletTransaction/wallet/${walletId}`);
  return response.data;
}

// Tìm kiếm giao dịch với filter
export async function searchWalletTransactions(filter: WalletTransactionFilter): Promise<WalletTransactionSearchResult> {
  const response = await api.post('/WalletTransaction/search', filter);
  // console.log('Raw API response:', response.data);
  
  // Backend trả về trực tiếp data, không có wrapper
  if (Array.isArray(response.data)) {
    // Nếu response.data là array, tạo mock search result
    return {
      data: response.data,
      totalRecords: response.data.length,
      pageNumber: filter.pageNumber || 1,
      pageSize: filter.pageSize || 10,
      totalPages: 1
    };
  }
  
  // Nếu đã có structure đúng
  return response.data;
}

// Xóa giao dịch
export async function deleteWalletTransaction(transactionId: string): Promise<void> {
  await api.delete(`/WalletTransaction/${transactionId}`);
}

// Lấy thống kê giao dịch theo ví
export async function getWalletTransactionSummary(walletId: string): Promise<WalletTransactionSummary> {
  const response = await api.get(`/WalletTransaction/wallet/${walletId}/summary`);
  return response.data;
}

// Utility functions
export function formatTransactionType(type: string): string {
  switch (type.toLowerCase()) {
    case 'topup':
      return 'Nạp tiền';
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
  
  // TopUp = tăng tiền (+), còn lại là giảm tiền (-)
  if (type.toLowerCase() === 'topup') {
    return `+${formatted} VND`;
  } else {
    return `-${formatted} VND`;
  }
}
