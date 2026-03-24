import { useEffect, useState } from "react";
import axios from "axios";

export function NotificationsTest() {
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const API_BASE = import.meta.env.VITE_API_URL;

  console.log("API_BASE:", API_BASE); 

useEffect(() => {
  fetchNotifications();
}, []);

const fetchNotifications = async () => {
  setLoading(true);
  setError(null);

  try {
    console.log("Fetching user info...");

    const userRes = await axios.get(`${API_BASE}/api/user`, {
      withCredentials: true,
    });

    console.log("User response status:", userRes.status);
    console.log("User data:", userRes.data);

    console.log("Fetching notifications...");

    const notifRes = await axios.get(`${API_BASE}/api/user/notifications`, {
      withCredentials: true,
    });

    console.log("Notifications response status:", notifRes.status);
    console.log("Notifications data:", notifRes.data);

    setNotifications(notifRes.data.notifications || []);

  } catch (err: any) {
    console.error("Error:", err);
    setError(err?.response?.data?.message || err.message || "Unknown error");
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="p-4 border rounded">
      <h3>Notifications Test</h3>
      <p>API Base: {API_BASE}</p>
      
      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}
      
      <button 
        onClick={fetchNotifications}
        className="px-4 py-2 bg-blue-500 text-white rounded mt-2"
      >
        Refresh Notifications
      </button>
      
      <div className="mt-4">
        <h4>Notifications ({notifications.length}):</h4>
        <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
          {JSON.stringify(notifications, null, 2)}
        </pre>
      </div>
    </div>
  );
}