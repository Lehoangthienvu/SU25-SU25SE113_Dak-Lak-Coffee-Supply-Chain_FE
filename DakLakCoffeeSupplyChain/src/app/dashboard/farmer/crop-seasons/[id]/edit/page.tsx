'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
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
    const { t } = useTranslation();
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
                AppToast.error(t('cropSeasons.edit.loading'));
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [id, t]);

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
            newErrors.seasonName = t('cropSeasons.edit.validation.seasonNameRequired');
        } else if (form.seasonName.trim().length < 3) {
            newErrors.seasonName = t('cropSeasons.edit.validation.seasonNameMinLength');
        }

        if (!form.startDate) {
            newErrors.startDate = t('cropSeasons.edit.validation.startDateRequired');
        }

        if (!form.endDate) {
            newErrors.endDate = t('cropSeasons.edit.validation.endDateRequired');
        } else if (form.startDate && form.endDate) {
            const startDate = new Date(form.startDate);
            const endDate = new Date(form.endDate);

            if (startDate >= endDate) {
                newErrors.endDate = t('cropSeasons.edit.validation.endDateAfterStartDate');
            } else if (commitment && commitment.approvedAt) {
                // Check if crop season duration is within 11-12 months
                const monthsDiff = (endDate.getFullYear() - startDate.getFullYear()) * 12 +
                    (endDate.getMonth() - startDate.getMonth());

                if (monthsDiff < 11 || monthsDiff > 15) { // Allow 2 months tolerance for disaster handling
                    newErrors.endDate = t('cropSeasons.edit.validation.seasonDurationMonths');
                }
            }
        }

        // Kiểm tra start date phải sau hoặc bằng ngày approved
        if (commitment?.approvedAt && form.startDate) {
            const comparison = compareDates(form.startDate, commitment.approvedAt);

            if (comparison < 0) {
                newErrors.startDate = t('cropSeasons.edit.validation.startDateAfterApproved');
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
            AppToast.error(t('cropSeasons.edit.validation.checkFormErrors'));
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
                AppToast.success(t('cropSeasons.edit.success'));
                router.push('/dashboard/farmer/crop-seasons');
            } else {
                AppToast.error(result.error || t('cropSeasons.edit.error'));
            }
        } catch (err) {
            AppToast.error(getErrorMessage(err));
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) return <p className="text-center py-10">{t('cropSeasons.edit.loading')}</p>;

    if (!season) return <p className="text-center py-10 text-red-500">{t('cropSeasons.edit.notFound')}</p>;

    return (
        <div className="max-w-2xl mx-auto py-10 px-4">
            <Card>
                <CardHeader>
                    <CardTitle>{t('cropSeasons.edit.title')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label htmlFor="seasonName">{t('cropSeasons.edit.form.seasonName.label')} <span className="text-red-500">{t('cropSeasons.common.requiredField')}</span></Label>
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
                            <Label htmlFor="startDate">{t('cropSeasons.edit.form.startDate.label')} <span className="text-red-500">{t('cropSeasons.common.requiredField')}</span></Label>
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
                            <Label htmlFor="endDate">{t('cropSeasons.edit.form.endDate.label')} <span className="text-red-500">{t('cropSeasons.common.requiredField')}</span></Label>
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
                        <Label htmlFor="note">{t('cropSeasons.edit.form.note.label')}</Label>
                        <Textarea name="note" value={form.note} onChange={handleChange} />
                    </div>

                    <div className="border-t pt-4">
                        <p className="text-sm text-muted-foreground mb-1">{t('cropSeasons.edit.commitmentInfo')}</p>
                        <p><strong>{t('cropSeasons.edit.commitmentName')}:</strong> {season.commitmentName}</p>
                        <p><strong>{t('cropSeasons.edit.registrationCode')}:</strong> {season.registrationCode}</p>
                        <p><strong>{t('cropSeasons.edit.registeredArea')}:</strong> {season.area} ha</p>

                        {commitment && commitment.approvedAt && (
                            <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                <p className="text-sm text-blue-700">
                                    <strong>{t('cropSeasons.edit.approvedDate')}:</strong> {new Date(commitment.approvedAt).toLocaleDateString('vi-VN')}
                                </p>
                                <p className="text-xs text-blue-600 mt-1">
                                    {t('cropSeasons.edit.approvedDateNote')}
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button onClick={handleSubmit} disabled={isSubmitting}>
                            {isSubmitting ? t('cropSeasons.edit.form.updating') : t('cropSeasons.edit.form.submit')}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
