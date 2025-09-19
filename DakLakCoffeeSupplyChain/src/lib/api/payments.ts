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




