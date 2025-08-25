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
import { getCommitmentById, FarmingCommitment } from '@/lib/api/farmingCommitments';
import { AlertCircle } from 'lucide-react';

import { CropSeason } from '@/lib/api/cropSeasons';

export default function EditCropSeasonPage() {
    useAuthGuard(['farmer']);
    const router = useRouter();
    const { id } = useParams();
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [season, setSeason] = useState<CropSeason | null>(null);
    const [commitment, setCommitment] = useState<FarmingCommitment | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Helper function to compare dates accurately
    const compareDates = (date1: string, date2: string): number => {
        // Parse dates and create Date objects
        const d1 = new Date(date1);
        const d2 = new Date(date2);

        // Check if dates are valid
        if (isNaN(d1.getTime()) || isNaN(d2.getTime())) {
            console.error('Invalid date format:', { date1, date2 });
            return 0;
        }

        // Create new Date objects with only year, month, day (no time)
        const dateOnly1 = new Date(d1.getFullYear(), d1.getMonth(), d1.getDate());
        const dateOnly2 = new Date(d2.getFullYear(), d2.getMonth(), d2.getDate());

        return dateOnly1.getTime() - dateOnly2.getTime();
    };

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

                // Fetch commitment data for validation
                if (data.commitmentId) {
                    try {
                        const commitmentData = await getCommitmentById(data.commitmentId);
                        setCommitment(commitmentData);
                    } catch (commitmentError) {
                        console.warn('Could not fetch commitment data for validation:', commitmentError);
                    }
                }
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

        // Clear error when user changes value
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateForm = (): Record<string, string> => {
        const newErrors: Record<string, string> = {};

        // Basic validation
        if (!form.seasonName.trim()) {
            newErrors.seasonName = 'Tên mùa vụ không được để trống';
        } else if (form.seasonName.trim().length < 3) {
            newErrors.seasonName = 'Tên mùa vụ phải có ít nhất 3 ký tự';
        }

        if (!form.startDate) {
            newErrors.startDate = 'Ngày bắt đầu không được để trống';
        }

        if (!form.endDate) {
            newErrors.endDate = 'Ngày kết thúc không được để trống';
        } else if (form.startDate && form.endDate) {
            const startDate = new Date(form.startDate);
            const endDate = new Date(form.endDate);

            if (startDate >= endDate) {
                newErrors.endDate = 'Ngày kết thúc phải sau ngày bắt đầu';
            } else if (commitment && commitment.approvedAt) {
                // Check if crop season duration is within 11-12 months
                const monthsDiff = (endDate.getFullYear() - startDate.getFullYear()) * 12 +
                    (endDate.getMonth() - startDate.getMonth());

                if (monthsDiff < 11 || monthsDiff > 13) { // Allow 1 month tolerance
                    newErrors.endDate = 'Thời gian mùa vụ phải trong khoảng 11-12 tháng';
                }
            }
        }

        // Kiểm tra start date phải sau hoặc bằng ngày approved
        if (commitment?.approvedAt && form.startDate) {
            const comparison = compareDates(form.startDate, commitment.approvedAt);

            if (comparison < 0) {
                newErrors.startDate = 'Ngày bắt đầu mùa vụ phải sau hoặc bằng ngày cam kết được duyệt (có thể bắt đầu cùng ngày)';
            }
        }

        return newErrors;
    };

    const handleSubmit = async () => {
        // Reset errors before submit
        setErrors({});

        // Validate form
        const validationErrors = validateForm();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            AppToast.error('Vui lòng kiểm tra và sửa các lỗi trong form');
            return;
        }

        setIsSubmitting(true);

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
                        <Label htmlFor="seasonName">Tên mùa vụ <span className="text-red-500">*</span></Label>
                        <Input
                            name="seasonName"
                            value={form.seasonName}
                            onChange={handleChange}
                            className={errors.seasonName ? "border-red-500 focus:border-red-500 focus:ring-red-200" : ""}
                        />
                        {errors.seasonName && (
                            <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                                <AlertCircle className="w-4 h-4" />
                                {errors.seasonName}
                            </p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="startDate">Ngày bắt đầu <span className="text-red-500">*</span></Label>
                            <Input
                                type="date"
                                name="startDate"
                                value={form.startDate}
                                onChange={handleChange}
                                className={errors.startDate ? "border-red-500 focus:border-red-500 focus:ring-red-200" : ""}
                            />
                            {errors.startDate && (
                                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                                    <AlertCircle className="w-4 h-4" />
                                    {errors.startDate}
                                </p>
                            )}
                        </div>
                        <div>
                            <Label htmlFor="endDate">Ngày kết thúc <span className="text-red-500">*</span></Label>
                            <Input
                                type="date"
                                name="endDate"
                                value={form.endDate}
                                onChange={handleChange}
                                className={errors.endDate ? "border-red-500 focus:border-red-500 focus:ring-red-200" : ""}
                            />
                            {errors.endDate && (
                                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                                    <AlertCircle className="w-4 h-4" />
                                    {errors.endDate}
                                </p>
                            )}
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

                        {commitment && commitment.approvedAt && (
                            <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                <p className="text-sm text-blue-700">
                                    <strong>Ngày cam kết được duyệt:</strong> {new Date(commitment.approvedAt).toLocaleDateString('vi-VN')}
                                </p>
                                <p className="text-xs text-blue-600 mt-1">
                                    ⚠️ Ngày bắt đầu mùa vụ phải sau hoặc bằng ngày này (có thể bắt đầu cùng ngày)
                                </p>
                            </div>
                        )}
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
