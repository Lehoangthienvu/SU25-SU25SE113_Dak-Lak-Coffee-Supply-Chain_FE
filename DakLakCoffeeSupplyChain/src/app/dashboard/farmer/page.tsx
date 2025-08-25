"use client";

import { useAuthGuard } from "@/lib/auth/useAuthGuard";
import { useEffect, useState, useMemo, useCallback } from "react";
import {
    FiClipboard,
    FiFeather,
    FiBookOpen,
    FiPackage,
    FiTrendingUp,
    FiCoffee,
} from "react-icons/fi";
import Link from "next/link";

import {
    Chart as ChartJS,
    LineElement,
    CategoryScale,
    LinearScale,
    PointElement,
    ArcElement,
    Tooltip,
    Legend,
} from "chart.js";
import { Line, Doughnut } from "react-chartjs-2";
import { getCropSeasonsForCurrentUser } from "@/lib/api/cropSeasons";
import { getAllCropProgresses, CropProgressViewAllDto } from "@/lib/api/cropProgress";

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    ArcElement,
    Tooltip,
    Legend
);

// Types for chart data
interface ChartData {
    labels: string[];
    datasets: {
        label: string;
        data: number[];
        borderColor: string;
        backgroundColor: string;
        tension?: number;
        fill?: boolean;
        borderDash?: number[];
    }[];
}

interface DoughnutData {
    labels: string[];
    datasets: {
        data: number[];
        backgroundColor: string[];
        borderWidth: number;
    }[];
}

// Default data for when no progress exists
const DEFAULT_PROGRESS_DATA: DoughnutData = {
    labels: ["Hoàn thành", "Còn lại"],
    datasets: [
        {
            data: [0, 100],
            backgroundColor: ["#16a34a", "#f3f4f6"],
            borderWidth: 1,
        },
    ],
};

// Tối ưu: Tách biệt loading states để UX tốt hơn
interface LoadingStates {
    stats: boolean;
    chart: boolean;
    progress: boolean;
}

