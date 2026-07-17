import { memo, useMemo, useState } from "react";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  PencilLine,
  RefreshCcw,
  Trash2,
} from "lucide-react";
import { SkeletonLoader } from "@shared/components/SkeletonLoader";
import { Button } from "@shared/components/Button";
import { useAppSelector } from "@hooks/reduxHooks";
import { selectUserData } from "@store/slices/authSlice";
import { useUsersList } from "@features/users/api/usersApi";
import { usePagination } from "@hooks/usePagination";
import { useModal } from "@shared/hooks/useModal";
import DeleteUserModal from "@features/users/components/DeleteUserModal";
import type { User } from "@shared/types/common";

type UsersListProps = {
  onEdit: (id: string) => void;
};

const formatDate = (value?: string) => {
  if (!value) return "--";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "--"
    : new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(date);
};

const extractRoleName = (role: unknown): string => {
  if (typeof role === "string") return role;
  if (role && typeof role === "object" && "name" in role) return String((role as { name: string }).name);
  return "UNKNOWN";
};

const roleBadge = (role: unknown) => {
  const roleName = extractRoleName(role);
  const styles: Record<string, string> = {
    ADMIN: "bg-purple-100 text-purple-800",
    REVIEWER: "bg-blue-100 text-blue-800",
    USER: "bg-green-100 text-green-800",
  };
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
        styles[roleName] || "bg-gray-100 text-gray-800"
      }`}
    >
      {roleName}
    </span>
  );
};

const UsersList = memo(({ onEdit }: UsersListProps) => {
  const { page, limit, goToNextPage, goToPreviousPage } = usePagination();
  const { data, isLoading, error, refetch } = useUsersList(page, limit);
  const userData = useAppSelector(selectUserData);
  const deleteModal = useModal();
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const isAdmin = userData?.role === "ADMIN" || userData?.isSuperUser === true;

  const users = data?.users ?? [];
  const total = data?.total ?? 0;
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / limit)),
    [total, limit]
  );

  const handleDeleteClick = (user: User) => {
    setUserToDelete(user);
    deleteModal.openModal();
  };

  const handleDeleteSuccess = () => {
    deleteModal.closeModal();
    setUserToDelete(null);
  };

  const handleDeleteCancel = () => {
    deleteModal.closeModal();
    setUserToDelete(null);
  };

  if (isLoading) {
    return <SkeletonLoader count={6} type="table" />;
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-red-200 bg-danger-50 p-6 text-red-800">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold">Failed to load users</h3>
            <p className="mt-1 text-sm opacity-90">Please try again.</p>
            <Button
              variant="danger"
              size="sm"
              onClick={() => refetch()}
              className="mt-4"
            >
              <RefreshCcw className="h-4 w-4" />
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!users.length) {
    return (
      <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-500 shadow-sm   ">
        <p className="text-base font-medium text-gray-900 ">
          No users found
        </p>
        <p className="mt-2 text-sm">Try a different page or refresh later.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm  ">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 ">
          <thead className="bg-gray-50 ">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 ">
                Email
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 ">
                Role
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 ">
                Status
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 ">
                Created At
              </th>
              {isAdmin && (
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700 ">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 ">
            {users.map((user) => (
              <tr
                key={user.id}
                className="transition-colors hover:bg-gray-50 :bg-gray-800/60"
              >
                <td className="px-6 py-4 text-sm text-gray-900 ">
                  {user.email}
                </td>
                <td className="px-6 py-4">{roleBadge(user.role)}</td>
                <td className="px-6 py-4 text-sm text-gray-600 ">
                  {user.isVerified ? "Verified" : "Unverified"}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600 ">
                  {formatDate(user.createdAt)}
                </td>
                {isAdmin && (
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => onEdit(user.id)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-blue-200 text-blue-600 transition-colors hover:bg-blue-50   :bg-blue-950/40"
                        aria-label={`Edit ${user.email}`}
                      >
                        <PencilLine className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteClick(user)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-red-200 text-red-600 transition-colors hover:bg-danger-50"
                        aria-label={`Delete ${user.email}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 border-t border-gray-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between ">
        <p className="text-sm text-gray-500 ">
          Page {page} of {totalPages}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={goToPreviousPage}
            disabled={page <= 1}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50   :bg-gray-800"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </button>
          <button
            type="button"
            onClick={() => goToNextPage(totalPages)}
            disabled={page >= totalPages}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50   :bg-gray-800"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <DeleteUserModal
        isOpen={deleteModal.isOpen}
        user={userToDelete}
        onSuccess={handleDeleteSuccess}
        onCancel={handleDeleteCancel}
      />
    </div>
  );
});

UsersList.displayName = "UsersList";

export default UsersList;
