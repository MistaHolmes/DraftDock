import { useEffect, useState } from "react"
import {
  Bell,
  X,
  Info,
  AlertTriangle,
  CreditCard,
  TrendingUp,
  Gift,
} from "lucide-react"
import { NotiButton } from "@/components/ui/notiButton"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scrollarea"

interface Notification {
  id: number
  title: string
  message: string
  date: string
  icon: string
  color: string
}

const iconMap: Record<string, React.ElementType> = {
  Info,
  AlertTriangle,
  CreditCard,
  TrendingUp,
  Gift,
}

export function Notifications() {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [count, setCount] = useState(0)

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await fetch("http://localhost:3000/api/user/notifications", {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        })

        if (response.ok) {
          const data = await response.json()
          setNotifications(data.notifications || [])
          setCount(data.notifications?.length || 0)
        } else {
          console.error("Failed to fetch notifications")
        }
      } catch (error) {
        console.error("Error fetching notifications:", error)
      }
    }

    fetchNotifications()
  }, [])

  const handleClick = () => {
    setIsOpen(!isOpen)
    if (!isOpen) {
      setCount(0)
    }
  }

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
          <div className="relative">
            <CardHeader>
              <CardTitle className="text-sm font-medium py-3 px-2">Notifications</CardTitle>
            </CardHeader>
            <NotiButton
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              aria-label="Close notifications"
              className="absolute right-4 top-0"
            >
              <X className="h-4 w-4" />
            </NotiButton>
          </div>

          <CardContent>
            <ScrollArea className="h-[30vh] pr-4">
              {notifications.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">No notifications</p>
              ) : (
                notifications.map((notification) => {
                  const Icon = iconMap[notification.icon] || Info
                  return (
                    <Card
                      key={notification.id}
                      className="mb-4 last:mb-0 border shadow-sm"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start space-x-4">
                          <div className={`${notification.color} p-2 rounded-full bg-opacity-10`}>
                            <Icon className={`h-5 w-5 ${notification.color}`} />
                          </div>
                          <div className="flex-1 space-y-1">
                            <p className="text-sm font-medium leading-none">
                              {notification.title}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {notification.message}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {notification.date}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
