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
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        {breadcrumb ? <div className="mb-2">{breadcrumb}</div> : null}
        {label ? <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#15803D]">{label}</p> : null}
        <h1 className="mt-1 text-[24px] font-semibold leading-tight text-[#0F172A] sm:text-[30px]">{title}</h1>
        {description ? <p className="mt-2 max-w-2xl text-sm leading-6 text-[#64748B]">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-3">{actions}</div> : null}
    </div>
  );
}
