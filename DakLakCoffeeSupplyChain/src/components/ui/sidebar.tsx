"use client";

import { JSX, ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Menu } from "lucide-react";
import React from "react";
import { authService } from "@/lib/auth/authService";
import { useTranslation } from 'react-i18next';
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
        "flex flex-col fixed left-0 top-0 z-30"
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
          title={isCollapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
          aria-label={isCollapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
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
  const { t } = useTranslation();
  const pathname = usePathname();
  const [role, setRole] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [processingOpen, setProcessingOpen] = useState(false);
  const [warehouseOpen, setWarehouseOpen] = useState(false);
  const [contractOpen, setContractOpen] = useState(false);
  const [orderOpen, setOrderOpen] = useState(false);
  const [customerOpen, setCustomerOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [staffOpen, setStaffOpen] = useState(false);

  useEffect(() => {
    setIsClient(true);
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
        title: t('sidebar.navigation.farmer.dashboard'),
        href: "/dashboard/farmer",
        icon: iconMap.dashboard,
      },
      {
        title: t('sidebar.farmer.coffeeMarket'),
        title: t('sidebar.navigation.farmer.coffeeProcurementFloor'),
        href: "/dashboard/farmer/market-place",
        icon: iconMap.market,
      },
      {
        title: t('sidebar.farmer.commitment'),
        title: t('sidebar.navigation.farmer.procurementPlanCommitment'),
        href: "/dashboard/farmer/farming-commitments",
        icon: iconMap.contracts,
      },
      {
        title: t('sidebar.farmer.cropSeasons'),
        title: t('sidebar.navigation.farmer.cropSeasons'),
        href: "/dashboard/farmer/crop-seasons",
        icon: iconMap.crops,
      },
      {
        title: t('sidebar.farmer.consultation'),
        title: t('sidebar.navigation.farmer.consultation'),
        href: "/dashboard/farmer/request-feedback",
        icon: iconMap.feedback,
      },
      {
        title: t('sidebar.farmer.deliveryRequest'),
        title: t('sidebar.navigation.farmer.sendDeliveryRequest'),
        href: "/dashboard/farmer/warehouse-request",
        icon: <FiTruck />,
      },
      {
        title: t('sidebar.navigation.notifications'),
        href: "/dashboard/notifications",
        icon: <FiBell />,
      },
    ],
    admin: [
      { title: t('sidebar.navigation.overview'), href: "/dashboard/admin", icon: iconMap.dashboard },
      {
        title: t('sidebar.admin.userManagement'),
        href: "/dashboard/admin/users",
        icon: iconMap.users,
      },
      {
        title: t('sidebar.admin.expertManagement'),
        href: "/dashboard/admin/experts",
        icon: <FiUsers />,
      },
      {
        title: t('sidebar.admin.farmerManagement'),
        href: "/dashboard/admin/farmers",
        icon: <FiUsers />,
      },
      {
        title: t('sidebar.admin.contracts'),
        href: "/dashboard/admin/contracts",
        icon: iconMap.contracts,
      },
      {
        title: t('sidebar.admin.reports'),
        href: "/dashboard/admin/reports",
        icon: iconMap.reports,
      },
      {
        title: t('sidebar.admin.settings'),
        href: "/dashboard/admin/settings",
        icon: iconMap.settings,
      },
      {
        title: t('sidebar.navigation.notifications'),
        href: "/dashboard/notifications",
        icon: <FiBell />,
      },
    ],
    expert: [
      {
        title: t('sidebar.navigation.overview'),
        href: "/dashboard/expert",
        icon: iconMap.dashboard,
      },
      {
        title: t('sidebar.expert.consultation'),
        href: "/dashboard/expert/anomalies",
        icon: iconMap.consultation,
      },
      {
        title: t('sidebar.expert.evaluations'),
        href: "/dashboard/expert/evaluations",
        icon: <FiBarChart2 />,
      },
      {
        title: t('sidebar.expert.articles'),
        href: "/dashboard/expert/articles",
        icon: iconMap.articles,
      },
      {
        title: t('sidebar.navigation.notifications'),
        href: "/dashboard/notifications",
        icon: <FiBell />,
      },
    ],
    staff: [
      {
        title: t('sidebar.navigation.overview'),
        href: "/dashboard/staff",
        icon: iconMap.dashboard,
      },
      {
        title: t('sidebar.navigation.batches'),
        href: "/dashboard/staff/batches",
        icon: <FiBookOpen />,
      },
      {
        title: t('sidebar.navigation.notifications'),
        href: "/dashboard/notifications",
        icon: <FiBell />,
      },
    ],
    manager: [
      {
        title: t('sidebar.manager.overview'),
        title: t('sidebar.navigation.manager.dashboard'),
        href: "/dashboard/manager",
        icon: iconMap.dashboard,
      },
      {
        title: t('sidebar.manager.cropSeasons'),
        title: t('sidebar.navigation.manager.cropSeasons'),
        href: "/dashboard/manager/crop-seasons",
        icon: <FiClipboard />,
      },
      {
        title: t('sidebar.manager.reports'),
        title: t('sidebar.navigation.manager.reports'),
        href: "/dashboard/manager/reports",
        icon: <FiFileText />,
      },
      {
        title: t('sidebar.manager.expertAdvice'),

        title: t('sidebar.navigation.manager.expertAdvice'),
        href: "/dashboard/manager/expert-advice",
        icon: <FiMessageCircle />,
      },
      {
        title: t('sidebar.manager.notifications'),
        title: t('sidebar.navigation.manager.notifications'),
        href: "/dashboard/notifications",
        icon: <FiBell />,
      },
    ],
  };

  if (!isClient || !role || !navigationItems[role]) {
    return <div className="px-4 text-gray-400 text-sm" suppressHydrationWarning>{t('sidebar.loading')}</div>;
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
              <span className="truncate">{t('sidebar.farmer.processing')}</span>
            </div>

                         <div className="flex items-center gap-2 overflow-hidden">
               <span className="shrink-0 w-5 text-center">
                 {iconMap.articles}
               </span>
               <span className="truncate">{t('sidebar.navigation.farmer.processing')}</span>
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
                {t('sidebar.farmer.processingBatches')}
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
                {t('sidebar.farmer.processingProgress')}
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
                {t('sidebar.farmer.processingWastes')}
              </Link>
                             <Link
                 href="/dashboard/farmer/processing/batches"
                 className={cn(
                   "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                   pathname.startsWith("/dashboard/farmer/processing/batches")
                     ? "bg-orange-100 text-orange-700 shadow-sm"
                     : "text-gray-600 hover:bg-orange-50 hover:text-orange-600"
                 )}
               >
                 {t('sidebar.navigation.farmer.processingBatches')}
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
                 {t('sidebar.navigation.farmer.processingProgress')}
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
                 {t('sidebar.navigation.farmer.processingWaste')}
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
              <span className="truncate">{t('sidebar.manager.contractsDelivery')}</span>
              <span className="truncate">{t('sidebar.navigation.manager.contractsAndDelivery')}</span>
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
                {t('sidebar.manager.supplyContracts')}
                {t('sidebar.navigation.manager.supplyContracts')}
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
                {t('sidebar.manager.deliverySchedule')}
                {t('sidebar.navigation.manager.deliverySchedule')}
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
                {t('sidebar.manager.procurementPlans')}
                {t('sidebar.navigation.manager.procurementPlans')}
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
                {t('sidebar.manager.farmingCommitments')}
                {t('sidebar.navigation.manager.procurementCommitments')}
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
              <span className="truncate">{t('sidebar.manager.ordersDelivery')}</span>
              <span className="truncate">{t('sidebar.navigation.manager.ordersAndDelivery')}</span>
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
                {t('sidebar.manager.orders')}
                {t('sidebar.navigation.manager.orders')}
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
                {t('sidebar.manager.deliveryBatches')}
                {t('sidebar.navigation.manager.deliveryBatches')}
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
              <span className="truncate">{t('sidebar.manager.customersProducts')}</span>
              <span className="truncate">{t('sidebar.navigation.manager.customersAndProducts')}</span>
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
                {t('sidebar.manager.businessCustomers')}
                {t('sidebar.navigation.manager.businessCustomers')}
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
                {t('sidebar.manager.products')}

                {t('sidebar.navigation.manager.products')}
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
                {t('sidebar.manager.farmers')}
                {t('sidebar.navigation.manager.farmers')}
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
              <span className="truncate">{t('sidebar.manager.reportsProcessing')}</span>

              <span className="truncate">{t('sidebar.navigation.manager.reportsAndProcessing')}</span>
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
                {t('sidebar.manager.reports')}
                {t('sidebar.navigation.manager.reports')}
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
                {t('sidebar.manager.processingBatches')}
                {t('sidebar.navigation.manager.processingBatches')}
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
                {t('sidebar.manager.farmerProcessingBatches')}
                {t('sidebar.navigation.manager.farmerProcessingBatches')}
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
                {t('sidebar.navigation.manager.processingProgress')}
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
                {t('sidebar.navigation.manager.processingWaste')}
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
                {t('sidebar.navigation.manager.processingMethods')}
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
                {t('sidebar.navigation.manager.processingParameters')}
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
                {t('sidebar.navigation.manager.processingStages')}
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
                {t('sidebar.navigation.manager.wasteDisposal')}
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
              <span className="truncate">{t('sidebar.manager.staffManagement')}</span>

              <span className="truncate">{t('sidebar.navigation.manager.staffManagement')}</span>
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
                {t('sidebar.manager.staffList')}
                {t('sidebar.navigation.manager.staffList')}
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
                label: t('sidebar.navigation.manager.warehouses'),
                href: "/dashboard/manager/warehouses",
                activeMatch: (path: string) =>
                  path === "/dashboard/manager/warehouses",
              },
              {
                label: t('sidebar.navigation.manager.inventories'),
                href: "/dashboard/manager/inventories",
                activeMatch: (path: string) =>
                  path.startsWith("/dashboard/manager/inventories"),
              },
              {
                label: t('sidebar.navigation.manager.inventoryHistory'),
                href: "/dashboard/manager/inventory-logs",
                activeMatch: (path: string) =>
                  path.startsWith("/dashboard/manager/inventory-logs"),
              },
              {
                label: t('sidebar.navigation.manager.outboundRequests'),
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
                    <span className="truncate">{t('sidebar.navigation.warehouseManagement')}</span>
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
                label: t('sidebar.navigation.inboundRequests'),
                href: "/dashboard/staff/inbounds",
                activeMatch: (path: string) =>
                  path === "/dashboard/staff/inbounds",
              },
              {
                label: t('sidebar.navigation.inboundReceipts'),
                href: "/dashboard/staff/receipts",
                activeMatch: (path: string) =>
                  path === "/dashboard/staff/receipts",
              },
              {
                label: t('sidebar.navigation.outboundRequests'),
                href: "/dashboard/staff/outbounds",
                activeMatch: (path: string) =>
                  path === "/dashboard/staff/outbounds",
              },
              {
                label: t('sidebar.navigation.outboundReceipts'),
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
                    <span className="truncate">{t('sidebar.navigation.warehouseOperations')}</span>
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
                label: t('sidebar.navigation.inventories'),
                href: "/dashboard/staff/inventories",
                activeMatch: (path: string) =>
                  path === "/dashboard/staff/inventories",
              },
              {
                label: t('sidebar.navigation.inventoryLogs'),
                href: "/dashboard/staff/inventory-logs",
                activeMatch: (path: string) =>
                  path.startsWith("/dashboard/staff/inventory-logs"),
              },
              {
                label: t('sidebar.navigation.warehouses'),
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
                    <span className="truncate">{t('sidebar.navigation.warehouseManagement')}</span>
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
  const { t } = useTranslation();
  const [userName, setUserName] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const user = authService.getUser();
    if (user) {
      setUserName(user.name);
    }
  }, []);

  if (isCollapsed) return null;

  if (!isClient) {
    return <div className="border-t border-orange-100 px-4 py-3 text-sm text-gray-600" suppressHydrationWarning>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-gray-400">Loading...</span>
      </div>
    </div>;
  }

  return (
    <div className="border-t border-orange-100 px-4 py-3 text-sm text-gray-600" suppressHydrationWarning>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-gray-400">{t('sidebar.user.greeting')}</span>
        <span className="font-medium text-orange-600">
          {userName ?? t('sidebar.user.anonymous')}
        </span>
      </div>
      <button
        onClick={() => {
          authService.logout();
        }}
        className="text-red-600 text-sm hover:underline transition-all"
        title={t('sidebar.user.logoutTitle')}
      >
        {t('sidebar.user.logout')}
      </button>
    </div>
  );
}

// Add displayName for proper component identification
SidebarFooter.displayName = "SidebarFooter";
