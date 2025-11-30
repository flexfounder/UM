import { useState, useEffect } from "react";
import { Session, Task } from "@/shared/types";
import { ArrowLeft, CheckCircle, Clock, AlertCircle, MapPin, Calendar } from "lucide-react";

interface TasksPageProps {
  session: Session;
  onBack: () => void;
}

export default function TasksPage({ session, onBack }: TasksPageProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await fetch(`/api/tasks?userId=${session.userId}`);
      if (response.ok) {
        const data = await response.json();
        setTasks(data);
      }
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTasks = tasks.filter((task) => {
    if (filter === "all") return true;
    return task.status === filter;
  });

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-50 text-green-700 border-green-200";
      case "in_progress":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "pending":
        return "bg-yellow-50 text-yellow-700 border-yellow-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return <CheckCircle className="w-4 h-4" />;
      case "in_progress":
        return <Clock className="w-4 h-4" />;
      case "pending":
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Dashboard</span>
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Tasks</h1>
          <p className="text-gray-600">Manage your assigned field tasks</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex gap-2 overflow-x-auto">
            {["all", "pending", "in_progress", "completed"].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all whitespace-nowrap ${
                  filter === status
                    ? "bg-purple-500 text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1).replace("_", " ")}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full"></div>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No tasks found</h3>
            <p className="text-gray-600">There are no tasks matching your filter.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTasks.map((task) => (
              <div
                key={task.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{task.title}</h3>
                      <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(task.status)}`}>
                        {getStatusIcon(task.status)}
                        {task.status.replace("_", " ")}
                      </span>
                    </div>
                    {task.description && (
                      <p className="text-gray-600 text-sm mb-3">{task.description}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {task.customerName && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <span className="font-medium">Customer:</span>
                      <span>{task.customerName}</span>
                    </div>
                  )}
                  {task.customerAccount && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <span className="font-medium">Account:</span>
                      <span>{task.customerAccount}</span>
                    </div>
                  )}
                  {task.locationAddress && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      <span>{task.locationAddress}</span>
                    </div>
                  )}
                  {task.dueDate && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="w-4 h-4 flex-shrink-0" />
                      <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
