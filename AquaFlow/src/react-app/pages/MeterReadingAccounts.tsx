import { useState, useEffect } from "react";
import { Session, MeterReadingAccount } from "@/shared/types";
import { ArrowLeft, Search, User, Phone, MapPin, Droplet } from "lucide-react";
import { useParams, useNavigate } from "react-router";

interface MeterReadingAccountsPageProps {
  session: Session;
  onBack: () => void;
}

export default function MeterReadingAccountsPage({ session, onBack }: MeterReadingAccountsPageProps) {
  const { sheetId } = useParams();
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<MeterReadingAccount[]>([]);
  const [filteredAccounts, setFilteredAccounts] = useState<MeterReadingAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "done">("all");
  const [completedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (sheetId) {
      fetchAccounts();
    }
  }, [sheetId]);

  useEffect(() => {
    applyFilters();
  }, [accounts, searchTerm, filter, completedIds]);

  const fetchAccounts = async () => {
    try {
      const response = await fetch(
        `/api/meter-reading/accounts?userId=${session.userId}&sheetId=${sheetId}&token=${session.trongateToken}`
      );
      if (response.ok) {
        const data = await response.json();
        setAccounts(data);
      }
    } catch (error) {
      console.error("Failed to fetch accounts:", error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...accounts];

    // Apply search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (acc) =>
          acc.accountNumber.toLowerCase().includes(term) ||
          acc.assocName.toLowerCase().includes(term) ||
          acc.meterNo?.toLowerCase().includes(term) ||
          acc.assocPhone?.toLowerCase().includes(term)
      );
    }

    // Apply status filter
    if (filter === "pending") {
      filtered = filtered.filter((acc) => !completedIds.has(acc.id));
    } else if (filter === "done") {
      filtered = filtered.filter((acc) => completedIds.has(acc.id));
    }

    setFilteredAccounts(filtered);
  };

  const handleAccountClick = (account: MeterReadingAccount) => {
    navigate(`/meter-reading/${sheetId}/capture/${account.id}`);
  };

  const pendingCount = accounts.filter((acc) => !completedIds.has(acc.id)).length;
  const doneCount = completedIds.size;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-cyan-50 to-blue-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Sheets</span>
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Meter Reading Accounts</h1>
          <p className="text-gray-600">Select an account to capture meter reading</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Search className="w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all outline-none"
              placeholder="Search by account, name, meter, or phone..."
            />
          </div>
          
          <div className="flex gap-2">
            {["all", "pending", "done"].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status as typeof filter)}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                  filter === status
                    ? "bg-cyan-500 text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {status === "all" && `All (${accounts.length})`}
                {status === "pending" && `Pending (${pendingCount})`}
                {status === "done" && `Done (${doneCount})`}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full"></div>
          </div>
        ) : filteredAccounts.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No accounts found</h3>
            <p className="text-gray-600">Try adjusting your search or filter.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAccounts.map((account) => {
              const isDone = completedIds.has(account.id);
              
              return (
                <div
                  key={account.id}
                  onClick={() => handleAccountClick(account)}
                  className={`bg-white rounded-xl shadow-sm border p-4 hover:shadow-lg transition-all cursor-pointer ${
                    isDone ? "border-green-200 bg-green-50" : "border-gray-100"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{account.assocName}</h3>
                        {isDone && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-500 text-white">
                            Read
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          <span className="font-medium">Account:</span>
                          <span>{account.accountNumber}</span>
                        </div>
                        {account.meterNo && (
                          <div className="flex items-center gap-2">
                            <Droplet className="w-4 h-4" />
                            <span className="font-medium">Meter:</span>
                            <span>{account.meterNo}</span>
                          </div>
                        )}
                        {account.assocPhone && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            <span>{account.assocPhone}</span>
                          </div>
                        )}
                        {account.location && (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">{account.location}</span>
                          </div>
                        )}
                      </div>
                      {account.prevRead !== null && (
                        <div className="mt-2 text-sm">
                          <span className="text-gray-600">Previous Reading: </span>
                          <span className="font-semibold text-gray-900">{account.prevRead}</span>
                          {account.prevDate && (
                            <span className="text-gray-500 ml-2">
                              ({new Date(account.prevDate).toLocaleDateString()})
                            </span>
                          )}
                        </div>
                      )}
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
