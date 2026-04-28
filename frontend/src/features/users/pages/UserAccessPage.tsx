import { FormEvent, useMemo, useState } from "react";
import { useCreateUser, useUsers } from "@features/users/hooks/useUsers";
import { Modal } from "@shared/components/Modal/Modal";

type RoleOption = "admin" | "manager" | "staff";

const roleOptions: RoleOption[] = ["admin", "manager", "staff"];

const UserAccessPage = () => {
  const [page, setPage] = useState(1);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [form, setForm] = useState({ email: "", role: "staff" as RoleOption });

  const usersQuery = useUsers(page, 10);
  const createUserMutation = useCreateUser();

  const totalPages = useMemo(() => {
    const total = usersQuery.data?.total ?? 0;
    return Math.max(1, Math.ceil(total / 10));
  }, [usersQuery.data?.total]);

  const openCreate = () => setIsCreateOpen(true);

  const closeCreate = () => {
    setIsCreateOpen(false);
    setForm({ email: "", role: "staff" });
  };

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await createUserMutation.mutateAsync({ email: form.email.trim(), role: form.role });
    closeCreate();
  };

  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <h2 className="text-xl font-semibold">User Access</h2>
          <p className="text-sm text-slate-600">Admin-only access to create and review users.</p>
        </div>
        <button type="button" onClick={openCreate}>
          Add User
        </button>
      </div>

      {usersQuery.isLoading ? <p className="mt-4">Loading users...</p> : null}
      {usersQuery.error ? <p className="mt-4 text-red-600">Failed to load users.</p> : null}

      {!usersQuery.isLoading && !usersQuery.error ? (
        <div className="mt-4 overflow-x-auto rounded-md border border-slate-200">
          <table className="min-w-full bg-white">
            <thead className="bg-slate-100 text-left text-sm">
              <tr>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
              </tr>
            </thead>
            <tbody>
              {usersQuery.data?.data.map((user) => (
                <tr key={user.id} className="border-t border-slate-100 text-sm">
                  <td className="px-4 py-3">{user.email}</td>
                  <td className="px-4 py-3 capitalize">{user.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <div className="mt-4 flex items-center justify-end gap-2">
        <button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page <= 1}>
          Prev
        </button>
        <span className="text-sm text-slate-600">
          Page {page} of {totalPages}
        </span>
        <button
          type="button"
          onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
          disabled={page >= totalPages}
        >
          Next
        </button>
      </div>

      <Modal
        open={isCreateOpen}
        onClose={closeCreate}
        size="md"
        title="Create User Access"
        description="Create a new user with a role."
      >
        <form className="mt-4 grid gap-3" onSubmit={handleCreate}>
          <label className="grid gap-1 text-sm">
            Email
            <input
              type="email"
              required
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              placeholder="new.user@example.com"
              className="rounded border border-slate-300 px-3 py-2"
            />
          </label>

          <label className="grid gap-1 text-sm">
            Role
            <select
              value={form.role}
              onChange={(event) => setForm((current) => ({ ...current, role: event.target.value as RoleOption }))}
              className="rounded border border-slate-300 px-3 py-2"
            >
              {roleOptions.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </label>

          {createUserMutation.isError ? (
            <p className="text-sm text-red-600">Failed to create user. Check if the email already exists.</p>
          ) : null}

          <div className="mt-1 flex justify-end gap-2">
            <button type="button" onClick={closeCreate}>
              Cancel
            </button>
            <button type="submit" disabled={createUserMutation.isPending}>
              {createUserMutation.isPending ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </Modal>
    </section>
  );
};

export default UserAccessPage;
