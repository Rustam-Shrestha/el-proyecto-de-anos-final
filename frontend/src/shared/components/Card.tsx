import type { HTMLAttributes, ReactNode } from "react";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  padding?: "none" | "sm" | "md" | "lg";
  children: ReactNode;
};

const paddings = {
  none: "",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

export default function Card({ padding = "md", className = "", children, ...props }: CardProps) {
  return (
    <div className={`rounded-[8px] border border-[#E2E8F0] bg-white shadow-subtle ${paddings[padding]} ${className}`} {...props}>
      {children}
    </div>
  );
}
