"use client";

import { JSX, ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Menu } from "lucide-react";
import React from "react";
import { authService } from "@/lib/auth/authService";
import {
  FiPieChart,
  FiUsers,
  FiFileText,
  FiSettings,
  FiBarChart2,
  FiMessageCircle,
  FiBookOpen,
  FiClipboard,
  FiFeather,
  FiTruck,
  FiChevronDown,

  FiShoppingCart,
  FiBell,
  FiActivity,
} from "react-icons/fi";


const iconMap = {
  dashboard: <FiPieChart />,
  users: <FiUsers />,
  contracts: <FiFileText />,
  reports: <FiBarChart2 />,
  settings: <FiSettings />,
  feedback: <FiMessageCircle />,
  articles: <FiBookOpen />,
  consultation: <FiFeather />,
  crops: <FiClipboard />,
  market: <FiActivity />
};

// ===== Sidebar Layout =====
interface SidebarProps {
  children: ReactNode;
  defaultCollapsed?: boolean;
  onCollapseChange?: (collapsed: boolean) => void;
}

export function Sidebar({
  children,
  defaultCollapsed = false,
  onCollapseChange,
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  const childrenWithProps = React.Children.map(children, (child) => {
    if (
      React.isValidElement(child) &&
      (child.type as unknown as { displayName?: string })?.displayName === "SidebarFooter"
    ) {
      return React.cloneElement(child as React.ReactElement<{ isCollapsed?: boolean }>, {
        isCollapsed,
      });
    }
    return child;
  });

  return (
    <aside
      className={cn(
        "h-screen bg-white border-r border-orange-100 shadow-sm transition-all duration-300",
        isCollapsed ? "w-[64px]" : "w-[260px]",
        "flex flex-col fixed left-0 top-0 z-50"
      )}
    >
      <div className="h-16 flex items-center justify-between px-4 border-b border-orange-100">
        <div className="flex items-center gap-2 overflow-hidden">
          {!isCollapsed && (
            <>
              <img src="/logo_bg.png" alt="logo" className="w-7 h-7" />
              <span className="text-xl font-bold text-orange-600 truncate">
                DakLakCoffee
              </span>
            </>
          )}
        </div>
        <button
          onClick={() => {
            const newState = !isCollapsed;
            setIsCollapsed(newState);
            onCollapseChange?.(newState);
          }}
          className="text-orange-600 hover:bg-orange-100 rounded-lg p-2 transition-colors"
        >
          <Menu size={20} />
        </button>
      </div>
      <div className="flex-1 overflow-auto">{childrenWithProps}</div>
    </aside>
  );
}

// ===== Sidebar Header =====
export function SidebarHeader({ children }: { children?: ReactNode }) {
  return (
    <div className="px-4 py-3 border-b border-orange-100 font-medium text-sm text-gray-700">{children}</div>
  );
}

// ===== Sidebar Content =====
export function SidebarContent({ children }: { children: ReactNode }) {
  return <nav className="py-4 space-y-1">{children}</nav>;
}

// ===== Sidebar Group (navigation) =====
export function SidebarGroup() {
  const pathname = usePathname();
  const [role, setRole] = useState<string | null>(null);
  const [processingOpen, setProcessingOpen] = useState(false);
  const [warehouseOpen, setWarehouseOpen] = useState(false);
  const [contractOpen, setContractOpen] = useState(false);
  const [orderOpen, setOrderOpen] = useState(false);
  const [customerOpen, setCustomerOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [staffOpen, setStaffOpen] = useState(false);

  useEffect(() => {
    const user = authService.getUser();
    if (user) {
      setRole(user.role);
    }
  }, []);

  const navigationItems: Record<
    string,
    { title: string; href: string; icon: JSX.Element }[]
  > = {
    farmer: [
      {
        title: "Tổng quan",
        href: "/dashboard/farmer",
        icon: iconMap.dashboard,
      },
      {
        title: "Sàn thu mua cà phê",
        href: "/dashboard/farmer/market-place",
        icon: iconMap.market,
      },
      {
        title: "Cam kết kế hoạch thu mua",
        href: "/dashboard/farmer/farming-commitments",
        icon: iconMap.contracts,
      },
      {
        title: "Mùa vụ",
        href: "/dashboard/farmer/crop-seasons",
        icon: iconMap.crops,
      },
      {
        title: "Tư vấn",
        href: "/dashboard/farmer/request-feedback",
        icon: iconMap.feedback,
      },
      {
        title: "Gửi yêu cầu giao hàng",
        href: "/dashboard/farmer/warehouse-request",
        icon: <FiTruck />,
      },
      {
        title: "Thông báo",
        href: "/dashboard/notifications",
        icon: <FiBell />,
      },
    ],
    admin: [
      { title: "Tổng quan", href: "/dashboard/admin", icon: iconMap.dashboard },
      {
        title: "Quản lý người dùng",
        href: "/dashboard/admin/users",
        icon: iconMap.users,
      },
      {
        title: "Quản lý chuyên gia",
        href: "/dashboard/admin/experts",
        icon: <FiUsers />,
      },
      {
        title: "Hợp đồng",
        href: "/dashboard/admin/contracts",
        icon: iconMap.contracts,
      },
      {
        title: "Báo cáo",
        href: "/dashboard/admin/reports",
        icon: iconMap.reports,
      },
      {
        title: "Cài đặt",
        href: "/dashboard/admin/settings",
        icon: iconMap.settings,
      },
      {
        title: "Thông báo",
        href: "/dashboard/notifications",
        icon: <FiBell />,
      },
    ],
    expert: [
      {
        title: "Tổng quan",
        href: "/dashboard/expert",
        icon: iconMap.dashboard,
      },
      {
        title: "Tư vấn",
        href: "/dashboard/expert/anomalies",
        icon: iconMap.consultation,
      },
      {
        title: "Đánh giá",
        href: "/dashboard/expert/evaluations",
        icon: <FiBarChart2 />,
      },
      {
        title: "Bài viết",
        href: "/dashboard/expert/articles",
        icon: iconMap.articles,
      },
      {
        title: "Thông báo",
        href: "/dashboard/notifications",
        icon: <FiBell />,
      },
    ],
    staff: [
      {
        title: "Tổng quan",
        href: "/dashboard/staff",
        icon: iconMap.dashboard,
      },
      // {
      //   title: "Yêu cầu nhập kho",
      //   href: "/dashboard/staff/inbounds",
      //   icon: <FiClipboard />,
      // },
      // {
      //   title: "Phiếu nhập kho",
      //   href: "/dashboard/staff/receipts",
      //   icon: <FiFileText />,
      // },
      // {
      //   title: "Tồn kho",
      //   href: "/dashboard/staff/inventories",
      //   icon: <FiPieChart />,
      // },
      {
        title: "Lô hàng",
        href: "/dashboard/staff/batches",
        icon: <FiBookOpen />,
      },
      // {
      //   title: "Kho hàng",
      //   href: "/dashboard/staff/warehouses",
      //   icon: <FiSettings />,
      // },
      // {
      //   title: "Yêu cầu xuất kho",
      //   href: "/dashboard/staff/outbounds",
      //   icon: <FiClipboard />,
      // },

      // {
      //   title: "Phiếu xuất kho",
      //   href: "/dashboard/staff/outbound-receipts",
      //   icon: <FiFileText />,
      // },
      {
        title: "Thông báo",
        href: "/dashboard/notifications",
        icon: <FiBell />,
      },
    ],
    manager: [
      {
        title: "Tổng quan",
        href: "/dashboard/manager",
        icon: iconMap.dashboard,
      },
      {
        title: "Mùa vụ",
        href: "/dashboard/manager/crop-seasons",
        icon: <FiClipboard />,
      },
      {
        title: "Báo cáo",
        href: "/dashboard/manager/reports",
        icon: <FiFileText />,
      },
      {
        title: "Tư vấn chuyên gia",
        href: "/dashboard/manager/expert-advice",
        icon: <FiMessageCircle />,
      },
      {
        title: "Thông báo",
        href: "/dashboard/notifications",
        icon: <FiBell />,
      },
    ],
  };

  if (!role || !navigationItems[role]) {
    return <div className="px-4 text-gray-400 text-sm">Đang tải menu...</div>;
  }

  return (
    <div className="space-y-1 px-2">
      {navigationItems[role].map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
              isActive
                ? "bg-orange-100 text-orange-700 shadow-sm"
                : "text-gray-600 hover:bg-orange-50 hover:text-orange-600"
            )}
          >
            <span className="shrink-0 w-5 text-center">{item.icon}</span>
            <span className="truncate">{item.title}</span>
          </Link>
        );
      })}
      {role === "farmer" && (
        <div>
          <button
            className={cn(
              "flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm font-medium w-full transition-all duration-200",
              pathname.startsWith("/dashboard/farmer/processing")
                ? "bg-orange-100 text-orange-700 shadow-sm"
                : "text-gray-600 hover:bg-orange-50 hover:text-orange-600"
            )}
            onClick={() => setProcessingOpen((v) => !v)}
          >
            <div className="flex items-center gap-2 overflow-hidden">
              <span className="shrink-0 w-5 text-center">
                {iconMap.articles}
              </span>
              <span className="truncate">Sơ chế</span>
            </div>
            <FiChevronDown
              className={cn("transition-transform duration-200", processingOpen && "rotate-180")}
            />
          </button>
          {processingOpen && (
            <div className="pl-8 space-y-1">
              <Link
                href="/dashboard/farmer/processing/batches"
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                  pathname.startsWith("/dashboard/farmer/processing/batches")
                    ? "bg-orange-100 text-orange-700 shadow-sm"
                    : "text-gray-600 hover:bg-orange-50 hover:text-orange-600"
                )}
              >
                Danh sách lô sơ chế
              </Link>
              <Link
                href="/dashboard/farmer/processing/progresses"
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                  pathname.startsWith("/dashboard/farmer/processing/progresses")
                    ? "bg-orange-100 text-orange-700 shadow-sm"
                    : "text-gray-600 hover:bg-orange-50 hover:text-orange-600"
                )}
              >
                Tiến trình lô sơ chế
              </Link>
              <Link
                href="/dashboard/farmer/processing/wastes"
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                  pathname.startsWith("/dashboard/farmer/processing/wastes")
                    ? "bg-orange-100 text-orange-700 shadow-sm"
                    : "text-gray-600 hover:bg-orange-50 hover:text-orange-600"
                )}
              >
                Chất thải lô sơ chế
              </Link>
            </div>
          )}
        </div>
      )}


      {/* Dropdown: HỢP ĐỒNG & GIAO HÀNG cho MANAGER */}
      {role === "manager" && (
        <div>
          <button
            className={cn(
              "flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm font-medium w-full transition-all duration-200",
              pathname.startsWith("/dashboard/manager/contracts") ||
                pathname.startsWith("/dashboard/manager/contract-delivery-batches") ||
                pathname.startsWith("/dashboard/manager/procurement-plans") ||
                pathname.startsWith("/dashboard/manager/farming-commitments")
                ? "bg-orange-100 text-orange-700 shadow-sm"
                : "text-gray-600 hover:bg-orange-50 hover:text-orange-600"
            )}
            onClick={() => setContractOpen((v) => !v)}
          >
            <div className="flex items-center gap-2 overflow-hidden">
              <span className="shrink-0 w-5 text-center">
                <FiFileText />
              </span>
              <span className="truncate">Hợp đồng & Giao hàng</span>
            </div>
            <FiChevronDown
              className={cn("transition-transform duration-200", contractOpen && "rotate-180")}
            />
          </button>
          {contractOpen && (
            <div className="pl-8 space-y-1">
              <Link
                href="/dashboard/manager/contracts"
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                  pathname === "/dashboard/manager/contracts"
                    ? "bg-orange-100 text-orange-700 shadow-sm"
                    : "text-gray-600 hover:bg-orange-50 hover:text-orange-600"
                )}
              >
                Hợp đồng cung ứng
              </Link>
              <Link
                href="/dashboard/manager/contract-delivery-batches"
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                  pathname === "/dashboard/manager/contract-delivery-batches"
                    ? "bg-orange-100 text-orange-700 shadow-sm"
                    : "text-gray-600 hover:bg-orange-50 hover:text-orange-600"
                )}
              >
                Lịch giao hàng
              </Link>
              <Link
                href="/dashboard/manager/procurement-plans"
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                  pathname === "/dashboard/manager/procurement-plans"
                    ? "bg-orange-100 text-orange-700 shadow-sm"
                    : "text-gray-600 hover:bg-orange-50 hover:text-orange-600"
                )}
              >
                Kế hoạch thu mua
              </Link>
              <Link
                href="/dashboard/manager/farming-commitments"
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                  pathname === "/dashboard/manager/farming-commitments"
                    ? "bg-orange-100 text-orange-700 shadow-sm"
                    : "text-gray-600 hover:bg-orange-50 hover:text-orange-600"
                )}
              >
                Cam kết kế hoạch thu mua
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Dropdown: ĐƠN HÀNG & GIAO HÀNG cho MANAGER */}
      {role === "manager" && (
        <div>
          <button
            className={cn(
              "flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm font-medium w-full transition-all duration-200",
              pathname.startsWith("/dashboard/manager/orders") ||
                pathname.startsWith("/dashboard/manager/shipments")
                ? "bg-orange-100 text-orange-700 shadow-sm"
                : "text-gray-600 hover:bg-orange-50 hover:text-orange-600"
            )}
            onClick={() => setOrderOpen((v) => !v)}
          >
            <div className="flex items-center gap-2 overflow-hidden">
              <span className="shrink-0 w-5 text-center">
                <FiShoppingCart />
              </span>
              <span className="truncate">Đơn hàng & Giao hàng</span>
            </div>
            <FiChevronDown
              className={cn("transition-transform duration-200", orderOpen && "rotate-180")}
            />
          </button>
          {orderOpen && (
            <div className="pl-8 space-y-1">
              <Link
                href="/dashboard/manager/orders"
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                  pathname === "/dashboard/manager/orders"
                    ? "bg-orange-100 text-orange-700 shadow-sm"
                    : "text-gray-600 hover:bg-orange-50 hover:text-orange-600"
                )}
              >
                Đơn hàng
              </Link>
              <Link
                href="/dashboard/manager/shipments"
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                  pathname === "/dashboard/manager/shipments"
                    ? "bg-orange-100 text-orange-700 shadow-sm"
                    : "text-gray-600 hover:bg-orange-50 hover:text-orange-600"
                )}
              >
                Lô giao hàng
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Dropdown: KHÁCH HÀNG & SẢN PHẨM cho MANAGER */}
      {role === "manager" && (
        <div>
          <button
            className={cn(
              "flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm font-medium w-full transition-all duration-200",
              pathname.startsWith("/dashboard/manager/business-buyers") ||
                pathname.startsWith("/dashboard/manager/products") ||
                pathname.startsWith("/dashboard/manager/farmers")
                ? "bg-orange-100 text-orange-700 shadow-sm"
                : "text-gray-600 hover:bg-orange-50 hover:text-orange-600"
            )}
            onClick={() => setCustomerOpen((v) => !v)}
          >
            <div className="flex items-center gap-2 overflow-hidden">
              <span className="shrink-0 w-5 text-center">
                <FiUsers />
              </span>
              <span className="truncate">Khách hàng & Sản phẩm</span>
            </div>
            <FiChevronDown
              className={cn("transition-transform duration-200", customerOpen && "rotate-180")}
            />
          </button>
          {customerOpen && (
            <div className="pl-8 space-y-1">
              <Link
                href="/dashboard/manager/business-buyers"
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                  pathname === "/dashboard/manager/business-buyers"
                    ? "bg-orange-100 text-orange-700 shadow-sm"
                    : "text-gray-600 hover:bg-orange-50 hover:text-orange-600"
                )}
              >
                Khách hàng doanh nghiệp
              </Link>
              <Link
                href="/dashboard/manager/products"
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                  pathname === "/dashboard/manager/products"
                    ? "bg-orange-100 text-orange-700 shadow-sm"
                    : "text-gray-600 hover:bg-orange-50 hover:text-orange-600"
                )}
              >
                Sản phẩm
              </Link>
              <Link
                href="/dashboard/manager/farmers"
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                  pathname === "/dashboard/manager/farmers"
                    ? "bg-orange-100 text-orange-700 shadow-sm"
                    : "text-gray-600 hover:bg-orange-50 hover:text-orange-600"
                )}
              >
                Nông dân
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Dropdown: BÁO CÁO & CHẾ BIẾN cho MANAGER */}
      {role === "manager" && (
        <div>
          <button
            className={cn(
              "flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm font-medium w-full transition-all duration-200",
              pathname.startsWith("/dashboard/manager/reports") ||
                pathname.startsWith("/dashboard/manager/processing") ||
                pathname === "/dashboard/manager/processing/farmer-batches"
                ? "bg-orange-100 text-orange-700 shadow-sm"
                : "text-gray-600 hover:bg-orange-50 hover:text-orange-600"
            )}
            onClick={() => setReportOpen((v) => !v)}
          >
            <div className="flex items-center gap-2 overflow-hidden">
              <span className="shrink-0 w-5 text-center">
                <FiBarChart2 />
              </span>
              <span className="truncate">Báo cáo & Chế biến</span>
            </div>
            <FiChevronDown
              className={cn("transition-transform duration-200", reportOpen && "rotate-180")}
            />
          </button>
          {reportOpen && (
            <div className="pl-8 space-y-1">
              <Link
                href="/dashboard/manager/reports"
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                  pathname === "/dashboard/manager/reports"
                    ? "bg-orange-100 text-orange-700 shadow-sm"
                    : "text-gray-600 hover:bg-orange-50 hover:text-orange-600"
                )}
              >
                Báo cáo
              </Link>
              <Link
                href="/dashboard/manager/processing/batches"
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                  pathname === "/dashboard/manager/processing/batches"
                    ? "bg-orange-100 text-orange-700 shadow-sm"
                    : "text-gray-600 hover:bg-orange-50 hover:text-orange-600"
                )}
              >
                Danh sách lô chế biến
              </Link>
              <Link
                href="/dashboard/manager/processing/farmer-batches"
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                  pathname === "/dashboard/manager/processing/farmer-batches"
                    ? "bg-orange-100 text-orange-700 shadow-sm"
                    : "text-gray-600 hover:bg-orange-50 hover:text-orange-600"
                )}
              >
                Lô chế biến theo nông dân
              </Link>

              <Link
                href="/dashboard/manager/processing/progresses"
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                  pathname.startsWith("/dashboard/manager/processing/progresses")
                    ? "bg-orange-100 text-orange-700 shadow-sm"
                    : "text-gray-600 hover:bg-orange-50 hover:text-orange-600"
                )}
              >
                Tiến trình lô chế biến
              </Link>
              <Link
                href="/dashboard/manager/processing/wastes"
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                  pathname.startsWith("/dashboard/manager/processing/wastes")
                    ? "bg-orange-100 text-orange-700 shadow-sm"
                    : "text-gray-600 hover:bg-orange-50 hover:text-orange-600"
                )}
              >
                Chất thải lô chế biến
              </Link>
              <Link
                href="/dashboard/manager/processing/methods"
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                  pathname.startsWith("/dashboard/manager/processing/methods")
                    ? "bg-orange-100 text-orange-700 shadow-sm"
                    : "text-gray-600 hover:bg-orange-50 hover:text-orange-600"
                )}
              >
                Phương pháp chế biến
              </Link>
              <Link
                href="/dashboard/manager/processing/parameters"
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                  pathname.startsWith("/dashboard/manager/processing/parameters")
                    ? "bg-orange-100 text-orange-700 shadow-sm"
                    : "text-gray-600 hover:bg-orange-50 hover:text-orange-600"
                )}
              >
                Tham số chế biến
              </Link>
              <Link
                href="/dashboard/manager/processing/stages"
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                  pathname.startsWith("/dashboard/manager/processing/stages")
                    ? "bg-orange-100 text-orange-700 shadow-sm"
                    : "text-gray-600 hover:bg-orange-50 hover:text-orange-600"
                )}
              >
                Công đoạn chế biến
              </Link>
              <Link
                href="/dashboard/manager/processing/waste-disposals"
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                  pathname.startsWith("/dashboard/manager/processing/waste-disposals")
                    ? "bg-orange-100 text-orange-700 shadow-sm"
                    : "text-gray-600 hover:bg-orange-50 hover:text-orange-600"
                )}
              >
                Xử lý chất thải lô chế biến
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Dropdown: QUẢN LÝ NHÂN VIÊN cho MANAGER */}
      {role === "manager" && (
        <div>
          <button
            className={cn(
              "flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm font-medium w-full transition-all duration-200",
              pathname.startsWith("/dashboard/manager/business-staffs")
                ? "bg-orange-100 text-orange-700 shadow-sm"
                : "text-gray-600 hover:bg-orange-50 hover:text-orange-600"
            )}
            onClick={() => setStaffOpen((v) => !v)}
          >
            <div className="flex items-center gap-2 overflow-hidden">
              <span className="shrink-0 w-5 text-center">
                <FiUsers />
              </span>
              <span className="truncate">Quản lý nhân viên</span>
            </div>
            <FiChevronDown
              className={cn("transition-transform duration-200", staffOpen && "rotate-180")}
            />
          </button>
          {staffOpen && (
            <div className="pl-8 space-y-1">
              <Link
                href="/dashboard/manager/business-staffs"
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                  pathname === "/dashboard/manager/business-staffs"
                    ? "bg-orange-100 text-orange-700 shadow-sm"
                    : "text-gray-600 hover:bg-orange-50 hover:text-orange-600"
                )}
              >
                Danh sách nhân viên
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Dropdown: QUẢN LÝ KHO cho MANAGER */}
      {role === "manager" && (
        <>
          {(() => {
            const warehouseLinks = [
              {
                label: "Kho hàng",
                href: "/dashboard/manager/warehouses",
                activeMatch: (path: string) =>
                  path === "/dashboard/manager/warehouses",
              },
              {
                label: "Tồn kho",
                href: "/dashboard/manager/inventories",
                activeMatch: (path: string) =>
                  path.startsWith("/dashboard/manager/inventories"),
              },
              {
                label: "Lịch sử tồn kho",
                href: "/dashboard/manager/inventory-logs",
                activeMatch: (path: string) =>
                  path.startsWith("/dashboard/manager/inventory-logs"),
              },
              {
                label: "Yêu cầu xuất kho",
                href: "/dashboard/manager/warehouse-request",
                activeMatch: (path: string) =>
                  path === "/dashboard/manager/warehouse-request",
              },
            ];

            const isDropdownActive = warehouseLinks.some((item) =>
              item.activeMatch(pathname)
            );

            return (
              <div>
                <button
                  className={cn(
                    "flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm font-medium w-full transition-all duration-200",
                    isDropdownActive
                      ? "bg-orange-100 text-orange-700 shadow-sm"
                      : "text-gray-600 hover:bg-orange-50 hover:text-orange-600"
                  )}
                  onClick={() => setWarehouseOpen((v) => !v)}
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className="shrink-0 w-5 text-center">
                      <FiSettings />
                    </span>
                    <span className="truncate">Quản lý kho</span>
                  </div>
                  <FiChevronDown
                    className={cn("transition-transform duration-200", warehouseOpen && "rotate-180")}
                  />
                </button>

                {warehouseOpen && (
                  <div className="pl-8 space-y-1">
                    {warehouseLinks.map(({ label, href, activeMatch }) => (
                      <Link
                        key={href}
                        href={href}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                          activeMatch(pathname)
                            ? "bg-orange-100 text-orange-700 shadow-sm"
                            : "text-gray-600 hover:bg-orange-50 hover:text-orange-600"
                        )}
                      >
                        {label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}
        </>
      )}

      {role === "staff" && (
        <>
          {/* --- Dropdown: VẬN HÀNH KHO --- */}
          {(() => {
            const operationLinks = [
              {
                label: "Yêu cầu nhập kho",
                href: "/dashboard/staff/inbounds",
                activeMatch: (path: string) =>
                  path === "/dashboard/staff/inbounds",
              },
              {
                label: "Phiếu nhập kho",
                href: "/dashboard/staff/receipts",
                activeMatch: (path: string) =>
                  path === "/dashboard/staff/receipts",
              },
              {
                label: "Yêu cầu xuất kho",
                href: "/dashboard/staff/outbounds",
                activeMatch: (path: string) =>
                  path === "/dashboard/staff/outbounds",
              },
              {
                label: "Phiếu xuất kho",
                href: "/dashboard/staff/outbound-receipts",
                activeMatch: (path: string) =>
                  path === "/dashboard/staff/outbound-receipts",
              },
            ];

            const isOperationActive = operationLinks.some((item) =>
              item.activeMatch(pathname)
            );

            return (
              <div>
                <button
                  className={cn(
                    "flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm font-medium w-full transition-all duration-200",
                    isOperationActive
                      ? "bg-orange-100 text-orange-700 shadow-sm"
                      : "text-gray-600 hover:bg-orange-50 hover:text-orange-600"
                  )}
                  onClick={() => setProcessingOpen((v) => !v)}
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className="shrink-0 w-5 text-center">
                      <FiClipboard />
                    </span>
                    <span className="truncate">Vận hành kho</span>
                  </div>
                  <FiChevronDown
                    className={cn("transition-transform duration-200", processingOpen && "rotate-180")}
                  />
                </button>

                {processingOpen && (
                  <div className="pl-8 space-y-1">
                    {operationLinks.map(({ label, href, activeMatch }) => (
                      <Link
                        key={href}
                        href={href}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                          activeMatch(pathname)
                            ? "bg-orange-100 text-orange-700 shadow-sm"
                            : "text-gray-600 hover:bg-orange-50 hover:text-orange-600"
                        )}
                      >
                        {label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}

          {/* --- Dropdown: QUẢN LÝ KHO --- */}
          {(() => {
            const warehouseLinks = [
              {
                label: "Tồn kho",
                href: "/dashboard/staff/inventories",
                activeMatch: (path: string) =>
                  path === "/dashboard/staff/inventories",
              },
              {
                label: "Nhật ký tồn kho",
                href: "/dashboard/staff/inventory-logs",
                activeMatch: (path: string) =>
                  path.startsWith("/dashboard/staff/inventory-logs"),
              },
              {
                label: "Kho hàng",
                href: "/dashboard/staff/warehouses",
                activeMatch: (path: string) =>
                  path.startsWith("/dashboard/staff/warehouses"),
              },
            ];

            const isDropdownActive = warehouseLinks.some((item) =>
              item.activeMatch(pathname)
            );

            return (
              <div>
                <button
                  className={cn(
                    "flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm font-medium w-full transition-all duration-200",
                    isDropdownActive
                      ? "bg-orange-100 text-orange-700 shadow-sm"
                      : "text-gray-600 hover:bg-orange-50 hover:text-orange-600"
                  )}
                  onClick={() => setWarehouseOpen((v) => !v)}
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className="shrink-0 w-5 text-center">
                      <FiSettings />
                    </span>
                    <span className="truncate">Quản lý kho</span>
                  </div>
                  <FiChevronDown
                    className={cn("transition-transform duration-200", warehouseOpen && "rotate-180")}
                  />
                </button>

                {warehouseOpen && (
                  <div className="pl-8 space-y-1">
                    {warehouseLinks.map(({ label, href, activeMatch }) => (
                      <Link
                        key={href}
                        href={href}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                          activeMatch(pathname)
                            ? "bg-orange-100 text-orange-700 shadow-sm"
                            : "text-gray-600 hover:bg-orange-50 hover:text-orange-600"
                        )}
                      >
                        {label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}
        </>
      )}
    </div>
  );
}

// ===== Sidebar Footer =====
interface SidebarFooterProps {
  role?: string | null;
  isCollapsed?: boolean;
}

export function SidebarFooter({ isCollapsed }: SidebarFooterProps) {
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    const user = authService.getUser();
    if (user) {
      setUserName(user.name);
    }
  }, []);

  if (isCollapsed) return null;

  return (
    <div className="border-t border-orange-100 px-4 py-3 text-sm text-gray-600">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-gray-400">Xin chào:</span>
        <span className="font-medium text-orange-600">
          {userName ?? "Ẩn danh"}
        </span>
      </div>
      <button
        onClick={() => {
          authService.logout();
        }}
        className="text-red-600 text-sm hover:underline transition-all"
        title="Đăng xuất và về trang chính"
      >
        Đăng xuất
      </button>
    </div>
  );
}

// Add displayName for proper component identification
SidebarFooter.displayName = "SidebarFooter";
