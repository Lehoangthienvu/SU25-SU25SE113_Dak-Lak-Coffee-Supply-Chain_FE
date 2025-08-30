'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { createWarehouse } from '@/lib/api/warehouses';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import Link from 'next/link';

export default function CreateWarehousePage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    location: '',
    capacity: '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { name, location, capacity } = form;

    if (!name || !location || !capacity) {
      toast.error(t('managerWarehouses.create.validation.fillAllFields'));
      return;
    }

    setLoading(true);
    const payload = {
      name: name.trim(),
      location: location.trim(),
      capacity: parseFloat(capacity),
    };

    try {
      const res = await createWarehouse(payload);
      setLoading(false);

      if (res.status === 1) {
        toast.success(t('managerWarehouses.create.actions.createSuccess'));
        router.push('/dashboard/manager/warehouses');
      } else {
        if (res.message?.includes('đã tồn tại')) {
          toast.warning(t('managerWarehouses.create.validation.nameExists'));
        } else {
          toast.error(res.message);
        }
      }
    } catch (err) {
      setLoading(false);
      toast.error(t('common.error.unknown'));
    }
  };

  return (
    <div className="min-h-screen bg-orange-50 p-6">
      <Card className="max-w-xl mx-auto">
        <CardHeader className="flex justify-between items-center">
          <CardTitle>{t('managerWarehouses.create.title')}</CardTitle>
          <Link href="/dashboard/manager/warehouses">
            <Button variant="outline">← {t('managerWarehouses.detail.actions.back')}</Button>
          </Link>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4 text-sm">
            <div>
              <label className="font-medium">{t('managerWarehouses.create.fields.name')}</label>
              <Input
                name="name"
                placeholder={t('managerWarehouses.create.placeholders.name')}
                value={form.name}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="font-medium">{t('managerWarehouses.create.fields.location')}</label>
              <Input
                name="location"
                placeholder={t('managerWarehouses.create.placeholders.location')}
                value={form.location}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="font-medium">{t('managerWarehouses.create.fields.capacity')}</label>
              <Input
                name="capacity"
                type="number"
                placeholder={t('managerWarehouses.create.placeholders.capacity')}
                value={form.capacity}
                onChange={handleChange}
              />
            </div>

            <Button type="submit" className="bg-amber-800 text-white" disabled={loading}>
              {loading ? t('managerWarehouses.create.actions.creating') : t('managerWarehouses.create.actions.create')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
