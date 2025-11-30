import { useState, useEffect } from "react";
import { Session, IncidentType } from "@/shared/types";
import { ArrowLeft, Camera, Send } from "lucide-react";

interface ReportIncidentPageProps {
  session: Session;
  onBack: () => void;
}

export default function ReportIncidentPage({ session, onBack }: ReportIncidentPageProps) {
  const [incidentTypes, setIncidentTypes] = useState<IncidentType[]>([]);
  const [formData, setFormData] = useState({
    typeId: "",
    customerAccount: "",
    meterNumber: "",
    location: "",
    landmark: "",
    contactName: "",
    contactPhone: "",
    description: "",
    photoUrl: "",
    latitude: null as number | null,
    longitude: null as number | null,
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [gpsStatus, setGpsStatus] = useState<"pending" | "captured" | "error">("pending");

  useEffect(() => {
    fetchIncidentTypes();
    captureGPS();
  }, []);

  const fetchIncidentTypes = async () => {
    try {
      const response = await fetch("/api/incident-types");
      if (response.ok) {
        const data = await response.json();
        setIncidentTypes(data);
      }
    } catch (error) {
      console.error("Failed to fetch incident types:", error);
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
          }));
          setGpsStatus("captured");
        },
        (error) => {
          console.error("GPS error:", error);
          setGpsStatus("error");
        }
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
      formDataObj.append("folder", "incidents");

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage("");

    try {
      const selectedType = incidentTypes.find((t) => t.id === parseInt(formData.typeId));
      
      const response = await fetch("/api/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: session.userId,
          typeId: parseInt(formData.typeId),
          incidentType: selectedType?.name || "",
          title: selectedType?.name || "Incident Report",
          description: formData.description,
          severity: "medium",
          status: "reported",
          customerAccount: formData.customerAccount || null,
          meterNumber: formData.meterNumber || null,
          locationAddress: formData.location || null,
          landmark: formData.landmark || null,
          contactName: formData.contactName || null,
          contactPhone: formData.contactPhone || null,
          latitude: formData.latitude,
          longitude: formData.longitude,
          reportedDate: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        setMessage("Incident reported successfully");
        setFormData({
          typeId: "",
          customerAccount: "",
          meterNumber: "",
          location: "",
          landmark: "",
          contactName: "",
          contactPhone: "",
          description: "",
          photoUrl: "",
          latitude: formData.latitude,
          longitude: formData.longitude,
        });
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage("Failed to report incident");
      }
    } catch (error) {
      setMessage("Error reporting incident");
    } finally {
      setSubmitting(false);
      setTimeout(() => setMessage(""), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-red-50 to-orange-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Dashboard</span>
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Report Incident</h1>
          <p className="text-gray-600">Log field issues and emergencies</p>
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

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Incident Type *
              </label>
              <select
                value={formData.typeId}
                onChange={(e) => setFormData({ ...formData, typeId: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all outline-none"
                required
                disabled={submitting}
              >
                <option value="">Select incident type...</option>
                {incidentTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Customer Account (Optional)
              </label>
              <input
                type="text"
                value={formData.customerAccount}
                onChange={(e) => setFormData({ ...formData, customerAccount: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all outline-none"
                placeholder="Enter account number if applicable"
                disabled={submitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Meter Number (Optional)
              </label>
              <input
                type="text"
                value={formData.meterNumber}
                onChange={(e) => setFormData({ ...formData, meterNumber: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all outline-none"
                placeholder="Enter meter number if applicable"
                disabled={submitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Area / Location *
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all outline-none"
                placeholder="Enter location/area"
                required
                disabled={submitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Landmark *
              </label>
              <input
                type="text"
                value={formData.landmark}
                onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all outline-none"
                placeholder="Enter a nearby landmark"
                required
                disabled={submitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Name (Optional)
              </label>
              <input
                type="text"
                value={formData.contactName}
                onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all outline-none"
                placeholder="Contact person name"
                disabled={submitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Phone (Optional)
              </label>
              <input
                type="tel"
                value={formData.contactPhone}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all outline-none"
                placeholder="Contact phone number"
                disabled={submitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Incident Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all outline-none resize-none"
                rows={4}
                placeholder="Detailed description of the incident..."
                required
                disabled={submitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Photo (Optional)
              </label>
              <div className="flex gap-3">
                <label className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-all cursor-pointer flex items-center justify-center gap-2">
                  <Camera className="w-5 h-5" />
                  {formData.photoUrl ? "Photo Captured" : "Add Photo"}
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
                  alt="Incident"
                  className="mt-3 rounded-lg border border-gray-200 max-h-48 object-cover"
                />
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                GPS Location
                <div className={`w-3 h-3 rounded-full ${
                  gpsStatus === "captured" ? "bg-green-500" : gpsStatus === "error" ? "bg-orange-500" : "bg-gray-400"
                }`}></div>
              </label>
              {gpsStatus === "captured" && formData.latitude && formData.longitude && (
                <div className="text-sm text-gray-600 bg-green-50 p-3 rounded-lg border border-green-100">
                  <div>Lat: {formData.latitude.toFixed(6)}</div>
                  <div>Lon: {formData.longitude.toFixed(6)}</div>
                </div>
              )}
              {gpsStatus === "error" && (
                <div className="text-sm text-orange-600 bg-orange-50 p-3 rounded-lg border border-orange-100">
                  GPS location not available (optional)
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-gradient-to-r from-red-500 to-orange-500 text-white py-3 rounded-lg font-medium hover:from-red-600 hover:to-orange-600 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Send className="w-5 h-5" />
              {submitting ? "Submitting..." : "Submit Report"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
