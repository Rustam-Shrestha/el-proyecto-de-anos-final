import { useState, useId, type ReactNode } from "react";

type TooltipProps = {
  content: string;
  children: ReactNode;
};

export function Tooltip({ content, children }: TooltipProps) {
  const [open, setOpen] = useState(false);
  const id = useId();
  if (!content || content.length > 120) {
    // truncate to 120 per spec
    content = content.slice(0, 120);
  }
  return (
    <span
      style={{ position: "relative", display: "inline-flex" }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      <span aria-describedby={id} tabIndex={0} onKeyDown={(e) => e.key === "Escape" && setOpen(false)} style={{ cursor: "help" }}>
        {children}
      </span>
      {open && (
        <span
          id={id}
          role="tooltip"
          onClick={() => setOpen(false)}
          style={{
            position: "absolute",
            bottom: "100%",
            left: "50%",
            transform: "translateX(-50%)",
            background: "#111827",
            color: "#fff",
            fontSize: 12,
            padding: "6px 8px",
            borderRadius: 4,
            whiteSpace: "nowrap",
            zIndex: 1000,
            marginBottom: 6,
          }}
        >
          {content}
        </span>
      )}
    </span>
  );
}
export default Tooltip;
