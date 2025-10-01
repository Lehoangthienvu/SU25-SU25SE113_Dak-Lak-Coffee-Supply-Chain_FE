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

  paymentStatus: string;
  message?: string;
  paymentTime?: string;
};

export async function checkPaymentStatus(planId: string): Promise<PaymentStatusResponse> {
  // BE có cả 2 route, đang dùng route của ProcurementPlans:
  const res = await api.get(`/ProcurementPlans/${planId}/payment-status`);
  return res.data;
}

export async function getPlanPostingFee(planId: string): Promise<PaymentAmountResponse> {
  const res = await api.get(`/Payments/plan-posting-fee/${planId}`);
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

/**
 * Xác nhận kết quả thanh toán VNPay qua endpoint /Payments/vnpay/return
 * -> Tự động lọc CHỈ tham số bắt đầu bằng "vnp_" để ký đúng chuẩn.
 *
 * @param query - Có thể truyền:
 *   - string: toàn bộ query ("?a=1&vnp_...") hay chỉ phần sau dấu ?
 *   - URLSearchParams
 *   - Record<string, string>
 */

export async function confirmVnPayReturn(
  query: string | URLSearchParams | Record<string, string>
): Promise<{ code: string; message: string }> {
  let params = new URLSearchParams();

  if (typeof query === 'string') {
    const raw = query.startsWith('?') ? query.slice(1) : query;
    const input = new URLSearchParams(raw);
    input.forEach((v, k) => {
      if (k.startsWith('vnp_')) params.append(k, v);
    });
  } else if (query instanceof URLSearchParams) {
    query.forEach((v, k) => {
      if (k.startsWith('vnp_')) params.append(k, v);
    });
  } else {
    Object.entries(query).forEach(([k, v]) => {
      if (k.startsWith('vnp_') && v != null) params.append(k, String(v));
    });
  }

  const qs = params.toString(); // chỉ chứa các key vnp_*
  const res = await api.get(`/Payments/vnpay/return?${qs}`);
  return res.data;
}


export type PaymentHistory = {
  paymentId: string;
  paymentPurpose: string;
  paymentStatus: string;
  paymentMethod: string;
  paymentAmount: number;
  createdAt: string;
  paymentTime?: string | null;
  relatedEntityId?: string | null;
  paymentCode: string;
};

export async function getPaymentHistory(): Promise<PaymentHistory[]> {
  const res = await api.get('/Payments/history');
  return res.data ?? [];
}
