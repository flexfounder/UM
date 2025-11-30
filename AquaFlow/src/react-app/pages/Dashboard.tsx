import { Session } from "@/shared/types";
import { RefreshCw, ClipboardList, Upload, AlertTriangle, Gauge, Users, Settings, LogOut, User } from "lucide-react";
import DashboardCard from "@/react-app/components/DashboardCard";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router";

interface DashboardPageProps {
  session: Session;
  onLogout: () => void;
}

export default function DashboardPage({ session, onLogout }: DashboardPageProps) {
  const navigate = useNavigate();
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState("");
  const [stats, setStats] = useState({
    pendingTasks: 0,
    completedToday: 0,
    lastSync: null as string | null,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch(`/api/dashboard/stats?userId=${session.userId}`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setSyncMessage("");

    try {
      const response = await fetch("/api/sync/all", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          userId: session.userId,
          token: session.trongateToken
        }),
      });

      if (!response.ok) {
        throw new Error("Sync failed");
      }

      setSyncMessage("Data synced successfully");
      fetchStats();
    } catch (error) {
      setSyncMessage("Sync failed. Please try again.");
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncMessage(""), 3000);
    }
  };

  const modules = [
    {
      id: "sync",
      title: "Sync",
      description: "Update local data",
      icon: RefreshCw,
      color: "from-blue-500 to-blue-600",
      onClick: handleSync,
    },
    {
      id: "view-tasks",
      title: "View Tasks",
      description: "Browse assigned tasks",
      icon: ClipboardList,
      color: "from-purple-500 to-purple-600",
      onClick: () => navigate("/tasks"),
    },
    {
      id: "upload-tasks",
      title: "Upload Tasks",
      description: "Submit completed work",
      icon: Upload,
      color: "from-green-500 to-green-600",
      onClick: () => navigate("/upload-tasks"),
    },
    {
      id: "report-incident",
      title: "Report Incident",
      description: "Log field issues",
      icon: AlertTriangle,
      color: "from-red-500 to-red-600",
      onClick: () => navigate("/report-incident"),
    },
    {
      id: "read-meter",
      title: "Read Meter",
      description: "Record meter readings",
      icon: Gauge,
      color: "from-cyan-500 to-cyan-600",
      onClick: () => navigate("/meter-reading"),
    },
    {
      id: "customer",
      title: "Customer",
      description: "Search accounts",
      icon: Users,
      color: "from-indigo-500 to-indigo-600",
      onClick: () => navigate("/customer-search"),
    },
    {
      id: "settings",
      title: "Settings",
      description: "App configuration",
      icon: Settings,
      color: "from-gray-500 to-gray-600",
      onClick: () => navigate("/settings"),
    },
    {
      id: "logout",
      title: "Logout",
      description: "Sign out",
      icon: LogOut,
      color: "from-orange-500 to-orange-600",
      onClick: onLogout,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-cyan-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
              <p className="text-gray-600">Welcome back, {session.employeeName}</p>
            </div>
            <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{session.username}</p>
                <p className="text-xs text-gray-500">ID: {session.userId}</p>
              </div>
            </div>
          </div>

          {syncMessage && (
            <div className={`px-4 py-3 rounded-lg text-sm font-medium ${
              syncMessage.includes("success") 
                ? "bg-green-50 text-green-700 border border-green-200" 
                : "bg-red-50 text-red-700 border border-red-200"
            }`}>
              {syncMessage}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {modules.map((module) => (
            <DashboardCard
              key={module.id}
              title={module.title}
              description={module.description}
              icon={module.icon}
              color={module.color}
              onClick={module.onClick}
              disabled={module.id === "sync" && syncing}
            />
          ))}
        </div>

        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-blue-50 border border-blue-100">
              <p className="text-sm font-medium text-blue-900 mb-1">Last Sync</p>
              <p className="text-xs text-blue-700">
                {stats.lastSync 
                  ? new Date(stats.lastSync).toLocaleString()
                  : "Not yet synced"}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-purple-50 border border-purple-100">
              <p className="text-sm font-medium text-purple-900 mb-1">Pending Tasks</p>
              <p className="text-xs text-purple-700">{stats.pendingTasks} tasks</p>
            </div>
            <div className="p-4 rounded-lg bg-green-50 border border-green-100">
              <p className="text-sm font-medium text-green-900 mb-1">Completed Today</p>
              <p className="text-xs text-green-700">{stats.completedToday} tasks</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
