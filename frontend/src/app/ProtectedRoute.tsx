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

  const needsProfileHydration = isAuthenticated && (!userData?.id || !userData?.role);

  const meQuery = useQuery({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      const { data } = await apiClient.get<MeResponse>("/users/me");
      return data.data;
    },
    enabled: needsProfileHydration,
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (meQuery.data?.id) {
      const nextUser = {
        ...meQuery.data,
        role:
          typeof meQuery.data.role === "string"
            ? meQuery.data.role
            : meQuery.data.role?.name ?? userData?.role,
      };
      dispatch(setUser(nextUser));
    }
  }, [dispatch, meQuery.data, userData?.role]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (needsProfileHydration && meQuery.isLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg-color)] p-6">
        <SkeletonLoader count={3} type="list" />
      </div>
    );
  }

  if (needsProfileHydration && meQuery.isError) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};