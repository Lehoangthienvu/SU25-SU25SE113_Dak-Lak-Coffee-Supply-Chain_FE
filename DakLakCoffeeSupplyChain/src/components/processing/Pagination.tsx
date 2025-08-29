"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages?: number; // để optional, tự tính từ totalItems nếu không truyền
  onPageChange: (page: number) => void;
  itemsPerPage?: number;
  totalItems: number;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage = 10,
  totalItems
}: PaginationProps) {
  const computedTotalPages =
    totalPages ?? Math.max(1, Math.ceil(totalItems / itemsPerPage));

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  if (computedTotalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50">
      <div className="text-sm text-gray-600">
        Hiển thị {startItem} đến {endItem} trong tổng số {totalItems} mục
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="flex items-center gap-1 border-orange-200 hover:bg-orange-50 hover:border-orange-300 transition-all duration-200"
        >
          <ChevronLeft className="w-4 h-4" />
          Trước
        </Button>

        {Array.from({ length: computedTotalPages }, (_, i) => i + 1).map(
          (page) => (
            <Button
              key={page}
              variant={page === currentPage ? "default" : "outline"}
              size="sm"
              onClick={() => onPageChange(page)}
              className={
                page === currentPage
                  ? "bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white transition-all duration-200"
                  : "border-orange-200 hover:bg-orange-50 hover:border-orange-300 transition-all duration-200"
              }
            >
              {page}
            </Button>
          )
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === computedTotalPages}
          className="flex items-center gap-1 border-orange-200 hover:bg-orange-50 hover:border-orange-300 transition-all duration-200"
        >
          Sau
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

// --- Helper cắt dữ liệu ---
function getPageItems<T>(items: T[], currentPage: number, itemsPerPage = 10) {
  const start = (currentPage - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return items.slice(start, end);
}

// --- Component sử dụng ---
export default function ListPage({ data }: { data: any[] }) {
  const [page, setPage] = useState(1);
  const perPage = 10;

  const totalItems = data.length;
  const totalPages = Math.ceil(totalItems / perPage);

  const pageItems = getPageItems(data, page, perPage);

  return (
    <div className="space-y-4">
      <ul className="grid gap-2">
        {pageItems.map((item, idx) => (
          <li key={item.id ?? idx} className="rounded-lg border p-3">
            {item.title ?? JSON.stringify(item)}
          </li>
        ))}
      </ul>

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
        itemsPerPage={perPage}
        totalItems={totalItems}
      />
    </div>
  );
}
