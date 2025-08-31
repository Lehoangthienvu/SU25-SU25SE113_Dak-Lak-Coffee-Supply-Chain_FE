"use client";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent
} from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  getAllUsers,
  softDeleteUser,
  UserProfile,
  UserAccountStatus
} from "@/lib/api/users";
import {
  useState,
  useEffect
} from "react";
import { useRouter } from "next/navigation";
import { roleNameToVietnamese } from "@/lib/constants/role";

export default function UserManagement() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const usersPerPage = 10;
  const [roleFilter, setRoleFilter] = useState<string>("");
  const router = useRouter();
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function fetchUsers() {
      setLoading(true);
      setError("");
      try {
        const data = await getAllUsers();
        setUsers(data);
      } catch (err: any) {
        setError(err.message || "Lỗi khi tải danh sách người dùng");
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, []);

  // Get unique role names for filter
  const roleOptions = Array.from(new Set(users.map(user => user.roleName)));

  // Filter users by search (search by Email, Name, UserCode, PhoneNumber, roleName tiếng Việt)
  const filteredUsers = users.filter(
    (user) => {
      const searchLower = search.toLowerCase();
      const roleVi = roleNameToVietnamese[user.roleName] || user.roleName;
      return (
        user.email.toLowerCase().includes(searchLower) ||
        user.name.toLowerCase().includes(searchLower) ||
        user.userCode.toLowerCase().includes(searchLower) ||
        user.phoneNumber.toLowerCase().includes(searchLower) ||
        roleVi.toLowerCase().includes(searchLower) ||
        user.roleName.toLowerCase().includes(searchLower)
      ) && (roleFilter === "" || user.roleName === roleFilter);
    }
  );

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const paginatedUsers = filteredUsers.slice(
    (page - 1) * usersPerPage,
    page * usersPerPage
  );

  // Format date for display
  const formatDate = (date: string | Date) => {
    const d = typeof date === "string" ? new Date(date) : date;
    return new Intl.DateTimeFormat('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(d);
  };

  // Get status display info
  const getStatusInfo = (status: UserAccountStatus) => {
    switch (status) {
      case UserAccountStatus.PendingApproval:
        return { text: "Chờ duyệt", className: "bg-blue-100 text-blue-700" };
      case UserAccountStatus.Active:
        return { text: "Hoạt động", className: "bg-green-100 text-green-700" };
      case UserAccountStatus.Inactive:
        return { text: "Tạm ngưng", className: "bg-gray-200 text-gray-600" };
      case UserAccountStatus.Locked:
        return { text: "Bị khóa", className: "bg-orange-100 text-orange-700" };
      case UserAccountStatus.Suspended:
        return { text: "Tạm đình chỉ", className: "bg-red-100 text-red-700" };
      case UserAccountStatus.Rejected:
        return { text: "Từ chối duyệt", className: "bg-pink-100 text-pink-700" };
      case UserAccountStatus.Deleted:
        return { text: "Đã xoá", className: "bg-gray-300 text-gray-700" };
      case UserAccountStatus.Banned:
        return { text: "Cấm vĩnh viễn", className: "bg-black text-white" };
      default:
        return { text: "Không xác định", className: "bg-yellow-100 text-yellow-700" };
    }
  };

  const handleDelete = async () => {
    if (!deleteUserId) return;
    setDeleting(true);
    try {
      await softDeleteUser(deleteUserId);
      setUsers((prev) => prev.filter((u) => u.userId !== deleteUserId));
      setDeleteUserId(null);
    } catch (err: any) {
      alert(err.message || "Xoá người dùng thất bại");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="w-full">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle>Quản lý người dùng</CardTitle>
          <Button
            onClick={() => router.push("/dashboard/admin/users/create")}
            className="bg-orange-500 text-white"
          >
            Thêm người dùng
          </Button>
        </CardHeader>
        <CardContent>
          {error && <div className="text-red-500 mb-2">{error}</div>}
          {loading ? (
            <div className="text-center py-8">Đang tải...</div>
          ) : (
            <>
              <div className="flex items-center gap-4 mb-4">
                <input
                  type="text"
                  placeholder="Tìm kiếm theo mã, tên, email..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="border rounded px-3 py-2 w-64"
                />
                <select
                  className="border rounded px-3 py-2"
                  value={roleFilter}
                  onChange={(e) => {
                    setRoleFilter(e.target.value);
                    setPage(1);
                  }}
                  title="Lọc theo vai trò"
                  aria-label="Lọc theo vai trò"
                >
                  <option value="">Tất cả vai trò</option>
                  {roleOptions.map((role) => (
                    <option key={role} value={role}>
                      {roleNameToVietnamese[role] || role}
                    </option>
                  ))}
                </select>
              </div>
              <div className="overflow-x-auto p-2">
                <Table className="min-w-[800px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mã</TableHead>
                      <TableHead>Họ tên</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Vai trò</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead style={{ minWidth: 120 }}>Hành động</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedUsers.map((user) => {
                      const statusInfo = getStatusInfo(user.status);
                      return (
                        <TableRow key={user.userId}>
                          <TableCell className="font-medium">{user.userCode}</TableCell>
                          <TableCell className="font-medium">{user.name}</TableCell>
                          <TableCell className="text-sm text-gray-600">{user.email}</TableCell>
                          <TableCell>{roleNameToVietnamese[user.roleName] || user.roleName}</TableCell>
                          <TableCell>
                            <span
                              className={`px-2 py-1 rounded text-xs font-semibold ${statusInfo.className}`}
                            >
                              {statusInfo.text}
                            </span>
                          </TableCell>
                          <TableCell style={{ minWidth: 120 }}>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  router.push(
                                    `/dashboard/admin/users/${user.userId}`
                                  )
                                }
                              >
                                Chi tiết
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  router.push(
                                    `/dashboard/admin/users/${user.userId}/edit`
                                  )
                                }
                              >
                                Sửa
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => setDeleteUserId(user.userId)}
                              >
                                Xoá
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {paginatedUsers.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center">
                          Không có người dùng nào.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              {/* Pagination */}
              <div className="flex justify-end items-center gap-2 mt-4">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  Trước
                </Button>
                <span>
                  Trang {page} / {totalPages}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page === totalPages || totalPages === 0}
                  onClick={() => setPage(page + 1)}
                >
                  Sau
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
      {/* Popup xác nhận xoá */}
      {deleteUserId && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm mx-4 animate-fade-in">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">
              Xác nhận xoá người dùng
            </h2>
            <p className="text-sm text-gray-600 mb-6">
              Bạn có chắc chắn muốn xoá người dùng này? Hành động này không thể
              hoàn tác.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setDeleteUserId(null)} disabled={deleting}>
                Huỷ
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? "Đang xoá..." : "Xoá"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
