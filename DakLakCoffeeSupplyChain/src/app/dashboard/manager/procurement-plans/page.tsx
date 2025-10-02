"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import {
  getProcurementPlanStatusMap,
  ProcurementPlanStatusValue,
} from "@/lib/constants/procurementPlanStatus";
import { cn, getErrorMessage } from "@/lib/utils";
import {
  ProcurementPlan,
  deleteProcurementPlan,
  getAllProcurementPlans,
  updateProcurementPlanStatus,
} from "@/lib/api/procurementPlans";
import ProcurementPlanCard from "@/components/procurement-plan/ProcurementPlanCard";
import FilterStatusPanel from "@/components/ui/filterStatusPanel";
import { useRouter } from "next/navigation";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { AppToast } from "@/components/ui/AppToast";
import { ConfirmDialog } from "@/components/ui/confirmDialog";
import { useTranslation } from "react-i18next";
import { checkPaymentStatus, getPlanPostingFee } from "@/lib/api/payments";

export default function BusinessProcurementPlansPage() {
  const { t } = useTranslation();
  const [isMounted, setIsMounted] = useState(false);
  const [procurementPlans, setProcurementPlans] = useState<ProcurementPlan[]>([]);
  const [dialogType, setDialogType] = useState<"cancel" | "delete" | "open" | "closed" | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<ProcurementPlan | null>(null);
  const [loadingConfirm, setLoadingConfirm] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(100000);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<ProcurementPlanStatusValue | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const router = useRouter();

  // ✅ FIX: Đảm bảo component đã mount (client-side)
  useEffect(() => {
    setIsMounted(true);
    console.log("[ProcurementPlans] Mounted (client-side)");
    return () => {
      setIsMounted(false);
      console.log("[ProcurementPlans] Unmounted");
    };
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    console.log("[ProcurementPlans] Mount → reset loadingConfirm");
    setLoadingConfirm(false);
    fetchData();
  }, [isMounted]);

  const fetchData = async () => {
    setIsLoading(true);
    const data = await getAllProcurementPlans().catch((error) => {
      console.error(getErrorMessage(error));
      return [];
    });
    setProcurementPlans(data);

    try {
      if (data.length > 0) {
        const feeInfo = await getPlanPostingFee(data[0].planId);
        setPaymentAmount(feeInfo.amount);
      }
    } catch (error) {
      console.error("Không thể lấy thông tin phí thanh toán:", error);
    }
    setIsLoading(false);
  };

  async function handleOpenRegister(planId?: string) {
    console.log("[ProcurementPlans] Click open register", { planId });
    if (!planId) return;
    setLoadingConfirm(true);
    try {
      const paymentStatus = await checkPaymentStatus(planId).catch(() => null);
      console.log("[ProcurementPlans] paymentStatus", paymentStatus);

      if (!paymentStatus || paymentStatus.paymentStatus !== "Success") {
        const plan = procurementPlans.find(p => p.planId === planId);
        if (!plan?.title) {
          AppToast.error("Không tìm thấy tên kế hoạch để thanh toán");
          setLoadingConfirm(false);
          return;
        }
        const encodedTitle = encodeURIComponent(plan.title);
        console.log("[ProcurementPlans] redirect to payment-notification", { planId, encodedTitle });
        setLoadingConfirm(false);
        router.push(`/dashboard/manager/procurement-plans/payment-notification?planId=${planId}&planTitle=${encodedTitle}`);
        return;
      }

      const updatedPlan = await updateProcurementPlanStatus(planId, { status: 0 });
      if (updatedPlan) {
        setProcurementPlans((prev) => prev.map((p) => (p.planId === planId ? updatedPlan : p)));
        closeDialog();
        AppToast.success(t("procurementPlan.messages.success.opened"));
      }
    } catch (error) {
      AppToast.error(getErrorMessage(error));
    } finally {
      setLoadingConfirm(false);
    }
  }

  async function handleClose(planId?: string) {
    if (!planId) return;
    try {
      setLoadingConfirm(true);
      const updatedPlan = await updateProcurementPlanStatus(planId, { status: 1 });
      if (updatedPlan) {
        setProcurementPlans((prev) => prev.map((p) => (p.planId === planId ? updatedPlan : p)));
        adjustPagination();
        closeDialog();
        AppToast.success(t("procurementPlan.messages.success.closed"));
      }
    } catch (error) {
      AppToast.error(getErrorMessage(error));
    } finally {
      setLoadingConfirm(false);
    }
  }

  async function handleDelete(planId?: string) {
    if (!planId) return;
    try {
      setLoadingConfirm(true);
      const updatedPlan = await deleteProcurementPlan(planId);
      if (updatedPlan) {
        const newData = await getAllProcurementPlans().catch((error) => {
          AppToast.error(getErrorMessage(error));
          return [];
        });
        setProcurementPlans(newData);
        adjustPagination(newData);
        closeDialog();
        AppToast.success(t("procurementPlan.messages.success.deleted"));
      }
    } catch (error) {
      AppToast.error(getErrorMessage(error));
    } finally {
      setLoadingConfirm(false);
    }
  }

  async function handleCancel(planId?: string) {
    if (!planId) return;
    try {
      setLoadingConfirm(true);
      const updatedPlan = await updateProcurementPlanStatus(planId, { status: 2 });
      if (updatedPlan) {
        setProcurementPlans((prev) => prev.map((p) => (p.planId === planId ? updatedPlan : p)));
        adjustPagination();
        closeDialog();
        AppToast.success(t("procurementPlan.messages.success.cancelled"));
      }
    } catch (error) {
      AppToast.error(getErrorMessage(error));
    } finally {
      setLoadingConfirm(false);
    }
  }

  function adjustPagination(newData: ProcurementPlan[] = procurementPlans) {
    const filteredPlans = newData.filter(
      (plan) =>
        (!selectedStatus || plan.status === selectedStatus) &&
        (!search || plan.title.toLowerCase().includes(search.toLowerCase()))
    );
    const totalPages = Math.ceil(filteredPlans.length / pageSize);
    if (currentPage > totalPages && totalPages > 0) setCurrentPage(totalPages);
    else if (totalPages === 0) setCurrentPage(1);
  }

  function openCancelDialog(plan: ProcurementPlan) { setSelectedPlan(plan); setDialogType("cancel"); }
  function openOpenRegisterDialog(plan: ProcurementPlan) { setSelectedPlan(plan); setDialogType("open"); }
  function openClosedRegisterDialog(plan: ProcurementPlan) { setSelectedPlan(plan); setDialogType("closed"); }
  function openDeleteDialog(plan: ProcurementPlan) { setSelectedPlan(plan); setDialogType("delete"); }
  function closeDialog() { setDialogType(null); setSelectedPlan(null); }

  const filteredPlans = procurementPlans.filter(
    (plan) =>
      (!selectedStatus || plan.status === selectedStatus) &&
      (!search || plan.title.toLowerCase().includes(search.toLowerCase()))
  );

  useEffect(() => { setCurrentPage(1); }, [selectedStatus, search]);

  const totalPages = Math.ceil(filteredPlans.length / pageSize);
  const pagedPlans = filteredPlans.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const statusMap = getProcurementPlanStatusMap(t);
  const statusCounts = procurementPlans.reduce<Record<ProcurementPlanStatusValue, number>>(
    (acc, plan) => { acc[plan.status as ProcurementPlanStatusValue] = (acc[plan.status as ProcurementPlanStatusValue] || 0) + 1; return acc; },
    { Open: 0, Closed: 0, Draft: 0, Cancelled: 0 }
  );

  // ✅ FIX: Hiển thị loading khi chưa mount
  if (!isMounted || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div key={`procurement-list-${isMounted}`} className='flex bg-amber-200-50 p-6 gap-6'>
      {/* Sidebar */}
      <aside className='w-64 space-y-4'>
        <div className='bg-white rounded-xl shadow-sm p-4 space-y-4'>
          <h2 className='text-sm font-medium text-gray-700'>{t("procurementPlan.pages.list.search.title")}</h2>
          <div className='relative'>
            <Input placeholder={t("procurementPlan.pages.list.search.placeholder")} value={search} onChange={(e) => setSearch(e.target.value)} className='pr-10' />
            <Search className='absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
          </div>
        </div>
        <FilterStatusPanel<ProcurementPlanStatusValue>
          selectedStatus={selectedStatus}
          setSelectedStatus={setSelectedStatus}
          statusCounts={statusCounts}
          statusMap={statusMap}
        />
      </aside>

      {/* Main content */}
      <main className='flex-1 space-y-6'>
        <div className='bg-white rounded-xl shadow-sm p-4'>
          <div className='flex justify-end mb-4'>
            <Button onClick={() => router.push("/dashboard/manager/procurement-plans/create")} variant='default'>
              {t("procurementPlan.pages.list.actions.createNew")}
            </Button>
          </div>
          {isLoading ? (
            <LoadingSpinner />
          ) : pagedPlans.length === 0 ? (
            <p className='text-center py-8 text-sm text-muted-foreground'>
              {t("procurementPlan.pages.list.table.noData")}
            </p>
          ) : (
            <table className='w-full text-sm table-auto'>
              <thead className='bg-gray-100 text-gray-700 font-medium'>
                <tr>
                  <th className='px-4 py-3 text-left'>{t("procurementPlan.pages.list.table.headers.planName")}</th>
                  <th className='px-4 py-3 text-left'>{t("procurementPlan.pages.list.table.headers.totalOutput")}</th>
                  <th className='px-4 py-3 text-left'>{t("procurementPlan.pages.list.table.headers.registeredRatio")}</th>
                  <th className='px-4 py-3 text-left'>{t("procurementPlan.pages.list.table.headers.status")}</th>
                  <th className='px-4 py-3 text-left'>{t("procurementPlan.pages.list.table.headers.registrationPeriod")}</th>
                  <th className='px-4 py-3 text-left'>{t("procurementPlan.pages.list.table.headers.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {pagedPlans.map((plan) => (
                  <ProcurementPlanCard
                    key={plan.planId}
                    plan={plan}
                    openOpenRegisterDialog={() => openOpenRegisterDialog(plan)}
                    openCancelDialog={() => openCancelDialog(plan)}
                    openDeleteDialog={() => openDeleteDialog(plan)}
                    openClosedRegisterDialog={() => openClosedRegisterDialog(plan)}
                    statusMap={statusMap}
                  />
                ))}
              </tbody>
            </table>
          )}
        </div>

        <ConfirmDialog
          open={dialogType !== null}
          onOpenChange={(open) => !open && closeDialog()}
          title={
            dialogType === "open"
              ? t("procurementPlan.dialogs.confirm.open.title")
              : dialogType === "closed"
              ? t("procurementPlan.dialogs.confirm.close.title")
              : dialogType === "cancel"
              ? t("procurementPlan.dialogs.confirm.cancel.title")
              : dialogType === "delete"
              ? t("procurementPlan.dialogs.confirm.delete.title")
              : ""
          }
          description={selectedPlan?.title || ""}
          loading={loadingConfirm}
          onConfirm={() => {
            if (dialogType === "open") handleOpenRegister(selectedPlan?.planId);
            else if (dialogType === "closed") handleClose(selectedPlan?.planId);
            else if (dialogType === "cancel") handleCancel(selectedPlan?.planId);
            else if (dialogType === "delete") handleDelete(selectedPlan?.planId);
          }}
        />

        {!isLoading && totalPages > 1 && (
          <div className='flex justify-between items-center'>
            <span className='text-sm text-muted-foreground'>
              {t("procurementPlan.pages.list.pagination.showing")} {(currentPage - 1) * pageSize + 1}–
              {Math.min(currentPage * pageSize, filteredPlans.length)} {t("procurementPlan.pages.list.pagination.of")} {filteredPlans.length} {t("procurementPlan.pages.list.pagination.plans")}
            </span>
            <div className='flex items-center gap-2'>
              <Button variant='outline' size='icon' disabled={currentPage === 1} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}><ChevronLeft className='w-4 h-4' /></Button>
              {[...Array(totalPages).keys()].map((_, i) => {
                const page = i + 1;
                return (
                  <Button key={page} onClick={() => setCurrentPage(page)} className={cn("rounded-md px-3 py-1 text-sm", page === currentPage ? "bg-black text-white" : "bg-white text-black border")}>
                    {page}
                  </Button>
                );
              })}
              <Button variant='outline' size='icon' disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}><ChevronRight className='w-4 h-4' /></Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
