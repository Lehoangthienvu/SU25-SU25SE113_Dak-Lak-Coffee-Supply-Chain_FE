"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import Link from "next/link";
import {
  getAllManagers,
  deleteManager,
  BusinessManagerDto,
} from "@/lib/api/businessManager";
import { verifyBusinessManagerAccount } from "@/lib/api/auth";
import { useAuthGuard } from "@/lib/auth/useAuthGuard";
import { useTranslation } from "react-i18next";

interface BusinessManager {
  managerId: string;
  managerCode: string;
  companyName: string;
  position: string;
  department: string;
  isCompanyVerified: boolean;
}

export default function AdminManagersPage() {
  // Kiểm tra quyền admin
  useAuthGuard(["admin"]);

  // Sử dụng translation
  const { t } = useTranslation();

  const [managers, setManagers] = useState<BusinessManager[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterVerified, setFilterVerified] = useState<string>("all");

  // Load data từ API
  const loadManagers = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await getAllManagers();

      // Filter out undefined values and map to our interface
      const managers = (data || [])
        .filter((item): item is BusinessManagerDto => item !== undefined)
        .map((item) => ({
          managerId: item.managerId,
          managerCode: item.managerCode,
          companyName: item.companyName,
          position: (item as any).position || "", // position field from actual API response
          department: item.department || "",
          isCompanyVerified: item.isCompanyVerified || false,
        }));

      setManagers(managers);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : t("messages.loadError");
      setError(errorMessage);
      toast.error(t("messages.loadError"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadManagers();
  }, []);

  // Retry function
  const handleRetry = () => {
    loadManagers();
  };

  const filteredManagers = managers.filter((manager) => {
    const matchesSearch =
      manager.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      manager.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      manager.position.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filterVerified === "all" ||
      (filterVerified === "verified" && manager.isCompanyVerified) ||
      (filterVerified === "unverified" && !manager.isCompanyVerified);

    return matchesSearch && matchesFilter;
  });

  const handleVerify = async (managerId: string) => {
    try {
      const manager = managers.find((m) => m.managerId === managerId);
      if (!manager) return;

      const verifyData = {
        action: !manager.isCompanyVerified,
        reason: manager.isCompanyVerified
          ? "Bỏ xác thực doanh nghiệp"
          : "Xác thực doanh nghiệp",
      };

      await verifyBusinessManagerAccount(managerId, verifyData);

      // Cập nhật local state
      setManagers((prev) =>
        prev.map((manager) =>
          manager.managerId === managerId
            ? { ...manager, isCompanyVerified: !manager.isCompanyVerified }
            : manager
        )
      );
      toast.success(t("businessManager.messages.verifySuccess"));
    } catch (error) {
      console.error("Lỗi khi cập nhật trạng thái xác thực:", error);
      toast.error(t("businessManager.messages.verifyError"));
    }
  };

  const handleSoftDelete = async (managerId: string) => {
    if (confirm(t("businessManager.messages.deleteConfirm"))) {
      try {
        await deleteManager(managerId);
        setManagers((prev) =>
          prev.filter((manager) => manager.managerId !== managerId)
        );
        toast.success(t("businessManager.messages.deleteSuccess"));
      } catch (error) {
        console.error("Lỗi khi xóa doanh nghiệp:", error);
        toast.error(t("businessManager.messages.deleteError"));
      }
    }
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600'></div>
        <span className='ml-3 text-gray-600'>{t("messages.loading")}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className='text-center py-12'>
        <div className='text-red-600 mb-4'>
          <svg
            className='mx-auto h-12 w-12'
            fill='none'
            viewBox='0 0 24 24'
            stroke='currentColor'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z'
            />
          </svg>
        </div>
        <h2 className='text-2xl font-semibold text-gray-900 mb-2'>
          {t("businessManager.messages.error")}
        </h2>
        <p className='text-gray-600 mb-4'>{error}</p>
        <Button
          onClick={handleRetry}
          className='bg-orange-600 hover:bg-orange-700'
        >
          {t("businessManager.messages.retry")}
        </Button>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex justify-between items-center'>
        <div>
          <h1 className='text-3xl font-bold text-gray-900'>
            {t("businessManager.title")}
          </h1>
          <p className='text-gray-600 mt-2'>{t("businessManager.subtitle")}</p>
        </div>
        {/* <Button variant={"secondaryGradient"} asChild>
          <Link href='/dashboard/admin/managers/create'>
            <Plus className='w-4 h-4 mr-2' />
            {t("businessManager.addManager")}
          </Link>
        </Button> */}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className='pt-6'>
          <div className='flex gap-4 items-center'>
            <div className='flex-1'>
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
                <Input
                  placeholder={t("businessManager.searchPlaceholder")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className='pl-10'
                />
              </div>
            </div>
            <select
              value={filterVerified}
              onChange={(e) => setFilterVerified(e.target.value)}
              className='px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500'
              title={t("businessManager.filterByVerificationStatus")}
            >
              <option value='all'>{t("businessManager.filterAll")}</option>
              <option value='verified'>
                {t("businessManager.filterVerified")}
              </option>
              <option value='unverified'>
                {t("businessManager.filterUnverified")}
              </option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Managers List */}
      <Card>
        <CardHeader>
          <CardTitle>
            {t("businessManager.managersList")} ({filteredManagers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredManagers.length === 0 ? (
            <div className='text-center py-12'>
              <p className='text-gray-500'>{t("businessManager.noManagers")}</p>
            </div>
          ) : (
            <div className='overflow-x-auto'>
              <table className='w-full'>
                <thead>
                  <tr className='border-b border-gray-200'>
                    <th className='text-left py-3 px-4 font-medium text-gray-700'>
                      {t("businessManager.table.managerCode")}
                    </th>
                    <th className='text-left py-3 px-4 font-medium text-gray-700'>
                      {t("businessManager.table.companyName")}
                    </th>
                    <th className='text-left py-3 px-4 font-medium text-gray-700'>
                      {t("businessManager.table.position")}
                    </th>
                    <th className='text-left py-3 px-4 font-medium text-gray-700'>
                      {t("businessManager.table.department")}
                    </th>
                    <th className='text-left py-3 px-4 font-medium text-gray-700'>
                      {t("businessManager.table.status")}
                    </th>
                    <th className='text-left py-3 px-4 font-medium text-gray-700'>
                      {t("businessManager.table.actions")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredManagers.map((manager) => (
                    <tr
                      key={manager.managerId}
                      className='border-b border-gray-100 hover:bg-gray-50'
                    >
                      <td className='py-3 px-4'>
                        <Badge variant='outline' className='font-mono'>
                          {manager.managerCode}
                        </Badge>
                      </td>
                      <td className='py-3 px-4'>
                        <div className='flex items-center gap-2'>
                          <Building2 className='w-4 h-4 text-gray-500' />
                          <span className='font-medium'>
                            {manager.companyName}
                          </span>
                        </div>
                      </td>
                      <td className='py-3 px-4'>
                        <Badge variant='secondary'>{manager.position}</Badge>
                      </td>
                      <td className='py-3 px-4'>
                        <Badge variant='outline'>{manager.department}</Badge>
                      </td>
                      <td className='py-3 px-4'>
                        {manager.isCompanyVerified ? (
                          <Badge className='bg-green-100 text-green-800 hover:bg-green-100'>
                            <CheckCircle className='w-3 h-3 mr-1' />
                            {t("businessManager.status.verified")}
                          </Badge>
                        ) : (
                          <Badge
                            variant='outline'
                            className='text-orange-600 border-orange-200'
                          >
                            <XCircle className='w-3 h-3 mr-1' />
                            {t("businessManager.status.unverified")}
                          </Badge>
                        )}
                      </td>
                      <td className='py-3 px-4'>
                        <div className='flex gap-2'>
                          <Button
                            size='sm'
                            variant='outline'
                            onClick={() => handleVerify(manager.managerId)}
                            className='h-8 w-8 p-0'
                            title={
                              manager.isCompanyVerified
                                ? t("businessManager.actions.unverify")
                                : t("businessManager.actions.verify")
                            }
                          >
                            {manager.isCompanyVerified ? (
                              <XCircle className='w-4 h-4' />
                            ) : (
                              <CheckCircle className='w-4 h-4' />
                            )}
                          </Button>
                          <Button
                            size='sm'
                            variant='outline'
                            className='h-8 w-8 p-0'
                            title={t("businessManager.actions.viewDetails")}
                            asChild
                          >
                            <Link
                              href={`/dashboard/admin/managers/${manager.managerId}`}
                            >
                              <Eye className='w-4 h-4' />
                            </Link>
                          </Button>
                          <Button
                            size='sm'
                            variant='outline'
                            className='h-8 w-8 p-0'
                            title={t("businessManager.actions.edit")}
                            asChild
                          >
                            <Link
                              href={`/dashboard/admin/managers/${manager.managerId}/edit`}
                            >
                              <Edit className='w-4 h-4' />
                            </Link>
                          </Button>
                          <Button
                            size='sm'
                            variant='outline'
                            onClick={() => handleSoftDelete(manager.managerId)}
                            className='h-8 w-8 p-0 text-red-600 hover:text-red-700'
                            title={t("businessManager.actions.delete")}
                          >
                            <Trash2 className='w-4 h-4' />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
