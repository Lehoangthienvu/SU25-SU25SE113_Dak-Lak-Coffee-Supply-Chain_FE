"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Search,
    Filter,
    Calendar,
    MapPin,
    Users,
    TrendingUp,
    Eye,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthGuard } from '@/lib/auth/useAuthGuard';
import { getAllCropSeasons } from '@/lib/api/cropSeasons';
import { CropSeasonListItem } from '@/lib/api/cropSeasons';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { toast } from 'sonner';
import { CropSeasonStatusMap, CropSeasonStatusValue } from '@/lib/constants/cropSeasonStatus';

export default function ManagerCropSeasonsPage() {
    useAuthGuard(['manager']);
    const router = useRouter();

    const [cropSeasons, setCropSeasons] = useState<CropSeasonListItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [search, setSearch] = useState("");
    const [selectedStatus, setSelectedStatus] = useState<CropSeasonStatusValue | null>(null);
    const [selectedFarmer] = useState<string | null>(null);
    const pageSize = 10;

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const data = await getAllCropSeasons();
                setCropSeasons(data);
            } catch (err) {
                console.error("Lỗi khi tải danh sách mùa vụ:", err);
                toast.error("Không thể tải danh sách mùa vụ");
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    useEffect(() => {
        setCurrentPage(1);
    }, [search, selectedStatus, selectedFarmer]);

    // Filter logic
    const filteredSeasons = cropSeasons.filter((season) => {
        const matchesSearch = !search ||
            season.seasonName.toLowerCase().includes(search.toLowerCase()) ||
            (season.farmerName && season.farmerName.toLowerCase().includes(search.toLowerCase()));

        const matchesStatus = !selectedStatus || season.status === selectedStatus;

        const matchesFarmer = !selectedFarmer || season.farmerId === selectedFarmer;

        return matchesSearch && matchesStatus && matchesFarmer;
    });

    // Get unique farmers for filter
    const uniqueFarmers = Array.from(
        new Set(cropSeasons.map(s => s.farmerId))
    ).map(farmerId => {
        const season = cropSeasons.find(s => s.farmerId === farmerId);
        return {
            farmerId,
            farmerName: season?.farmerName || "Unknown"
        };
    });

    // Status counts
    const statusCounts = cropSeasons.reduce<Record<string, number>>((acc, season) => {
        acc[season.status] = (acc[season.status] || 0) + 1;
        return acc;
    }, {});

    // Statistics
    const totalSeasons = cropSeasons.length;
    const activeSeasons = cropSeasons.filter(s => s.status === 'Active').length;
    const totalArea = cropSeasons.reduce((sum, s) => sum + (s.area || 0), 0);
    const uniqueFarmersCount = uniqueFarmers.length;

    // Pagination
    const totalPages = Math.ceil(filteredSeasons.length / pageSize);
    const pagedSeasons = filteredSeasons.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    const getStatusColor = (status: CropSeasonStatusValue) => {
        const statusInfo = CropSeasonStatusMap[status];
        if (!statusInfo) return "bg-gray-100 text-gray-800";

        switch (statusInfo.color) {
            case 'green': return 'bg-green-100 text-green-800';
            case 'yellow': return 'bg-yellow-100 text-yellow-800';
            case 'blue': return 'bg-blue-100 text-blue-800';
            case 'red': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const handleSeasonClick = (seasonId: string) => {
        router.push(`/dashboard/manager/crop-seasons/${seasonId}`);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-orange-50 flex items-center justify-center">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-orange-50 p-4">
            <div className="max-w-7xl mx-auto space-y-4">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-sm p-4 border border-orange-100">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800 mb-1">
                                Quản lý mùa vụ
                            </h1>
                            <p className="text-gray-600 text-sm">
                                Theo dõi và quản lý các mùa vụ cà phê của nông dân
                            </p>
                        </div>

                    </div>

                    {/* Statistics Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg p-3 text-white">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-orange-100 text-xs">Tổng mùa vụ</p>
                                    <p className="text-xl font-bold">{totalSeasons}</p>
                                </div>
                                <Calendar className="w-6 h-6 text-orange-200" />
                            </div>
                        </div>
                        <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg p-3 text-white">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-green-100 text-xs">Đang hoạt động</p>
                                    <p className="text-xl font-bold">{activeSeasons}</p>
                                </div>
                                <TrendingUp className="w-6 h-6 text-green-200" />
                            </div>
                        </div>
                        <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg p-3 text-white">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-blue-100 text-xs">Tổng diện tích</p>
                                    <p className="text-xl font-bold">{totalArea.toFixed(1)} ha</p>
                                </div>
                                <MapPin className="w-6 h-6 text-blue-200" />
                            </div>
                        </div>
                        <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg p-3 text-white">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-purple-100 text-xs">Nông dân tham gia</p>
                                    <p className="text-xl font-bold">{uniqueFarmersCount}</p>
                                </div>
                                <Users className="w-6 h-6 text-purple-200" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex gap-4">
                    {/* Sidebar */}
                    <aside className="w-64 space-y-4">
                        {/* Search Card */}
                        <div className="bg-white rounded-lg shadow-sm p-4 border border-orange-100">
                            <h2 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                <Search className="w-4 h-4 text-orange-600" />
                                Tìm kiếm mùa vụ
                            </h2>
                            <div className="relative">
                                <Input
                                    placeholder="Tên mùa vụ hoặc nông dân..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pr-8 border-orange-200 focus:border-orange-500 focus:ring-orange-500"
                                />
                                <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-orange-400" />
                            </div>
                        </div>

                        {/* Filter Panel */}
                        <div className="bg-white rounded-lg shadow-sm border border-orange-100">
                            <div className="p-4 border-b border-orange-100">
                                <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                                    <Filter className="w-4 h-4 text-orange-600" />
                                    Lọc theo trạng thái
                                </h2>
                            </div>
                            <div className="p-4 space-y-2">
                                <button
                                    onClick={() => setSelectedStatus(null)}
                                    className={cn(
                                        "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                                        !selectedStatus
                                            ? "bg-orange-100 text-orange-700"
                                            : "text-gray-600 hover:bg-orange-50"
                                    )}
                                >
                                    Tất cả ({totalSeasons})
                                </button>
                                {Object.entries(statusCounts).map(([status, count]) => (
                                    <button
                                        key={status}
                                        onClick={() => setSelectedStatus(status as CropSeasonStatusValue)}
                                        className={cn(
                                            "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                                            selectedStatus === status
                                                ? "bg-orange-100 text-orange-700"
                                                : "text-gray-600 hover:bg-orange-50"
                                        )}
                                    >
                                        {CropSeasonStatusMap[status as CropSeasonStatusValue]?.label || status} ({count})
                                    </button>
                                ))}
                            </div>
                        </div>
                    </aside>

                    {/* Main Content */}
                    <main className="flex-1">
                        <div className="bg-white rounded-lg shadow-sm border border-orange-100 overflow-hidden">
                            {/* Table Header */}
                            <div className="px-6 py-4 border-b border-orange-100">
                                <h3 className="text-lg font-semibold text-gray-800">
                                    Danh sách mùa vụ ({filteredSeasons.length})
                                </h3>
                            </div>

                            {/* Table */}
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-orange-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-orange-600 uppercase tracking-wider">
                                                Mùa vụ
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-orange-600 uppercase tracking-wider">
                                                Nông dân
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-orange-600 uppercase tracking-wider">
                                                Diện tích
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-orange-600 uppercase tracking-wider">
                                                Trạng thái
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-orange-600 uppercase tracking-wider">
                                                Hành động
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-orange-100">
                                        {pagedSeasons.map((season) => (
                                            <tr
                                                key={season.cropSeasonId}
                                                className="hover:bg-orange-50 transition-colors cursor-pointer"
                                                onClick={() => handleSeasonClick(season.cropSeasonId)}
                                            >
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {season.seasonName}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            {season.startDate && new Date(season.startDate).toLocaleDateString('vi-VN')}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">
                                                        {season.farmerName || "Chưa xác định"}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">
                                                        {season.area?.toFixed(1) || 0} ha
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={cn(
                                                        "inline-flex px-2 py-1 text-xs font-semibold rounded-full",
                                                        getStatusColor(season.status as CropSeasonStatusValue)
                                                    )}>
                                                        {CropSeasonStatusMap[season.status as CropSeasonStatusValue]?.label || season.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleSeasonClick(season.cropSeasonId);
                                                        }}
                                                    >
                                                        <Eye className="w-4 h-4 mr-2" />
                                                        Xem chi tiết
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="px-6 py-4 border-t border-orange-100 flex items-center justify-between">
                                    <div className="text-sm text-gray-700">
                                        Hiển thị {((currentPage - 1) * pageSize) + 1} đến {Math.min(currentPage * pageSize, filteredSeasons.length)} trong tổng số {filteredSeasons.length} mùa vụ
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                            disabled={currentPage === 1}
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                        </Button>
                                        <span className="text-sm text-gray-700">
                                            Trang {currentPage} / {totalPages}
                                        </span>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                            disabled={currentPage === totalPages}
                                        >
                                            <ChevronRight className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
}
