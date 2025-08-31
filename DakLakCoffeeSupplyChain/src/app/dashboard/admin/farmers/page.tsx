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
    getAllFarmers,
    softDeleteFarmer,
    updateFarmerVerification,
    Farmer
} from "@/lib/api/farmers";
import {
    useState,
    useEffect
} from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function FarmerManagement() {
    const [farmers, setFarmers] = useState<Farmer[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [locationFilter, setLocationFilter] = useState<string>("");
    const router = useRouter();
    const [deleteFarmerId, setDeleteFarmerId] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        async function fetchFarmers() {
            setLoading(true);
            setError("");
            try {
                const data = await getAllFarmers();
                setFarmers(data);
            } catch (err: any) {
                setError(err.message || "Lỗi khi tải danh sách nông dân");
            } finally {
                setLoading(false);
            }
        }
        fetchFarmers();
    }, []);

    // Get unique locations for filter
    const locationOptions = Array.from(new Set(farmers.map(farmer => farmer.farmLocation)));

    // Filter farmers by search
    const filteredFarmers = farmers.filter(
        (farmer) => {
            const searchLower = search.toLowerCase();
            return (
                farmer.farmerCode.toLowerCase().includes(searchLower) ||
                farmer.farmerName.toLowerCase().includes(searchLower) ||
                farmer.farmLocation.toLowerCase().includes(searchLower)
            ) && (locationFilter === "" || farmer.farmLocation === locationFilter);
        }
    );

    // Pagination
    const farmersPerPage = 10;
    const totalPages = Math.ceil(filteredFarmers.length / farmersPerPage);
    const paginatedFarmers = filteredFarmers.slice(
        (page - 1) * farmersPerPage,
        page * farmersPerPage
    );

    const handleDelete = async () => {
        if (!deleteFarmerId) return;
        setDeleting(true);
        try {
            await softDeleteFarmer(deleteFarmerId);
            setFarmers((prev) => prev.filter((f) => f.farmerId !== deleteFarmerId));
            setDeleteFarmerId(null);
            toast.success("Xóa nông dân thành công!");
        } catch (err: any) {
            toast.error(err.message || "Xóa nông dân thất bại");
        } finally {
            setDeleting(false);
        }
    };

    const handleVerify = async (farmerId: string) => {
        try {
            const farmer = farmers.find(f => f.farmerId === farmerId);
            if (!farmer) return;

            await updateFarmerVerification(farmerId, true);

            // Cập nhật local state
            setFarmers(prev => prev.map(f =>
                f.farmerId === farmerId
                    ? { ...f, isVerified: true }
                    : f
            ));
            toast.success("Xác thực nông dân thành công!");
        } catch (err: any) {
            toast.error(err.message || "Không thể xác thực nông dân!");
        }
    };

    return (
        <div className="w-full">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-4">
                    <CardTitle>Quản lý nông dân</CardTitle>
                    <Button
                        onClick={() => router.push("/dashboard/admin/farmers/create")}
                        className="bg-orange-500 text-white"
                    >
                        Thêm nông dân
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
                                    placeholder="Tìm kiếm theo mã, tên, địa điểm..."
                                    value={search}
                                    onChange={(e) => {
                                        setSearch(e.target.value);
                                        setPage(1);
                                    }}
                                    className="border rounded px-3 py-2 w-64"
                                />
                                <select
                                    className="border rounded px-3 py-2"
                                    value={locationFilter}
                                    onChange={(e) => {
                                        setLocationFilter(e.target.value);
                                        setPage(1);
                                    }}
                                    title="Lọc theo địa điểm"
                                    aria-label="Lọc theo địa điểm"
                                >
                                    <option value="">Tất cả địa điểm</option>
                                    {locationOptions.map((location) => (
                                        <option key={location} value={location}>
                                            {location}
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
                                            <TableHead>Địa điểm</TableHead>
                                            <TableHead>Trạng thái</TableHead>
                                            <TableHead style={{ minWidth: 120 }}>Hành động</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {paginatedFarmers.map((farmer) => (
                                            <TableRow key={farmer.farmerId}>
                                                <TableCell className="font-medium">{farmer.farmerCode}</TableCell>
                                                <TableCell className="font-medium">{farmer.farmerName}</TableCell>
                                                <TableCell className="text-sm text-gray-600">{farmer.farmLocation}</TableCell>
                                                <TableCell>
                                                    <span className={`px-2 py-1 rounded text-xs font-semibold ${farmer.isVerified === true
                                                        ? "bg-green-100 text-green-700"
                                                        : "bg-yellow-100 text-yellow-700"
                                                        }`}>
                                                        {farmer.isVerified === true ? "Đã xác thực" : "Chưa xác thực"}
                                                    </span>
                                                </TableCell>
                                                <TableCell style={{ minWidth: 140 }}>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() =>
                                                                router.push(
                                                                    `/dashboard/admin/farmers/${farmer.farmerId}`
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
                                                                    `/dashboard/admin/farmers/${farmer.farmerId}/edit`
                                                                )
                                                            }
                                                        >
                                                            Sửa
                                                        </Button>
                                                        {farmer.isVerified !== true && (
                                                            <Button
                                                                size="sm"
                                                                variant="default"
                                                                className="bg-green-600 hover:bg-green-700 text-white"
                                                                onClick={() => handleVerify(farmer.farmerId)}
                                                            >
                                                                Xác thực
                                                            </Button>
                                                        )}
                                                        <Button
                                                            size="sm"
                                                            variant="destructive"
                                                            onClick={() => setDeleteFarmerId(farmer.farmerId)}
                                                        >
                                                            Xoá
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {paginatedFarmers.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center">
                                                    Không có nông dân nào.
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
            {deleteFarmerId && (
                <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center">
                    <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm mx-4 animate-fade-in">
                        <h2 className="text-lg font-semibold mb-4 text-gray-800">
                            Xác nhận xoá nông dân
                        </h2>
                        <p className="text-sm text-gray-600 mb-6">
                            Bạn có chắc chắn muốn xoá nông dân này? Hành động này không thể
                            hoàn tác.
                        </p>
                        <div className="flex justify-end gap-3">
                            <Button variant="outline" onClick={() => setDeleteFarmerId(null)} disabled={deleting}>
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
