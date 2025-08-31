"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Edit, Trash2, CheckCircle, XCircle, Star, Calendar, Building, Award } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import Link from "next/link";
import { getExpertById, softDeleteExpert, updateExpertVerification } from "@/lib/api/agriculturalExpert";
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

export default function ExpertDetailPage() {
    // Kiểm tra quyền admin
    useAuthGuard(["admin"]);

    const router = useRouter();
    const params = useParams();
    const expertId = params.id as string;

    const [expert, setExpert] = useState<AgriculturalExpert | null>(null);
    const [loading, setLoading] = useState(true);

    // Load data từ API
    const loadExpert = async () => {
        try {
            setLoading(true);
            const data = await getExpertById(expertId);
            setExpert(data);
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

    const handleVerify = async () => {
        if (expert) {
            try {
                await updateExpertVerification(expertId, !expert.isVerified);

                // Cập nhật local state
                setExpert(prev => prev ? { ...prev, isVerified: !prev.isVerified } : null);
                toast.success("Cập nhật trạng thái xác thực thành công!");
            } catch (error) {
                console.error("Lỗi khi cập nhật trạng thái xác thực:", error);
                toast.error("Không thể cập nhật trạng thái xác thực!");
            }
        }
    };

    const handleSoftDelete = async () => {
        if (confirm("Bạn có chắc chắn muốn xóa mềm chuyên gia này?")) {
            try {
                await softDeleteExpert(expertId);
                toast.success("Xóa mềm chuyên gia thành công!");
                router.push("/dashboard/admin/experts");
            } catch (error) {
                console.error("Lỗi khi xóa mềm chuyên gia:", error);
                toast.error("Không thể xóa mềm chuyên gia!");
            }
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
            <div className="flex justify-between items-start">
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
                        <h1 className="text-3xl font-bold text-gray-900">{expert.fullName}</h1>
                        <p className="text-gray-600 mt-2">Chi tiết chuyên gia nông nghiệp</p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={handleVerify}
                        className={expert.isVerified ? "text-red-600 hover:text-red-700" : "text-green-600 hover:text-green-700"}
                    >
                        {expert.isVerified ? (
                            <>
                                <XCircle className="w-4 h-4 mr-2" />
                                Bỏ xác thực
                            </>
                        ) : (
                            <>
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Xác thực
                            </>
                        )}
                    </Button>

                    <Button variant="outline" asChild>
                        <Link href={`/dashboard/admin/experts/${expertId}/edit`}>
                            <Edit className="w-4 h-4 mr-2" />
                            Chỉnh sửa
                        </Link>
                    </Button>

                    <Button variant="outline" onClick={handleSoftDelete} className="text-red-600 hover:text-red-700">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Xóa mềm
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Thông tin chính */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Thông tin cá nhân */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Building className="w-5 h-5" />
                                Thông tin cá nhân
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Mã chuyên gia</label>
                                    <div className="mt-1">
                                        <Badge variant="outline" className="font-mono text-base">
                                            {expert.expertCode}
                                        </Badge>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Trạng thái</label>
                                    <div className="mt-1">
                                        {expert.isVerified ? (
                                            <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                                                <CheckCircle className="w-3 h-3 mr-1" />
                                                Đã xác thực
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="text-orange-600 border-orange-200">
                                                <XCircle className="w-3 h-3 mr-1" />
                                                Chưa xác thực
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-500">Họ và tên</label>
                                <p className="mt-1 text-lg font-medium">{expert.fullName}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Email</label>
                                    <p className="mt-1">{expert.email}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Số điện thoại</label>
                                    <p className="mt-1">{expert.phoneNumber || "N/A"}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Thông tin chuyên môn */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Award className="w-5 h-5" />
                                Thông tin chuyên môn
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-gray-500">Lĩnh vực chuyên môn</label>
                                <div className="mt-1">
                                    <Badge variant="secondary" className="text-base">
                                        {expert.expertiseArea}
                                    </Badge>
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-500">Bằng cấp/Chứng chỉ</label>
                                <p className="mt-1">{expert.qualifications}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Số năm kinh nghiệm</label>
                                    <p className="mt-1 flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-gray-400" />
                                        {expert.yearsOfExperience ? `${expert.yearsOfExperience} năm` : "N/A"}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Đánh giá</label>
                                    <p className="mt-1 flex items-center gap-2">
                                        <Star className="w-4 h-4 text-yellow-500" />
                                        {expert.rating ? `${expert.rating}/5.0` : "N/A"}
                                    </p>
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-500">Tổ chức liên kết</label>
                                <p className="mt-1">{expert.affiliatedOrganization}</p>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-500">Tiểu sử</label>
                                <p className="mt-1 text-gray-700 leading-relaxed">{expert.bio}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Thống kê */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Thống kê</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="text-center">
                                <div className="text-3xl font-bold text-orange-600">
                                    {expert.rating || 0}
                                </div>
                                <div className="text-sm text-gray-500">Điểm đánh giá</div>
                            </div>

                            <div className="text-center">
                                <div className="text-3xl font-bold text-blue-600">
                                    {expert.yearsOfExperience || 0}
                                </div>
                                <div className="text-sm text-gray-500">Năm kinh nghiệm</div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Thông tin hệ thống */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Thông tin hệ thống</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div>
                                <label className="text-sm font-medium text-gray-500">Ngày tạo</label>
                                <p className="mt-1 text-sm">
                                    {new Date(expert.createdAt).toLocaleDateString("vi-VN")}
                                </p>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-500">Cập nhật lần cuối</label>
                                <p className="mt-1 text-sm">
                                    {new Date(expert.updatedAt).toLocaleDateString("vi-VN")}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
