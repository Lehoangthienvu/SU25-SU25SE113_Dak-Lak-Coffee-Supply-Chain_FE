'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createWarehouse } from '@/lib/api/warehouses';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import Link from 'next/link';

export default function CreateWarehousePage() {
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
      toast.error('Vui lòng nhập đầy đủ thông tin');
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
        toast.success('Tạo kho thành công');
        router.push('/dashboard/manager/warehouses');
      } else {
        if (res.message?.includes('đã tồn tại')) {
          toast.warning('Tên kho đã tồn tại. Vui lòng chọn tên khác.');
        } else {
          toast.error(res.message);
        }
      }
    } catch (err) {
      setLoading(false);
      toast.error('Lỗi không xác định khi gửi yêu cầu');
    }
  };

  return (
    <div className="min-h-screen bg-orange-50 p-6">
      <Card className="max-w-xl mx-auto">
        <CardHeader className="flex justify-between items-center">
          <CardTitle>Tạo kho mới</CardTitle>
          <Link href="/dashboard/manager/warehouses">
            <Button variant="outline">← Quay lại</Button>
          </Link>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4 text-sm">
            <div>
              <label className="font-medium">Tên kho</label>
              <Input
                name="name"
                placeholder="VD: Kho trung tâm Đắk Lắk"
                value={form.name}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="font-medium">Vị trí</label>
              <Input
                name="location"
                placeholder="VD: Buôn Ma Thuột, Đắk Lắk"
                value={form.location}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="font-medium">Dung lượng (kg)</label>
              <Input
                name="capacity"
                type="number"
                placeholder="VD: 10000"
                value={form.capacity}
                onChange={handleChange}
              />
            </div>

            <Button type="submit" className="bg-amber-800 text-white" disabled={loading}>
              {loading ? 'Đang tạo...' : 'Tạo kho'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
