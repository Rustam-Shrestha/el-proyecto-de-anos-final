import type { ReactNode } from "react";

type PageHeaderProps = {
  label?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  breadcrumb?: ReactNode;
};

export default function PageHeader({ label, title, description, actions, breadcrumb }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
      <div className="min-w-0">
        {breadcrumb ? <div className="mb-1">{breadcrumb}</div> : null}
        {label ? <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--primary)]">{label}</p> : null}
        <h1 className="text-lg font-bold leading-tight text-gray-900 sm:text-xl">{title}</h1>
        {description ? <p className="mt-0.5 text-xs text-gray-500">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-3">{actions}</div> : null}
    </div>
  );
}
