"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";

interface WasteDisposalForm {
    disposalMethod: string;
    wasteId: string;
    handledAt: string;
    notes: string;
    isSold: boolean;
    revenue: string;
}

export default function EditWasteDisposalPage() {
    const router = useRouter();
    const params = useParams();
    const disposalId = params?.id as string;

    const [form, setForm] = useState<WasteDisposalForm>({
        disposalMethod: "",
        wasteId: "",
        handledAt: "",
        notes: "",
        isSold: false,
        revenue: "",
    });
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);

    useEffect(() => {
        const fetchDisposalData = async () => {
            try {
                setInitialLoading(true);
                // TODO: Implement getProcessingWasteDisposalById API call
                // For now, we'll set default values
                setForm({
                    disposalMethod: "Compost",
                    wasteId: "",
                    handledAt: new Date().toISOString().split('T')[0],
                    notes: "",
                    isSold: false,
                    revenue: "",
                });
            } catch (error) {
                console.error('Lỗi khi tải dữ liệu:', error);
                toast.error('Lỗi khi tải dữ liệu');
                router.push('/dashboard/farmer/waste');
            } finally {
                setInitialLoading(false);
            }
        };

        if (disposalId) {
            fetchDisposalData();
        }
    }, [disposalId, router]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            setForm({ ...form, [name]: checked });
        } else {
            setForm({ ...form, [name]: value });
        }
    };

    const handleSelectChange = (name: string, value: string) => {
        setForm({ ...form, [name]: value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            setLoading(true);

            // Validate form
            if (!form.disposalMethod.trim()) {
                toast.error('Phương pháp xử lý không được để trống');
                return;
            }

            if (!form.handledAt) {
                toast.error('Ngày xử lý không được để trống');
                return;
            }

            // TODO: Implement updateProcessingWasteDisposal API call
            // const updateData = {
            //   disposalMethod: form.disposalMethod,
            //   wasteId: form.wasteId,
            //   handledAt: new Date(form.handledAt),
            //   notes: form.notes,
            //   isSold: form.isSold,
            //   revenue: form.revenue ? parseFloat(form.revenue) : null,
            // };

            // await updateProcessingWasteDisposal(disposalId, updateData);

            toast.success('Cập nhật xử lý chất thải thành công');
            router.push(`/dashboard/farmer/waste/${disposalId}`);
        } catch (error) {
            console.error('Lỗi khi cập nhật:', error);
            toast.error('Có lỗi xảy ra khi cập nhật');
        } finally {
            setLoading(false);
        }
    };

    if (initialLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-amber-800 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Đang tải dữ liệu...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto py-10 px-4">
            <div className="mb-6">
                <Link
                    href={`/dashboard/farmer/waste/${disposalId}`}
                    className="inline-flex items-center text-amber-800 hover:text-amber-900"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Quay lại chi tiết xử lý chất thải
                </Link>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl font-bold text-amber-800">
                        Chỉnh sửa Xử lý Chất thải
                    </CardTitle>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="disposalMethod" className="text-sm font-medium">
                                Phương pháp xử lý <span className="text-red-500">*</span>
                            </Label>
                            <Select
                                value={form.disposalMethod}
                                onValueChange={(value) => handleSelectChange('disposalMethod', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Chọn phương pháp xử lý" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Compost">Ủ phân compost</SelectItem>
                                    <SelectItem value="Sell">Bán lại</SelectItem>
                                    <SelectItem value="Discard">Vứt bỏ</SelectItem>
                                    <SelectItem value="Recycle">Tái chế</SelectItem>
                                    <SelectItem value="Other">Khác</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="handledAt" className="text-sm font-medium">
                                Ngày xử lý <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="handledAt"
                                name="handledAt"
                                type="date"
                                value={form.handledAt}
                                onChange={handleChange}
                                required
                                className="w-full"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="notes" className="text-sm font-medium">
                                Ghi chú
                            </Label>
                            <Textarea
                                id="notes"
                                name="notes"
                                value={form.notes}
                                onChange={handleChange}
                                placeholder="Nhập ghi chú về quá trình xử lý..."
                                rows={3}
                                className="w-full"
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="isSold"
                                    name="isSold"
                                    checked={form.isSold}
                                    onChange={handleChange}
                                    className="rounded border-gray-300 text-amber-800 focus:ring-amber-800"
                                    aria-label="Đánh dấu nếu chất thải đã được bán lại"
                                />
                                <Label htmlFor="isSold" className="text-sm font-medium">
                                    Đã bán lại
                                </Label>
                            </div>
                        </div>

                        {form.isSold && (
                            <div className="space-y-2">
                                <Label htmlFor="revenue" className="text-sm font-medium">
                                    Doanh thu (VNĐ)
                                </Label>
                                <Input
                                    id="revenue"
                                    name="revenue"
                                    type="number"
                                    value={form.revenue}
                                    onChange={handleChange}
                                    placeholder="Nhập doanh thu nếu có bán..."
                                    className="w-full"
                                />
                            </div>
                        )}

                        <div className="flex space-x-4 pt-4">
                            <Button
                                type="submit"
                                className="bg-amber-800 hover:bg-amber-900 text-white flex-1"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        Đang cập nhật...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4 mr-2" />
                                        Cập nhật
                                    </>
                                )}
                            </Button>

                            <Link href={`/dashboard/farmer/waste/${disposalId}`}>
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="flex-1"
                                >
                                    Hủy
                                </Button>
                            </Link>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
