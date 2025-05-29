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
            const res = await fetch("http://localhost:3000/api/user/notifications", {
                credentials: "include",
            })
            if (!res.ok) throw new Error("Failed to fetch")
            const data = await res.json()
            setNotifications(data.notifications)
            setCount(data.notifications.filter((n: any) => !n.read).length)
            } catch (e) {
            console.error("Error fetching notifications", e)
            }
        }

        fetchNotifications()
    }, [])

    const handleClick = async () => {
        const newIsOpen = !isOpen
        setIsOpen(newIsOpen)
        if (newIsOpen) {
            try {
            await fetch("http://localhost:3000/api/user/notifications/read-all", {
                method: "PATCH",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
            })
            const res = await fetch("http://localhost:3000/api/user/notifications", {
                credentials: "include",
            })
            const data = await res.json()
            setNotifications(data.notifications)
            setCount(0)
            } catch (e) {
            console.error("Error marking notifications as read", e)
            }
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
                        className="mb-4 last:mb-0 border-0 bg-muted/20"
                    >
                        <CardContent className="pb-0">
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
