import { useState } from "react";
import { Session, Customer } from "@/shared/types";
import { ArrowLeft, Search, User, Phone, Mail, MapPin, Droplet } from "lucide-react";

interface CustomerSearchPageProps {
  session: Session;
  onBack: () => void;
}

export default function CustomerSearchPage({ onBack }: CustomerSearchPageProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchType, setSearchType] = useState<"account" | "name" | "meter">("account");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    setLoading(true);
    setSearched(true);

    try {
      const response = await fetch(
        `/api/customers/search?type=${searchType}&term=${encodeURIComponent(searchTerm)}`
      );
      if (response.ok) {
        const data = await response.json();
        setCustomers(data);
      }
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-indigo-50 to-purple-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Dashboard</span>
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Customer Search</h1>
          <p className="text-gray-600">Find customer account information</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex gap-3">
              {[
                { value: "account", label: "Account Number" },
                { value: "name", label: "Customer Name" },
                { value: "meter", label: "Meter Number" },
              ].map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setSearchType(type.value as typeof searchType)}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                    searchType === type.value
                      ? "bg-indigo-500 text-white shadow-md"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                placeholder={`Search by ${searchType === "account" ? "account number" : searchType === "name" ? "customer name" : "meter number"}...`}
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !searchTerm.trim()}
                className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-6 py-3 rounded-lg font-medium hover:from-indigo-600 hover:to-purple-600 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Search className="w-5 h-5" />
                {loading ? "Searching..." : "Search"}
              </button>
            </div>
          </form>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
          </div>
        ) : searched && customers.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No customers found</h3>
            <p className="text-gray-600">Try searching with different terms.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {customers.map((customer) => (
              <div
                key={customer.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{customer.name}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Account:</span>
                        <span>{customer.accountNumber}</span>
                      </div>
                      {customer.meterNumber && (
                        <div className="flex items-center gap-2">
                          <Droplet className="w-4 h-4" />
                          <span>{customer.meterNumber}</span>
                        </div>
                      )}
                      {customer.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          <span>{customer.phone}</span>
                        </div>
                      )}
                      {customer.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          <span>{customer.email}</span>
                        </div>
                      )}
                      {customer.address && (
                        <div className="flex items-center gap-2 md:col-span-2">
                          <MapPin className="w-4 h-4 flex-shrink-0" />
                          <span>{customer.address}</span>
                        </div>
                      )}
                    </div>
                    {customer.connectionStatus && (
                      <div className="mt-3">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                          customer.connectionStatus === "active"
                            ? "bg-green-50 text-green-700 border border-green-200"
                            : "bg-gray-50 text-gray-700 border border-gray-200"
                        }`}>
                          {customer.connectionStatus}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
