import axios, { AxiosInstance, AxiosResponse } from "axios";
import { HTTP_ERROR_MESSAGES } from "../constants/httpErrors";
import { authService } from "../auth/authService";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

if (!apiUrl) {
  throw new Error("API URL is not defined in environment variables.");
}

const api: AxiosInstance = axios.create({
  baseURL: apiUrl,
  timeout: 200000, 
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Can thiệp khi là FormData
    const isFD = typeof FormData !== "undefined" && config.data instanceof FormData;
    if (isFD && config.headers) {
      delete (config.headers as Record<string, unknown>)["Content-Type"]; // để browser tự set boundary
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => {
    // TIMEOUT
    if (error.code === "ECONNABORTED" || error.message.includes("timeout")) {
      return Promise.reject(new Error("Yêu cầu mất quá nhiều thời gian, vui lòng thử lại sau."));
    }

    // KHÔNG CÓ PHẢN HỒI TỪ SERVER (mạng / SSL / CORS)
    if (error.request && !error.response) {
      return Promise.reject(new Error("Không nhận được phản hồi từ máy chủ."));
    }

    // LỖI TỪ BACKEND CÓ RESPONSE
    if (error.response) {
      const status = error.response.status;
      
      // Xử lý lỗi xác thực (401 Unauthorized)
      if (status === 401) {
        authService.forceLogout('Phiên đăng nhập đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.');
        return Promise.reject(new Error('Phiên đăng nhập đã hết hạn'));
      }
      
      // Xử lý lỗi quyền truy cập (403 Forbidden)
      if (status === 403) {
        authService.forceLogout('Bạn không có quyền truy cập vào tài nguyên này.');
        return Promise.reject(new Error('Không có quyền truy cập'));
      }
      
      // Giữ nguyên cấu trúc lỗi validation (400 Bad Request)
      if (status === 400 && error.response.data?.errors) {
        return Promise.reject(error.response.data);
      }
      
      // Giữ nguyên cấu trúc lỗi business logic (409 Conflict, etc.)
      if (status === 409 && error.response.data?.message) {
        return Promise.reject(error.response.data);
      }
      
      // Các trường hợp khác: chuyển thành string như cũ
      let message = "";
      if (typeof error.response.data === "string" && error.response.data.trim() !== "") {
        message = error.response.data;
      } else {
        message =
          error.response.data?.message ||
          error.response.data ||
          HTTP_ERROR_MESSAGES[status] ||
          `Lỗi HTTP status ${status}`;
      }
      
      return Promise.reject(message);
    }

    // LỖI KHÔNG XÁC ĐỊNH
    return Promise.reject(error);
  }
);

export default api;
