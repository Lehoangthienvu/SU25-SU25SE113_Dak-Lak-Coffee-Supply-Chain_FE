"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  getUserById,
  createUser,
  updateUser,
  UserProfileDetails,
  Gender,
  UserAccountStatus,
  getAllRoles,
  RoleItem,
} from "@/lib/api/users";
import { roleNameToVietnamese } from "@/lib/constants/role";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";

interface UserFormProps {
  mode: "create" | "edit";
  userId?: string;
}

const emptyUser: Partial<UserProfileDetails> = {
  name: "",
  email: "",
  phoneNumber: "",
  gender: Gender.Unknown,
  dateOfBirth: undefined,
  address: "",
  roleName: "",
  status: UserAccountStatus.Active,
  password: "",
};

const statusOptions: { label: string; value: string }[] = [
  { label: "Chờ duyệt", value: UserAccountStatus.PendingApproval },
  { label: "Hoạt động", value: UserAccountStatus.Active },
  { label: "Tạm ngưng", value: UserAccountStatus.Inactive },
  { label: "Bị khóa", value: UserAccountStatus.Locked },
  { label: "Tạm đình chỉ", value: UserAccountStatus.Suspended },
  { label: "Từ chối", value: UserAccountStatus.Rejected },
  { label: "Đã xoá", value: UserAccountStatus.Deleted },
  { label: "Cấm vĩnh viễn", value: UserAccountStatus.Banned },
  { label: "Không xác định", value: UserAccountStatus.Unknown },
];

