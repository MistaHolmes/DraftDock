import { useEffect, useState } from "react"

interface Notification {
  id: string
  message: string
  read: boolean
  createdAt: string
}

export function NotificationTest() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()
        setNotifications(data.notifications || [])
      } catch (err: any) {
        console.error("Failed to fetch notifications:", err)
        setError(err.message || "Unexpected error")
      } finally {
        setLoading(false)
      }
    }

    fetchNotifications()
  }, [])

  if (loading) return <div>Loading notifications...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold mb-2">Notifications</h2>
      {notifications.length === 0 ? (
        <p>No notifications found.</p>
      ) : (
        <ul className="space-y-2">
          {notifications.map((notif) => (
            <li key={notif.id} className="p-2 border rounded-md shadow-sm">
              <p className="font-medium">{notif.message}</p>
              <p className="text-sm text-gray-500">{new Date(notif.createdAt).toLocaleString()}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
