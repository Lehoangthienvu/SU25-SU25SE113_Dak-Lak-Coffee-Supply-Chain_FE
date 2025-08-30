
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { getWarehouseById, updateWarehouse } from '@/lib/api/warehouses';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import Link from 'next/link';

export default function EditWarehousePage() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useParams();
  const warehouseId = params?.id as string;

  const [form, setForm] = useState({
    name: '',
    location: '',
    capacity: '',
    managerId: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchWarehouse = async () => {
      const res = await getWarehouseById(warehouseId);
      if (res.status === 1) {
        const w = res.data;
        setForm({
          name: w.name,
          location: w.location,
          capacity: w.capacity?.toString() ?? '',
          managerId: w.managerId ?? '',
        });
      } else {
        toast.error(t('common.errors.loadDataError'));
        router.push('/dashboard/manager/warehouses');
      }
    };
    fetchWarehouse();
  }, [warehouseId, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      warehouseId,
      name: form.name.trim(),
      location: form.location.trim(),
      capacity: parseFloat(form.capacity),
      managerId: form.managerId,
    };

    setLoading(true);
    const res = await updateWarehouse(warehouseId, payload);
    setLoading(false);

    if (res.status === 1) {
      toast.success(t('common.messages.updateSuccess'));
      router.push('/dashboard/manager/warehouses');
    } else {
      toast.error(res.message);
    }
  };

  return (
    <div className="min-h-screen bg-orange-50 p-6">
      <Card className="max-w-xl mx-auto">
        <CardHeader className="flex justify-between items-center">
          <CardTitle>{t('managerWarehouses.edit.title')}</CardTitle>
          <Link href="/dashboard/manager/warehouses">
            <Button variant="outline">← {t('common.actions.back')}</Button>
          </Link>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4 text-sm">
            <div>
              <label className="font-medium">{t('managerWarehouses.create.fields.name')}</label>
              <Input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="VD: Kho chính Tây Nguyên"
              />
            </div>
            <div>
              <label className="font-medium">{t('managerWarehouses.create.fields.location')}</label>
              <Input
                name="location"
                value={form.location}
                onChange={handleChange}
                placeholder="VD: Krông Pắk, Đắk Lắk"
              />
            </div>
            <div>
                              <label className="font-medium">{t('managerWarehouses.create.fields.capacity')} ({t('managerWarehouses.stats.kg')})</label>
              <Input
                name="capacity"
                type="number"
                value={form.capacity}
                onChange={handleChange}
                placeholder="VD: 1000000"
              />
            </div>
            <div>
              <label className="font-medium">{t('managerWarehouses.create.fields.managerId')}</label>
              <Input
                name="managerId"
                value={form.managerId}
                onChange={handleChange}
                placeholder="GUID của BusinessManager"
              />
            </div>

            <Button type="submit" className="bg-amber-800 text-white" disabled={loading}>
              {loading ? t('common.actions.updating') : t('common.actions.update')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
