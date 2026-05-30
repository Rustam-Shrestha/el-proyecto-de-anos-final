import { useMemo } from "react";
import { useUsersList as useUsersListQuery } from "@features/users/api/usersApi";
import { usePagination } from "@hooks/usePagination";

type UseUsersListOptions = {
  initialPage?: number;
  initialLimit?: number;
};

export const useUsersList = ({ initialPage = 1, initialLimit = 10 }: UseUsersListOptions = {}) => {
  const pagination = usePagination({ initialPage, initialLimit });
  const usersQuery = useUsersListQuery(pagination.page, pagination.limit);

  const totalPages = useMemo(() => {
    const total = usersQuery.data?.total ?? 0;
    return Math.max(1, Math.ceil(total / pagination.limit));
  }, [pagination.limit, usersQuery.data?.total]);

  return {
    users: usersQuery.data?.users ?? [],
    isLoading: usersQuery.isLoading,
    error: usersQuery.error,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      totalPages,
      setPage: pagination.setPage,
      setLimit: pagination.setLimit,
      goToNextPage: () => pagination.goToNextPage(totalPages),
      goToPreviousPage: pagination.goToPreviousPage,
      canGoNext: pagination.page < totalPages,
      canGoPrevious: pagination.page > 1,
    },
    refetch: usersQuery.refetch,
  };
};

export default useUsersList;