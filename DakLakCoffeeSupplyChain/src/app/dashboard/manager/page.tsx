"use client";

import {
  FiFileText,
  FiUsers,
  FiPackage,
  FiBarChart2,
  FiHome,
  FiTruck,
  FiClock,
  FiClipboard,
  FiCalendar,
  FiCoffee,
  FiTrendingUp,
  FiCheckCircle,
  FiClock as FiPending,
  FiShoppingCart,
  FiBriefcase,
  FiSend,
  FiTag,
} from "react-icons/fi";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { getAllProcessingBatches } from "@/lib/api/processingBatches";
import { useTranslation } from "react-i18next";

export default function ManagerDashboard() {
  const { t } = useTranslation();
  const [processingStats, setProcessingStats] = useState({
    total: 0,
    pending: 0,
    processing: 0,
    completed: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProcessingStats = async () => {
      try {
        const batches = await getAllProcessingBatches();
        if (batches) {
          const stats = {
            total: batches.length,
            pending: batches.filter((b) => String(b.status) === '0').length,
            processing: batches.filter((b) => String(b.status) === '1').length,
            completed: batches.filter((b) => String(b.status) === '2').length,
          };
          setProcessingStats(stats);
        }
      } catch (error) {
        console.error("Error fetching processing stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProcessingStats();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl shadow-lg">
              <FiBriefcase className="text-white text-2xl" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                {t('managerDashboard.title')}
              </h1>
              <p className="text-gray-600 text-lg">
                {t('managerDashboard.subtitle')}
              </p>
            </div>
          </div>
        </div>

        {/* Processing Statistics Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg">
                <FiCoffee className="text-white text-xl" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">
                {t('managerDashboard.processingStats.title')}
              </h2>
            </div>
            <Link
              href="/dashboard/manager/processing/batches"
              className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl hover:from-orange-600 hover:to-amber-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              {t('managerDashboard.processingStats.viewDetails')}
            </Link>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <StatsCard
              title={t('managerDashboard.processingStats.totalBatches')}
              value={processingStats.total}
              icon={<FiPackage className="w-6 h-6" />}
              color="blue"
              loading={loading}
            />
            <StatsCard
              title={t('managerDashboard.processingStats.pending')}
              value={processingStats.pending}
              icon={<FiPending className="w-6 h-6" />}
              color="yellow"
              loading={loading}
            />
            <StatsCard
              title={t('managerDashboard.processingStats.inProgress')}
              value={processingStats.processing}
              icon={<FiTrendingUp className="w-6 h-6" />}
              color="blue"
              loading={loading}
            />
            <StatsCard
              title={t('managerDashboard.processingStats.completed')}
              value={processingStats.completed}
              icon={<FiCheckCircle className="w-6 h-6" />}
              color="green"
              loading={loading}
            />
          </div>

          {/* Processing Chart */}
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-orange-200 p-8">
            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <FiBarChart2 className="text-orange-500" />
              {t('managerDashboard.processingStats.chart.title')}
            </h3>
            <div className="h-64 flex items-end justify-center gap-6">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                </div>
              ) : (
                <>
                  <ChartBar
                    label={t('managerDashboard.processingStats.chart.pending')}
                    value={processingStats.pending}
                    max={processingStats.total}
                    color="bg-yellow-400"
                  />
                  <ChartBar
                    label={t('managerDashboard.processingStats.chart.inProgress')}
                    value={processingStats.processing}
                    max={processingStats.total}
                    color="bg-blue-500"
                  />
                  <ChartBar
                    label={t('managerDashboard.processingStats.chart.completed')}
                    value={processingStats.completed}
                    max={processingStats.total}
                    color="bg-green-500"
                  />
                </>
              )}
            </div>
            <div className="mt-4 flex justify-center gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-400 rounded"></div>
                <span>{t('managerDashboard.processingStats.chart.pending')}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                <span>{t('managerDashboard.processingStats.chart.inProgress')}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span>{t('managerDashboard.processingStats.chart.completed')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg">
              <FiBriefcase className="text-white text-xl" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">
              {t('managerDashboard.quickActions.title')}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Hợp đồng cung ứng */}
            <Link href="/dashboard/manager/contracts">
              <DashboardCard
                icon={<FiFileText className="text-orange-500 text-xl" />}
                title={t('managerDashboard.quickActions.contracts.title')}
                description={t('managerDashboard.quickActions.contracts.description')}
                isLink
              />
            </Link>

            {/* Lịch giao hàng */}
            <Link href="/dashboard/manager/contract-delivery-batches">
              <DashboardCard
                icon={<FiCalendar className="text-orange-500 text-xl" />}
                title={t('managerDashboard.quickActions.deliverySchedule.title')}
                description={t('managerDashboard.quickActions.deliverySchedule.description')}
                isLink
              />
            </Link>

            {/* Kế hoạch thu mua */}
            <Link href="/dashboard/manager/procurement-plans">
              <DashboardCard
                icon={<FiClipboard className="text-orange-500 text-xl" />}
                title={t('managerDashboard.quickActions.procurementPlans.title')}
                description={t('managerDashboard.quickActions.procurementPlans.description')}
                isLink
              />
            </Link>

            <DashboardCard
              icon={<FiUsers className="text-orange-500 text-xl" />}
              title={t('managerDashboard.quickActions.farmers.title')}
              description={t('managerDashboard.quickActions.farmers.description')}
            />

            <DashboardCard
              icon={<FiPackage className="text-orange-500 text-xl" />}
              title={t('managerDashboard.quickActions.processingBatches.title')}
              description={t('managerDashboard.quickActions.processingBatches.description')}
            />

            <DashboardCard
              icon={<FiBarChart2 className="text-orange-500 text-xl" />}
              title={t('managerDashboard.quickActions.reports.title')}
              description={t('managerDashboard.quickActions.reports.description')}
            />

            {/* Kho hàng */}
            <Link href="/dashboard/manager/warehouses">
              <DashboardCard
                icon={<FiHome className="text-orange-500 text-xl" />}
                title={t('managerDashboard.quickActions.warehouses.title')}
                description={t('managerDashboard.quickActions.warehouses.description')}
                isLink
              />
            </Link>

            {/* Yêu cầu xuất kho */}
            <Link href="/dashboard/manager/warehouse-request">
              <DashboardCard
                icon={<FiTruck className="text-orange-500 text-xl" />}
                title={t('managerDashboard.quickActions.outboundRequests.title')}
                description={t('managerDashboard.quickActions.outboundRequests.description')}
                isLink
              />
            </Link>

            {/* Tồn kho */}
            <Link href="/dashboard/manager/inventories">
              <DashboardCard
                icon={<FiPackage className="text-orange-500 text-xl" />}
                title={t('managerDashboard.quickActions.inventories.title')}
                description={t('managerDashboard.quickActions.inventories.description')}
                isLink
              />
            </Link>

            {/* Lịch sử tồn kho */}
            <Link href="/dashboard/manager/inventory-logs">
              <DashboardCard
                icon={<FiClock className="text-orange-500 text-xl" />}
                title={t('managerDashboard.quickActions.inventoryLogs.title')}
                description={t('managerDashboard.quickActions.inventoryLogs.description')}
                isLink
              />
            </Link>

            {/* Đơn hàng */}
            <Link href="/dashboard/manager/orders">
              <DashboardCard
                icon={<FiShoppingCart className="text-orange-500 text-xl" />}
                title={t('managerDashboard.quickActions.orders.title')}
                description={t('managerDashboard.quickActions.orders.description')}
                isLink
              />
            </Link>

            {/* Vận chuyển */}
            <Link href="/dashboard/manager/shipments">
              <DashboardCard
                icon={<FiSend className="text-orange-500 text-xl" />}
                title={t('managerDashboard.quickActions.shipments.title')}
                description={t('managerDashboard.quickActions.shipments.description')}
                isLink
              />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatsCard({
  title,
  value,
  icon,
  color,
  loading,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  loading: boolean;
}) {
  const colorClasses = {
    blue: "bg-blue-100 text-blue-600",
    yellow: "bg-yellow-100 text-yellow-600",
    green: "bg-green-100 text-green-600",
    red: "bg-red-100 text-red-600",
  };

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-orange-200 p-6 hover:shadow-2xl transition-all duration-300">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
            {loading ? "..." : value}
          </p>
        </div>
        <div
          className={`p-4 rounded-xl shadow-lg ${
            colorClasses[color as keyof typeof colorClasses]
          }`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

function ChartBar({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  const height = max > 0 ? (value / max) * 100 : 0;

  return (
    <div className="flex flex-col items-center">
      <div className="text-sm font-medium text-gray-900 mb-2">{value}</div>
      <div
        className="w-16 bg-gray-200 rounded-t-lg"
        style={{ height: "200px" }}
      >
        <div
          className={`${color} rounded-t-lg transition-all duration-500`}
          style={{ height: `${height}%` }}
        ></div>
      </div>
      <div className="text-xs text-gray-600 mt-2 text-center">{label}</div>
    </div>
  );
}

function DashboardCard({
  icon,
  title,
  description,
  isLink,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  isLink?: boolean;
}) {
  return (
    <div
      className={`p-6 bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-orange-100 hover:border-orange-200 ${
        isLink ? "cursor-pointer hover:-translate-y-1" : ""
      }`}
    >
      <div className="flex items-center gap-4 mb-4">
        <div className="p-3 bg-gradient-to-r from-orange-100 to-amber-100 rounded-xl">
          {icon}
        </div>
        <h2 className="text-xl font-bold text-gray-800">{title}</h2>
      </div>
      <p className="text-gray-500 text-sm">{description}</p>
    </div>
  );
}
