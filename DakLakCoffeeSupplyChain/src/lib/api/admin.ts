import api from './axios';

export interface SystemWallet {
  walletId: string;
  walletType: string;
  totalBalance: number;
  lastUpdated: string;
}

export async function getSystemWallet(): Promise<SystemWallet> {
  const response = await api.get('/Payments/system-wallet');
  return response.data;
}
