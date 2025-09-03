import { jwtDecode } from "jwt-decode";
import { roleSlugMap } from "@/lib/constants/role";
import api from "./axios";

export interface DecodedToken {
  nameid: string;
  name: string;
  email: string;
  role: string;
  exp: number;
  avatar?: string;
  iat: number;
}

export interface SignUpData {
  name: string;
  email: string;
  password: string;
  phone: string;
  roleId: number;
  companyName?: string;
  taxId?: string;
  businessLicenseURl?: string;
}

export type VerifyAccountByAdminDto = {
  action: boolean;
  reason: string;
};

export async function login(email: string, password: string): Promise<DecodedToken> {
  const response = await api.post("/Auth/login", { email, password });

  const token = response.data;

  if (!token || typeof token !== "string") {
    throw new Error("Đăng nhập thất bại: Token không hợp lệ");
  }

  const decoded: DecodedToken = jwtDecode(token);
  const roleSlug = roleSlugMap[decoded.role] ?? "unknown";

  localStorage.setItem("token", token);
  localStorage.setItem("user_id", decoded.nameid);
  localStorage.setItem("user_name", decoded.name);
  localStorage.setItem("email", decoded.email);
  localStorage.setItem("user_role", roleSlug);
  localStorage.setItem("user_role_raw", decoded.role);
  localStorage.setItem("user_avatar", decoded.avatar || "");

  return decoded;
}

export async function signUp(signUpData: SignUpData): Promise<void> {
  await api.post("/Auth/SignUpRequest", signUpData);
  localStorage.setItem("pending_email", signUpData.email);
}

export async function resendVerificationEmail(email: string): Promise<void> {
  await api.post("/Auth/resend-verification-email", { email });
}

export async function verifyBusinessManagerAccount(data: VerifyAccountByAdminDto): Promise<void> {
  await api.patch("/Auth/verify-business-manager-account", data);
}
