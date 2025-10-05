"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { getAllProcessingBatches, ProcessingBatch } from "@/lib/api/processingBatches";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/processing/Pagination";
import StatusBadge from "@/components/processing-batches/StatusBadge";
import { Box, Loader2, Search } from "lucide-react";
import {
  ProcessingStatus,
  ProcessingStatusMap,
} from "@/lib/constants/batchStatus";
import {
  normalizeProcessingStatus,
  processingStatusList,
} from "@/lib/utils/processingStatus";

const ITEMS_PER_PAGE = 10;

type StatusFilter = "all" | ProcessingStatus;

type StatusCounts = Record<ProcessingStatus, number>;

type Summary = {
  total: number;
  counts: StatusCounts;
};

const dashboardCardsOrder: ProcessingStatus[] = [
  ProcessingStatus.InProgress,
  ProcessingStatus.NotStarted,
  ProcessingStatus.Completed,
];

export default function FarmerProcessingBatchesPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [batches, setBatches] = useState<ProcessingBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<StatusFilter>("all");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchBatches = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getAllProcessingBatches();
        setBatches(data ?? []);
      } catch (err) {
        console.error("Failed to load processing batches", err);
        setError(
          t(
            "processing.farmerBatches.errors.loadFailed",
            "Không thể tải dữ liệu. Vui lòng thử lại sau."
          )
        );
      } finally {
        setLoading(false);
      }
    };

    fetchBatches();
  }, [t]);

  const summary = useMemo<Summary>(() => {
    const counts = processingStatusList.reduce<Record<ProcessingStatus, number>>((acc, status) => {
      acc[status] = 0;
      return acc;
    }, {} as Record<ProcessingStatus, number>);

    for (const batch of batches) {
      const normalized = normalizeProcessingStatus((batch as any).status ?? (batch as any).currentStatus);
      if (normalized) {
        counts[normalized] += 1;
      }
    }

    return {
      total: batches.length,
      counts,
    };
  }, [batches]);

  const statusOptions = useMemo(
    () =>
      processingStatusList.map((status) => ({
        value: status,
        label: ProcessingStatusMap[status].label,
        count: summary.counts[status] ?? 0,
      })),
    [summary]
  );

  const filteredBatches = useMemo(() => {
    const normalizedTerm = searchTerm.trim().toLowerCase();

    const filtered = batches.filter((batch) => {
      const normalizedStatus = normalizeProcessingStatus((batch as any).status ?? (batch as any).currentStatus);
      const matchesStatus = filterStatus === "all" || normalizedStatus === filterStatus;

      if (!matchesStatus) return false;
      if (!normalizedTerm) return true;

      const haystack = [
        batch.batchCode,
        (batch as any).batchName,
        (batch as any).methodName,
        (batch as any).cropSeasonName,
      ]
        .filter(Boolean)
        .map((value) => String(value).toLowerCase());

      return haystack.some((value) => value.includes(normalizedTerm));
    });

    // Sắp xếp theo ngày tạo mới nhất (lô mới nhất lên đầu)
    return filtered.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateB - dateA; // Sắp xếp giảm dần (mới nhất trước)
    });
  }, [batches, filterStatus, searchTerm]);

  const totalItems = filteredBatches.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
  const page = Math.min(currentPage, totalPages);
  const paginatedItems = filteredBatches.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, searchTerm]);

  const handleView = (batchId: string) => {
    router.push(`/dashboard/farmer/processing/batches/${batchId}`);
  };

  return (
    <div className="container mx-auto space-y-6 py-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {t("processing.farmerBatches.title", "Lô sơ chế của tôi")}
          </h1>
          <p className="text-gray-600">
            {t(
              "processing.farmerBatches.subtitle",
              "Theo dõi tiến độ sơ chế, tìm kiếm nhanh và truy cập chi tiết từng lô."
            )}
          </p>
        </div>
        <Button
          onClick={() => router.push("/dashboard/farmer/processing/batches/create")}
          className="bg-orange-500 hover:bg-orange-600 text-white shadow-md hover:shadow-lg transition-all duration-200"
          size="default"
        >
          <Box className="mr-2 h-4 w-4" />
          {t("processing.farmerBatches.actions.create", "Ghi nhận lô mới")}
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <CardTitle className="text-base font-medium">{t("processing.farmerBatches.filterTitle", "Bộ lọc")}</CardTitle>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  variant={filterStatus === "all" ? "default" : "outline"}
                  onClick={() => setFilterStatus("all")}
                  className={`h-8 px-3 ${filterStatus === "all"
                    ? "bg-orange-500 text-white hover:bg-orange-600"
                    : "border-orange-200 text-orange-600 hover:bg-orange-50"
                  }`}
                >
                  {t("processing.farmerBatches.all", "Tất cả")}
                  <span
                    className={
                      filterStatus === "all"
                        ? "ml-2 rounded-full border border-white/40 bg-white/20 px-2 text-xs font-medium text-white"
                        : "ml-2 rounded-full bg-orange-100 px-2 text-xs font-medium text-orange-700"
                    }
                  >
                    {summary.total}
                  </span>
                </Button>

                {statusOptions.map(({ value, label, count }) => {
                  const active = filterStatus === value;
                  return (
                    <Button
                      key={value}
                      size="sm"
                      variant={active ? "default" : "outline"}
                      onClick={() => setFilterStatus(value)}
                      className={`h-8 px-3 ${active ? "bg-orange-500 text-white hover:bg-orange-600" : "border-orange-200 text-orange-600 hover:bg-orange-50"}`}
                    >
                      {label}
                      <span
                        className={
                          active
                            ? "ml-2 rounded-full border border-white/40 bg-white/20 px-2 text-xs font-medium text-white"
                            : "ml-2 rounded-full bg-orange-100 px-2 text-xs font-medium text-orange-700"
                        }
                      >
                        {count}
                      </span>
                    </Button>
                  );
                })}
              </div>
            </div>
            <div className="relative w-full max-w-xs lg:ml-auto">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder={t("processing.farmerBatches.searchPlaceholder", "Tìm theo mã lô, mùa vụ, phương pháp")}
                className="w-full pl-9"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>{t("processing.farmerBatches.tableTitle", "Danh sách lô sơ chế")}</CardTitle>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex min-h-[200px] items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
            </div>
          ) : totalItems === 0 ? (
            <div className="py-10 text-center text-sm text-gray-500">
              {t("processing.farmerBatches.empty", "Không có dữ liệu phù hợp.")}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("processing.farmerBatches.columns.code", "Mã lô")}</TableHead>
                  <TableHead>{t("processing.farmerBatches.columns.season", "Mùa vụ")}</TableHead>
                  <TableHead>{t("processing.farmerBatches.columns.method", "Phương pháp")}</TableHead>
                  <TableHead>{t("processing.farmerBatches.columns.status", "Trạng thái")}</TableHead>
                  <TableHead>{t("processing.farmerBatches.columns.createdAt", "Ngày tạo")}</TableHead>
                  <TableHead className="text-right">
                    {t("processing.farmerBatches.columns.actions", "Hành động")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedItems.map((batch) => {
                  const statusValue = (batch as any).status ?? (batch as any).currentStatus;
                  const createdDate = batch.createdAt ? new Date(batch.createdAt).toLocaleDateString("vi-VN") : "—";

                  return (
                    <TableRow key={batch.batchId}>
                      <TableCell className="font-medium text-gray-900">
                        <button onClick={() => handleView(batch.batchId)} className="hover:text-orange-600">
                          {batch.batchCode || "—"}
                        </button>
                      </TableCell>
                      <TableCell>{batch.cropSeasonName || t("processing.common.seasonFallback", { id: batch.cropSeasonId ?? "?" })}</TableCell>
                      <TableCell>{batch.methodName || t("processing.common.methodFallback", { id: batch.methodId ?? "?" })}</TableCell>
                      <TableCell>
                        <StatusBadge status={statusValue} />
                      </TableCell>
                      <TableCell>{createdDate}</TableCell>
                      <TableCell>
                        <div className="flex justify-end">
                          <Button variant="outline" size="sm" onClick={() => handleView(batch.batchId)}>
                            {t("processing.farmerBatches.actions.view", "Xem chi tiết")}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}

          {!loading && totalItems > ITEMS_PER_PAGE && (
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              itemsPerPage={ITEMS_PER_PAGE}
              totalItems={totalItems}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
