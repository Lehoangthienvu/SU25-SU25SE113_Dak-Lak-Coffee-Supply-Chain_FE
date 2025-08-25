"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthGuard } from "@/lib/auth/useAuthGuard";
import { getAllFarmerReportsForManager, GeneralFarmerReportViewForManagerDto } from "@/lib/api/generalFarmerReports";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FiFileText, FiSearch, FiFilter, FiEye, FiClock, FiCheckCircle, FiXCircle, FiMessageSquare } from "react-icons/fi";

export default function ManagerReportsPage() {
    useAuthGuard(["manager"]);
    const router = useRouter();

    const [reports, setReports] = useState<GeneralFarmerReportViewForManagerDto[]>([]);
    const [filteredReports, setFilteredReports] = useState<GeneralFarmerReportViewForManagerDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [selectedStatus, setSelectedStatus] = useState<"all" | "resolved" | "unresolved">("all");

    useEffect(() => {
        // Debug: Kiểm tra role của user
        const userRole = localStorage.getItem("user_role");
        const userRoleRaw = localStorage.getItem("user_role_raw");
        const token = localStorage.getItem("access_token");
        console.log("🔍 Debug - User Role (slug):", userRole);
        console.log("🔍 Debug - User Role (raw):", userRoleRaw);
        console.log("🔍 Debug - Token exists:", !!token);

        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                console.log("🔍 Debug - JWT Payload:", payload);
                console.log("🔍 Debug - JWT Roles:", payload.role);
            } catch {
                console.log("🔍 Debug - Cannot decode JWT token");
            }
        }

        fetchReports();
    }, []);

    useEffect(() => {
        filterReports();
    }, [reports, search, selectedStatus]);

    const fetchReports = async () => {
        try {
            setLoading(true);
            const data = await getAllFarmerReportsForManager();
            setReports(data);
        } catch (error) {
            console.error("Lỗi fetch reports:", error);
        } finally {
            setLoading(false);
        }
    };

    const filterReports = () => {
        let filtered = reports;

        // Filter theo search
        if (search) {
            filtered = filtered.filter(
                (report) =>
                    report.title.toLowerCase().includes(search.toLowerCase()) ||
                    report.reportedByName.toLowerCase().includes(search.toLowerCase())
            );
        }

        // Filter theo status
        if (selectedStatus === "resolved") {
            filtered = filtered.filter((report) => report.isResolved === true);
        } else if (selectedStatus === "unresolved") {
            filtered = filtered.filter((report) => report.isResolved !== true);
        }

        setFilteredReports(filtered);
    };

    const getStatusColor = (isResolved: boolean | null) => {
        if (isResolved === true) return "bg-green-100 text-green-800";
        if (isResolved === false) return "bg-yellow-100 text-yellow-800";
        return "bg-gray-100 text-gray-800";
    };

    const getStatusIcon = (isResolved: boolean | null) => {
        if (isResolved === true) return <FiCheckCircle className="w-4 h-4" />;
        if (isResolved === false) return <FiClock className="w-4 h-4" />;
        return <FiXCircle className="w-4 h-4" />;
    };

    const getStatusText = (isResolved: boolean | null) => {
        if (isResolved === true) return "Đã xử lý";
        if (isResolved === false) return "Đang xử lý";
        return "Chưa xử lý";
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("vi-VN", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    // Tính toán statistics
    const totalReports = reports.length;
    const resolvedReports = reports.filter((r) => r.isResolved === true).length;
    const unresolvedReports = reports.filter((r) => r.isResolved !== true).length;

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-600"></div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Quản lý Báo cáo</h1>
                    <p className="text-gray-600 mt-2">
                        Theo dõi và quản lý tất cả báo cáo từ nông dân
                    </p>
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-blue-600 text-sm font-medium">Tổng tư vấn</p>
                                <p className="text-3xl font-bold text-blue-900">{totalReports}</p>
                            </div>
                            <FiFileText className="w-8 h-8 text-blue-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-green-600 text-sm font-medium">Đã xử lý</p>
                                <p className="text-3xl font-bold text-green-900">{resolvedReports}</p>
                            </div>
                            <FiCheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-yellow-600 text-sm font-medium">Đang xử lý</p>
                                <p className="text-3xl font-bold text-yellow-900">{unresolvedReports}</p>
                            </div>
                            <FiClock className="w-8 h-8 text-yellow-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-purple-600 text-sm font-medium">Tổng tư vấn</p>
                                <p className="text-3xl font-bold text-purple-900">
                                    {reports.reduce((sum, r) => sum + r.expertAdviceCount, 0)}
                                </p>
                            </div>
                            <FiMessageSquare className="w-8 h-8 text-purple-600" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                            <div className="relative">
                                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <Input
                                    placeholder="Tìm kiếm theo tiêu đề hoặc tên nông dân..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <Button
                                variant={selectedStatus === "all" ? "default" : "outline"}
                                onClick={() => setSelectedStatus("all")}
                                className="flex items-center gap-2"
                            >
                                <FiFilter className="w-4 h-4" />
                                Tất cả
                            </Button>
                            <Button
                                variant={selectedStatus === "resolved" ? "default" : "outline"}
                                onClick={() => setSelectedStatus("resolved")}
                                className="flex items-center gap-2"
                            >
                                <FiCheckCircle className="w-4 h-4" />
                                Đã xử lý
                            </Button>
                            <Button
                                variant={selectedStatus === "unresolved" ? "default" : "outline"}
                                onClick={() => setSelectedStatus("unresolved")}
                                className="flex items-center gap-2"
                            >
                                <FiClock className="w-4 h-4" />
                                Đang xử lý
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Reports Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FiFileText className="w-5 h-5 text-blue-600" />
                        Danh sách Báo cáo ({filteredReports.length})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {filteredReports.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <FiFileText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                            <p>Không có báo cáo nào</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-200">
                                        <th className="text-left py-3 px-3 font-medium text-gray-700">Mã báo cáo</th>
                                        <th className="text-left py-3 px-3 font-medium text-gray-700">Tiêu đề</th>
                                        <th className="text-left py-3 px-3 font-medium text-gray-700">Loại</th>
                                        <th className="text-left py-3 px-3 font-medium text-gray-700">Mức độ</th>
                                        <th className="text-left py-3 px-3 font-medium text-gray-700">Nông dân</th>
                                        <th className="text-left py-3 px-3 font-medium text-gray-700">Ngày báo cáo</th>
                                        <th className="text-left py-3 px-3 font-medium text-gray-700">Tư vấn</th>
                                        <th className="text-left py-3 px-3 font-medium text-gray-700">Trạng thái</th>
                                        <th className="text-left py-3 px-3 font-medium text-gray-700">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredReports.map((report) => (
                                        <tr key={report.reportId} className="hover:bg-gradient-to-r hover:from-orange-50 hover:to-amber-50 transition-all duration-200">
                                            <td className="px-3 py-3">
                                                <span className="font-mono text-xs text-gray-600">{report.reportCode}</span>
                                            </td>
                                            <td className="px-3 py-3">
                                                <div className="font-medium text-gray-900 max-w-[200px] truncate" title={report.title}>
                                                    {report.title}
                                                </div>
                                            </td>
                                            <td className="px-3 py-3">
                                                <Badge className="bg-blue-100 text-blue-800 text-xs">
                                                    {report.reportType}
                                                </Badge>
                                            </td>
                                            <td className="px-3 py-3">
                                                {report.severityLevel !== null ? (
                                                    <Badge className={
                                                        report.severityLevel === 1 ? "bg-green-100 text-green-800" :
                                                            report.severityLevel === 2 ? "bg-yellow-100 text-yellow-800" :
                                                                "bg-red-100 text-red-800"
                                                    }>
                                                        {report.severityLevel === 1 ? "Thấp" :
                                                            report.severityLevel === 2 ? "Trung bình" : "Cao"}
                                                    </Badge>
                                                ) : (
                                                    <span className="text-gray-400">-</span>
                                                )}
                                            </td>
                                            <td className="px-3 py-3">
                                                <div className="max-w-[180px]">
                                                    <div className="font-medium text-gray-900 text-sm truncate" title={report.reportedByName}>
                                                        {report.reportedByName}
                                                    </div>
                                                    <div className="text-xs text-gray-500 truncate" title={report.reportedByEmail}>
                                                        {report.reportedByEmail}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-3 py-3 text-gray-600 text-sm">
                                                {formatDate(report.reportedAt)}
                                            </td>
                                            <td className="px-3 py-3">
                                                <Badge className="bg-purple-100 text-purple-800 text-xs">
                                                    {report.expertAdviceCount} tư vấn
                                                </Badge>
                                            </td>
                                            <td className="px-3 py-3">
                                                <Badge className={getStatusColor(report.isResolved)}>
                                                    <div className="flex items-center gap-1 text-xs">
                                                        {getStatusIcon(report.isResolved)}
                                                        {getStatusText(report.isResolved)}
                                                    </div>
                                                </Badge>
                                            </td>
                                            <td className="px-3 py-3">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="flex items-center gap-1 text-xs"
                                                    onClick={() => {
                                                        router.push(`/dashboard/manager/reports/${report.reportId}`);
                                                    }}
                                                >
                                                    <FiEye className="w-3 h-3" />
                                                    Xem
                                                </Button>
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
