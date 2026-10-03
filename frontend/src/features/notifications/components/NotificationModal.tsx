import { Modal } from "@shared/components/Modal";
import type { Notification } from "../api/notificationsApi";

const actionLabel = (type: string) => {
  if (type.includes("KYC")) return "View KYC Status";
  if (type.includes("PORTFOLIO")) return "View Portfolio";
  if (type.includes("LOAN")) return "View Loan Details";
  if (type.includes("DOCUMENT")) return "View Document";
  return "View Details";
};

type NotificationModalProps = {
  notification: Notification | null;
  onClose: () => void;
};

export const NotificationModal = ({ notification, onClose }: NotificationModalProps) => {
  if (!notification) return null;

  const metadata = notification.metadata ?? {};

  return (
    <Modal isOpen onClose={onClose} title={notification.title}>
      <div className="space-y-4">
        <p className="text-sm text-gray-600">{notification.message}</p>

        {notification.description && (
          <p className="text-sm text-gray-500">{notification.description}</p>
        )}

        {Object.keys(metadata).length > 0 && (
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Details
            </h3>
            <dl className="space-y-1.5 text-sm text-gray-600">
              {Object.entries(metadata).map(([key, value]) => (
                <div key={key} className="flex justify-between gap-4">
                  <dt className="font-medium capitalize">{key.replace(/([A-Z])/g, " $1").trim()}</dt>
                  <dd className="text-right text-gray-900">{String(value)}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          {notification.actionUrl ? (
            <a
              href={notification.actionUrl}
              className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              {actionLabel(notification.type)}
            </a>
          ) : (
            <span />
          )}
          <p className="text-xs text-gray-400">
            {new Date(notification.createdAt).toLocaleString()}
          </p>
        </div>
      </div>
    </Modal>
  );
};
