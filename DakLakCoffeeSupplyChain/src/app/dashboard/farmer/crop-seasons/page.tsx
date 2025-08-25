"use client";

import { useEffect, useState } from "react";
import {
  getCropSeasonsForCurrentUser,
  CropSeasonListItem,
} from "@/lib/api/cropSeasons";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Search, Plus, Filter, Calendar, MapPin, Users } from "lucide-react";
import { CropSeasonStatusValue } from "@/lib/constants/cropSeasonStatus";
import { cn } from "@/lib/utils";
import CropSeasonCard from "@/components/crop-seasons/CropSeasonCard";
import FilterStatusPanel from "@/components/crop-seasons/FilterStatusPanel";
import { useAuthGuard } from "@/lib/auth/useAuthGuard";
import { useRouter } from "next/navigation";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { toast } from "sonner";
import CropStagesDialog from "../crop-stages/page";

export default function FarmerCropSeasonsPage() {
  useAuthGuard(["farmer"]);
  const [cropSeasons, setCropSeasons] = useState<CropSeasonListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const pageSize = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedStatus]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const data = await getCropSeasonsForCurrentUser({
          search,
          status: selectedStatus ?? undefined,
          page: currentPage,
          pageSize,
        });

        setCropSeasons(data);
      } catch (err) {
        console.error("Lỗi khi tải danh sách mùa vụ:", err);
        toast.error("Không thể tải danh sách mùa vụ");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [search, selectedStatus, currentPage]);

  const filteredSeasons = cropSeasons.filter(
    (season) =>
      (!selectedStatus || season.status === selectedStatus) &&
      (!search ||
        season.seasonName.toLowerCase().includes(search.toLowerCase()))
  );

  const totalPages = Math.ceil(filteredSeasons.length / pageSize);
  const pagedSeasons = filteredSeasons.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const statusCounts = cropSeasons.reduce<
    Record<CropSeasonStatusValue, number>
  >(
    (acc, season) => {
      const status = season.status as CropSeasonStatusValue;
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    },
    {
      Active: 0,
      Paused: 0,
      Completed: 0,
      Cancelled: 0,
    }
  );

  const router = useRouter();

  // Tính toán thống kê
  const totalSeasons = cropSeasons.length;
  const activeSeasons = cropSeasons.filter(s => s.status === 'Active').length;
  const totalArea = cropSeasons.reduce((sum, s) => sum + (s.area || 0), 0);

  return (
    <div className="min-h-screen bg-orange-50 p-4">
      <div className="max-w-6xl mx-auto space-y-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-4 border border-orange-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 mb-1">
                Quản lý mùa vụ
              </h1>
              <p className="text-gray-600 text-sm">
                Theo dõi và quản lý các mùa vụ cà phê của bạn
              </p>
            </div>
            <div className="flex items-center gap-2">
              <CropStagesDialog />

              <Button
                onClick={() => router.push("/dashboard/farmer/crop-seasons/create")}
                className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg"
                size="sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Tạo mùa vụ mới
              </Button>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
                <Users className="w-6 h-6 text-green-200" />
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
                  placeholder="Nhập tên mùa vụ..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pr-8 border-orange-200 focus:border-orange-500 focus:ring-orange-500"
                  size={1}
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
              <div className="p-4">
                <FilterStatusPanel
                  selectedStatus={selectedStatus}
                  setSelectedStatus={setSelectedStatus}
                  statusCounts={statusCounts}
                />
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            <div className="bg-white rounded-lg shadow-sm border border-orange-100 overflow-hidden">
              <div className="p-4 border-b border-orange-100">
                <h2 className="text-lg font-semibold text-gray-800">
                  Danh sách mùa vụ ({filteredSeasons.length})
                </h2>
              </div>

              <div className="p-4">
                {isLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <LoadingSpinner />
                  </div>
                ) : pagedSeasons.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Calendar className="w-6 h-6 text-orange-600" />
                    </div>
                    <p className="text-gray-500 text-sm font-medium mb-1">
                      Không tìm thấy mùa vụ nào
                    </p>
                    <p className="text-gray-400 text-xs">
                      {search || selectedStatus
                        ? "Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm"
                        : "Bắt đầu tạo mùa vụ đầu tiên của bạn"
                      }
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gradient-to-r from-orange-50 to-amber-50 text-gray-700 font-semibold">
                        <tr>
                          <th className="px-4 py-3 text-left">Tên mùa vụ</th>
                          <th className="px-4 py-3 text-center">Diện tích (ha)</th>
                          <th className="px-4 py-3 text-center">Trạng thái</th>
                          <th className="px-4 py-3 text-center">Thời gian</th>
                          <th className="px-4 py-3 text-center">Hành động</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-orange-100">
                        {pagedSeasons.map((season) => (
                          <CropSeasonCard
                            key={season.cropSeasonId}
                            season={season}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Pagination */}
            {!isLoading && totalPages > 1 && (
              <div className="bg-white rounded-lg shadow-sm p-4 border border-orange-100 mt-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">
                    Hiển thị {(currentPage - 1) * pageSize + 1}–
                    {Math.min(currentPage * pageSize, filteredSeasons.length)} trong{" "}
                    {filteredSeasons.length} mùa vụ
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className="border-orange-200 hover:bg-orange-50"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    {[...Array(totalPages).keys()].map((_, i) => {
                      const page = i + 1;
                      return (
                        <Button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          size="sm"
                          className={cn(
                            "rounded-md px-2 py-1 text-xs",
                            page === currentPage
                              ? "bg-orange-600 text-white"
                              : "bg-white text-gray-700 border border-orange-200 hover:bg-orange-50"
                          )}
                        >
                          {page}
                        </Button>
                      );
                    })}
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === totalPages}
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      className="border-orange-200 hover:bg-orange-50"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
