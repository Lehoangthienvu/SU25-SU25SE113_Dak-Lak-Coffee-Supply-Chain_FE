"use client";

import {
  FiPackage,
  FiClipboard,
  FiTruck,
  FiLayers,
  FiHome,
  FiBarChart2,
} from "react-icons/fi";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";

import { getAllInboundRequests } from "@/lib/api/warehouseInboundRequest";
import { getAllOutboundRequests } from "@/lib/api/warehouseOutboundRequest";
import { getAllOutboundReceipts } from "@/lib/api/warehouseOutboundReceipt";
import { useTranslation } from "react-i18next";

// Đăng ký Line chart
ChartJS.register(
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
);

export default function StaffDashboard() {
  const [inboundWaiting, setInboundWaiting] = useState(0);
  const [outboundWaiting, setOutboundWaiting] = useState(0);
  const [inboundPerMonth, setInboundPerMonth] = useState<number[]>([]);
  const [outboundPerMonth, setOutboundPerMonth] = useState<number[]>([]);
  const { t } = useTranslation();

  useEffect(() => {
    async function fetchData() {
      try {
        console.log("🔍 DEBUG: Dashboard - Starting to fetch data...");
        
        // ✅ SỬA: Gọi từng API riêng biệt để tránh Promise.all fail
        let inboundRes = null;
        let outboundRes = null;
        let outboundReceipts = null;

        try {
          inboundRes = await getAllInboundRequests();
          console.log("🔍 DEBUG: Dashboard - Inbound response:", inboundRes);
        } catch (err) {
          console.error("❌ Lỗi khi tải inbound requests:", err);
        }

        try {
          outboundRes = await getAllOutboundRequests();
          console.log("🔍 DEBUG: Dashboard - Outbound response:", outboundRes);
        } catch (err) {
          console.error("❌ Lỗi khi tải outbound requests:", err);
        }

        try {
          outboundReceipts = await getAllOutboundReceipts();
          console.log("🔍 DEBUG: Dashboard - Outbound receipts response:", outboundReceipts);
        } catch (err) {
          console.error("❌ Lỗi khi tải outbound receipts:", err);
        }

        const inboundWaitingList = inboundRes?.data?.filter((r: any) =>
          ["Pending", "Processing"].includes(r.status)
        );
        const outboundWaitingList = outboundRes?.data?.filter((r: any) =>
          ["Pending", "Processing"].includes(r.status)
        );

        console.log("🔍 DEBUG: Dashboard - Inbound waiting list:", inboundWaitingList);
        console.log("🔍 DEBUG: Dashboard - Outbound waiting list:", outboundWaitingList);

        setInboundWaiting(inboundWaitingList?.length || 0);
        setOutboundWaiting(outboundWaitingList?.length || 0);

        const inboundByMonth = Array(12).fill(0);
        inboundRes?.data
          ?.filter((req: any) => req.status === "Completed")
          .forEach((req: any) => {
            const month = new Date(req.createdAt).getMonth();
            inboundByMonth[month]++;
          });

        const outboundByMonth = Array(12).fill(0);
        outboundReceipts?.forEach((receipt: any) => {
          const month = new Date(receipt.exportedAt).getMonth();
          outboundByMonth[month]++;
        });

        setInboundPerMonth(inboundByMonth);
        setOutboundPerMonth(outboundByMonth);
      } catch (err) {
        console.error("❌ Lỗi khi tải dữ liệu thống kê:", err);
        console.log("🔍 DEBUG: Dashboard - Error details:", err);
      }
    }

    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-10 px-4 md:px-10">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-blue-100 p-8 text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-3">
            🏢 {t('sidebar.staffDashboard.title')}
          </h1>
          <p className="text-gray-600 text-lg">
            {t('sidebar.staffDashboard.subtitle')}
          </p>
        </div>

        {/* Thống kê đang chờ xử lý */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link href="/dashboard/staff/inbounds?status=Pending">
            <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl p-6 text-white hover:shadow-lg transition-all duration-300 cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-100 text-lg font-medium">{t('sidebar.staffDashboard.waitingInbound')}</p>
                  <p className="text-4xl font-bold">{inboundWaiting}</p>
                </div>
                <FiPackage className="w-12 h-12 text-yellow-200" />
              </div>
            </div>
          </Link>

          <Link href="/dashboard/staff/outbounds?status=Pending">
            <div className="bg-gradient-to-r from-red-500 to-pink-500 rounded-xl p-6 text-white hover:shadow-lg transition-all duration-300 cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-lg font-medium">{t('sidebar.staffDashboard.waitingOutbound')}</p>
                  <p className="text-4xl font-bold">{outboundWaiting}</p>
                </div>
                <FiTruck className="w-12 h-12 text-red-200" />
              </div>
            </div>
          </Link>
        </div>

        {/* Truy cập nhanh và Biểu đồ thống kê */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Biểu đồ thống kê kết hợp - Bên trái */}
          <div className="bg-white rounded-xl shadow-sm border border-blue-100 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">📊 {t('sidebar.staffDashboard.monthlyStats')}</h3>
            <div className="h-80">
              <Line
                data={{
                  labels: t('sidebar.staffDashboard.months', { returnObjects: true }) as string[],
                  datasets: [
                    {
                      label: t('sidebar.staffDashboard.chartLabels.inbound'),
                      data: inboundPerMonth,
                      borderColor: "rgb(34, 197, 94)",
                      backgroundColor: "rgba(34, 197, 94, 0.1)",
                      tension: 0.4,
                      fill: true,
                      yAxisID: 'y',
                    },
                    {
                      label: t('sidebar.staffDashboard.chartLabels.outbound'),
                      data: outboundPerMonth,
                      borderColor: "rgb(239, 68, 68)",
                      backgroundColor: "rgba(239, 68, 68, 0.1)",
                      tension: 0.4,
                      fill: true,
                      yAxisID: 'y',
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: true,
                      position: 'top',
                      labels: {
                        usePointStyle: true,
                        padding: 20,
                        font: {
                          size: 12
                        }
                      }
                    },
                    tooltip: {
                      mode: 'index',
                      intersect: false,
                    }
                  },
                  scales: {
                    y: {
                      type: 'linear',
                      display: true,
                      position: 'left',
                      beginAtZero: true,
                      ticks: {
                        stepSize: 1,
                      },
                      grid: {
                        color: 'rgba(0, 0, 0, 0.1)',
                      }
                    },
                  },
                  interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                  },
                }}
              />
            </div>
          </div>

          {/* Truy cập nhanh - Bên phải */}
          <div className="bg-white rounded-xl shadow-sm border border-blue-100 p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">
              🚀 {t('sidebar.staffDashboard.quickAccess')}
            </h2>
            <div className="grid grid-cols-3 gap-3">
              <Link href="/dashboard/staff/inventories">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white text-center hover:shadow-lg transition-all duration-300 cursor-pointer transform hover:scale-105">
                  <FiLayers className="w-8 h-8 mx-auto mb-2" />
                  <p className="font-semibold text-sm">{t('sidebar.staffDashboard.inventory')}</p>
                  <p className="text-blue-100 text-xs">{t('sidebar.staffDashboard.inventoryDesc')}</p>
                </div>
              </Link>
              <Link href="/dashboard/staff/inbounds">
                <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white text-center hover:shadow-lg transition-all duration-300 cursor-pointer transform hover:scale-105">
                  <FiPackage className="w-8 h-8 mx-auto mb-2" />
                  <p className="font-semibold text-sm">{t('sidebar.staffDashboard.inboundRequests')}</p>
                  <p className="text-green-100 text-xs">{t('sidebar.staffDashboard.inboundRequestsDesc')}</p>
                </div>
              </Link>
              <Link href="/dashboard/staff/outbounds">
                <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-lg p-4 text-white text-center hover:shadow-lg transition-all duration-300 cursor-pointer transform hover:scale-105">
                  <FiTruck className="w-8 h-8 mx-auto mb-2" />
                  <p className="font-semibold text-sm">{t('sidebar.staffDashboard.outboundRequests')}</p>
                  <p className="text-red-100 text-xs">{t('sidebar.staffDashboard.outboundRequestsDesc')}</p>
                </div>
              </Link>
              <Link href="/dashboard/staff/outbound-receipts">
                <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white text-center hover:shadow-lg transition-all duration-300 cursor-pointer transform hover:scale-105">
                  <FiClipboard className="w-8 h-8 mx-auto mb-2" />
                  <p className="font-semibold text-sm">{t('sidebar.staffDashboard.outboundReceipts')}</p>
                  <p className="text-purple-100 text-xs">{t('sidebar.staffDashboard.outboundReceiptsDesc')}</p>
                </div>
              </Link>
              <Link href="/dashboard/staff/warehouses">
                <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-lg p-4 text-white text-center hover:shadow-lg transition-all duration-300 cursor-pointer transform hover:scale-105">
                  <FiHome className="w-8 h-8 mx-auto mb-2" />
                  <p className="font-semibold text-sm">{t('sidebar.staffDashboard.warehouses')}</p>
                  <p className="text-indigo-100 text-xs">{t('sidebar.staffDashboard.warehousesDesc')}</p>
                </div>
              </Link>
              <Link href="/dashboard/staff/receipts">
                <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-lg p-4 text-white text-center hover:shadow-lg transition-all duration-300 cursor-pointer transform hover:scale-105">
                  <FiClipboard className="w-8 h-8 mx-auto mb-2" />
                  <p className="font-semibold text-sm">{t('sidebar.staffDashboard.receipts')}</p>
                  <p className="text-emerald-100 text-xs">{t('sidebar.staffDashboard.receiptsDesc')}</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
