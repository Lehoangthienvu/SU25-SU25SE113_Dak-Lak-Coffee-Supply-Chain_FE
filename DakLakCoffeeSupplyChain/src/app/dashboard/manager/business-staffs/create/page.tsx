"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { createBusinessStaff } from "@/lib/api/businessStaffs";
import { getAllWarehouses } from "@/lib/api/warehouses";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function CreateBusinessStaffPage() {
  const { t } = useTranslation();
  const router = useRouter();

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    password: "",
    position: "",
    department: "",
    assignedWarehouseId: null as string | null,
  });

  const [warehouses, setWarehouses] = useState<
    { warehouseId: string; name: string }[]
  >([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchWarehouses = async () => {
      const res = await getAllWarehouses();
      if (res.status === 1 && Array.isArray(res.data)) {
        setWarehouses(res.data);
      } else {
        toast.error(t('businessStaffs.create.warehouseError'));
      }
    };
    fetchWarehouses();
  }, [t]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await createBusinessStaff({
        ...form,
        assignedWarehouseId: form.assignedWarehouseId || null,
      });

      if (res.status === 201 || res.status === 200) {
        toast.success(t('businessStaffs.create.success'));
        router.push("/dashboard/manager/business-staffs");
      } else {
        toast.error(res.message || t('businessStaffs.create.error'));
      }
    } catch (err) {
      toast.error(t('businessStaffs.create.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">{t('businessStaffs.create.title')}</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label>{t('businessStaffs.create.fullName')}</Label>
          <Input name="fullName" value={form.fullName} onChange={handleChange} required />
        </div>
        <div>
          <Label>{t('businessStaffs.create.email')}</Label>
          <Input name="email" type="email" value={form.email} onChange={handleChange} required />
        </div>
        <div>
          <Label>{t('businessStaffs.create.phoneNumber')}</Label>
          <Input name="phoneNumber" value={form.phoneNumber} onChange={handleChange} />
        </div>
        <div>
          <Label>{t('businessStaffs.create.password')}</Label>
          <Input
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            required
            minLength={6}
          />
        </div>
        <div>
          <Label>{t('businessStaffs.create.position')}</Label>
          <Input name="position" value={form.position} onChange={handleChange} required />
        </div>
        <div>
          <Label>{t('businessStaffs.create.department')}</Label>
          <Input name="department" value={form.department} onChange={handleChange} />
        </div>
        <div>
          <Label>{t('businessStaffs.create.assignedWarehouse')}</Label>
          <select
            name="assignedWarehouseId"
            value={form.assignedWarehouseId ?? ""}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                assignedWarehouseId: e.target.value || null,
              }))
            }
            className="w-full border rounded px-3 py-2"
          >
            <option value="">{t('businessStaffs.create.noSelection')}</option>
            {warehouses.map((w) => (
              <option key={w.warehouseId} value={w.warehouseId}>
                {w.name}
              </option>
            ))}
          </select>
        </div>

        <div className="pt-4 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            {t('businessStaffs.create.cancel')}
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? t('businessStaffs.create.creating') : t('businessStaffs.create.create')}
          </Button>
        </div>
      </form>
    </Card>
  );
}
