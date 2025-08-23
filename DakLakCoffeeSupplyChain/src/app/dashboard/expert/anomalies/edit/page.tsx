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

function EditAnomalyContent() {
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
                toast.error('Không thể tải thông tin phản hồi');
                router.push('/dashboard/expert/anomalies');
            }
        } catch (error) {
            console.error('Lỗi khi tải dữ liệu:', error);
            toast.error('Lỗi khi tải dữ liệu');
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
            toast.error('Không tìm thấy ID phản hồi');
            return;
        }

        if (!form.adviceText.trim()) {
            toast.error('Vui lòng nhập nội dung phản hồi');
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
                toast.success('Cập nhật phản hồi thành công!');
                router.push('/dashboard/expert/anomalies');
            } else {
                const errorData = await response.json();
                toast.error(errorData.message || 'Cập nhật thất bại');
            }
        } catch (error) {
            console.error('Lỗi khi cập nhật:', error);
            toast.error('Lỗi hệ thống khi cập nhật');
        } finally {
            setLoading(false);
        }
    };

    if (initialLoading) {
        return (
            <div className="p-6">
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Đang tải dữ liệu...</p>
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
                    <h2 className="text-xl font-semibold text-gray-700 mb-2">Không tìm thấy phản hồi</h2>
                    <p className="text-gray-500 mb-4">Vui lòng quay lại trang danh sách để chọn phản hồi cần chỉnh sửa</p>
                    <Button onClick={() => router.push('/dashboard/expert/anomalies')} variant="outline">
                        Quay lại danh sách
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
                    <h1 className="text-2xl font-bold text-gray-800">Chỉnh sửa phản hồi chuyên gia</h1>
                    <p className="text-gray-600">Cập nhật thông tin và nội dung phản hồi</p>
                </div>
            </div>

            <div className="max-w-2xl mx-auto">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MessageSquare className="w-5 h-5 text-blue-600" />
                            Thông tin phản hồi
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="responseType">Loại phản hồi *</Label>
                                <select
                                    id="responseType"
                                    name="responseType"
                                    value={form.responseType}
                                    onChange={handleChange}
                                    aria-label="Chọn loại phản hồi"
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="">Chọn loại phản hồi</option>
                                    <option value="Preventive">Phòng ngừa</option>
                                    <option value="Corrective">Khắc phục</option>
                                    <option value="Observation">Nhận xét</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="adviceSource">Nguồn tham khảo (tùy chọn)</Label>
                                <Input
                                    id="adviceSource"
                                    name="adviceSource"
                                    value={form.adviceSource}
                                    onChange={handleChange}
                                    placeholder="Ví dụ: Thực tế đồng ruộng, báo cáo nghiên cứu, kinh nghiệm chuyên môn..."
                                    className="w-full"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="adviceText">Nội dung phản hồi *</Label>
                                <Textarea
                                    id="adviceText"
                                    name="adviceText"
                                    value={form.adviceText}
                                    onChange={handleChange}
                                    rows={6}
                                    placeholder="Nhập nội dung phản hồi chi tiết..."
                                    className="w-full resize-none"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="attachedFileUrl">URL file đính kèm (tùy chọn)</Label>
                                <Input
                                    id="attachedFileUrl"
                                    name="attachedFileUrl"
                                    value={form.attachedFileUrl}
                                    onChange={handleChange}
                                    placeholder="https://example.com/file.pdf"
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
                                    Hủy
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                                >
                                    {loading ? 'Đang cập nhật...' : 'Cập nhật phản hồi'}
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
