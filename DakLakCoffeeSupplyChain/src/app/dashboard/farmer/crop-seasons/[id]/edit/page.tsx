'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { AppToast } from '@/components/ui/AppToast';
import { getCropSeasonById, updateCropSeason } from '@/lib/api/cropSeasons';
import { getErrorMessage } from '@/lib/utils';
import { useAuthGuard } from '@/lib/auth/useAuthGuard';

import { CropSeason } from '@/lib/api/cropSeasons';

export default function EditCropSeasonPage() {
    useAuthGuard(['farmer']);
    const router = useRouter();
    const { id } = useParams();
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [season, setSeason] = useState<CropSeason | null>(null);

    const [form, setForm] = useState({
        seasonName: '',
        startDate: '',
        endDate: '',
        note: '',
    });

    const formatDate = (d: string) => new Date(d).toISOString().split('T')[0];

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await getCropSeasonById(id as string);
                if (!data) throw new Error();
                setSeason(data);
                setForm({
                    seasonName: data.seasonName,
                    startDate: formatDate(data.startDate),
                    endDate: formatDate(data.endDate),
                    note: data.note || '',
                });
            } catch {
                AppToast.error('Không thể tải dữ liệu mùa vụ.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [id]);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        const requiredFields = ['seasonName', 'startDate', 'endDate'];
        const missing = requiredFields.filter((field) => !form[field as keyof typeof form]);

        if (missing.length > 0) {
            AppToast.error('Vui lòng điền đầy đủ các trường bắt buộc.');
            setIsSubmitting(false);
            return;
        }

        try {
            const payload = {
                cropSeasonId: id as string,
                seasonName: form.seasonName,
                startDate: form.startDate,
                endDate: form.endDate,
                note: form.note,
            };

            const result = await updateCropSeason(id as string, payload);

            if (result.success) {
                AppToast.success('Cập nhật mùa vụ thành công!');
                router.push('/dashboard/farmer/crop-seasons');
            } else {
                AppToast.error(result.error || 'Cập nhật thất bại.');
            }
        } catch (err) {
            AppToast.error(getErrorMessage(err));
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) return <p className="text-center py-10">Đang tải dữ liệu mùa vụ...</p>;

    if (!season) return <p className="text-center py-10 text-red-500">Không tìm thấy mùa vụ.</p>;

    return (
        <div className="max-w-2xl mx-auto py-10 px-4">
            <Card>
                <CardHeader>
                    <CardTitle>Cập nhật mùa vụ</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label htmlFor="seasonName">Tên mùa vụ</Label>
                        <Input name="seasonName" value={form.seasonName} onChange={handleChange} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="startDate">Ngày bắt đầu</Label>
                            <Input type="date" name="startDate" value={form.startDate} onChange={handleChange} />
                        </div>
                        <div>
                            <Label htmlFor="endDate">Ngày kết thúc</Label>
                            <Input type="date" name="endDate" value={form.endDate} onChange={handleChange} />
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="note">Ghi chú</Label>
                        <Textarea name="note" value={form.note} onChange={handleChange} />
                    </div>

                    <div className="border-t pt-4">
                        <p className="text-sm text-muted-foreground mb-1">Thông tin cam kết</p>
                        <p><strong>Mã cam kết:</strong> {season.commitmentName}</p>
                        <p><strong>Diện tích đã đăng ký:</strong> {season.area} ha</p>
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button onClick={handleSubmit} disabled={isSubmitting}>
                            {isSubmitting ? 'Đang cập nhật...' : 'Cập nhật'}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
