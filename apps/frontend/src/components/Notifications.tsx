import { useEffect, useState, useRef } from "react";
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

export function Notifications() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [count, setCount] = useState(0);
  const [wsState, setWsState] = useState<number>(WebSocket.CONNECTING);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const API_BASE = import.meta.env.VITE_API_URL;

  // Get user ID and establish WebSocket connection
  useEffect(() => {
    const getUserAndConnect = async () => {
      try {
        // Fetch user info to get user ID
        const userRes = await fetch(`${API_BASE}/api/user`, {
          credentials: "include",
        });

        if (userRes.ok) {
          const userData = await userRes.json();
          connectWebSocket(userData.id);
        } else {
          console.error("Failed to fetch user data");
          // Fallback to HTTP polling if auth fails
          fetchNotifications();
        }
      } catch (error) {
        console.error("Error getting user  data:", error);
        // Fallback to HTTP polling
        fetchNotifications();
      }
    };

    getUserAndConnect();

    // Cleanup on unmount
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  const connectWebSocket = (userIdParam: string) => {
    try {
      const wsUrl = import.meta.env.VITE_WS_URL || API_BASE.replace(/^http/, 'ws').replace(/3000/, '3001');
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      // Keep track of ping/pong for connection health
      let pingInterval: NodeJS.Timeout | null = null;
      let pongTimeout: NodeJS.Timeout | null = null;

      const startPingInterval = () => {
        pingInterval = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send('ping');
            
            // Set timeout for pong response
            pongTimeout = setTimeout(() => {
              ws.close();
            }, 5000);
          }
        }, 30000); // Ping every 30 seconds
      };

      ws.onopen = () => {
        setWsState(WebSocket.OPEN);
        // Register user for notifications
        ws.send(`register:${userIdParam}`);
        // Start ping/pong mechanism
        startPingInterval();
      };

      ws.onmessage = (event) => {
        try {
          const data = event.data;
          
          // Handle pong response
          if (data === 'pong') {
            if (pongTimeout) {
              clearTimeout(pongTimeout);
              pongTimeout = null;
            }
            return;
          }

          // Handle ping from server
          if (data === 'ping') {
            ws.send('pong');
            return;
          }

          // Handle JSON messages
          const parsedData = JSON.parse(data);
          
          if (parsedData.type === 'initial_notifications' || parsedData.type === 'notification_update') {
            setNotifications(parsedData.notifications);
            setCount(parsedData.unreadCount);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = () => {
        setWsState(WebSocket.CLOSED);
        
        // Clean up intervals and timeouts
        if (pingInterval) {
          clearInterval(pingInterval);
          pingInterval = null;
        }
        if (pongTimeout) {
          clearTimeout(pongTimeout);
          pongTimeout = null;
        }
        
        // Attempt to reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          connectWebSocket(userIdParam);
        }, 3000);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        
        // Clean up intervals and timeouts on error
        if (pingInterval) {
          clearInterval(pingInterval);
          pingInterval = null;
        }
        if (pongTimeout) {
          clearTimeout(pongTimeout);
          pongTimeout = null;
        }
      };

    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      // Fallback to HTTP polling
      fetchNotifications();
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/user/notifications`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch notifications");
      const data = await res.json();

      if (!data.notifications) throw new Error("Invalid response structure");

      setNotifications(data.notifications);
      setCount(data.notifications.filter((n: Notification) => !n.read).length);
    } catch (e) {
      console.error("Error fetching notifications:", e);
    }
  };

  const handleClick = async () => {
    const newIsOpen = !isOpen;
    setIsOpen(newIsOpen);

    if (newIsOpen && count > 0) {
      try {
        // Mark all as read
        const patchRes = await fetch(`${API_BASE}/api/user/notifications/read-all`, {
            method: "PATCH",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
          }
        );
        
        if (!patchRes.ok) throw new Error("Failed to mark notifications as read");
        
        // Update local state immediately for better UX
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setCount(0);
        
        // If WebSocket is not connected, manually update the state
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {          
          // Also refetch to ensure consistency
          const res = await fetch(`${API_BASE}/api/user/notifications`, {
            method: "GET",
            credentials: "include",
          });
          const data = await res.json();

          if (data.notifications) {
            setNotifications(data.notifications);
            setCount(0);
          }
        }
        // If WebSocket is connected, the update will come via WebSocket message

      } catch (e) {
        console.error("Error updating notifications:", e);
      }
    }
  };

  const deleteNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // prevent clicking through to the notification itself (if it becomes clickable later)
    try {
      // Optimistically update UI
      setNotifications(prev => prev.filter(n => n.id !== id));
      
      const res = await fetch(`${API_BASE}/api/user/notifications/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      
      if (!res.ok) {
        throw new Error("Failed to delete notification");
      }
    } catch (err) {
      console.error("Error deleting notification:", err);
      // Revert optimism if needed (complex, so relying on WS update to fix it eventually is fine)
      fetchNotifications();
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
          <Badge className="absolute -top-2 left-full min-w-5 -translate-x-1/2 px-1 bg-red-500 text-white font-bold border-none hover:bg-red-600">
            {count > 99 ? "99+" : count}
          </Badge>
        )}
      </NotiButton>

      {isOpen && (
        <Card className="absolute right-0 mt-2 w-[90vw] max-w-md sm:w-96 z-50 shadow-lg bg-surface-container-lowest border border-outline-variant/30">
          <div className="relative flex items-center justify-between px-4 py-0 border-b border-gray-100 mb-2 pb-2">
            <CardTitle className="text-sm font-medium px-3 flex items-center gap-2 mt-3">
              Notifications
              <span 
                className={`inline-block w-2 h-2 rounded-full ${
                  wsState === WebSocket.OPEN ? 'bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]' : 
                  wsState === WebSocket.CONNECTING ? 'bg-amber-400 animate-pulse' : 
                  'bg-red-500'
                }`} 
                title={
                  wsState === WebSocket.OPEN ? 'Live updates connected' : 
                  wsState === WebSocket.CONNECTING ? 'Connecting...' : 
                  'Disconnected - using HTTP polling'
                } 
              />
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