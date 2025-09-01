"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthGuard } from "@/lib/auth/useAuthGuard";
import { getAllExpertAdvicesForManager, ExpertAdviceViewForManagerDto } from "@/lib/api/expertAdvice";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FiMessageSquare, FiSearch, FiEye, FiUser } from "react-icons/fi";

export default function ManagerExpertAdvicePage() {
    useAuthGuard(["manager"]);
    const router = useRouter();

    const [advices, setAdvices] = useState<ExpertAdviceViewForManagerDto[]>([]);
    const [filteredAdvices, setFilteredAdvices] = useState<ExpertAdviceViewForManagerDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [selectedResponseType, setSelectedResponseType] = useState<string>("all");

    useEffect(() => {
        fetchAdvices();
    }, []);

    useEffect(() => {
        filterAdvices();
    }, [advices, search, selectedResponseType]);

    const fetchAdvices = async () => {
        try {
            setLoading(true);
            const data = await getAllExpertAdvicesForManager();
            setAdvices(data);
        } catch (error) {
            console.error("Lỗi fetch expert advices:", error);
        } finally {
            setLoading(false);
        }
    };

    const filterAdvices = () => {
        let filtered = advices;

        // Filter theo search
        if (search) {
            filtered = filtered.filter(
                (advice) =>
                    advice.expertName.toLowerCase().includes(search.toLowerCase())
            );
        }

        // Filter theo response type
        if (selectedResponseType !== "all") {
            filtered = filtered.filter((advice) => advice.responseType === selectedResponseType);
        }

        setFilteredAdvices(filtered);
    };

    const getResponseTypeColor = (responseType: string) => {
        switch (responseType.toLowerCase()) {
            case "preventive":
                return "bg-blue-100 text-blue-800";
            case "corrective":
                return "bg-orange-100 text-orange-800";
            case "observation":
                return "bg-purple-100 text-purple-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    const getResponseTypeText = (responseType: string) => {
        switch (responseType.toLowerCase()) {
            case "preventive":
                return "Phòng ngừa";
            case "corrective":
                return "Khắc phục";
            case "observation":
                return "Nhận xét";
            default:
                return responseType;
        }
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
    const totalAdvices = advices.length;
    const uniqueExperts = new Set(advices.map((a) => a.expertName)).size;

    // Lấy danh sách response types duy nhất
    const responseTypes = Array.from(new Set(advices.map((a) => a.responseType)));

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 p-6 space-y-6">
            {/* Header */}
            <div className="bg-white rounded-2xl p-6 shadow-lg">
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                        <FiMessageSquare className="w-6 h-6 text-orange-600" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold mb-2 text-gray-900">Quản lý Tư vấn Chuyên gia</h1>
                        <p className="text-gray-600 text-lg">
                            Theo dõi và quản lý tất cả tư vấn từ chuyên gia nông nghiệp
                        </p>
                    </div>
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-blue-600 text-sm font-medium">Tổng tư vấn</p>
                                <p className="text-3xl font-bold text-blue-900">{totalAdvices}</p>
                            </div>
                            <FiMessageSquare className="w-8 h-8 text-blue-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-green-600 text-sm font-medium">Chuyên gia</p>
                                <p className="text-3xl font-bold text-green-900">{uniqueExperts}</p>
                            </div>
                            <FiUser className="w-8 h-8 text-green-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-orange-600 text-sm font-medium">Loại tư vấn</p>
                                <p className="text-3xl font-bold text-orange-900">{responseTypes.length}</p>
                            </div>
                            <FiMessageSquare className="w-8 h-8 text-orange-600" />
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
                                    placeholder="Tìm kiếm theo tên chuyên gia..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <select
                                value={selectedResponseType}
                                onChange={(e) => setSelectedResponseType(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                            >
                                <option value="all">Tất cả loại tư vấn</option>
                                {responseTypes.map((type) => (
                                    <option key={type} value={type}>
                                        {getResponseTypeText(type)}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Expert Advice Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FiMessageSquare className="w-5 h-5 text-blue-600" />
                        Danh sách Tư vấn ({filteredAdvices.length})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {filteredAdvices.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <FiMessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                            <p>Không có tư vấn nào</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-200">
                                        <th className="text-left py-3 px-3 font-medium text-gray-700">Chuyên gia</th>
                                        <th className="text-left py-3 px-3 font-medium text-gray-700">Báo cáo</th>
                                        <th className="text-left py-3 px-3 font-medium text-gray-700">Loại tư vấn</th>
                                        <th className="text-left py-3 px-3 font-medium text-gray-700">Nguồn</th>
                                        <th className="text-left py-3 px-3 font-medium text-gray-700">Nông dân</th>
                                        <th className="text-left py-3 px-3 font-medium text-gray-700">Ngày tư vấn</th>
                                        <th className="text-left py-3 px-3 font-medium text-gray-700">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredAdvices.map((advice) => (
                                        <tr key={advice.adviceId} className="hover:bg-gradient-to-r hover:from-orange-50 hover:to-amber-50 transition-all duration-200">
                                            <td className="px-3 py-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                                                        <FiUser className="w-4 h-4 text-white" />
                                                    </div>
                                                    <div className="max-w-[150px]">
                                                        <div className="font-medium text-gray-900 text-sm truncate" title={advice.expertName}>
                                                            {advice.expertName}
                                                        </div>
                                                        <div className="text-xs text-gray-500 truncate" title={advice.expertEmail}>
                                                            {advice.expertEmail}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-3 py-3">
                                                <div className="max-w-[200px]">
                                                    <div className="font-medium text-gray-900 text-sm truncate" title={advice.reportTitle}>
                                                        {advice.reportTitle}
                                                    </div>
                                                    <div className="text-xs text-gray-500 font-mono truncate" title={advice.reportCode}>
                                                        {advice.reportCode}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-3 py-3">
                                                <Badge className={getResponseTypeColor(advice.responseType)}>
                                                    {getResponseTypeText(advice.responseType)}
                                                </Badge>
                                            </td>
                                            <td className="px-3 py-3">
                                                <div className="max-w-[150px]">
                                                    {advice.adviceSource ? (
                                                        <a
                                                            href={advice.adviceSource}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-blue-600 hover:text-blue-800 text-xs truncate block"
                                                            title={advice.adviceSource}
                                                        >
                                                            {advice.adviceSource.length > 30
                                                                ? advice.adviceSource.substring(0, 30) + '...'
                                                                : advice.adviceSource
                                                            }
                                                        </a>
                                                    ) : (
                                                        <span className="text-gray-400 text-xs">-</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-3 py-3">
                                                <div className="max-w-[150px]">
                                                    <div className="font-medium text-gray-900 text-sm truncate" title={advice.reportedByName}>
                                                        {advice.reportedByName}
                                                    </div>
                                                    <div className="text-xs text-gray-500 truncate" title={advice.reportedByEmail}>
                                                        {advice.reportedByEmail}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-3 py-3 text-gray-600 text-sm">
                                                {formatDate(advice.createdAt)}
                                            </td>
                                            <td className="px-3 py-3">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="flex items-center gap-1 text-xs"
                                                    onClick={() => {
                                                        router.push(`/dashboard/manager/expert-advice/${advice.adviceId}`);
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

