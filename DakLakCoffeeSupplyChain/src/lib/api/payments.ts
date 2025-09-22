import api from './axios';

export type VnPayCreateRequest = {
  planId: string;
  returnUrl?: string;
  locale?: string;
};

export type PaymentAmountResponse = {
  amount: number;
  feeType: string;
  description: string;
};

export async function createVnPayUrl(req: VnPayCreateRequest): Promise<string> {
  const res = await api.post('/Payments/vnpay/create-url', req);
  return res.data?.url;
}


export type PaymentStatusResponse = {
  hasPayment: boolean;
  paymentStatus: string;
  message?: string;
  paymentTime?: string;
};

export async function checkPaymentStatus(planId: string): Promise<PaymentStatusResponse> {
  const res = await api.get(`/ProcurementPlans/${planId}/payment-status`);
  return res.data;
}

export async function getPlanPostingFee(): Promise<PaymentAmountResponse> {
  const res = await api.get('/Payments/plan-posting-fee');
  return res.data;
}

export type ProcessPaymentSuccessRequest = {
  txnRef: string;
  orderInfo: string;
  responseCode?: string;
  amount?: string;
};

export async function processPaymentSuccess(request: ProcessPaymentSuccessRequest): Promise<any> {
  const res = await api.post('/Payments/process-payment-success', request);
  return res.data;
}

export type WalletPaymentRequest = {
  planId: string;
  amount: number;
  description?: string;
};

export type WalletPaymentResponse = {
  success: boolean;
  message: string;
  transactionId?: string;
};

export async function processWalletPayment(request: WalletPaymentRequest): Promise<WalletPaymentResponse> {
  const res = await api.post('/Payments/wallet-payment', request);
  return res.data;
}




