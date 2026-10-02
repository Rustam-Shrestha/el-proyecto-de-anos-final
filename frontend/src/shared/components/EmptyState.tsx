import type { ReactNode } from "react";
import { Button } from "./Button";

type Props = {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: ReactNode;
};

export default function EmptyState({ title, description, actionLabel, onAction, icon }: Props) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[8px] border border-dashed border-[#CBD5E1] bg-white px-6 py-10 text-center">
      {icon ? <div className="mb-3 text-[#94A3B8]">{icon}</div> : null}
      <p className="text-sm font-semibold text-[#0F172A]">{title}</p>
      {description ? <p className="mt-1 max-w-md text-sm text-[#64748B]">{description}</p> : null}
      {actionLabel && onAction ? <Button className="mt-4" onClick={onAction}>{actionLabel}</Button> : null}
    </div>
  );
}
