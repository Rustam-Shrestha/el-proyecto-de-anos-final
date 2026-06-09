import { useEffect, type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { SkeletonLoader } from "@shared/components/SkeletonLoader";
import { apiClient } from "@shared/lib/apiClient";
import { useAppDispatch, useAppSelector } from "@hooks/reduxHooks";
import {
  selectIsAuthenticated,
  selectUserData,
  setUser,
} from "@store/slices/authSlice";

type ProtectedRouteProps = {
  children: ReactNode;
  requiredRoles?: string[];
};

type MeResponse = {
  data?: {
    id?: string;
    email?: string;
    role?: string;
    permissions?: string[];
    isSuperUser?: boolean;
  };
};

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const userData = useAppSelector(selectUserData);

  const meQuery = useQuery({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      const { data } = await apiClient.get<MeResponse>("/users/me");
      return data.data;
    },
    enabled: isAuthenticated && !userData?.id,
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (meQuery.data?.id) {
      dispatch(setUser(meQuery.data));
    }
  }, [dispatch, meQuery.data]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (meQuery.isLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg-color)] p-6">
        <SkeletonLoader count={3} type="list" />
      </div>
    );
  }

  if (meQuery.isError) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};