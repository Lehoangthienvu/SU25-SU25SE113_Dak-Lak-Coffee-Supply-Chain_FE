"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ArrowLeft, MessageSquare, Save, FileText } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

function EditAnomalyContent() {
    const { t } = useTranslation();
    const router = useRouter();
    const searchParams = useSearchParams();
    const adviceId = searchParams.get('adviceId');

    const [form, setForm] = useState({
        responseType: '',
        adviceSource: '',
        adviceText: '',
        attachedFileUrl: '',
    });
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);

    useEffect(() => {
        if (adviceId) {
            fetchAdviceData(adviceId);
        } else {
            setInitialLoading(false);
        }
    }, [adviceId]);

    const fetchAdviceData = async (id: string) => {
        try {
            setInitialLoading(true);
            const response = await fetch(`/api/ExpertAdvices/${id}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setForm({
                    responseType: data.responseType || '',
                    adviceSource: data.adviceSource || '',
                    adviceText: data.adviceText || '',
                    attachedFileUrl: data.attachedFileUrl || '',
                });
            } else {
                toast.error(t('editAnomalyPage.errors.loadAdvice'));
                router.push('/dashboard/expert/anomalies');
            }
        } catch (error) {
            console.error('Lỗi khi tải dữ liệu:', error);
            toast.error(t('editAnomalyPage.errors.loadData'));
            router.push('/dashboard/expert/anomalies');
        } finally {
            setInitialLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async () => {
        if (!adviceId) {
            toast.error(t('editAnomalyPage.errors.noAdviceId'));
            return;
        }

        if (!form.adviceText.trim()) {
            toast.error(t('editAnomalyPage.errors.contentRequired'));
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`/api/ExpertAdvices/${adviceId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify(form),
            });

            if (response.ok) {
                toast.success(t('editAnomalyPage.success.updateSuccess'));
                router.push('/dashboard/expert/anomalies');
            } else {
                const errorData = await response.json();
                toast.error(errorData.message || t('editAnomalyPage.errors.updateFailed'));
            }
        } catch (error) {
            console.error('Lỗi khi cập nhật:', error);
            toast.error(t('editAnomalyPage.errors.systemError'));
        } finally {
            setLoading(false);
        }
    };

    if (initialLoading) {
        return (
            <div className="p-6">
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">{t('editAnomalyPage.loading')}</p>
                </div>
            </div>
        );
    }

    if (!adviceId) {
        return (
            <div className="p-6">
                <div className="text-center py-12">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileText className="w-8 h-8 text-red-600" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-700 mb-2">{t('editAnomalyPage.notFound.title')}</h2>
                    <p className="text-gray-500 mb-4">{t('editAnomalyPage.notFound.description')}</p>
                    <Button onClick={() => router.push('/dashboard/expert/anomalies')} variant="outline">
                        {t('editAnomalyPage.notFound.backToList')}
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
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">{t('editAnomalyPage.title')}</h1>
                    <p className="text-gray-600">{t('editAnomalyPage.subtitle')}</p>
                </div>
            </div>

            <div className="max-w-2xl mx-auto">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MessageSquare className="w-5 h-5 text-blue-600" />
                            {t('editAnomalyPage.form.title')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="responseType">{t('editAnomalyPage.form.responseType.label')}</Label>
                                <select
                                    id="responseType"
                                    name="responseType"
                                    value={form.responseType}
                                    onChange={handleChange}
                                    aria-label={t('editAnomalyPage.form.responseType.placeholder')}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="">{t('editAnomalyPage.form.responseType.placeholder')}</option>
                                    <option value="Preventive">{t('editAnomalyPage.form.responseType.options.preventive')}</option>
                                    <option value="Corrective">{t('editAnomalyPage.form.responseType.options.corrective')}</option>
                                    <option value="Observation">{t('editAnomalyPage.form.responseType.options.observation')}</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="adviceSource">{t('editAnomalyPage.form.adviceSource.label')}</Label>
                                <Input
                                    id="adviceSource"
                                    name="adviceSource"
                                    value={form.adviceSource}
                                    onChange={handleChange}
                                    placeholder={t('editAnomalyPage.form.adviceSource.placeholder')}
                                    className="w-full"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="adviceText">{t('editAnomalyPage.form.adviceText.label')}</Label>
                                <Textarea
                                    id="adviceText"
                                    name="adviceText"
                                    value={form.adviceText}
                                    onChange={handleChange}
                                    rows={6}
                                    placeholder={t('editAnomalyPage.form.adviceText.placeholder')}
                                    className="w-full resize-none"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="attachedFileUrl">{t('editAnomalyPage.form.attachedFileUrl.label')}</Label>
                                <Input
                                    id="attachedFileUrl"
                                    name="attachedFileUrl"
                                    value={form.attachedFileUrl}
                                    onChange={handleChange}
                                    placeholder={t('editAnomalyPage.form.attachedFileUrl.placeholder')}
                                    className="w-full"
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => router.back()}
                                    className="flex-1"
                                >
                                    {t('editAnomalyPage.actions.cancel')}
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                                >
                                    {loading ? t('editAnomalyPage.actions.updating') : t('editAnomalyPage.actions.update')}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

export default function EditAnomalyPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <EditAnomalyContent />
        </Suspense>
    );
}
