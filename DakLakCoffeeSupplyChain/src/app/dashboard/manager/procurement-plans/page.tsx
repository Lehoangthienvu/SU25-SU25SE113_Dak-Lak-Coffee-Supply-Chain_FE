"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import {
  ProcurementPlanStatusMap,
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

export default function BusinessProcurementPlansPage() {
  const [procurementPlans, setProcurementPlans] = useState<ProcurementPlan[]>(
    []
  );
  const [dialogType, setDialogType] = useState<
    "cancel" | "delete" | "open" | "closed" | null
  >(null);
  const [selectedPlan, setSelectedPlan] = useState<ProcurementPlan | null>(
    null
  );
  const [loadingConfirm, setLoadingConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] =
    useState<ProcurementPlanStatusValue | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const router = useRouter();



  useEffect(() => {
    fetchData();
    setIsLoading(false);
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    const data = await getAllProcurementPlans().catch((error) => {
      AppToast.error(getErrorMessage(error));
      return [];
    });
    setProcurementPlans(data);
  };

  async function handleOpenRegister(planId?: string) {
    if (!planId) return;
    try {
      setLoadingConfirm(true);
      const updatedPlan = await updateProcurementPlanStatus(planId, {
        status: 0,
      });
      if (updatedPlan) {
        setProcurementPlans((prev) =>
          prev.map((p) => (p.planId === planId ? updatedPlan : p))
        );
        
        // Kiểm tra và điều chỉnh trang ngay lập tức
        const currentPageItems = procurementPlans.filter(
          (plan) =>
            (!selectedStatus || plan.status === selectedStatus) &&
            (!search || plan.title.toLowerCase().includes(search.toLowerCase()))
        ).slice((currentPage - 1) * pageSize, currentPage * pageSize);
        
        // Nếu trang hiện tại không còn item nào và không phải trang 1, chuyển về trang 1
        if (currentPageItems.length === 0 && currentPage > 1) {
          setCurrentPage(1);
        }
        
        closeDialog();
        AppToast.success("Kế hoạch đã được mở đăng ký thành công");
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
      const updatedPlan = await updateProcurementPlanStatus(planId, {
        status: 1,
      });
      if (updatedPlan) {
        setProcurementPlans((prev) =>
          prev.map((p) => (p.planId === planId ? updatedPlan : p))
        );
        
        // Kiểm tra và điều chỉnh trang ngay lập tức
        const currentPageItems = procurementPlans.filter(
          (plan) =>
            (!selectedStatus || plan.status === selectedStatus) &&
            (!search || plan.title.toLowerCase().includes(search.toLowerCase()))
        ).slice((currentPage - 1) * pageSize, currentPage * pageSize);
        
        // Nếu trang hiện tại không còn item nào và không phải trang 1, chuyển về trang 1
        if (currentPageItems.length === 0 && currentPage > 1) {
          setCurrentPage(1);
        }
        
        closeDialog();
        AppToast.success("Kế hoạch đã được kết thúc đăng ký thành công");
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
        // Lấy dữ liệu mới
        const newData = await getAllProcurementPlans().catch((error) => {
          AppToast.error(getErrorMessage(error));
          return [];
        });
        
        // Cập nhật state
        setProcurementPlans(newData);
        
        // Kiểm tra và điều chỉnh trang ngay lập tức với dữ liệu mới
        const filteredPlans = newData.filter(
          (plan) =>
            (!selectedStatus || plan.status === selectedStatus) &&
            (!search || plan.title.toLowerCase().includes(search.toLowerCase()))
        );
        const totalPages = Math.ceil(filteredPlans.length / pageSize);
        
        // Nếu trang hiện tại vượt quá tổng số trang, chuyển về trang cuối cùng
        if (currentPage > totalPages && totalPages > 0) {
          setCurrentPage(totalPages);
        }
        // Nếu không còn item nào, chuyển về trang 1
        else if (totalPages === 0) {
          setCurrentPage(1);
        }
        
        closeDialog();
        AppToast.success("Kế hoạch đã được xóa thành công");
        setIsLoading(false);
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
      const updatedPlan = await updateProcurementPlanStatus(planId, {
        status: 2,
      });
      if (updatedPlan) {
        setProcurementPlans((prev) =>
          prev.map((p) => (p.planId === planId ? updatedPlan : p))
        );
        
        // Kiểm tra và điều chỉnh trang ngay lập tức
        const currentPageItems = procurementPlans.filter(
          (plan) =>
            (!selectedStatus || plan.status === selectedStatus) &&
            (!search || plan.title.toLowerCase().includes(search.toLowerCase()))
        ).slice((currentPage - 1) * pageSize, currentPage * pageSize);
        
        // Nếu trang hiện tại không còn item nào và không phải trang 1, chuyển về trang 1
        if (currentPageItems.length === 0 && currentPage > 1) {
          setCurrentPage(1);
        }
        
        closeDialog();
        AppToast.success("Kế hoạch đã được hủy thành công");
      }
    } catch (error) {
      AppToast.error(getErrorMessage(error));
    } finally {
      setLoadingConfirm(false);
    }
  }

  function openCancelDialog(plan: ProcurementPlan) {
    setSelectedPlan(plan);
    setDialogType("cancel");
  }

  function openOpenRegisterDialog(plan: ProcurementPlan) {
    setSelectedPlan(plan);
    setDialogType("open");
  }

  function openClosedRegisterDialog(plan: ProcurementPlan) {
    setSelectedPlan(plan);
    setDialogType("closed");
  }

  function openDeleteDialog(plan: ProcurementPlan) {
    setSelectedPlan(plan);
    setDialogType("delete");
  }

  function closeDialog() {
    setDialogType(null);
    setSelectedPlan(null);
  }

  const filteredPlans = procurementPlans.filter(
    (plan) =>
      (!selectedStatus || plan.status === selectedStatus) &&
      (!search || plan.title.toLowerCase().includes(search.toLowerCase()))
  );

  // Reset về trang 1 khi thay đổi filter hoặc search
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedStatus, search]);

  const totalPages = Math.ceil(filteredPlans.length / pageSize);
  const pagedPlans = filteredPlans.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const statusCounts = procurementPlans.reduce<
    Record<ProcurementPlanStatusValue, number>
  >(
    (acc, plan) => {
      const status = plan.status as ProcurementPlanStatusValue;
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    },
    {
      Open: 0,
      Closed: 0,
      Draft: 0,
      Cancelled: 0,
    }
  );

  return (
    <div className='flex bg-amber-200-50 p-6 gap-6'>
      {/* Sidebar */}
      <aside className='w-64 space-y-4'>
        {/* Search block */}
        <div className='bg-white rounded-xl shadow-sm p-4 space-y-4'>
          <h2 className='text-sm font-medium text-gray-700'>
            Tìm kiếm kế hoạch thu mua
          </h2>
          <div className='relative'>
            <Input
              placeholder='Tìm kiếm...'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className='pr-10'
            />
            <Search className='absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
          </div>
          {/* <div className='flex justify-end text-sm'>
            <Button className='w-full bg-[#FD7622] hover:bg-[#d74f0f] text-white font-medium text-sm'>
              Search
            </Button>
          </div> */}
        </div>

        <FilterStatusPanel<ProcurementPlanStatusValue>
          selectedStatus={selectedStatus}
          setSelectedStatus={setSelectedStatus}
          statusCounts={statusCounts}
          statusMap={ProcurementPlanStatusMap}
        />
      </aside>

      {/* Main content */}
      <main className='flex-1 space-y-6'>
        <div className='bg-white rounded-xl shadow-sm p-4'>
          <div className='flex justify-end mb-4'>
            <Button
              onClick={() =>
                router.push("/dashboard/manager/procurement-plans/create")
              }
              //className='bg-[#FD7622] hover:bg-[#d74f0f] text-white font-medium text-sm cursor-pointer'
              variant='default'
            >
              + Tạo kế hoạch mới
            </Button>
          </div>
          {isLoading ? (
            <LoadingSpinner />
          ) : pagedPlans.length === 0 ? (
            <p className='text-center py-8 text-sm text-muted-foreground'>
              Không tìm thấy kế hoạch nào
            </p>
          ) : (
            <table className='w-full text-sm table-auto'>
              <thead className='bg-gray-100 text-gray-700 font-medium'>
                <tr>
                  <th className='px-4 py-3 text-left'>Tên kế hoạch</th>
                  <th className='px-4 py-3 text-left'>Tổng sản lượng</th>
                  <th className='px-4 py-3 text-left'>Tỷ lệ sản lượng đã được đăng ký</th>
                  <th className='px-4 py-3 text-left'>Trạng thái</th>
                  <th className='px-4 py-3 text-left'>
                    Ngày bắt đầu – kết thúc mở đơn
                  </th>
                  <th className='px-4 py-3 text-left'>Hành động</th>
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
                    openClosedRegisterDialog={() =>
                      openClosedRegisterDialog(plan)
                    }
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
              ? "Xác nhận mở quá trình nhận đơn đăng ký kế hoạch"
              : dialogType === "closed"
                ? "Xác nhận kết thúc quá trình nhận đơn đăng ký kế hoạch"
                : dialogType === "cancel"
                  ? "Xác nhận hủy kế hoạch"
                  : dialogType === "delete"
                    ? "Xác nhận xóa kế hoạch"
                    : ""
          }
          description={
            dialogType === "open" ? (
              <>
                Bạn có chắc chắn muốn mở quá trình nhận đơn đăng ký kế hoạch <b>{selectedPlan?.title}</b>?
                <br /> Kế hoạch sau khi được mở sẽ tự cập nhật lại thời gian mở đơn đăng ký và sẽ được hiển thị trên sàn thu mua cà phê. Nông hộ sẽ có thể đăng ký kế hoạch này.
                <br />
                <b>Lưu ý: Kế hoạch sau khi đã mở sẽ không thể chỉnh sửa được nữa.</b>
              </>
            ) : dialogType === "closed" ? (
              <>
                Bạn có chắc chắn muốn kết thúc quá trình nhận đơn đăng ký kế hoạch <b>{selectedPlan?.title}</b>?
                <br /> Kế hoạch sau khi kết thúc sẽ tự cập nhật lại thời gian kết thúc đơn đăng ký. Sau khi kết thúc, kế hoạch sẽ không còn hiển thị trên sàn thu mua cà phê và cũng không thể mở lại. Các cam kết đã được duyệt vẫn sẽ hoạt động bình thường.
                <br />
                <br />
                <b>Lưu ý: Kế hoạch có thể tự kết thúc sau khi đã đạt đủ sản lượng dựa trên các cam kết đã được duyệt từ hai phía.</b>
              </>
            ) : dialogType === "cancel" ? (
              <>
                Bạn có chắc chắn muốn hủy kế hoạch <b>{selectedPlan?.title}</b>?
                <br />
                Sau khi hủy, kế hoạch sẽ không còn hoạt động và bị gỡ khỏi sàn
                thu mua cà phê. Các nông hộ sẽ không thể đăng ký kế hoạch này được nữa. Kế hoạch cũng sẽ không thể mở lại được nữa.
              </>
            ) : dialogType === "delete" ? (
              <>
                Bạn có chắc chắn muốn xóa kế hoạch <b>{selectedPlan?.title}</b>?<br /> Hành động này không thể hoàn tác.
              </>
            ) : (
              ""
            )
          }
          confirmText='Xác nhận'
          cancelText='Hủy'
          loading={loadingConfirm}
          onConfirm={() => {
            if (dialogType === "open") {
              handleOpenRegister(selectedPlan?.planId);
            } else if (dialogType === "closed") {
              handleClose(selectedPlan?.planId);
            } else if (dialogType === "cancel") {
              handleCancel(selectedPlan?.planId);
            } else if (dialogType === "delete") {
              handleDelete(selectedPlan?.planId);
            }
          }}
        />

        {/* Pagination */}
        {!isLoading && totalPages > 1 && (
          <div className='flex justify-between items-center'>
            <span className='text-sm text-muted-foreground'>
              Hiển thị {(currentPage - 1) * pageSize + 1}–
              {Math.min(currentPage * pageSize, filteredPlans.length)} trong{" "}
              {filteredPlans.length} kế hoạch
            </span>
            <div className='flex items-center gap-2'>
              <Button
                variant='outline'
                size='icon'
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className='w-4 h-4' />
              </Button>
              {[...Array(totalPages).keys()].map((_, i) => {
                const page = i + 1;
                return (
                  <Button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={cn(
                      "rounded-md px-3 py-1 text-sm",
                      page === currentPage
                        ? "bg-black text-white"
                        : "bg-white text-black border"
                    )}
                  >
                    {page}
                  </Button>
                );
              })}
              <Button
                variant='outline'
                size='icon'
                disabled={currentPage === totalPages}
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
              >
                <ChevronRight className='w-4 h-4' />
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
