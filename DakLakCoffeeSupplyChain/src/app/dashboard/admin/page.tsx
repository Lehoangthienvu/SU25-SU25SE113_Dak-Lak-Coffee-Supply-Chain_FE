"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, Line } from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    Title,
    Tooltip,
    Legend,
} from "chart.js";

import {
    FiTrendingUp,
    FiFileText,
    FiUsers,
    FiBarChart2,
    FiBox,
    FiPieChart,
    FiCreditCard,
    FiDollarSign,
} from "react-icons/fi";
import { useAuthGuard } from "@/lib/auth/useAuthGuard";
import Link from "next/link";

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    Title,
    Tooltip,
    Legend
);

export default function ManagerDashboard() {
    useAuthGuard(["admin"]);
    return (
        <div className="w-full bg-orange-50 min-h-screen">
            <div className="p-6">

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-6">
                    <Card>
                        <CardContent className="p-5 flex items-center gap-4">
                            <div className="text-orange-500 text-2xl">
                                <FiTrendingUp />
                            </div>
                            <div>
                                <div className="text-sm text-gray-500">Sản lượng</div>
                                <div className="text-xl font-semibold">865kg</div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-5 flex items-center gap-4">
                            <div className="text-orange-500 text-2xl">
                                <FiFileText />
                            </div>
                            <div>
                                <div className="text-sm text-gray-500">Hợp đồng</div>
                                <div className="text-xl font-semibold">12</div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-5 flex items-center gap-4">
                            <div className="text-orange-500 text-2xl">
                                <FiUsers />
                            </div>
                            <div>
                                <div className="text-sm text-gray-500">Nông dân</div>
                                <div className="text-xl font-semibold">48 hộ</div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-5 flex items-center gap-4">
                            <div className="text-orange-500 text-2xl">
                                <FiDollarSign />
                            </div>
                            <div>
                                <div className="text-sm text-gray-500">Giao dịch ví</div>
                                <div className="text-xl font-semibold">156</div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Biểu đồ sản lượng (Line)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Line
                                data={{
                                    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
                                    datasets: [
                                        {
                                            label: "Sản lượng (kg)",
                                            data: [100, 200, 180, 220, 300, 280],
                                            borderColor: "#F97316",
                                            backgroundColor: "rgba(249, 115, 22, 0.2)",
                                            tension: 0.4,
                                        },
                                    ],
                                }}
                                options={{
                                    responsive: true,
                                    plugins: {
                                        legend: { position: "top" },
                                        title: { display: false },
                                    },
                                }}
                            />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Chi phí & thu nhập (Bar)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Bar
                                data={{
                                    labels: ["Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4"],
                                    datasets: [
                                        {
                                            label: "Chi phí",
                                            data: [500, 400, 300, 450],
                                            backgroundColor: "#f87171",
                                        },
                                        {
                                            label: "Thu nhập",
                                            data: [600, 550, 500, 600],
                                            backgroundColor: "#34d399",
                                        },
                                    ],
                                }}
                                options={{
                                    responsive: true,
                                    plugins: {
                                        legend: { position: "bottom" },
                                    },
                                }}
                            />
                        </CardContent>
                    </Card>
                </div>

                {/* Feature Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                    <Card className="hover:shadow-lg transition">
                        <CardHeader className="flex items-center gap-2">
                            <FiFileText className="text-orange-500 text-xl" />
                            <CardTitle className="text-lg">Quản lý hợp đồng</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-gray-500 text-sm">
                                Kiểm tra, ký và theo dõi trạng thái hợp đồng.
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="hover:shadow-lg transition">
                        <CardHeader className="flex items-center gap-2">
                            <FiBox className="text-orange-500 text-xl" />
                            <CardTitle className="text-lg">Tồn kho</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-gray-500 text-sm">
                                Theo dõi hàng hóa tồn kho và xuất nhập.
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="hover:shadow-lg transition">
                        <CardHeader className="flex items-center gap-2">
                            <FiBarChart2 className="text-orange-500 text-xl" />
                            <CardTitle className="text-lg">Báo cáo & phân tích</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-gray-500 text-sm">
                                Phân tích dữ liệu mùa vụ, chi phí, doanh thu.
                            </p>
                        </CardContent>
                    </Card>

                    <Link href="/dashboard/admin/wallet-transactions">
                        <Card className="hover:shadow-lg transition cursor-pointer">
                            <CardHeader className="flex items-center gap-2">
                                <FiCreditCard className="text-orange-500 text-xl" />
                                <CardTitle className="text-lg">Giao dịch ví</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-gray-500 text-sm">
                                    Quản lý và theo dõi tất cả giao dịch ví trong hệ thống.
                                </p>
                            </CardContent>
                        </Card>
                    </Link>
                </div>
            </div>
        </div>
    );
}
