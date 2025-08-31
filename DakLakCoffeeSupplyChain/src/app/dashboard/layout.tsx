'use client';

import dynamic from 'next/dynamic';
import HeaderDashboard from "@/components/layout/HeaderDashboard";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
} from "@/components/ui/sidebar";
import { useState, useEffect } from "react";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { authService } from "@/lib/auth/authService";
import { roleRawToDisplayName } from "@/lib/constants/role";

// Dynamic import để tránh SSR cho sidebar
const DynamicSidebarGroup = dynamic(() => Promise.resolve(SidebarGroup), { ssr: false });
const DynamicSidebarFooter = dynamic(() => Promise.resolve(SidebarFooter), { ssr: false });

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const user = authService.getUser();
    if (user) {
      // Sử dụng roleRawToDisplayName để hiển thị tên tiếng Việt
      setRole(roleRawToDisplayName[user.roleRaw] || user.roleRaw);
    }
  }, []);

  return (
    <NotificationProvider>
      <div className="flex h-screen w-full bg-[#fefaf4]">
        <Sidebar defaultCollapsed={isCollapsed} onCollapseChange={setIsCollapsed}>
          <SidebarContent>
            <DynamicSidebarGroup />
          </SidebarContent>
          <DynamicSidebarFooter role={role} />
        </Sidebar>

        <div
          className={`flex flex-col flex-1 min-w-0 transition-all duration-300 ${isCollapsed ? "ml-[64px]" : "ml-[260px]"
            }`}
        >
          <div className="shrink-0">
            <HeaderDashboard />
          </div>
          <div className="flex-1 p-6 bg-orange-50 overflow-auto">
            {children}
          </div>
        </div>
      </div>
    </NotificationProvider>
  );
}
