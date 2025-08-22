"use client";

import { usePathname, useRouter } from "next/navigation";
import { useMemo, useEffect, useState } from "react";
import { FiMail, FiSmile, FiSearch } from "react-icons/fi";
import NotificationBell from "@/components/notifications/NotificationBell";
import { Input } from "@/components/ui/input";
import { roleRawToDisplayName } from "@/lib/constants/role";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { LogOut, User, Settings } from "lucide-react";
import { authService } from "@/lib/auth/authService";

const pathTitleMap: Record<string, string> = {
  dashboard: "Tổng quan",
  farmer: "Tổng quan",
  admin: "Tổng quan",
  manager: "Tổng quan",
  staff: "Tổng quan",
  "warehouse-request": "Yêu cầu kho",
  "outbound-requests": "Yêu cầu xuất kho",
  "inbound-requests": "Yêu cầu nhập kho",
  "outbound-receipts": "Biên bản xuất kho",
  "inbound-receipts": "Biên bản nhập kho",
  "procurement-plans": "Kế hoạch thu mua",
  "farming-commitments": "Cam kết kế hoạch thu mua",
  "crop-seasons": "Mùa vụ",
  batches: "Danh sách lô sơ chế",
  evaluations: "Phân tích bất thường",
  progresses: "Tiến trình lô sơ chế",
  wastes: "Chất thải lô sơ chế",
  "processing-methods": "Phương pháp sơ chế",
  parameters: "Tham số sơ chế",
  stages: "Công đoạn sơ chế",
  "waste-disposals": "Xử lý chất thải",
  "request-feedback": "Tư vấn kỹ thuật",
  consultations: "Tư vấn",
  articles: "Bài viết",
  contracts: "Hợp đồng",
  "business-buyers": "Khách hàng doanh nghiệp",
  orders: "Đơn hàng",
  shipments: "Lô giao hàng",
  "contract-delivery-batches": "Lịch giao hàng",
  products: "Sản phẩm",
  reports: "Báo cáo",
  users: "Quản lý người dùng",
  settings: "Cài đặt",
  create: "Tạo",
  edit: "Chỉnh sửa",
  "Chi tiết": "Chi tiết",
};

