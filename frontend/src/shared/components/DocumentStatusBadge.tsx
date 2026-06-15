type DocumentBadgeStatus = "PENDING" | "VERIFIED" | "REJECTED" | "MANUAL_REVIEW" | "PROCESSING";

interface DocumentStatusBadgeProps {
  status: DocumentBadgeStatus;
}

const statusConfig: Record<DocumentBadgeStatus, { label: string; bg: string; text: string }> = {
  PENDING: { label: "Pending", bg: "bg-yellow-100", text: "text-yellow-800" },
  VERIFIED: { label: "Verified", bg: "bg-green-100", text: "text-green-800" },
  REJECTED: { label: "Rejected", bg: "bg-red-100", text: "text-red-800" },
  MANUAL_REVIEW: { label: "Manual Review", bg: "bg-orange-100", text: "text-orange-800" },
  PROCESSING: { label: "Processing", bg: "bg-blue-100", text: "text-blue-800" },
};

export const DocumentStatusBadge = ({ status }: DocumentStatusBadgeProps) => {
  const config = statusConfig[status];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${config.bg} ${config.text}`}
    >
      {config.label}
    </span>
  );
};

DocumentStatusBadge.displayName = "DocumentStatusBadge";

export default DocumentStatusBadge;
