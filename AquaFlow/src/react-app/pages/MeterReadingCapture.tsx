import { useState, useEffect } from "react";
import { Session, MeterReadingAccount, ReadingCase } from "@/shared/types";
import { ArrowLeft, Camera, Save, AlertTriangle } from "lucide-react";
import { useParams, useNavigate } from "react-router";

interface MeterReadingCapturePageProps {
  session: Session;
  onBack: () => void;
}

export default function MeterReadingCapturePage({ session, onBack }: MeterReadingCapturePageProps) {
  const { sheetId, accountId } = useParams();
  const navigate = useNavigate();
  const [account, setAccount] = useState<MeterReadingAccount | null>(null);
  const [readingCases, setReadingCases] = useState<ReadingCase[]>([]);
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [anomalyCases, setAnomalyCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [gpsStatus, setGpsStatus] = useState<"pending" | "captured" | "error">("pending");

  const [formData, setFormData] = useState({
    caseId: "",
    currentReading: "",
    meterNumber: "",
    anomalyId: "",
    anomalyCaseId: "",
    photoUrl: "",
    latitude: null as number | null,
    longitude: null as number | null,
    accuracy: null as number | null,
  });

  useEffect(() => {
    fetchData();
    captureGPS();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch account
      const accountsResponse = await fetch(
        `/api/meter-reading/accounts?userId=${session.userId}&sheetId=${sheetId}&token=${session.trongateToken}`
      );
      if (accountsResponse.ok) {
        const accounts = await accountsResponse.json();
        const foundAccount = accounts.find((a: any) => a.id === parseInt(accountId || "0"));
        if (foundAccount) {
          setAccount(foundAccount);
          setFormData((prev) => ({ ...prev, meterNumber: foundAccount.meterNo || "" }));
        }
      }

      // Fetch reading cases
      const casesResponse = await fetch("/api/reading-cases");
      if (casesResponse.ok) {
        const cases = await casesResponse.json();
        setReadingCases(cases);
      }

      // Fetch anomalies
      const anomaliesResponse = await fetch("/api/reading-anomalies");
      if (anomaliesResponse.ok) {
        const anomData = await anomaliesResponse.json();
        setAnomalies(anomData);
      }

      // Fetch anomaly cases
      const anomalyCasesResponse = await fetch("/api/reading-anomaly-cases");
      if (anomalyCasesResponse.ok) {
        const anomCaseData = await anomalyCasesResponse.json();
        setAnomalyCases(anomCaseData);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const captureGPS = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData((prev) => ({
            ...prev,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          }));
          setGpsStatus("captured");
        },
        (error) => {
          console.error("GPS error:", error);
          setGpsStatus("error");
        },
        { enableHighAccuracy: true }
      );
    } else {
      setGpsStatus("error");
    }
  };

  const handlePhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const formDataObj = new FormData();
      formDataObj.append("file", file);
      formDataObj.append("folder", `meter-readings/${sheetId}`);

      const response = await fetch("/api/upload/image", {
        method: "POST",
        body: formDataObj,
      });

      if (response.ok) {
        const data = await response.json();
        setFormData((prev) => ({ ...prev, photoUrl: data.url }));
        setMessage("Photo uploaded successfully");
        setTimeout(() => setMessage(""), 2000);
      }
    } catch (error) {
      console.error("Failed to upload photo:", error);
      setMessage("Failed to upload photo");
    }
  };

  const validateReading = () => {
    if (!formData.caseId) {
      setMessage("Please select a reading case");
      return false;
    }

    const selectedCase = readingCases.find((c) => c.id === parseInt(formData.caseId));
    
    if (selectedCase?.hasReading && !formData.currentReading) {
      setMessage("Current reading is required for this case");
      return false;
    }

    if (selectedCase?.hasImage && !formData.photoUrl) {
      setMessage("Photo is required for this case");
      return false;
    }

    if (formData.latitude === null || formData.longitude === null) {
      setMessage("GPS location is required");
      return false;
    }

    // Check for anomalies
    if (selectedCase?.hasReading && formData.currentReading && account && account.prevRead !== null) {
      const current = parseFloat(formData.currentReading);
      const previous = account.prevRead;

      if (current === previous) {
        if (!formData.anomalyCaseId) {
          setMessage("Reading matches previous - please select a reason");
          if (!formData.anomalyId) {
            const noChangeAnom = anomalies.find((a) => a.name === "No Change");
            if (noChangeAnom) {
              setFormData((prev) => ({ ...prev, anomalyId: noChangeAnom.id.toString() }));
            }
          }
          return false;
        }
      } else if (current < previous) {
        if (!formData.anomalyCaseId) {
          setMessage("Reading is less than previous - please select a reason");
          if (!formData.anomalyId) {
            const reverseAnom = anomalies.find((a) => a.name === "Meter Reverse");
            if (reverseAnom) {
              setFormData((prev) => ({ ...prev, anomalyId: reverseAnom.id.toString() }));
            }
          }
          return false;
        }
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateReading()) {
      setTimeout(() => setMessage(""), 3000);
      return;
    }

    setSubmitting(true);
    setMessage("");

    try {
      const response = await fetch("/api/meter-reading/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId: parseInt(accountId || "0"),
          sheetId: parseInt(sheetId || "0"),
          userId: session.userId,
          caseId: parseInt(formData.caseId),
          currentReading: formData.currentReading ? parseFloat(formData.currentReading) : null,
          meterNumber: formData.meterNumber || null,
          anomalyId: formData.anomalyId ? parseInt(formData.anomalyId) : null,
          anomalyCaseId: formData.anomalyCaseId ? parseInt(formData.anomalyCaseId) : null,
          photoUrl: formData.photoUrl || null,
          latitude: formData.latitude,
          longitude: formData.longitude,
          accuracy: formData.accuracy,
          readingDate: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        setMessage("Reading captured successfully");
        setTimeout(() => {
          navigate(`/meter-reading/${sheetId}`);
        }, 1500);
      } else {
        setMessage("Failed to save reading");
      }
    } catch (error) {
      setMessage("Error saving reading");
    } finally {
      setSubmitting(false);
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const selectedCase = readingCases.find((c) => c.id === parseInt(formData.caseId));
  const filteredAnomCases = anomalyCases.filter(
    (ac) => ac.caseId === parseInt(formData.anomalyId || "0")
  );

  if (loading || !account) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-cyan-50 to-blue-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-cyan-50 to-blue-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Accounts</span>
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Capture Meter Reading</h1>
          <p className="text-gray-600">{account.assocName}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-600">Account Number:</span>
              <span className="ml-2 font-medium text-gray-900">{account.accountNumber}</span>
            </div>
            <div>
              <span className="text-gray-600">Meter Number:</span>
              <span className="ml-2 font-medium text-gray-900">{account.meterNo || "N/A"}</span>
            </div>
            <div>
              <span className="text-gray-600">Phone:</span>
              <span className="ml-2 font-medium text-gray-900">{account.assocPhone || "N/A"}</span>
            </div>
            <div>
              <span className="text-gray-600">Location:</span>
              <span className="ml-2 font-medium text-gray-900">{account.location || "N/A"}</span>
            </div>
            {account.prevRead !== null && (
              <>
                <div>
                  <span className="text-gray-600">Last Reading:</span>
                  <span className="ml-2 font-medium text-gray-900">{account.prevRead}</span>
                </div>
                <div>
                  <span className="text-gray-600">Last Read Date:</span>
                  <span className="ml-2 font-medium text-gray-900">
                    {account.prevDate ? new Date(account.prevDate).toLocaleDateString() : "N/A"}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {message && (
          <div className={`mb-6 px-4 py-3 rounded-lg text-sm font-medium ${
            message.includes("success")
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-orange-50 text-orange-700 border border-orange-200"
          }`}>
            {message}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reading Case *
              </label>
              <select
                value={formData.caseId}
                onChange={(e) => setFormData({ ...formData, caseId: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all outline-none"
                required
                disabled={submitting}
              >
                <option value="">Select a case...</option>
                {readingCases.map((rCase) => (
                  <option key={rCase.id} value={rCase.id}>
                    {rCase.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedCase?.hasReading && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Reading *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.currentReading}
                  onChange={(e) => setFormData({ ...formData, currentReading: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all outline-none"
                  placeholder="Enter meter reading"
                  disabled={submitting}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Meter Number
              </label>
              <input
                type="text"
                value={formData.meterNumber}
                onChange={(e) => setFormData({ ...formData, meterNumber: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all outline-none"
                placeholder="Update if different from system"
                disabled={submitting}
              />
            </div>

            {formData.anomalyId && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Anomaly Reason *
                </label>
                <select
                  value={formData.anomalyCaseId}
                  onChange={(e) => setFormData({ ...formData, anomalyCaseId: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all outline-none"
                  required
                  disabled={submitting}
                >
                  <option value="">Select a reason...</option>
                  {filteredAnomCases.map((anomCase) => (
                    <option key={anomCase.id} value={anomCase.id}>
                      {anomCase.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {selectedCase?.hasImage && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meter Photo *
                </label>
                <div className="flex gap-3">
                  <label className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-all cursor-pointer flex items-center justify-center gap-2">
                    <Camera className="w-5 h-5" />
                    {formData.photoUrl ? "Photo Captured" : "Take Photo"}
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handlePhotoCapture}
                      className="hidden"
                      disabled={submitting}
                    />
                  </label>
                </div>
                {formData.photoUrl && (
                  <img
                    src={formData.photoUrl}
                    alt="Captured meter"
                    className="mt-3 rounded-lg border border-gray-200 max-h-48 object-cover"
                  />
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                GPS Location
                <div className={`w-3 h-3 rounded-full ${
                  gpsStatus === "captured" ? "bg-green-500" : gpsStatus === "error" ? "bg-red-500" : "bg-gray-400"
                }`}></div>
              </label>
              {gpsStatus === "captured" && formData.latitude && formData.longitude && (
                <div className="text-sm text-gray-600 bg-green-50 p-3 rounded-lg border border-green-100">
                  <div>Lat: {formData.latitude.toFixed(6)}</div>
                  <div>Lon: {formData.longitude.toFixed(6)}</div>
                  {formData.accuracy && <div>Accuracy: {formData.accuracy.toFixed(2)}m</div>}
                </div>
              )}
              {gpsStatus === "error" && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-100 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Failed to capture GPS location</span>
                </div>
              )}
              {gpsStatus === "pending" && (
                <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100">
                  Capturing GPS location...
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting || gpsStatus !== "captured"}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white py-3 rounded-lg font-medium hover:from-cyan-600 hover:to-blue-600 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Save className="w-5 h-5" />
              {submitting ? "Saving..." : "Save Reading"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
