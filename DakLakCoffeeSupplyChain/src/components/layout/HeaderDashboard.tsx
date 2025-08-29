"use client";

import { usePathname, useRouter } from "next/navigation";
import { useMemo, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FiSearch } from "react-icons/fi";
import NotificationBell from "@/components/notifications/NotificationBell";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { Input } from "@/components/ui/input";
import { roleRawToDisplayName } from "@/lib/constants/role";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { LogOut, User, Settings } from "lucide-react";
import { authService } from "@/lib/auth/authService";



export default function HeaderDashboard() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const router = useRouter();

  // Function để lấy title theo ngôn ngữ - di chuyển vào trong component để có thể sử dụng t()
  const getPathTitle = (key: string) => {
    const titleMap: Record<string, string> = {
      dashboard: t('sidebar.dashboard'),
      farmer: t('sidebar.dashboard'),
      admin: t('sidebar.dashboard'),
      manager: t('sidebar.dashboard'),
      staff: t('sidebar.dashboard'),
      "warehouse-request": t('sidebar.warehouseRequest'),
      "outbound-requests": t('sidebar.outboundRequests'),
      "inbound-requests": t('sidebar.inboundRequests'),
      "outbound-receipts": t('sidebar.outboundReceipts'),
      "inbound-receipts": t('sidebar.inboundReceipts'),
      "procurement-plans": t('sidebar.procurementPlans'),
      "farming-commitments": t('sidebar.commitments'),
      "crop-seasons": t('sidebar.cropSeasons'),
      batches: t('sidebar.batches'),
      evaluations: t('sidebar.evaluations'),
      progresses: t('sidebar.progress'),
      wastes: t('sidebar.waste'),
      "processing-methods": t('sidebar.processingMethods'),
      parameters: t('sidebar.parameters'),
      stages: t('sidebar.stages'),
      "waste-disposals": t('sidebar.wasteDisposals'),
      "request-feedback": t('sidebar.requestFeedback'),
      consultations: t('sidebar.consultation'),
      articles: t('sidebar.articles'),
      contracts: t('sidebar.contracts'),
      "business-buyers": t('sidebar.businessBuyers'),
      orders: t('sidebar.orders'),
      shipments: t('sidebar.shipments'),
      "contract-delivery-batches": t('sidebar.deliveries'),
      products: t('sidebar.products'),
      reports: t('sidebar.reports'),
      users: t('sidebar.users'),
      settings: t('sidebar.settings'),
      create: t('common.create'),
      edit: t('common.edit'),
      "Chi tiết": t('common.details'),
    };
    return titleMap[key] || key;
  };

  const [userName, setUserName] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [avatar, setAvatar] = useState<string | null>(null);

  useEffect(() => {
    const user = authService.getUser();
    if (user) {
      setUserName(user.name);
      // Sử dụng roleRawToDisplayName để hiển thị tên tiếng Việt
      const displayRole = roleRawToDisplayName[user.roleRaw] || user.roleRaw;
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
      return getPathTitle(last);
    }

    // Nếu segment cuối là "edit"
    if (last === "edit") {
      return getPathTitle(last);
    }

    // Nếu segment cuối là một ID (không nằm trong map) và có segment trước đó
    if (secondLast && !getPathTitle(last)) {
      return getPathTitle(secondLast)
        ? `${getPathTitle(secondLast)} - ${t('common.details')}`
        : t('common.details');
    }

    // Trường hợp thông thường
    return getPathTitle(last) || t('sidebar.dashboard');
  }, [pathname, t]);

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

      {/* Search - Removed as per UI requirements */}

      {/* Icons + Avatar + Dropdown */}
      <div className="flex items-center gap-4">
        <NotificationBell />

        <div className="w-px h-8 bg-gray-200"></div>

        <LanguageSwitcher />

        <div className="w-px h-8 bg-gray-200"></div>

        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <div className="flex items-center gap-3 cursor-pointer hover:bg-orange-50 rounded-lg p-2 transition-colors duration-200">
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-800">
                  {userName ?? t('common.anonymous')}
                </p>
                <p className="text-xs text-gray-500">
                  {userRole ?? t('common.unknownRole')}
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
                       {userName ?? t('common.anonymous')}
                     </p>
                     <p className="text-xs text-gray-500">
                       {userRole ?? t('common.unknownRole')}
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
                <span>{t('sidebar.profile')}</span>
              </DropdownMenu.Item>

              <DropdownMenu.Item
                className="px-3 py-2 hover:bg-orange-50 rounded-lg flex items-center gap-3 cursor-pointer transition-colors duration-200"
                onClick={() => router.push("/dashboard/settings")}
              >
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Settings size={16} className="text-blue-600" />
                </div>
                <span>{t('sidebar.settings')}</span>
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
                <span>{t('sidebar.logout')}</span>
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </div>
  );
}
