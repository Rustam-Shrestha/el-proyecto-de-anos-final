import { useState, useRef, useEffect } from "react";
import { Bell, Eye, Trash2, CheckCheck } from "lucide-react";
import {
  useNotifications,
  useMarkAsRead,
  useMarkAllAsRead,
  useDeleteNotification,
  type Notification,
} from "../api/notificationsApi";
import { NotificationModal } from "./NotificationModal";

const getTypeIcon = (type: string) => {
  if (type.includes("KYC")) return "🆔";
  if (type.includes("PORTFOLIO")) return "💼";
  if (type.includes("LOAN")) return "💰";
  if (type.includes("DOCUMENT")) return "📄";
  return "📢";
};

const priorityClasses: Record<string, string> = {
  CRITICAL: "border-l-4 border-red-500",
  HIGH: "border-l-4 border-orange-500",
  NORMAL: "border-l-4 border-blue-500",
  LOW: "border-l-4 border-gray-300",
};

const timeAgo = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

export const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState<Notification | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data, isFetching } = useNotifications();
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();
  const deleteNotification = useDeleteNotification();

  const notifications = data?.notifications ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  useEffect(() => {
    const handleClick = (event: globalThis.MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as globalThis.Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const openDetails = (notification: Notification) => {
    setSelected(notification);
    setIsOpen(false);
    if (notification.status === "UNREAD") {
      markAsRead.mutate(notification.id);
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 text-gray-700 transition-colors hover:bg-gray-100"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-xs font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-12 w-96 max-w-[calc(100vw-2rem)] rounded-2xl border border-gray-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
              {isFetching && <p className="text-xs text-gray-400">Refreshing…</p>}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markAllAsRead.mutate()}
                className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-gray-500">
              No notifications yet
            </div>
          ) : (
            <div className="max-h-80 divide-y divide-gray-100 overflow-y-auto">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`flex items-start gap-3 bg-white px-4 py-3 transition-colors hover:bg-gray-50 ${priorityClasses[notification.priority] ?? ""}`}
                >
                  <span className="mt-0.5 text-xl">{getTypeIcon(notification.type)}</span>
                  <button
                    type="button"
                    onClick={() => openDetails(notification)}
                    className="flex-1 text-left"
                  >
                    <h4 className="text-sm font-semibold text-gray-900">{notification.title}</h4>
                    <p className="mt-0.5 line-clamp-2 text-xs text-gray-600">{notification.message}</p>
                    <p className="mt-1 text-[11px] text-gray-400">{timeAgo(notification.createdAt)}</p>
                  </button>
                  <div className="flex items-center gap-1">
                    {notification.status === "UNREAD" && (
                      <button
                        type="button"
                        onClick={() => markAsRead.mutate(notification.id)}
                        className="rounded-md p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
                        title="Mark as read"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => deleteNotification.mutate(notification.id)}
                      className="rounded-md p-1 text-gray-400 hover:bg-red-100 hover:text-red-600"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <NotificationModal
        notification={selected}
        onClose={() => setSelected(null)}
      />
    </div>
  );
};
