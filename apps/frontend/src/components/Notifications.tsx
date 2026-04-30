import { useEffect, useState, useRef, useCallback } from "react";
import { useAuth } from "@clerk/clerk-react";
import {
  Bell,
  X,
  Info,
  AlertTriangle,
  CreditCard,
  TrendingUp,
  Gift,
  Trash2,
} from "lucide-react";
import { NotiButton } from "@/components/ui/notiButton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scrollarea";

interface Notification {
  id: string;
  title: string;
  message: string;
  date: string;
  icon: string;
  color: string;
  read: boolean;
}

const iconMap: Record<string, React.ElementType> = {
  Info,
  AlertTriangle,
  CreditCard,
  TrendingUp,
  Gift,
};

const API_BASE = import.meta.env.VITE_API_URL;
const POLL_INTERVAL = 30_000; // 30 seconds

export function Notifications() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [count, setCount] = useState(0);
  const { getToken } = useAuth();
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch notifications via HTTP
  const fetchNotifications = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return;

      const res = await fetch(`${API_BASE}/api/user/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;

      const data = await res.json();
      if (data.notifications) {
        setNotifications(data.notifications);
        setCount(data.unreadCount ?? data.notifications.filter((n: Notification) => !n.read).length);
      }
    } catch (e) {
      console.error("Error fetching notifications:", e);
    }
  }, [getToken]);

  // Initial fetch + polling for unread count
  useEffect(() => {
    fetchNotifications();

    pollRef.current = setInterval(fetchNotifications, POLL_INTERVAL);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchNotifications]);

  const handleClick = async () => {
    const newIsOpen = !isOpen;
    setIsOpen(newIsOpen);

    if (newIsOpen) {
      // Refresh notifications when opening
      await fetchNotifications();

      if (count > 0) {
        try {
          const token = await getToken();
          if (!token) return;

          const patchRes = await fetch(`${API_BASE}/api/user/notifications/read-all`, {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });

          if (patchRes.ok) {
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            setCount(0);
          }
        } catch (e) {
          console.error("Error marking notifications as read:", e);
        }
      }
    }
  };

  const deleteNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const token = await getToken();
      if (!token) return;

      // Optimistic removal
      const wasUnread = notifications.find(n => n.id === id && !n.read);
      setNotifications(prev => prev.filter(n => n.id !== id));
      if (wasUnread) setCount(prev => Math.max(0, prev - 1));

      const res = await fetch(`${API_BASE}/api/user/notifications/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        // Revert on failure
        await fetchNotifications();
      }
    } catch (err) {
      console.error("Error deleting notification:", err);
      await fetchNotifications();
    }
  };

  return (
    <div className="relative">
      <NotiButton
        variant="ghost"
        size="icon"
        className="relative"
        onClick={handleClick}
        aria-label="Notifications"
      >
        <Bell size={16} strokeWidth={2} aria-hidden="true" />
        {count > 0 && (
          <Badge className="absolute -top-2 left-full min-w-5 -translate-x-1/2 px-1">
            {count > 99 ? "99+" : count}
          </Badge>
        )}
      </NotiButton>

      {isOpen && (
        <Card className="absolute right-0 mt-2 w-[90vw] max-w-md sm:w-96 z-50 shadow-lg">
          <div className="relative flex items-center justify-between px-4 py-0 border-b border-gray-100 mb-2 pb-2">
            <CardTitle className="text-sm font-medium px-3 flex items-center gap-2 mt-3">
              Notifications
            </CardTitle>
            <NotiButton
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              aria-label="Close notifications"
              className="px-4"
            >
              <X className="h-5 w-5 text-gray-600" />
            </NotiButton>
          </div>

          <CardContent className="p-0">
            <ScrollArea className="h-[30vh] pr-2">
              {notifications.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-4">
                  No notifications
                </p>
              ) : (
                notifications.slice(0, 5).map((notification) => {
                  const Icon = iconMap[notification.icon] || Info;
                  return (
                    <Card
                      key={notification.id}
                      className="mb-3 last:mb-0 border-0 bg-muted/20 p-2"
                    >
                      <CardContent className="pb-0">
                        <div className="flex items-start space-x-3">
                          <div
                            className={`${notification.color} p-1 rounded-full bg-opacity-10`}
                          >
                            <Icon className={`h-4 w-4 ${notification.color}`} />
                          </div>
                          <div className="flex-1 space-y-0.5">
                            <p className="text-sm font-medium leading-tight">
                              {notification.title}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {notification.message}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {notification.date}
                            </p>
                          </div>

                          <div className="flex flex-col items-end gap-2 shrink-0">
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full" title="Unread" />
                            )}
                            <button
                              onClick={(e) => deleteNotification(notification.id, e)}
                              className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded transition-colors"
                              title="Delete notification"
                              aria-label="Delete notification"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}