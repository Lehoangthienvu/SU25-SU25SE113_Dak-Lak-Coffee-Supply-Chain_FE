"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { getBusinessStaffById } from "@/lib/api/businessStaffs";
import { getWarehouseById } from "@/lib/api/warehouses";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface BusinessStaffDetailDto {
  staffId: string;
  staffCode: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  department: string;
  position: string;
  assignedWarehouseId?: string;
  createdAt: string;
}

export default function BusinessStaffDetailPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = useParams();
  const [staff, setStaff] = useState<BusinessStaffDetailDto | null>(null);
  const [warehouseName, setWarehouseName] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDetail() {
      try {
        const data = await getBusinessStaffById(id as string);
        if (data) {
          setStaff(data);

          if (data.assignedWarehouseId) {
            const warehouseRes = await getWarehouseById(data.assignedWarehouseId);
            if (warehouseRes.status === 1 && warehouseRes.data?.name) {
              setWarehouseName(warehouseRes.data.name);
            } else {
              setWarehouseName(t('businessStaffs.detail.unknown'));
            }
          } else {
            setWarehouseName(t('businessStaffs.detail.notAssigned'));
          }
        } else {
          toast.error(t('businessStaffs.edit.notFound'));
        }
      } catch (err) {
        toast.error(t('businessStaffs.error.loadDetail'));
      } finally {
        setLoading(false);
      }
    }

    if (id) fetchDetail();
  }, [id, t]);

  if (loading) return <p className="text-gray-500 px-6">{t('businessStaffs.loading.detail')}</p>;
  if (!staff) return <p className="text-red-500 px-6">{t('businessStaffs.error.noData')}</p>;

  return (
    <Card className="p-8 max-w-3xl mx-auto space-y-6 shadow-md">
      <h1 className="text-3xl font-semibold text-orange-600 border-b pb-4">
        {t('businessStaffs.detail.title')}
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-5 text-[15px]">
        <div>
          <span className="font-medium text-gray-600">{t('businessStaffs.detail.staffCode')}</span>
          <div className="text-gray-800">{staff.staffCode}</div>
        </div>
        <div>
          <span className="font-medium text-gray-600">{t('businessStaffs.detail.fullName')}</span>
          <div className="text-gray-800">{staff.fullName}</div>
        </div>
        <div>
          <span className="font-medium text-gray-600">{t('businessStaffs.detail.email')}</span>
          <div className="text-gray-800">{staff.email}</div>
        </div>
        <div>
          <span className="font-medium text-gray-600">{t('businessStaffs.detail.phoneNumber')}</span>
          <div>
            {staff.phoneNumber ? (
              <span className="text-gray-800">{staff.phoneNumber}</span>
            ) : (
              <Badge variant="outline" className="text-gray-500">{t('businessStaffs.detail.noPhone')}</Badge>
            )}
          </div>
        </div>
        <div>
          <span className="font-medium text-gray-600">{t('businessStaffs.detail.department')}</span>
          <div className="text-gray-800">{staff.department}</div>
        </div>
        <div>
          <span className="font-medium text-gray-600">{t('businessStaffs.detail.position')}</span>
          <div className="text-gray-800">{staff.position}</div>
        </div>
        <div>
          <span className="font-medium text-gray-600">{t('businessStaffs.detail.assignedWarehouse')}</span>
          <div>
            {warehouseName === t('businessStaffs.detail.notAssigned') ? (
              <Badge variant="secondary" className="text-gray-600">{warehouseName}</Badge>
            ) : (
              <span className="text-gray-800">{warehouseName}</span>
            )}
          </div>
        </div>
        <div>
          <span className="font-medium text-gray-600">{t('businessStaffs.detail.createdAt')}</span>
          <div className="text-gray-800">
            {new Date(staff.createdAt).toLocaleString("vi-VN")}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-6">
        <Button variant="outline" onClick={() => router.back()}>
          {t('businessStaffs.detail.back')}
        </Button>
        <Button
          className="bg-orange-600 hover:bg-orange-700 text-white"
          onClick={() =>
            router.push(`/dashboard/manager/business-staffs/${staff.staffId}/edit`)
          }
        >
          {t('businessStaffs.detail.edit')}
        </Button>
      </div>
    </Card>
  );
}
