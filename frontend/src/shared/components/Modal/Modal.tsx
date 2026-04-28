import { memo, PropsWithChildren } from "react";

type ModalSize = "sm" | "md" | "lg" | "xl" | "2xl" | "full";

type ModalProps = PropsWithChildren<{
  title: string;
  open: boolean;
  onClose: () => void;
  description?: string;
  size?: ModalSize;
}>;

const sizeMap: Record<ModalSize, { width: string; maxHeight: string }> = {
  sm: { width: "min(95vw, 500px)", maxHeight: "90vh" },
  md: { width: "min(95vw, 650px)", maxHeight: "90vh" },
  lg: { width: "min(95vw, 800px)", maxHeight: "92vh" },
  xl: { width: "min(95vw, 1000px)", maxHeight: "92vh" },
  "2xl": { width: "min(95vw, 1200px)", maxHeight: "94vh" },
  full: { width: "calc(100vw - 2%)", maxHeight: "calc(100vh - 2%)" }
};

export const Modal = memo(({ title, open, onClose, description, size = "xl", children }: ModalProps) => {
  if (!open) {
    return null;
  }

  const selectedSize = sizeMap[size];

  return (
    <div data-testid="modal-overlay" className="modal-overlay" role="dialog" aria-modal="true">
      <div
        className="modal-card"
        style={{
          maxWidth: selectedSize.width,
          maxHeight: selectedSize.maxHeight,
          width: "100%"
        }}
      >
        <div className="modal-head">
          <div>
            <h3>{title}</h3>
            {description ? <p className="modal-description">{description}</p> : null}
          </div>
          <button onClick={onClose} aria-label="Close modal" type="button">
            X
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
});
