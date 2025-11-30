import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router";
import { useEffect, useState } from "react";
import LoginPage from "@/react-app/pages/Login";
import DashboardPage from "@/react-app/pages/Dashboard";
import TasksPage from "@/react-app/pages/Tasks";
import MeterReadingPage from "@/react-app/pages/MeterReading";
import MeterReadingAccountsPage from "@/react-app/pages/MeterReadingAccounts";
import MeterReadingCapturePage from "@/react-app/pages/MeterReadingCapture";
import ReportIncidentPage from "@/react-app/pages/ReportIncident";
import CustomerSearchPage from "@/react-app/pages/CustomerSearch";
import SettingsPage from "@/react-app/pages/Settings";
import UploadTasksPage from "@/react-app/pages/UploadTasks";
import { Session } from "@/shared/types";

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedSession = localStorage.getItem("session");
    if (storedSession) {
      try {
        setSession(JSON.parse(storedSession));
      } catch (error) {
        console.error("Failed to parse session:", error);
        localStorage.removeItem("session");
      }
    }
    setLoading(false);
  }, []);

  const handleLogin = (newSession: Session) => {
    setSession(newSession);
    localStorage.setItem("session", JSON.stringify(newSession));
  };

  const handleLogout = () => {
    setSession(null);
    localStorage.removeItem("session");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            session ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <LoginPage onLogin={handleLogin} />
            )
          }
        />
        <Route
          path="/dashboard"
          element={
            session ? (
              <DashboardPage session={session} onLogout={handleLogout} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/tasks"
          element={
            session ? (
              <TasksPage session={session} onBack={() => window.history.back()} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/meter-reading"
          element={
            session ? (
              <MeterReadingPage session={session} onBack={() => window.history.back()} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/meter-reading/:sheetId"
          element={
            session ? (
              <MeterReadingAccountsPage session={session} onBack={() => window.history.back()} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/meter-reading/:sheetId/capture/:accountId"
          element={
            session ? (
              <MeterReadingCapturePage session={session} onBack={() => window.history.back()} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/report-incident"
          element={
            session ? (
              <ReportIncidentPage session={session} onBack={() => window.history.back()} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/customer-search"
          element={
            session ? (
              <CustomerSearchPage session={session} onBack={() => window.history.back()} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/settings"
          element={
            session ? (
              <SettingsPage session={session} onBack={() => window.history.back()} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/upload-tasks"
          element={
            session ? (
              <UploadTasksPage session={session} onBack={() => window.history.back()} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
      </Routes>
    </Router>
  );
}
