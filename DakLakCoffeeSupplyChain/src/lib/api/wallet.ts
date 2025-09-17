import api from './axios';

export interface WalletTopupRequest {
  walletId: string;
  amount: number;
  description?: string;
  returnUrl?: string;
  locale?: string;
}

export interface WalletTopupResponse {
  paymentUrl: string;
  transactionId: string;
  amount: number;
  message: string;
}

export interface ProcessTopupRequest {
  transactionId: string;
  amount: number;
}

export interface WalletDetail {
  walletId: string;
  userId: string;
  walletType: string;
  totalBalance: number;
  lastUpdated: string;
  isDeleted: boolean;
  userName?: string;
  userCode?: string;
  totalTransactions: number;
  totalInflow: number;
  totalOutflow: number;
}

export interface WalletBalance {
  walletId: string;
  totalBalance: number;
  lastUpdated: string;
}

// Tạo giao dịch nạp tiền vào ví
export async function createWalletTopupPayment(request: WalletTopupRequest): Promise<WalletTopupResponse> {
  const response = await api.post('/Wallet/topup', request);
  return response.data;
}

// Xử lý kết quả thanh toán nạp tiền
export async function processWalletTopupPayment(request: ProcessTopupRequest): Promise<any> {
  const response = await api.post('/Wallet/process-topup', request);
  return response.data;
}

// Tạo VNPay URL cho nạp tiền ví
export async function createWalletTopupVnPayUrl(request: WalletTopupRequest): Promise<string> {
  const response = await api.post('/payments/wallet-topup/vnpay/create-url', {
    walletId: request.walletId,
    amount: request.amount,
    returnUrl: request.returnUrl,
    locale: request.locale || 'vn',
    description: request.description
  });
  return response.data.url;
}

// Lấy thông tin ví của user hiện tại
export async function getMyWallet(): Promise<WalletDetail> {
  const response = await api.get('/Wallet/my-wallet');
  return response.data;
}

// Lấy số dư ví
export async function getWalletBalance(walletId: string): Promise<WalletBalance> {
  const response = await api.get(`/Wallet/${walletId}/balance`);
  return response.data;
}

// Tạo ví mới
export async function createWallet(walletData: {
  userId: string;
  walletType: string;
  totalBalance?: number;
}): Promise<WalletDetail> {
  const response = await api.post('/Wallet', walletData);
  return response.data;
}

// Cập nhật ví
export async function updateWallet(walletId: string, walletData: {
  walletType?: string;
  totalBalance?: number;
}): Promise<WalletDetail> {
  const response = await api.put(`/Wallet/${walletId}`, walletData);
  return response.data;
}

// Nạp tiền trực tiếp (cho test)
export async function addMoneyDirect(amount: number, description: string): Promise<{ message: string; newBalance: number }> {
  const response = await api.post('/Wallet/direct-topup', {
    amount: amount,
    description: description
  });
  return response.data;
}

// Nạp tiền qua VNPay (wrapper function)
export async function addMoneyToWallet(amount: number, description: string): Promise<WalletTopupResponse> {
  // Lấy ví của user hiện tại
  const myWallet = await getMyWallet();
  
  // Tạo VNPay URL
  const paymentUrl = await createWalletTopupVnPayUrl({
    walletId: myWallet.walletId,
    amount: amount,
    description: description,
    returnUrl: `${window.location.origin}/dashboard/wallet/topup/success`
  });

  return {
    paymentUrl,
    transactionId: '', // Sẽ được tạo trong backend
    amount,
    message: 'Tạo URL thanh toán thành công'
  };
}
