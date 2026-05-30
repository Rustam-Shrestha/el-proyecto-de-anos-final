import { memo } from "react";
import { Plus } from "lucide-react";
import UsersList from "@features/users/components/UsersList";

const UsersPage = () => {
  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--green-icon)]">Users Management</p>
          <h2 className="mt-2 text-3xl font-semibold text-gray-900 dark:text-gray-100">Users Management</h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Browse the current user directory.</p>
        </div>

        <button
          type="button"
          disabled
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-200 px-4 py-2 text-sm font-medium text-gray-500 opacity-70 dark:bg-gray-800 dark:text-gray-400"
        >
          <Plus className="h-4 w-4" />
          Add User
        </button>
      </div>

      <UsersList />
    </section>
  );
};

export default memo(UsersPage);
