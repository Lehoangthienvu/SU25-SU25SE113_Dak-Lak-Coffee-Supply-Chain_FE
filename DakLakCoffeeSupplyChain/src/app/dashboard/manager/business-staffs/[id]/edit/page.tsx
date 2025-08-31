"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { getBusinessStaffById, updateBusinessStaff } from "@/lib/api/businessStaffs";
import { getAllWarehouses } from "@/lib/api/warehouses";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function EditBusinessStaffPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const router = useRouter();

  const [form, setForm] = useState({
    staffId: "",
    staffCode: "",
    fullName: "",
    email: "",
    phoneNumber: "",
    department: "",
    position: "",
    assignedWarehouseId: "",
  });

  const [warehouses, setWarehouses] = useState<{ warehouseId: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await getBusinessStaffById(id as string);
        if (res?.staffId) {
          setForm({
            staffId: res.staffId,
            staffCode: res.staffCode,
            fullName: res.fullName,
            email: res.email,
            phoneNumber: res.phoneNumber || "",
            department: res.department,
            position: res.position,
            assignedWarehouseId: res.assignedWarehouseId || "",
          });
        } else {
          toast.error(t('businessStaffs.edit.notFound'));
        }

        const warehouseRes = await getAllWarehouses();
        if (warehouseRes.status === 1 && Array.isArray(warehouseRes.data)) {
          setWarehouses(warehouseRes.data);
        } else {
          toast.error(t('businessStaffs.edit.warehouseError'));
        }
      } catch (err) {
        toast.error(t('businessStaffs.edit.loadError'));
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [id, t]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    try {
      const updateDto = {
        staffId: form.staffId,
        position: form.position,
        department: form.department,
        assignedWarehouseId: form.assignedWarehouseId || null,
        isActive: true,
      };

      const res = await updateBusinessStaff(updateDto);
      if (res.status === 200) {
        toast.success(t('businessStaffs.edit.success'));
        router.push(`/dashboard/manager/business-staffs/${id}`);
      } else {
        toast.error(res.message || t('businessStaffs.edit.error'));
      }
    } catch (err) {
      toast.error(t('businessStaffs.edit.error'));
    }
  };

  if (loading) return <p className="text-gray-500 px-6">{t('businessStaffs.loading.data')}</p>;

  return (
    <Card className="p-8 max-w-3xl mx-auto space-y-6 shadow-md">
      <h1 className="text-3xl font-semibold text-blue-700 border-b pb-4">
        {t('businessStaffs.edit.title')}
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <Label className="text-sm text-gray-600">{t('businessStaffs.edit.staffCode')}</Label>
          <Input value={form.staffCode} disabled />
        </div>
        <div>
          <Label className="text-sm text-gray-600">{t('businessStaffs.edit.fullName')}</Label>
          <Input value={form.fullName} disabled />
        </div>
        <div>
          <Label className="text-sm text-gray-600">{t('businessStaffs.edit.email')}</Label>
          <Input value={form.email} disabled />
        </div>
        <div>
          <Label className="text-sm text-gray-600">{t('businessStaffs.edit.phoneNumber')}</Label>
          <Input value={form.phoneNumber} disabled />
        </div>
        <div>
          <Label className="text-sm text-gray-600">{t('businessStaffs.edit.department')}</Label>
          <Input name="department" value={form.department} onChange={handleChange} />
        </div>
        <div>
          <Label className="text-sm text-gray-600">{t('businessStaffs.edit.position')}</Label>
          <Input name="position" value={form.position} onChange={handleChange} />
        </div>
        <div className="sm:col-span-2">
          <Label className="text-sm text-gray-600">{t('businessStaffs.edit.assignedWarehouse')}</Label>
          <select
            name="assignedWarehouseId"
            value={form.assignedWarehouseId}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2 bg-white text-gray-800"
          >
            <option value="">{t('businessStaffs.edit.noSelection')}</option>
            {warehouses.map((w) => (
              <option key={w.warehouseId} value={w.warehouseId}>
                {w.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-6">
        <Button variant="outline" onClick={() => router.back()}>
          {t('businessStaffs.edit.back')}
        </Button>
        <Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700 text-white">
          {t('businessStaffs.edit.saveChanges')}
        </Button>
      </div>
    </Card>
  );
}
