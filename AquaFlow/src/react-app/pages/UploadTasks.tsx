import { useState, useEffect } from "react";
import { Session, Task } from "@/shared/types";
import { ArrowLeft, Upload, CheckCircle } from "lucide-react";

interface UploadTasksPageProps {
  session: Session;
  onBack: () => void;
}

export default function UploadTasksPage({ session, onBack }: UploadTasksPageProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTasks, setSelectedTasks] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchCompletedTasks();
  }, []);

  const fetchCompletedTasks = async () => {
    try {
      const response = await fetch(`/api/tasks?userId=${session.userId}&status=completed`);
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

  const handleToggleTask = (taskId: number) => {
    const newSelected = new Set(selectedTasks);
    if (newSelected.has(taskId)) {
      newSelected.delete(taskId);
    } else {
      newSelected.add(taskId);
    }
    setSelectedTasks(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedTasks.size === tasks.length) {
      setSelectedTasks(new Set());
    } else {
      setSelectedTasks(new Set(tasks.map(t => t.id)));
    }
  };

  const handleUpload = async () => {
    if (selectedTasks.size === 0) return;

    setUploading(true);
    setMessage("");

    try {
      const response = await fetch("/api/tasks/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskIds: Array.from(selectedTasks),
          userId: session.userId,
        }),
      });

      if (response.ok) {
        setMessage(`Successfully uploaded ${selectedTasks.size} task(s)`);
        setSelectedTasks(new Set());
        fetchCompletedTasks();
      } else {
        setMessage("Failed to upload tasks");
      }
    } catch (error) {
      setMessage("Error uploading tasks");
    } finally {
      setUploading(false);
      setTimeout(() => setMessage(""), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50 to-emerald-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Dashboard</span>
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Upload Tasks</h1>
          <p className="text-gray-600">Submit completed tasks to the server</p>
        </div>

        {message && (
          <div className={`mb-6 px-4 py-3 rounded-lg text-sm font-medium ${
            message.includes("Success")
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}>
            {message}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full"></div>
          </div>
        ) : tasks.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No completed tasks</h3>
            <p className="text-gray-600">Complete some tasks to upload them to the server.</p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button
                    onClick={handleSelectAll}
                    className="text-sm font-medium text-green-600 hover:text-green-700 transition-colors"
                  >
                    {selectedTasks.size === tasks.length ? "Deselect All" : "Select All"}
                  </button>
                  <span className="text-sm text-gray-600">
                    {selectedTasks.size} of {tasks.length} selected
                  </span>
                </div>
                <button
                  onClick={handleUpload}
                  disabled={selectedTasks.size === 0 || uploading}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-2 rounded-lg font-medium hover:from-green-600 hover:to-emerald-600 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Upload className="w-5 h-5" />
                  {uploading ? "Uploading..." : "Upload Selected"}
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => handleToggleTask(task.id)}
                  className={`bg-white rounded-xl shadow-sm border-2 p-6 cursor-pointer transition-all ${
                    selectedTasks.has(task.id)
                      ? "border-green-500 shadow-lg"
                      : "border-gray-100 hover:border-gray-200 hover:shadow-md"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0 mt-1 transition-all ${
                      selectedTasks.has(task.id)
                        ? "bg-green-500 border-green-500"
                        : "border-gray-300"
                    }`}>
                      {selectedTasks.has(task.id) && (
                        <CheckCircle className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{task.title}</h3>
                      {task.description && (
                        <p className="text-gray-600 text-sm mb-3">{task.description}</p>
                      )}
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                        {task.customerName && (
                          <span>Customer: {task.customerName}</span>
                        )}
                        {task.completedDate && (
                          <span>Completed: {new Date(task.completedDate).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
