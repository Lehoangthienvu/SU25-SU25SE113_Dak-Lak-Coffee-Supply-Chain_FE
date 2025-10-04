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
import { useTranslation } from "react-i18next";

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

// Default data for when no progress exists - will be updated with translations
const getDefaultProgressData = (t: (key: string) => string): DoughnutData => ({
    labels: [t("farmerDashboard.defaultProgress.completed"), t("farmerDashboard.defaultProgress.remaining")],
    datasets: [
        {
            data: [0, 100],
            backgroundColor: ["#16a34a", "#f3f4f6"],
            borderWidth: 1,
        },
    ],
});

// Tối ưu: Tách biệt loading states để UX tốt hơn
interface LoadingStates {
    stats: boolean;
    chart: boolean;
    progress: boolean;
}

export default function FarmerDashboard() {
    useAuthGuard(["farmer"]);
    const { t } = useTranslation();

    const [stats, setStats] = useState<{
        activeSeasons: number;
        upcomingHarvests: number;
        pendingWarehouseRequests: number;
        unreadAdvice: number;
    } | null>(null);

    const [allCropSeasons, setAllCropSeasons] = useState<any[]>([]);

    // Bỏ alerts state vì không còn sử dụng
    const [chartData, setChartData] = useState<ChartData | null>(null);
    const [overallProgressData, setOverallProgressData] = useState<DoughnutData>(getDefaultProgressData(t));

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

            // Lấy tất cả mùa vụ của farmer để tính toán chính xác
            const cropSeasonsData = await getCropSeasonsForCurrentUser({
                page: 1,
                pageSize: 100, // Lấy nhiều hơn để có dữ liệu đầy đủ
            });

            // Lưu vào state để sử dụng ở các phần khác
            setAllCropSeasons(cropSeasonsData);

            // Tính toán stats thực tế
            const activeSeasons = cropSeasonsData.filter(season => season.status === "Active").length;
            const completedSeasons = cropSeasonsData.filter(season => season.status === "Completed").length;
            
            // Tính upcoming harvests dựa trên mùa vụ sắp kết thúc
            const now = new Date();
            const upcomingHarvests = cropSeasonsData.filter(season => {
                const endDate = new Date(season.endDate);
                const daysUntilEnd = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                return daysUntilEnd > 0 && daysUntilEnd <= 30; // Trong vòng 30 ngày tới
            }).length;

            // TODO: Thêm API call để lấy warehouse requests thực tế
            // const warehouseRequests = await getWarehouseRequestsForCurrentUser();
            // const pendingWarehouseRequests = warehouseRequests.filter(req => req.status === "PENDING").length;

            setStats({
                activeSeasons,
                upcomingHarvests,
                pendingWarehouseRequests: 2, // Tạm thời dùng số cố định, sẽ thay bằng API thực tế
                unreadAdvice: 1, // Tạm thời dùng số cố định, sẽ thay bằng API thực tế
            });

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

            // Lấy dữ liệu mùa vụ để tạo chart thực tế
            const cropSeasons = await getCropSeasonsForCurrentUser({
                page: 1,
                pageSize: 50,
            });

            // Tạo chart data dựa trên dữ liệu thực tế
            if (cropSeasons.length > 0) {
                // Nhóm theo tháng để tạo chart
                const monthlyData = new Map<string, { actual: number; planned: number }>();
                
                cropSeasons.forEach(season => {
                    const startDate = new Date(season.startDate);
                    const monthKey = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}`;
                    
                    if (!monthlyData.has(monthKey)) {
                        monthlyData.set(monthKey, { actual: 0, planned: 0 });
                    }
                    
                    const data = monthlyData.get(monthKey)!;
                    // Ước tính yield dựa trên diện tích (giả sử 1 ha = 2 tấn)
                    const estimatedYield = (season.area || 1) * 2;
                    data.actual += estimatedYield;
                    data.planned += estimatedYield * 1.2; // Planned thường cao hơn actual
                });

                // Sắp xếp theo tháng và lấy 5 tháng gần nhất
                const sortedMonths = Array.from(monthlyData.keys()).sort().slice(-5);
                const labels = sortedMonths.map(month => {
                    const [year, monthNum] = month.split('-');
                    return `T${parseInt(monthNum)}/${year.slice(-2)}`;
                });

                setChartData({
                    labels,
                    datasets: [
                        {
                            label: t("farmerDashboard.charts.monthlyYield.actual"),
                            data: sortedMonths.map(month => monthlyData.get(month)!.actual),
                            borderColor: "#FD7622",
                            backgroundColor: "rgba(253, 118, 34, 0.2)",
                            tension: 0.3,
                            fill: false,
                        },
                        {
                            label: t("farmerDashboard.charts.monthlyYield.planned"),
                            data: sortedMonths.map(month => monthlyData.get(month)!.planned),
                            borderColor: "#8884d8",
                            borderDash: [5, 5],
                            backgroundColor: "rgba(136, 132, 216, 0.2)",
                            tension: 0.3,
                            fill: false,
                        },
                    ],
                });
            } else {
                // Nếu không có dữ liệu, hiển thị chart mẫu
                setChartData({
                    labels: ["T1", "T2", "T3", "T4", "T5"],
                    datasets: [
                        {
                            label: t("farmerDashboard.charts.monthlyYield.actual"),
                            data: [0, 0, 0, 0, 0],
                            borderColor: "#FD7622",
                            backgroundColor: "rgba(253, 118, 34, 0.2)",
                            tension: 0.3,
                            fill: false,
                        },
                        {
                            label: t("farmerDashboard.charts.monthlyYield.planned"),
                            data: [0, 0, 0, 0, 0],
                            borderColor: "#8884d8",
                            borderDash: [5, 5],
                            backgroundColor: "rgba(136, 132, 216, 0.2)",
                            tension: 0.3,
                            fill: false,
                        },
                    ],
                });
            }
        } catch (error) {
            console.error("Lỗi lấy chart data:", error);
            // Fallback chart data
            setChartData({
                labels: ["T1", "T2", "T3", "T4", "T5"],
                datasets: [
                    {
                        label: t("farmerDashboard.charts.monthlyYield.actual"),
                        data: [400, 450, 380, 520, 610],
                        borderColor: "#FD7622",
                        backgroundColor: "rgba(253, 118, 34, 0.2)",
                        tension: 0.3,
                        fill: false,
                    },
                    {
                        label: t("farmerDashboard.charts.monthlyYield.planned"),
                        data: [500, 500, 500, 500, 500],
                        borderColor: "#8884d8",
                        borderDash: [5, 5],
                        backgroundColor: "rgba(136, 132, 216, 0.2)",
                        tension: 0.3,
                        fill: false,
                    },
                ],
            });
        } finally {
            setLoadingStates(prev => ({ ...prev, chart: false }));
        }
    }, [t]);

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
                labels: [t("farmerDashboard.defaultProgress.completed"), t("farmerDashboard.defaultProgress.remaining")],
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
            setOverallProgressData(getDefaultProgressData(t));
        } finally {
            setLoadingStates(prev => ({ ...prev, progress: false }));
        }
    }, [t]);

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
                    <p className="text-gray-600 font-medium text-sm">{t("farmerDashboard.loading.data")}</p>
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
                                {t("farmerDashboard.title")}
                            </h1>
                            <p className="text-gray-600 text-sm">
                                {t("farmerDashboard.welcomeMessage")}
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
                                label={t("farmerDashboard.stats.activeSeasons")}
                                value={stats.activeSeasons}
                                color="orange"
                                loading={loadingStates.stats}
                            />
                            <StatCard
                                icon={<FiBookOpen className="w-5 h-5" />}
                                label={t("farmerDashboard.stats.upcomingHarvests")}
                                value={stats.upcomingHarvests}
                                color="green"
                                loading={loadingStates.stats}
                            />
                            <StatCard
                                icon={<FiPackage className="w-5 h-5" />}
                                label={t("farmerDashboard.stats.pendingWarehouseRequests")}
                                value={stats.pendingWarehouseRequests}
                                color="blue"
                                loading={loadingStates.stats}
                            />
                            <StatCard
                                icon={<FiFeather className="w-5 h-5" />}
                                label={t("farmerDashboard.stats.unreadAdvice")}
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
                            <DashboardSectionTitle title={t("farmerDashboard.charts.monthlyYield.title")} />
                            {chartData && !loadingStates.chart ? (
                                <div className="h-[250px]">
                                    <Line data={chartData} options={chartOptions} />
                                </div>
                            ) : (
                                <div className="h-[250px] flex items-center justify-center text-gray-500">
                                    <div className="text-center">
                                        <FiTrendingUp className="w-10 h-10 text-orange-300 mx-auto mb-2" />
                                        <p className="text-sm">
                                            {loadingStates.chart ? t("farmerDashboard.loading.chart") : t("farmerDashboard.charts.monthlyYield.noData")}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="bg-white rounded-lg shadow-sm border border-orange-100 p-4">
                            <DashboardSectionTitle title={t("farmerDashboard.charts.overallProgress.title")} />
                            <div className="flex items-center justify-center">
                                {!loadingStates.progress ? (
                                    <div className="relative h-[200px] w-[200px]">
                                        <Doughnut data={overallProgressData} />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="text-center">
                                                <span className="text-2xl font-bold text-green-700">
                                                    {overallProgressData.datasets[0].data[0]}%
                                                </span>
                                                <p className="text-xs text-gray-500">{t("farmerDashboard.defaultProgress.completed")}</p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-[200px] w-[200px] flex items-center justify-center">
                                        <div className="text-center">
                                            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
                                                <FiCoffee className="w-4 h-4 text-orange-600 animate-pulse" />
                                            </div>
                                            <p className="text-sm text-gray-500">{t("farmerDashboard.loading.progress")}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Thống kê chi tiết */}
                <section>
                    <DashboardSectionTitle title="Thống kê chi tiết" />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white rounded-lg shadow-sm border border-orange-100 p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center text-white">
                                    <FiBookOpen className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-xl font-bold text-gray-800">
                                        {stats ? allCropSeasons.filter(s => s.status === "Completed").length : 0}
                                    </p>
                                    <p className="text-gray-600 text-xs">Mùa vụ hoàn thành</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow-sm border border-orange-100 p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center text-white">
                                    <FiPackage className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-xl font-bold text-gray-800">
                                        {stats ? Math.round(allCropSeasons.reduce((total, season) => total + (season.area || 0), 0) * 100) / 100 : 0}
                                    </p>
                                    <p className="text-gray-600 text-xs">Tổng diện tích (ha)</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow-sm border border-orange-100 p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center text-white">
                                    <FiTrendingUp className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-xl font-bold text-gray-800">
                                        {stats ? Math.round(allCropSeasons.reduce((total, season) => total + (season.area || 0), 0) * 2) : 0}
                                    </p>
                                    <p className="text-gray-600 text-xs">Ước tính sản lượng (tấn)</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow-sm border border-orange-100 p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg flex items-center justify-center text-white">
                                    <FiCoffee className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-xl font-bold text-gray-800">
                                        {stats ? allCropSeasons.length : 0}
                                    </p>
                                    <p className="text-gray-600 text-xs">Tổng mùa vụ</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Mùa vụ gần đây */}
                <section>
                    <DashboardSectionTitle title="Mùa vụ gần đây" />
                    <div className="bg-white rounded-lg shadow-sm border border-orange-100 p-4">
                        {allCropSeasons.length > 0 ? (
                            <div className="space-y-3">
                                {allCropSeasons.slice(0, 5).map((season, index) => (
                                    <div key={season.id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-3 h-3 rounded-full ${
                                                season.status === "Active" ? "bg-green-500" :
                                                season.status === "Completed" ? "bg-blue-500" :
                                                season.status === "Paused" ? "bg-yellow-500" : "bg-gray-500"
                                            }`}></div>
                                            <div>
                                                <p className="font-medium text-gray-800">{season.seasonName}</p>
                                                <p className="text-sm text-gray-600">
                                                    {season.area ? `${season.area} ha` : "Chưa có diện tích"} • 
                                                    {new Date(season.startDate).toLocaleDateString('vi-VN')} - {new Date(season.endDate).toLocaleDateString('vi-VN')}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                season.status === "Active" ? "bg-green-100 text-green-800" :
                                                season.status === "Completed" ? "bg-blue-100 text-blue-800" :
                                                season.status === "Paused" ? "bg-yellow-100 text-yellow-800" : "bg-gray-100 text-gray-800"
                                            }`}>
                                                {season.status === "Active" ? "Đang hoạt động" :
                                                 season.status === "Completed" ? "Hoàn thành" :
                                                 season.status === "Paused" ? "Tạm dừng" : season.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                                {allCropSeasons.length > 5 && (
                                    <div className="text-center pt-2">
                                        <Link 
                                            href="/dashboard/farmer/crop-seasons"
                                            className="text-orange-600 hover:text-orange-700 text-sm font-medium"
                                        >
                                            Xem tất cả mùa vụ ({allCropSeasons.length})
                                        </Link>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <FiCoffee className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-500 mb-2">Chưa có mùa vụ nào</p>
                                <Link 
                                    href="/dashboard/farmer/crop-seasons"
                                    className="text-orange-600 hover:text-orange-700 text-sm font-medium"
                                >
                                    Tạo mùa vụ đầu tiên
                                </Link>
                            </div>
                        )}
                    </div>
                </section>

                <section>
                    <DashboardSectionTitle title={t("farmerDashboard.quickActions.title")} />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <ActionCard
                            icon={<FiClipboard className="w-5 h-5" />}
                            title={t("farmerDashboard.quickActions.cropSeasons.title")}
                            description={t("farmerDashboard.quickActions.cropSeasons.description")}
                            href="/dashboard/farmer/crop-seasons"
                            color="orange"
                        />
                        <ActionCard
                            icon={<FiPackage className="w-5 h-5" />}
                            title={t("farmerDashboard.quickActions.warehouseRequest.title")}
                            description={t("farmerDashboard.quickActions.warehouseRequest.description")}
                            href="/dashboard/farmer/warehouse-request"
                            color="blue"
                        />
                        <ActionCard
                            icon={<FiFeather className="w-5 h-5" />}
                            title={t("farmerDashboard.quickActions.technicalFeedback.title")}
                            description={t("farmerDashboard.quickActions.technicalFeedback.description")}
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
