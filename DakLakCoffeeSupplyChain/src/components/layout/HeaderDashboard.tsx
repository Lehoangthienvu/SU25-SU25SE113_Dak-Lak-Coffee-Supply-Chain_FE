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
  const [searchQuery, setSearchQuery] = useState("");

  // Test: Kiểm tra xem common.details có hoạt động không
  console.log('🔍 Testing translations:');
  console.log('  - common.details:', t('common.details'));
  console.log('  - common.search:', t('common.search'));
  console.log('  - common.create:', t('common.create'));
  console.log('  - common.edit:', t('common.edit'));
  console.log('  - sidebar.navigation.cropSeasons:', t('sidebar.navigation.cropSeasons'));

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
      "crop-seasons": t('sidebar.navigation.cropSeasons'),
      "crop-progress": t('sidebar.navigation.cropProgress'),
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
      inbounds: t('sidebar.inboundRequests'),
      inventories: t('sidebar.navigation.inventories'),
      warehouses: t('sidebar.navigation.warehouses'),
      outbounds: t('sidebar.outboundRequests'),
      receipts: t('sidebar.inboundReceipts'),
      "outbound-receipts": t('sidebar.outboundReceipts'),
      "inventory-logs": t('sidebar.navigation.inventoryLogs'),
      processing: t('sidebar.batches'),
      farmers: t('sidebar.farmer'),
      "crop-seasons": t('sidebar.navigation.cropSeasons'),
      "farming-commitments": t('sidebar.commitments'),
      "business-staffs": t('sidebar.navigation.staffManagement'),
      methods: t('sidebar.processingMethods'),
      parameters: t('sidebar.parameters'),
      stages: t('sidebar.stages'),
      "waste-disposals": t('sidebar.wasteDisposals'),
      anomalies: t('sidebar.navigation.expertAdvice'),
      batches: t('sidebar.batches'),
      marketplace: t('sidebar.navigation.coffeeMarketplace'),
      "market-place": t('sidebar.navigation.coffeeMarketplace'),
      reports: t('sidebar.reports'),
      progresses: t('sidebar.progress'),
      wastes: t('sidebar.waste'),
      methods: t('sidebar.processingMethods'),
      parameters: t('sidebar.parameters'),
      stages: t('sidebar.stages'),
      "waste-disposals": t('sidebar.wasteDisposals'),
      batches: t('sidebar.batches'),
      "processing/batches": t('sidebar.batches'),
      "processing/progresses": t('sidebar.progress'),
      "processing/wastes": t('sidebar.waste'),
      "processing/methods": t('sidebar.processingMethods'),
      "processing/parameters": t('sidebar.parameters'),
      "processing/stages": t('sidebar.stages'),
      "processing/waste-disposals": t('sidebar.wasteDisposals'),
      "processing/reports": t('sidebar.reports'),
      logs: t('sidebar.navigation.inventoryLogs'),
      create: t('common.create'),
      edit: t('common.edit'),
      details: t('common.details'),
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

    // Kiểm tra nếu có segment "create" hoặc "edit" hoặc ID
    const last = segments[segments.length - 1];
    const secondLast = segments[segments.length - 2];

    // Nếu segment cuối là "create"
    if (last === "create") {
      const title = getPathTitle(last);
      return title;
    }

    // Nếu segment cuối là "edit"
    if (last === "edit") {
      const title = getPathTitle(last);
      return title;
    }

    // Kiểm tra xem segment cuối có phải là UUID không (ID có dạng 8-4-4-4-12 ký tự)
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(last);

    // Nếu segment cuối là một ID (UUID) và có segment trước đó
    if (secondLast && isUUID) {
      const secondLastTitle = getPathTitle(secondLast);
      const detailsTitle = t('common.details');
      const finalTitle = secondLastTitle
        ? `${secondLastTitle} - ${detailsTitle}`
        : detailsTitle;
      return finalTitle;
    }

    // Trường hợp thông thường
    const normalTitle = getPathTitle(last) || t('sidebar.dashboard');
    return normalTitle;
  }, [pathname, t]);

  const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    userName ?? "U"
  )}&background=FD7622&color=fff`;

  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-orange-100 bg-white shadow-sm relative z-40">
      {/* Title */}
      <div className="flex items-center gap-3">
        <div className="w-1 h-8 bg-gradient-to-b from-orange-500 to-amber-500 rounded-full"></div>
        <h1 className="text-2xl font-bold text-gray-800">{currentTitle}</h1>
      </div>

      {/* Search Bar */}
      <div className="flex-1 max-w-md mx-8">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder={t('common.search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 border-gray-300 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
          />
        </div>
      </div>

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