export default function HeaderDashboard() {
  const pathname = usePathname();
  const router = useRouter();

  const [userName, setUserName] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [avatar, setAvatar] = useState<string | null>(null);

  useEffect(() => {
    const user = authService.getUser();
    console.log('🔍 HeaderDashboard useEffect:', { user });
    if (user) {
      setUserName(user.name);
      // Sử dụng roleRawToDisplayName để hiển thị tên tiếng Việt
      const displayRole = roleRawToDisplayName[user.roleRaw] || user.roleRaw;
      console.log('🔍 HeaderDashboard setUserRole:', {
        roleRaw: user.roleRaw,
        displayRole,
        roleRawToDisplayName: roleRawToDisplayName
      });
      setUserRole(displayRole);
      setAvatar(user.avatar || null);
    }
  }, []);

  const currentTitle = useMemo(() => {
    const segments = pathname.split("/").filter(Boolean);

    // Kiểm tra nếu có segment "create" hoặc "edit" hoặc ID (số)
    const last = segments[segments.length - 1];
    const secondLast = segments[segments.length - 2];

    // Nếu segment cuối là "create"
    if (last === "create") {
      return pathTitleMap[last] || "Tạo";
    }

    // Nếu segment cuối là "edit"
    if (last === "edit") {
      return pathTitleMap[last] || "Chỉnh sửa";
    }

    // Nếu segment cuối là một ID (không nằm trong map) và có segment trước đó
    if (secondLast && !pathTitleMap[last]) {
      return pathTitleMap[secondLast]
        ? `${pathTitleMap[secondLast]} - Chi tiết`
        : "Chi tiết";
    }

    // Trường hợp thông thường
    return pathTitleMap[last] || "Tổng quan";
  }, [pathname]);

  const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    userName ?? "U"
  )}&background=FD7622&color=fff`;

  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-orange-100 bg-white shadow-sm">
      {/* Title */}
      <div className="flex items-center gap-3">
        <div className="w-1 h-8 bg-gradient-to-b from-orange-500 to-amber-500 rounded-full"></div>
        <h1 className="text-2xl font-bold text-gray-800">{currentTitle}</h1>
      </div>

      {/* Search */}
      <div className="relative w-full max-w-md mx-4">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            type="text"
            placeholder="Tìm kiếm..."
            className="pl-10 pr-4 py-2 text-sm bg-gray-50 border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all duration-200"
          />
        </div>
      </div>

      {/* Icons + Avatar + Dropdown */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <NotificationBell />
          <IconWithBadge icon={<FiMail size={18} />} count={68} />
          <IconWithBadge icon={<FiSmile size={18} />} count={14} />
        </div>

        <div className="w-px h-8 bg-gray-200"></div>

        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <div className="flex items-center gap-3 cursor-pointer hover:bg-orange-50 rounded-lg p-2 transition-colors duration-200">
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-800">
                  {userName ?? "Ẩn danh"}
                </p>
                <p className="text-xs text-gray-500">
                  {userRole ?? "Vai trò không xác định"}
                </p>
              </div>
              <div className="relative">
                <img
                  src={avatar || fallbackAvatar}
                  alt="avatar"
                  className="w-10 h-10 rounded-full border-2 border-orange-200 object-cover shadow-sm"
                />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
              </div>
            </div>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              className="min-w-[220px] bg-white rounded-lg shadow-lg border border-orange-100 p-2 text-sm z-[100]"
              sideOffset={8}
              align="end"
            >
              <div className="px-3 py-3 border-b border-orange-100 mb-2">
                <div className="flex items-center gap-3">
                  <img
                    src={avatar || fallbackAvatar}
                    alt="avatar"
                    className="w-12 h-12 rounded-full border-2 border-orange-200 object-cover"
                  />
                  <div>
                    <p className="font-semibold text-gray-800">
                      {userName ?? "Ẩn danh"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {userRole ?? "Vai trò không xác định"}
                    </p>
                  </div>
                </div>
              </div>

              <DropdownMenu.Item
                className="px-3 py-2 hover:bg-orange-50 rounded-lg flex items-center gap-3 cursor-pointer transition-colors duration-200"
                onClick={() => router.push("/dashboard/profile")}
              >
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  <User size={16} className="text-orange-600" />
                </div>
                <span>Hồ sơ cá nhân</span>
              </DropdownMenu.Item>

              <DropdownMenu.Item
                className="px-3 py-2 hover:bg-orange-50 rounded-lg flex items-center gap-3 cursor-pointer transition-colors duration-200"
                onClick={() => router.push("/dashboard/settings")}
              >
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Settings size={16} className="text-blue-600" />
                </div>
                <span>Cài đặt</span>
              </DropdownMenu.Item>

              <DropdownMenu.Separator className="h-px bg-orange-100 my-2" />

              <DropdownMenu.Item
                className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-3 cursor-pointer transition-colors duration-200"
                onClick={() => {
                  authService.logout();
                }}
              >
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                  <LogOut size={16} className="text-red-600" />
                </div>
                <span>Đăng xuất</span>
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </div>
  );
}

function IconWithBadge({
  icon,
  count,
}: {
  icon: React.ReactNode;
  count: number;
}) {
  return (
    <div className="relative text-gray-500 hover:text-orange-600 cursor-pointer p-2 rounded-lg hover:bg-orange-50 transition-all duration-200">
      {icon}
      {count > 0 && (
        <span className="absolute -top-1 -right-1 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full shadow-sm min-w-[18px] h-[18px] flex items-center justify-center">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </div>
  );
}
