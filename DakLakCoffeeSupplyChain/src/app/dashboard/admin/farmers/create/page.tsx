"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function CreateFarmer() {
    const router = useRouter();
    const [form, setForm] = useState({
        farmerCode: "",
        farmLocation: "",
        farmSize: "",
        certificationStatus: "",
        certificationUrl: ""
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // TODO: Implement API call to create farmer
            await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call

            toast.success("Tạo nông dân thành công!");
            router.push("/dashboard/admin/farmers");
        } catch (error) {
            toast.error("Tạo nông dân thất bại!");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full flex justify-center items-start">
            <Card className="w-full max-w-xl">
                <CardHeader>
                    <CardTitle>Tạo nông dân mới</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Mã nông dân <span className="text-red-500">*</span>
                            </label>
                            <input
                                name="farmerCode"
                                value={form.farmerCode}
                                onChange={handleChange}
                                className="w-full border rounded px-3 py-2"
                                required
                                placeholder="FRM-2025-0001"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Địa điểm nông trại <span className="text-red-500">*</span>
                            </label>
                            <input
                                name="farmLocation"
                                value={form.farmLocation}
                                onChange={handleChange}
                                className="w-full border rounded px-3 py-2"
                                required
                                placeholder="Xã Ea Tu, TP. Buôn Ma Thuột"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Diện tích (ha)
                            </label>
                            <input
                                name="farmSize"
                                type="number"
                                step="0.1"
                                value={form.farmSize}
                                onChange={handleChange}
                                className="w-full border rounded px-3 py-2"
                                placeholder="2.5"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Trạng thái chứng nhận
                            </label>
                            <input
                                name="certificationStatus"
                                value={form.certificationStatus}
                                onChange={handleChange}
                                className="w-full border rounded px-3 py-2"
                                placeholder="VietGAP, Organic, GlobalGAP..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">
                                URL chứng nhận
                            </label>
                            <input
                                name="certificationUrl"
                                type="url"
                                value={form.certificationUrl}
                                onChange={handleChange}
                                className="w-full border rounded px-3 py-2"
                                placeholder="https://example.com/certification.pdf"
                            />
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.back()}
                            >
                                Hủy
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {loading ? "Đang tạo..." : "Tạo nông dân"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
