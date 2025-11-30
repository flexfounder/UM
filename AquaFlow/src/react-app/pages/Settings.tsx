import { useState, useEffect } from "react";
import { Session } from "@/shared/types";
import { ArrowLeft, Database, Trash2, AlertCircle, CheckCircle } from "lucide-react";

interface SettingsPageProps {
  session: Session;
  onBack: () => void;
}

interface SyncHistory {
  id: number;
  syncType: string;
  recordsSynced: number;
  isSuccess: boolean;
  errorMessage: string | null;
  createdAt: string;
}

export default function SettingsPage({ session, onBack }: SettingsPageProps) {
  const [syncHistory, setSyncHistory] = useState<SyncHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [clearingData, setClearingData] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchSyncHistory();
  }, []);

  const fetchSyncHistory = async () => {
    try {
      const response = await fetch("/api/sync/history");
      if (response.ok) {
        const data = await response.json();
        setSyncHistory(data);
      }
    } catch (error) {
      console.error("Failed to fetch sync history:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearData = async () => {
    if (!confirm("Are you sure you want to clear all local data? This action cannot be undone.")) {
      return;
    }

    setClearingData(true);
    setMessage("");

    try {
      const response = await fetch("/api/data/clear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: session.userId }),
      });

      if (response.ok) {
        setMessage("Local data cleared successfully");
        fetchSyncHistory();
      } else {
        setMessage("Failed to clear data");
      }
    } catch (error) {
      setMessage("Error clearing data");
    } finally {
      setClearingData(false);
      setTimeout(() => setMessage(""), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-slate-50 to-gray-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Dashboard</span>
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
          <p className="text-gray-600">Manage your app configuration</p>
        </div>

        {message && (
          <div className={`mb-6 px-4 py-3 rounded-lg text-sm font-medium ${
            message.includes("success")
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}>
            {message}
          </div>
        )}

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Database className="w-5 h-5" />
              Data Management
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Clear all locally stored data including tasks, meter readings, and incidents.
            </p>
            <button
              onClick={handleClearData}
              disabled={clearingData}
              className="bg-red-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-red-600 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Trash2 className="w-5 h-5" />
              {clearingData ? "Clearing..." : "Clear Local Data"}
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Sync History</h2>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin w-6 h-6 border-4 border-gray-500 border-t-transparent rounded-full"></div>
              </div>
            ) : syncHistory.length === 0 ? (
              <p className="text-gray-500 text-sm">No sync history available</p>
            ) : (
              <div className="space-y-3">
                {syncHistory.slice(0, 10).map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-start justify-between p-3 rounded-lg border border-gray-100 hover:border-gray-200 transition-all"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {entry.isSuccess ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-red-500" />
                        )}
                        <span className="font-medium text-gray-900">
                          {entry.syncType.replace(/_/g, " ")}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">
                        {entry.recordsSynced} records • {new Date(entry.createdAt).toLocaleString()}
                      </p>
                      {entry.errorMessage && (
                        <p className="text-xs text-red-600 mt-1">{entry.errorMessage}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">User Information</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Username:</span>
                <span className="font-medium text-gray-900">{session.username}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Employee Name:</span>
                <span className="font-medium text-gray-900">{session.employeeName}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">User ID:</span>
                <span className="font-medium text-gray-900">{session.userId}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-600">Role ID:</span>
                <span className="font-medium text-gray-900">{session.userRoleId}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
