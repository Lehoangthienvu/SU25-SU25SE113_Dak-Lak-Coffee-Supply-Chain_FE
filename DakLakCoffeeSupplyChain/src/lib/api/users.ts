// lib/api/users.ts
import api from "./axios";

export interface UserProfile {
  userId: string; // Guid in backend
  userCode: string;
  name: string;
  email: string;
  phoneNumber: string;
  roleName: string;
  status: UserAccountStatus;
  lastLogin?: Date;
  registrationDate: Date;
}

export interface UserProfileDetails {
  userId: string; // Guid in backend
  userCode: string;
  email: string;
  phoneNumber: string;
  name: string;
  password: string;
  gender: Gender;
  dateOfBirth?: Date;
  address: string;
  profilePictureUrl: string;
  emailVerified?: boolean;
  isVerified?: boolean;
  loginType: string;
  status: UserAccountStatus;
  roleName: string;
  registrationDate: Date;
  lastLogin?: Date;
  updatedAt: Date;
}

export enum UserAccountStatus {
  Unknown = "Unknown",
  PendingApproval = "PendingApproval",
  Active = "Active",
  Inactive = "Inactive",
  Locked = "Locked",
  Suspended = "Suspended",
  Rejected = "Rejected",
  Deleted = "Deleted",
  Banned = "Banned",
}

export enum Gender {
  Unknown = "Unknown",
  Male = "Male",
  Female = "Female",
  Other = "Other",
}

export enum LoginType {
  System = "System",
  Google = "Google",
  Facebook = "Facebook",
  Apple = "Apple",
}

export interface RoleItem {
  roleId: number;
  roleName: string;
  status: string; // 'Active' | 'Inactive' hoặc enum nếu muốn
}

const API_URL = `${process.env.NEXT_PUBLIC_API_URL}/UserAccounts`;

export async function getAllUsers(): Promise<UserProfile[]> {
  const token = localStorage.getItem("token");
  const res = await fetch(API_URL, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error("Không lấy được danh sách người dùng");
  return await res.json();
}

export async function getUserById(id: string): Promise<UserProfileDetails> {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_URL}/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error("Không lấy được thông tin người dùng");
  return await res.json();
}

export async function createUser(data: Partial<UserProfileDetails>) {
  const token = localStorage.getItem("token");

  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  const contentType = res.headers.get("Content-Type") || "";
  let responseBody: any;

  try {
    responseBody = contentType.includes("application/json")
      ? await res.json()
      : await res.text();
  } catch (err) {
    responseBody = null;
  }

  if (!res.ok) {
    let message = "Không tạo được người dùng";

    if (typeof responseBody === "string") {
      try {
        const parsed = JSON.parse(responseBody);
        if (parsed?.errors && typeof parsed.errors === "object") {
          message = Object.values(parsed.errors).flat().filter(Boolean).join(" | ");
        } else if (parsed?.message) {
          message = parsed.message;
        } else {
          message = responseBody;
        }
      } catch {
        message = responseBody;
      }
    } else if (responseBody?.errors && typeof responseBody.errors === "object") {
      message = Object.values(responseBody.errors).flat().filter(Boolean).join(" | ");
    } else if (responseBody?.message) {
      message = responseBody.message;
    }

    throw new Error(message);
  }

  return responseBody;
}

export async function updateUser(id: string, data: Partial<UserProfileDetails>) {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  const contentType = res.headers.get("Content-Type") || "";
  let responseBody: any;

  try {
    responseBody = contentType.includes("application/json")
      ? await res.json()
      : await res.text();
  } catch (err) {
    responseBody = null;
  }

  if (!res.ok) {
    let message = "Không cập nhật được người dùng";

    if (typeof responseBody === "string") {
      try {
        const parsed = JSON.parse(responseBody);
        // Nếu parse được từ string JSON
        if (parsed?.errors && typeof parsed.errors === "object") {
          message = Object.values(parsed.errors).flat().filter(Boolean).join(" | ");
        } else if (parsed?.message) {
          message = parsed.message;
        } else {
          message = responseBody;
        }
      } catch {
        // không parse được thì cứ để nguyên string
        message = responseBody;
      }
    } else if (responseBody?.errors && typeof responseBody.errors === "object") {
      message = Object.values(responseBody.errors).flat().filter(Boolean).join(" | ");
    } else if (responseBody?.message) {
      message = responseBody.message;
    }

    throw new Error(message);
  }

  return responseBody;
}

export async function softDeleteUser(id: string) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_URL}/soft-delete/${id}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error("Không xoá được người dùng");
  return await res.text();
}

export async function getAllRoles(): Promise<RoleItem[]> {
  const res = await api.get("/Roles");
  return res.data;
}
