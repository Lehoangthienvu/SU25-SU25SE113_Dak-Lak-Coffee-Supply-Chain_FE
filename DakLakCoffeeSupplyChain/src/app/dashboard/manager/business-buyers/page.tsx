"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Search,
  Eye,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  getAllBusinessBuyers,
  BusinessBuyerDto,
  softDeleteBusinessBuyer,
} from "@/lib/api/businessBuyers";
import { Tooltip } from "@/components/ui/tooltip";
import PageTitle from "@/components/ui/PageTitle";
import { ConfirmDialog } from "@/components/ui/confirmDialog";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export default function BusinessBuyersPage() {
  const { t } = useTranslation();
  const [buyers, setBuyers] = useState<BusinessBuyerDto[]>([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;
  const router = useRouter();
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [buyerToDelete, setBuyerToDelete] = useState<BusinessBuyerDto | null>(
    null
  );
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    getAllBusinessBuyers().then(
      (data) => Array.isArray(data) && setBuyers(data)
    );
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const byText = !q
      ? buyers
      : buyers.filter((b) =>
          [b.buyerCode, b.companyName, b.contactPerson, b.position]
            .join(" ")
            .toLowerCase()
            .includes(q)
        );
    const fromOk = !startDate
      ? byText
      : byText.filter((b) => new Date(b.createdAt) >= new Date(startDate));
    const toOk = !endDate
      ? fromOk
      : fromOk.filter((b) => new Date(b.createdAt) <= new Date(endDate));
    return toOk;
  }, [buyers, search, startDate, endDate]);

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paged = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const formatDate = (iso?: string) => {
    if (!iso) return "";
    const d = new Date(iso);
    return new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(d);
  };

  async function handleDelete() {
    if (!buyerToDelete) return;
    try {
      setDeleting(true);
      await softDeleteBusinessBuyer(buyerToDelete.buyerId);
      setBuyers((prev) =>
        prev.filter((x) => x.buyerId !== buyerToDelete.buyerId)
      );
      setShowDeleteDialog(false);
      setBuyerToDelete(null);
      toast.success(t('businessBuyers.messages.deleteSuccess'));
    } catch (e) {
      console.error("Xoá khách hàng thất bại:", e);
      toast.error(t('businessBuyers.messages.deleteError'));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-amber-50 p-6 gap-6">
      {/* Sidebar */}
      <aside className="w-64 space-y-4">
        <div className="bg-white rounded-xl shadow-sm p-4 space-y-4">
          <h2 className="text-sm font-medium text-gray-700">
            {t('businessBuyers.list.searchPlaceholder')}
          </h2>
          <div className="relative">
            <Input
              placeholder={t('businessBuyers.actions.search')}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="pr-10"
            />
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
          <div className="flex flex-col gap-3 pt-2">
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700">
                {t('businessBuyers.list.startDate')}
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700">
                {t('businessBuyers.list.endDate')}
              </label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 space-y-6">
        <div className="bg-white rounded-xl shadow-sm p-4 space-y-4">
          <div className="flex justify-between items-center gap-4 flex-wrap">
            <div />
            <Button
              className="bg-black text-white hover:bg-gray-800"
              onClick={() =>
                router.push("/dashboard/manager/business-buyers/create")
              }
            >
              + {t('businessBuyers.actions.addNew')}
            </Button>
          </div>

          <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead className="bg-gray-100 text-sm text-gray-600">
                <tr>
                  <th className="px-4 py-2 text-left">{t('businessBuyers.table.headers.companyName')}</th>
                  <th className="px-4 py-2 text-left">{t('businessBuyers.table.headers.contactPerson')}</th>
                  <th className="px-4 py-2 text-left">{t('businessBuyers.table.headers.position')}</th>
                  <th className="px-4 py-2 text-center">{t('businessBuyers.table.headers.createdAt')}</th>
                  <th className="px-4 py-2 text-center">{t('businessBuyers.table.headers.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {paged.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="text-center py-8 text-sm text-muted-foreground"
                    >
                      {t('businessBuyers.list.noResults')}
                    </td>
                  </tr>
                ) : (
                  paged.map((b) => (
                    <tr
                      key={b.buyerId}
                      className="border-t text-sm hover:bg-gray-50"
                    >
                      <td className="px-4 py-2 whitespace-nowrap">
                        {b.companyName}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        {b.contactPerson}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        {b.position}
                      </td>
                      <td className="px-4 py-2 text-center whitespace-nowrap">
                        {formatDate(b.createdAt)}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <div className="flex items-center gap-[2px] justify-center">
                          <Tooltip content={t('businessBuyers.table.tooltips.view')}>
                            <Button
                              variant="ghost"
                              className="p-[2px] w-7 h-7"
                              onClick={() =>
                                router.push(
                                  `/dashboard/manager/business-buyers/${b.buyerId}`
                                )
                              }
                            >
                              <Eye className="w-4 h-4 text-blue-500" />
                            </Button>
                          </Tooltip>
                          <Tooltip content={t('businessBuyers.table.tooltips.edit')}>
                            <Button
                              variant="ghost"
                              className="p-[2px] w-7 h-7"
                              onClick={() =>
                                router.push(
                                  `/dashboard/manager/business-buyers/${b.buyerId}/edit`
                                )
                              }
                            >
                              <Pencil className="w-4 h-4 text-yellow-500" />
                            </Button>
                          </Tooltip>
                          <Tooltip content={t('businessBuyers.table.tooltips.delete')}>
                            <Button
                              variant="ghost"
                              className="p-[2px] w-7 h-7"
                              onClick={() => {
                                setBuyerToDelete(b);
                                setShowDeleteDialog(true);
                              }}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </Tooltip>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">
              Hiển thị {(currentPage - 1) * pageSize + 1}-
              {Math.min(currentPage * pageSize, filtered.length)} trong{" "}
              {filtered.length} khách hàng
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                disabled={currentPage === totalPages}
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </main>
              <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title={
          <div className="flex items-center justify-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" /> {t('businessBuyers.deleteDialog.title')}
          </div>
        }
        description={
          <div className="mt-1 text-gray-700 text-center">
            {t('businessBuyers.deleteDialog.description')}
            <span className="font-semibold"> {buyerToDelete?.companyName}</span>
            {t('businessBuyers.deleteDialog.buyerName')}
            <br />
            {t('businessBuyers.deleteDialog.warning')}
          </div>
        }
        confirmText={deleting ? t('businessBuyers.deleteDialog.deleting') : t('businessBuyers.deleteDialog.confirm')}
        cancelText={t('businessBuyers.deleteDialog.cancel')}
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  );
}
