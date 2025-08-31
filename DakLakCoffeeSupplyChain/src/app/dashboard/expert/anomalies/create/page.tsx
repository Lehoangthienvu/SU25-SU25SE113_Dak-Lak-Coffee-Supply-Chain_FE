'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createExpertAdvice, createExpertAdviceWithFiles } from '@/lib/api/expertAdvice';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowLeft, MessageSquare, Upload, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';

function CreateAnomalyContent() {
    const { t } = useTranslation();
    const router = useRouter();
    const searchParams = useSearchParams();
    const reportId = searchParams.get('reportId');

    const [form, setForm] = useState({
        responseType: 'Observation',
        adviceSource: '',
        adviceText: '',
        attachedFiles: [] as File[],
    });

    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!reportId) {
            toast.error(t('expertAnomalies.createAnomalyPage.errors.noReportId'));
            return;
        }

        setLoading(true);

        try {
            // Validation trước khi gửi
            if (!form.adviceText.trim()) {
                toast.error(t('expertAnomalies.createAnomalyPage.errors.contentRequired'));
                return;
            }

            // Kiểm tra xem có file upload không để quyết định content type
            const hasFiles = form.attachedFiles.length > 0;

            if (hasFiles) {
                // Có file - sử dụng FormData
                const formData = new FormData();
                formData.append("reportId", reportId);
                formData.append("responseType", form.responseType);
                if (form.adviceSource) formData.append("adviceSource", form.adviceSource);
                formData.append("adviceText", form.adviceText);

                // Thêm files
                form.attachedFiles.forEach(file => formData.append("attachedFiles", file));

                // Gọi API với FormData
                await createExpertAdviceWithFiles(formData);
            } else {
                // Không có file - sử dụng JSON
                await createExpertAdvice({
                    reportId,
                    responseType: form.responseType,
                    adviceSource: form.adviceSource,
                    adviceText: form.adviceText,
                });
            }

            toast.success(t('expertAnomalies.createAnomalyPage.success.submitSuccess'));

            // Quay lại trang danh sách anomalies
            router.push('/dashboard/expert/anomalies');
        } catch (err: any) {
            console.error('Lỗi gửi phản hồi:', err);
            if (err.response?.data?.message) {
                toast.error(t('expertAnomalies.createAnomalyPage.errors.apiError', { message: err.response.data.message }));
            } else if (err.message) {
                toast.error(t('expertAnomalies.createAnomalyPage.errors.apiError', { message: err.message }));
            } else {
                toast.error(t('expertAnomalies.createAnomalyPage.errors.submitFailed'));
            }
        } finally {
            setLoading(false);
        }
    };

    if (!reportId) {
        return (
            <div className="p-6">
                <div className="text-center py-12">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileText className="w-8 h-8 text-red-600" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-700 mb-2">{t('expertAnomalies.createAnomalyPage.notFound.title')}</h2>
                    <p className="text-gray-500 mb-4">{t('expertAnomalies.createAnomalyPage.notFound.description')}</p>
                    <Button onClick={() => router.push('/dashboard/expert/anomalies')} variant="outline">
                        {t('expertAnomalies.createAnomalyPage.notFound.backToList')}
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.back()}
                    className="p-2"
                >
                    <ArrowLeft className="w-4 h-4" />
                </Button>
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-green-600" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">{t('expertAnomalies.createAnomalyPage.title')}</h1>
                    <p className="text-gray-600">{t('expertAnomalies.createAnomalyPage.subtitle')}</p>
                </div>
            </div>

            <div className="max-w-2xl mx-auto">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MessageSquare className="w-5 h-5 text-green-600" />
                            {t('expertAnomalies.createAnomalyPage.form.title')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="responseType">{t('expertAnomalies.createAnomalyPage.form.responseType.label')}</Label>
                                <select
                                    id="responseType"
                                    name="responseType"
                                    value={form.responseType}
                                    onChange={handleChange}
                                    aria-label={t('expertAnomalies.createAnomalyPage.form.responseType.placeholder')}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                >
                                    <option value="Preventive">{t('expertAnomalies.createAnomalyPage.form.responseType.options.preventive')}</option>
                                    <option value="Corrective">{t('expertAnomalies.createAnomalyPage.form.responseType.options.corrective')}</option>
                                    <option value="Observation">{t('expertAnomalies.createAnomalyPage.form.responseType.options.observation')}</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="adviceSource">{t('expertAnomalies.createAnomalyPage.form.adviceSource.label')}</Label>
                                <Input
                                    id="adviceSource"
                                    type="text"
                                    name="adviceSource"
                                    value={form.adviceSource}
                                    onChange={handleChange}
                                    placeholder={t('expertAnomalies.createAnomalyPage.form.adviceSource.placeholder')}
                                    className="w-full"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="adviceText">{t('expertAnomalies.createAnomalyPage.form.adviceText.label')}</Label>
                                <Textarea
                                    id="adviceText"
                                    name="adviceText"
                                    value={form.adviceText}
                                    onChange={handleChange}
                                    rows={6}
                                    placeholder={t('expertAnomalies.createAnomalyPage.form.adviceText.placeholder')}
                                    className="w-full resize-none"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="attachedFiles">{t('expertAnomalies.createAnomalyPage.form.attachedFiles.label')}</Label>
                                <Input
                                    id="attachedFiles"
                                    type="file"
                                    multiple
                                    accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.rtf,image/*,video/*"
                                    onChange={(e) => {
                                        const files = Array.from(e.target.files || []);
                                        setForm(prev => ({ ...prev, attachedFiles: files }));
                                    }}
                                    className="w-full cursor-pointer"
                                />
                                {form.attachedFiles.length > 0 && (
                                    <div className="text-sm text-green-600 font-medium flex items-center gap-2">
                                        <Upload className="w-4 h-4" />
                                        {t('expertAnomalies.createAnomalyPage.form.attachedFiles.selectedFiles', { count: form.attachedFiles.length })}
                                    </div>
                                )}
                                <div className="text-xs text-gray-500">
                                    {t('expertAnomalies.createAnomalyPage.form.attachedFiles.supportedFormats')}
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => router.back()}
                                    className="flex-1"
                                >
                                    {t('expertAnomalies.createAnomalyPage.actions.cancel')}
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 bg-green-600 hover:bg-green-700"
                                >
                                    {loading ? t('expertAnomalies.createAnomalyPage.actions.submitting') : t('expertAnomalies.createAnomalyPage.actions.submit')}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

export default function CreateAnomalyPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <CreateAnomalyContent />
        </Suspense>
    );
}
