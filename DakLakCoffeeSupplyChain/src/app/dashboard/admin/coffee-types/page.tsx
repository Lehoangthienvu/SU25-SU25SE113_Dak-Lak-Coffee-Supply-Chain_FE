"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useAuthGuard } from "@/lib/auth/useAuthGuard";
import { useTranslation } from "react-i18next";
import {
  CoffeeType,
  deleteCoffeeType,
  updateStatusCoffeeType,
} from "@/lib/api/coffeeType";
import { getCoffeeTypes } from "@/lib/api/coffeeType";
import { getErrorMessage } from "@/lib/utils";
import { AppToast } from "@/components/ui/AppToast";
import { FaSeedling } from "react-icons/fa";

export default function AdminCoffeeTypePage() {
  // Kiểm tra quyền admin
  useAuthGuard(["admin"]);

  // Sử dụng translation
  const { t } = useTranslation();

  const [coffeeTypes, setCoffeeTypes] = useState<CoffeeType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterVerified, setFilterVerified] = useState<string>("all");

  // Load data từ API
  const fetchCoffeeType = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await getCoffeeTypes();
      setCoffeeTypes(data);
    } catch (error) {
      setError(getErrorMessage(error));
      console.log(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (
    coffeeTypeId: string,
    currentStatus: string | number
  ) => {
    try {
      const newStatus = currentStatus === "Active" ? 0 : 1;
      const updatedCoffeeType = await updateStatusCoffeeType(
        {
          coffeeTypeId,
          status: newStatus,
        },
        coffeeTypeId
      );

      // Cập nhật lại trong state
      setCoffeeTypes((prev) =>
        prev.map((coffee) =>
          coffee.coffeeTypeId === coffeeTypeId
            ? { ...coffee, status: updatedCoffeeType.status }
            : coffee
        )
      );

      AppToast.success(
        `Đã ${newStatus === 1 ? "mở" : "đóng"} trạng thái cho loại cà phê.`
      );
    } catch (error) {
      console.error(getErrorMessage(error));
      AppToast.error("Cập nhật trạng thái thất bại.");
    }
  };

  useEffect(() => {
    fetchCoffeeType();
  }, []);

  // Retry function
  const handleRetry = () => {
    fetchCoffeeType();
  };

  const filteredCoffeeTypes = coffeeTypes.filter((coffee) => {
    const matchesSearch =
      coffee.typeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      coffee.typeCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (coffee.botanicalName?.toLowerCase() ?? "").includes(
        searchTerm.toLowerCase()
      );

    return matchesSearch;
  });

  const handleSoftDelete = async (coffeeTypeId: string) => {
    if (confirm(t("coffeeType.messages.deleteConfirm"))) {
      try {
        await deleteCoffeeType(coffeeTypeId);
        setCoffeeTypes((prev) =>
          prev.filter((coffee) => coffee.coffeeTypeId !== coffeeTypeId)
        );
        AppToast.success(t("coffeeType.messages.deleteSuccess"));
      } catch (error) {
        console.error(getErrorMessage(error));
        AppToast.error(t("coffeeType.messages.deleteError"));
      }
    }
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600'></div>
        <span className='ml-3 text-gray-600'>
          {t("coffeeType.messages.loading")}
        </span>
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
          {t("coffeeType.messages.error")}
        </h2>
        <p className='text-gray-600 mb-4'>{error}</p>
        <Button
          onClick={handleRetry}
          className='bg-orange-600 hover:bg-orange-700'
        >
          {t("coffeeType.messages.retry")}
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
            {t("coffeeType.title")}
          </h1>
          <p className='text-gray-600 mt-2'>{t("coffeeType.subtitle")}</p>
        </div>
        <Button variant={"secondary"} asChild>
          <Link href='/dashboard/admin/coffee-types/create'>
            <Plus className='w-4 h-4 mr-2' />
            {t("coffeeType.addCoffeeType")}
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className='pt-6'>
          <div className='flex gap-4 items-center'>
            <div className='flex-1'>
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
                <Input
                  placeholder={t("coffeeType.searchPlaceholder")}
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
              title='Lọc theo trạng thái xác thực'
            >
              <option value='all'>{t("coffeeType.filterAll")}</option>
              <option value='verified'>{t("coffeeType.filterVerified")}</option>
              <option value='unverified'>
                {t("coffeeType.filterUnverified")}
              </option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Managers List */}
      <Card>
        <CardHeader>
          <CardTitle>
            {t("coffeeType.coffeeList")} ({filteredCoffeeTypes.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredCoffeeTypes.length === 0 ? (
            <div className='text-center py-12'>
              <p className='text-gray-500'>{t("noCoffeeTypes")}</p>
            </div>
          ) : (
            <div className='overflow-x-auto'>
              <table className='w-full'>
                <thead>
                  <tr className='border-b border-gray-200'>
                    <th className='text-left py-3 px-4 font-medium text-gray-700'>
                      {t("coffeeType.table.typeCode")}
                    </th>
                    <th className='text-left py-3 px-4 font-medium text-gray-700'>
                      {t("coffeeType.table.typeName")}
                    </th>
                    <th className='text-left py-3 px-4 font-medium text-gray-700'>
                      {t("coffeeType.table.botanicalName")}
                    </th>
                    <th className='text-left py-3 px-4 font-medium text-gray-700'>
                      {t("coffeeType.table.typicalRegion")}
                    </th>
                    <th className='text-left py-3 px-4 font-medium text-gray-700'>
                      {t("coffeeType.table.specialtyLevel")}
                    </th>
                    <th className='text-left py-3 px-4 font-medium text-gray-700'>
                      {t("coffeeType.table.status")}
                    </th>
                    <th className='text-left py-3 px-4 font-medium text-gray-700'>
                      {t("coffeeType.table.categoryParent")}
                    </th>
                    <th className='text-left py-3 px-4 font-medium text-gray-700'>
                      {t("coffeeType.table.belongTo")}
                    </th>
                    <th className='text-left py-3 px-4 font-medium text-gray-700'>
                      {t("coffeeType.table.actions")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCoffeeTypes.map((coffeeType) => (
                    <tr
                      key={coffeeType.coffeeTypeId}
                      className='border-b border-gray-100 hover:bg-gray-50'
                    >
                      <td className='py-3 px-4'>
                        <Badge variant='outline' className='font-mono'>
                          {coffeeType.typeCode}
                        </Badge>
                      </td>
                      <td className='py-3 px-4'>
                        <div className='flex items-center gap-2'>
                          <FaSeedling className='w-4 h-4 text-gray-500' />
                          <span className='font-medium'>
                            {coffeeType.typeName}
                          </span>
                        </div>
                      </td>
                      <td className='py-3 px-4'>
                        <span className='font-medium'>
                          {coffeeType.botanicalName}
                        </span>
                      </td>
                      <td className='py-3 px-4'>
                        <span className='font-medium'>
                          {coffeeType.typicalRegion}
                        </span>
                      </td>
                      <td className='py-3 px-4'>
                        {coffeeType.specialtyLevel && (
                          <Badge variant='outline'>
                            {coffeeType.specialtyLevel}
                          </Badge>
                        )}
                      </td>
                      <td className='py-3 px-4'>
                        {coffeeType.status && (
                          <Badge variant='outline'>{coffeeType.status}</Badge>
                        )}
                      </td>
                      <td className='py-3 px-4'>
                        <span className='font-medium'>
                          {coffeeType.coffeeTypeCategory === "general"
                            ? ` ${t("coffeeType.category.general")}`
                            : coffeeType.coffeeTypeCategory === "specific"
                            ? ` ${t("coffeeType.category.specific")}`
                            : ""}
                        </span>
                      </td>
                      <td className='py-3 px-4'>
                        {coffeeType.coffeeTypeParentId && (
                          <span className='font-medium'>
                            {coffeeType.coffeeTypeParentName}
                          </span>
                        )}
                      </td>

                      <td className='py-3 px-4'>
                        <div className='flex gap-2'>
                          {/* <Button
                            size='sm'
                            variant='outline'
                            className='h-8 w-8 p-0'
                            title={t("coffeeType.actions.viewDetails")}
                            asChild
                          >
                            <Link
                              href={`/dashboard/admin/coffee-types/${coffeeType.coffeeTypeId}`}
                            >
                              <Eye className='w-4 h-4' />
                            </Link>
                          </Button> */}

                          <Input
                            type='checkbox'
                            checked={coffeeType.status === "Active"}
                            onChange={() =>
                              handleToggleStatus(
                                coffeeType.coffeeTypeId,
                                coffeeType.status ?? "InActive"
                              )
                            }
                            className='h-8 w-8 p-0 rounded-full cursor-pointer accent-orange-600'
                            title={t("coffeeType.actions.toggleStatus")}
                          />
                          <Button
                            size='sm'
                            variant='outline'
                            className='h-8 w-8 p-0'
                            title={t("coffeeType.actions.edit")}
                            asChild
                          >
                            <Link
                              href={`/dashboard/admin/coffee-types/${coffeeType.coffeeTypeId}/edit`}
                            >
                              <Edit className='w-4 h-4' />
                            </Link>
                          </Button>
                          <Button
                            size='sm'
                            variant='outline'
                            onClick={() =>
                              handleSoftDelete(coffeeType.coffeeTypeId)
                            }
                            className='h-8 w-8 p-0 text-red-600 hover:text-red-700'
                            title={t("coffeeType.actions.delete")}
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
