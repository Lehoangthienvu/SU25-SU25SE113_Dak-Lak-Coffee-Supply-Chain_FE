"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getAllBusinessStaffs,
  softDeleteBusinessStaff,
  BusinessStaffListDto,
} from "@/lib/api/businessStaffs";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import {
  Eye,
  Pencil,
  Trash2,
  Plus,
  Users,
  Search,
  Filter,
  MoreHorizontal,
  X,
  Building,
  MapPin,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function BusinessStaffListPage() {
  const [staffs, setStaffs] = useState<BusinessStaffListDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    async function fetchStaffs() {
      try {
        const data = await getAllBusinessStaffs();
        setStaffs(data);
      } catch (err) {
        toast.error("Không thể tải danh sách nhân viên.");
      } finally {
        setLoading(false);
      }
    }

    fetchStaffs();
  }, []);

  const handleDelete = async (id: string) => {
    const confirm = window.confirm("Bạn có chắc muốn xoá nhân viên này?");
    if (!confirm) return;

    try {
      const res = await softDeleteBusinessStaff(id);
      if (res.status === 200) {
        toast.success("Xoá thành công.");
        setStaffs((prev) => prev.filter((s) => s.staffId !== id));
      } else {
        toast.error(res.message || "Xoá thất bại.");
      }
    } catch (err) {
      toast.error("Lỗi khi xoá nhân viên.");
    }
  };

  // Lấy danh sách unique departments
  const departments = Array.from(new Set(staffs.map(staff => staff.department))).sort();

  const filteredStaffs = staffs.filter((staff) => {
    const matchesSearch = 
      staff.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staff.staffCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staff.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staff.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staff.position.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDepartment = selectedDepartment === "all" || staff.department === selectedDepartment;

    return matchesSearch && matchesDepartment;
  });

  const getDepartmentColor = (department: string) => {
    const colors: Record<string, string> = {
      "Kinh doanh": "bg-gradient-to-r from-blue-500 to-blue-600 text-white",
      "Kế toán": "bg-gradient-to-r from-green-500 to-green-600 text-white",
      "Nhân sự": "bg-gradient-to-r from-purple-500 to-purple-600 text-white",
      "Kỹ thuật": "bg-gradient-to-r from-orange-500 to-orange-600 text-white",
      "Marketing": "bg-gradient-to-r from-pink-500 to-pink-600 text-white",
      "Vận hành": "bg-gradient-to-r from-indigo-500 to-indigo-600 text-white",
      "Sản xuất": "bg-gradient-to-r from-teal-500 to-teal-600 text-white",
      "Chất lượng": "bg-gradient-to-r from-yellow-500 to-yellow-600 text-white",
      "Quản lý": "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white",
      "Kho Đắk Lắk": "bg-gradient-to-r from-cyan-500 to-cyan-600 text-white",
    };
    return colors[department] || "bg-gradient-to-r from-gray-500 to-gray-600 text-white";
  };

  const getPositionColor = (position: string) => {
    if (position.includes("Thủ kho")) {
      return "bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 border border-amber-200";
    }
    if (position.includes("Kho")) {
      return "bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border border-blue-200";
    }
    if (position.includes("Quản lý")) {
      return "bg-gradient-to-r from-purple-100 to-violet-100 text-purple-800 border border-purple-200";
    }
    return "bg-gradient-to-r from-gray-100 to-slate-100 text-gray-700 border border-gray-200";
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedDepartment("all");
  };

  const hasActiveFilters = searchTerm || selectedDepartment !== "all";

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 rounded-xl p-6 border border-orange-100 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-orange-400 to-amber-500 rounded-xl shadow-lg">
              <Users className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                Quản lý nhân viên
              </h1>
              <p className="text-gray-600 mt-1 text-sm">
                Quản lý thông tin và phân quyền nhân viên trong hệ thống
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 shadow-md">
              <Badge variant="secondary" className="bg-gradient-to-r from-orange-100 to-amber-100 text-orange-800 border-orange-200 text-sm px-3 py-1">
                <Sparkles className="w-3 h-3 mr-1" />
                {filteredStaffs.length}/{staffs.length} nhân viên
              </Badge>
            </div>
            <Button
              onClick={() => router.push("/dashboard/manager/business-staffs/create")}
              className="bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 hover:from-orange-600 hover:via-amber-600 hover:to-yellow-600 text-white px-6 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 text-sm font-semibold transform hover:scale-105"
            >
              <Plus className="w-4 h-4" />
              Thêm nhân viên
            </Button>
          </div>
        </div>
      </div>

      {/* Search and Filter Section */}
      <Card className="p-6 shadow-lg border-0 bg-white/70 backdrop-blur-md rounded-xl">
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Tìm kiếm nhân viên theo tên, mã, email, vị trí..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border-2 border-gray-200 focus:border-orange-400 focus:ring-orange-200 rounded-lg text-sm transition-all duration-200"
              />
            </div>
            <Button 
              variant="outline" 
              className="border-2 border-gray-200 hover:bg-gradient-to-r hover:from-orange-50 hover:to-amber-50 hover:border-orange-300 px-4 py-2 rounded-lg transition-all duration-200 text-sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4 mr-2" />
              Bộ lọc {showFilters ? "↑" : "↓"}
            </Button>
            {hasActiveFilters && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={clearFilters}
                className="text-gray-500 hover:text-orange-600 hover:bg-orange-50 px-3 py-2 rounded-lg transition-all duration-200 text-sm"
              >
                <X className="w-4 h-4 mr-1" />
                Xóa bộ lọc
              </Button>
            )}
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Building className="w-4 h-4 text-orange-500" />
                  Phòng ban
                </label>
                <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                  <SelectTrigger className="border-2 border-gray-200 focus:border-orange-400 focus:ring-orange-200 rounded-lg py-2 text-sm">
                    <SelectValue placeholder="Tất cả phòng ban" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả phòng ban</SelectItem>
                    {departments.map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${getDepartmentColor(dept).split(' ')[0]}`}></div>
                          <span className="font-medium text-sm">{dept}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">
                  Thống kê
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-3 border border-gray-200">
                    <div className="text-gray-600 text-xs">Tổng số</div>
                    <div className="font-bold text-lg text-gray-900">{staffs.length}</div>
                  </div>
                  <div className="bg-gradient-to-br from-orange-50 to-amber-100 rounded-lg p-3 border border-orange-200">
                    <div className="text-orange-600 text-xs">Đã lọc</div>
                    <div className="font-bold text-lg text-orange-900">{filteredStaffs.length}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 pt-3">
              {searchTerm && (
                <Badge variant="secondary" className="bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border-blue-300 px-3 py-1 text-xs">
                  🔍 Tìm kiếm: "{searchTerm}"
                  <button 
                    onClick={() => setSearchTerm("")}
                    className="ml-1 hover:text-blue-900 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
              {selectedDepartment !== "all" && (
                <Badge variant="secondary" className="bg-gradient-to-r from-green-100 to-green-200 text-green-800 border-green-300 px-3 py-1 text-xs">
                  🏢 Phòng ban: {selectedDepartment}
                  <button 
                    onClick={() => setSelectedDepartment("all")}
                    className="ml-1 hover:text-green-900 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Staff List */}
      {loading ? (
        <Card className="p-12 text-center bg-white/70 backdrop-blur-md rounded-xl shadow-lg">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent mx-auto"></div>
          <p className="text-gray-600 mt-4 text-sm">Đang tải danh sách nhân viên...</p>
        </Card>
      ) : (
        <Card className="overflow-hidden shadow-lg border-0 bg-white/70 backdrop-blur-md rounded-xl">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-orange-50 via-amber-50 to-yellow-50 border-b border-orange-100">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">Mã NV</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">Họ tên</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">Email</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">Phòng ban</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">Vị trí</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-gray-800">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredStaffs.map((staff, index) => (
                  <tr 
                    key={staff.staffId} 
                    className="hover:bg-gradient-to-r hover:from-orange-50/50 hover:to-amber-50/50 transition-all duration-300 group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-amber-500 rounded-xl flex items-center justify-center mr-3 shadow-md group-hover:scale-110 transition-transform duration-200">
                          <span className="text-sm font-bold text-white">
                            {staff.staffCode.charAt(0)}
                          </span>
                        </div>
                        <span className="font-semibold text-gray-900 text-sm">{staff.staffCode}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-semibold text-gray-900 text-sm">{staff.fullName}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-600 text-sm">{staff.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={`${getDepartmentColor(staff.department)} border-0 px-3 py-1 text-xs font-semibold shadow-md`}>
                        {staff.department}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={`${getPositionColor(staff.position)} px-3 py-1 text-xs font-semibold shadow-sm`}>
                        {staff.position}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/dashboard/manager/business-staffs/${staff.staffId}`)}
                          className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 p-2 rounded-lg transition-all duration-200 hover:scale-110"
                          title="Xem chi tiết"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/dashboard/manager/business-staffs/${staff.staffId}/edit`)}
                          className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-2 rounded-lg transition-all duration-200 hover:scale-110"
                          title="Chỉnh sửa"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(staff.staffId)}
                          className="text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded-lg transition-all duration-200 hover:scale-110"
                          title="Xóa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredStaffs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center mb-4">
                          <Users className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-gray-600 text-lg font-semibold mb-2">
                          {hasActiveFilters ? "Không tìm thấy nhân viên phù hợp" : "Chưa có nhân viên nào"}
                        </p>
                        <p className="text-gray-500 text-sm">
                          {hasActiveFilters ? "Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm" : "Bắt đầu thêm nhân viên đầu tiên"}
                        </p>
                        {hasActiveFilters && (
                          <Button 
                            variant="outline" 
                            onClick={clearFilters}
                            className="mt-4 px-4 py-2 rounded-lg border-2 hover:bg-orange-50 hover:border-orange-300 transition-all duration-200 text-sm"
                          >
                            <X className="w-4 h-4 mr-2" />
                            Xóa tất cả bộ lọc
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
