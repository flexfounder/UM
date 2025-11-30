import { useState, useEffect } from "react";
import { Session, MeterReadingSheet } from "@/shared/types";
import { ArrowLeft, Download, CheckCircle, Calendar, Users, FileText } from "lucide-react";
import { useNavigate } from "react-router";

interface MeterReadingPageProps {
  session: Session;
  onBack: () => void;
}

export default function MeterReadingPage({ session, onBack }: MeterReadingPageProps) {
  const navigate = useNavigate();
  const [sheets, setSheets] = useState<MeterReadingSheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchSheets();
  }, []);

  const fetchSheets = async () => {
    try {
      const response = await fetch(
        `/api/meter-reading/sheets?userId=${session.userId}&token=${session.trongateToken}`
      );
      if (response.ok) {
        const data = await response.json();
        setSheets(data);
      }
    } catch (error) {
      console.error("Failed to fetch sheets:", error);
      setMessage("Failed to load meter reading sheets");
    } finally {
      setLoading(false);
    }
  };

  const handleSheetClick = (sheet: MeterReadingSheet) => {
    const today = new Date();
    const dueDate = new Date(sheet.dateDue);
    
    if (dueDate < today || !sheet.isActive || sheet.isClosed) {
      setMessage("This sheet is no longer active or has expired");
      setTimeout(() => setMessage(""), 3000);
      return;
    }

    navigate(`/meter-reading/${sheet.id}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-cyan-50 to-blue-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Dashboard</span>
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Meter Reading Sheets</h1>
          <p className="text-gray-600">Select a sheet to begin reading meters</p>
        </div>

        {message && (
          <div className="mb-6 px-4 py-3 rounded-lg text-sm font-medium bg-orange-50 text-orange-700 border border-orange-200">
            {message}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full"></div>
          </div>
        ) : sheets.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No meter reading sheets</h3>
            <p className="text-gray-600">No sheets have been assigned to you yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sheets.map((sheet) => {
              const today = new Date();
              const dueDate = new Date(sheet.dateDue);
              const isExpired = dueDate < today;
              const isInactive = !sheet.isActive || sheet.isClosed;
              const disabled = isExpired || isInactive;
              const pendingCount = sheet.assigned - sheet.returned;

              return (
                <div
                  key={sheet.id}
                  onClick={() => !disabled && handleSheetClick(sheet)}
                  className={`bg-white rounded-xl shadow-sm border p-6 transition-all ${
                    disabled
                      ? "border-gray-200 opacity-60 cursor-not-allowed"
                      : "border-gray-100 hover:shadow-lg hover:border-cyan-200 cursor-pointer"
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-900">{sheet.sheet}</h3>
                        {sheet.isClosed && (
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                            Closed
                          </span>
                        )}
                        {isExpired && !sheet.isClosed && (
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                            Expired
                          </span>
                        )}
                        {!isExpired && sheet.isActive && !sheet.isClosed && (
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            Active
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                        <Calendar className="w-4 h-4" />
                        <span>Due: {new Date(sheet.dateDue).toLocaleDateString()}</span>
                      </div>
                    </div>
                    {!disabled && (
                      <Download className="w-6 h-6 text-cyan-500" />
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                      <div className="flex items-center gap-2 text-blue-700 mb-1">
                        <Users className="w-4 h-4" />
                        <span className="text-xs font-medium">Total</span>
                      </div>
                      <p className="text-2xl font-bold text-blue-900">{sheet.assigned}</p>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-3 border border-orange-100">
                      <div className="flex items-center gap-2 text-orange-700 mb-1">
                        <FileText className="w-4 h-4" />
                        <span className="text-xs font-medium">Pending</span>
                      </div>
                      <p className="text-2xl font-bold text-orange-900">{pendingCount}</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3 border border-green-100">
                      <div className="flex items-center gap-2 text-green-700 mb-1">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-xs font-medium">Done</span>
                      </div>
                      <p className="text-2xl font-bold text-green-900">{sheet.returned}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
