"use client";
import {
  useParams,
  useRouter
} from "next/navigation";
import {
  getUserById,
  UserProfileDetails,
  UserAccountStatus,
  Gender,
  LoginType
} from "@/lib/api/users";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import React from "react";

export default function UserDetail() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;
  const [user, setUser] = React.useState<UserProfileDetails | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    setLoading(true);
    getUserById(userId)
      .then(setUser)
      .catch((err) => setError(err.message || "Không lấy được thông tin người dùng"))
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) {
    return <div className="text-center py-8">Đang tải...</div>;
  }

  if (error || !user) {
    return (
      <div className="p-8">
        <Card>
          <CardHeader>
            <CardTitle>Không tìm thấy người dùng</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-red-500 mb-2">{error || "Không tìm thấy người dùng"}</div>
            <Button onClick={() => router.back()}>Quay lại</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Format date for display
  const formatDate = (date: string | Date | null | undefined) => {
    if (!date) return "Chưa cập nhật";
    const d = typeof date === "string" ? new Date(date) : date;
    if (isNaN(d.getTime())) return "Chưa cập nhật";
    return new Intl.DateTimeFormat('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(d);
  };

  // Format date only (without time)
  const formatDateOnly = (date: string | Date | null | undefined) => {
    if (!date) return "Chưa cập nhật";
    const d = typeof date === "string" ? new Date(date) : date;
    if (isNaN(d.getTime())) return "Chưa cập nhật";
    return new Intl.DateTimeFormat('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(d);
  };

  // Get status display info
  const getStatusInfo = (status: UserAccountStatus) => {
    switch (status) {
      case UserAccountStatus.PendingApproval:
        return { text: "Chờ duyệt", className: "bg-blue-100 text-blue-700" };
      case UserAccountStatus.Active:
        return { text: "Hoạt động", className: "bg-green-100 text-green-700" };
      case UserAccountStatus.Inactive:
        return { text: "Tạm ngưng", className: "bg-gray-200 text-gray-600" };
      case UserAccountStatus.Locked:
        return { text: "Bị khóa", className: "bg-orange-100 text-orange-700" };
      case UserAccountStatus.Suspended:
        return { text: "Tạm đình chỉ", className: "bg-red-100 text-red-700" };
      case UserAccountStatus.Rejected:
        return { text: "Từ chối duyệt", className: "bg-pink-100 text-pink-700" };
      case UserAccountStatus.Deleted:
        return { text: "Đã xoá", className: "bg-gray-300 text-gray-700" };
      case UserAccountStatus.Banned:
        return { text: "Cấm vĩnh viễn", className: "bg-black text-white" };
      default:
        return { text: "Không xác định", className: "bg-yellow-100 text-yellow-700" };
    }
  };

  // Get gender display
  const getGenderDisplay = (gender: Gender) => {
    switch (gender) {
      case Gender.Male:
        return "Nam";
      case Gender.Female:
        return "Nữ";
      case Gender.Other:
        return "Khác";
      case Gender.Unknown:
      default:
        return "Không xác định";
    }
  };

  // Get login type display
  const getLoginTypeLabel = (loginType: LoginType) => {
    switch (loginType) {
      case "System":
        return "Hệ thống";
      case "Google":
        return "Google";
      case "Facebook":
        return "Facebook";
      case "Apple":
        return "Apple";
      default:
        return "Không xác định";
    }
  };

  const statusInfo = getStatusInfo(user.status);

  return (
    <div className="w-full flex justify-center items-start">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Chi tiết người dùng</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-6">
            {/* Profile Picture and Basic Info */}
            <div className="flex flex-col items-center gap-4">
              {user.profilePictureUrl ? (
                <img
                  src={user.profilePictureUrl}
                  alt={user.name}
                  className="w-32 h-32 rounded-full object-cover border-4 border-orange-200"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-orange-100 border-4 border-orange-200 flex items-center justify-center">
                  <span className="text-4xl font-bold text-orange-600">
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </span>
                </div>
              )}
              <div className="text-center">
                <h2 className="font-semibold text-xl">{user.name}</h2>
                <p className="text-gray-600">{user.roleName}</p>
                <p className="text-sm text-gray-500">Mã: {user.userCode}</p>
              </div>
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Thông tin liên hệ</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="font-medium">Email:</span>
                    <span>{user.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Số điện thoại:</span>
                    <span>{user.phoneNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Địa chỉ:</span>
                    <span className="text-right">{user.address}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Personal Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Thông tin cá nhân</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="font-medium">Giới tính:</span>
                    <span>{getGenderDisplay(user.gender)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Ngày sinh:</span>
                    <span>{user.dateOfBirth ? formatDateOnly(user.dateOfBirth) : "Chưa cập nhật"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Trạng thái:</span>
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${statusInfo.className}`}>
                      {statusInfo.text}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Account Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Thông tin tài khoản</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex justify-between">
                    <span className="font-medium">Loại đăng nhập:</span>
                    <span>{getLoginTypeLabel(user.loginType as LoginType)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Xác thực email:</span>
                    <span className={user.emailVerified ? "text-green-600" : "text-red-600"}>
                      {user.emailVerified ? "Đã xác thực" : "Chưa xác thực"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Tài khoản đã xác thực:</span>
                    <span className={user.isVerified ? "text-green-600" : "text-red-600"}>
                      {user.isVerified ? "Đã xác thực" : "Chưa xác thực"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Ngày đăng ký:</span>
                    <span>{formatDate(user.registrationDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Đăng nhập cuối:</span>
                    <span>{user.lastLogin ? formatDate(user.lastLogin) : "Chưa đăng nhập"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Cập nhật lần cuối:</span>
                    <span>{formatDate(user.updatedAt)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => router.push(`/dashboard/admin/users/${userId}/edit`)}
              >
                Chỉnh sửa
              </Button>
              <Button onClick={() => router.back()}>
                Quay lại
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 