// @ts-nocheck
import { memo, useMemo, useState, type ChangeEvent } from "react";
import { Link } from "react-router-dom";
import InputField from "@components/common/InputField";
import Modal from "@components/common/Modal";
import { PrimaryButton } from "@components/common/Button";
import TableView from "@components/common/TableView";
import useAuth from "@hooks/useAuth";
import { Users, FileText, CreditCard } from "lucide-react";

const DashboardPage = () => {
  const [showModal, setShowModal] = useState(false);
  const [query, setQuery] = useState<string>("");
  const { userData } = useAuth();

  const rows = useMemo(
    () => [
      { id: 1, name: "Admin User", email: "admin@example.com", role: "admin" },
      { id: 2, name: "Manager User", email: "manager@example.com", role: "manager" },
      { id: 3, name: "Staff User", email: "staff@example.com", role: "staff" }
    ],
    []
  );

  const filteredRows = rows.filter((row) => {
    const text = query.toLowerCase();
    return row.name.toLowerCase().includes(text) || row.email.toLowerCase().includes(text);
  });

  const quickLinks = [
    { label: "Admin Dashboard", to: "/dashboard/admin", description: "System overview for admins" },
    { label: "Users", to: "/dashboard/users", description: "Manage users and access" },
    { label: "KYC", to: "/dashboard/kyc", description: "Review KYC applications" },
    { label: "Submit KYC", to: "/dashboard/kyc-submit", description: "Start a new submission" },
    { label: "KYC Status", to: "/dashboard/kyc-status", description: "Check application status" },
    { label: "Profile", to: "/dashboard/profile", description: "Update your account" },
    { label: "Reports", to: "/dashboard/reports", description: "Open reporting views" },
    { label: "User Access", to: "/dashboard/users", description: "Assign or review access" },
  ];

  return (
    <section className="space-y-6">
        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <p className="text-sm font-medium uppercase tracking-[0.22em] text-[var(--green-icon)]">Overview</p>
          <h2 className="mt-2 text-3xl font-semibold text-gray-900 dark:text-gray-100">
            Welcome, {userData?.email || "User"}
          </h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Dashboard</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[
            { label: "Total Users", value: "—", icon: Users },
            { label: "KYC Applications", value: "—", icon: FileText },
            { label: "Revenue", value: "—", icon: CreditCard },
          ].map((card) => {
            const Icon = card.icon;
            return (
              <article
                key={card.label}
                className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{card.label}</p>
                    <p className="mt-3 text-3xl font-semibold text-gray-900 dark:text-gray-100">{card.value}</p>
                  </div>
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--green-footer)] text-[var(--green-background)] dark:bg-gray-800 dark:text-gray-100">
                    <Icon className="h-5 w-5" />
                  </span>
                </div>
              </article>
            );
          })}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Recent Activity</h3>
            <div className="mt-4 space-y-3 text-sm text-gray-500 dark:text-gray-400">
              <p>No activity yet.</p>
            </div>
          </section>

          <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Quick Actions</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Jump to the pages that already exist in the router.</p>
              </div>
              <PrimaryButton label="Add User" onClick={() => setShowModal(true)} />
            </div>
            <div className="mt-4">
              <InputField
                name="search"
                label="Search"
                placeholder="Search by name or email"
                value={query}
                onChange={(event: ChangeEvent<HTMLInputElement>) => setQuery(event.target.value)}
              />
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {quickLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-left transition-colors hover:border-[var(--green-icon)] hover:bg-white dark:border-gray-800 dark:bg-gray-950 dark:hover:bg-gray-800"
                >
                  <span className="block text-sm font-semibold text-gray-900 dark:text-gray-100">{link.label}</span>
                  <span className="mt-1 block text-xs text-gray-500 dark:text-gray-400">{link.description}</span>
                </Link>
              ))}
            </div>
          </section>
        </div>

        <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Users Snapshot</h3>
            <Link to="/dashboard/users" className="text-sm font-medium text-primary underline-offset-4 hover:underline">
              User Access
            </Link>
          </div>

          <TableView
            columns={[
              { accessor: "id", label: "#", width: 2 },
              { accessor: "name", label: "Name", width: 8 },
              { accessor: "email", label: "Email", width: 8 },
              { accessor: "role", label: "Role", width: 6 }
            ]}
            rows={filteredRows}
            totalCount={filteredRows.length}
            currentPage={1}
            pageSize={10}
            onPageChange={() => {}}
            onFilterChange={() => {}}
            loading={false}
          />
        </section>

        {showModal && (
          <Modal title="Create ERP User" size="md" onClose={() => setShowModal(false)}>
            <div className="grid gap-3">
              <InputField name="name" label="Name" placeholder="Full name" value="" onChange={() => {}} />
              <InputField name="email" label="Email" placeholder="Email" value="" onChange={() => {}} />
              <div className="flex justify-end">
                <PrimaryButton label="Save" onClick={() => setShowModal(false)} />
              </div>
            </div>
          </Modal>
        )}
    </section>
  );
};

export default memo(DashboardPage);