export default function UserForm({ mode, userId }: UserFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<Record<string, any>>(emptyUser);
  const [loading, setLoading] = useState(mode === "edit");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [roleOptions, setRoleOptions] = useState<
    { label: string; value: string }[]
  >([]);

  // Fetch roles from API
  useEffect(() => {
    let ignore = false;
    getAllRoles()
      .then((roles: RoleItem[]) => {
        if (ignore) return;
        setRoleOptions(
          roles
            .filter((role) => role.status === "Active")
            .map((role) => ({
              label: role.roleName, // value tiếng Anh, label sẽ mapping khi render
              value: role.roleName,
            }))
        );
      })
      .catch(() => {
        // fallback nếu lỗi API
        setRoleOptions([
          { label: "Admin", value: "Admin" },
          { label: "BusinessManager", value: "BusinessManager" },
          { label: "BusinessStaff", value: "BusinessStaff" },
          { label: "Farmer", value: "Farmer" },
          { label: "AgriculturalExpert", value: "AgriculturalExpert" },
          { label: "DeliveryStaff", value: "DeliveryStaff" },
        ]);
      });
    return () => {
      ignore = true;
    };
  }, []);

  // Fetch user data if edit mode
  useEffect(() => {
    if (mode === "edit" && userId) {
      setLoading(true);
      getUserById(userId)
        .then((user) => {
          setForm({
            ...user,
            dateOfBirth: user.dateOfBirth
              ? new Date(user.dateOfBirth).toISOString().slice(0, 10)
              : "",
          });
        })
        .catch((err) =>
          setError(err.message || "Không lấy được thông tin người dùng")
        )
        .finally(() => setLoading(false));
    }
  }, [mode, userId]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.name || !form.phoneNumber) {
      setError("Vui lòng nhập đầy đủ thông tin bắt buộc.");
      return;
    }
    if (mode === "create" && !form.password) {
      setError("Vui lòng nhập mật khẩu.");
      return;
    }
    setError("");

    const payload = {
      ...form,
      gender: form.gender?.toString?.(),
      status: form.status?.toString?.(),
      roleName: form.roleName,
      loginType: "System",
      profilePictureUrl: form.profilePictureUrl?.startsWith("http")
        ? form.profilePictureUrl
        : undefined, // hoặc dùng link mặc định
      ...(mode === "edit" ? { userId } : {}),
    };

    try {
      if (mode === "create") {
        await createUser(payload);
      } else if (mode === "edit" && userId) {
        await updateUser(userId, payload);
      }
      router.back();
    } catch (err: any) {
      console.error("API error:", err);

      // Ghi trực tiếp message từ Error
      setError(err?.message || "Lưu người dùng thất bại");
    }
  };

  return (
    <div className="w-full flex justify-center items-start">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle>
            {mode === "create" ? "Thêm người dùng" : "Chỉnh sửa người dùng"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Đang tải...</div>
          ) : (
            <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-4">
                {/* Không render mã người dùng */}
                <div>
                  <label className="block mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="email"
                    value={form.email || ""}
                    onChange={handleChange}
                    className="border rounded px-3 py-2 w-full"
                    required
                    type="email"
                    placeholder="Nhập email"
                    title="Email"
                  />
                </div>
                <div>
                  <label className="block mb-1">Số điện thoại</label>
                  <input
                    name="phoneNumber"
                    value={form.phoneNumber || ""}
                    onChange={handleChange}
                    className="border rounded px-3 py-2 w-full"
                    placeholder="Nhập số điện thoại"
                    title="Số điện thoại"
                  />
                </div>
                <div>
                  <label className="block mb-1">
                    Họ tên <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="name"
                    value={form.name || ""}
                    onChange={handleChange}
                    className="border rounded px-3 py-2 w-full"
                    required
                    placeholder="Nhập họ tên"
                    title="Họ tên"
                  />
                </div>
                <div>
                  <label className="block mb-1">Giới tính</label>
                  <select
                    name="gender"
                    value={form.gender || Gender.Unknown}
                    onChange={handleChange}
                    className="border rounded px-3 py-2 w-full"
                  >
                    <option value={Gender.Male}>Nam</option>
                    <option value={Gender.Female}>Nữ</option>
                    <option value={Gender.Other}>Khác</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-1">Ngày sinh</label>
                  <input
                    name="dateOfBirth"
                    value={
                      typeof form.dateOfBirth === "string"
                        ? form.dateOfBirth
                        : form.dateOfBirth
                          ? form.dateOfBirth.toISOString().slice(0, 10)
                          : ""
                    }
                    onChange={handleChange}
                    className="border rounded px-3 py-2 w-full"
                    type="date"
                  />
                </div>
                <div>
                  <label className="block mb-1">Địa chỉ</label>
                  <input
                    name="address"
                    value={form.address || ""}
                    onChange={handleChange}
                    className="border rounded px-3 py-2 w-full"
                  />
                </div>
                {/* Password chỉ hiển thị khi tạo mới */}
                {mode === "create" && (
                  <div className="col-span-2">
                    <label className="block mb-1">
                      Mật khẩu <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        name="password"
                        value={form.password || ""}
                        onChange={handleChange}
                        className="border rounded px-3 py-2 w-full pr-10"
                        type={showPassword ? "text" : "password"}
                        required
                      />
                      <button
                        type="button"
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800"
                        tabIndex={-1}
                        onClick={() => setShowPassword((v) => !v)}
                      >
                        {showPassword ? (
                          <EyeOff size={20} />
                        ) : (
                          <Eye size={20} />
                        )}
                      </button>
                    </div>
                  </div>
                )}
                <div>
                  <label className="block mb-1">Vai trò</label>
                  <select
                    name="roleName"
                    value={form.roleName || ""}
                    onChange={handleChange}
                    className="border rounded px-3 py-2 w-full"
                    required
                  >
                    <option value="" disabled className="text-gray-400">
                      -- Chọn vai trò --
                    </option>
                    {roleOptions.map((role) => (
                      <option key={role.value} value={role.value}>
                        {roleNameToVietnamese[role.value] || role.value}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block mb-1">
                    Trạng thái <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="status"
                    value={form.status || UserAccountStatus.Active}
                    onChange={handleChange}
                    className="border rounded px-3 py-2 w-full"
                    required
                  >
                    {statusOptions.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {error && <div className="text-red-500 text-sm">{error}</div>}
              <div className="flex justify-end gap-2 mt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  Quay lại
                </Button>
                <Button type="submit">Lưu</Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
