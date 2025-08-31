"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Edit, Trash2, Eye, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import Link from "next/link";
import { getAllExperts, softDeleteExpert, updateExpertVerification } from "@/lib/api/agriculturalExpert";
import { useAuthGuard } from "@/lib/auth/useAuthGuard";

interface AgriculturalExpert {
    expertId: string;
    expertCode: string;
    fullName: string;
    email: string;
    expertiseArea: string;
    yearsOfExperience?: number;
    affiliatedOrganization: string;
    rating?: number;
    isVerified?: boolean;
}

export default function AdminExpertsPage() {
    // Kiểm tra quyền admin
    useAuthGuard(["admin"]);

    const [experts, setExperts] = useState<AgriculturalExpert[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterVerified, setFilterVerified] = useState<string>("all");

    // Load data từ API
    const loadExperts = async () => {
        try {
            console.log("🔍 DEBUG: Component: Starting to load experts...");
            setLoading(true);
            setError(null);
            console.log("🔍 DEBUG: Component: Loading experts..."); // Debug log

            const data = await getAllExperts();
            console.log("✅ Component: Loaded experts successfully:", data); // Debug log

            setExperts(data);
            console.log("✅ Component: State updated with experts");
        } catch (error) {
            console.error("❌ Component: Error loading experts:", error);
            const errorMessage = error instanceof Error ? error.message : "Không thể tải danh sách chuyên gia!";
            console.error("❌ Component: Error message:", errorMessage);
            setError(errorMessage);
            toast.error("Không thể tải danh sách chuyên gia!");
        } finally {
            console.log("🔍 Component: Setting loading to false");
            setLoading(false);
        }
    };

    useEffect(() => {
        loadExperts();
    }, []);

    // Retry function
    const handleRetry = () => {
        loadExperts();
    };

    const filteredExperts = experts.filter((expert) => {
        const matchesSearch = expert.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            expert.expertiseArea.toLowerCase().includes(searchTerm.toLowerCase()) ||
            expert.email.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesFilter = filterVerified === "all" ||
            (filterVerified === "verified" && expert.isVerified) ||
            (filterVerified === "unverified" && !expert.isVerified);

        return matchesSearch && matchesFilter;
    });

    const handleVerify = async (expertId: string) => {
        try {
            const expert = experts.find(e => e.expertId === expertId);
            if (!expert) return;

            await updateExpertVerification(expertId, !expert.isVerified);

            // Cập nhật local state
            setExperts(prev => prev.map(expert =>
                expert.expertId === expertId
                    ? { ...expert, isVerified: !expert.isVerified }
                    : expert
            ));
            toast.success("Cập nhật trạng thái xác thực thành công!");
        } catch (error) {
            console.error("Lỗi khi cập nhật trạng thái xác thực:", error);
            toast.error("Không thể cập nhật trạng thái xác thực!");
        }
    };

    const handleSoftDelete = async (expertId: string) => {
        if (confirm("Bạn có chắc chắn muốn xóa mềm chuyên gia này?")) {
            try {
                await softDeleteExpert(expertId);
                setExperts(prev => prev.filter(expert => expert.expertId !== expertId));
                toast.success("Xóa mềm chuyên gia thành công!");
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

    if (error) {
        return (
            <div className="text-center py-12">
                <div className="text-red-600 mb-4">
                    <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">Đã xảy ra lỗi</h2>
                <p className="text-gray-600 mb-4">{error}</p>
                <Button onClick={handleRetry} className="bg-orange-600 hover:bg-orange-700">
                    Thử lại
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Quản lý chuyên gia</h1>
                    <p className="text-gray-600 mt-2">Quản lý danh sách chuyên gia nông nghiệp</p>
                </div>
                <Button className="bg-orange-600 hover:bg-orange-700" asChild>
                    <Link href="/dashboard/admin/experts/create">
                        <Plus className="w-4 h-4 mr-2" />
                        Thêm chuyên gia
                    </Link>
                </Button>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex gap-4 items-center">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <Input
                                    placeholder="Tìm kiếm theo tên, lĩnh vực, email..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                        <select
                            value={filterVerified}
                            onChange={(e) => setFilterVerified(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                            title="Lọc theo trạng thái xác thực"
                        >
                            <option value="all">Tất cả trạng thái</option>
                            <option value="verified">Đã xác thực</option>
                            <option value="unverified">Chưa xác thực</option>
                        </select>
                    </div>
                </CardContent>
            </Card>

            {/* Experts List */}
            <Card>
                <CardHeader>
                    <CardTitle>Danh sách chuyên gia ({filteredExperts.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    {filteredExperts.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-gray-500">Không tìm thấy chuyên gia nào.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-200">
                                        <th className="text-left py-3 px-4 font-medium text-gray-700">Mã chuyên gia</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-700">Họ tên</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-700">Email</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-700">Lĩnh vực</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-700">Kinh nghiệm</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-700">Đánh giá</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-700">Trạng thái</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-700">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredExperts.map((expert) => (
                                        <tr key={expert.expertId} className="border-b border-gray-100 hover:bg-gray-50">
                                            <td className="py-3 px-4">
                                                <Badge variant="outline" className="font-mono">
                                                    {expert.expertCode}
                                                </Badge>
                                            </td>
                                            <td className="py-3 px-4 font-medium">{expert.fullName}</td>
                                            <td className="py-3 px-4 text-gray-600">{expert.email}</td>
                                            <td className="py-3 px-4">
                                                <Badge variant="secondary">{expert.expertiseArea}</Badge>
                                            </td>
                                            <td className="py-3 px-4 text-gray-600">
                                                {expert.yearsOfExperience ? `${expert.yearsOfExperience} năm` : "N/A"}
                                            </td>
                                            <td className="py-3 px-4">
                                                {expert.rating ? (
                                                    <div className="flex items-center gap-1">
                                                        <span className="text-yellow-600">★</span>
                                                        <span className="font-medium">{expert.rating}</span>
                                                    </div>
                                                ) : (
                                                    "N/A"
                                                )}
                                            </td>
                                            <td className="py-3 px-4">
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
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleVerify(expert.expertId)}
                                                        className="h-8 w-8 p-0"
                                                        title={expert.isVerified ? "Bỏ xác thực" : "Xác thực"}
                                                    >
                                                        {expert.isVerified ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-8 w-8 p-0"
                                                        title="Xem chi tiết"
                                                        asChild
                                                    >
                                                        <Link href={`/dashboard/admin/experts/${expert.expertId}`}>
                                                            <Eye className="w-4 h-4" />
                                                        </Link>
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-8 w-8 p-0"
                                                        title="Chỉnh sửa"
                                                        asChild
                                                    >
                                                        <Link href={`/dashboard/admin/experts/${expert.expertId}/edit`}>
                                                            <Edit className="w-4 h-4" />
                                                        </Link>
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleSoftDelete(expert.expertId)}
                                                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                                        title="Xóa mềm"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
