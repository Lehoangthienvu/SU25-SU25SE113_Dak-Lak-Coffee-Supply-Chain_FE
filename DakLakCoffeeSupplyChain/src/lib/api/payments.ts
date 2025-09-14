import api from './axios';

export type VnPayCreateRequest = {
  planId: string;
  amount?: number; // default 100000
  returnUrl?: string;
  locale?: string;
};

export async function createVnPayUrl(req: VnPayCreateRequest): Promise<string> {
  const res = await api.post('/Payments/vnpay/create-url', req);
  return res.data?.url;
}

export type PaymentStatusResponse = {
  success: boolean;
  message?: string;
  paymentStatus?: string;
  paymentTime?: string;
};

export async function checkPaymentStatus(planId: string): Promise<PaymentStatusResponse> {
  const res = await api.get(`/ProcurementPlans/${planId}/payment-status`);
  return res.data;
}




