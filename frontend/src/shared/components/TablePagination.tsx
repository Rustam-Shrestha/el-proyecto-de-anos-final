import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@shared/components/Button";

type TablePaginationProps = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  /** Optional row range, e.g. "1–10 of 42". */
  summary?: string;
};

/** Footer shared by every paged DataTable. */
export function TablePagination({ page, totalPages, onPageChange, summary }: TablePaginationProps) {
  return (
    <div className="flex flex-col gap-3 border-t border-[#E2E8F0] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-[#64748B]">{summary ?? `Page ${page} of ${totalPages}`}</p>
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default TablePagination;
