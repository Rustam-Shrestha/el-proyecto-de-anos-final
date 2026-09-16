import { memo, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, PencilLine, Trash2 } from "lucide-react";
import { SkeletonLoader } from "@shared/components/SkeletonLoader";
import { Button } from "@shared/components/Button";
import { ExportBar } from "@shared/components/export/ExportBar";
import { useAppSelector } from "@hooks/reduxHooks";
import { selectUserData } from "@store/slices/authSlice";
import { useUsersList } from "@features/users/api/usersApi";
import { usePagination } from "@hooks/usePagination";
import { useModal } from "@shared/hooks/useModal";
import DeleteUserModal from "@features/users/components/DeleteUserModal";
import type { User } from "@shared/types/common";
import ErrorState from "@shared/components/ErrorState";
import EmptyState from "@shared/components/EmptyState";
import Card from "@shared/components/Card";
import StatusBadge from "@shared/components/StatusBadge";

const formatDate = (value?: string) => {
  if (!value) return "--";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "--" : new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(date);
};
const extractRoleName = (role: unknown): string => {
  if (typeof role === "string") return role;
  if (role && typeof role === "object" && "name" in role) return String((role as { name: string }).name);
  return "UNKNOWN";
};

const UsersList = memo(({ onEdit }: { onEdit: (id: string) => void }) => {
  const { page, limit, goToNextPage, goToPreviousPage } = usePagination();
  const { data, isLoading, error, refetch } = useUsersList(page, limit);
  const userData = useAppSelector(selectUserData);
  const deleteModal = useModal();
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const isAdmin = userData?.role === "ADMIN" || userData?.isSuperUser === true;
  const users = data?.users ?? [];
  const total = data?.total ?? 0;
  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total, limit]);

  if (isLoading) return <SkeletonLoader count={6} type="table" />;
  if (error) return <ErrorState message="Failed to load users" onRetry={() => refetch()} />;
  if (!users.length) return <EmptyState title="No users found" description="Try a different page or refresh later." />;

  const userColumns = [
    { key: 'email', header: 'Email' },
    { key: 'role', header: 'Role', accessor: (r: User) => extractRoleName(r.role as unknown) },
    { key: 'isVerified', header: 'Status', accessor: (r: User) => r.isVerified ? 'Verified' : 'Unverified' },
    { key: 'createdAt', header: 'Created At', accessor: (r: User) => formatDate(r.createdAt) },
  ] as const;

  return (
    <Card padding="none" className="overflow-hidden">
      <div className="flex justify-end p-3 border-b border-[#E2E8F0] bg-white">
        <ExportBar data={users as unknown as Record<string, unknown>[]} columns={userColumns as unknown as Array<{ key: string; header: string; accessor?: (r: Record<string, unknown>) => string | number }>} filename={`users-${new Date().toISOString().slice(0,10)}`} />
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
            <tr>
              <th className="px-4 py-3 text-left text-[13px] font-semibold text-[#0F172A]">Email</th>
              <th className="px-4 py-3 text-left text-[13px] font-semibold text-[#0F172A]">Role</th>
              <th className="px-4 py-3 text-left text-[13px] font-semibold text-[#0F172A]">Status</th>
              <th className="px-4 py-3 text-left text-[13px] font-semibold text-[#0F172A]">Created At</th>
              {isAdmin && <th className="px-4 py-3 text-right text-[13px] font-semibold text-[#0F172A]">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0]">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-[#F8FAFC]">
                <td className="px-4 py-3 text-sm text-[#0F172A]">{user.email}</td>
                <td className="px-4 py-3"><StatusBadge status={extractRoleName(user.role)} tone={extractRoleName(user.role)==="ADMIN"?"info":extractRoleName(user.role)==="REVIEWER"?"pending":"success"} /></td>
                <td className="px-4 py-3 text-sm text-[#64748B]">{user.isVerified ? "Verified" : "Unverified"}</td>
                <td className="px-4 py-3 text-sm text-[#64748B]">{formatDate(user.createdAt)}</td>
                {isAdmin && (
                  <td className="px-4 py-3"><div className="flex justify-end gap-1">
                    <Button variant="ghost" size="sm" aria-label={`Edit ${user.email}`} onClick={() => onEdit(user.id)} className="h-8 w-8 p-0"><PencilLine className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm" aria-label={`Delete ${user.email}`} onClick={() => { setUserToDelete(user); deleteModal.openModal(); }} className="h-8 w-8 p-0 text-[#DC2626] hover:bg-[#FEE2E2]"><Trash2 className="h-4 w-4" /></Button>
                  </div></td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-col gap-3 border-t border-[#E2E8F0] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-[#64748B]">Page {page} of {totalPages}</p>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={goToPreviousPage} disabled={page <= 1}><ChevronLeft className="h-4 w-4" />Previous</Button>
          <Button variant="secondary" size="sm" onClick={() => goToNextPage(totalPages)} disabled={page >= totalPages}>Next<ChevronRight className="h-4 w-4" /></Button>
        </div>
      </div>
      <DeleteUserModal isOpen={deleteModal.isOpen} user={userToDelete} onSuccess={() => { deleteModal.closeModal(); setUserToDelete(null); }} onCancel={() => { deleteModal.closeModal(); setUserToDelete(null); }} />
    </Card>
  );
});
UsersList.displayName = "UsersList";
export default UsersList;
