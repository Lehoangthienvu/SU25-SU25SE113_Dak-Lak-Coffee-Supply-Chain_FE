"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { cn, getErrorMessage } from "@/lib/utils";
import {
  FarmingCommitment,
  getBusinessCommitments,
} from "@/lib/api/farmingCommitments";
import {
  FarmingCommitmentStatusValue,
  getFarmingCommitmentStatusMap,
} from "@/lib/constants/FarmingCommitmentStatus";
import FilterStatusPanel from "@/components/ui/filterStatusPanel";
import FarmingCommitmentCard from "@/components/farming-commitments/FarmingCommitmentCard";
import { useTranslation } from "react-i18next";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function BusinessFarmingCommitmentPage() {
  const { t } = useTranslation();
  const [farmingCommitments, setFarmingCommitments] = useState<
    FarmingCommitment[]
  >([]);
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] =
    useState<FarmingCommitmentStatusValue | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    const data = await getBusinessCommitments().catch((error) => {
      console.error(getErrorMessage(error));
      return [];
    });
    setFarmingCommitments(data);
    setIsLoading(false);
  };

  const filteredCommitments = farmingCommitments.filter(
    (commitment) =>
      (!selectedStatus || commitment.status === selectedStatus) &&
      (!search ||
        commitment.commitmentName.toLowerCase().includes(search.toLowerCase()))
  );

  const totalPages = Math.ceil(filteredCommitments.length / pageSize);
  const pagedCommitments = filteredCommitments.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const statusMap = getFarmingCommitmentStatusMap(t);
  const statusCounts = farmingCommitments.reduce<
    Record<FarmingCommitmentStatusValue, number>
  >(
    (acc, commitment) => {
      const status = commitment.status as FarmingCommitmentStatusValue;
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    },
    {
      Pending: 0,
      Active: 0,
      Completed: 0,
      Cancelled: 0,
      Breached: 0,
      Rejected: 0,
    }
  );

  return (
    <div className='flex bg-amber-200-50 p-6 gap-6'>
      {/* Sidebar */}
      <aside className='w-64 space-y-4'>
        {/* Search block */}
        <div className='bg-white rounded-xl shadow-sm p-4 space-y-4'>
          <h2 className='text-sm font-medium text-gray-700'>
            {t("farmingCommitment.pages.list.search.title")}
          </h2>
          <div className='relative'>
            <Input
              placeholder={t("farmingCommitment.pages.list.search.placeholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className='pr-10'
            />
            <Search className='absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
          </div>
        </div>

        <FilterStatusPanel<FarmingCommitmentStatusValue>
          selectedStatus={selectedStatus}
          setSelectedStatus={setSelectedStatus}
          statusCounts={statusCounts}
          statusMap={statusMap}
        />
      </aside>

      {/* Main content */}
      <main className='flex-1 space-y-6'>
        <div className='bg-white rounded-xl shadow-sm p-4'>
          <div className='flex justify-between items-center mb-4'>
            <h1 className='text-xl font-semibold text-gray-900'>
              {t("farmingCommitment.pages.list.title")}
            </h1>
          </div>

          {isLoading ? (
            <LoadingSpinner />
          ) : pagedCommitments.length === 0 ? (
            <p className='text-center py-8 text-sm text-muted-foreground'>
              {t("farmingCommitment.pages.list.table.noData")}
            </p>
          ) : (
            <table className='w-full text-sm table-auto'>
              <thead className='bg-gray-100 text-gray-700 font-medium'>
                <tr>
                  <th className='px-4 py-3 text-left'>
                    {t(
                      "farmingCommitment.pages.list.table.headers.commitmentName"
                    )}
                  </th>
                  <th className='px-4 py-3 text-left'>
                    {t("farmingCommitment.pages.list.table.headers.farmerName")}
                  </th>
                  <th className='px-4 py-3 text-left'>
                    {t("farmingCommitment.pages.list.table.headers.totalPrice")}
                  </th>
                  <th className='px-4 py-3 text-left'>
                    {t("farmingCommitment.pages.list.table.headers.status")}
                  </th>
                  <th className='px-4 py-3 text-left'>
                    {t(
                      "farmingCommitment.pages.list.table.headers.commitmentDate"
                    )}
                  </th>
                  <th className='px-4 py-3 text-left'>
                    {t("farmingCommitment.pages.list.table.headers.actions")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {pagedCommitments.map((commitment) => (
                  <FarmingCommitmentCard
                    key={commitment.commitmentId}
                    commitment={commitment}
                    statusMap={statusMap}
                  />
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {!isLoading && totalPages > 1 && (
          <div className='flex justify-between items-center'>
            <span className='text-sm text-muted-foreground'>
              {t("farmingCommitment.pages.list.pagination.showing")}{" "}
              {(currentPage - 1) * pageSize + 1}–
              {Math.min(currentPage * pageSize, filteredCommitments.length)}{" "}
              {t("farmingCommitment.pages.list.pagination.of")}{" "}
              {filteredCommitments.length}{" "}
              {t("farmingCommitment.pages.list.pagination.commitments")}
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
