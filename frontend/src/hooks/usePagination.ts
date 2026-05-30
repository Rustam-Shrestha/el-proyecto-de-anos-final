import { useState } from "react";

type UsePaginationOptions = {
  initialPage?: number;
  initialLimit?: number;
};

export const usePagination = ({ initialPage = 1, initialLimit = 10 }: UsePaginationOptions = {}) => {
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);

  const goToNextPage = (maxPage = Number.POSITIVE_INFINITY) => {
    setPage((current) => Math.min(maxPage, current + 1));
  };

  const goToPreviousPage = () => {
    setPage((current) => Math.max(1, current - 1));
  };

  return {
    page,
    limit,
    setPage,
    setLimit,
    goToNextPage,
    goToPreviousPage,
  };
};

export default usePagination;