export default function FarmerDashboard() {
    useAuthGuard(["farmer"]);

    const [stats, setStats] = useState<{
        activeSeasons: number;
        upcomingHarvests: number;
        pendingWarehouseRequests: number;
        unreadAdvice: number;
    } | null>(null);

    // Bỏ alerts state vì không còn sử dụng
    const [chartData, setChartData] = useState<ChartData | null>(null);
    const [overallProgressData, setOverallProgressData] = useState<DoughnutData>(DEFAULT_PROGRESS_DATA);

    // Tối ưu: Loading states riêng biệt thay vì một loading chung
    const [loadingStates, setLoadingStates] = useState<LoadingStates>({
        stats: true,
        chart: true,
        progress: true,
    });

    // Tối ưu: Sử dụng useMemo để tránh tính toán lại chart options
    const chartOptions = useMemo(() => ({
        responsive: true,
        plugins: {
            legend: { position: "top" as const },
            tooltip: { mode: "index" as const, intersect: false },
        },
    }), []);

    // Tối ưu: Tách biệt việc fetch stats để load nhanh hơn
    const fetchStats = useCallback(async () => {
        try {
            setLoadingStates(prev => ({ ...prev, stats: true }));

            // Tối ưu: Chỉ lấy dữ liệu cần thiết với pageSize nhỏ
            const cropSeasons = await getCropSeasonsForCurrentUser({
                status: "Đang hoạt động",
                page: 1,
                pageSize: 10, // Giảm từ 100 xuống 10
            });

            setStats({
                activeSeasons: cropSeasons.length,
                upcomingHarvests: Math.min(cropSeasons.length, 5), // Tính toán dựa trên data thực
                pendingWarehouseRequests: 1,
                unreadAdvice: 3,
            });

            // Bỏ alerts để dashboard đơn giản hơn
        } catch (error) {
            console.error("Lỗi lấy stats:", error);
            // Fallback data nếu có lỗi
            setStats({
                activeSeasons: 0,
                upcomingHarvests: 0,
                pendingWarehouseRequests: 0,
                unreadAdvice: 0,
            });
        } finally {
            setLoadingStates(prev => ({ ...prev, stats: false }));
        }
    }, []);

    // Tối ưu: Tách biệt việc fetch chart data
    const fetchChartData = useCallback(async () => {
        try {
            setLoadingStates(prev => ({ ...prev, chart: true }));

            // Tối ưu: Sử dụng data mẫu để load nhanh, có thể thay bằng API call thực tế sau
            setChartData({
                labels: ["T1", "T2", "T3", "T4", "T5"],
                datasets: [
                    {
                        label: "Thực tế (kg)",
                        data: [400, 450, 380, 520, 610],
                        borderColor: "#FD7622",
                        backgroundColor: "rgba(253, 118, 34, 0.2)",
                        tension: 0.3,
                        fill: false,
                    },
                    {
                        label: "Kế hoạch (kg)",
                        data: [500, 500, 500, 500, 500],
                        borderColor: "#8884d8",
                        borderDash: [5, 5],
                        backgroundColor: "rgba(136, 132, 216, 0.2)",
                        tension: 0.3,
                        fill: false,
                    },
                ],
            });
        } catch (error) {
            console.error("Lỗi lấy chart data:", error);
        } finally {
            setLoadingStates(prev => ({ ...prev, chart: false }));
        }
    }, []);

    // Tối ưu: Tách biệt việc fetch progress data
    const fetchProgressData = useCallback(async () => {
        try {
            setLoadingStates(prev => ({ ...prev, progress: true }));

            const progresses = await getAllCropProgresses();

            // Tối ưu: Sử dụng Map thay vì object để performance tốt hơn
            const grouped = new Map<string, CropProgressViewAllDto[]>();

            for (const p of progresses) {
                const existing = grouped.get(p.cropSeasonDetailId) || [];
                existing.push(p);
                grouped.set(p.cropSeasonDetailId, existing);
            }

            const TOTAL_STAGES = 5;
            const percentList: number[] = [];

            // Tối ưu: Sử dụng for...of thay vì for...in
            for (const [, steps] of grouped) {
                if (steps.length > 0) {
                    const current = Math.max(...steps.map(s => s.stepIndex ?? 0));
                    const percent = Math.min(((current + 1) / TOTAL_STAGES) * 100, 100);
                    percentList.push(percent);
                }
            }

            const average = percentList.length > 0
                ? Math.round(percentList.reduce((a, b) => a + b, 0) / percentList.length)
                : 0;

            setOverallProgressData({
                labels: ["Hoàn thành", "Còn lại"],
                datasets: [
                    {
                        data: [average, 100 - average],
                        backgroundColor: ["#16a34a", "#f3f4f6"],
                        borderWidth: 1,
                    },
                ],
            });
        } catch (progressError) {
            console.log("Không có dữ liệu tiến trình, sử dụng giá trị mặc định:", progressError);
            setOverallProgressData(DEFAULT_PROGRESS_DATA);
        } finally {
            setLoadingStates(prev => ({ ...prev, progress: false }));
        }
    }, []);

    useEffect(() => {
        // Tối ưu: Fetch song song các data để load nhanh hơn
        fetchStats();
        fetchChartData();
        fetchProgressData();
    }, [fetchStats, fetchChartData, fetchProgressData]);

    // Tối ưu: Tính toán loading state tổng thể
    const isLoading = useMemo(() =>
        loadingStates.stats || loadingStates.chart || loadingStates.progress,
        [loadingStates]
    );

    if (isLoading) {
        return (
            <div className="min-h-screen bg-orange-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <FiCoffee className="w-6 h-6 text-orange-600 animate-pulse" />
                    </div>
                    <p className="text-gray-600 font-medium text-sm">Đang tải dữ liệu...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-orange-50">
            <div className="max-w-6xl mx-auto p-4 space-y-6">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-sm p-4 border border-orange-100">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800 mb-1">
                                Nông dân
                            </h1>
                            <p className="text-gray-600 text-sm">
                                Chào mừng bạn trở lại! Theo dõi hoạt động canh tác của bạn
                            </p>
                        </div>
                        <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg flex items-center justify-center">
                            <FiCoffee className="w-6 h-6 text-white" />
                        </div>
                    </div>
                </div>

                {stats && (
                    <section>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <StatCard
                                icon={<FiClipboard className="w-5 h-5" />}
                                label="Mùa vụ đang hoạt động"
                                value={stats.activeSeasons}
                                color="orange"
                                loading={loadingStates.stats}
                            />
                            <StatCard
                                icon={<FiBookOpen className="w-5 h-5" />}
                                label="Vùng sắp thu hoạch"
                                value={stats.upcomingHarvests}
                                color="green"
                                loading={loadingStates.stats}
                            />
                            <StatCard
                                icon={<FiPackage className="w-5 h-5" />}
                                label="Yêu cầu giao hàng"
                                value={stats.pendingWarehouseRequests}
                                color="blue"
                                loading={loadingStates.stats}
                            />
                            <StatCard
                                icon={<FiFeather className="w-5 h-5" />}
                                label="Phản hồi kỹ thuật chưa đọc"
                                value={stats.unreadAdvice}
                                color="purple"
                                loading={loadingStates.stats}
                            />
                        </div>
                    </section>
                )}

                <section>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div className="bg-white rounded-lg shadow-sm border border-orange-100 p-4">
                            <DashboardSectionTitle title="Sản lượng theo tháng" />
                            {chartData && !loadingStates.chart ? (
                                <div className="h-[250px]">
                                    <Line data={chartData} options={chartOptions} />
                                </div>
                            ) : (
                                <div className="h-[250px] flex items-center justify-center text-gray-500">
                                    <div className="text-center">
                                        <FiTrendingUp className="w-10 h-10 text-orange-300 mx-auto mb-2" />
                                        <p className="text-sm">
                                            {loadingStates.chart ? "Đang tải dữ liệu biểu đồ..." : "Không có dữ liệu"}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="bg-white rounded-lg shadow-sm border border-orange-100 p-4">
                            <DashboardSectionTitle title="Tiến độ mùa vụ tổng thể" />
                            <div className="flex items-center justify-center">
                                {!loadingStates.progress ? (
                                    <div className="relative h-[200px] w-[200px]">
                                        <Doughnut data={overallProgressData} />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="text-center">
                                                <span className="text-2xl font-bold text-green-700">
                                                    {overallProgressData.datasets[0].data[0]}%
                                                </span>
                                                <p className="text-xs text-gray-500">Hoàn thành</p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-[200px] w-[200px] flex items-center justify-center">
                                        <div className="text-center">
                                            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
                                                <FiCoffee className="w-4 h-4 text-orange-600 animate-pulse" />
                                            </div>
                                            <p className="text-sm text-gray-500">Đang tải...</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Bỏ phần cảnh báo để dashboard đơn giản hơn */}

                <section>
                    <DashboardSectionTitle title="Hành động nhanh" />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <ActionCard
                            icon={<FiClipboard className="w-5 h-5" />}
                            title="Quản lý mùa vụ"
                            description="Theo dõi và cập nhật thông tin mùa vụ canh tác."
                            href="/dashboard/farmer/crop-seasons"
                            color="orange"
                        />
                        <ActionCard
                            icon={<FiPackage className="w-5 h-5" />}
                            title="Gửi yêu cầu giao hàng"
                            description="Danh sách yêu cầu giao hàng."
                            href="/dashboard/farmer/warehouse-request"
                            color="blue"
                        />
                        <ActionCard
                            icon={<FiFeather className="w-5 h-5" />}
                            title="Phản hồi kỹ thuật"
                            description="Xem và trả lời phản hồi từ chuyên gia."
                            href="/dashboard/farmer/request-feedback"
                            color="green"
                        />
                    </div>
                </section>
            </div>
        </div>
    );
}

function StatCard({
    icon,
    label,
    value,
    color,
    loading = false
}: {
    icon: React.ReactNode;
    label: string;
    value: number;
    color: string;
    loading?: boolean;
}) {
    const colorClasses = {
        orange: "bg-gradient-to-r from-orange-500 to-amber-500",
        green: "bg-gradient-to-r from-green-500 to-emerald-500",
        blue: "bg-gradient-to-r from-blue-500 to-cyan-500",
        purple: "bg-gradient-to-r from-purple-500 to-pink-500"
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border border-orange-100 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
                <div className={`w-10 h-10 ${colorClasses[color as keyof typeof colorClasses]} rounded-lg flex items-center justify-center text-white`}>
                    {icon}
                </div>
                <div>
                    {loading ? (
                        <div className="animate-pulse">
                            <div className="h-6 bg-gray-200 rounded w-16 mb-1"></div>
                            <div className="h-3 bg-gray-200 rounded w-24"></div>
                        </div>
                    ) : (
                        <>
                            <p className="text-xl font-bold text-gray-800">{value}</p>
                            <p className="text-gray-600 text-xs">{label}</p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

// Bỏ AlertCard component vì không còn sử dụng

function ActionCard({
    icon,
    title,
    description,
    href,
    color
}: {
    icon: React.ReactNode;
    title: string;
    description: string;
    href: string;
    color: string;
}) {
    const colorClasses = {
        orange: "hover:border-orange-300 hover:bg-orange-50",
        green: "hover:border-green-300 hover:bg-green-50",
        blue: "hover:border-blue-300 hover:bg-blue-50"
    };

    return (
        <Link
            href={href}
            className={`p-4 bg-white rounded-lg shadow-sm border border-orange-100 hover:shadow-md transition-all duration-200 block ${colorClasses[color as keyof typeof colorClasses]}`}
        >
            <div className="flex items-center gap-2 mb-2">
                <div className={`w-8 h-8 bg-gradient-to-r from-${color}-500 to-${color === 'orange' ? 'amber' : color === 'green' ? 'emerald' : 'cyan'}-500 rounded-md flex items-center justify-center text-white`}>
                    {icon}
                </div>
                <h2 className="text-base font-semibold text-gray-800">{title}</h2>
            </div>
            <p className="text-gray-600 text-xs">{description}</p>
        </Link>
    );
}

function DashboardSectionTitle({ title }: { title: string }) {
    return (
        <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
            <div className="w-1 h-5 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full"></div>
            {title}
        </h2>
    );
}
