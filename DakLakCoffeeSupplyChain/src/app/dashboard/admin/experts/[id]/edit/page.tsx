"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Save, Edit } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { getExpertById, updateExpert } from "@/lib/api/agriculturalExpert";
import { useAuthGuard } from "@/lib/auth/useAuthGuard";

interface AgriculturalExpert {
    expertId: string;
    expertCode: string;
    fullName: string;
    email: string;
    phoneNumber: string;
    expertiseArea: string;
    qualifications: string;
    yearsOfExperience?: number;
    affiliatedOrganization: string;
    bio: string;
    rating?: number;
    isVerified?: boolean;
    createdAt: string;
    updatedAt: string;
}

export default function EditExpertPage() {
    // Kiểm tra quyền admin
    useAuthGuard(["admin"]);

    const router = useRouter();
    const params = useParams();
    const expertId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [expert, setExpert] = useState<AgriculturalExpert | null>(null);
    const [formData, setFormData] = useState({
        expertiseArea: "",
        qualifications: "",
        yearsOfExperience: "",
        affiliatedOrganization: "",
        bio: "",
        rating: "",
        isVerified: false,
    });

    const expertiseAreas = [
        "Trồng trọt cà phê",
        "Bảo vệ thực vật",
        "Chế biến cà phê",
        "Quản lý chất lượng",
        "Kinh tế nông nghiệp",
        "Công nghệ sinh học",
        "Thổ nhưỡng và dinh dưỡng ùng trồng",
        "Khác",
    ];

    // Load data từ API
    const loadExpert = async () => {
        try {
            setLoading(true);
            const data = await getExpertById(expertId);
            setExpert(data);

            // Cập nhật form data
            setFormData({
                expertiseArea: data.expertiseArea,
                qualifications: data.qualifications,
                yearsOfExperience: data.yearsOfExperience?.toString() || "",
                affiliatedOrganization: data.affiliatedOrganization,
                bio: data.bio || "",
                rating: data.rating?.toString() || "",
                isVerified: data.isVerified || false,
            });
        } catch (error) {
            console.error("Lỗi khi tải thông tin chuyên gia:", error);
            toast.error("Không thể tải thông tin chuyên gia!");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (expertId) {
            loadExpert();
        }
    }, [expertId]);

    const handleInputChange = (field: string, value: string | boolean) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            // Validate required fields
            if (!formData.expertiseArea || !formData.qualifications || !formData.affiliatedOrganization) {
                toast.error("Vui lòng điền đầy đủ thông tin bắt buộc!");
                return;
            }

            const updateData = {
                expertId: expertId,
                expertiseArea: formData.expertiseArea,
                qualifications: formData.qualifications,
                yearsOfExperience: formData.yearsOfExperience ? parseInt(formData.yearsOfExperience) : undefined,
                affiliatedOrganization: formData.affiliatedOrganization,
                bio: formData.bio || undefined,
                rating: formData.rating ? parseFloat(formData.rating) : undefined,
                isVerified: formData.isVerified,
            };

            await updateExpert(expertId, updateData);
            toast.success("Cập nhật chuyên gia thành công!");
            router.push(`/dashboard/admin/experts/${expertId}`);
        } catch (error) {
            console.error("Lỗi khi cập nhật chuyên gia:", error);
            toast.error("Có lỗi xảy ra khi cập nhật chuyên gia!");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
            </div>
        );
    }

    if (!expert) {
        return (
            <div className="text-center py-12">
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">Không tìm thấy chuyên gia</h2>
                <p className="text-gray-600 mb-4">Chuyên gia bạn đang tìm kiếm không tồn tại.</p>
                <Button onClick={() => router.push("/dashboard/admin/experts")}>
                    Quay lại danh sách
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button
                    variant="outline"
                    onClick={() => router.back()}
                    className="flex items-center gap-2"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Quay lại
                </Button>
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Chỉnh sửa chuyên gia</h1>
                    <p className="text-gray-600 mt-2">Cập nhật thông tin chuyên gia: {expert.fullName}</p>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Thông tin cá nhân (chỉ đọc) */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Edit className="w-5 h-5" />
                                Thông tin cá nhân (chỉ đọc)
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label>Mã chuyên gia</Label>
                                <Input value={expert.expertCode} disabled className="bg-gray-50" />
                            </div>

                            <div>
                                <Label>Họ và tên</Label>
                                <Input value={expert.fullName} disabled className="bg-gray-50" />
                            </div>

                            <div>
                                <Label>Email</Label>
                                <Input value={expert.email} disabled className="bg-gray-50" />
                            </div>

                            <div>
                                <Label>Số điện thoại</Label>
                                <Input value={expert.phoneNumber || "N/A"} disabled className="bg-gray-50" />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Thông tin chuyên môn (có thể chỉnh sửa) */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Thông tin chuyên môn</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label htmlFor="expertiseArea">Lĩnh vực chuyên môn *</Label>
                                <Select
                                    value={formData.expertiseArea}
                                    onValueChange={(value) => handleInputChange("expertiseArea", value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Chọn lĩnh vực chuyên môn" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {expertiseAreas.map((area) => (
                                            <SelectItem key={area} value={area}>
                                                {area}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label htmlFor="qualifications">Bằng cấp/Chứng chỉ *</Label>
                                <Input
                                    id="qualifications"
                                    value={formData.qualifications}
                                    onChange={(e) => handleInputChange("qualifications", e.target.value)}
                                    placeholder="Ví dụ: Thạc sĩ Nông nghiệp, Chứng chỉ ISO..."
                                    required
                                />
                            </div>

                            <div>
                                <Label htmlFor="yearsOfExperience">Số năm kinh nghiệm</Label>
                                <Input
                                    id="yearsOfExperience"
                                    type="number"
                                    min="0"
                                    max="50"
                                    value={formData.yearsOfExperience}
                                    onChange={(e) => handleInputChange("yearsOfExperience", e.target.value)}
                                    placeholder="Số năm kinh nghiệm"
                                />
                            </div>

                            <div>
                                <Label htmlFor="affiliatedOrganization">Tổ chức liên kết *</Label>
                                <Input
                                    id="affiliatedOrganization"
                                    value={formData.affiliatedOrganization}
                                    onChange={(e) => handleInputChange("affiliatedOrganization", e.target.value)}
                                    placeholder="Tên tổ chức, công ty, viện nghiên cứu..."
                                    required
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Thông tin bổ sung */}
                <Card>
                    <CardHeader>
                        <CardTitle>Thông tin bổ sung</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label htmlFor="bio">Tiểu sử</Label>
                            <Textarea
                                id="bio"
                                value={formData.bio}
                                onChange={(e) => handleInputChange("bio", e.target.value)}
                                placeholder="Mô tả ngắn về kinh nghiệm, thành tựu, chuyên môn..."
                                rows={4}
                            />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="rating">Đánh giá</Label>
                                <Select
                                    value={formData.rating}
                                    onValueChange={(value) => handleInputChange("rating", value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Chọn mức đánh giá" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1.0">1.0 - Rất kém</SelectItem>
                                        <SelectItem value="2.0">2.0 - Kém</SelectItem>
                                        <SelectItem value="3.0">3.0 - Trung bình</SelectItem>
                                        <SelectItem value="4.0">4.0 - Khá</SelectItem>
                                        <SelectItem value="5.0">5.0 - Xuất sắc</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="isVerified"
                                    checked={formData.isVerified}
                                    onChange={(e) => handleInputChange("isVerified", e.target.checked)}
                                    className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                                    title="Đánh dấu chuyên gia đã được xác thực"
                                />
                                <Label htmlFor="isVerified">Đã xác thực</Label>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex justify-end gap-4 pt-6">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.back()}
                        disabled={saving}
                    >
                        Hủy
                    </Button>
                    <Button
                        type="submit"
                        disabled={saving}
                        className="bg-orange-600 hover:bg-orange-700"
                    >
                        {saving ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                            <>
                                <Save className="w-4 h-4 mr-2" />
                                Cập nhật
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}
